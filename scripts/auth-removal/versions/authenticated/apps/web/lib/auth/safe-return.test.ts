import { safeReturnTo } from './safe-return';

describe('safeReturnTo', () => {
  it.each(['/dashboard', '/links?filter=mine'])(
    'allows local paths: %s',
    (path) => {
      expect(safeReturnTo(path)).toBe(path);
    },
  );

  it.each([
    null,
    '',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
  ])('replaces unsafe redirect destination: %s', (path) =>
    expect(safeReturnTo(path)).toBe('/'),
  );
});
