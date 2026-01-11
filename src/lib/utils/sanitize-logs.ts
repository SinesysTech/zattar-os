const REDACTED = '[REDACTED]';

const CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
const CNPJ_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function shouldRedactKey(key: string): boolean {
  const k = key.toLowerCase();

  if (['password', 'senha', 'token', 'secret', 'authorization'].includes(k)) return true;

  // apiKey / api_key / api-key, private keys, bearer tokens, etc.
  if (/\b(api[_-]?key|private[_-]?key|bearer)\b/i.test(k)) return true;

  // Common key suffixes (kept intentionally narrow)
  if (k.endsWith('_token') || k.endsWith('token')) return true;
  if (k.endsWith('_secret') || k.endsWith('secret')) return true;
  if (k === 'apikey' || k === 'api_key' || k === 'api-key') return true;

  return false;
}

function maskCpfCnpj(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const prefix = digits.slice(0, 3);
  return `${prefix}***`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const prefix = (local ?? '').slice(0, 3);
  return `${prefix}***@${domain ?? ''}`;
}

function truncateString(value: string): string {
  if (value.length <= 100) return value;
  return `${value.slice(0, 100)}...`;
}

function sanitizeString(value: string): string {
  const trimmed = value.trim();

  if (/^bearer\s+/i.test(trimmed)) return REDACTED;

  if (CPF_REGEX.test(trimmed) || CNPJ_REGEX.test(trimmed)) {
    return maskCpfCnpj(trimmed);
  }

  if (EMAIL_REGEX.test(trimmed)) {
    return maskEmail(trimmed);
  }

  return truncateString(value);
}

function sanitizeValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') return sanitizeString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return '[Function]';

  if (value instanceof Date) return value.toISOString();

  if (value instanceof Error) {
    return {
      name: value.name,
      message: sanitizeString(value.message),
    };
  }

  if (typeof value === 'object') {
    const existing = seen.get(value as object);
    if (existing) return existing;

    if (Array.isArray(value)) {
      const output: unknown[] = [];
      seen.set(value, output);
      for (const item of value) {
        output.push(sanitizeValue(item, seen));
      }
      return output;
    }

    if (isPlainObject(value)) {
      const output: Record<string, unknown> = {};
      seen.set(value, output);

      for (const [key, nestedValue] of Object.entries(value)) {
        if (shouldRedactKey(key)) {
          output[key] = REDACTED;
          continue;
        }

        output[key] = sanitizeValue(nestedValue, seen);
      }

      return output;
    }

    // Fallback for non-plain objects (Map, Set, class instances...)
    try {
      return sanitizeString(String(value));
    } catch {
      return '[Unserializable]';
    }
  }

  return value;
}

export function sanitizeForLogs(data: unknown): unknown {
  return sanitizeValue(data, new WeakMap());
}
