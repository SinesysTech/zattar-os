import type {
  AssistenteTipo,
  AssistenteTipoComRelacoes,
} from './domain';
import {
  criarAssistenteTipoSchema,
  atualizarAssistenteTipoSchema,
  listarAssistentesTiposSchema,
} from './domain';
import * as repository from './repository';

/**
 * ASSISTENTES-TIPOS SERVICE
 * 
 * Lógica de negócio para relacionamento entre assistentes e tipos de expedientes.
 */

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Buscar relação por ID
 */
export async function buscarPorId(id: number): Promise<AssistenteTipo | null> {
  return repository.buscarPorId(id);
}

/**
 * Buscar assistente configurado para um tipo de expediente
 */
export async function buscarAssistenteParaTipo(
  tipo_expediente_id: number
): Promise<AssistenteTipoComRelacoes | null> {
  return repository.buscarPorTipoExpediente(tipo_expediente_id);
}

/**
 * Listar todas as relações com filtros
 */
export async function listar(
  params: unknown
): Promise<{ data: AssistenteTipoComRelacoes[]; total: number }> {
  const parsedParams = listarAssistentesTiposSchema.parse(params);
  return repository.listar(parsedParams);
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

/**
 * Criar nova relação entre assistente e tipo
 */
export async function criar(
  input: unknown,
  usuario_id: number
): Promise<AssistenteTipo> {
  const parsedInput = criarAssistenteTipoSchema.parse(input);

  // Se estiver criando como ativo, verificar se já existe outro ativo
  if (parsedInput.ativo) {
    const existente = await repository.buscarPorTipoExpediente(parsedInput.tipo_expediente_id);
    if (existente && existente.ativo) {
      throw new Error(
        `Já existe um assistente ativo configurado para este tipo de expediente: ${existente.assistente_nome}`
      );
    }
  }

  return repository.criar(parsedInput, usuario_id);
}

/**
 * Atualizar relação existente
 */
export async function atualizar(
  id: number,
  input: unknown
): Promise<AssistenteTipo> {
  const parsedInput = atualizarAssistenteTipoSchema.parse(input);

  const existente = await repository.buscarPorId(id);
  if (!existente) {
    throw new Error('Relação não encontrada');
  }

  // Se estiver ativando, desativar outros do mesmo tipo
  if (parsedInput.ativo === true) {
    await repository.ativarRelacao(id, existente.tipo_expediente_id);
    return repository.buscarPorId(id) as Promise<AssistenteTipo>;
  }

  return repository.atualizar(id, parsedInput);
}

/**
 * Deletar relação
 */
export async function deletar(id: number): Promise<void> {
  const existente = await repository.buscarPorId(id);
  if (!existente) {
    throw new Error('Relação não encontrada');
  }

  return repository.deletar(id);
}

/**
 * Ativar relação específica (desativa outras do mesmo tipo)
 */
export async function ativar(id: number): Promise<void> {
  const existente = await repository.buscarPorId(id);
  if (!existente) {
    throw new Error('Relação não encontrada');
  }

  await repository.ativarRelacao(id, existente.tipo_expediente_id);
}
