/**
 * KANBAN SERVICE
 *
 * Regras de negócio e aggregation cross-module para o Kanban multi-board.
 * Segue o mesmo padrão de `features/calendar/service.ts`.
 */

import { z } from "zod";
import { appError, err, ok, Result } from "@/types";
import type {
  CreateKanbanColumnInput,
  CreateKanbanTaskInput,
  KanbanAssignableUser,
  KanbanBoardData,
  KanbanBoardDef,
  KanbanBoardSource,
  KanbanColumn,
  KanbanTask,
  SyncKanbanBoardInput,
  SystemBoardData,
  UnifiedKanbanCard,
  AtualizarStatusEntidadeInput,
} from "./domain";
import {
  createKanbanColumnSchema,
  createKanbanTaskSchema,
  kanbanBoardSchema,
  syncKanbanBoardSchema,
  SYSTEM_BOARDS,
  SYSTEM_BOARD_COLUMNS,
  buildKanbanCardId,
} from "./domain";
import * as repo from "./repository";

// --- Cross-module imports (mesmo padrão de calendar/service.ts) ---
import type { Audiencia } from "@/features/audiencias";
import { listarAudiencias, StatusAudiencia } from "@/features/audiencias";
import { atualizarStatusAudiencia } from "@/features/audiencias/service";

import type { Expediente } from "@/features/expedientes";
import { listarExpedientes } from "@/features/expedientes";
import { realizarBaixa as realizarBaixaExpediente } from "@/features/expedientes/service";

import type { AcordoComParcelas } from "@/features/obrigacoes";
import { listarAcordos } from "@/features/obrigacoes/service";

// =============================================================================
// HELPERS
// =============================================================================

function validate<T>(schema: z.ZodSchema, input: unknown): Result<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return err(appError("VALIDATION_ERROR", parsed.error.errors[0]?.message || "Dados inválidos"));
  }
  return ok(parsed.data as T);
}

const DEFAULT_COLUMNS: Array<{ title: string; position: number }> = [
  { title: "Backlog", position: 0 },
  { title: "Em andamento", position: 1 },
  { title: "Concluído", position: 2 },
];

// =============================================================================
// BOARD LISTING
// =============================================================================

/**
 * Lista todos os quadros do usuário: system boards (constantes) + custom boards (DB).
 * System boards são criados lazily no DB se ainda não existirem.
 */
export async function listarQuadros(usuarioId: number): Promise<Result<KanbanBoardDef[]>> {
  const dbBoards = await repo.listBoards(usuarioId);
  if (!dbBoards.success) return err(dbBoards.error);

  const existing = dbBoards.data;
  const allBoards: KanbanBoardDef[] = [];

  // Garantir que system boards existem no DB (lazy creation)
  for (let i = 0; i < SYSTEM_BOARDS.length; i++) {
    const sb = SYSTEM_BOARDS[i];
    const found = existing.find((b) => b.tipo === "system" && b.source === sb.source);
    if (found) {
      allBoards.push(found);
    } else {
      const created = await repo.createBoard(usuarioId, sb.titulo, "system", sb.source!, i);
      if (created.success) {
        allBoards.push(created.data);
      }
    }
  }

  // Adicionar custom boards
  const customBoards = existing.filter((b) => b.tipo === "custom");
  allBoards.push(...customBoards);

  return ok(allBoards);
}

// =============================================================================
// CUSTOM BOARD OPERATIONS (evolução do código original)
// =============================================================================

async function ensureDefaultColumns(usuarioId: number, boardId?: string): Promise<Result<KanbanColumn[]>> {
  const cols = await repo.listColumns(usuarioId, boardId);
  if (!cols.success) return err(cols.error);
  if (cols.data.length > 0) return ok(cols.data);

  const created: KanbanColumn[] = [];
  for (const c of DEFAULT_COLUMNS) {
    const r = await repo.createColumn(usuarioId, c.title, c.position, boardId);
    if (!r.success) return err(r.error);
    created.push(r.data);
  }
  return ok(created);
}

/** Obtém dados de um board custom (com colunas e tarefas). */
export async function obterQuadroCustom(usuarioId: number, boardId?: string): Promise<Result<KanbanBoardData>> {
  const colsResult = await ensureDefaultColumns(usuarioId, boardId);
  if (!colsResult.success) return err(colsResult.error);
  const columns = colsResult.data;

  const tasksResult = boardId
    ? await repo.listTasksByBoard(usuarioId, boardId)
    : await repo.listTasks(usuarioId);
  if (!tasksResult.success) return err(tasksResult.error);

  const tasksByColumn: Record<string, KanbanBoardData["tasksByColumn"][string]> = {};
  for (const col of columns) {
    tasksByColumn[col.id] = [];
  }
  for (const item of tasksResult.data) {
    if (!tasksByColumn[item.columnId]) tasksByColumn[item.columnId] = [];
    tasksByColumn[item.columnId].push(item.task);
  }

  const board: KanbanBoardData = { columns, tasksByColumn };
  const parsed = kanbanBoardSchema.safeParse(board);
  if (!parsed.success) {
    return err(appError("VALIDATION_ERROR", "Dados de kanban inválidos"));
  }

  return ok(parsed.data);
}

/** Retrocompatibilidade — alias para obterQuadroCustom sem boardId. */
export async function obterKanban(usuarioId: number): Promise<Result<KanbanBoardData>> {
  return obterQuadroCustom(usuarioId);
}

export async function criarQuadroCustom(
  usuarioId: number,
  titulo: string
): Promise<Result<KanbanBoardDef>> {
  if (!titulo.trim()) {
    return err(appError("VALIDATION_ERROR", "Título é obrigatório."));
  }
  const boards = await repo.listBoards(usuarioId);
  if (!boards.success) return err(boards.error);
  const nextOrdem = boards.data.length;
  return repo.createBoard(usuarioId, titulo.trim(), "custom", null, nextOrdem);
}

export async function excluirQuadroCustom(usuarioId: number, boardId: string): Promise<Result<void>> {
  if (!boardId) return err(appError("VALIDATION_ERROR", "Board ID é obrigatório."));
  return repo.deleteBoard(usuarioId, boardId);
}

export async function criarColuna(usuarioId: number, input: CreateKanbanColumnInput, boardId?: string): Promise<Result<KanbanColumn>> {
  const val = validate<CreateKanbanColumnInput>(createKanbanColumnSchema, input);
  if (!val.success) return err(val.error);

  const cols = await repo.listColumns(usuarioId, boardId);
  if (!cols.success) return err(cols.error);
  const nextPos = cols.data.length;

  return repo.createColumn(usuarioId, val.data.title, nextPos, boardId);
}

export async function criarTarefa(usuarioId: number, input: CreateKanbanTaskInput): Promise<Result<{ columnId: string; task: KanbanTask }>> {
  const val = validate<CreateKanbanTaskInput>(createKanbanTaskSchema, input);
  if (!val.success) return err(val.error);
  return repo.createTask(usuarioId, val.data);
}

export async function sincronizarKanban(usuarioId: number, input: SyncKanbanBoardInput): Promise<Result<void>> {
  const val = validate<SyncKanbanBoardInput>(syncKanbanBoardSchema, input);
  if (!val.success) return err(val.error);
  return repo.upsertBoardLayout(usuarioId, val.data);
}

export async function listarUsuariosParaAtribuicao(): Promise<Result<KanbanAssignableUser[]>> {
  const result = await repo.listAssignableUsers();
  if (!result.success) return err(result.error);
  return ok(result.data);
}

export async function excluirColuna(usuarioId: number, columnId: string): Promise<Result<void>> {
  if (!columnId || typeof columnId !== "string") {
    return err(appError("VALIDATION_ERROR", "Coluna inválida."));
  }
  return repo.deleteColumn(usuarioId, columnId);
}

// =============================================================================
// SYSTEM BOARD — CONVERTER FUNCTIONS
// (mesmo padrão de audienciaToUnifiedEvent em calendar/service.ts)
// =============================================================================

function expedienteToKanbanCard(exp: Expediente, position: number): UnifiedKanbanCard {
  // Determinar coluna baseado no status
  let columnId: string;
  if (exp.baixadoEm) {
    columnId = "exp-baixado";
  } else if (exp.prazoVencido) {
    columnId = "exp-vencido";
  } else {
    columnId = "exp-pendente";
  }

  // Cor baseada no status (mesmo padrão do calendar)
  let color: string;
  if (exp.baixadoEm) {
    color = "emerald";
  } else if (exp.prazoVencido) {
    color = "rose";
  } else {
    color = "amber";
  }

  const classe = exp.classeJudicial ? ` (${exp.classeJudicial})` : "";
  const titulo = `${exp.numeroProcesso}${classe}`;

  return {
    id: buildKanbanCardId("expedientes", exp.id),
    titulo,
    descricao: exp.nomeParteAutora
      ? `${exp.nomeParteAutora} x ${exp.nomeParteRe ?? "—"}`
      : undefined,
    dataVencimento: exp.dataPrazoLegalParte ?? undefined,
    prazoVencido: exp.prazoVencido ?? false,
    responsavelId: exp.responsavelId ?? null,
    source: "expedientes",
    sourceEntityId: exp.id,
    url: `/app/expedientes?expedienteId=${exp.id}`,
    columnId,
    position,
    color,
    metadata: {
      processoId: exp.processoId,
      numeroProcesso: exp.numeroProcesso,
      trt: exp.trt,
      grau: exp.grau,
      tipoExpedienteId: exp.tipoExpedienteId,
      origem: exp.origem,
      nomeParteAutora: exp.nomeParteAutora,
      nomeParteRe: exp.nomeParteRe,
    },
  };
}

function audienciaToKanbanCard(aud: Audiencia, position: number): UnifiedKanbanCard {
  // Determinar coluna baseado no status
  const statusColumnMap: Record<string, string> = {
    [StatusAudiencia.Marcada]: "aud-marcada",
    [StatusAudiencia.Finalizada]: "aud-finalizada",
    [StatusAudiencia.Cancelada]: "aud-cancelada",
  };
  const columnId = statusColumnMap[aud.status] ?? "aud-marcada";

  // Cor baseada no status
  let color: string;
  if (aud.status === StatusAudiencia.Finalizada) {
    color = "emerald";
  } else if (aud.status === StatusAudiencia.Cancelada) {
    color = "rose";
  } else {
    color = "sky";
  }

  const tipo = aud.tipoDescricao ? ` (${aud.tipoDescricao})` : "";
  const titulo = `${aud.numeroProcesso}${tipo}`;

  return {
    id: buildKanbanCardId("audiencias", aud.id),
    titulo,
    descricao: aud.poloAtivoNome
      ? `${aud.poloAtivoNome} x ${aud.poloPassivoNome ?? "—"}`
      : undefined,
    dataVencimento: aud.dataInicio ?? undefined,
    responsavelId: aud.responsavelId ?? null,
    source: "audiencias",
    sourceEntityId: aud.id,
    url: `/app/audiencias/semana?audienciaId=${aud.id}`,
    columnId,
    position,
    color,
    metadata: {
      processoId: aud.processoId,
      numeroProcesso: aud.numeroProcesso,
      trt: aud.trt,
      grau: aud.grau,
      status: aud.status,
      modalidade: aud.modalidade,
      dataInicio: aud.dataInicio,
      dataFim: aud.dataFim,
    },
  };
}

function acordoParcelasToKanbanCards(acordo: AcordoComParcelas): UnifiedKanbanCard[] {
  const parcelas = acordo.parcelas ?? [];
  const numeroProcesso =
    acordo.processo?.numero_processo ?? "—";

  return parcelas.map((parcela, index) => {
    // Determinar coluna baseado no status da parcela
    let columnId: string;
    const status = String(parcela.status ?? "pendente").toLowerCase();
    if (status === "atrasada" || status === "vencida") {
      columnId = "obr-atrasada";
    } else if (status === "recebida" || status === "paga" || status === "pago_total") {
      columnId = "obr-paga";
    } else {
      columnId = "obr-pendente";
    }

    // Cor baseada no status
    let color: string;
    if (status === "atrasada" || status === "vencida") {
      color = "rose";
    } else if (status === "recebida" || status === "paga" || status === "pago_total") {
      color = "emerald";
    } else {
      color = "amber";
    }

    return {
      id: buildKanbanCardId("obrigacoes", `${acordo.id}-${parcela.id}`),
      titulo: `Parcela ${parcela.numeroParcela} — ${numeroProcesso}`,
      dataVencimento: parcela.dataVencimento ?? undefined,
      prazoVencido: status === "atrasada" || status === "vencida",
      source: "obrigacoes" as const,
      sourceEntityId: acordo.id,
      url: `/app/acordos-condenacoes?acordoId=${acordo.id}`,
      columnId,
      position: index,
      color,
      metadata: {
        acordoId: acordo.id,
        parcelaId: parcela.id,
        numeroParcela: parcela.numeroParcela,
        processoId: acordo.processoId,
        numeroProcesso,
        status: parcela.status,
        valor: parcela.valorBrutoCreditoPrincipal,
      },
    };
  });
}

// =============================================================================
// SYSTEM BOARD — FETCHER FUNCTIONS
// (mesmo padrão de fetchAudiencias/fetchExpedientes em calendar/service.ts)
// =============================================================================

const MAX_PAGES = 10;
const PAGE_SIZE = 100;

async function fetchExpedientesParaKanban(): Promise<UnifiedKanbanCard[]> {
  const cards: UnifiedKanbanCard[] = [];
  let pagina = 1;
  let hasMore = true;

  try {
    while (hasMore && pagina <= MAX_PAGES) {
      const result = await listarExpedientes({
        pagina,
        limite: PAGE_SIZE,
        ordenarPor: "data_prazo_legal_parte",
        ordem: "asc",
      });

      if (!result.success || !result.data) break;

      const items = result.data.data;
      for (const exp of items) {
        cards.push(expedienteToKanbanCard(exp as Expediente, cards.length));
      }

      hasMore = items.length === PAGE_SIZE;
      pagina++;
    }
  } catch {
    // Silently return partial results (same as calendar)
  }

  return cards;
}

async function fetchAudienciasParaKanban(): Promise<UnifiedKanbanCard[]> {
  const cards: UnifiedKanbanCard[] = [];
  let pagina = 1;
  let hasMore = true;

  try {
    while (hasMore && pagina <= MAX_PAGES) {
      const result = await listarAudiencias({
        pagina,
        limite: PAGE_SIZE,
        ordenarPor: "dataInicio",
        ordem: "asc",
      });

      if (!result.success || !result.data) break;

      const items = result.data.data;
      for (const aud of items) {
        cards.push(audienciaToKanbanCard(aud as Audiencia, cards.length));
      }

      hasMore = items.length === PAGE_SIZE;
      pagina++;
    }
  } catch {
    // Silently return partial results
  }

  return cards;
}

async function fetchObrigacoesParaKanban(): Promise<UnifiedKanbanCard[]> {
  const cards: UnifiedKanbanCard[] = [];

  try {
    const result = await listarAcordos({ limite: 1000 });
    const acordos = result?.acordos ?? [];
    for (const acordo of acordos) {
      cards.push(...acordoParcelasToKanbanCards(acordo));
    }
  } catch {
    // Silently return partial results
  }

  return cards;
}

// =============================================================================
// SYSTEM BOARD — MAIN AGGREGATOR
// =============================================================================

/** Obtém dados de um system board (Expedientes, Audiências ou Obrigações). */
export async function obterQuadroSistema(
  source: KanbanBoardSource
): Promise<Result<SystemBoardData>> {
  const columns = SYSTEM_BOARD_COLUMNS[source];
  if (!columns) {
    return err(appError("VALIDATION_ERROR", `Source '${source}' não reconhecida.`));
  }

  const fetchers: Record<KanbanBoardSource, () => Promise<UnifiedKanbanCard[]>> = {
    expedientes: fetchExpedientesParaKanban,
    audiencias: fetchAudienciasParaKanban,
    obrigacoes: fetchObrigacoesParaKanban,
  };

  const cards = await fetchers[source]();

  // Distribuir cards nas colunas
  const cardsByColumn: Record<string, UnifiedKanbanCard[]> = {};
  for (const col of columns) {
    cardsByColumn[col.id] = [];
  }
  for (const card of cards) {
    if (cardsByColumn[card.columnId]) {
      cardsByColumn[card.columnId].push(card);
    }
  }

  return ok({ columns, cardsByColumn });
}

// =============================================================================
// BIDIRECTIONAL DnD — ATUALIZAR STATUS DA ENTIDADE DE ORIGEM
// =============================================================================

/**
 * Atualiza o status de uma entidade no módulo de origem quando o card é
 * arrastado para uma nova coluna no system board (DnD bidirecional).
 */
export async function atualizarStatusEntidade(
  input: AtualizarStatusEntidadeInput,
  userId: number
): Promise<Result<void>> {
  const { source, entityId, targetColumnId } = input;
  const numericId = typeof entityId === "string" ? parseInt(entityId, 10) : entityId;

  try {
    switch (source) {
      case "audiencias": {
        // Mapear coluna destino → StatusAudiencia
        const colToStatus: Record<string, StatusAudiencia> = {
          "aud-marcada": StatusAudiencia.Marcada,
          "aud-finalizada": StatusAudiencia.Finalizada,
          "aud-cancelada": StatusAudiencia.Cancelada,
        };
        const newStatus = colToStatus[targetColumnId];
        if (!newStatus) {
          return err(appError("VALIDATION_ERROR", "Coluna destino não mapeada a um status."));
        }
        const result = await atualizarStatusAudiencia(numericId, newStatus);
        if (!result.success) return err(result.error);
        return ok(undefined);
      }

      case "expedientes": {
        // Dar baixa no expediente quando arrastado para "Baixados"
        if (targetColumnId === "exp-baixado") {
          const result = await realizarBaixaExpediente(numericId, { expedienteId: numericId }, userId);
          if (!result.success) return err(result.error);
          return ok(undefined);
        }
        // Mover de Vencido para Pendente ou vice-versa não altera dado no DB
        // (prazoVencido é calculado, não um campo editável diretamente)
        return ok(undefined);
      }

      case "obrigacoes": {
        // Obrigações são mais complexas (envolvem pagamento), não suportamos DnD bidirecional aqui
        return err(appError("VALIDATION_ERROR", "Alteração de status de obrigações não é suportada via Kanban."));
      }

      default:
        return err(appError("VALIDATION_ERROR", `Source '${source}' não suportada.`));
    }
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        "Erro ao atualizar status da entidade.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}
