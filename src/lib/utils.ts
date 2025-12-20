import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

/**
 * Converte uma string de camelCase para snake_case.
 * Útil para converter nomes de campos para queries do banco.
 */
export function camelToSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Converte recursivamente chaves `snake_case` para `camelCase`.
 * Útil para normalizar payloads vindos do banco.
 */
export function fromSnakeToCamel<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => fromSnakeToCamel(item)) as unknown as T;
  }
  if (!isPlainObject(input)) return input;

  const out: PlainObject = {};
  for (const [k, v] of Object.entries(input)) {
    out[snakeToCamelKey(k)] = fromSnakeToCamel(v);
  }
  return out as T;
}

/**
 * Converte recursivamente chaves `camelCase` para `snake_case`.
 * Útil para montar payloads de insert/update.
 */
export function fromCamelToSnake<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => fromCamelToSnake(item)) as unknown as T;
  }
  if (!isPlainObject(input)) return input;

  const out: PlainObject = {};
  for (const [k, v] of Object.entries(input)) {
    out[camelToSnakeKey(k)] = fromCamelToSnake(v);
  }
  return out as T;
}

/**
 * Gera as iniciais de um nome para fallback de avatar.
 */
export function generateAvatarFallback(name?: string | null): string {
  if (!name) return "??";
  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return initials.slice(0, 2);
}
