import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const customTextUtilities = [] as const;

/**
 * Why this configuration is needed:
 * tailwind-merge needs to recognize our custom text utilities (text-desktop-*, text-mobile-*)
 * so it doesn't strip them out when merging classes. Without this, custom classes like
 * "text-desktop-body1" would be removed during class merging.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: customTextUtilities }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
