import { describe, expect, it } from 'vitest';

import { app } from './index';

describe('AgentClinic home page', () => {
  it('renders the expected HTML for GET /', async () => {
    const response = await app.request('http://localhost/');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');

    const html = await response.text();
    expect(html).toContain('<h1>AgentClinic</h1>');
    expect(html).toContain('AI agents');
    expect(html).toContain('Upcoming clinic features');
    expect(html).toContain('<header');
    expect(html).toContain('<main');
    expect(html).toContain('<footer');
    expect(html).toContain('<link rel="stylesheet" href="/styles.css"/>');
  });

  it('serves the linked stylesheet', async () => {
    const response = await app.request('http://localhost/styles.css');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/css');
    expect(await response.text()).toContain('.site-main');
  });
});
