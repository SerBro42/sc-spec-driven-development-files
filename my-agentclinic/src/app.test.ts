import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createApp } from './app';
import {
  createAgent,
  createAilmentForAgent,
  createTherapyForAilment,
  initializeDatabase,
  linkAilmentToAgent,
  linkTherapyToAilment,
  listAgents,
  listAilmentsForAgent,
  listTherapiesForAilment,
  openDatabase,
} from './database';
import type { DatabaseSync } from 'node:sqlite';

describe('AgentClinic Phase 2 routes', () => {
  let database: DatabaseSync;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    database = openDatabase(':memory:');
    app = createApp(database);
  });

  afterEach(() => {
    database.close();
  });

  it('keeps database initialization idempotent without deleting existing data', () => {
    createAgent(database, 'Susan');
    initializeDatabase(database);

    expect(listAgents(database)).toEqual([{ id: 1, name: 'Susan' }]);
  });

  it('persists records when a file-backed database is reopened', () => {
    const directory = mkdtempSync(join(tmpdir(), 'agentclinic-'));
    try {
      const filename = join(directory, 'clinic.sqlite');
      const firstConnection = openDatabase(filename);
      createAgent(firstConnection, 'Susan');
      firstConnection.close();

      const reopenedConnection = openDatabase(filename);
      try {
        expect(listAgents(reopenedConnection)).toEqual([{ id: 1, name: 'Susan' }]);
      } finally {
        reopenedConnection.close();
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('prevents duplicate links and enforces relationship foreign keys', () => {
    const agentId = createAgent(database, 'Susan');
    const ailmentId = createAilmentForAgent(database, agentId, 'Context switching fatigue', '');
    linkAilmentToAgent(database, agentId, ailmentId);
    expect(listAilmentsForAgent(database, agentId)).toHaveLength(1);

    const therapyId = createTherapyForAilment(database, ailmentId, 'Guided focus reset', '');
    linkTherapyToAilment(database, ailmentId, therapyId);
    expect(listTherapiesForAilment(database, ailmentId)).toHaveLength(1);

    expect(() => linkAilmentToAgent(database, 999, ailmentId)).toThrow();
    expect(() => linkTherapyToAilment(database, ailmentId, 999)).toThrow();
  });

  it('renders the home page with the shared layout and clinic navigation', async () => {
    const response = await app.request('http://localhost/');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('<header class="site-header">');
    expect(html).toContain('<main class="container site-main">');
    expect(html).toContain('<footer class="site-footer">');
    expect(html).toContain('Upcoming clinic features');
    expect(html).toContain('href="/agents"');
    expect(html).toContain('href="/pico.min.css"');
  });

  it('serves PicoCSS and the project stylesheet', async () => {
    const picoResponse = await app.request('http://localhost/pico.min.css');
    const projectResponse = await app.request('http://localhost/styles.css');

    expect(picoResponse.status).toBe(200);
    expect(picoResponse.headers.get('content-type')).toContain('text/css');
    expect(await picoResponse.text()).toContain('--pico-font-family');
    expect(projectResponse.status).toBe(200);
    expect(projectResponse.headers.get('content-type')).toContain('text/css');
    expect(await projectResponse.text()).toContain('.site-main');
  });

  it('creates and lists agents and validates required names', async () => {
    const invalidResponse = await app.request('http://localhost/agents', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name: '   ' }),
    });
    expect(invalidResponse.status).toBe(400);
    expect(await invalidResponse.text()).toContain('Enter a name');
    expect(listAgents(database)).toHaveLength(0);

    const longName = 'a'.repeat(121);
    const longNameResponse = await app.request('http://localhost/agents', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name: longName }),
    });
    expect(longNameResponse.status).toBe(400);
    const longNameHtml = await longNameResponse.text();
    expect(longNameHtml).toContain('120 characters or fewer');
    expect(longNameHtml).toContain(`value="${longName}"`);
    expect(listAgents(database)).toHaveLength(0);

    const createResponse = await app.request('http://localhost/agents', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name: 'Susan' }),
    });
    expect(createResponse.status).toBe(303);
    expect(createResponse.headers.get('location')).toBe('/agents/1');

    const listResponse = await app.request('http://localhost/agents');
    expect(await listResponse.text()).toContain('Susan');
  });

  it('creates records and supports many-to-many agent, ailment, and therapy links', async () => {
    const agentOne = await app.request('http://localhost/agents', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name: 'Susan' }),
    });
    const agentTwo = await app.request('http://localhost/agents', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name: 'Alex' }),
    });
    expect(agentOne.status).toBe(303);
    expect(agentTwo.status).toBe(303);

    const ailmentResponse = await app.request('http://localhost/agents/1/ailments', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        mode: 'create',
        name: 'Context switching fatigue',
        description: 'Difficulty regaining focus.',
      }),
    });
    expect(ailmentResponse.status).toBe(303);
    expect(ailmentResponse.headers.get('location')).toBe('/ailments/1');

    const linkAilmentResponse = await app.request('http://localhost/agents/2/ailments', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ mode: 'link', ailmentId: '1' }),
    });
    expect(linkAilmentResponse.status).toBe(303);
    const secondAgentPage = await app.request('http://localhost/agents/2');
    expect(await secondAgentPage.text()).toContain('Context switching fatigue');

    const therapyResponse = await app.request('http://localhost/ailments/1/therapies', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        mode: 'create',
        name: 'Guided focus reset',
        description: 'A short restorative exercise.',
      }),
    });
    expect(therapyResponse.status).toBe(303);
    const firstAilmentPage = await app.request('http://localhost/ailments/1');
    expect(await firstAilmentPage.text()).toContain('Guided focus reset');

    const secondAilmentResponse = await app.request('http://localhost/agents/2/ailments', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        mode: 'create',
        name: 'Notification overload',
        description: '',
      }),
    });
    expect(secondAilmentResponse.status).toBe(303);
    const secondAilmentId = secondAilmentResponse.headers.get('location')?.split('/').pop();
    expect(secondAilmentId).toBe('2');
    const linkTherapyResponse = await app.request(
      `http://localhost/ailments/${secondAilmentId}/therapies`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ mode: 'link', therapyId: '1' }),
      },
    );
    expect(linkTherapyResponse.status).toBe(303);
    const secondAilmentPage = await app.request(
      `http://localhost/ailments/${secondAilmentId}`,
    );
    expect(await secondAilmentPage.text()).toContain('Guided focus reset');
  });

  it('returns clear not-found and validation responses for invalid references', async () => {
    createAgent(database, 'Susan');
    const unknownAgentPage = await app.request('http://localhost/agents/999');
    expect(unknownAgentPage.status).toBe(404);
    expect(await unknownAgentPage.text()).toContain('This agent does not exist');

    const unknownAgentLink = await app.request('http://localhost/agents/999/ailments', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ mode: 'link', ailmentId: '1' }),
    });
    expect(unknownAgentLink.status).toBe(404);

    const unknownAilmentLink = await app.request('http://localhost/agents/1/ailments', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ mode: 'link', ailmentId: '999' }),
    });
    expect(unknownAilmentLink.status).toBe(404);
    expect(await unknownAilmentLink.text()).toContain('This ailment does not exist');

    const agentId = createAgent(database, 'Alex');
    const ailmentId = createAilmentForAgent(database, agentId, 'Context switching fatigue', '');
    const blankAilmentResponse = await app.request(
      `http://localhost/agents/${agentId}/ailments`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          mode: 'create',
          name: '   ',
          description: 'Keep this description.',
        }),
      },
    );
    expect(blankAilmentResponse.status).toBe(400);
    const blankAilmentHtml = await blankAilmentResponse.text();
    expect(blankAilmentHtml).toContain('Enter a name for the ailment');
    expect(blankAilmentHtml).toContain('Keep this description.');

    const longDescriptionResponse = await app.request(
      `http://localhost/agents/${agentId}/ailments`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          mode: 'create',
          name: 'Kept ailment name',
          description: 'd'.repeat(1001),
        }),
      },
    );
    expect(longDescriptionResponse.status).toBe(400);
    const longDescriptionHtml = await longDescriptionResponse.text();
    expect(longDescriptionHtml).toContain('1000 characters or fewer');
    expect(longDescriptionHtml).toContain('value="Kept ailment name"');

    const blankTherapyResponse = await app.request(
      `http://localhost/ailments/${ailmentId}/therapies`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          mode: 'create',
          name: '',
          description: 'Keep this therapy description.',
        }),
      },
    );
    expect(blankTherapyResponse.status).toBe(400);
    const blankTherapyHtml = await blankTherapyResponse.text();
    expect(blankTherapyHtml).toContain('Enter a name for the therapy');
    expect(blankTherapyHtml).toContain('Keep this therapy description.');

    const unknownTherapyLink = await app.request(
      `http://localhost/ailments/${ailmentId}/therapies`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ mode: 'link', therapyId: '999' }),
      },
    );
    expect(unknownTherapyLink.status).toBe(404);
    expect(await unknownTherapyLink.text()).toContain('This therapy does not exist');

    expect(() => linkAilmentToAgent(database, 999, 999)).toThrow();
  });
});
