import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and merges Tailwind classes using tailwind-merge.
 * This prevents conflicting Tailwind classes from being applied.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
