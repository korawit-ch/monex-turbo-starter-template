import type { Ref, RefCallback } from 'react';

/**
 * Combines refs so a form adapter can give React Hook Form its field ref
 * (used for focus on error) while still forwarding the caller's ref.
 */
export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): RefCallback<T> {
  return (instance) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref) {
        ref.current = instance;
      }
    }
  };
}
