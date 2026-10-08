import { describe, expect, it } from 'vitest';

import { app } from './index';

describe('AgentClinic app routes', () => {
  it('renders the full home page layout for GET /', async () => {
    const response = await app.request('http://localhost/');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');

    const html = await response.text();
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1"/>');
    expect(html).toContain('<header class="site-header">');
    expect(html).toContain('<main class="site-main">');
    expect(html).toContain('<footer class="site-footer">');
    expect(html).toContain('<title>AgentClinic</title>');
    expect(html).toContain('AgentClinic');
    expect(html).toContain('AI agents');
    expect(html).toContain('Upcoming clinic features');
  });

  it('serves the stylesheet from /styles.css', async () => {
    const response = await app.request('http://localhost/styles.css');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/css');

    const css = await response.text();
    expect(css).toContain('.site-header');
    expect(css).toContain('.site-main');
    expect(css).toContain('.site-footer');
    expect(css).toContain('@media (min-width: 700px)');
  });

  it('returns a 404 for unknown routes', async () => {
    const response = await app.request('http://localhost/unknown-route');

    expect(response.status).toBe(404);
  });
});
