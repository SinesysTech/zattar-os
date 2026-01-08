import { z } from "zod";

// ============================================================================
// TIPOS BASE
// ============================================================================

export type MetodoBalanceamento =
  | "contagem_processos"
  | "round_robin"
  | "desativado";

export const METODO_BALANCEAMENTO_LABELS: Record<MetodoBalanceamento, string> =
  {
    contagem_processos: "Contagem de processos",
    round_robin: "Round-robin (alternado)",
    desativado: "Desativado (manual)",
  };

export const METODO_BALANCEAMENTO_DESCRICOES: Record<
  MetodoBalanceamento,
  string
> = {
  contagem_processos:
    "Atribui ao responsável com menos processos únicos ativos",
  round_robin: "Alterna entre os responsáveis de forma circular",
  desativado: "Não atribui automaticamente (atribuição manual)",
};

// Lista de todos os TRTs disponíveis
export const TRTS_DISPONIVEIS = [
  "TRT1",
  "TRT2",
  "TRT3",
  "TRT4",
  "TRT5",
  "TRT6",
  "TRT7",
  "TRT8",
  "TRT9",
  "TRT10",
  "TRT11",
  "TRT12",
  "TRT13",
  "TRT14",
  "TRT15",
  "TRT16",
  "TRT17",
  "TRT18",
  "TRT19",
  "TRT20",
  "TRT21",
  "TRT22",
  "TRT23",
  "TRT24",
] as const;

export type TRT = (typeof TRTS_DISPONIVEIS)[number];

// Labels para os TRTs
export const TRT_LABELS: Record<TRT, string> = {
  TRT1: "TRT1 - Rio de Janeiro",
  TRT2: "TRT2 - São Paulo",
  TRT3: "TRT3 - Minas Gerais",
  TRT4: "TRT4 - Rio Grande do Sul",
  TRT5: "TRT5 - Bahia",
  TRT6: "TRT6 - Pernambuco",
  TRT7: "TRT7 - Ceará",
  TRT8: "TRT8 - Pará/Amapá",
  TRT9: "TRT9 - Paraná",
  TRT10: "TRT10 - Distrito Federal/Tocantins",
  TRT11: "TRT11 - Amazonas/Roraima",
  TRT12: "TRT12 - Santa Catarina",
  TRT13: "TRT13 - Paraíba",
  TRT14: "TRT14 - Rondônia/Acre",
  TRT15: "TRT15 - Campinas",
  TRT16: "TRT16 - Maranhão",
  TRT17: "TRT17 - Espírito Santo",
  TRT18: "TRT18 - Goiás",
  TRT19: "TRT19 - Alagoas",
  TRT20: "TRT20 - Sergipe",
  TRT21: "TRT21 - Rio Grande do Norte",
  TRT22: "TRT22 - Piauí",
  TRT23: "TRT23 - Mato Grosso",
  TRT24: "TRT24 - Mato Grosso do Sul",
};

// ============================================================================
// INTERFACES
// ============================================================================

export interface RegiaoAtribuicao {
  id: number;
  nome: string;
  descricao: string | null;
  trts: string[];
  responsaveisIds: number[];
  metodoBalanceamento: MetodoBalanceamento;
  ativo: boolean;
  prioridade: number;
  createdAt: string;
  updatedAt: string;
  // Dados enriquecidos (joins)
  responsaveis?: ResponsavelInfo[];
}

export interface ResponsavelInfo {
  id: number;
  nomeExibicao: string;
}

// Tipo retornado pelo banco de dados (snake_case)
export interface RegiaoAtribuicaoRow {
  id: number;
  nome: string;
  descricao: string | null;
  trts: string[];
  responsaveis_ids: number[];
  metodo_balanceamento: string;
  ativo: boolean;
  prioridade: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

export const criarRegiaoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  descricao: z.string().max(500, "Descrição muito longa").optional(),
  trts: z.array(z.string()).min(1, "Selecione pelo menos um TRT"),
  responsaveisIds: z
    .array(z.number())
    .min(1, "Selecione pelo menos um responsável"),
  metodoBalanceamento: z.enum([
    "contagem_processos",
    "round_robin",
    "desativado",
  ]),
  ativo: z.boolean().default(true),
  prioridade: z.number().int().min(0).max(100).default(0),
});

export type CriarRegiaoInput = z.infer<typeof criarRegiaoSchema>;

export const atualizarRegiaoSchema = criarRegiaoSchema.partial();

export type AtualizarRegiaoInput = z.infer<typeof atualizarRegiaoSchema>;

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Converte registro do banco (snake_case) para interface (camelCase)
 */
export function mapRowToRegiao(row: RegiaoAtribuicaoRow): RegiaoAtribuicao {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    trts: row.trts,
    responsaveisIds: row.responsaveis_ids,
    metodoBalanceamento: row.metodo_balanceamento as MetodoBalanceamento,
    ativo: row.ativo,
    prioridade: row.prioridade,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Converte input do formulário para formato do banco
 */
export function mapInputToRow(
  input: CriarRegiaoInput
): Omit<RegiaoAtribuicaoRow, "id" | "created_at" | "updated_at"> {
  return {
    nome: input.nome,
    descricao: input.descricao ?? null,
    trts: input.trts,
    responsaveis_ids: input.responsaveisIds,
    metodo_balanceamento: input.metodoBalanceamento,
    ativo: input.ativo,
    prioridade: input.prioridade,
  };
}

/**
 * Formata lista de TRTs para exibição
 */
export function formatTrts(trts: string[], maxShow: number = 5): string {
  if (trts.length <= maxShow) {
    return trts.join(", ");
  }
  return `${trts.slice(0, maxShow).join(", ")} +${trts.length - maxShow}`;
}

/**
 * Verifica se um TRT está configurado em alguma região
 */
export function findRegiaoByTrt(
  regioes: RegiaoAtribuicao[],
  trt: string
): RegiaoAtribuicao | undefined {
  return regioes
    .filter((r) => r.ativo)
    .sort((a, b) => b.prioridade - a.prioridade)
    .find((r) => r.trts.includes(trt));
}
