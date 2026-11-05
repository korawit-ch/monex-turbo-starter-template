import { describe, it, expect } from 'vitest';

import { linksApi } from './links.js';

describe('linksApi endpoint descriptions', () => {
  it('lists links with GET /links and no body', () => {
    expect(linksApi.list()).toStrictEqual({ url: '/links', method: 'GET' });
  });

  it('reads one link with GET /links/:id and no body', () => {
    expect(linksApi.detail(42)).toStrictEqual({
      url: '/links/42',
      method: 'GET',
    });
  });

  it('creates a link with POST /links and passes the body through', () => {
    const body = {
      title: 'Docs',
      url: 'https://example.com/docs',
      description: 'Reference',
    };

    const endpoint = linksApi.create(body);

    expect(endpoint).toStrictEqual({ url: '/links', method: 'POST', body });
    expect(endpoint.body).toBe(body);
  });

  it('updates a link with PATCH /links/:id and a partial body', () => {
    const body = { title: 'Renamed' };

    expect(linksApi.update(7, body)).toStrictEqual({
      url: '/links/7',
      method: 'PATCH',
      body,
    });
  });

  it('deletes a link with DELETE /links/:id and no body', () => {
    expect(linksApi.delete(3)).toStrictEqual({
      url: '/links/3',
      method: 'DELETE',
    });
  });

  it('builds a new description on every call', () => {
    expect(linksApi.detail(1)).not.toBe(linksApi.detail(1));
    expect(linksApi.detail(1).url).not.toBe(linksApi.detail(2).url);
  });
});
