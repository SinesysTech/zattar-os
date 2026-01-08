/**
 * CONFIG-ATRIBUICAO SERVICE - Camada de Negócio
 * Lógica de negócio para configuração de atribuição automática
 */

import "server-only";

import { Result, ok, err, appError } from "@/types";
import type {
  RegiaoAtribuicao,
  CriarRegiaoInput,
  AtualizarRegiaoInput,
} from "./domain";
import { criarRegiaoSchema, atualizarRegiaoSchema, TRTS_DISPONIVEIS } from "./domain";
import * as repository from "./repository";

// ============================================================================
// LISTAR REGIÕES
// ============================================================================

export async function listarRegioes(): Promise<Result<RegiaoAtribuicao[]>> {
  return repository.findAllRegioes();
}

// ============================================================================
// OBTER REGIÃO
// ============================================================================

export async function obterRegiao(
  id: number
): Promise<Result<RegiaoAtribuicao | null>> {
  if (!id || id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID da região inválido"));
  }
  return repository.findRegiaoById(id);
}

// ============================================================================
// CRIAR REGIÃO
// ============================================================================

export async function criarRegiao(
  input: CriarRegiaoInput
): Promise<Result<RegiaoAtribuicao>> {
  // Validar input com Zod
  const validacao = criarRegiaoSchema.safeParse(input);
  if (!validacao.success) {
    const mensagem = validacao.error.errors.map((e) => e.message).join(", ");
    return err(appError("VALIDATION_ERROR", mensagem));
  }

  // Validar TRTs
  const trtsInvalidos = input.trts.filter(
    (trt) => !TRTS_DISPONIVEIS.includes(trt as typeof TRTS_DISPONIVEIS[number])
  );
  if (trtsInvalidos.length > 0) {
    return err(
      appError("VALIDATION_ERROR", `TRTs inválidos: ${trtsInvalidos.join(", ")}`)
    );
  }

  return repository.createRegiao(validacao.data);
}

// ============================================================================
// ATUALIZAR REGIÃO
// ============================================================================

export async function atualizarRegiao(
  id: number,
  input: AtualizarRegiaoInput
): Promise<Result<RegiaoAtribuicao>> {
  if (!id || id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID da região inválido"));
  }

  // Validar input com Zod
  const validacao = atualizarRegiaoSchema.safeParse(input);
  if (!validacao.success) {
    const mensagem = validacao.error.errors.map((e) => e.message).join(", ");
    return err(appError("VALIDATION_ERROR", mensagem));
  }

  // Validar TRTs se fornecidos
  if (input.trts) {
    const trtsInvalidos = input.trts.filter(
      (trt) => !TRTS_DISPONIVEIS.includes(trt as typeof TRTS_DISPONIVEIS[number])
    );
    if (trtsInvalidos.length > 0) {
      return err(
        appError("VALIDATION_ERROR", `TRTs inválidos: ${trtsInvalidos.join(", ")}`)
      );
    }
  }

  // Verificar se região existe
  const regiaoExistente = await repository.findRegiaoById(id);
  if (!regiaoExistente.success) {
    return err(regiaoExistente.error);
  }
  if (!regiaoExistente.data) {
    return err(appError("NOT_FOUND", "Região não encontrada"));
  }

  return repository.updateRegiao(id, validacao.data);
}

// ============================================================================
// EXCLUIR REGIÃO
// ============================================================================

export async function excluirRegiao(id: number): Promise<Result<boolean>> {
  if (!id || id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID da região inválido"));
  }

  // Verificar se região existe
  const regiaoExistente = await repository.findRegiaoById(id);
  if (!regiaoExistente.success) {
    return err(regiaoExistente.error);
  }
  if (!regiaoExistente.data) {
    return err(appError("NOT_FOUND", "Região não encontrada"));
  }

  return repository.deleteRegiao(id);
}

// ============================================================================
// ALTERNAR STATUS ATIVO
// ============================================================================

export async function alternarStatusRegiao(
  id: number,
  ativo: boolean
): Promise<Result<RegiaoAtribuicao>> {
  if (!id || id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID da região inválido"));
  }

  return repository.toggleRegiaoAtivo(id, ativo);
}

// ============================================================================
// VERIFICAR CONFLITOS DE TRT
// ============================================================================

/**
 * Verifica se há TRTs configurados em múltiplas regiões ativas
 * Retorna lista de conflitos para alerta ao usuário
 */
export async function verificarConflitos(): Promise<
  Result<{ trt: string; regioes: string[] }[]>
> {
  const regioes = await repository.findAllRegioes();
  if (!regioes.success) {
    return err(regioes.error);
  }

  const regioesAtivas = regioes.data.filter((r) => r.ativo);
  const trtMap = new Map<string, string[]>();

  for (const regiao of regioesAtivas) {
    for (const trt of regiao.trts) {
      const regioesTrt = trtMap.get(trt) ?? [];
      regioesTrt.push(regiao.nome);
      trtMap.set(trt, regioesTrt);
    }
  }

  const conflitos: { trt: string; regioes: string[] }[] = [];
  for (const [trt, regioesTrt] of trtMap) {
    if (regioesTrt.length > 1) {
      conflitos.push({ trt, regioes: regioesTrt });
    }
  }

  return ok(conflitos);
}
