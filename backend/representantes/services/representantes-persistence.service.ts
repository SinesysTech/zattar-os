/**
 * Serviço de Persistência para Representantes
 * Implementa todas as operações CRUD com validação e type safety
 *
 * MUDANÇA DE PARADIGMA: Representantes agora são únicos por CPF, e o vínculo com processos é feito via processo_partes.
 * A tabela representantes tem UM registro por pessoa (CPF único), ao invés de um registro por (representante, processo).
 * Campos de contexto de processo (trt, grau, numero_processo, etc.) foram removidos.
 * O id_pessoa_pje foi movido para a tabela cadastros_pje, pois não é globalmente único.
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  Representante,
  RepresentanteComEndereco,
  CriarRepresentanteParams,
  AtualizarRepresentanteParams,
  ListarRepresentantesParams,
  ListarRepresentantesResult,
  BuscarRepresentantesPorOABParams,
  UpsertRepresentantePorCPFParams,
  BuscarRepresentantePorCPFParams,
  OperacaoRepresentanteResult,
} from '@/backend/types/representantes/representantes-types';
import { converterParaEndereco } from '@/backend/enderecos/services/enderecos-persistence.service';
import type { ProcessoRelacionado } from '@/backend/types/partes/processo-relacionado-types';

/**
 * Representante com processos relacionados
 */
export interface RepresentanteComProcessos extends Representante {
  processos_relacionados: ProcessoRelacionado[];
}

/**
 * Representante com endereço e processos relacionados
 */
export interface RepresentanteComEnderecoEProcessos extends RepresentanteComEndereco {
  processos_relacionados: ProcessoRelacionado[];
}

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
 * Converte row do banco para tipo Representante
 * Representantes são sempre pessoas físicas (advogados)
 */
export function converterParaRepresentante(data: Record<string, unknown>): Representante {
  // Parse JSON fields - emails é JSONB no banco, mas precisa ser convertido para string[]
  const rawEmails = data.emails;
  let emails: string[] | null = null;
  if (Array.isArray(rawEmails)) {
    emails = rawEmails as string[];
  } else if (rawEmails && typeof rawEmails === 'object') {
    // Se for objeto, tentar extrair valores como strings
    emails = Object.values(rawEmails).filter(v => typeof v === 'string') as string[];
    if (emails.length === 0) emails = null;
  }
  
  const dados_anteriores = data.dados_anteriores as Record<string, unknown> | null;

  // Convert date strings to Date or null
  const parseDate = (val: unknown): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return val;
    return new Date(val as string);
  };

  return {
    id: data.id as number,
    cpf: data.cpf as string,
    nome: data.nome as string,
    sexo: data.sexo as string | null,
    tipo: data.tipo as string | null,
    numero_oab: data.numero_oab as string | null,
    uf_oab: data.uf_oab as string | null,
    situacao_oab: data.situacao_oab as string | null,
    emails,
    email: data.email as string | null,
    ddd_celular: data.ddd_celular as string | null,
    numero_celular: data.numero_celular as string | null,
    ddd_residencial: data.ddd_residencial as string | null,
    numero_residencial: data.numero_residencial as string | null,
    ddd_comercial: data.ddd_comercial as string | null,
    numero_comercial: data.numero_comercial as string | null,
    endereco_id: data.endereco_id as number | null,
    dados_anteriores,
    created_at: parseDate(data.created_at),
    updated_at: parseDate(data.updated_at),
  };
}

// ============================================================================
// Error Mapping
// ============================================================================

function mapSupabaseError(error: { code?: string; message: string }): string {
  if (error.code === '23505') {
    // Unique constraint violation
    return 'Representante já cadastrado com este CPF';
  }
  if (error.code === '23503') {
    // Foreign key violation
    return 'Endereço não encontrado';
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
    if (!params.cpf || !params.nome) {
      return {
        sucesso: false,
        erro: 'Campos obrigatórios não informados',
      };
    }

    // Validate CPF
    if (!validarCPF(params.cpf)) {
      return { sucesso: false, erro: 'CPF inválido' };
    }

    // Validate OAB if provided
    if (params.numero_oab && !validarOAB(params.numero_oab)) {
      return { sucesso: false, erro: 'Número OAB inválido' };
    }

    // Validate email if provided
    if (params.email && !validarEmail(params.email)) {
      return { sucesso: false, erro: 'Email inválido' };
    }

    const supabase = createServiceClient();

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

    // Validate CPF if provided
    if (params.cpf && !validarCPF(params.cpf)) {
      return { sucesso: false, erro: 'CPF inválido' };
    }

    // Validate email if provided
    if (params.email && !validarEmail(params.email)) {
      return { sucesso: false, erro: 'Email inválido' };
    }

    // Validate OAB if provided
    if (params.numero_oab && !validarOAB(params.numero_oab)) {
      return { sucesso: false, erro: 'Número OAB inválido' };
    }

    const supabase = createServiceClient();

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
export async function buscarRepresentante(id: number): Promise<Representante | null> {
  try {
    const supabase = createServiceClient();

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
 * Buscar representante por CPF
 */
export async function buscarRepresentantePorCPF(cpf: string): Promise<Representante | null> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('representantes')
      .select('*')
      .eq('cpf', cpf)
      .single();

    if (error || !data) return null;

    return converterParaRepresentante(data);
  } catch (error) {
    console.error('Erro ao buscar representante por CPF:', error);
    return null;
  }
}

/**
 * Buscar representantes por número OAB
 */
export async function buscarRepresentantesPorOAB(
  params: BuscarRepresentantesPorOABParams
): Promise<Representante[]> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('representantes')
      .select('*')
      .eq('numero_oab', params.numero_oab);

    if (error || !data) return [];

    return data.map(converterParaRepresentante);
  } catch (error) {
    console.error('Erro ao buscar representantes por OAB:', error);
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
    const supabase = createServiceClient();

    const pagina = params.pagina || 1;
    const limite = Math.min(params.limite || 50, 100);
    const offset = (pagina - 1) * limite;

    // Build query with filters
    let query = supabase.from('representantes').select('*', { count: 'exact' });

    if (params.cpf) {
      query = query.eq('cpf', params.cpf);
    }
    if (params.numero_oab) {
      query = query.eq('numero_oab', params.numero_oab);
    }
    if (params.situacao_oab) {
      query = query.eq('situacao_oab', params.situacao_oab);
    }
    if (params.busca) {
      query = query.or(`nome.ilike.%${params.busca}%,cpf.ilike.%${params.busca}%,email.ilike.%${params.busca}%`);
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
 * Upsert representante por CPF (idempotente)
 */
export async function upsertRepresentantePorCPF(
  params: UpsertRepresentantePorCPFParams
): Promise<OperacaoRepresentanteResult & { criado: boolean }> {
  try {
    const supabase = createServiceClient();

    // Validate CPF
    if (!validarCPF(params.cpf)) {
      return { sucesso: false, erro: 'CPF inválido', criado: false };
    }

    // Check if exists
    const { data: existing } = await supabase
      .from('representantes')
      .select('id')
      .eq('cpf', params.cpf)
      .maybeSingle();

    const criado = !existing;

    const { data, error } = await supabase
      .from('representantes')
      .upsert(params, { onConflict: 'cpf' })
      .select()
      .single();

    if (error) {
      return {
        sucesso: false,
        erro: mapSupabaseError(error),
        criado: false,
      };
    }

    return {
      sucesso: true,
      representante: converterParaRepresentante(data),
      criado,
    };
  } catch (error) {
    console.error('Erro ao fazer upsert de representante:', error);
    return {
      sucesso: false,
      erro: 'Erro ao fazer upsert de representante',
      criado: false,
    };
  }
}

/**
 * Deletar representante
 */
export async function deletarRepresentante(id: number): Promise<OperacaoRepresentanteResult> {
  try {
    const supabase = createServiceClient();

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

// ============================================================================
// Funções com JOIN para endereços
// ============================================================================

/**
 * Busca um representante por ID com endereço populado via LEFT JOIN
 */
export async function buscarRepresentanteComEndereco(
  id: number
): Promise<RepresentanteComEndereco | null> {
  const supabase = createServiceClient();

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
  const supabase = createServiceClient();

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

  if (params.cpf) {
    query = query.eq('cpf', params.cpf);
  }

  if (params.numero_oab) {
    query = query.eq('numero_oab', params.numero_oab);
  }

  if (params.situacao_oab) {
    query = query.eq('situacao_oab', params.situacao_oab);
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

  const representantes = (data || []).map((row: Record<string, unknown> & { endereco?: Record<string, unknown> | null }) => {
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

// ============================================================================
// Funções com JOIN para processos relacionados
// ============================================================================

/**
 * Lista representantes com endereços e processos relacionados via processo_partes
 * Os processos são buscados via JOIN na tabela processo_partes onde tipo_entidade = 'representante'
 */
export async function listarRepresentantesComEnderecoEProcessos(
  params: ListarRepresentantesParams = {}
): Promise<ListarRepresentantesResult & { representantes: RepresentanteComEnderecoEProcessos[] }> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  // Primeiro buscar representantes com endereço
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

  if (params.cpf) {
    query = query.eq('cpf', params.cpf);
  }

  if (params.numero_oab) {
    query = query.eq('numero_oab', params.numero_oab);
  }

  if (params.situacao_oab) {
    query = query.eq('situacao_oab', params.situacao_oab);
  }

  // Ordenação
  const ordenarPor = params.ordenar_por ?? 'created_at';
  const ordem = params.ordem ?? 'desc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Aplicar paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar representantes com endereço e processos: ${error.message}`);
  }

  // Extrair IDs dos representantes para buscar processos
  const representanteIds = (data || []).map((row) => row.id as number);

  // Buscar processos relacionados para todos os representantes de uma vez
  const processosMap: Map<number, ProcessoRelacionado[]> = new Map();

  if (representanteIds.length > 0) {
    const { data: processosData, error: processosError } = await supabase
      .from('processo_partes')
      .select('entidade_id, processo_id, numero_processo, tipo_parte, polo')
      .eq('tipo_entidade', 'representante')
      .in('entidade_id', representanteIds);

    if (!processosError && processosData) {
      // Agrupar processos por entidade_id
      for (const processo of processosData) {
        const entidadeId = processo.entidade_id as number;
        if (!processosMap.has(entidadeId)) {
          processosMap.set(entidadeId, []);
        }
        processosMap.get(entidadeId)!.push({
          processo_id: processo.processo_id as number,
          numero_processo: processo.numero_processo as string,
          tipo_parte: processo.tipo_parte as string,
          polo: processo.polo as string,
        });
      }
    }
  }

  const representantes = (data || []).map((row: Record<string, unknown> & { endereco?: Record<string, unknown> | null }) => {
    const representante = converterParaRepresentante(row);
    const endereco = row.endereco ? converterParaEndereco(row.endereco) : null;
    const processos_relacionados = processosMap.get(row.id as number) || [];
    return {
      ...representante,
      endereco,
      processos_relacionados,
    } as RepresentanteComEnderecoEProcessos;
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