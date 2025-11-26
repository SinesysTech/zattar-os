// Serviço de persistência para cadastros PJE
// Gerencia operações CRUD na tabela cadastros_pje

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { getLogger } from '@/backend/utils/logger';
import type {
  CadastroPJE,
  CriarCadastroPJEParams,
  AtualizarCadastroPJEParams,
  UpsertCadastroPJEParams,
  BuscarEntidadePorIdPessoaPJEParams,
  ListarCadastrosPJEPorEntidadeParams,
  OperacaoCadastroPJEResult,
  ListarCadastrosPJEResult,
} from '@/backend/types/partes/cadastros-pje-types';

const logger = getLogger('cadastro-pje-persistence');

/**
 * Resultado de busca de entidade por ID PJE
 */
export interface BuscarEntidadePorIdPessoaPJEResult {
  tipo_entidade: string;
  entidade_id: number;
}

/**
 * Cria um novo cadastro PJE
 */
export async function criarCadastroPJE(
  params: CriarCadastroPJEParams
): Promise<OperacaoCadastroPJEResult> {
  const supabase = createServiceClient();

  try {
    logger.info('Criando novo cadastro PJE', { params });

    const { data, error } = await supabase
      .from('cadastros_pje')
      .insert(params)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao criar cadastro PJE', { error, params });
      return { sucesso: false, erro: `Erro ao criar cadastro PJE: ${error.message}` };
    }

    logger.info('Cadastro PJE criado com sucesso', { id: data.id });
    return { sucesso: true, cadastro: data as CadastroPJE };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    logger.error('Erro inesperado ao criar cadastro PJE', { error, params });
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Busca um cadastro PJE por ID
 */
export async function buscarCadastroPJE(id: number): Promise<CadastroPJE | null> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('cadastros_pje')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Erro ao buscar cadastro PJE por ID', { error, id });
      throw new Error(`Erro ao buscar cadastro PJE: ${error.message}`);
    }

    return data as CadastroPJE;
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    logger.error('Erro inesperado ao buscar cadastro PJE por ID', { error, id });
    throw new Error(`Erro inesperado: ${erroMsg}`);
  }
}

/**
 * Atualiza um cadastro PJE existente
 */
export async function atualizarCadastroPJE(
  params: AtualizarCadastroPJEParams
): Promise<OperacaoCadastroPJEResult> {
  const supabase = createServiceClient();

  try {
    logger.info('Atualizando cadastro PJE', { params });

    const { data, error } = await supabase
      .from('cadastros_pje')
      .update(params)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao atualizar cadastro PJE', { error, params });
      return { sucesso: false, erro: `Erro ao atualizar cadastro PJE: ${error.message}` };
    }

    logger.info('Cadastro PJE atualizado com sucesso', { id: params.id });
    return { sucesso: true, cadastro: data as CadastroPJE };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    logger.error('Erro inesperado ao atualizar cadastro PJE', { error, params });
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Deleta um cadastro PJE por ID
 */
export async function deletarCadastroPJE(id: number): Promise<OperacaoCadastroPJEResult> {
  const supabase = createServiceClient();

  try {
    logger.info('Deletando cadastro PJE', { id });

    const { error } = await supabase
      .from('cadastros_pje')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Erro ao deletar cadastro PJE', { error, id });
      return { sucesso: false, erro: `Erro ao deletar cadastro PJE: ${error.message}` };
    }

    logger.info('Cadastro PJE deletado com sucesso', { id });
    return { sucesso: true };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    logger.error('Erro inesperado ao deletar cadastro PJE', { error, id });
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Upsert cadastro PJE usando constraint UNIQUE (tipo_entidade, id_pessoa_pje, sistema, tribunal, grau)
 */
export async function upsertCadastroPJE(
  params: UpsertCadastroPJEParams
): Promise<OperacaoCadastroPJEResult> {
  const supabase = createServiceClient();

  try {
    logger.info('Fazendo upsert de cadastro PJE', { params });

    const { data, error } = await supabase
      .from('cadastros_pje')
      .upsert(params, {
        onConflict: 'tipo_entidade,id_pessoa_pje,sistema,tribunal,grau'
      })
      .select()
      .single();

    if (error) {
      logger.error('Erro ao fazer upsert de cadastro PJE', { error, params });
      return { sucesso: false, erro: `Erro ao fazer upsert de cadastro PJE: ${error.message}` };
    }

    logger.info('Upsert de cadastro PJE realizado com sucesso', { id: data.id });
    return { sucesso: true, cadastro: data as CadastroPJE };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    logger.error('Erro inesperado ao fazer upsert de cadastro PJE', { error, params });
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Busca entidade por ID PJE + tribunal + grau
 */
export async function buscarEntidadePorIdPessoaPJE(
  params: BuscarEntidadePorIdPessoaPJEParams
): Promise<BuscarEntidadePorIdPessoaPJEResult | null> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('cadastros_pje')
      .select('tipo_entidade, entidade_id')
      .eq('id_pessoa_pje', params.id_pessoa_pje)
      .eq('sistema', params.sistema)
      .eq('tribunal', params.tribunal)
      .eq('grau', params.grau)
      .maybeSingle();

    if (error) {
      logger.error('Erro ao buscar entidade por ID PJE', { error, params });
      throw new Error(`Erro ao buscar entidade por ID PJE: ${error.message}`);
    }

    return data as BuscarEntidadePorIdPessoaPJEResult | null;
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    logger.error('Erro inesperado ao buscar entidade por ID PJE', { error, params });
    throw new Error(`Erro inesperado: ${erroMsg}`);
  }
}

/**
 * Lista todos os cadastros PJE de uma entidade específica
 */
export async function listarCadastrosPJEPorEntidade(
  params: ListarCadastrosPJEPorEntidadeParams
): Promise<ListarCadastrosPJEResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  try {
    let query = supabase
      .from('cadastros_pje')
      .select('*', { count: 'exact' })
      .eq('tipo_entidade', params.tipo_entidade)
      .eq('entidade_id', params.entidade_id);

    if (params.sistema) {
      query = query.eq('sistema', params.sistema);
    }

    if (params.tribunal) {
      query = query.eq('tribunal', params.tribunal);
    }

    query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Erro ao listar cadastros PJE por entidade', { error, params });
      throw new Error(`Erro ao listar cadastros PJE por entidade: ${error.message}`);
    }

    const cadastros = (data || []) as CadastroPJE[];
    const total = count ?? 0;
    const totalPaginas = Math.ceil(total / limite);

    return {
      cadastros,
      pagina,
      limite,
      total,
      totalPaginas,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    logger.error('Erro inesperado ao listar cadastros PJE por entidade', { error, params });
    throw new Error(`Erro inesperado: ${erroMsg}`);
  }
}

/**
 * Lista cadastros PJE de um tribunal
 */
export async function listarCadastrosPJEPorTribunal(
  tribunal: string,
  sistema?: string
): Promise<ListarCadastrosPJEResult> {
  const supabase = createServiceClient();

  const pagina = 1; // Default, could be parameterized if needed
  const limite = 50;
  const offset = (pagina - 1) * limite;

  try {
    let query = supabase
      .from('cadastros_pje')
      .select('*', { count: 'exact' })
      .eq('tribunal', tribunal);

    if (sistema) {
      query = query.eq('sistema', sistema);
    }

    query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Erro ao listar cadastros PJE por tribunal', { error, tribunal, sistema });
      throw new Error(`Erro ao listar cadastros PJE por tribunal: ${error.message}`);
    }

    const cadastros = (data || []) as CadastroPJE[];
    const total = count ?? 0;
    const totalPaginas = Math.ceil(total / limite);

    return {
      cadastros,
      pagina,
      limite,
      total,
      totalPaginas,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    logger.error('Erro inesperado ao listar cadastros PJE por tribunal', { error, tribunal, sistema });
    throw new Error(`Erro inesperado: ${erroMsg}`);
  }
}

/**
 * Verifica se um cadastro PJE já existe
 */
export async function verificarCadastroExiste(params: {
  tipo_entidade: string;
  id_pessoa_pje: number;
  sistema: string;
  tribunal: string;
  grau: string | null;
}): Promise<boolean> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('cadastros_pje')
      .select('id')
      .eq('tipo_entidade', params.tipo_entidade)
      .eq('id_pessoa_pje', params.id_pessoa_pje)
      .eq('sistema', params.sistema)
      .eq('tribunal', params.tribunal)
      .eq('grau', params.grau)
      .maybeSingle();

    if (error) {
      logger.error('Erro ao verificar se cadastro PJE existe', { error, params });
      throw new Error(`Erro ao verificar cadastro PJE: ${error.message}`);
    }

    return !!data;
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    logger.error('Erro inesperado ao verificar cadastro PJE', { error, params });
    throw new Error(`Erro inesperado: ${erroMsg}`);
  }
}