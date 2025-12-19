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
  type PoloProcessual,
  type ParteContrato,
  createContratoSchema,
  updateContratoSchema,
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
  POLO_PROCESSUAL_LABELS,
} from '../domain';
import {
  criarContrato,
  atualizarContrato,
  listarContratos,
  buscarContrato,
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

/**
 * Extrai e parseia array de partes JSONB do FormData
 */
function extractPartes(formData: FormData, fieldName: string): ParteContrato[] | null {
  const raw = formData.get(fieldName);
  if (!raw || typeof raw !== 'string') return null;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (p: unknown) =>
          typeof p === 'object' &&
          p !== null &&
          'tipo' in p &&
          'id' in p &&
          'nome' in p
      ) as ParteContrato[];
    }
    return null;
  } catch {
    return null;
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

  const poloCliente = formData.get('poloCliente') as PoloProcessual | null;
  if (poloCliente) data.poloCliente = poloCliente;

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

  // Parte contrária ID (opcional)
  const parteContrariaIdStr = formData.get('parteContrariaId')?.toString();
  if (parteContrariaIdStr) {
    const parteContrariaId = parseInt(parteContrariaIdStr, 10);
    if (!isNaN(parteContrariaId)) data.parteContrariaId = parteContrariaId;
  }

  // Partes JSONB (opcional)
  const parteAutora = extractPartes(formData, 'parteAutora');
  if (parteAutora) data.parteAutora = parteAutora;

  const parteRe = extractPartes(formData, 'parteRe');
  if (parteRe) data.parteRe = parteRe;

  // Quantidades (opcional)
  const qtdeParteAutoraStr = formData.get('qtdeParteAutora')?.toString();
  if (qtdeParteAutoraStr) {
    const qtde = parseInt(qtdeParteAutoraStr, 10);
    if (!isNaN(qtde) && qtde > 0) data.qtdeParteAutora = qtde;
  }

  const qtdeParteReStr = formData.get('qtdeParteRe')?.toString();
  if (qtdeParteReStr) {
    const qtde = parseInt(qtdeParteReStr, 10);
    if (!isNaN(qtde) && qtde > 0) data.qtdeParteRe = qtde;
  }

  // Status (opcional)
  const status = formData.get('status') as StatusContrato | null;
  if (status) data.status = status;

  // Datas (opcional)
  const dataContratacao = formData.get('dataContratacao')?.toString();
  if (dataContratacao) data.dataContratacao = dataContratacao;

  const dataAssinatura = formData.get('dataAssinatura')?.toString();
  if (dataAssinatura) data.dataAssinatura = dataAssinatura;
  else if (formData.has('dataAssinatura')) data.dataAssinatura = null;

  const dataDistribuicao = formData.get('dataDistribuicao')?.toString();
  if (dataDistribuicao) data.dataDistribuicao = dataDistribuicao;
  else if (formData.has('dataDistribuicao')) data.dataDistribuicao = null;

  const dataDesistencia = formData.get('dataDesistencia')?.toString();
  if (dataDesistencia) data.dataDesistencia = dataDesistencia;
  else if (formData.has('dataDesistencia')) data.dataDesistencia = null;

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
    'poloCliente',
    'status',
    'dataAssinatura',
    'dataDistribuicao',
    'dataDesistencia',
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

  // Tratamento especial para dataContratacao: não enviar null, apenas omitir se vazio
  if (formData.has('dataContratacao')) {
    const value = formData.get('dataContratacao')?.toString();
    if (value) {
      data.dataContratacao = value.trim();
    }
    // Se vazio, não adiciona a chave (undefined no schema)
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
  const numericFields = ['clienteId', 'parteContrariaId', 'responsavelId', 'qtdeParteAutora', 'qtdeParteRe'];
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

  // Partes JSONB
  if (formData.has('parteAutora')) {
    data.parteAutora = extractPartes(formData, 'parteAutora');
  }
  if (formData.has('parteRe')) {
    data.parteRe = extractPartes(formData, 'parteRe');
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
function buildContratoIndexText(contrato: Contrato): string {
  const tipoLabel = TIPO_CONTRATO_LABELS[contrato.tipoContrato] || contrato.tipoContrato;
  const statusLabel = STATUS_CONTRATO_LABELS[contrato.status] || contrato.status;
  const poloLabel = POLO_PROCESSUAL_LABELS[contrato.poloCliente] || contrato.poloCliente;
  const cobrancaLabel = TIPO_COBRANCA_LABELS[contrato.tipoCobranca] || contrato.tipoCobranca;

  return `Contrato #${contrato.id}: ${tipoLabel} - Cliente ID ${contrato.clienteId} - Status: ${statusLabel} - Polo: ${poloLabel} - Cobrança: ${cobrancaLabel} - Data Contratação: ${contrato.dataContratacao} - Observações: ${contrato.observacoes || 'N/A'}`;
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
        texto: buildContratoIndexText(contrato),
        metadata: {
          tipo: 'outro',
          id: contrato.id,
          categoria: 'contrato',
          clienteId: contrato.clienteId,
          tipoContrato: contrato.tipoContrato,
          tipoCobranca: contrato.tipoCobranca,
          status: contrato.status,
          poloCliente: contrato.poloCliente,
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
        texto: buildContratoIndexText(contrato),
        metadata: {
          tipo: 'outro',
          id: contrato.id,
          categoria: 'contrato',
          clienteId: contrato.clienteId,
          tipoContrato: contrato.tipoContrato,
          tipoCobranca: contrato.tipoCobranca,
          status: contrato.status,
          poloCliente: contrato.poloCliente,
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
