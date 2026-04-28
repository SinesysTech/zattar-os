import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function camelToSnakeKey(str: string): string {
  if (!str) return str;
  // Se começa com 2+ maiúsculas consecutivas (ex: URLCompleta), a primeira não ganha underscore
  if (/^[A-Z]{2}/.test(str)) {
    return str[0].toLowerCase() + str.slice(1).replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromSnakeToCamel(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(fromSnakeToCamel);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelKey = key.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());
    result[camelKey] = fromSnakeToCamel(value);
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromCamelToSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(fromCamelToSnake);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[camelToSnakeKey(key)] = fromCamelToSnake(value);
  }
  return result;
}

export function generateAvatarFallback(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) {
    const chars = Array.from(parts[0]);
    if (chars.length === 0) return "??";
    return chars.slice(0, 2).join("").toUpperCase();
  }
  return (Array.from(parts[0])[0] + Array.from(parts[1])[0]).toUpperCase();
}
