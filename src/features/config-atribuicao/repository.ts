/**
 * CONFIG-ATRIBUICAO REPOSITORY - Camada de Persistência
 * CRUD para configuração de regiões de atribuição automática
 */

import "server-only";

import { createDbClient } from "@/lib/supabase";
import { Result, ok, err, appError } from "@/types";
import type {
  RegiaoAtribuicao,
  RegiaoAtribuicaoRow,
  CriarRegiaoInput,
  AtualizarRegiaoInput,
  ResponsavelInfo,
} from "./domain";
import { mapRowToRegiao, mapInputToRow } from "./domain";

const TABLE_CONFIG = "config_regioes_atribuicao";

// ============================================================================
// LISTAR REGIÕES
// ============================================================================

export async function findAllRegioes(): Promise<Result<RegiaoAtribuicao[]>> {
  const supabase = await createDbClient();

  const { data, error } = await supabase
    .from(TABLE_CONFIG)
    .select("*")
    .order("prioridade", { ascending: false })
    .order("nome", { ascending: true });

  if (error) {
    return err(appError("DATABASE_ERROR", `Erro ao listar regiões: ${error.message}`));
  }

  const rows = data as RegiaoAtribuicaoRow[];
  const regioes = rows.map(mapRowToRegiao);

  // Buscar nomes dos responsáveis
  const allResponsaveisIds = [
    ...new Set(regioes.flatMap((r) => r.responsaveisIds)),
  ];

  if (allResponsaveisIds.length > 0) {
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("id, nome_exibicao")
      .in("id", allResponsaveisIds);

    if (usuarios) {
      const usuariosMap = new Map<number, string>(
        usuarios.map((u) => [u.id, u.nome_exibicao])
      );

      for (const regiao of regioes) {
        regiao.responsaveis = regiao.responsaveisIds
          .map((id) => ({
            id,
            nomeExibicao: usuariosMap.get(id) ?? `Usuário ${id}`,
          }))
          .filter((r): r is ResponsavelInfo => r !== undefined);
      }
    }
  }

  return ok(regioes);
}

// ============================================================================
// OBTER REGIÃO POR ID
// ============================================================================

export async function findRegiaoById(
  id: number
): Promise<Result<RegiaoAtribuicao | null>> {
  const supabase = await createDbClient();

  const { data, error } = await supabase
    .from(TABLE_CONFIG)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return ok(null);
    }
    return err(appError("DATABASE_ERROR", `Erro ao buscar região: ${error.message}`));
  }

  const regiao = mapRowToRegiao(data as RegiaoAtribuicaoRow);

  // Buscar nomes dos responsáveis
  if (regiao.responsaveisIds.length > 0) {
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("id, nome_exibicao")
      .in("id", regiao.responsaveisIds);

    if (usuarios) {
      regiao.responsaveis = usuarios.map((u) => ({
        id: u.id,
        nomeExibicao: u.nome_exibicao,
      }));
    }
  }

  return ok(regiao);
}

// ============================================================================
// CRIAR REGIÃO
// ============================================================================

export async function createRegiao(
  input: CriarRegiaoInput
): Promise<Result<RegiaoAtribuicao>> {
  const supabase = await createDbClient();

  const rowData = mapInputToRow(input);

  const { data, error } = await supabase
    .from(TABLE_CONFIG)
    .insert(rowData)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return err(appError("VALIDATION_ERROR", `Já existe uma região com o nome "${input.nome}"`));
    }
    return err(appError("DATABASE_ERROR", `Erro ao criar região: ${error.message}`));
  }

  return ok(mapRowToRegiao(data as RegiaoAtribuicaoRow));
}

// ============================================================================
// ATUALIZAR REGIÃO
// ============================================================================

export async function updateRegiao(
  id: number,
  input: AtualizarRegiaoInput
): Promise<Result<RegiaoAtribuicao>> {
  const supabase = await createDbClient();

  // Montar objeto de atualização apenas com campos fornecidos
  const updateData: Record<string, unknown> = {};

  if (input.nome !== undefined) updateData.nome = input.nome;
  if (input.descricao !== undefined) updateData.descricao = input.descricao;
  if (input.trts !== undefined) updateData.trts = input.trts;
  if (input.responsaveisIds !== undefined)
    updateData.responsaveis_ids = input.responsaveisIds;
  if (input.metodoBalanceamento !== undefined)
    updateData.metodo_balanceamento = input.metodoBalanceamento;
  if (input.ativo !== undefined) updateData.ativo = input.ativo;
  if (input.prioridade !== undefined) updateData.prioridade = input.prioridade;

  const { data, error } = await supabase
    .from(TABLE_CONFIG)
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return err(appError("VALIDATION_ERROR", `Já existe uma região com este nome`));
    }
    if (error.code === "PGRST116") {
      return err(appError("NOT_FOUND", "Região não encontrada"));
    }
    return err(
      appError("DATABASE_ERROR", `Erro ao atualizar região: ${error.message}`)
    );
  }

  return ok(mapRowToRegiao(data as RegiaoAtribuicaoRow));
}

// ============================================================================
// EXCLUIR REGIÃO
// ============================================================================

export async function deleteRegiao(id: number): Promise<Result<boolean>> {
  const supabase = await createDbClient();

  const { error } = await supabase.from(TABLE_CONFIG).delete().eq("id", id);

  if (error) {
    return err(appError("DATABASE_ERROR", `Erro ao excluir região: ${error.message}`));
  }

  return ok(true);
}

// ============================================================================
// ALTERNAR STATUS ATIVO
// ============================================================================

export async function toggleRegiaoAtivo(
  id: number,
  ativo: boolean
): Promise<Result<RegiaoAtribuicao>> {
  return updateRegiao(id, { ativo });
}
