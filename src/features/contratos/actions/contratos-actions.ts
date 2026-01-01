'use server';

/**
 * CONTRATOS FEATURE - Server Actions
 *
 * Camada de adaptação entre UI e Core, implementando:
 * - Conversão de FormData para objetos tipados
 * - Validação com Zod schemas do domain
 * - Chamadas aos serviços do core
 * - Revalidação de cache via revalidatePath
 */

import { revalidatePath } from 'next/cache';
import { indexarDocumento, atualizarDocumentoNoIndice } from '@/lib/ai/indexing';
import {
  type Contrato,
  type CreateContratoInput,
  type UpdateContratoInput,
  type ListarContratosParams,
  type TipoContrato,
  type TipoCobranca,
  type StatusContrato,
  type PapelContratual,
  type TipoEntidadeContrato,
  createContratoSchema,
  updateContratoSchema,
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
  PAPEL_CONTRATUAL_LABELS,
} from '../domain';
import {
  criarContrato,
  atualizarContrato,
  listarContratos,
  buscarContrato,
  contarContratosPorStatus,
} from '../service';

// =============================================================================
// TIPOS DE RETORNO DAS ACTIONS
// =============================================================================

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; errors?: Record<string, string[]>; message: string };

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Converte erros do Zod para formato de errors por campo
 */
function formatZodErrors(
  zodError: { errors: Array<{ path: (string | number)[]; message: string }> }
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const err of zodError.errors) {
    const key = err.path.join('.');
    if (!errors[key]) {
      errors[key] = [];
    }
    errors[key].push(err.message);
  }
  return errors;
}

function extractPartes(formData: FormData): Array<{
  tipoEntidade: TipoEntidadeContrato;
  entidadeId: number;
  papelContratual: PapelContratual;
  ordem?: number;
}> {
  const raw = formData.get('partes');
  if (!raw || typeof raw !== 'string') return [];

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isRecord)
      .map((p) => ({
        tipoEntidade: String(p.tipoEntidade) as TipoEntidadeContrato,
        entidadeId: Number(p.entidadeId),
        papelContratual: String(p.papelContratual) as PapelContratual,
        ordem: p.ordem !== undefined ? Number(p.ordem) : undefined,
      }))
      .filter((p) =>
        (p.tipoEntidade === 'cliente' || p.tipoEntidade === 'parte_contraria') &&
        Number.isFinite(p.entidadeId) &&
        p.entidadeId > 0 &&
        (p.papelContratual === 'autora' || p.papelContratual === 're')
      );
  } catch {
    return [];
  }
}

/**
 * Converte FormData para objeto de criação de Contrato
 */
function formDataToCreateContratoInput(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // Campos obrigatórios (enums)
  const tipoContrato = formData.get('tipoContrato') as TipoContrato | null;
  if (tipoContrato) data.tipoContrato = tipoContrato;

  const tipoCobranca = formData.get('tipoCobranca') as TipoCobranca | null;
  if (tipoCobranca) data.tipoCobranca = tipoCobranca;

  const papelClienteNoContrato = formData.get('papelClienteNoContrato') as PapelContratual | null;
  if (papelClienteNoContrato) data.papelClienteNoContrato = papelClienteNoContrato;

  // Cliente ID (obrigatório)
  const clienteIdStr = formData.get('clienteId')?.toString();
  if (clienteIdStr) {
    const clienteId = parseInt(clienteIdStr, 10);
    if (!isNaN(clienteId)) data.clienteId = clienteId;
  }

  // Segmento ID (opcional)
  const segmentoIdStr = formData.get('segmentoId')?.toString();
  if (segmentoIdStr) {
    const segmentoId = parseInt(segmentoIdStr, 10);
    if (!isNaN(segmentoId)) data.segmentoId = segmentoId;
  }

  // Partes (modelo relacional)
  data.partes = extractPartes(formData);

  // Status (opcional)
  const status = formData.get('status') as StatusContrato | null;
  if (status) data.status = status;

  const cadastradoEm = formData.get('cadastradoEm')?.toString();
  if (cadastradoEm) data.cadastradoEm = cadastradoEm;

  // Responsável ID (opcional)
  const responsavelIdStr = formData.get('responsavelId')?.toString();
  if (responsavelIdStr) {
    const responsavelId = parseInt(responsavelIdStr, 10);
    if (!isNaN(responsavelId)) data.responsavelId = responsavelId;
  }

  // Observações (opcional)
  const observacoes = formData.get('observacoes')?.toString().trim();
  if (observacoes) data.observacoes = observacoes;
  else if (formData.has('observacoes')) data.observacoes = null;

  return data;
}

/**
 * Converte FormData para objeto de atualização de Contrato
 */
function formDataToUpdateContratoInput(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // Apenas incluir campos presentes no FormData
  const fields = [
    'tipoContrato',
    'tipoCobranca',
    'papelClienteNoContrato',
    'status',
    'observacoes',
  ];

  for (const field of fields) {
    if (formData.has(field)) {
      const value = formData.get(field)?.toString();
      if (value) {
        data[field] = value.trim();
      } else {
        data[field] = null;
      }
    }
  }

  if (formData.has('cadastradoEm')) {
    const value = formData.get('cadastradoEm')?.toString();
    if (value) data.cadastradoEm = value.trim();
  }

  // Segmento ID
  if (formData.has('segmentoId')) {
    const value = formData.get('segmentoId')?.toString();
    if (value) {
      const num = parseInt(value, 10);
      if (!isNaN(num)) data.segmentoId = num;
    } else {
      data.segmentoId = null;
    }
  }

  // IDs numéricos
  const numericFields = ['clienteId', 'responsavelId'];
  for (const field of numericFields) {
    if (formData.has(field)) {
      const value = formData.get(field)?.toString();
      if (value) {
        const num = parseInt(value, 10);
        if (!isNaN(num)) data[field] = num;
      } else {
        data[field] = null;
      }
    }
  }

  if (formData.has('partes')) {
    data.partes = extractPartes(formData);
  }

  return data;
}

// =============================================================================
// HELPERS - INDEXAÇÃO SEMÂNTICA (RAG/pgvector)
// =============================================================================

/**
 * Constrói texto para indexação semântica de um contrato
 *
 * Formato otimizado para busca semântica com RAG/pgvector.
 * Inclui todos os campos relevantes para queries como:
 * "contrato ajuizamento cliente X", "contratos pró-êxito pendentes"
 */
function getContratoIndexText(contrato: Contrato): string {
  const statusLabel = STATUS_CONTRATO_LABELS[contrato.status] || contrato.status;
  const tipoLabel = TIPO_CONTRATO_LABELS[contrato.tipoContrato] || contrato.tipoContrato;
  const papelLabel =
    PAPEL_CONTRATUAL_LABELS[contrato.papelClienteNoContrato] || contrato.papelClienteNoContrato;
  const cobrancaLabel = TIPO_COBRANCA_LABELS[contrato.tipoCobranca] || contrato.tipoCobranca;

  return `Contrato #${contrato.id}: ${tipoLabel} - Cliente ID ${contrato.clienteId} - Status: ${statusLabel} - Papel do Cliente: ${papelLabel} - Cobrança: ${cobrancaLabel} - Cadastrado em: ${contrato.cadastradoEm} - Observações: ${contrato.observacoes || 'N/A'}`;
}

/**
 * Indexa um contrato para busca semântica (async, não bloqueia resposta)
 *
 * @remarks
 * Usa tipo 'outro' pois 'contrato' não está na lista de tipos suportados.
 * Categoria 'contrato' é adicionada aos metadados para identificação.
 */
function indexarContratoAsync(contrato: Contrato): void {
  queueMicrotask(async () => {
    try {
      await indexarDocumento({
        texto: getContratoIndexText(contrato),
        metadata: {
          tipo: 'outro',
          id: contrato.id,
          categoria: 'contrato',
          clienteId: contrato.clienteId,
          tipoContrato: contrato.tipoContrato,
          tipoCobranca: contrato.tipoCobranca,
          status: contrato.status,
          papelClienteNoContrato: contrato.papelClienteNoContrato,
          createdAt: contrato.createdAt,
        },
      });
      console.log(`[Contratos] Contrato ${contrato.id} indexado para busca semântica`);
    } catch (error) {
      console.error(`[Contratos] Erro ao indexar contrato ${contrato.id}:`, error);
    }
  });
}

/**
 * Atualiza indexação de um contrato (async, não bloqueia resposta)
 */
function atualizarIndexacaoContratoAsync(contrato: Contrato): void {
  queueMicrotask(async () => {
    try {
      await atualizarDocumentoNoIndice({
        texto: getContratoIndexText(contrato),
        metadata: {
          tipo: 'outro',
          id: contrato.id,
          categoria: 'contrato',
          clienteId: contrato.clienteId,
          tipoContrato: contrato.tipoContrato,
          tipoCobranca: contrato.tipoCobranca,
          status: contrato.status,
          papelClienteNoContrato: contrato.papelClienteNoContrato,
          updatedAt: contrato.updatedAt,
        },
      });
      console.log(`[Contratos] Indexação do contrato ${contrato.id} atualizada`);
    } catch (error) {
      console.error(`[Contratos] Erro ao atualizar indexação do contrato ${contrato.id}:`, error);
    }
  });
}

// =============================================================================
// SERVER ACTIONS - CONTRATO
// =============================================================================

/**
 * Action para criar um novo contrato
 *
 * @param prevState - Estado anterior da action (para useFormState)
 * @param formData - Dados do formulário
 * @returns ActionResult com o contrato criado ou erro
 *
 * @example
 * ```typescript
 * const [state, formAction] = useFormState(actionCriarContrato, null);
 * ```
 */
export async function actionCriarContrato(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // 1. Converter FormData para objeto
    const rawData = formDataToCreateContratoInput(formData);

    // 2. Validar com Zod
    const validation = createContratoSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validação',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados inválidos',
      };
    }

    // 3. Chamar serviço do core
    const result = await criarContrato(validation.data as CreateContratoInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    // 4. Revalidar cache
    revalidatePath('/contratos');
    revalidatePath('/financeiro');

    // 5. Indexar para busca semântica (async, não bloqueia resposta)
    indexarContratoAsync(result.data);

    return {
      success: true,
      data: result.data,
      message: 'Contrato criado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao criar contrato:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao criar contrato. Tente novamente.',
    };
  }
}

/**
 * Action para atualizar um contrato existente
 *
 * @param id - ID do contrato a ser atualizado
 * @param prevState - Estado anterior da action (para useFormState)
 * @param formData - Dados do formulário
 * @returns ActionResult com o contrato atualizado ou erro
 *
 * @example
 * ```typescript
 * const boundAction = actionAtualizarContrato.bind(null, contratoId);
 * const [state, formAction] = useFormState(boundAction, null);
 * ```
 */
export async function actionAtualizarContrato(
  id: number,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // 1. Validar ID
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'ID inválido',
        message: 'ID do contrato é obrigatório',
      };
    }

    // 2. Converter FormData para objeto
    const rawData = formDataToUpdateContratoInput(formData);

    // 3. Validar com Zod
    const validation = updateContratoSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validação',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados inválidos',
      };
    }

    // 4. Chamar serviço do core
    const result = await atualizarContrato(id, validation.data as UpdateContratoInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    // 5. Revalidar cache
    revalidatePath('/contratos');
    revalidatePath(`/contratos/${id}`);
    revalidatePath('/financeiro');

    // 6. Atualizar indexação semântica (async, não bloqueia resposta)
    atualizarIndexacaoContratoAsync(result.data);

    return {
      success: true,
      data: result.data,
      message: 'Contrato atualizado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao atualizar contrato:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao atualizar contrato. Tente novamente.',
    };
  }
}

/**
 * Action para listar contratos (refresh manual)
 *
 * @param params - Parâmetros de listagem (paginação, filtros, ordenação)
 * @returns ActionResult com lista paginada de contratos ou erro
 *
 * @example
 * ```typescript
 * const result = await actionListarContratos({ pagina: 1, limite: 10, status: 'contratado' });
 * ```
 */
export async function actionListarContratos(
  params?: ListarContratosParams
): Promise<ActionResult> {
  try {
    const result = await listarContratos(params);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: 'Contratos carregados com sucesso',
    };
  } catch (error) {
    console.error('Erro ao listar contratos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao carregar contratos. Tente novamente.',
    };
  }
}

/**
 * Action para buscar um contrato por ID
 *
 * @param id - ID do contrato
 * @returns ActionResult com o contrato ou erro
 *
 * @example
 * ```typescript
 * const result = await actionBuscarContrato(123);
 * if (result.success) {
 *   console.log(result.data); // Contrato
 * }
 * ```
 */
export async function actionBuscarContrato(id: number): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'ID inválido',
        message: 'ID do contrato é obrigatório',
      };
    }

    const result = await buscarContrato(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    if (!result.data) {
      return {
        success: false,
        error: 'Contrato não encontrado',
        message: 'Contrato não encontrado',
      };
    }

    return {
      success: true,
      data: result.data,
      message: 'Contrato carregado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao buscar contrato:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao carregar contrato. Tente novamente.',
    };
  }
}

/**
 * Action para contar contratos agrupados por status
 *
 * @returns ActionResult com objeto contendo contagem por status
 *
 * @example
 * ```typescript
 * const result = await actionContarContratosPorStatus();
 * if (result.success) {
 *   console.log(result.data); // { em_contratacao: 10, contratado: 5, ... }
 * }
 * ```
 */
export async function actionContarContratosPorStatus(): Promise<ActionResult<Record<StatusContrato, number>>> {
  try {
    const result = await contarContratosPorStatus();

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: 'Contagem de contratos carregada com sucesso',
    };
  } catch (error) {
    console.error('Erro ao contar contratos por status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao carregar contagem de contratos. Tente novamente.',
    };
  }
}
