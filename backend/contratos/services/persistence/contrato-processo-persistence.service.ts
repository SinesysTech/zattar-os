// Serviço de persistência do relacionamento contrato-processo
// Gerencia operações de CRUD na tabela contrato_processos

import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Estrutura do relacionamento contrato-processo
 */
export interface ContratoProcesso {
  id: number;
  contratoId: number;
  processoId: number;
  createdAt: string;
}

/**
 * Resultado de operação
 */
export interface OperacaoContratoProcessoResult {
  sucesso: boolean;
  contratoProcesso?: ContratoProcesso;
  erro?: string;
}

/**
 * Parâmetros para listar processos de um contrato
 */
export interface ListarContratoProcessosParams {
  contratoId: number;
  pagina?: number;
  limite?: number;
}

/**
 * Resultado da listagem
 */
export interface ListarContratoProcessosResult {
  itens: ContratoProcesso[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Converte dados do banco para formato de retorno
 */
function converterParaContratoProcesso(data: Record<string, unknown>): ContratoProcesso {
  return {
    id: data.id as number,
    contratoId: data.contrato_id as number,
    processoId: data.processo_id as number,
    createdAt: data.created_at as string,
  };
}

/**
 * Adiciona um processo ao contrato
 */
export async function adicionarProcessoAoContrato(
  contratoId: number,
  processoId: number
): Promise<OperacaoContratoProcessoResult> {
  const supabase = createServiceClient();

  try {
    // Validar contrato
    const { data: contrato, error: erroContrato } = await supabase
      .from('contratos')
      .select('id')
      .eq('id', contratoId)
      .single();

    if (erroContrato || !contrato) {
      return { sucesso: false, erro: 'Contrato não encontrado' };
    }

    // Validar processo
    const { data: processo, error: erroProcesso } = await supabase
      .from('acervo')
      .select('id')
      .eq('id', processoId)
      .single();

    if (erroProcesso || !processo) {
      return { sucesso: false, erro: 'Processo não encontrado' };
    }

    // Inserir relacionamento
    const { data, error } = await supabase
      .from('contrato_processos')
      .insert({
        contrato_id: contratoId,
        processo_id: processoId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { sucesso: false, erro: 'Este processo já está associado ao contrato' };
      }

      console.error('Erro ao associar processo ao contrato:', error);
      return { sucesso: false, erro: `Erro ao associar processo ao contrato: ${error.message}` };
    }

    return {
      sucesso: true,
      contratoProcesso: converterParaContratoProcesso(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao associar processo ao contrato:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Remove um processo do contrato
 */
export async function removerProcessoDoContrato(
  contratoId: number,
  processoId: number
): Promise<OperacaoContratoProcessoResult> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('contrato_processos')
      .delete()
      .eq('contrato_id', contratoId)
      .eq('processo_id', processoId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao remover processo do contrato:', error);
      return { sucesso: false, erro: `Erro ao remover processo do contrato: ${error.message}` };
    }

    if (!data) {
      return { sucesso: false, erro: 'Associação não encontrada' };
    }

    return {
      sucesso: true,
      contratoProcesso: converterParaContratoProcesso(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao remover processo do contrato:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Lista processos associados a um contrato
 */
export async function listarProcessosDoContrato(
  params: ListarContratoProcessosParams
): Promise<ListarContratoProcessosResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  const { data, error, count } = await supabase
    .from('contrato_processos')
    .select('*', { count: 'exact' })
    .eq('contrato_id', params.contratoId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limite - 1);

  if (error) {
    throw new Error(`Erro ao listar processos do contrato: ${error.message}`);
  }

  const itens = (data || []).map(converterParaContratoProcesso);
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    itens,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

