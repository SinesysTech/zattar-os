import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Aplica filtros comuns de busca textual
 */
export function applySearchFilter(
  query: ReturnType<SupabaseClient["from"]>["select"],
  searchTerm?: string,
  columns: string[] = ["titulo"]
) {
  if (!searchTerm) return query;

  const orConditions = columns
    .map((col) => `${col}.ilike.%${searchTerm}%`)
    .join(",");
  return query.or(orConditions);
}

/**
 * Aplica paginação padrão
 */
export function applyPagination(
  query: ReturnType<SupabaseClient["from"]>["select"],
  limit = 50,
  offset = 0
) {
  return query.range(offset, offset + limit - 1);
}

/**
 * Constrói query base para documentos com usuário
 */
export function buildDocumentWithUserSelect() {
  return `
    *,
    criador:usuarios!documentos_criado_por_fkey(
      id,
      nome_completo,
      nome_exibicao,
      email_corporativo
    ),
    editor:usuarios!documentos_editado_por_fkey(
      id,
      nome_completo,
      nome_exibicao
    )
  `;
}

/**
 * Constrói query base para templates com usuário
 */
export function buildTemplateWithUserSelect() {
  return `
    *,
    criador:usuarios!templates_criado_por_fkey(
      id,
      nome_completo,
      nome_exibicao
    )
  `;
}

/**
 * Constrói query base para pastas com criador
 */
export function buildPastaWithCreatorSelect() {
  return `
    *,
    criador:usuarios!pastas_criado_por_fkey(
      id,
      nome_completo
    )
  `;
}

/**
 * Constrói query base para compartilhamentos com usuários
 */
export function buildCompartilhamentoWithUsersSelect() {
  return `
    *,
    usuario:usuarios!documentos_compartilhados_usuario_id_fkey(
      id,
      nome_completo,
      nome_exibicao,
      email_corporativo
    ),
    compartilhador:usuarios!documentos_compartilhados_compartilhado_por_fkey(
      id,
      nome_completo
    )
  `;
}

/**
 * Constrói query base para versões com criador
 */
export function buildVersaoWithCreatorSelect() {
  return `
    *,
    criador:usuarios!documentos_versoes_criado_por_fkey(
      id,
      nome_completo,
      nome_exibicao
    )
  `;
}

/**
 * Constrói query base para uploads com documento e criador
 */
export function buildUploadWithInfoSelect() {
  return `
    *,
    documento:documentos!documentos_uploads_documento_id_fkey(
      id,
      titulo
    ),
    criador:usuarios!documentos_uploads_criado_por_fkey(
      id,
      nome_completo
    )
  `;
}

/**
 * Constrói query base para arquivos com criador
 */
export function buildArquivoWithCreatorSelect() {
  return `
    *,
    criador:usuarios!arquivos_criado_por_fkey(
      id,
      nome_completo,
      nome_exibicao,
      email_corporativo
    )
  `;
}
