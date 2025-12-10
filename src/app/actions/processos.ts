'use server';

/**
 * Server Actions para o modulo de Processos
 *
 * Camada de adaptacao entre UI e Core, implementando:
 * - Conversao de FormData para objetos tipados
 * - Validacao com Zod schemas do domain
 * - Chamadas aos servicos do core
 * - Revalidacao de cache via revalidatePath
 */

import { revalidatePath } from 'next/cache';
import {
  type CreateProcessoInput,
  type UpdateProcessoInput,
  type ListarProcessosParams,
  type OrigemAcervo,
  type GrauProcesso,
  createProcessoSchema,
  updateProcessoSchema,
} from '@/core/processos/domain';
import {
  criarProcesso,
  atualizarProcesso,
  listarProcessos,
  buscarProcesso,
  buscarTimeline,
} from '@/core/processos/service';

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
 * Converte FormData para objeto de criacao de Processo
 */
function formDataToCreateProcessoInput(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // Campos numericos obrigatorios
  const idPjeStr = formData.get('idPje')?.toString();
  if (idPjeStr) {
    const idPje = parseInt(idPjeStr, 10);
    if (!isNaN(idPje)) data.idPje = idPje;
  }

  const advogadoIdStr = formData.get('advogadoId')?.toString();
  if (advogadoIdStr) {
    const advogadoId = parseInt(advogadoIdStr, 10);
    if (!isNaN(advogadoId)) data.advogadoId = advogadoId;
  }

  const numeroStr = formData.get('numero')?.toString();
  if (numeroStr) {
    const numero = parseInt(numeroStr, 10);
    if (!isNaN(numero)) data.numero = numero;
  }

  // Campos string obrigatorios
  const origem = formData.get('origem') as OrigemAcervo | null;
  if (origem) data.origem = origem;

  const trt = formData.get('trt')?.toString();
  if (trt) data.trt = trt;

  const grau = formData.get('grau') as GrauProcesso | null;
  if (grau) data.grau = grau;

  const numeroProcesso = formData.get('numeroProcesso')?.toString();
  if (numeroProcesso) data.numeroProcesso = numeroProcesso;

  const descricaoOrgaoJulgador = formData.get('descricaoOrgaoJulgador')?.toString();
  if (descricaoOrgaoJulgador) data.descricaoOrgaoJulgador = descricaoOrgaoJulgador;

  const classeJudicial = formData.get('classeJudicial')?.toString();
  if (classeJudicial) data.classeJudicial = classeJudicial;

  const codigoStatusProcesso = formData.get('codigoStatusProcesso')?.toString();
  if (codigoStatusProcesso) data.codigoStatusProcesso = codigoStatusProcesso;

  const nomeParteAutora = formData.get('nomeParteAutora')?.toString();
  if (nomeParteAutora) data.nomeParteAutora = nomeParteAutora;

  const nomeParteRe = formData.get('nomeParteRe')?.toString();
  if (nomeParteRe) data.nomeParteRe = nomeParteRe;

  const dataAutuacao = formData.get('dataAutuacao')?.toString();
  if (dataAutuacao) data.dataAutuacao = dataAutuacao;

  // Campos booleanos opcionais
  const segredoJusticaStr = formData.get('segredoJustica')?.toString();
  if (segredoJusticaStr !== undefined && segredoJusticaStr !== null) {
    data.segredoJustica = segredoJusticaStr === 'true' || segredoJusticaStr === '1';
  }

  const juizoDigitalStr = formData.get('juizoDigital')?.toString();
  if (juizoDigitalStr !== undefined && juizoDigitalStr !== null) {
    data.juizoDigital = juizoDigitalStr === 'true' || juizoDigitalStr === '1';
  }

  const temAssociacaoStr = formData.get('temAssociacao')?.toString();
  if (temAssociacaoStr !== undefined && temAssociacaoStr !== null) {
    data.temAssociacao = temAssociacaoStr === 'true' || temAssociacaoStr === '1';
  }

  // Campos numericos opcionais
  const prioridadeProcessualStr = formData.get('prioridadeProcessual')?.toString();
  if (prioridadeProcessualStr) {
    const prioridade = parseInt(prioridadeProcessualStr, 10);
    if (!isNaN(prioridade)) data.prioridadeProcessual = prioridade;
  }

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

  // Campos de data opcionais (nullable)
  const dataArquivamento = formData.get('dataArquivamento')?.toString();
  if (dataArquivamento) data.dataArquivamento = dataArquivamento;
  else if (formData.has('dataArquivamento')) data.dataArquivamento = null;

  const dataProximaAudiencia = formData.get('dataProximaAudiencia')?.toString();
  if (dataProximaAudiencia) data.dataProximaAudiencia = dataProximaAudiencia;
  else if (formData.has('dataProximaAudiencia')) data.dataProximaAudiencia = null;

  // Responsavel ID (opcional)
  const responsavelIdStr = formData.get('responsavelId')?.toString();
  if (responsavelIdStr) {
    const responsavelId = parseInt(responsavelIdStr, 10);
    if (!isNaN(responsavelId)) data.responsavelId = responsavelId;
  } else if (formData.has('responsavelId')) {
    data.responsavelId = null;
  }

  return data;
}

/**
 * Converte FormData para objeto de atualizacao de Processo
 */
function formDataToUpdateProcessoInput(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // Campos string
  const stringFields = [
    'origem',
    'trt',
    'grau',
    'numeroProcesso',
    'descricaoOrgaoJulgador',
    'classeJudicial',
    'codigoStatusProcesso',
    'nomeParteAutora',
    'nomeParteRe',
    'dataAutuacao',
    'dataArquivamento',
    'dataProximaAudiencia',
  ];

  for (const field of stringFields) {
    if (formData.has(field)) {
      const value = formData.get(field)?.toString();
      if (value) {
        data[field] = value.trim();
      } else {
        // Para campos de data, definir como null se vazio
        if (field.startsWith('data') && field !== 'dataAutuacao') {
          data[field] = null;
        }
      }
    }
  }

  // Campos numericos
  const numericFields = [
    'idPje',
    'advogadoId',
    'numero',
    'prioridadeProcessual',
    'qtdeParteAutora',
    'qtdeParteRe',
    'responsavelId',
  ];

  for (const field of numericFields) {
    if (formData.has(field)) {
      const value = formData.get(field)?.toString();
      if (value) {
        const num = parseInt(value, 10);
        if (!isNaN(num)) data[field] = num;
      } else if (field === 'responsavelId') {
        data[field] = null;
      }
    }
  }

  // Campos booleanos
  const booleanFields = ['segredoJustica', 'juizoDigital', 'temAssociacao'];

  for (const field of booleanFields) {
    if (formData.has(field)) {
      const value = formData.get(field)?.toString();
      data[field] = value === 'true' || value === '1';
    }
  }

  return data;
}

// =============================================================================
// SERVER ACTIONS - PROCESSO
// =============================================================================

/**
 * Action para criar um novo processo
 */
export async function actionCriarProcesso(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // 1. Converter FormData para objeto
    const rawData = formDataToCreateProcessoInput(formData);

    // 2. Validar com Zod
    const validation = createProcessoSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validacao',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados invalidos',
      };
    }

    // 3. Chamar servico do core
    const result = await criarProcesso(validation.data as CreateProcessoInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    // 4. Revalidar cache
    revalidatePath('/processos');
    revalidatePath('/acervo');

    return {
      success: true,
      data: result.data,
      message: 'Processo criado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao criar processo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao criar processo. Tente novamente.',
    };
  }
}

/**
 * Action para atualizar um processo existente
 */
export async function actionAtualizarProcesso(
  id: number,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // 1. Validar ID
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'ID invalido',
        message: 'ID do processo e obrigatorio',
      };
    }

    // 2. Converter FormData para objeto
    const rawData = formDataToUpdateProcessoInput(formData);

    // 3. Validar com Zod
    const validation = updateProcessoSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validacao',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados invalidos',
      };
    }

    // 4. Chamar servico do core
    const result = await atualizarProcesso(id, validation.data as UpdateProcessoInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    // 5. Revalidar cache
    revalidatePath('/processos');
    revalidatePath(`/processos/${id}`);
    revalidatePath('/acervo');

    return {
      success: true,
      data: result.data,
      message: 'Processo atualizado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao atualizar processo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao atualizar processo. Tente novamente.',
    };
  }
}

/**
 * Action para listar processos (com suporte a 19 filtros)
 */
export async function actionListarProcessos(
  params?: ListarProcessosParams
): Promise<ActionResult> {
  try {
    const result = await listarProcessos(params);

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
      message: 'Processos carregados com sucesso',
    };
  } catch (error) {
    console.error('Erro ao listar processos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao carregar processos. Tente novamente.',
    };
  }
}

/**
 * Action para buscar um processo por ID
 */
export async function actionBuscarProcesso(id: number): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'ID invalido',
        message: 'ID do processo e obrigatorio',
      };
    }

    const result = await buscarProcesso(id);

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
        error: 'Processo nao encontrado',
        message: 'Processo nao encontrado',
      };
    }

    return {
      success: true,
      data: result.data,
      message: 'Processo carregado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao buscar processo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao carregar processo. Tente novamente.',
    };
  }
}

/**
 * Action para buscar timeline/movimentacoes de um processo
 *
 * PLACEHOLDER: Sera implementado na Fase 4 (Integracao PJE)
 */
export async function actionBuscarTimeline(processoId: number): Promise<ActionResult> {
  try {
    if (!processoId || processoId <= 0) {
      return {
        success: false,
        error: 'ID invalido',
        message: 'ID do processo e obrigatorio',
      };
    }

    const result = await buscarTimeline(processoId);

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
      message: 'Timeline carregada com sucesso',
    };
  } catch (error) {
    console.error('Erro ao buscar timeline:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao carregar timeline. Tente novamente.',
    };
  }
}
