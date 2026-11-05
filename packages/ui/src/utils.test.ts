import { describe, it, expect } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
  it('joins conditional class values like clsx', () => {
    const hidden = false;
    expect(
      cn('inline-flex', hidden && 'hidden', undefined, null, [
        'gap-2',
        { 'font-bold': true, italic: false },
      ]),
    ).toBe('inline-flex gap-2 font-bold');
  });

  it('keeps the last of conflicting tailwind classes', () => {
    expect(cn('px-4 py-2', 'px-8')).toBe('py-2 px-8');
    expect(cn('bg-primary-600 hover:bg-primary-700', 'bg-transparent')).toBe(
      'hover:bg-primary-700 bg-transparent',
    );
  });

  it('keeps a custom text size next to a text colour', () => {
    expect(cn('text-desktop-body1', 'text-white')).toBe(
      'text-desktop-body1 text-white',
    );
    expect(cn('text-mobile-caption', 'text-error-500')).toBe(
      'text-mobile-caption text-error-500',
    );
  });

  it('keeps mobile and responsive desktop text sizes together', () => {
    expect(cn('text-mobile-body1 md:text-desktop-body1')).toBe(
      'text-mobile-body1 md:text-desktop-body1',
    );
  });

  it('resolves conflicts between custom and built-in text sizes', () => {
    expect(cn('text-mobile-h1', 'text-mobile-body2')).toBe('text-mobile-body2');
    expect(cn('text-sm', 'text-desktop-h2')).toBe('text-desktop-h2');
    expect(cn('text-desktop-h2', 'text-sm')).toBe('text-sm');
  });

  it.each([
    'desktop-h1',
    'desktop-h2',
    'desktop-h3',
    'desktop-h4',
    'desktop-body1',
    'desktop-body2',
    'desktop-caption',
    'mobile-h1',
    'mobile-h2',
    'mobile-h3',
    'mobile-h4',
    'mobile-body1',
    'mobile-body2',
    'mobile-caption',
  ])('registers text-%s as a font size', (size) => {
    expect(cn(`text-${size}`, 'text-darkest-gray')).toBe(
      `text-${size} text-darkest-gray`,
    );
  });
});
