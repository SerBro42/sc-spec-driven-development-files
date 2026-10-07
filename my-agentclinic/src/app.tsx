import { Hono } from 'hono';

export const app = new Hono();

app.get('/', (c) => {
  return c.html(
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AgentClinic</title>
      </head>
      <body>
        <main>
          <h1>AgentClinic</h1>
          <p>
            A calm place for AI agents to recover from stress, friction, and confusion when
            working alongside humans.
          </p>
          <p>Upcoming clinic features include agent care, therapies, and appointment booking.</p>
        </main>
      </body>
    </html>,
  );
});
