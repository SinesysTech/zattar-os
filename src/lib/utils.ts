import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and merges Tailwind classes using tailwind-merge.
 * This prevents conflicting Tailwind classes from being applied.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a URL-friendly slug from a given string.
 * Converts to lowercase, replaces spaces with hyphens, removes special characters,
 * and collapses multiple hyphens into a single one.
 * @param text The input string.
 * @returns The generated slug.
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .normalize('NFD') // Normalize diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
}

