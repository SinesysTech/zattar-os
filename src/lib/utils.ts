import * as React from 'react';
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

/**
 * Converte um objeto de snake_case para camelCase recursivamente
 */
export function fromSnakeToCamel<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;

  if (Array.isArray(obj)) {
    return obj.map(item => fromSnakeToCamel(item)) as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const camelObj: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Converte snake_case para camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camelObj[camelKey] = fromSnakeToCamel(value);
    }

    return camelObj as T;
  }

  return obj as T;
}

/**
 * Converte um objeto de camelCase para snake_case recursivamente
 */
export function fromCamelToSnake<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;

  if (Array.isArray(obj)) {
    return obj.map(item => fromCamelToSnake(item)) as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const snakeObj: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Converte camelCase para snake_case
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      snakeObj[snakeKey] = fromCamelToSnake(value);
    }

    return snakeObj as T;
  }

  if (typeof obj === 'string') {
    return obj.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`) as unknown as T;
  }

  return obj as T;
}

/**
 * Verifica se um elemento React é um Fragment.
 * Fragment não aceita props como className, então esta função é útil
 * para evitar tentar passar props para Fragment.
 */
export function isReactFragment(element: React.ReactElement): boolean {
  return element.type === React.Fragment || 
         (typeof element.type === 'symbol' && element.type.toString().includes('Fragment'));
}

