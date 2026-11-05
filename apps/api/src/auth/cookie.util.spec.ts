import { describe, it, expect } from 'vitest';
import type { Request } from 'express';

import { readCookie } from './cookie.util';

function withCookie(cookie?: string): Request {
  return { headers: cookie === undefined ? {} : { cookie } } as Request;
}

describe('readCookie', () => {
  it('returns undefined when there is no Cookie header', () => {
    expect(readCookie(withCookie(), 'auth_session')).toBeUndefined();
    expect(readCookie(withCookie(''), 'auth_session')).toBeUndefined();
  });

  it('finds the named cookie among others and trims whitespace', () => {
    expect(
      readCookie(
        withCookie('a=1;  auth_session = sealed ; b=2'),
        'auth_session',
      ),
    ).toBe('sealed');
  });

  it('matches the exact name, not a prefix or suffix', () => {
    const request = withCookie('xauth_session=wrong; auth_session_old=wrong');
    expect(readCookie(request, 'auth_session')).toBeUndefined();
  });

  it('returns the first occurrence when a name repeats', () => {
    expect(
      readCookie(
        withCookie('auth_session=first; auth_session=second'),
        'auth_session',
      ),
    ).toBe('first');
  });

  it('URL-decodes the value and keeps any "=" after the first separator', () => {
    expect(
      readCookie(withCookie('auth_session=a%2Fb%3D%3D=='), 'auth_session'),
    ).toBe('a/b====');
  });

  it('returns an empty string for an empty value', () => {
    expect(readCookie(withCookie('auth_session='), 'auth_session')).toBe('');
  });

  it('skips pairs without a separator', () => {
    expect(
      readCookie(withCookie('garbage; auth_session=ok'), 'auth_session'),
    ).toBe('ok');
  });

  it('returns undefined instead of throwing on a malformed escape', () => {
    expect(
      readCookie(withCookie('auth_session=%E0%A4%A'), 'auth_session'),
    ).toBeUndefined();
  });
});
