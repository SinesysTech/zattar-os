/**
 * Serviço de Persistência para Terceiros (Peritos, MP, etc.)
 * Implementa todas as operações CRUD com validação e type safety
 */

import { createClient } from '@/backend/utils/supabase/server-client';
import type {
  Terceiro,
  TerceiroPessoaFisica,
  TerceiroPessoaJuridica,
  CriarTerceiroParams,
  AtualizarTerceiroParams,
  ListarTerceirosParams,
  ListarTerceirosResult,
  BuscarTerceirosPorProcessoParams,
  UpsertTerceiroPorIdPessoaParams,
  TipoPessoa,
  TipoParteTerceiro,
  PoloTerceiro,
  SituacaoPJE,
} from '@/backend/types/partes/terceiros-types';

// ============================================================================
// Validation Functions (reused from representantes)
// ============================================================================

/**
 * Valida CPF com dígitos verificadores
 */
export function validarCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned.charAt(10))) return false;

  return true;
}

/**
 * Valida CNPJ com dígitos verificadores
 */
export function validarCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (checkDigit !== parseInt(cleaned.charAt(12))) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (checkDigit !== parseInt(cleaned.charAt(13))) return false;

  return true;
}

// ============================================================================
// Type Converter
// ============================================================================

/**
 * Converte row do banco para tipo Terceiro com discriminated union
 */
export function converterParaTerceiro(data: Record<string, unknown>): Terceiro {
  const tipo_pessoa = data.tipo_pessoa as string;

  if (tipo_pessoa !== 'pf' && tipo_pessoa !== 'pj') {
    throw new Error(`tipo_pessoa inválido: ${tipo_pessoa}`);
  }

  // Parse JSON fields
  const emails = data.emails ? (data.emails as any[] || []) : [];
  const dados_anteriores = data.dados_anteriores as Record<string, unknown> | null;

  // Convert date strings
  const parseDate = (val: unknown): string | null => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    return new Date(val as any).toISOString().split('T')[0];
  };

  const base = {
    id: data.id as number,
    id_pje: data.id_pje as number,
    id_pessoa_pje: data.id_pessoa_pje as number,
    tipo_parte: data.tipo_parte as TipoParteTerceiro,
    polo: data.polo as PoloTerceiro,
    nome: data.nome as string,
    nome_social: data.nome_social as string | null,
    emails,
    ddd_celular: data.ddd_celular as string | null,
    numero_celular: data.numero_celular as string | null,
    ddd_residencial: data.ddd_residencial as string | null,
    numero_residencial: data.numero_residencial as string | null,
    ddd_comercial: data.ddd_comercial as string | null,
    numero_comercial: data.numero_comercial as string | null,
    fax: data.fax as string | null,
    situacao: data.situacao as SituacaoPJE | null,
    observacoes: data.observacoes as string | null,
    dados_anteriores: dados_anteriores,
    endereco_id: data.endereco_id as number | null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };

  if (tipo_pessoa === 'pf') {
    return {
      ...base,
      tipo_pessoa: 'pf',
      cpf: data.cpf as string,
      cnpj: null,
      tipo_documento: data.tipo_documento as string | null,
      numero_rg: data.numero_rg as string | null,
      orgao_emissor_rg: data.orgao_emissor_rg as string | null,
      uf_rg: data.uf_rg as string | null,
      data_expedicao_rg: parseDate(data.data_expedicao_rg),
      sexo: data.sexo as string | null,
      nome_genitora: data.nome_genitora as string | null,
      data_nascimento: parseDate(data.data_nascimento),
      nacionalidade: data.nacionalidade as string | null,
      naturalidade: data.naturalidade as string | null,
      municipio_nascimento: data.municipio_nascimento as string | null,
      uf_nascimento: data.uf_nascimento as string | null,
      pais_nacionalidade: data.pais_nacionalidade as string | null,
      profissao: data.profissao as string | null,
      estado_civil: data.estado_civil as string | null,
      grau_instrucao: data.grau_instrucao as string | null,
      necessidade_especial: data.necessidade_especial as string | null,
      inscricao_estadual: null,
      data_abertura: null,
      orgao_publico: null,
      ds_tipo_pessoa: null,
      ramo_atividade: null,
      porte_codigo: null,
      porte_descricao: null,
      qualificacao_responsavel: null,
      capital_social: null,
      nome_fantasia: null,
      status_pje: null,
    } as TerceiroPessoaFisica;
  } else {
    return {
      ...base,
      tipo_pessoa: 'pj',
      cnpj: data.cnpj as string,
      cpf: null,
      inscricao_estadual: data.inscricao_estadual as string | null,
      data_abertura: parseDate(data.data_abertura),
      orgao_publico: data.orgao_publico as boolean | null,
      ds_tipo_pessoa: data.ds_tipo_pessoa as string | null,
      ramo_atividade: data.ramo_atividade as string | null,
      porte_codigo: data.porte_codigo as string | null,
      porte_descricao: data.porte_descricao as string | null,
      qualificacao_responsavel: data.qualificacao_responsavel as string | null,
      capital_social: data.capital_social as number | null,
      nome_fantasia: data.nome_fantasia as string | null,
      status_pje: data.status_pje as string | null,
      tipo_documento: null,
      numero_rg: null,
      orgao_emissor_rg: null,
      uf_rg: null,
      data_expedicao_rg: null,
      sexo: null,
      nome_genitora: null,
      data_nascimento: null,
      nacionalidade: null,
      naturalidade: null,
      municipio_nascimento: null,
      uf_nascimento: null,
      pais_nacionalidade: null,
      profissao: null,
      cartao_nacional_saude: null,
      certificado_militar: null,
      numero_titulo_eleitor: null,
      zona_titulo_eleitor: null,
      secao_titulo_eleitor: null,
      tipo_sanguineo: null,
      raca_cor: null,
      estado_civil: null,
      grau_instrucao: null,
      necessidade_especial: null,
    } as TerceiroPessoaJuridica;
  }
}

// ============================================================================
// Error Mapping
// ============================================================================

function mapSupabaseError(error: { code?: string; message: string }): string {
  if (error.code === '23505') {
    return 'Terceiro já cadastrado neste processo';
  }
  if (error.code === '23503') {
    return 'Processo não encontrado';
  }
  if (error.code === '23502') {
    return 'Campo obrigatório não informado';
  }
  if (error.code === '23514') {
    return 'Valor inválido para campo';
  }
  return error.message || 'Erro ao processar operação';
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Criar novo terceiro
 * NOTA: Terceiros é tabela GLOBAL - campos de processo (trt, grau, numero_processo)
 * vão para processo_partes, não para esta tabela
 */
export async function criarTerceiro(
  params: CriarTerceiroParams
): Promise<{ sucesso: boolean; terceiro?: Terceiro; erro?: string }> {
  try {
    // Validate required fields (campos de processo foram removidos - vão para processo_partes)
    if (!params.id_pessoa_pje ||
        !params.tipo_parte || !params.polo ||
        !params.tipo_pessoa || !params.nome) {
      return {
        sucesso: false,
        erro: 'Campos obrigatórios não informados',
      };
    }

    // Validate CPF/CNPJ based on tipo_pessoa
    if (params.tipo_pessoa === 'pf') {
      if (!params.cpf) {
        return { sucesso: false, erro: 'CPF é obrigatório para pessoa física' };
      }
      if (!validarCPF(params.cpf)) {
        return { sucesso: false, erro: 'CPF inválido' };
      }
    } else if (params.tipo_pessoa === 'pj') {
      if (!params.cnpj) {
        return { sucesso: false, erro: 'CNPJ é obrigatório para pessoa jurídica' };
      }
      if (!validarCNPJ(params.cnpj)) {
        return { sucesso: false, erro: 'CNPJ inválido' };
      }
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('terceiros')
      .insert(params)
      .select()
      .single();

    if (error) {
      return {
        sucesso: false,
        erro: mapSupabaseError(error),
      };
    }

    return {
      sucesso: true,
      terceiro: converterParaTerceiro(data),
    };
  } catch (error) {
    console.error('Erro ao criar terceiro:', error);
    return {
      sucesso: false,
      erro: 'Erro ao criar terceiro',
    };
  }
}

/**
 * Atualizar terceiro existente
 */
export async function atualizarTerceiro(
  params: AtualizarTerceiroParams
): Promise<{ sucesso: boolean; terceiro?: Terceiro; erro?: string }> {
  try {
    if (!params.id) {
      return { sucesso: false, erro: 'ID é obrigatório' };
    }

    // Check for immutable fields
    if ('tipo_pessoa' in params) {
      return {
        sucesso: false,
        erro: 'Campo tipo_pessoa não pode ser alterado',
      };
    }

    const supabase = await createClient();

    const { id, ...updates } = params;

    const { data, error } = await supabase
      .from('terceiros')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { sucesso: false, erro: 'Terceiro não encontrado' };
      }
      return {
        sucesso: false,
        erro: mapSupabaseError(error),
      };
    }

    return {
      sucesso: true,
      terceiro: converterParaTerceiro(data),
    };
  } catch (error) {
    console.error('Erro ao atualizar terceiro:', error);
    return {
      sucesso: false,
      erro: 'Erro ao atualizar terceiro',
    };
  }
}

/**
 * Buscar terceiro por ID
 */
export async function buscarTerceiroPorId(id: number): Promise<Terceiro | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('terceiros')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return converterParaTerceiro(data);
  } catch (error) {
    console.error('Erro ao buscar terceiro:', error);
    return null;
  }
}

/**
 * Buscar terceiros de um processo
 */
export async function buscarTerceirosPorProcesso(
  params: BuscarTerceirosPorProcessoParams
): Promise<Terceiro[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('terceiros')
      .select('*')
      .eq('processo_id', params.processo_id);

    if (params.tipo_parte) {
      query = query.eq('tipo_parte', params.tipo_parte);
    }

    query = query.order('tipo_parte', { ascending: true }).order('nome', { ascending: true });

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map(converterParaTerceiro);
  } catch (error) {
    console.error('Erro ao buscar terceiros por processo:', error);
    return [];
  }
}

/**
 * Listar terceiros com paginação e filtros
 */
export async function listarTerceiros(
  params: ListarTerceirosParams
): Promise<ListarTerceirosResult> {
  try {
    const supabase = await createClient();

    const pagina = params.pagina || 1;
    const limite = Math.min(params.limite || 50, 100);
    const offset = (pagina - 1) * limite;

    // Build query with filters
    let query = supabase.from('terceiros').select('*', { count: 'exact' });

    if (params.tipo_pessoa) {
      query = query.eq('tipo_pessoa', params.tipo_pessoa);
    }
    if (params.tipo_parte) {
      query = query.eq('tipo_parte', params.tipo_parte);
    }
    if (params.polo) {
      query = query.eq('polo', params.polo);
    }
    // Campos de processo (processo_id, trt, grau, numero_processo) foram removidos
    // Terceiros agora é tabela global - filtrar por processo via processo_partes
    if (params.nome) {
      query = query.ilike('nome', `%${params.nome}%`);
    }
    if (params.cpf) {
      query = query.eq('cpf', params.cpf.replace(/\D/g, ''));
    }
    if (params.cnpj) {
      query = query.eq('cnpj', params.cnpj.replace(/\D/g, ''));
    }
    if (params.id_pessoa_pje) {
      query = query.eq('id_pessoa_pje', params.id_pessoa_pje);
    }
    if (params.busca) {
      query = query.or(`nome.ilike.%${params.busca}%,cpf.ilike.%${params.busca}%,cnpj.ilike.%${params.busca}%,nome_social.ilike.%${params.busca}%`);
    }

    // Apply ordering
    const ordenarPor = params.ordenar_por || 'nome';
    const ordem = params.ordem === 'desc' ? { ascending: false } : { ascending: true };
    query = query.order(ordenarPor, ordem);

    // Apply pagination
    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao listar terceiros:', error);
      return {
        terceiros: [],
        total: 0,
        pagina,
        limite,
        totalPaginas: 0,
      };
    }

    const total = count || 0;
    const totalPaginas = Math.ceil(total / limite);

    return {
      terceiros: (data || []).map(converterParaTerceiro),
      total,
      pagina,
      limite,
      totalPaginas,
    };
  } catch (error) {
    console.error('Erro ao listar terceiros:', error);
    return {
      terceiros: [],
      total: 0,
      pagina: params.pagina || 1,
      limite: params.limite || 50,
      totalPaginas: 0,
    };
  }
}

/**
 * Upsert terceiro por id_pessoa_pje (tabela global)
 * NOTA: Terceiros é tabela global - busca apenas por id_pessoa_pje
 */
export async function upsertTerceiroPorIdPessoa(
  params: UpsertTerceiroPorIdPessoaParams
): Promise<{ sucesso: boolean; terceiro?: Terceiro; erro?: string; criado?: boolean }> {
  try {
    const supabase = await createClient();

    // Search for existing record by id_pessoa_pje only (tabela global)
    const { data: existing } = await supabase
      .from('terceiros')
      .select('id')
      .eq('id_pessoa_pje', params.id_pessoa_pje)
      .maybeSingle();

    if (existing) {
      // Update existing
      const result = await atualizarTerceiro({
        id: existing.id,
        ...params,
      });
      return { ...result, criado: false };
    } else {
      // Create new
      const result = await criarTerceiro(params);
      return { ...result, criado: true };
    }
  } catch (error) {
    console.error('Erro ao fazer upsert de terceiro:', error);
    return {
      sucesso: false,
      erro: 'Erro ao fazer upsert de terceiro',
    };
  }
}

/**
 * Deletar terceiro
 */
export async function deletarTerceiro(id: number): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('terceiros')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return { sucesso: false, erro: 'Terceiro não encontrado' };
      }
      return {
        sucesso: false,
        erro: mapSupabaseError(error),
      };
    }

    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao deletar terceiro:', error);
    return {
      sucesso: false,
      erro: 'Erro ao deletar terceiro',
    };
  }
}
