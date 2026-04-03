import { z } from "zod";

// =============================================================================
// Enums / Union Types
// =============================================================================

export const STATUS_PROJETO_VALUES = [
  "planejamento",
  "ativo",
  "pausado",
  "concluido",
  "cancelado",
] as const;

export type StatusProjeto = (typeof STATUS_PROJETO_VALUES)[number];

export const STATUS_TAREFA_VALUES = [
  "a_fazer",
  "em_progresso",
  "em_revisao",
  "concluido",
  "cancelado",
] as const;

export type StatusTarefa = (typeof STATUS_TAREFA_VALUES)[number];

export const PRIORIDADE_VALUES = ["baixa", "media", "alta", "urgente"] as const;

export type Prioridade = (typeof PRIORIDADE_VALUES)[number];

export const PAPEL_PROJETO_VALUES = ["gerente", "membro", "observador"] as const;

export type PapelProjeto = (typeof PAPEL_PROJETO_VALUES)[number];

// =============================================================================
// Labels e cores para UI
// =============================================================================

export const STATUS_PROJETO_LABELS: Record<StatusProjeto, string> = {
  planejamento: "Planejamento",
  ativo: "Ativo",
  pausado: "Pausado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const STATUS_PROJETO_COLORS: Record<StatusProjeto, string> = {
  planejamento: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  ativo: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pausado: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  concluido: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  cancelado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const STATUS_TAREFA_LABELS: Record<StatusTarefa, string> = {
  a_fazer: "A Fazer",
  em_progresso: "Em Progresso",
  em_revisao: "Em Revisão",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const STATUS_TAREFA_COLORS: Record<StatusTarefa, string> = {
  a_fazer: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  em_progresso: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  em_revisao: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  concluido: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const KANBAN_COLUMNS: StatusTarefa[] = [
  "a_fazer",
  "em_progresso",
  "em_revisao",
  "concluido",
];

export const PRIORIDADE_LABELS: Record<Prioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const PRIORIDADE_COLORS: Record<Prioridade, string> = {
  baixa: "text-gray-500",
  media: "text-orange-500",
  alta: "text-red-500",
  urgente: "text-red-700",
};

export const PAPEL_PROJETO_LABELS: Record<PapelProjeto, string> = {
  gerente: "Gerente",
  membro: "Membro",
  observador: "Observador",
};

// =============================================================================
// Interfaces / Entities
// =============================================================================

export interface Projeto {
  id: string;
  nome: string;
  descricao: string | null;
  status: StatusProjeto;
  prioridade: Prioridade;
  dataInicio: string | null;
  dataPrevisaoFim: string | null;
  dataConclusao: string | null;
  clienteId: number | null;
  processoId: number | null;
  contratoId: number | null;
  responsavelId: number;
  criadoPor: number;
  orcamento: number | null;
  valorGasto: number | null;
  progresso: number;
  progressoManual: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // Joined fields (opcionais, populados em queries)
  clienteNome?: string;
  responsavelNome?: string;
  responsavelAvatar?: string | null;
  totalTarefas?: number;
  tarefasConcluidas?: number;
  membros?: MembroProjeto[];
}

export interface Tarefa {
  id: string;
  projetoId: string;
  titulo: string;
  descricao: string | null;
  status: StatusTarefa;
  prioridade: Prioridade;
  responsavelId: number | null;
  dataPrazo: string | null;
  dataConclusao: string | null;
  ordemKanban: number;
  estimativaHoras: number | null;
  horasRegistradas: number | null;
  tarefaPaiId: string | null;
  criadoPor: number;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  responsavelNome?: string;
  responsavelAvatar?: string | null;
  projetoNome?: string;
  subtarefas?: Tarefa[];
  subtarefasCount?: number;
  subtarefasConcluidas?: number;
}

export interface MembroProjeto {
  id: string;
  projetoId: string;
  usuarioId: number;
  papel: PapelProjeto;
  adicionadoEm: string;
  // Joined fields
  usuarioNome?: string;
  usuarioAvatar?: string | null;
  usuarioEmail?: string;
}

export interface Lembrete {
  id: string;
  projetoId: string | null;
  tarefaId: string | null;
  usuarioId: number;
  texto: string;
  dataHora: string;
  prioridade: Prioridade;
  concluido: boolean;
  createdAt: string;
  // Joined fields
  projetoNome?: string;
  tarefaTitulo?: string;
}

export interface Comentario {
  id: string;
  projetoId: string | null;
  tarefaId: string | null;
  usuarioId: number;
  conteudo: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  usuarioNome?: string;
  usuarioAvatar?: string | null;
}

export interface Anexo {
  id: string;
  projetoId: string | null;
  tarefaId: string | null;
  usuarioId: number;
  nomeArquivo: string;
  url: string;
  tamanhoBytes: number | null;
  tipoMime: string | null;
  createdAt: string;
  // Joined fields
  usuarioNome?: string;
}

// =============================================================================
// Dashboard types
// =============================================================================

export interface DashboardSummary {
  projetosAtivos: number;
  projetosAtivosVariacao: number;
  tarefasPendentes: number;
  tarefasPendentesVariacao: number;
  horasRegistradas: number;
  horasRegistradasVariacao: number;
  taxaConclusao: number;
  taxaConclusaoVariacao: number;
}

export interface ProjetosPorPeriodo {
  data: string;
  criados: number;
  concluidos: number;
}

export interface DistribuicaoPorStatus {
  status: StatusProjeto;
  total: number;
  fill: string;
}

export interface ComparativoAnual {
  ano: number;
  totalConcluidos: number;
}

export interface MembroAtivo {
  usuarioId: number;
  nome: string;
  avatar: string | null;
  totalTarefasConcluidas: number;
}

// =============================================================================
// Parâmetros de consulta
// =============================================================================

export interface ListarProjetosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  status?: StatusProjeto;
  prioridade?: Prioridade;
  responsavelId?: number;
  clienteId?: number;
  dataInicioDe?: string;
  dataInicioAte?: string;
  ordenarPor?: ProjetoSortBy;
  ordem?: "asc" | "desc";
}

export type ProjetoSortBy =
  | "nome"
  | "status"
  | "prioridade"
  | "data_inicio"
  | "data_previsao_fim"
  | "progresso"
  | "created_at";

export interface ListarTarefasParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  projetoId?: string;
  status?: StatusTarefa;
  prioridade?: Prioridade;
  responsavelId?: number;
  dataPrazoDe?: string;
  dataPrazoAte?: string;
  apenasMinhas?: boolean;
  ordenarPor?: TarefaSortBy;
  ordem?: "asc" | "desc";
}

export type TarefaSortBy =
  | "titulo"
  | "status"
  | "prioridade"
  | "data_prazo"
  | "ordem_kanban"
  | "created_at";

// =============================================================================
// Zod Schemas — Projeto
// =============================================================================

export const statusProjetoSchema = z.enum(STATUS_PROJETO_VALUES);
export const statusTarefaSchema = z.enum(STATUS_TAREFA_VALUES);
export const prioridadeSchema = z.enum(PRIORIDADE_VALUES);
export const papelProjetoSchema = z.enum(PAPEL_PROJETO_VALUES);

export const createProjetoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(255),
  descricao: z.string().max(5000).nullable().optional(),
  status: statusProjetoSchema.default("planejamento"),
  prioridade: prioridadeSchema.default("media"),
  dataInicio: z.string().nullable().optional(),
  dataPrevisaoFim: z.string().nullable().optional(),
  clienteId: z.number().positive().nullable().optional(),
  processoId: z.number().positive().nullable().optional(),
  contratoId: z.number().positive().nullable().optional(),
  responsavelId: z.number().positive({ message: "Responsável é obrigatório" }),
  orcamento: z.number().min(0).nullable().optional(),
  tags: z.array(z.string()).default([]),
});

export type CreateProjetoInput = z.infer<typeof createProjetoSchema>;

export const updateProjetoSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().max(5000).nullable().optional(),
  status: statusProjetoSchema.optional(),
  prioridade: prioridadeSchema.optional(),
  dataInicio: z.string().nullable().optional(),
  dataPrevisaoFim: z.string().nullable().optional(),
  dataConclusao: z.string().nullable().optional(),
  clienteId: z.number().positive().nullable().optional(),
  processoId: z.number().positive().nullable().optional(),
  contratoId: z.number().positive().nullable().optional(),
  responsavelId: z.number().positive().optional(),
  orcamento: z.number().min(0).nullable().optional(),
  valorGasto: z.number().min(0).nullable().optional(),
  progressoManual: z.number().min(0).max(100).nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateProjetoInput = z.infer<typeof updateProjetoSchema>;

// =============================================================================
// Zod Schemas — Tarefa
// =============================================================================

export const createTarefaSchema = z.object({
  projetoId: z.string().uuid("ID do projeto inválido"),
  titulo: z.string().min(1, "Título é obrigatório").max(255),
  descricao: z.string().max(5000).nullable().optional(),
  status: statusTarefaSchema.default("a_fazer"),
  prioridade: prioridadeSchema.default("media"),
  responsavelId: z.number().positive().nullable().optional(),
  dataPrazo: z.string().nullable().optional(),
  estimativaHoras: z.number().min(0).nullable().optional(),
  tarefaPaiId: z.string().uuid().nullable().optional(),
});

export type CreateTarefaInput = z.infer<typeof createTarefaSchema>;

export const updateTarefaSchema = z.object({
  titulo: z.string().min(1).max(255).optional(),
  descricao: z.string().max(5000).nullable().optional(),
  status: statusTarefaSchema.optional(),
  prioridade: prioridadeSchema.optional(),
  responsavelId: z.number().positive().nullable().optional(),
  dataPrazo: z.string().nullable().optional(),
  dataConclusao: z.string().nullable().optional(),
  estimativaHoras: z.number().min(0).nullable().optional(),
  horasRegistradas: z.number().min(0).nullable().optional(),
});

export type UpdateTarefaInput = z.infer<typeof updateTarefaSchema>;

export const updateKanbanOrderSchema = z.object({
  tarefaId: z.string().uuid(),
  status: statusTarefaSchema,
  ordemKanban: z.number().min(0),
});

export type UpdateKanbanOrderInput = z.infer<typeof updateKanbanOrderSchema>;

// =============================================================================
// Zod Schemas — Membro
// =============================================================================

export const addMembroSchema = z.object({
  projetoId: z.string().uuid("ID do projeto inválido"),
  usuarioId: z.number().positive("ID do usuário é obrigatório"),
  papel: papelProjetoSchema.default("membro"),
});

export type AddMembroInput = z.infer<typeof addMembroSchema>;

export const updateMembroSchema = z.object({
  papel: papelProjetoSchema,
});

export type UpdateMembroInput = z.infer<typeof updateMembroSchema>;

// =============================================================================
// Zod Schemas — Lembrete
// =============================================================================

export const createLembreteSchema = z.object({
  projetoId: z.string().uuid().nullable().optional(),
  tarefaId: z.string().uuid().nullable().optional(),
  texto: z.string().min(1, "Texto é obrigatório").max(1000),
  dataHora: z.string({ required_error: "Data/hora é obrigatório" }),
  prioridade: prioridadeSchema.default("media"),
});

export type CreateLembreteInput = z.infer<typeof createLembreteSchema>;

// =============================================================================
// Zod Schemas — Comentário
// =============================================================================

export const createComentarioSchema = z.object({
  projetoId: z.string().uuid().nullable().optional(),
  tarefaId: z.string().uuid().nullable().optional(),
  conteudo: z.string().min(1, "Conteúdo é obrigatório").max(5000),
});

export type CreateComentarioInput = z.infer<typeof createComentarioSchema>;

// =============================================================================
// Helpers de conversão snake_case → camelCase
// =============================================================================

export function converterParaProjeto(data: Record<string, unknown>): Projeto {
  return {
    id: data.id as string,
    nome: data.nome as string,
    descricao: (data.descricao as string) ?? null,
    status: data.status as StatusProjeto,
    prioridade: data.prioridade as Prioridade,
    dataInicio: (data.data_inicio as string) ?? null,
    dataPrevisaoFim: (data.data_previsao_fim as string) ?? null,
    dataConclusao: (data.data_conclusao as string) ?? null,
    clienteId: (data.cliente_id as number) ?? null,
    processoId: (data.processo_id as number) ?? null,
    contratoId: (data.contrato_id as number) ?? null,
    responsavelId: data.responsavel_id as number,
    criadoPor: data.criado_por as number,
    orcamento: (data.orcamento as number) ?? null,
    valorGasto: (data.valor_gasto as number) ?? null,
    progresso: (data.progresso as number) ?? 0,
    progressoManual: (data.progresso_manual as number) ?? null,
    tags: (data.tags as string[]) ?? [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    // Joined (optional)
    clienteNome: data.cliente_nome as string | undefined,
    responsavelNome: data.responsavel_nome as string | undefined,
    responsavelAvatar: data.responsavel_avatar as string | undefined,
    totalTarefas: data.total_tarefas as number | undefined,
    tarefasConcluidas: data.tarefas_concluidas as number | undefined,
  };
}

export function converterParaTarefa(data: Record<string, unknown>): Tarefa {
  return {
    id: data.id as string,
    projetoId: data.projeto_id as string,
    titulo: data.titulo as string,
    descricao: (data.descricao as string) ?? null,
    status: data.status as StatusTarefa,
    prioridade: data.prioridade as Prioridade,
    responsavelId: (data.responsavel_id as number) ?? null,
    dataPrazo: (data.data_prazo as string) ?? null,
    dataConclusao: (data.data_conclusao as string) ?? null,
    ordemKanban: (data.ordem_kanban as number) ?? 0,
    estimativaHoras: (data.estimativa_horas as number) ?? null,
    horasRegistradas: (data.horas_registradas as number) ?? null,
    tarefaPaiId: (data.tarefa_pai_id as string) ?? null,
    criadoPor: data.criado_por as number,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    responsavelNome: data.responsavel_nome as string | undefined,
    responsavelAvatar: data.responsavel_avatar as string | undefined,
    projetoNome: data.projeto_nome as string | undefined,
    subtarefasCount: data.subtarefas_count as number | undefined,
    subtarefasConcluidas: data.subtarefas_concluidas as number | undefined,
  };
}

export function converterParaMembro(data: Record<string, unknown>): MembroProjeto {
  return {
    id: data.id as string,
    projetoId: data.projeto_id as string,
    usuarioId: data.usuario_id as number,
    papel: data.papel as PapelProjeto,
    adicionadoEm: data.adicionado_em as string,
    usuarioNome: data.usuario_nome as string | undefined,
    usuarioAvatar: data.usuario_avatar as string | undefined,
    usuarioEmail: data.usuario_email as string | undefined,
  };
}

export function converterParaLembrete(data: Record<string, unknown>): Lembrete {
  return {
    id: data.id as string,
    projetoId: (data.projeto_id as string) ?? null,
    tarefaId: (data.tarefa_id as string) ?? null,
    usuarioId: data.usuario_id as number,
    texto: data.texto as string,
    dataHora: data.data_hora as string,
    prioridade: data.prioridade as Prioridade,
    concluido: data.concluido as boolean,
    createdAt: data.created_at as string,
    projetoNome: data.projeto_nome as string | undefined,
    tarefaTitulo: data.tarefa_titulo as string | undefined,
  };
}

export function converterParaComentario(data: Record<string, unknown>): Comentario {
  return {
    id: data.id as string,
    projetoId: (data.projeto_id as string) ?? null,
    tarefaId: (data.tarefa_id as string) ?? null,
    usuarioId: data.usuario_id as number,
    conteudo: data.conteudo as string,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    usuarioNome: data.usuario_nome as string | undefined,
    usuarioAvatar: data.usuario_avatar as string | undefined,
  };
}

export function converterParaAnexo(data: Record<string, unknown>): Anexo {
  return {
    id: data.id as string,
    projetoId: (data.projeto_id as string) ?? null,
    tarefaId: (data.tarefa_id as string) ?? null,
    usuarioId: data.usuario_id as number,
    nomeArquivo: data.nome_arquivo as string,
    url: data.url as string,
    tamanhoBytes: (data.tamanho_bytes as number) ?? null,
    tipoMime: (data.tipo_mime as string) ?? null,
    createdAt: data.created_at as string,
    usuarioNome: data.usuario_nome as string | undefined,
  };
}
