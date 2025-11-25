/**
 * Serviço de Persistência para Representantes
 * Implementa todas as operações CRUD com validação e type safety
 */

import { createClient } from '@/backend/utils/supabase/server-client';
import type {
  Representante,
  RepresentanteComEndereco,
  RepresentantePessoaFisica,
  RepresentantePessoaJuridica,
  CriarRepresentanteParams,
  AtualizarRepresentanteParams,
  ListarRepresentantesParams,
  ListarRepresentantesResult,
  BuscarRepresentantesPorParteParams,
  BuscarRepresentantesPorOABParams,
  BuscarRepresentantesPorProcessoParams,
  UpsertRepresentantePorIdPessoaParams,
  OperacaoRepresentanteResult,
  TipoPessoa,
} from '@/backend/types/representantes/representantes-types';
import { converterParaEndereco } from '@/backend/enderecos/services/enderecos-persistence.service';

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Valida CPF com dígitos verificadores
 */
export function validarCPF(cpf: string): boolean {
  // Remove non-numeric characters
  const cleaned = cpf.replace(/\D/g, '');

  // Check length
  if (cleaned.length !== 11) return false;

  // Reject known invalid CPFs (all same digit)
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned.charAt(9))) return false;

  // Calculate second check digit
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
  // Remove non-numeric characters
  const cleaned = cnpj.replace(/\D/g, '');

  // Check length
  if (cleaned.length !== 14) return false;

  // Reject known invalid CNPJs (all same digit)
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  // Calculate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (checkDigit !== parseInt(cleaned.charAt(12))) return false;

  // Calculate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (checkDigit !== parseInt(cleaned.charAt(13))) return false;

  return true;
}

/**
 * Valida formato OAB (UF + número)
 */
export function validarOAB(numero_oab: string): boolean {
  // Pattern: 2 letters (UF) + 3-6 digits
  const pattern = /^[A-Z]{2}\d{3,6}$/;
  if (!pattern.test(numero_oab)) return false;

  // Valid Brazilian state codes
  const validUFs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  const uf = numero_oab.substring(0, 2);
  return validUFs.includes(uf);
}

/**
 * Valida formato de email (RFC 5322 simplified)
 */
export function validarEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

// ============================================================================
// Type Converter
// ============================================================================

/**
 * Converte row do banco para tipo Representante com discriminated union
 */
export function converterParaRepresentante(data: Record<string, unknown>): Representante {
  const tipo_pessoa = data.tipo_pessoa as string;

  if (tipo_pessoa !== 'pf' && tipo_pessoa !== 'pj') {
    throw new Error(`tipo_pessoa inválido: ${tipo_pessoa}`);
  }

  // Parse JSON fields
  const emails = Array.isArray(data.emails) ? data.emails as string[] : [];
  const dados_anteriores = data.dados_anteriores as Record<string, unknown> | null;

  // Convert date strings
  const parseDate = (val: unknown): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return val;
    return new Date(val as string);
  };

  const base = {
    id: data.id as number,
    id_pje: data.id_pje as number | null,
    id_pessoa_pje: data.id_pessoa_pje as number,
    parte_tipo: data.parte_tipo as 'cliente' | 'parte_contraria' | 'terceiro',
    parte_id: data.parte_id as number,
    polo: data.polo as string | null,
    tipo_pessoa: data.tipo_pessoa as TipoPessoa,
    nome: data.nome as string,
    situacao: data.situacao as string | null,
    status: data.status as string | null,
    principal: data.principal as boolean | null,
    endereco_desconhecido: data.endereco_desconhecido as boolean | null,
    tipo: data.tipo as string | null,
    id_tipo_parte: data.id_tipo_parte as number | null,
    numero_oab: data.numero_oab as string | null,
    situacao_oab: data.situacao_oab as string | null,
    emails,
    ddd_celular: data.ddd_celular as string | null,
    numero_celular: data.numero_celular as string | null,
    ddd_residencial: data.ddd_residencial as string | null,
    numero_residencial: data.numero_residencial as string | null,
    ddd_comercial: data.ddd_comercial as string | null,
    numero_comercial: data.numero_comercial as string | null,
    email: data.email as string | null,
    dados_anteriores,
    ordem: data.ordem as number | null,
    data_habilitacao: parseDate(data.data_habilitacao),
    endereco_id: data.endereco_id as number | null,
    created_at: new Date(data.created_at as string),
    updated_at: new Date(data.updated_at as string),
  };

  if (tipo_pessoa === 'pf') {
    return {
      ...base,
      tipo_pessoa: 'pf',
      cpf: data.cpf as string,
      sexo: data.sexo as string | null,
      data_nascimento: parseDate(data.data_nascimento),
      nome_mae: data.nome_mae as string | null,
      nome_pai: data.nome_pai as string | null,
      nacionalidade: data.nacionalidade as string | null,
      estado_civil: data.estado_civil as string | null,
      uf_nascimento: data.uf_nascimento as string | null,
      municipio_nascimento: data.municipio_nascimento as string | null,
      pais_nascimento: data.pais_nascimento as string | null,
      cnpj: null,
      razao_social: null,
      nome_fantasia: null,
      inscricao_estadual: null,
      tipo_empresa: null,
    } as RepresentantePessoaFisica;
  } else {
    return {
      ...base,
      tipo_pessoa: 'pj',
      cnpj: data.cnpj as string,
      razao_social: data.razao_social as string | null,
      nome_fantasia: data.nome_fantasia as string | null,
      inscricao_estadual: data.inscricao_estadual as string | null,
      tipo_empresa: data.tipo_empresa as string | null,
      cpf: null,
      sexo: null,
      data_nascimento: null,
      nome_mae: null,
      nome_pai: null,
      nacionalidade: null,
      estado_civil: null,
      uf_nascimento: null,
      municipio_nascimento: null,
      pais_nascimento: null,
    } as RepresentantePessoaJuridica;
  }
}

// ============================================================================
// Error Mapping
// ============================================================================

function mapSupabaseError(error: { code?: string; message: string }): string {
  if (error.code === '23505') {
    // Unique constraint violation
    return 'Representante já cadastrado para esta parte neste processo';
  }
  if (error.code === '23503') {
    // Foreign key violation
    return 'Parte não encontrada';
  }
  if (error.code === '23502') {
    // Not null violation
    return 'Campo obrigatório não informado';
  }
  if (error.code === '23514') {
    // Check constraint violation
    return 'Valor inválido para campo';
  }
  return error.message || 'Erro ao processar operação';
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Criar novo representante
 */
export async function criarRepresentante(
  params: CriarRepresentanteParams
): Promise<OperacaoRepresentanteResult> {
  try {
    // Validate required fields
    if (!params.id_pessoa_pje || !params.parte_tipo || !params.parte_id ||
      !params.tipo_pessoa || !params.nome) {
      return {
        sucesso: false,
        erro: 'Campos obrigatórios não informados',
      };
    }

    // Validate trt, grau, numero_processo as required
    if (!params.trt || !params.grau || !params.numero_processo) {
      return {
        sucesso: false,
        erro: 'Campos trt, grau e numero_processo são obrigatórios',
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

    // Validate OAB if provided
    if (params.numero_oab && !validarOAB(params.numero_oab)) {
      return { sucesso: false, erro: 'Número OAB inválido' };
    }

    // Validate email if provided
    if (params.email && !validarEmail(params.email)) {
      return { sucesso: false, erro: 'Email inválido' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('representantes')
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
      representante: converterParaRepresentante(data),
    };
  } catch (error) {
    console.error('Erro ao criar representante:', error);
    return {
      sucesso: false,
      erro: 'Erro ao criar representante',
    };
  }
}

/**
 * Atualizar representante existente
 */
export async function atualizarRepresentante(
  params: AtualizarRepresentanteParams
): Promise<OperacaoRepresentanteResult> {
  try {
    if (!params.id) {
      return { sucesso: false, erro: 'ID é obrigatório' };
    }

    // Check for immutable fields
    if ('tipo_pessoa' in params || 'parte_tipo' in params || 'parte_id' in params) {
      return {
        sucesso: false,
        erro: 'Campos tipo_pessoa, parte_tipo e parte_id não podem ser alterados',
      };
    }

    // Validate email if provided
    if (params.email && !validarEmail(params.email)) {
      return { sucesso: false, erro: 'Email inválido' };
    }

    // Validate OAB if provided
    if (params.numero_oab && !validarOAB(params.numero_oab)) {
      return { sucesso: false, erro: 'Número OAB inválido' };
    }

    // Note: CPF/CNPJ validation removed because tipo_pessoa is immutable.
    // Document numbers cannot be changed after creation.
    // If cpf/cnpj are provided in params, they will be ignored by the type system.

    const supabase = await createClient();

    // Buscar registro atual para dados_anteriores
    const { data: current } = await supabase
      .from('representantes')
      .select('*')
      .eq('id', params.id)
      .single();

    const { id, ...updates } = params;

    // dados_anteriores armazena o estado anterior do registro, não os dados do PJE
    if (current) {
      updates.dados_anteriores = current;
    } else {
      updates.dados_anteriores = null;
    }

    const { data, error } = await supabase
      .from('representantes')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { sucesso: false, erro: 'Representante não encontrado' };
      }
      return {
        sucesso: false,
        erro: mapSupabaseError(error),
      };
    }

    return {
      sucesso: true,
      representante: converterParaRepresentante(data),
    };
  } catch (error) {
    console.error('Erro ao atualizar representante:', error);
    return {
      sucesso: false,
      erro: 'Erro ao atualizar representante',
    };
  }
}

/**
 * Buscar representante por ID
 */
export async function buscarRepresentantePorId(id: number): Promise<Representante | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('representantes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return converterParaRepresentante(data);
  } catch (error) {
    console.error('Erro ao buscar representante:', error);
    return null;
  }
}

/**
 * Buscar representantes por parte
 */
export async function buscarRepresentantesPorParte(
  params: BuscarRepresentantesPorParteParams
): Promise<Representante[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('representantes')
      .select('*')
      .eq('parte_tipo', params.parte_tipo)
      .eq('parte_id', params.parte_id);

    if (params.trt) {
      query = query.eq('trt', params.trt);
    }

    if (params.grau) {
      query = query.eq('grau', params.grau);
    }

    query = query.order('ordem', { ascending: true }).order('nome', { ascending: true });

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map(converterParaRepresentante);
  } catch (error) {
    console.error('Erro ao buscar representantes por parte:', error);
    return [];
  }
}

/**
 * Buscar representantes por número OAB
 */
export async function buscarRepresentantesPorOAB(
  params: BuscarRepresentantesPorOABParams
): Promise<Representante[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('representantes')
      .select('*')
      .eq('numero_oab', params.numero_oab);

    if (params.trt) {
      query = query.eq('trt', params.trt);
    }

    if (params.grau) {
      query = query.eq('grau', params.grau);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map(converterParaRepresentante);
  } catch (error) {
    console.error('Erro ao buscar representantes por OAB:', error);
    return [];
  }
}

/**
 * Buscar representantes por processo
 */
export async function buscarRepresentantesPorProcesso(
  params: BuscarRepresentantesPorProcessoParams
): Promise<Representante[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('representantes')
      .select('*')
      .eq('numero_processo', params.numero_processo)
      .eq('trt', params.trt)
      .eq('grau', params.grau)
      .order('parte_tipo', { ascending: true })
      .order('ordem', { ascending: true });

    if (error || !data) return [];

    return data.map(converterParaRepresentante);
  } catch (error) {
    console.error('Erro ao buscar representantes por processo:', error);
    return [];
  }
}

/**
 * Listar representantes com paginação e filtros
 */
export async function listarRepresentantes(
  params: ListarRepresentantesParams
): Promise<ListarRepresentantesResult> {
  try {
    const supabase = await createClient();

    const pagina = params.pagina || 1;
    const limite = Math.min(params.limite || 50, 100);
    const offset = (pagina - 1) * limite;

    // Build query with filters
    let query = supabase.from('representantes').select('*', { count: 'exact' });

    if (params.parte_tipo) {
      query = query.eq('parte_tipo', params.parte_tipo);
    }
    if (params.parte_id) {
      query = query.eq('parte_id', params.parte_id);
    }
    if (params.trt) {
      query = query.eq('trt', params.trt);
    }
    if (params.grau) {
      query = query.eq('grau', params.grau);
    }
    if (params.numero_processo) {
      query = query.eq('numero_processo', params.numero_processo);
    }
    if (params.numero_oab) {
      query = query.eq('numero_oab', params.numero_oab);
    }
    if (params.situacao_oab) {
      query = query.eq('situacao_oab', params.situacao_oab);
    }
    if (params.tipo_pessoa) {
      query = query.eq('tipo_pessoa', params.tipo_pessoa);
    }
    if (params.busca) {
      query = query.or(`nome.ilike.%${params.busca}%,cpf.ilike.%${params.busca}%,cnpj.ilike.%${params.busca}%,email.ilike.%${params.busca}%`);
    }

    // Apply ordering
    const ordenarPor = params.ordenar_por || 'nome';
    const ordem = params.ordem === 'desc' ? { ascending: false } : { ascending: true };
    query = query.order(ordenarPor, ordem);

    // Apply pagination
    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao listar representantes:', error);
      return {
        representantes: [],
        total: 0,
        pagina,
        limite,
        totalPaginas: 0,
      };
    }

    const total = count || 0;
    const totalPaginas = Math.ceil(total / limite);

    return {
      representantes: (data || []).map(converterParaRepresentante),
      total,
      pagina,
      limite,
      totalPaginas,
    };
  } catch (error) {
    console.error('Erro ao listar representantes:', error);
    return {
      representantes: [],
      total: 0,
      pagina: params.pagina || 1,
      limite: params.limite || 50,
      totalPaginas: 0,
    };
  }
}

/**
 * Upsert representante por id_pessoa_pje + context (idempotente)
 */
export async function upsertRepresentantePorIdPessoa(
  params: UpsertRepresentantePorIdPessoaParams
): Promise<OperacaoRepresentanteResult> {
  try {
    const supabase = await createClient();

    // Busca pela chave composta completa (id_pessoa_pje + parte_id + parte_tipo + trt + grau + numero_processo) para respeitar constraint UNIQUE
    const { data: existing } = await supabase
      .from('representantes')
      .select('id')
      .eq('id_pessoa_pje', params.id_pessoa_pje)
      .eq('parte_id', params.parte_id)
      .eq('parte_tipo', params.parte_tipo)
      .eq('trt', params.trt)
      .eq('grau', params.grau)
      .eq('numero_processo', params.numero_processo)
      .maybeSingle();

    if (existing) {
      // Update existing
      return await atualizarRepresentante({
        id: existing.id,
        ...params,
      });
    } else {
      // Create new
      return await criarRepresentante(params);
    }
  } catch (error) {
    console.error('Erro ao fazer upsert de representante:', error);
    return {
      sucesso: false,
      erro: 'Erro ao fazer upsert de representante',
    };
  }
}

/**
 * Deletar representante
 */
export async function deletarRepresentante(id: number): Promise<OperacaoRepresentanteResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('representantes')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return { sucesso: false, erro: 'Representante não encontrado' };
      }
      return {
        sucesso: false,
        erro: mapSupabaseError(error),
      };
    }

    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao deletar representante:', error);
    return {
      sucesso: false,
      erro: 'Erro ao deletar representante',
    };
  }
}

/**
 * Upsert múltiplos representantes em batch (operação atômica no banco)
 * Retorna array com resultados individuais por registro
 */
export async function upsertRepresentantesEmLote(
  listaParams: UpsertRepresentantePorIdPessoaParams[]
): Promise<OperacaoRepresentanteResult[]> {
  try {
    if (listaParams.length === 0) {
      return [];
    }

    const supabase = await createClient();

    // Usa upsert do Supabase com onConflict na chave única composta
    // Unique index: (id_pessoa_pje, parte_id, parte_tipo, trt, grau, numero_processo)
    const { data, error } = await supabase
      .from('representantes')
      .upsert(listaParams, {
        onConflict: 'id_pessoa_pje,parte_id,parte_tipo,trt,grau,numero_processo',
        ignoreDuplicates: false, // Atualiza se já existe
      })
      .select();

    if (error) {
      console.error('Erro no upsert em lote de representantes:', error);
      // Se falhou o batch todo, retorna erro para todos
      return listaParams.map(() => ({
        sucesso: false,
        erro: mapSupabaseError(error),
      }));
    }

    // Mapeia resultados individuais
    if (!data || data.length === 0) {
      return listaParams.map(() => ({
        sucesso: false,
        erro: 'Nenhum representante foi inserido/atualizado',
      }));
    }

    // Supabase retorna os registros upserted
    return data.map(row => ({
      sucesso: true,
      representante: converterParaRepresentante(row),
    }));
  } catch (error) {
    console.error('Erro inesperado no upsert em lote:', error);
    return listaParams.map(() => ({
      sucesso: false,
      erro: 'Erro inesperado no upsert em lote',
    }));
  }
}

// ============================================================================
// Funções com JOIN para endereços
// ============================================================================

/**
 * Busca um representante por ID com endereço populado via LEFT JOIN
 */
export async function buscarRepresentanteComEndereco(
  id: number
): Promise<RepresentanteComEndereco | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('representantes')
    .select(`
      *,
      endereco:enderecos(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar representante com endereço: ${error.message}`);
  }

  if (!data) return null;

  const representante = converterParaRepresentante(data);
  const endereco = data.endereco ? converterParaEndereco(data.endereco) : null;

  return {
    ...representante,
    endereco,
  } as RepresentanteComEndereco;
}

/**
 * Lista representantes com endereços populados via LEFT JOIN
 */
export async function listarRepresentantesComEndereco(
  params: ListarRepresentantesParams = {}
): Promise<ListarRepresentantesResult & { representantes: RepresentanteComEndereco[] }> {
  const supabase = await createClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  let query = supabase.from('representantes').select(
    `
      *,
      endereco:enderecos(*)
    `,
    { count: 'exact' }
  );

  // Aplicar filtros
  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(`nome.ilike.%${busca}%,numero_oab.ilike.%${busca}%,cpf.ilike.%${busca}%`);
  }

  if (params.tipo_pessoa) {
    query = query.eq('tipo_pessoa', params.tipo_pessoa);
  }

  if (params.parte_tipo) {
    query = query.eq('parte_tipo', params.parte_tipo);
  }

  if (params.parte_id) {
    query = query.eq('parte_id', params.parte_id);
  }

  if (params.numero_processo) {
    query = query.eq('numero_processo', params.numero_processo);
  }

  if (params.nome) {
    query = query.ilike('nome', `%${params.nome}%`);
  }

  if (params.numero_oab) {
    query = query.eq('numero_oab', params.numero_oab);
  }

  if (params.situacao_oab) {
    query = query.eq('situacao_oab', params.situacao_oab);
  }

  if (params.id_pessoa_pje) {
    query = query.eq('id_pessoa_pje', params.id_pessoa_pje);
  }

  // Ordenação
  const ordenarPor = params.ordenar_por ?? 'created_at';
  const ordem = params.ordem ?? 'desc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Aplicar paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar representantes com endereço: ${error.message}`);
  }

  const representantes = (data || []).map((row) => {
    const representante = converterParaRepresentante(row);
    const endereco = row.endereco ? converterParaEndereco(row.endereco) : null;
    return {
      ...representante,
      endereco,
    } as RepresentanteComEndereco;
  });

  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    representantes,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}