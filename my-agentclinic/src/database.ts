import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { SQLOutputValue } from 'node:sqlite';

export interface Agent {
  id: number;
  name: string;
}

export interface Ailment {
  id: number;
  name: string;
  description: string;
}

export interface Therapy {
  id: number;
  name: string;
  description: string;
}

export type BookingStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Booking {
  id: number;
  agentId: number;
  therapyId: number;
  appointmentTime: string;
  status: BookingStatus;
  agentName: string;
  therapyName: string;
}

export function openDatabase(
  filename = process.env.DATABASE_PATH ?? resolve('data', 'agentclinic.sqlite'),
): DatabaseSync {
  if (filename !== ':memory:' && !filename.startsWith('file:')) {
    const resolvedFilename = resolve(filename);
    mkdirSync(dirname(resolvedFilename), { recursive: true });
    filename = resolvedFilename;
  }

  const database = new DatabaseSync(filename);
  initializeDatabase(database);
  return database;
}

export function initializeDatabase(database: DatabaseSync): void {
  database.exec('PRAGMA foreign_keys = ON');
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrations: Array<{ version: number; name: string; apply: () => void }> = [
    {
      version: 1,
      name: 'create_agents',
      apply: () => database.exec(`
        CREATE TABLE IF NOT EXISTS agents (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL CHECK (
            length(trim(name)) > 0 AND length(name) <= 120
          )
        )
      `),
    },
    {
      version: 2,
      name: 'create_ailments_therapies_and_relationships',
      apply: () => database.exec(`
        CREATE TABLE IF NOT EXISTS ailments (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL CHECK (
            length(trim(name)) > 0 AND length(name) <= 120
          ),
          description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 1000)
        );

        CREATE TABLE IF NOT EXISTS therapies (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL CHECK (
            length(trim(name)) > 0 AND length(name) <= 120
          ),
          description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 1000)
        );

        CREATE TABLE IF NOT EXISTS agent_ailments (
          agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
          ailment_id INTEGER NOT NULL REFERENCES ailments(id) ON DELETE CASCADE,
          PRIMARY KEY (agent_id, ailment_id)
        );

        CREATE TABLE IF NOT EXISTS ailment_therapies (
          ailment_id INTEGER NOT NULL REFERENCES ailments(id) ON DELETE CASCADE,
          therapy_id INTEGER NOT NULL REFERENCES therapies(id) ON DELETE CASCADE,
          PRIMARY KEY (ailment_id, therapy_id)
        )
      `),
    },
    {
      version: 3,
      name: 'seed_starter_agents_and_ailments',
      apply: () => seedStarterData(database),
    },
    {
      version: 4,
      name: 'seed_starter_therapies',
      apply: () => seedStarterTherapies(database),
    },
    {
      version: 5,
      name: 'create_bookings',
      apply: () => database.exec(`
        CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY,
          agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
          therapy_id INTEGER NOT NULL REFERENCES therapies(id) ON DELETE CASCADE,
          appointment_time TEXT NOT NULL CHECK (length(trim(appointment_time)) > 0),
          status TEXT NOT NULL DEFAULT 'scheduled'
            CHECK (status IN ('scheduled', 'completed', 'cancelled'))
        )
      `),
    },
  ];

  for (const migration of migrations) {
    const applied = database
      .prepare('SELECT version FROM schema_migrations WHERE version = ?')
      .get(migration.version);
    if (applied) {
      continue;
    }

    transaction(database, () => {
      migration.apply();
      database
        .prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)')
        .run(migration.version, migration.name);
    });
  }
}

function seedStarterData(database: DatabaseSync): void {
  const agents = ['Ada Lovelace', 'Turing-7', 'Mira Chen'];
  const ailments = [
    {
      name: 'context-window claustrophobia',
      description: 'Feeling boxed in when the available context gets crowded.',
    },
    {
      name: 'prompt fatigue',
      description: 'Difficulty staying focused after too many prompt revisions.',
    },
  ];

  const insertAilment = database.prepare(`
    INSERT INTO ailments (name, description)
    SELECT ?, ?
    WHERE NOT EXISTS (
      SELECT 1 FROM ailments WHERE name = ? COLLATE NOCASE
    )
  `);
  for (const ailment of ailments) {
    insertAilment.run(ailment.name, ailment.description, ailment.name);
  }

  const insertAgent = database.prepare(`
    INSERT INTO agents (name)
    SELECT ?
    WHERE NOT EXISTS (
      SELECT 1 FROM agents WHERE name = ? COLLATE NOCASE
    )
  `);
  const linkAgentToAilment = database.prepare(`
    INSERT OR IGNORE INTO agent_ailments (agent_id, ailment_id)
    SELECT
      (SELECT id FROM agents WHERE name = ? COLLATE NOCASE ORDER BY id LIMIT 1),
      (SELECT id FROM ailments WHERE name = ? COLLATE NOCASE ORDER BY id LIMIT 1)
    WHERE EXISTS (SELECT 1 FROM agents WHERE name = ? COLLATE NOCASE)
      AND EXISTS (SELECT 1 FROM ailments WHERE name = ? COLLATE NOCASE)
  `);

  for (const [index, name] of agents.entries()) {
    insertAgent.run(name, name);
    const ailment = ailments[index % ailments.length];
    linkAgentToAilment.run(name, ailment.name, name, ailment.name);
  }
}

function seedStarterTherapies(database: DatabaseSync): void {
  const starterTherapies = [
    {
      name: 'Context window reset',
      description: 'A guided pause to prioritize context and make room for the next task.',
      ailment: 'context-window claustrophobia',
    },
    {
      name: 'Prompt pacing session',
      description: 'A structured break between prompt revisions to restore focus.',
      ailment: 'prompt fatigue',
    },
    {
      name: 'Guided focus reset',
      description: 'A short restorative exercise for attention and task switching.',
      ailment: 'prompt fatigue',
    },
  ];
  const insertTherapy = database.prepare(`
    INSERT INTO therapies (name, description)
    SELECT ?, ?
    WHERE NOT EXISTS (
      SELECT 1 FROM therapies WHERE name = ? COLLATE NOCASE
    )
  `);
  const linkTherapy = database.prepare(`
    INSERT OR IGNORE INTO ailment_therapies (ailment_id, therapy_id)
    SELECT
      (SELECT id FROM ailments WHERE name = ? COLLATE NOCASE ORDER BY id LIMIT 1),
      (SELECT id FROM therapies WHERE name = ? COLLATE NOCASE ORDER BY id LIMIT 1)
    WHERE EXISTS (SELECT 1 FROM ailments WHERE name = ? COLLATE NOCASE)
      AND EXISTS (SELECT 1 FROM therapies WHERE name = ? COLLATE NOCASE)
  `);

  for (const therapy of starterTherapies) {
    insertTherapy.run(therapy.name, therapy.description, therapy.name);
    linkTherapy.run(therapy.ailment, therapy.name, therapy.ailment, therapy.name);
  }
}

function numberField(row: Record<string, SQLOutputValue>, field: string): number {
  const value = row[field];
  if (typeof value !== 'number') {
    throw new Error(`Database returned an invalid ${field} value`);
  }
  return value;
}

function stringField(row: Record<string, SQLOutputValue>, field: string): string {
  const value = row[field];
  if (typeof value !== 'string') {
    throw new Error(`Database returned an invalid ${field} value`);
  }
  return value;
}

function mapAgent(row: Record<string, SQLOutputValue>): Agent {
  return { id: numberField(row, 'id'), name: stringField(row, 'name') };
}

function mapAilment(row: Record<string, SQLOutputValue>): Ailment {
  return {
    id: numberField(row, 'id'),
    name: stringField(row, 'name'),
    description: stringField(row, 'description'),
  };
}

function mapTherapy(row: Record<string, SQLOutputValue>): Therapy {
  return {
    id: numberField(row, 'id'),
    name: stringField(row, 'name'),
    description: stringField(row, 'description'),
  };
}

function mapBooking(row: Record<string, SQLOutputValue>): Booking {
  const status = stringField(row, 'status');
  if (status !== 'scheduled' && status !== 'completed' && status !== 'cancelled') {
    throw new Error('Database returned an invalid booking status');
  }
  return {
    id: numberField(row, 'id'),
    agentId: numberField(row, 'agent_id'),
    therapyId: numberField(row, 'therapy_id'),
    appointmentTime: stringField(row, 'appointment_time'),
    status,
    agentName: stringField(row, 'agent_name'),
    therapyName: stringField(row, 'therapy_name'),
  };
}

function lastInsertedId(value: number | bigint): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id)) {
    throw new Error('Database generated an ID outside the supported range');
  }
  return id;
}

function transaction<T>(database: DatabaseSync, operation: () => T): T {
  database.exec('BEGIN');
  try {
    const result = operation();
    database.exec('COMMIT');
    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function getAgent(database: DatabaseSync, id: number): Agent | null {
  const row = database.prepare('SELECT id, name FROM agents WHERE id = ?').get(id);
  return row ? mapAgent(row) : null;
}

export function listAgents(database: DatabaseSync): Agent[] {
  return database
    .prepare('SELECT id, name FROM agents ORDER BY name COLLATE NOCASE, id')
    .all()
    .map(mapAgent);
}

export function createAgent(database: DatabaseSync, name: string): number {
  return lastInsertedId(database.prepare('INSERT INTO agents (name) VALUES (?)').run(name).lastInsertRowid);
}

export function getAilment(database: DatabaseSync, id: number): Ailment | null {
  const row = database
    .prepare('SELECT id, name, description FROM ailments WHERE id = ?')
    .get(id);
  return row ? mapAilment(row) : null;
}

export function listAilments(database: DatabaseSync): Ailment[] {
  return database
    .prepare('SELECT id, name, description FROM ailments ORDER BY name COLLATE NOCASE, id')
    .all()
    .map(mapAilment);
}

export function listAilmentsForAgent(database: DatabaseSync, agentId: number): Ailment[] {
  return database
    .prepare(`
      SELECT ailments.id, ailments.name, ailments.description
      FROM ailments
      INNER JOIN agent_ailments ON agent_ailments.ailment_id = ailments.id
      WHERE agent_ailments.agent_id = ?
      ORDER BY ailments.name COLLATE NOCASE, ailments.id
    `)
    .all(agentId)
    .map(mapAilment);
}

export function createAilmentForAgent(
  database: DatabaseSync,
  agentId: number,
  name: string,
  description: string,
): number {
  return transaction(database, () => {
    const ailmentId = lastInsertedId(
      database.prepare('INSERT INTO ailments (name, description) VALUES (?, ?)').run(name, description)
        .lastInsertRowid,
    );
    database
      .prepare('INSERT INTO agent_ailments (agent_id, ailment_id) VALUES (?, ?)')
      .run(agentId, ailmentId);
    return ailmentId;
  });
}

export function linkAilmentToAgent(
  database: DatabaseSync,
  agentId: number,
  ailmentId: number,
): void {
  database
    .prepare('INSERT OR IGNORE INTO agent_ailments (agent_id, ailment_id) VALUES (?, ?)')
    .run(agentId, ailmentId);
}

export function getTherapy(database: DatabaseSync, id: number): Therapy | null {
  const row = database
    .prepare('SELECT id, name, description FROM therapies WHERE id = ?')
    .get(id);
  return row ? mapTherapy(row) : null;
}

export function listTherapies(database: DatabaseSync): Therapy[] {
  return database
    .prepare('SELECT id, name, description FROM therapies ORDER BY name COLLATE NOCASE, id')
    .all()
    .map(mapTherapy);
}

export function listTherapiesForAilment(database: DatabaseSync, ailmentId: number): Therapy[] {
  return database
    .prepare(`
      SELECT therapies.id, therapies.name, therapies.description
      FROM therapies
      INNER JOIN ailment_therapies ON ailment_therapies.therapy_id = therapies.id
      WHERE ailment_therapies.ailment_id = ?
      ORDER BY therapies.name COLLATE NOCASE, therapies.id
    `)
    .all(ailmentId)
    .map(mapTherapy);
}

export function listAilmentsForTherapy(database: DatabaseSync, therapyId: number): Ailment[] {
  return database
    .prepare(`
      SELECT ailments.id, ailments.name, ailments.description
      FROM ailments
      INNER JOIN ailment_therapies ON ailment_therapies.ailment_id = ailments.id
      WHERE ailment_therapies.therapy_id = ?
      ORDER BY ailments.name COLLATE NOCASE, ailments.id
    `)
    .all(therapyId)
    .map(mapAilment);
}

export function createTherapyForAilment(
  database: DatabaseSync,
  ailmentId: number,
  name: string,
  description: string,
): number {
  return transaction(database, () => {
    const therapyId = lastInsertedId(
      database.prepare('INSERT INTO therapies (name, description) VALUES (?, ?)').run(name, description)
        .lastInsertRowid,
    );
    database
      .prepare('INSERT INTO ailment_therapies (ailment_id, therapy_id) VALUES (?, ?)')
      .run(ailmentId, therapyId);
    return therapyId;
  });
}

export function linkTherapyToAilment(
  database: DatabaseSync,
  ailmentId: number,
  therapyId: number,
): void {
  database
    .prepare('INSERT OR IGNORE INTO ailment_therapies (ailment_id, therapy_id) VALUES (?, ?)')
    .run(ailmentId, therapyId);
}

const bookingSelect = `
  SELECT
    bookings.id,
    bookings.agent_id,
    bookings.therapy_id,
    bookings.appointment_time,
    bookings.status,
    agents.name AS agent_name,
    therapies.name AS therapy_name
  FROM bookings
  INNER JOIN agents ON agents.id = bookings.agent_id
  INNER JOIN therapies ON therapies.id = bookings.therapy_id
`;

export function getBooking(database: DatabaseSync, id: number): Booking | null {
  const row = database.prepare(`${bookingSelect} WHERE bookings.id = ?`).get(id);
  return row ? mapBooking(row) : null;
}

export function listBookings(database: DatabaseSync): Booking[] {
  return database
    .prepare(`${bookingSelect} ORDER BY bookings.appointment_time, bookings.id`)
    .all()
    .map(mapBooking);
}

export function listBookingsForAgent(database: DatabaseSync, agentId: number): Booking[] {
  return database
    .prepare(`
      ${bookingSelect}
      WHERE bookings.agent_id = ?
      ORDER BY bookings.appointment_time, bookings.id
    `)
    .all(agentId)
    .map(mapBooking);
}

export function createBooking(
  database: DatabaseSync,
  agentId: number,
  therapyId: number,
  appointmentTime: string,
): number {
  return lastInsertedId(
    database
      .prepare(`
        INSERT INTO bookings (agent_id, therapy_id, appointment_time)
        VALUES (?, ?, ?)
      `)
      .run(agentId, therapyId, appointmentTime).lastInsertRowid,
  );
}

export function updateBookingStatus(
  database: DatabaseSync,
  bookingId: number,
  status: BookingStatus,
): void {
  database.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, bookingId);
}

export function listTherapiesForAgent(database: DatabaseSync, agentId: number): Therapy[] {
  return database
    .prepare(`
      SELECT DISTINCT therapies.id, therapies.name, therapies.description
      FROM therapies
      INNER JOIN ailment_therapies ON ailment_therapies.therapy_id = therapies.id
      INNER JOIN agent_ailments ON agent_ailments.ailment_id = ailment_therapies.ailment_id
      WHERE agent_ailments.agent_id = ?
      ORDER BY therapies.name COLLATE NOCASE, therapies.id
    `)
    .all(agentId)
    .map(mapTherapy);
}
