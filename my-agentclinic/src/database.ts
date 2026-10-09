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
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0)
    );

    CREATE TABLE IF NOT EXISTS ailments (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS therapies (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      description TEXT NOT NULL DEFAULT ''
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
    );
  `);
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
