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
  });
});
