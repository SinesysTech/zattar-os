// Utilitários para comparação de objetos antes da persistência

/**
 * Compara dois objetos e retorna os campos que foram alterados
 * Ignora campos de controle (id, created_at, updated_at, advogado_id, dados_anteriores)
 */
export function compararObjetos<T extends Record<string, unknown>>(
  objetoNovo: T,
  objetoExistente: T,
  camposIgnorados: string[] = [
    'id',
    'created_at',
    'updated_at',
    'advogado_id',
    'dados_anteriores',
  ]
): {
  saoIdenticos: boolean;
  camposAlterados: string[];
} {
  const camposAlterados: string[] = [];

  // Comparar cada campo do objeto novo com o existente
  for (const [chave, valorNovo] of Object.entries(objetoNovo)) {
    // Ignorar campos de controle
    if (camposIgnorados.includes(chave)) {
      continue;
    }

    const valorExistente = objetoExistente[chave];

    // Comparação considerando null/undefined
    const valorNovoNormalizado = normalizarValor(valorNovo);
    const valorExistenteNormalizado = normalizarValor(valorExistente);

    if (valorNovoNormalizado !== valorExistenteNormalizado) {
      camposAlterados.push(chave);
    }
  }

  return {
    saoIdenticos: camposAlterados.length === 0,
    camposAlterados,
  };
}

/**
 * Normaliza valores para comparação (trata null, undefined, strings vazias, etc)
 */
function normalizarValor(valor: unknown): string | number | boolean | null {
  if (valor === null || valor === undefined) {
    return null;
  }

  if (typeof valor === 'string') {
    return valor.trim();
  }

  if (typeof valor === 'boolean' || typeof valor === 'number') {
    return valor;
  }

  if (valor instanceof Date) {
    return valor.toISOString();
  }

  // Para objetos e arrays, converter para string JSON ordenado
  if (typeof valor === 'object') {
    return JSON.stringify(valor, Object.keys(valor).sort());
  }

  return String(valor);
}

/**
 * Remove campos de controle de um objeto para armazenar em dados_anteriores
 */
export function removerCamposControle<T extends Record<string, unknown>>(
  objeto: T,
  camposIgnorados: string[] = [
    'id',
    'created_at',
    'updated_at',
    'advogado_id',
    'dados_anteriores',
  ]
): Partial<T> {
  const resultado: Partial<T> = {};

  for (const [chave, valor] of Object.entries(objeto)) {
    if (!camposIgnorados.includes(chave)) {
      resultado[chave as keyof T] = valor as T[keyof T];
    }
  }

  return resultado;
}

