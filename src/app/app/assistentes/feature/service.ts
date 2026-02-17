import {
  findAll,
  findById,
  findByDifyAppId,
  create,
  createDify,
  update,
  deleteAssistente as deleteRepo,
  deleteByDifyAppId,
} from "./repository";
import {
  criarAssistenteSchema,
  criarAssistenteDifySchema,
  atualizarAssistenteSchema,
  Assistente,
  AssistentesParams,
  AtualizarAssistenteInput,
} from "./domain";
import { sanitizarIframeCode } from "./utils";

export const logger = {
  log: (msg: string, ...args: unknown[]) => console.log(msg, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(msg, ...args),
};

export async function listarAssistentes(
  params: AssistentesParams
): Promise<Assistente[]> {
  return findAll(params);
}

export async function buscarAssistentePorId(
  id: number
): Promise<Assistente | null> {
  return findById(id);
}

export async function buscarAssistentePorDifyAppId(
  difyAppId: string
): Promise<Assistente | null> {
  return findByDifyAppId(difyAppId);
}

export async function criarAssistente(
  data: unknown,
  usuarioId: number
): Promise<Assistente> {
  // 1. Validar entrada
  const parsed = criarAssistenteSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Dados inválidos: ${parsed.error.message}`);
  }

  const input = parsed.data;

  // 2. Sanitizar iframe_code
  try {
    input.iframe_code = sanitizarIframeCode(input.iframe_code);
  } catch (_e) {
    throw new Error("Código do iframe inválido");
  }

  // 3. Persistir
  logger.log("Criando assistente iframe", { usuarioId, nome: input.nome });
  return create({ ...input, criado_por: usuarioId });
}

/**
 * Cria um assistente nativo vinculado a um app Dify.
 * Chamado automaticamente quando um app Dify é criado em Configurações.
 */
export async function criarAssistenteDify(
  data: { nome: string; descricao?: string | null; dify_app_id: string },
  usuarioId: number
): Promise<Assistente> {
  const parsed = criarAssistenteDifySchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Dados inválidos para assistente Dify: ${parsed.error.message}`);
  }

  // Verificar se já existe um assistente para este app
  const existente = await findByDifyAppId(data.dify_app_id);
  if (existente) {
    logger.log("Assistente Dify já existe, atualizando", { dify_app_id: data.dify_app_id });
    return update(existente.id, { nome: data.nome, descricao: data.descricao });
  }

  logger.log("Criando assistente Dify", { usuarioId, nome: data.nome, dify_app_id: data.dify_app_id });
  return createDify({ ...parsed.data, criado_por: usuarioId });
}

/**
 * Remove o assistente vinculado a um app Dify.
 * Chamado automaticamente quando um app Dify é deletado em Configurações.
 */
export async function deletarAssistentePorDifyApp(difyAppId: string): Promise<boolean> {
  logger.log("Deletando assistente vinculado ao Dify app", { dify_app_id: difyAppId });
  return deleteByDifyAppId(difyAppId);
}

/**
 * Sincroniza nome/status do assistente quando o app Dify é atualizado.
 */
export async function sincronizarAssistenteDify(
  difyAppId: string,
  data: { nome?: string; ativo?: boolean }
): Promise<Assistente | null> {
  const assistente = await findByDifyAppId(difyAppId);
  if (!assistente) return null;

  const updateData: AtualizarAssistenteInput = {};
  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.ativo !== undefined) updateData.ativo = data.ativo;

  if (Object.keys(updateData).length === 0) return assistente;

  logger.log("Sincronizando assistente Dify", { dify_app_id: difyAppId, ...updateData });
  return update(assistente.id, updateData);
}

export async function atualizarAssistente(
  id: number,
  data: unknown
): Promise<Assistente> {
  // 1. Verificar existência
  const existing = await findById(id);
  if (!existing) {
    throw new Error("Assistente não encontrado");
  }

  // 2. Validar entrada
  const parsed = atualizarAssistenteSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Dados inválidos: ${parsed.error.message}`);
  }

  const input = parsed.data;

  // 3. Sanitizar iframe_code se fornecido (só para tipo iframe)
  if (input.iframe_code && existing.tipo === "iframe") {
    try {
      input.iframe_code = sanitizarIframeCode(input.iframe_code);
    } catch (e) {
      throw new Error(
        e instanceof Error ? e.message : "Código do iframe inválido"
      );
    }
  }

  // 4. Persistir
  logger.log("Atualizando assistente", { id });
  return update(id, input as AtualizarAssistenteInput);
}

export async function deletarAssistente(id: number): Promise<boolean> {
  // 1. Verificar existência
  const existing = await findById(id);
  if (!existing) {
    return false;
  }

  // 2. Deletar
  logger.log("Deletando assistente", { id });
  return deleteRepo(id);
}
