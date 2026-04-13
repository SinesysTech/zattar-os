/**
 * Permission Map — Mapeamento Tool → Permissão
 *
 * Resolve qual permissão (recurso:operacao) é necessária para cada ferramenta MCP.
 * Usa convenção automática (feature→recurso + prefixo nome→operação) com overrides
 * explícitos para edge cases (Chatwoot, Dify, DRE, Conciliação).
 *
 * Lógica de resolução:
 * 1. Tool tem override explícito? → usa override
 * 2. Senão, deriva por convenção: FEATURE_TO_RECURSO[feature] + prefixo do nome
 * 3. Se recurso/operação não existem na MATRIZ_PERMISSOES → public (fallback seguro)
 */

import type { MCPToolConfig } from './types';
import { isPermissaoValida } from '@/app/(authenticated)/usuarios';

// ─── Feature → Recurso ─────────────────────────────────────────────

/** Mapeia a feature de origem da tool para o recurso da MATRIZ_PERMISSOES */
const FEATURE_TO_RECURSO: Record<string, string> = {
  processos: 'acervo',
  partes: 'clientes',
  contratos: 'contratos',
  financeiro: 'lancamentos_financeiros',
  documentos: 'documentos',
  expedientes: 'pendentes',
  audiencias: 'audiencias',
  obrigacoes: 'obrigacoes',
  rh: 'salarios',
  captura: 'captura',
  usuarios: 'usuarios',
  acervo: 'acervo',
  assistentes: 'assistentes',
  cargos: 'cargos',
  advogados: 'advogados',
  assinatura_digital: 'assinatura_digital',
  tarefas: 'projetos',
};

// Features sem recurso na MATRIZ_PERMISSOES → público
// chat, dashboard, busca_semantica, pericias

// ─── Nome → Operação ────────────────────────────────────────────────

/** Prefixos de nome de tool que mapeiam para operações do sistema de permissões */
const NAME_PREFIX_TO_OPERACAO: Array<[string, string]> = [
  ['listar_', 'listar'],
  ['buscar_', 'listar'],
  ['obter_', 'listar'],
  ['ver_', 'listar'],
  ['gerar_', 'listar'],
  ['criar_', 'criar'],
  ['atualizar_', 'editar'],
  ['editar_', 'editar'],
  ['resetar_', 'editar'],
  ['excluir_', 'deletar'],
  ['deletar_', 'deletar'],
  ['remover_', 'deletar'],
  ['confirmar_', 'confirmar'],
  ['cancelar_', 'cancelar'],
  ['estornar_', 'estornar'],
  ['conciliar_', 'conciliar'],
  ['exportar_', 'exportar'],
];

/** Nomes exatos que mapeiam para operações específicas */
const EXACT_NAME_TO_OPERACAO: Record<string, string> = {
  desconciliar: 'desconciliar',
};

function deriveOperacao(toolName: string): string | null {
  // Exact match first
  if (EXACT_NAME_TO_OPERACAO[toolName]) {
    return EXACT_NAME_TO_OPERACAO[toolName];
  }

  // Prefix match
  for (const [prefix, operacao] of NAME_PREFIX_TO_OPERACAO) {
    if (toolName.startsWith(prefix)) {
      return operacao;
    }
  }

  return null;
}

// ─── Overrides Explícitos ───────────────────────────────────────────

type PermissionOverride = { recurso: string; operacao: string } | 'public' | 'admin';

/**
 * Overrides explícitos para tools que não encaixam na convenção.
 * Chatwoot: leitura público, escrita admin
 * Dify: chat/workflow público, knowledge CRUD admin
 * Financeiro: DRE e Conciliação têm recursos próprios
 */
const PERMISSION_OVERRIDES: Record<string, PermissionOverride> = {
  // ── Chatwoot: Leitura (público) ──
  chatwoot_listar_contatos: 'public',
  chatwoot_buscar_contato: 'public',
  chatwoot_listar_labels_contato: 'public',
  chatwoot_verificar_vinculo: 'public',
  chatwoot_listar_conversas: 'public',
  chatwoot_buscar_conversas_contato: 'public',
  chatwoot_ver_mensagens: 'public',
  chatwoot_metricas_conversas: 'public',

  // ── Chatwoot: Escrita (admin) ──
  chatwoot_criar_contato: 'admin',
  chatwoot_atualizar_contato: 'admin',
  chatwoot_excluir_contato: 'admin',
  chatwoot_atualizar_labels_contato: 'admin',
  chatwoot_mesclar_contatos: 'admin',
  chatwoot_sincronizar_parte: 'admin',
  chatwoot_vincular_parte_contato: 'admin',
  chatwoot_listar_mapeamentos: 'admin',

  // ── Dify: Chat/Workflow/Leitura (público) ──
  dify_chat_enviar_mensagem: 'public',
  dify_chat_listar_conversas: 'public',
  dify_chat_obter_historico: 'public',
  dify_chat_enviar_feedback: 'public',
  dify_chat_sugestoes: 'public',
  dify_workflow_executar: 'public',
  dify_workflow_parar: 'public',
  dify_completion_gerar: 'public',
  dify_completion_parar: 'public',
  dify_app_info: 'public',
  dify_app_parametros: 'public',
  dify_conversa_renomear: 'public',
  dify_conversa_obter_variaveis: 'public',
  dify_knowledge_listar_datasets: 'public',
  dify_knowledge_buscar_dataset: 'public',
  dify_knowledge_obter_documento: 'public',
  dify_knowledge_status_embedding: 'public',

  // ── Dify: Knowledge CRUD / Anotações / Tags / Chunks (admin) ──
  dify_knowledge_criar_documento: 'admin',
  dify_knowledge_atualizar_documento_texto: 'admin',
  dify_knowledge_atualizar_status_batch: 'admin',
  dify_knowledge_deletar_documento: 'admin',
  dify_conversa_deletar: 'admin',
  dify_anotacao_listar: 'admin',
  dify_anotacao_criar: 'admin',
  dify_anotacao_atualizar: 'admin',
  dify_anotacao_deletar: 'admin',
  dify_anotacao_habilitar_reply: 'admin',
  dify_anotacao_desabilitar_reply: 'admin',
  dify_anotacao_status_reply: 'admin',
  dify_app_listar_feedbacks: 'admin',
  dify_segmento_listar: 'admin',
  dify_segmento_criar: 'admin',
  dify_segmento_atualizar: 'admin',
  dify_segmento_deletar: 'admin',
  dify_chunk_obter: 'admin',
  dify_chunk_atualizar: 'admin',
  dify_chunk_deletar: 'admin',
  dify_chunk_filho_criar: 'admin',
  dify_chunk_filho_listar: 'admin',
  dify_chunk_filho_atualizar: 'admin',
  dify_chunk_filho_deletar: 'admin',
  dify_tag_listar: 'admin',
  dify_tag_criar: 'admin',
  dify_tag_atualizar: 'admin',
  dify_tag_deletar: 'admin',
  dify_tag_vincular_dataset: 'admin',
  dify_tag_listar_dataset: 'admin',
  dify_tag_desvincular_dataset: 'admin',
  dify_workflow_listar_logs: 'admin',
  dify_modelo_listar_embedding: 'admin',

  // ── Financeiro: DRE (recurso próprio) ──
  gerar_dre: { recurso: 'dre', operacao: 'listar' },
  obter_evolucao_dre: { recurso: 'dre', operacao: 'listar' },
  exportar_dre_csv: { recurso: 'dre', operacao: 'exportar' },
  exportar_dre_pdf: { recurso: 'dre', operacao: 'exportar' },

  // ── Financeiro: Conciliação (recurso próprio) ──
  listar_transacoes: { recurso: 'conciliacao_bancaria', operacao: 'listar' },
  conciliar_manual: { recurso: 'conciliacao_bancaria', operacao: 'conciliar' },
  obter_sugestoes: { recurso: 'conciliacao_bancaria', operacao: 'listar' },
  buscar_lancamentos_candidatos: { recurso: 'conciliacao_bancaria', operacao: 'listar' },
  desconciliar: { recurso: 'conciliacao_bancaria', operacao: 'desconciliar' },
};

// ─── Resolver Principal ─────────────────────────────────────────────

export type ResolvedPermission =
  | { type: 'public' }
  | { type: 'admin' }
  | { type: 'check'; recurso: string; operacao: string };

/**
 * Resolve qual permissão é necessária para acessar uma ferramenta MCP.
 *
 * Ordem de resolução:
 * 1. tool.permissao (override na definição da tool)
 * 2. PERMISSION_OVERRIDES (override centralizado por nome)
 * 3. Convenção: FEATURE_TO_RECURSO[feature] + deriveOperacao(name)
 * 4. Fallback: public (se feature/operação não mapeiam para a MATRIZ)
 */
export function resolveToolPermission(tool: MCPToolConfig): ResolvedPermission {
  // 1. Override na definição da tool
  if (tool.permissao) {
    if (tool.permissao === 'public') return { type: 'public' };
    if (tool.permissao === 'admin') return { type: 'admin' };
    return { type: 'check', recurso: tool.permissao.recurso, operacao: tool.permissao.operacao };
  }

  // 2. Override centralizado por nome
  const override = PERMISSION_OVERRIDES[tool.name];
  if (override) {
    if (override === 'public') return { type: 'public' };
    if (override === 'admin') return { type: 'admin' };
    return { type: 'check', recurso: override.recurso, operacao: override.operacao };
  }

  // 3. Convenção: feature→recurso + nome→operação
  const recurso = FEATURE_TO_RECURSO[tool.feature];
  if (!recurso) {
    // Feature sem recurso na MATRIZ (chat, dashboard, busca_semantica, pericias)
    return { type: 'public' };
  }

  const operacao = deriveOperacao(tool.name);
  if (!operacao) {
    // Nome sem prefixo reconhecido → fallback listar (leitura)
    return { type: 'check', recurso, operacao: 'listar' };
  }

  // 4. Validar se a combinação existe na MATRIZ_PERMISSOES
  if (!isPermissaoValida(recurso, operacao)) {
    // Combinação inválida na matriz → público (fallback seguro)
    return { type: 'public' };
  }

  return { type: 'check', recurso, operacao };
}
