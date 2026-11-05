import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';

import { mergeRefs } from './merge-refs';

describe('mergeRefs', () => {
  it('passes the instance to function refs and object refs', () => {
    const element = document.createElement('input');
    const callbackRef = vi.fn();
    const objectRef = createRef<HTMLInputElement>();

    mergeRefs<HTMLInputElement>(callbackRef, objectRef)(element);

    expect(callbackRef).toHaveBeenCalledTimes(1);
    expect(callbackRef).toHaveBeenCalledWith(element);
    expect(objectRef.current).toBe(element);
  });

  it('skips undefined and null refs', () => {
    const element = document.createElement('input');
    const callbackRef = vi.fn();

    const merged = mergeRefs<HTMLInputElement>(
      undefined,
      null,
      callbackRef,
      undefined,
    );

    expect(() => merged(element)).not.toThrow();
    expect(callbackRef).toHaveBeenCalledWith(element);
  });

  it('clears every ref when React detaches the element', () => {
    const element = document.createElement('input');
    const callbackRef = vi.fn();
    const objectRef = createRef<HTMLInputElement>();
    const merged = mergeRefs<HTMLInputElement>(callbackRef, objectRef);

    merged(element);
    merged(null);

    expect(callbackRef).toHaveBeenLastCalledWith(null);
    expect(objectRef.current).toBeNull();
  });

  it('calls the refs in the order given', () => {
    const order: string[] = [];

    mergeRefs<HTMLInputElement>(
      () => {
        order.push('form field');
      },
      () => {
        order.push('caller');
      },
    )(document.createElement('input'));

    expect(order).toEqual(['form field', 'caller']);
  });
});
