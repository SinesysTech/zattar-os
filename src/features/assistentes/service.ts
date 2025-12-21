import {
  findAll,
  findById,
  create,
  update,
  deleteAssistente as deleteRepo,
} from "./repository";
import {
  criarAssistenteSchema,
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
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "Código do iframe inválido"
    );
  }

  // 3. Persistir
  logger.log("Criando assistente", { usuarioId, nome: input.nome });
  return create({ ...input, criado_por: usuarioId });
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

  // 3. Sanitizar iframe_code se fornecido
  if (input.iframe_code) {
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
