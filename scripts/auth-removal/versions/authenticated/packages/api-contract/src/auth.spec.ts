import { describe, it, expect } from 'vitest';

import { authApi } from './auth.js';

describe('authApi endpoint descriptions', () => {
  it('logs in with POST /auth/login and passes the credentials through', () => {
    const body = { email: 'user@example.com', password: 'example-password' };

    const endpoint = authApi.login(body);

    expect(endpoint).toStrictEqual({
      url: '/auth/login',
      method: 'POST',
      body,
    });
    expect(endpoint.body).toBe(body);
  });
});
