type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (!isPlainObject(value)) return value;
  const sorted: PlainObject = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = sortKeysDeep(value[key]);
  }
  return sorted;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  return JSON.stringify(sortKeysDeep(a)) === JSON.stringify(sortKeysDeep(b));
}

/**
 * Remove campos de controle (ids/timestamps) antes de armazenar como `dados_anteriores`
 * ou comparar mudança real de payload.
 */
export function removerCamposControle(obj: PlainObject): PlainObject {
  const { id: _unusedId, created_at: _unusedCreatedAt, updated_at: _unusedUpdatedAt, ...rest } = obj as PlainObject & {
    id?: unknown;
    created_at?: unknown;
    updated_at?: unknown;
  };
  // Suppress unused variable warnings
  void _unusedId;
  void _unusedCreatedAt;
  void _unusedUpdatedAt;
  return rest;
}

export function compararObjetos(
  novo: PlainObject,
  existente: PlainObject
): { saoIdenticos: boolean; camposAlterados: string[] } {
  const novoLimpo = removerCamposControle(novo);
  const existenteLimpo = removerCamposControle(existente);

  const chaves = new Set<string>([
    ...Object.keys(novoLimpo),
    ...Object.keys(existenteLimpo),
  ]);

  const camposAlterados: string[] = [];
  for (const key of chaves) {
    if (!deepEqual(novoLimpo[key], existenteLimpo[key])) {
      camposAlterados.push(key);
    }
  }

  return {
    saoIdenticos: camposAlterados.length === 0,
    camposAlterados,
  };
}


