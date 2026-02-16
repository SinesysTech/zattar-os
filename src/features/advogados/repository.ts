/**
 * Repository Layer for Advogados Feature
 * Data access and persistence operations
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type {
  Advogado,
  CriarAdvogadoParams,
  AtualizarAdvogadoParams,
  ListarAdvogadosParams,
  ListarAdvogadosResult,
  Credencial,
  CredencialComAdvogado,
  CriarCredencialParams,
  AtualizarCredencialParams,
  ListarCredenciaisParams,
  OabEntry,
  GrauCredencial,
} from './domain';

// ============================================================================
// Conversão GrauCredencial ('1'|'2') ↔ grau_tribunal (enum do banco)
// ============================================================================

const GRAU_TO_DB: Record<string, string> = {
  '1': 'primeiro_grau',
  '2': 'segundo_grau',
};

const GRAU_FROM_DB: Record<string, string> = {
  'primeiro_grau': '1',
  'segundo_grau': '2',
  'tribunal_superior': '2',
};

/** Converte GrauCredencial ('1'/'2') para valor do enum grau_tribunal no banco */
function grauToDb(grau: string): string {
  return GRAU_TO_DB[grau] ?? grau;
}

/** Converte valor do enum grau_tribunal do banco para GrauCredencial ('1'/'2') */
function grauFromDb(grau: string): GrauCredencial {
  return (GRAU_FROM_DB[grau] ?? '1') as GrauCredencial;
}

// ============================================================================
// Advogados
// ============================================================================

/**
 * Criar um novo advogado
 */
export async function criarAdvogado(params: CriarAdvogadoParams): Promise<Advogado> {
  const supabase = createServiceClient();

  // Normalizar OABs
  const normalizedOabs = params.oabs.map((oab) => ({
    numero: oab.numero.trim(),
    uf: oab.uf.trim().toUpperCase(),
  }));

  const { data, error } = await supabase
    .from('advogados')
    .insert({
      nome_completo: params.nome_completo.trim(),
      cpf: params.cpf.replace(/\D/g, ''),
      oabs: normalizedOabs,
    })
    .select()
    .single();

  if (error) {
    // Verificar erro de duplicidade (unique constraint)
    if (error.code === '23505') {
      throw new Error('Já existe um advogado cadastrado com este CPF');
    }
    throw new Error(`Erro ao criar advogado: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao criar advogado: nenhum dado retornado');
  }

  return data as Advogado;
}

/**
 * Buscar advogado por ID
 */
export async function buscarAdvogado(id: number): Promise<Advogado | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('advogados')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar advogado: ${error.message}`);
  }

  return data as Advogado;
}

/**
 * Buscar advogado por CPF
 */
export async function buscarAdvogadoPorCpf(cpf: string): Promise<Advogado | null> {
  const supabase = createServiceClient();
  const cpfLimpo = cpf.replace(/\D/g, '');

  const { data, error } = await supabase
    .from('advogados')
    .select('*')
    .eq('cpf', cpfLimpo)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar advogado: ${error.message}`);
  }

  return data as Advogado;
}

/**
 * Atualizar advogado
 */
export async function atualizarAdvogado(
  id: number,
  params: AtualizarAdvogadoParams
): Promise<Advogado> {
  const supabase = createServiceClient();

  // Montar objeto de atualização apenas com campos fornecidos
  const updateData: Record<string, unknown> = {};

  if (params.nome_completo !== undefined) {
    updateData.nome_completo = params.nome_completo.trim();
  }
  if (params.cpf !== undefined) {
    updateData.cpf = params.cpf.replace(/\D/g, '');
  }
  if (params.oabs !== undefined) {
    updateData.oabs = params.oabs.map((oab) => ({
      numero: oab.numero.trim(),
      uf: oab.uf.trim().toUpperCase(),
    }));
  }

  const { data, error } = await supabase
    .from('advogados')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Advogado não encontrado');
    }
    if (error.code === '23505') {
      throw new Error('Já existe um advogado cadastrado com este CPF');
    }
    throw new Error(`Erro ao atualizar advogado: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao atualizar advogado: nenhum dado retornado');
  }

  return data as Advogado;
}

/**
 * Listar advogados com filtros e paginação
 */
export async function listarAdvogados(
  params: ListarAdvogadosParams = {}
): Promise<ListarAdvogadosResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = Math.min(params.limite ?? 50, 100); // Máximo 100
  const offset = (pagina - 1) * limite;

  let query = supabase.from('advogados').select('*', { count: 'exact' });

  // Filtro de busca (nome, CPF)
  // Nota: busca por OAB em JSONB seria mais complexa, fazemos apenas por nome/CPF
  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(`nome_completo.ilike.%${busca}%,cpf.ilike.%${busca}%`);
  }

  // Filtro por OAB específica usando containment JSONB
  // Busca advogados que tenham uma OAB com o número e/ou UF especificados
  if (params.oab && params.uf_oab) {
    query = query.contains('oabs', [
      { numero: params.oab.trim(), uf: params.uf_oab.trim().toUpperCase() },
    ]);
  } else if (params.uf_oab) {
    // Filtrar apenas por UF - busca advogados que tenham alguma OAB nessa UF
    // Usando raw filter para JSONB
    query = query.filter(
      'oabs',
      'cs',
      JSON.stringify([{ uf: params.uf_oab.trim().toUpperCase() }])
    );
  }

  // Filtro por advogados com credenciais ativas
  if (params.com_credenciais === true) {
    // Buscar IDs de advogados com credenciais ativas primeiro
    const { data: credenciaisAtivas } = await supabase
      .from('credenciais')
      .select('advogado_id')
      .eq('active', true);

    if (credenciaisAtivas && credenciaisAtivas.length > 0) {
      const idsUnicos = Array.from(
        new Set(credenciaisAtivas.map((c: { advogado_id: number }) => c.advogado_id))
      );
      query = query.in('id', idsUnicos);
    } else {
      // Se não há credenciais ativas, retornar lista vazia
      return {
        advogados: [],
        total: 0,
        pagina,
        limite,
        totalPaginas: 0,
      };
    }
  }

  // Ordenação
  query = query.order('nome_completo', { ascending: true });

  // Paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar advogados: ${error.message}`);
  }

  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    advogados: (data || []) as Advogado[],
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

// ============================================================================
// Credenciais
// ============================================================================

/**
 * Criar uma nova credencial
 */
export async function criarCredencial(params: CriarCredencialParams): Promise<Credencial> {
  const supabase = createServiceClient();

  // Verificar se advogado existe
  const { data: advogado } = await supabase
    .from('advogados')
    .select('id')
    .eq('id', params.advogado_id)
    .single();

  if (!advogado) {
    throw new Error('Advogado não encontrado');
  }

  // Verificar se já existe credencial ativa para mesmo tribunal e grau
  const { data: existente } = await supabase
    .from('credenciais')
    .select('id')
    .eq('advogado_id', params.advogado_id)
    .eq('tribunal', params.tribunal)
    .eq('grau', grauToDb(params.grau))
    .eq('active', true)
    .single();

  if (existente) {
    throw new Error(
      `Já existe credencial ativa para este advogado, tribunal ${params.tribunal} e grau ${params.grau}`
    );
  }

  const { data, error } = await supabase
    .from('credenciais')
    .insert({
      advogado_id: params.advogado_id,
      tribunal: params.tribunal,
      grau: grauToDb(params.grau),
      usuario: params.usuario || null, // Login PJE (null = usar CPF do advogado)
      senha: params.senha,
      active: params.active !== undefined ? params.active : true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar credencial: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao criar credencial: nenhum dado retornado');
  }

  // Retornar sem senha por segurança, convertendo grau de volta
  const { senha: _senha, ...credencialSemSenha } = data;
  return { ...credencialSemSenha, grau: grauFromDb(credencialSemSenha.grau) } as Credencial;
}

/**
 * Buscar credencial por ID
 */
export async function buscarCredencial(id: number): Promise<Credencial | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('credenciais')
    .select('id, advogado_id, tribunal, grau, usuario, active, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar credencial: ${error.message}`);
  }

  if (!data) return null;
  return { ...data, grau: grauFromDb(data.grau) } as Credencial;
}

/**
 * Atualizar credencial
 */
export async function atualizarCredencial(
  id: number,
  params: AtualizarCredencialParams
): Promise<Credencial> {
  const supabase = createServiceClient();

  // Se tribunal ou grau está sendo atualizado, verificar unicidade
  if (params.tribunal !== undefined || params.grau !== undefined) {
    // Buscar credencial atual para obter advogado_id
    const { data: credencialAtual } = await supabase
      .from('credenciais')
      .select('advogado_id, tribunal, grau')
      .eq('id', id)
      .single();

    if (!credencialAtual) {
      throw new Error('Credencial não encontrada');
    }

    const tribunalFinal = params.tribunal ?? credencialAtual.tribunal;
    // credencialAtual.grau vem do banco (formato DB), params.grau vem da UI (formato '1'/'2')
    const grauFinal = params.grau !== undefined ? grauToDb(params.grau) : credencialAtual.grau;

    // Verificar se já existe outra credencial ativa com mesma combinação
    const { data: existente } = await supabase
      .from('credenciais')
      .select('id')
      .eq('advogado_id', credencialAtual.advogado_id)
      .eq('tribunal', tribunalFinal)
      .eq('grau', grauFinal)
      .eq('active', true)
      .neq('id', id)
      .single();

    if (existente) {
      throw new Error(
        `Já existe credencial ativa para este advogado, tribunal ${tribunalFinal} e grau ${grauFinal}`
      );
    }
  }

  // Montar objeto de atualização apenas com campos fornecidos
  const updateData: Partial<{
    tribunal: string;
    grau: string;
    usuario: string | null;
    senha: string;
    active: boolean;
  }> = {};

  if (params.tribunal !== undefined) {
    updateData.tribunal = params.tribunal;
  }
  if (params.grau !== undefined) {
    updateData.grau = grauToDb(params.grau);
  }
  if (params.usuario !== undefined) {
    updateData.usuario = params.usuario; // null = usar CPF do advogado
  }
  if (params.senha !== undefined) {
    updateData.senha = params.senha;
  }
  if (params.active !== undefined) {
    updateData.active = params.active;
  }

  const { data, error } = await supabase
    .from('credenciais')
    .update(updateData)
    .eq('id', id)
    .select('id, advogado_id, tribunal, grau, usuario, active, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Credencial não encontrada');
    }
    throw new Error(`Erro ao atualizar credencial: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao atualizar credencial: nenhum dado retornado');
  }

  return { ...data, grau: grauFromDb(data.grau) } as Credencial;
}

/**
 * Listar credenciais de um advogado
 */
export async function listarCredenciais(
  params: ListarCredenciaisParams
): Promise<CredencialComAdvogado[]> {
  const supabase = createServiceClient();

  // Usamos join para sempre retornar dados do advogado no mesmo roundtrip.
  // Isso permite listar credenciais por advogado (quando params.advogado_id existe)
  // e também listar todas as credenciais (quando omitido), que é útil para mapeamentos.
  let query = supabase.from('credenciais').select(`
    id,
    advogado_id,
    tribunal,
    grau,
    usuario,
    active,
    created_at,
    updated_at,
    advogados:advogados (
      nome_completo,
      cpf,
      oabs
    )
  `);

  if (params.advogado_id !== undefined) {
    query = query.eq('advogado_id', params.advogado_id);
  }

  // Filtro por status ativo/inativo
  if (params.active !== undefined) {
    query = query.eq('active', params.active);
  }

  // Ordenação
  query = query.order('tribunal', { ascending: true }).order('grau', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar credenciais: ${error.message}`);
  }

  type CredencialRow = Omit<CredencialComAdvogado, 'advogado_nome' | 'advogado_cpf' | 'advogado_oabs'> & {
    advogados:
      | {
          nome_completo: string;
          cpf: string;
          oabs: OabEntry[];
        }
      | null;
  };

  const rows = (data || []) as unknown as CredencialRow[];

  // Normalizar shape para CredencialComAdvogado (converter grau do banco → UI)
  return rows.map((row): CredencialComAdvogado => {
    if (!row.advogados) {
      const { advogados: _unused, ...credencialData } = row;
      return {
        ...credencialData,
        grau: grauFromDb(credencialData.grau),
        advogado_nome: '-',
        advogado_cpf: '-',
        advogado_oabs: [],
      };
    }

    const { advogados, ...credencial } = row;
    return {
      ...credencial,
      grau: grauFromDb(credencial.grau),
      advogado_nome: advogados.nome_completo,
      advogado_cpf: advogados.cpf,
      advogado_oabs: advogados.oabs || [],
    };
  });
}

// ============================================================================
// Credenciais em Lote
// ============================================================================

/**
 * Busca credenciais existentes para um advogado com tribunais/graus específicos
 */
export async function buscarCredenciaisExistentes(
  advogado_id: number,
  tribunais: string[],
  graus: string[]
): Promise<{ tribunal: string; grau: string; id: number; active: boolean }[]> {
  const supabase = createServiceClient();

  // Converter graus da UI ('1'/'2') para valores do enum grau_tribunal do banco
  const grausDb = graus.map(grauToDb);

  const { data, error } = await supabase
    .from('credenciais')
    .select('id, tribunal, grau, active')
    .eq('advogado_id', advogado_id)
    .in('tribunal', tribunais)
    .in('grau', grausDb);

  if (error) {
    throw new Error(`Erro ao buscar credenciais existentes: ${error.message}`);
  }

  // Converter grau de volta para formato da UI
  return (data || []).map((row) => ({
    ...row,
    grau: grauFromDb(row.grau),
  })) as { tribunal: string; grau: string; id: number; active: boolean }[];
}

/**
 * Criar múltiplas credenciais em uma única operação (insert em lote)
 */
export async function criarCredenciaisEmLoteBatch(
  credenciais: Array<{
    advogado_id: number;
    tribunal: string;
    grau: string;
    usuario?: string | null;
    senha: string;
    active: boolean;
  }>
): Promise<Credencial[]> {
  const supabase = createServiceClient();

  // Converter grau da UI para formato do banco antes de inserir
  const credenciaisDb = credenciais.map((c) => ({ ...c, grau: grauToDb(c.grau) }));

  const { data, error } = await supabase
    .from('credenciais')
    .insert(credenciaisDb)
    .select('id, advogado_id, tribunal, grau, usuario, active, created_at, updated_at');

  if (error) {
    throw new Error(`Erro ao criar credenciais em lote: ${error.message}`);
  }

  // Converter grau de volta para formato da UI
  return (data || []).map((row) => ({ ...row, grau: grauFromDb(row.grau) })) as Credencial[];
}

/**
 * Atualizar senha de múltiplas credenciais
 */
export async function atualizarSenhaCredenciais(
  ids: number[],
  senha: string
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('credenciais')
    .update({ senha, active: true })
    .in('id', ids);

  if (error) {
    throw new Error(`Erro ao atualizar credenciais: ${error.message}`);
  }
}
