import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';

import { Layout } from './components/Layout';

export const app = new Hono();

app.use('/styles.css', serveStatic({ root: './public' }));

app.get('/', (c) => {
  return c.html(<Layout />);
});
