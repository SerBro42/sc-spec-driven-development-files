import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';

import { createApp } from './app';
import {
  createBooking,
  getBooking,
  initializeDatabase,
  listAgents,
  listBookings,
  listTherapies,
  listTherapiesForAilment,
  openDatabase,
} from './database';

describe('AgentClinic MVP workflow', () => {
  let database: DatabaseSync;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    database = openDatabase(':memory:');
    app = createApp(database);
  });

  afterEach(() => {
    database.close();
  });

  it('seeds an idempotent therapy catalog linked to supported ailments', () => {
    expect(listTherapies(database)).toHaveLength(3);
    expect(
      database
        .prepare('SELECT version FROM schema_migrations ORDER BY version')
        .all()
        .map((row) => row.version),
    ).toEqual([1, 2, 3, 4, 5]);

    const firstCount = listTherapies(database).length;
    initializeDatabase(database);
    expect(listTherapies(database)).toHaveLength(firstCount);
    expect(
      database
        .prepare('SELECT COUNT(*) AS count FROM ailment_therapies')
        .get()?.count,
    ).toBe(3);
    expect(
      database
        .prepare('SELECT COUNT(*) AS count FROM bookings')
        .get()?.count,
    ).toBe(0);

    const contextAilmentId = database
      .prepare("SELECT id FROM ailments WHERE name = 'context-window claustrophobia'")
      .get()?.id;
    expect(typeof contextAilmentId).toBe('number');
    expect(listTherapiesForAilment(database, Number(contextAilmentId))).toHaveLength(1);
  });

  it('shows the catalog and linked ailments in the server-rendered view', async () => {
    const response = await app.request('http://localhost/therapies');

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('Therapy catalog');
    expect(html).toContain('Context window reset');
    expect(html).toContain('Prompt pacing session');
    expect(html).toContain('href="/ailments/1"');
  });

  it('renders a valid browser pattern for ISO-8601 appointment input', async () => {
    const response = await app.request('http://localhost/bookings/new');
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(
      'pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]+)?',
    );
  });

  it('completes booking creation, listing, status updates, and dashboard display', async () => {
    const [agent] = listAgents(database);
    const [therapy] = listTherapies(database);
    const createResponse = await app.request('http://localhost/bookings', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        agentId: String(agent.id),
        therapyId: String(therapy.id),
        appointmentTime: '2030-04-05T09:30:00-04:00',
      }),
    });

    expect(createResponse.status).toBe(303);
    expect(createResponse.headers.get('location')).toBe('/bookings#booking-1');
    expect(getBooking(database, 1)).toMatchObject({
      agentId: agent.id,
      therapyId: therapy.id,
      appointmentTime: '2030-04-05T13:30:00.000Z',
      status: 'scheduled',
    });

    const listResponse = await app.request('http://localhost/bookings');
    const listHtml = await listResponse.text();
    expect(listResponse.status).toBe(200);
    expect(listHtml).toContain(therapy.name);
    expect(listHtml).toContain(agent.name);
    expect(listHtml).toContain('2030-04-05T13:30:00.000Z');

    const dashboardResponse = await app.request('http://localhost/dashboard');
    const dashboardHtml = await dashboardResponse.text();
    expect(dashboardResponse.status).toBe(200);
    expect(dashboardHtml).toMatch(/Agents<\/p><strong>3<\/strong>/);
    expect(dashboardHtml).toMatch(/Open appointments<\/p><strong>1<\/strong>/);
    expect(dashboardHtml).toMatch(/Ailments in-flight<\/p><strong>2<\/strong>/);
    expect(dashboardHtml).toContain('<caption>Clinic agents and their linked ailments</caption>');
    expect(dashboardHtml).toContain('<caption>Ailments in the clinic caseload</caption>');
    expect(dashboardHtml).toContain('<caption>Available therapies and their supported ailments</caption>');
    expect(dashboardHtml).toContain('<caption>Scheduled, completed, and cancelled appointments</caption>');
    expect(dashboardHtml).toContain('Context window reset');
    expect(dashboardHtml).toContain('2030-04-05T13:30:00.000Z');
    expect(dashboardHtml).toContain('dashboard-booking-status-1');
    const agentsPage = await app.request('http://localhost/agents');
    expect(await agentsPage.text()).not.toContain('Open appointments');

    for (const status of ['completed', 'cancelled', 'scheduled']) {
      const updateResponse = await app.request('http://localhost/bookings/1/status', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ status }),
      });
      expect(updateResponse.status).toBe(303);
      expect(getBooking(database, 1)?.status).toBe(status);
    }

    const agentDetailResponse = await app.request(`http://localhost/agents/${agent.id}`);
    const agentDetailHtml = await agentDetailResponse.text();
    expect(agentDetailResponse.status).toBe(200);
    expect(agentDetailHtml).toContain('Related therapies');
    expect(agentDetailHtml).toContain(therapy.name);
    expect(agentDetailHtml).toContain('Appointments');
    expect(agentDetailHtml).toContain('2030-04-05T13:30:00.000Z');
  });

  it('serves dashboard summary counts and handles empty agent bookings and unknown agents', async () => {
    const response = await app.request('http://localhost/dashboard');
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('AgentClinic dashboard');
    expect(html).toMatch(/Agents<\/p><strong>3<\/strong>/);
    expect(html).toMatch(/Open appointments<\/p><strong>0<\/strong>/);
    expect(html).toMatch(/Ailments in-flight<\/p><strong>2<\/strong>/);
    expect(html).toContain('href="/agents/1"');
    expect(html).toContain('href="/ailments/1"');
    expect(html).toContain('href="/therapies#therapy-1"');
    const agentDetail = await app.request('http://localhost/agents/1');
    expect(await agentDetail.text()).toContain('No appointments are booked for this agent yet.');

    const unknownAgent = await app.request('http://localhost/agents/9999');
    expect(unknownAgent.status).toBe(404);
    expect(await unknownAgent.text()).toContain('This agent does not exist');
  });

  it('renders useful empty states for the agent, therapy, and booking lists', async () => {
    database.exec(`
      DELETE FROM bookings;
      DELETE FROM ailment_therapies;
      DELETE FROM agent_ailments;
      DELETE FROM therapies;
      DELETE FROM ailments;
      DELETE FROM agents;
    `);

    const [agents, therapies, bookings] = await Promise.all([
      app.request('http://localhost/dashboard'),
      app.request('http://localhost/therapies'),
      app.request('http://localhost/bookings'),
    ]);
    expect(await agents.text()).toContain('No agents are available.');
    expect(await therapies.text()).toContain('No therapies are available yet.');
    expect(await bookings.text()).toContain('No appointments have been booked yet.');
  });

  it('logs database failures and returns a clear server error page', async () => {
    const unavailableDatabase = openDatabase(':memory:');
    const unavailableApp = createApp(unavailableDatabase);
    unavailableDatabase.close();
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      const response = await unavailableApp.request('http://localhost/therapies');
      expect(response.status).toBe(500);
      expect(await response.text()).toContain('The clinic could not complete your request.');
      expect(errorLog).toHaveBeenCalledOnce();
    } finally {
      errorLog.mockRestore();
    }
  });

  it('rejects invalid booking data and unknown references without inserting a booking', async () => {
    const [agent] = listAgents(database);
    const [therapy] = listTherapies(database);
    const submit = (fields: Record<string, string>) =>
      app.request('http://localhost/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(fields),
      });

    const invalidTime = await submit({
      agentId: String(agent.id),
      therapyId: String(therapy.id),
      appointmentTime: '2030-02-30T09:30:00Z',
    });
    expect(invalidTime.status).toBe(400);
    expect(await invalidTime.text()).toContain('valid ISO-8601');

    const invalidIds = await submit({
      agentId: 'not-an-id',
      therapyId: String(therapy.id),
      appointmentTime: '2030-04-05T09:30:00Z',
    });
    expect(invalidIds.status).toBe(400);
    expect(await invalidIds.text()).toContain('Choose an existing agent and therapy');

    const unknownAgent = await submit({
      agentId: '9999',
      therapyId: String(therapy.id),
      appointmentTime: '2030-04-05T09:30:00Z',
    });
    expect(unknownAgent.status).toBe(404);
    expect(await unknownAgent.text()).toContain('selected agent does not exist');

    const unknownTherapy = await submit({
      agentId: String(agent.id),
      therapyId: '9999',
      appointmentTime: '2030-04-05T09:30:00Z',
    });
    expect(unknownTherapy.status).toBe(404);
    expect(await unknownTherapy.text()).toContain('selected therapy does not exist');

    const invalidStatus = await app.request('http://localhost/bookings/1/status', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ status: 'pending' }),
    });
    expect(invalidStatus.status).toBe(404);

    const validCreate = await app.request('http://localhost/bookings', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        agentId: String(agent.id),
        therapyId: String(therapy.id),
        appointmentTime: '2030-04-05T09:30:00Z',
      }),
    });
    expect(validCreate.status).toBe(303);

    const invalidExistingStatus = await app.request('http://localhost/bookings/1/status', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ status: 'pending' }),
    });
    expect(invalidExistingStatus.status).toBe(400);
    expect(await invalidExistingStatus.text()).toContain('supported appointment status');
    expect(listBookings(database)).toHaveLength(1);
    expect(getBooking(database, 1)?.status).toBe('scheduled');
  });

  it('persists a booking and status across database reopen', () => {
    const directory = mkdtempSync(join(tmpdir(), 'agentclinic-bookings-'));
    const filename = join(directory, 'clinic.sqlite');
    try {
      const firstConnection = openDatabase(filename);
      const [agent] = listAgents(firstConnection);
      const [therapy] = listTherapies(firstConnection);
      const bookingId = createBooking(
        firstConnection,
        agent.id,
        therapy.id,
        '2030-04-05T09:30:00.000Z',
      );
      firstConnection.prepare("UPDATE bookings SET status = 'completed' WHERE id = ?").run(bookingId);
      firstConnection.close();

      const reopenedConnection = openDatabase(filename);
      try {
        expect(getBooking(reopenedConnection, bookingId)).toMatchObject({
          appointmentTime: '2030-04-05T09:30:00.000Z',
          status: 'completed',
        });
      } finally {
        reopenedConnection.close();
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
