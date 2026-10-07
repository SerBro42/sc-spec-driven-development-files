import { serve } from '@hono/node-server';

import { app } from './app';

export { app };

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
