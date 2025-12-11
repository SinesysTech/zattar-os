/**
 * Partes > Representantes > Repository
 *
 * Camada de acesso a dados para representantes (tabela public.representantes).
 * Mantém o contrato do antigo backend, porém dentro de features (FSD).
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type {
  AtualizarRepresentanteParams,
  BuscarRepresentantesPorOABParams,
  CriarRepresentanteParams,
  ListarRepresentantesParams,
  ListarRepresentantesResult,
  OperacaoRepresentanteResult,
  Representante,
  RepresentanteComEndereco,
  UpsertRepresentantePorCPFParams,
} from '../types/representantes-types';

type Ordem = 'asc' | 'desc';

function normalizarCpf(cpf: string): string {
  return cpf.replace(/[.\-\s]/g, '');
}

function toOrder(ordem?: Ordem): boolean {
  return (ordem ?? 'asc') === 'asc';
}

function calcularPaginacao(pagina?: number, limite?: number) {
  const paginaFinal = pagina && pagina > 0 ? pagina : 1;
  const limiteFinal = limite && limite > 0 ? limite : 50;
  const offset = (paginaFinal - 1) * limiteFinal;
  return { pagina: paginaFinal, limite: limiteFinal, offset };
}

async function buscarPorId(id: number): Promise<Representante | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('representantes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao buscar representante: ${error.message}`);
  }

  return (data as Representante) || null;
}

export async function buscarRepresentantePorId(id: number): Promise<Representante | null> {
  return await buscarPorId(id);
}

export async function buscarRepresentantePorIdComEndereco(
  id: number
): Promise<RepresentanteComEndereco | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('representantes')
    .select('*, enderecos(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao buscar representante com endereço: ${error.message}`);
  }

  return (data as unknown as RepresentanteComEndereco) || null;
}

export async function buscarRepresentantePorCPF(cpf: string): Promise<Representante | null> {
  const supabase = createServiceClient();
  const cpfNormalizado = normalizarCpf(cpf);

  const { data, error } = await supabase
    .from('representantes')
    .select('*')
    .eq('cpf', cpfNormalizado)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao buscar representante por CPF: ${error.message}`);
  }

  return (data as Representante) || null;
}

export async function listarRepresentantes(
  params: ListarRepresentantesParams
): Promise<ListarRepresentantesResult> {
  const supabase = createServiceClient();
  const { pagina, limite, offset } = calcularPaginacao(params.pagina, params.limite);

  let query = supabase
    .from('representantes')
    .select('*', { count: 'exact' });

  if (params.nome) query = query.ilike('nome', `%${params.nome}%`);
  if (params.cpf) query = query.eq('cpf', normalizarCpf(params.cpf));

  // Busca textual (nome, cpf, email). Evitamos operar em JSONB para performance/compatibilidade.
  if (params.busca) {
    const termo = params.busca.trim();
    if (termo) {
      query = query.or(
        `nome.ilike.%${termo}%,cpf.ilike.%${termo}%,email.ilike.%${termo}%`
      );
    }
  }

  // Filtro por OAB (melhor esforço via containment em JSONB).
  // OBS: contém exige match exato do objeto.
  if (params.oab) {
    const oab = params.oab.trim();
    if (oab) {
      // tenta como veio (ex: "MG128404")
      query = query.contains('oabs', [{ numero: oab }]);
    }
  }

  if (params.uf_oab) {
    const uf = params.uf_oab.trim().toUpperCase();
    if (uf) {
      query = query.contains('oabs', [{ uf }]);
    }
  }

  const ordenarPor = params.ordenar_por ?? 'nome';
  const ordemAsc = toOrder(params.ordem);

  query = query
    .order(ordenarPor, { ascending: ordemAsc })
    .range(offset, offset + limite - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Erro ao listar representantes: ${error.message}`);

  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / limite));

  return {
    representantes: (data as Representante[]) || [],
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

export async function listarRepresentantesComEndereco(
  params: ListarRepresentantesParams
): Promise<ListarRepresentantesResult> {
  const supabase = createServiceClient();
  const { pagina, limite, offset } = calcularPaginacao(params.pagina, params.limite);

  let query = supabase
    .from('representantes')
    .select('*, enderecos(*)', { count: 'exact' });

  if (params.nome) query = query.ilike('nome', `%${params.nome}%`);
  if (params.cpf) query = query.eq('cpf', normalizarCpf(params.cpf));

  if (params.busca) {
    const termo = params.busca.trim();
    if (termo) {
      query = query.or(
        `nome.ilike.%${termo}%,cpf.ilike.%${termo}%,email.ilike.%${termo}%`
      );
    }
  }

  if (params.oab) {
    const oab = params.oab.trim();
    if (oab) query = query.contains('oabs', [{ numero: oab }]);
  }

  if (params.uf_oab) {
    const uf = params.uf_oab.trim().toUpperCase();
    if (uf) query = query.contains('oabs', [{ uf }]);
  }

  const ordenarPor = params.ordenar_por ?? 'nome';
  const ordemAsc = toOrder(params.ordem);

  query = query
    .order(ordenarPor, { ascending: ordemAsc })
    .range(offset, offset + limite - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Erro ao listar representantes com endereço: ${error.message}`);

  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / limite));

  return {
    representantes: ((data as unknown as RepresentanteComEndereco[]) || []) as unknown as Representante[],
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

/**
 * Com processos: no estado atual do schema declarativo, não existe relacionamento
 * explícito de representantes em public.processo_partes. Mantemos o contrato e
 * retornamos a mesma estrutura, com processos_relacionados ausente.
 */
export async function listarRepresentantesComEnderecoEProcessos(
  params: ListarRepresentantesParams
): Promise<ListarRepresentantesResult> {
  return await listarRepresentantesComEndereco(params);
}

export async function criarRepresentante(
  params: CriarRepresentanteParams
): Promise<OperacaoRepresentanteResult> {
  const supabase = createServiceClient();
  const cpf = normalizarCpf(params.cpf);

  const { data, error } = await supabase
    .from('representantes')
    .insert({
      cpf,
      nome: params.nome.trim(),
      sexo: params.sexo ?? null,
      tipo: params.tipo ?? null,
      oabs: params.oabs ?? [],
      emails: params.emails ?? null,
      email: params.email ?? null,
      ddd_celular: params.ddd_celular ?? null,
      numero_celular: params.numero_celular ?? null,
      ddd_residencial: params.ddd_residencial ?? null,
      numero_residencial: params.numero_residencial ?? null,
      ddd_comercial: params.ddd_comercial ?? null,
      numero_comercial: params.numero_comercial ?? null,
      endereco_id: params.endereco_id ?? null,
      dados_anteriores: params.dados_anteriores ?? null,
    })
    .select('*')
    .single();

  if (error) {
    return { sucesso: false, erro: error.message };
  }

  return { sucesso: true, representante: data as Representante };
}

export async function atualizarRepresentante(
  params: AtualizarRepresentanteParams
): Promise<OperacaoRepresentanteResult> {
  const supabase = createServiceClient();
  const existente = await buscarPorId(params.id);

  if (!existente) {
    return { sucesso: false, erro: 'Representante não encontrado' };
  }

  const { id, ...patch } = params;

  const payload: Record<string, unknown> = {
    ...patch,
    // Auditoria: preserva snapshot anterior
    dados_anteriores: {
      ...existente,
      updated_at: existente.updated_at,
    },
    updated_at: new Date().toISOString(),
  };

  if (payload.cpf && typeof payload.cpf === 'string') payload.cpf = normalizarCpf(payload.cpf);
  if (payload.nome && typeof payload.nome === 'string') payload.nome = payload.nome.trim();

  const { data, error } = await supabase
    .from('representantes')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return { sucesso: false, erro: error.message };
  }

  return { sucesso: true, representante: data as Representante };
}

export async function deletarRepresentante(id: number): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('representantes')
    .delete()
    .eq('id', id);

  if (error) return { sucesso: false, erro: error.message };
  return { sucesso: true };
}

export async function upsertRepresentantePorCPF(
  params: UpsertRepresentantePorCPFParams
): Promise<{ sucesso: boolean; representante?: Representante; criado: boolean; erro?: string }> {
  const cpf = normalizarCpf(params.cpf);
  const existente = await buscarRepresentantePorCPF(cpf);

  if (existente) {
    const atualizado = await atualizarRepresentante({
      id: existente.id,
      cpf,
      nome: params.nome,
      sexo: params.sexo ?? null,
      tipo: params.tipo ?? null,
      oabs: params.oabs ?? [],
      emails: params.emails ?? null,
      email: params.email ?? null,
      ddd_celular: params.ddd_celular ?? null,
      numero_celular: params.numero_celular ?? null,
      ddd_residencial: params.ddd_residencial ?? null,
      numero_residencial: params.numero_residencial ?? null,
      ddd_comercial: params.ddd_comercial ?? null,
      numero_comercial: params.numero_comercial ?? null,
      endereco_id: params.endereco_id ?? null,
    });

    return {
      sucesso: atualizado.sucesso,
      representante: atualizado.representante,
      criado: false,
      erro: atualizado.erro,
    };
  }

  const criado = await criarRepresentante(params);
  return {
    sucesso: criado.sucesso,
    representante: criado.representante,
    criado: true,
    erro: criado.erro,
  };
}

export async function buscarRepresentantePorNome(nome: string): Promise<Representante[]> {
  const supabase = createServiceClient();
  const nomeTrim = nome.trim();

  const { data, error } = await supabase
    .from('representantes')
    .select('*')
    .ilike('nome', `%${nomeTrim}%`)
    .order('nome', { ascending: true })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data as Representante[]) || [];
}

export async function buscarRepresentantesPorOAB(
  params: BuscarRepresentantesPorOABParams
): Promise<Representante[]> {
  const supabase = createServiceClient();
  const oab = params.oab.trim();
  const uf = params.uf?.trim().toUpperCase();

  let query = supabase.from('representantes').select('*');

  if (uf) {
    query = query.contains('oabs', [{ uf, numero: oab }]);
  } else {
    query = query.contains('oabs', [{ numero: oab }]);
  }

  const { data, error } = await query.order('nome', { ascending: true }).limit(100);
  if (error) throw new Error(error.message);
  return (data as Representante[]) || [];
}


