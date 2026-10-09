import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from './app';
import { openDatabase } from './database';
import type { DatabaseSync } from 'node:sqlite';

describe('AgentClinic app routes', () => {
  let database: DatabaseSync;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    database = openDatabase(':memory:');
    app = createApp(database);
  });

  afterEach(() => {
    database.close();
  });

  it('returns a 404 for unknown routes', async () => {
    const response = await app.request('http://localhost/unknown-route');

    expect(response.status).toBe(404);
  });
});
