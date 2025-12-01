/**
 * Serviço de negócio para criação de pastas
 *
 * Adiciona validações de negócio antes de chamar a persistência.
 */

import {
  criarPasta as criarPastaPersistence,
  buscarPastaPorId,
} from '../persistence/pastas-persistence.service';
import type { Pasta, CriarPastaParams } from '@/backend/types/documentos/types';

/**
 * Valida os parâmetros de criação de pasta
 */
function validarParametros(params: CriarPastaParams): void {
  // Validação de nome (1-200 chars)
  if (!params.nome || params.nome.trim().length === 0) {
    throw new Error('Nome da pasta é obrigatório');
  }

  if (params.nome.length > 200) {
    throw new Error('Nome da pasta deve ter no máximo 200 caracteres');
  }

  // Validação de tipo (comum/privada)
  if (params.tipo && !['comum', 'privada'].includes(params.tipo)) {
    throw new Error('Tipo de pasta inválido. Use "comum" ou "privada"');
  }

  // Validação de cor (hex color)
  if (params.cor && !/^#[0-9A-Fa-f]{6}$/.test(params.cor)) {
    throw new Error('Cor inválida. Use formato hexadecimal (#RRGGBB)');
  }
}

/**
 * Valida a hierarquia para evitar ciclos
 * (A pasta pai não pode ser filha da pasta sendo criada)
 */
async function validarHierarquia(pastaPaiId: number | null): Promise<void> {
  if (!pastaPaiId) return;

  // Verificar se a pasta pai existe
  const pastaPai = await buscarPastaPorId(pastaPaiId);
  if (!pastaPai) {
    throw new Error('Pasta pai não encontrada');
  }

  // Verificar se não foi deletada
  if (pastaPai.deleted_at) {
    throw new Error('Pasta pai está na lixeira');
  }
}

/**
 * Cria uma nova pasta com validações de negócio
 */
export async function criarPasta(
  params: CriarPastaParams,
  usuarioId: number
): Promise<Pasta> {
  // Validar parâmetros
  validarParametros(params);

  // Validar hierarquia
  await validarHierarquia(params.pasta_pai_id ?? null);

  // Normalizar nome
  const paramsNormalizados: CriarPastaParams = {
    ...params,
    nome: params.nome.trim(),
  };

  // Criar pasta via persistência
  return await criarPastaPersistence(paramsNormalizados, usuarioId);
}
