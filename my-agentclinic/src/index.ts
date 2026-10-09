import { serve } from '@hono/node-server';

import { createApp } from './app';
import { openDatabase } from './database';

export const database = openDatabase();
export const app = createApp(database);

const port = Number(process.env.PORT ?? 3000);

if (require.main === module) {
  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`AgentClinic listening on http://localhost:${info.port}`);
    },
  );
}
