// Serviço de persistência de partes contrárias
// Gerencia operações de CRUD na tabela partes_contrarias

import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Tipo de pessoa
 */
export type TipoPessoa = 'pf' | 'pj';

/**
 * Gênero (reutilizando enum de usuários)
 */
export type GeneroParteContraria = 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_informar';

/**
 * Estado civil
 */
export type EstadoCivil = 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'outro';

/**
 * Estrutura do endereço em JSONB
 */
export interface Endereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  cep?: string;
}

/**
 * Dados para cadastro/atualização de parte contrária
 */
export interface ParteContrariaDados {
  tipoPessoa: TipoPessoa;
  nome: string;
  nomeFantasia?: string;
  cpf?: string; // Obrigatório se tipoPessoa = 'pf'
  cnpj?: string; // Obrigatório se tipoPessoa = 'pj'
  rg?: string;
  dataNascimento?: string; // ISO date string (YYYY-MM-DD)
  genero?: GeneroParteContraria;
  estadoCivil?: EstadoCivil;
  nacionalidade?: string;
  inscricaoEstadual?: string; // Pode ser usado tanto para PF quanto para PJ
  email?: string;
  telefonePrimario?: string;
  telefoneSecundario?: string;
  endereco?: Endereco;
  observacoes?: string;
  createdBy?: number;
  ativo?: boolean;
}

/**
 * Dados retornados do banco
 */
export interface ParteContraria {
  id: number;
  tipoPessoa: TipoPessoa;
  nome: string;
  nomeFantasia: string | null;
  cpf: string | null;
  cnpj: string | null;
  rg: string | null;
  dataNascimento: string | null;
  genero: GeneroParteContraria | null;
  estadoCivil: EstadoCivil | null;
  nacionalidade: string | null;
  inscricaoEstadual: string | null;
  email: string | null;
  telefonePrimario: string | null;
  telefoneSecundario: string | null;
  endereco: Endereco | null;
  observacoes: string | null;
  createdBy: number | null;
  dadosAnteriores: Record<string, unknown> | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Resultado de operação
 */
export interface OperacaoParteContrariaResult {
  sucesso: boolean;
  parteContraria?: ParteContraria;
  erro?: string;
}

/**
 * Parâmetros para listar partes contrárias
 */
export interface ListarPartesContrariasParams {
  pagina?: number;
  limite?: number;
  busca?: string; // Busca em nome, nome_fantasia, cpf, cnpj, email
  tipoPessoa?: TipoPessoa;
  ativo?: boolean;
}

/**
 * Resultado da listagem
 */
export interface ListarPartesContrariasResult {
  partesContrarias: ParteContraria[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Converte data ISO string para date ou null
 */
function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Valida CPF básico (formato)
 */
function validarCpf(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');
  return cpfLimpo.length === 11;
}

/**
 * Valida CNPJ básico (formato)
 */
function validarCnpj(cnpj: string): boolean {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  return cnpjLimpo.length === 14;
}

/**
 * Valida formato de e-mail
 */
function validarEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normaliza CPF removendo formatação
 */
function normalizarCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Normaliza CNPJ removendo formatação
 */
function normalizarCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Valida e normaliza endereço JSONB
 */
function validarEndereco(endereco: Endereco | undefined): Endereco | null {
  if (!endereco) return null;
  
  const enderecoLimpo: Endereco = {};
  
  if (endereco.logradouro?.trim()) {
    enderecoLimpo.logradouro = endereco.logradouro.trim();
  }
  if (endereco.numero?.trim()) {
    enderecoLimpo.numero = endereco.numero.trim();
  }
  if (endereco.complemento?.trim()) {
    enderecoLimpo.complemento = endereco.complemento.trim();
  }
  if (endereco.bairro?.trim()) {
    enderecoLimpo.bairro = endereco.bairro.trim();
  }
  if (endereco.cidade?.trim()) {
    enderecoLimpo.cidade = endereco.cidade.trim();
  }
  if (endereco.estado?.trim()) {
    enderecoLimpo.estado = endereco.estado.trim();
  }
  if (endereco.pais?.trim()) {
    enderecoLimpo.pais = endereco.pais.trim();
  }
  if (endereco.cep?.trim()) {
    enderecoLimpo.cep = endereco.cep.replace(/\D/g, '');
  }
  
  return Object.keys(enderecoLimpo).length > 0 ? enderecoLimpo : null;
}

/**
 * Converte dados do banco para formato de retorno
 */
function converterParaParteContraria(data: Record<string, unknown>): ParteContraria {
  return {
    id: data.id as number,
    tipoPessoa: data.tipo_pessoa as TipoPessoa,
    nome: data.nome as string,
    nomeFantasia: (data.nome_fantasia as string | null) ?? null,
    cpf: (data.cpf as string | null) ?? null,
    cnpj: (data.cnpj as string | null) ?? null,
    rg: (data.rg as string | null) ?? null,
    dataNascimento: (data.data_nascimento as string | null) ?? null,
    genero: (data.genero as GeneroParteContraria | null) ?? null,
    estadoCivil: (data.estado_civil as EstadoCivil | null) ?? null,
    nacionalidade: (data.nacionalidade as string | null) ?? null,
    inscricaoEstadual: (data.inscricao_estadual as string | null) ?? null,
    email: (data.email as string | null) ?? null,
    telefonePrimario: (data.telefone_primario as string | null) ?? null,
    telefoneSecundario: (data.telefone_secundario as string | null) ?? null,
    endereco: (data.endereco as Endereco | null) ?? null,
    observacoes: (data.observacoes as string | null) ?? null,
    createdBy: (data.created_by as number | null) ?? null,
    dadosAnteriores: (data.dados_anteriores as Record<string, unknown> | null) ?? null,
    ativo: data.ativo as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

/**
 * Cria uma nova parte contrária no sistema
 */
export async function criarParteContraria(
  params: ParteContrariaDados
): Promise<OperacaoParteContrariaResult> {
  const supabase = createServiceClient();

  try {
    // Validações obrigatórias
    if (!params.tipoPessoa) {
      return { sucesso: false, erro: 'Tipo de pessoa é obrigatório' };
    }

    if (!params.nome?.trim()) {
      return { sucesso: false, erro: 'Nome é obrigatório' };
    }

    // Validações específicas por tipo de pessoa
    if (params.tipoPessoa === 'pf') {
      if (!params.cpf?.trim()) {
        return { sucesso: false, erro: 'CPF é obrigatório para pessoa física' };
      }

      if (!validarCpf(params.cpf)) {
        return { sucesso: false, erro: 'CPF inválido (deve conter 11 dígitos)' };
      }

      const cpfNormalizado = normalizarCpf(params.cpf);
      const { data: parteExistenteCpf } = await supabase
        .from('partes_contrarias')
        .select('id, cpf')
        .eq('cpf', cpfNormalizado)
        .single();

      if (parteExistenteCpf) {
        return { sucesso: false, erro: 'CPF já cadastrado no sistema' };
      }

      if (params.cnpj) {
        return { sucesso: false, erro: 'CNPJ não deve ser preenchido para pessoa física' };
      }
    } else if (params.tipoPessoa === 'pj') {
      if (!params.cnpj?.trim()) {
        return { sucesso: false, erro: 'CNPJ é obrigatório para pessoa jurídica' };
      }

      if (!validarCnpj(params.cnpj)) {
        return { sucesso: false, erro: 'CNPJ inválido (deve conter 14 dígitos)' };
      }

      const cnpjNormalizado = normalizarCnpj(params.cnpj);
      const { data: parteExistenteCnpj } = await supabase
        .from('partes_contrarias')
        .select('id, cnpj')
        .eq('cnpj', cnpjNormalizado)
        .single();

      if (parteExistenteCnpj) {
        return { sucesso: false, erro: 'CNPJ já cadastrado no sistema' };
      }

      if (params.cpf) {
        return { sucesso: false, erro: 'CPF não deve ser preenchido para pessoa jurídica' };
      }
    }

    if (params.email && !validarEmail(params.email)) {
      return { sucesso: false, erro: 'E-mail inválido' };
    }

    const enderecoNormalizado = validarEndereco(params.endereco);

    // Preparar dados para inserção
    const dadosNovos: Record<string, unknown> = {
      tipo_pessoa: params.tipoPessoa,
      nome: params.nome.trim(),
      nome_fantasia: params.nomeFantasia?.trim() || null,
      cpf: params.tipoPessoa === 'pf' ? normalizarCpf(params.cpf!) : null,
      cnpj: params.tipoPessoa === 'pj' ? normalizarCnpj(params.cnpj!) : null,
      rg: params.tipoPessoa === 'pf' ? (params.rg?.trim() || null) : null,
      data_nascimento: parseDate(params.dataNascimento),
      genero: params.tipoPessoa === 'pf' ? (params.genero || null) : null,
      estado_civil: params.tipoPessoa === 'pf' ? (params.estadoCivil || null) : null,
      nacionalidade: params.tipoPessoa === 'pf' ? (params.nacionalidade?.trim() || null) : null,
      inscricao_estadual: params.inscricaoEstadual?.trim() || null, // Pode ser usado tanto para PF quanto para PJ
      email: params.email?.trim().toLowerCase() || null,
      telefone_primario: params.telefonePrimario?.trim() || null,
      telefone_secundario: params.telefoneSecundario?.trim() || null,
      endereco: enderecoNormalizado,
      observacoes: params.observacoes?.trim() || null,
      created_by: params.createdBy || null,
      ativo: params.ativo ?? true,
    };

    const { data, error } = await supabase
      .from('partes_contrarias')
      .insert(dadosNovos)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar parte contrária:', error);
      return { sucesso: false, erro: `Erro ao criar parte contrária: ${error.message}` };
    }

    return {
      sucesso: true,
      parteContraria: converterParaParteContraria(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao criar parte contrária:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Atualiza uma parte contrária existente
 */
export async function atualizarParteContraria(
  id: number,
  params: Partial<ParteContrariaDados>
): Promise<OperacaoParteContrariaResult> {
  const supabase = createServiceClient();

  try {
    const { data: parteExistente, error: erroBusca } = await supabase
      .from('partes_contrarias')
      .select('id, tipo_pessoa, cpf, cnpj')
      .eq('id', id)
      .single();

    if (erroBusca || !parteExistente) {
      return { sucesso: false, erro: 'Parte contrária não encontrada' };
    }

    const tipoPessoaAtual = parteExistente.tipo_pessoa as TipoPessoa;

    if (params.tipoPessoa && params.tipoPessoa !== tipoPessoaAtual) {
      return { sucesso: false, erro: 'Não é permitido alterar o tipo de pessoa da parte contrária' };
    }

    if (params.cpf && !validarCpf(params.cpf)) {
      return { sucesso: false, erro: 'CPF inválido (deve conter 11 dígitos)' };
    }

    if (params.cnpj && !validarCnpj(params.cnpj)) {
      return { sucesso: false, erro: 'CNPJ inválido (deve conter 14 dígitos)' };
    }

    if (params.email && !validarEmail(params.email)) {
      return { sucesso: false, erro: 'E-mail inválido' };
    }

    if (params.cpf && tipoPessoaAtual === 'pf') {
      const cpfNormalizado = normalizarCpf(params.cpf);
      if (cpfNormalizado !== parteExistente.cpf) {
        const { data: parteComCpf } = await supabase
          .from('partes_contrarias')
          .select('id')
          .eq('cpf', cpfNormalizado)
          .neq('id', id)
          .single();

        if (parteComCpf) {
          return { sucesso: false, erro: 'CPF já cadastrado para outra parte contrária' };
        }
      }
    }

    if (params.cnpj && tipoPessoaAtual === 'pj') {
      const cnpjNormalizado = normalizarCnpj(params.cnpj);
      if (cnpjNormalizado !== parteExistente.cnpj) {
        const { data: parteComCnpj } = await supabase
          .from('partes_contrarias')
          .select('id')
          .eq('cnpj', cnpjNormalizado)
          .neq('id', id)
          .single();

        if (parteComCnpj) {
          return { sucesso: false, erro: 'CNPJ já cadastrado para outra parte contrária' };
        }
      }
    }

    const dadosAtualizacao: Record<string, unknown> = {};

    if (params.nome !== undefined) {
      dadosAtualizacao.nome = params.nome.trim();
    }
    if (params.nomeFantasia !== undefined) {
      dadosAtualizacao.nome_fantasia = params.nomeFantasia?.trim() || null;
    }
    if (params.cpf !== undefined && tipoPessoaAtual === 'pf') {
      dadosAtualizacao.cpf = normalizarCpf(params.cpf);
    }
    if (params.cnpj !== undefined && tipoPessoaAtual === 'pj') {
      dadosAtualizacao.cnpj = normalizarCnpj(params.cnpj);
    }
    if (params.rg !== undefined && tipoPessoaAtual === 'pf') {
      dadosAtualizacao.rg = params.rg?.trim() || null;
    }
    if (params.dataNascimento !== undefined) {
      dadosAtualizacao.data_nascimento = parseDate(params.dataNascimento);
    }
    if (params.genero !== undefined && tipoPessoaAtual === 'pf') {
      dadosAtualizacao.genero = params.genero || null;
    }
    if (params.estadoCivil !== undefined && tipoPessoaAtual === 'pf') {
      dadosAtualizacao.estado_civil = params.estadoCivil || null;
    }
    if (params.nacionalidade !== undefined && tipoPessoaAtual === 'pf') {
      dadosAtualizacao.nacionalidade = params.nacionalidade?.trim() || null;
    }
    if (params.inscricaoEstadual !== undefined) {
      dadosAtualizacao.inscricao_estadual = params.inscricaoEstadual?.trim() || null;
    }
    if (params.email !== undefined) {
      dadosAtualizacao.email = params.email?.trim().toLowerCase() || null;
    }
    if (params.telefonePrimario !== undefined) {
      dadosAtualizacao.telefone_primario = params.telefonePrimario?.trim() || null;
    }
    if (params.telefoneSecundario !== undefined) {
      dadosAtualizacao.telefone_secundario = params.telefoneSecundario?.trim() || null;
    }
    if (params.endereco !== undefined) {
      dadosAtualizacao.endereco = validarEndereco(params.endereco);
    }
    if (params.observacoes !== undefined) {
      dadosAtualizacao.observacoes = params.observacoes?.trim() || null;
    }
    if (params.createdBy !== undefined) {
      dadosAtualizacao.created_by = params.createdBy || null;
    }
    if (params.ativo !== undefined) {
      dadosAtualizacao.ativo = params.ativo;
    }

    const { data, error } = await supabase
      .from('partes_contrarias')
      .update(dadosAtualizacao)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar parte contrária:', error);
      return { sucesso: false, erro: `Erro ao atualizar parte contrária: ${error.message}` };
    }

    return {
      sucesso: true,
      parteContraria: converterParaParteContraria(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao atualizar parte contrária:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Busca uma parte contrária por ID
 */
export async function buscarParteContrariaPorId(id: number): Promise<ParteContraria | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('partes_contrarias')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar parte contrária: ${error.message}`);
  }

  return data ? converterParaParteContraria(data) : null;
}

/**
 * Busca uma parte contrária por CPF
 */
export async function buscarParteContrariaPorCpf(cpf: string): Promise<ParteContraria | null> {
  const supabase = createServiceClient();
  const cpfNormalizado = normalizarCpf(cpf);

  const { data, error } = await supabase
    .from('partes_contrarias')
    .select('*')
    .eq('cpf', cpfNormalizado)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar parte contrária por CPF: ${error.message}`);
  }

  return data ? converterParaParteContraria(data) : null;
}

/**
 * Busca uma parte contrária por CNPJ
 */
export async function buscarParteContrariaPorCnpj(cnpj: string): Promise<ParteContraria | null> {
  const supabase = createServiceClient();
  const cnpjNormalizado = normalizarCnpj(cnpj);

  const { data, error } = await supabase
    .from('partes_contrarias')
    .select('*')
    .eq('cnpj', cnpjNormalizado)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar parte contrária por CNPJ: ${error.message}`);
  }

  return data ? converterParaParteContraria(data) : null;
}

/**
 * Lista partes contrárias com filtros e paginação
 */
export async function listarPartesContrarias(
  params: ListarPartesContrariasParams = {}
): Promise<ListarPartesContrariasResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  let query = supabase.from('partes_contrarias').select('*', { count: 'exact' });

  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(
      `nome.ilike.%${busca}%,nome_fantasia.ilike.%${busca}%,cpf.ilike.%${busca}%,cnpj.ilike.%${busca}%,email.ilike.%${busca}%`
    );
  }

  if (params.tipoPessoa) {
    query = query.eq('tipo_pessoa', params.tipoPessoa);
  }

  if (params.ativo !== undefined) {
    query = query.eq('ativo', params.ativo);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar partes contrárias: ${error.message}`);
  }

  const partesContrarias = (data || []).map(converterParaParteContraria);
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    partesContrarias,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

