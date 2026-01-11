import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  const merged = twMerge(clsx(inputs))
  const parts = merged.split(/\s+/).filter(Boolean)
  return Array.from(new Set(parts)).join(" ")
}

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  return Object.prototype.toString.call(value) === "[object Object]";
}

function snakeToCamelKey(key: string): string {
  // Regras suportadas (alinhadas aos testes):
  // - item_1_nome -> item1Nome
  // - valor_2024_total -> valor2024Total
  // - nivel_1 -> nivel_1 (preserva underscore antes de número no fim para manter roundtrip)
  const withoutUnderscoreBeforeDigitWhenFollowedByWord = key.replace(
    /_(\d+)(?=_[a-zA-Z])/g,
    "$1"
  );

  return withoutUnderscoreBeforeDigitWhenFollowedByWord.replace(
    /_([a-zA-Z])/g,
    (_, char: string) => char.toUpperCase()
  );
}

/**
 * Converte uma string de camelCase para snake_case.
 * Útil para converter nomes de campos para queries do banco.
 */
export function camelToSnakeKey(key: string): string {
  if (!key) return key;

  // PascalCase (NomeCompleto) deve ganhar underscore no início.
  // Acrônimos no início (URLCompleta) NÃO devem começar com underscore.
  const isUpper = (c: string | undefined) => !!c && c.toUpperCase() === c && c.toLowerCase() !== c;
  const startsWithAcronym = isUpper(key[0]) && isUpper(key[1]);

  const out = key.replace(/[A-Z]/g, (letter, offset) => {
    if (offset === 0) return letter.toLowerCase();
    return `_${letter.toLowerCase()}`;
  });

  if (!startsWithAcronym && isUpper(key[0])) {
    return `_${out}`;
  }

  return out;
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
  const trimmed = name.trim();
  if (!trimmed) return "??";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";

  const pickFirstLetterOrDigit = (token: string): string | null => {
    const match = token.match(/[\p{L}\p{N}]/u);
    return match?.[0] ?? null;
  };

  if (parts.length === 1) {
    const letters = Array.from(parts[0].matchAll(/[\p{L}\p{N}]/gu)).map((m) => m[0]);
    if (letters.length === 0) return "??";
    return letters.slice(0, 2).join("").toUpperCase();
  }

  const first = pickFirstLetterOrDigit(parts[0]) ?? "?";
  const second = pickFirstLetterOrDigit(parts[1]) ?? "?";
  const result = `${first}${second}`.toUpperCase();

  // Se não houve nenhum caractere útil em nenhum token, retorna ??
  if (result === "??") return "??";
  return result;
}
