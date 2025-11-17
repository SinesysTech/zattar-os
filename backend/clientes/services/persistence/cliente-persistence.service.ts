// Serviço de persistência de clientes
// Gerencia operações de CRUD na tabela clientes

import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Tipo de pessoa
 */
export type TipoPessoa = 'pf' | 'pj';

/**
 * Gênero do cliente (reutilizando enum de usuários)
 */
export type GeneroCliente = 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_informar';

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
 * Dados para cadastro/atualização de cliente
 */
export interface ClienteDados {
  tipoPessoa: TipoPessoa;
  nome: string;
  nomeFantasia?: string;
  cpf?: string; // Obrigatório se tipoPessoa = 'pf'
  cnpj?: string; // Obrigatório se tipoPessoa = 'pj'
  rg?: string;
  dataNascimento?: string; // ISO date string (YYYY-MM-DD)
  genero?: GeneroCliente;
  estadoCivil?: EstadoCivil;
  nacionalidade?: string;
  naturalidade?: string;
  inscricaoEstadual?: string;
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
export interface Cliente {
  id: number;
  tipoPessoa: TipoPessoa;
  nome: string;
  nomeFantasia: string | null;
  cpf: string | null;
  cnpj: string | null;
  rg: string | null;
  dataNascimento: string | null;
  genero: GeneroCliente | null;
  estadoCivil: EstadoCivil | null;
  nacionalidade: string | null;
  naturalidade: string | null;
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
export interface OperacaoClienteResult {
  sucesso: boolean;
  cliente?: Cliente;
  erro?: string;
}

/**
 * Parâmetros para listar clientes
 */
export interface ListarClientesParams {
  pagina?: number;
  limite?: number;
  busca?: string; // Busca em nome, nome_fantasia, cpf, cnpj, email
  tipoPessoa?: TipoPessoa;
  ativo?: boolean;
}

/**
 * Resultado da listagem
 */
export interface ListarClientesResult {
  clientes: Cliente[];
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
  
  // Retorna objeto com apenas campos válidos (remove campos vazios)
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
    enderecoLimpo.cep = endereco.cep.replace(/\D/g, ''); // Remove formatação do CEP
  }
  
  // Retorna null se objeto estiver vazio
  return Object.keys(enderecoLimpo).length > 0 ? enderecoLimpo : null;
}

/**
 * Converte dados do banco para formato de retorno
 */
function converterParaCliente(data: Record<string, unknown>): Cliente {
  return {
    id: data.id as number,
    tipoPessoa: data.tipo_pessoa as TipoPessoa,
    nome: data.nome as string,
    nomeFantasia: (data.nome_fantasia as string | null) ?? null,
    cpf: (data.cpf as string | null) ?? null,
    cnpj: (data.cnpj as string | null) ?? null,
    rg: (data.rg as string | null) ?? null,
    dataNascimento: (data.data_nascimento as string | null) ?? null,
    genero: (data.genero as GeneroCliente | null) ?? null,
    estadoCivil: (data.estado_civil as EstadoCivil | null) ?? null,
    nacionalidade: (data.nacionalidade as string | null) ?? null,
    naturalidade: (data.naturalidade as string | null) ?? null,
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
 * Cria um novo cliente no sistema
 */
export async function criarCliente(
  params: ClienteDados
): Promise<OperacaoClienteResult> {
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

      // CPF deve ser único
      const cpfNormalizado = normalizarCpf(params.cpf);
      const { data: clienteExistenteCpf } = await supabase
        .from('clientes')
        .select('id, cpf')
        .eq('cpf', cpfNormalizado)
        .single();

      if (clienteExistenteCpf) {
        return { sucesso: false, erro: 'CPF já cadastrado no sistema' };
      }

      // CNPJ não deve ser preenchido para PF
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

      // CNPJ deve ser único
      const cnpjNormalizado = normalizarCnpj(params.cnpj);
      const { data: clienteExistenteCnpj } = await supabase
        .from('clientes')
        .select('id, cnpj')
        .eq('cnpj', cnpjNormalizado)
        .single();

      if (clienteExistenteCnpj) {
        return { sucesso: false, erro: 'CNPJ já cadastrado no sistema' };
      }

      // CPF não deve ser preenchido para PJ
      if (params.cpf) {
        return { sucesso: false, erro: 'CPF não deve ser preenchido para pessoa jurídica' };
      }
    }

    // Validação de email se fornecido
    if (params.email && !validarEmail(params.email)) {
      return { sucesso: false, erro: 'E-mail inválido' };
    }

    // Validar e normalizar endereço
    const enderecoNormalizado = validarEndereco(params.endereco);

    // Preparar dados para inserção
    const dadosNovos: Record<string, unknown> = {
      tipo_pessoa: params.tipoPessoa,
      nome: params.nome.trim(),
      nome_fantasia: params.nomeFantasia?.trim() || null,
      cpf: params.tipoPessoa === 'pf' ? normalizarCpf(params.cpf!) : null,
      cnpj: params.tipoPessoa === 'pj' ? normalizarCnpj(params.cnpj!) : null,
      rg: params.tipoPessoa === 'pf' ? (params.rg?.trim() || null) : null,
      data_nascimento: params.tipoPessoa === 'pf' ? parseDate(params.dataNascimento) : null,
      genero: params.tipoPessoa === 'pf' ? (params.genero || null) : null,
      estado_civil: params.tipoPessoa === 'pf' ? (params.estadoCivil || null) : null,
      nacionalidade: params.tipoPessoa === 'pf' ? (params.nacionalidade?.trim() || null) : null,
      naturalidade: params.tipoPessoa === 'pf' ? (params.naturalidade?.trim() || null) : null,
      inscricao_estadual: params.tipoPessoa === 'pj' ? (params.inscricaoEstadual?.trim() || null) : null,
      email: params.email?.trim().toLowerCase() || null,
      telefone_primario: params.telefonePrimario?.trim() || null,
      telefone_secundario: params.telefoneSecundario?.trim() || null,
      endereco: enderecoNormalizado,
      observacoes: params.observacoes?.trim() || null,
      created_by: params.createdBy || null,
      ativo: params.ativo ?? true,
    };

    // Inserir cliente
    const { data, error } = await supabase
      .from('clientes')
      .insert(dadosNovos)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar cliente:', error);
      return { sucesso: false, erro: `Erro ao criar cliente: ${error.message}` };
    }

    return {
      sucesso: true,
      cliente: converterParaCliente(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao criar cliente:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Atualiza um cliente existente
 */
export async function atualizarCliente(
  id: number,
  params: Partial<ClienteDados>
): Promise<OperacaoClienteResult> {
  const supabase = createServiceClient();

  try {
    // Verificar se cliente existe
    const { data: clienteExistente, error: erroBusca } = await supabase
      .from('clientes')
      .select('id, tipo_pessoa, cpf, cnpj')
      .eq('id', id)
      .single();

    if (erroBusca || !clienteExistente) {
      return { sucesso: false, erro: 'Cliente não encontrado' };
    }

    const tipoPessoaAtual = clienteExistente.tipo_pessoa as TipoPessoa;

    // Se está alterando o tipo de pessoa, validar
    if (params.tipoPessoa && params.tipoPessoa !== tipoPessoaAtual) {
      return { sucesso: false, erro: 'Não é permitido alterar o tipo de pessoa do cliente' };
    }

    // Validações condicionais
    if (params.cpf && !validarCpf(params.cpf)) {
      return { sucesso: false, erro: 'CPF inválido (deve conter 11 dígitos)' };
    }

    if (params.cnpj && !validarCnpj(params.cnpj)) {
      return { sucesso: false, erro: 'CNPJ inválido (deve conter 14 dígitos)' };
    }

    if (params.email && !validarEmail(params.email)) {
      return { sucesso: false, erro: 'E-mail inválido' };
    }

    // Verificar duplicidades se campos únicos foram alterados
    if (params.cpf && tipoPessoaAtual === 'pf') {
      const cpfNormalizado = normalizarCpf(params.cpf);
      if (cpfNormalizado !== clienteExistente.cpf) {
        const { data: clienteComCpf } = await supabase
          .from('clientes')
          .select('id')
          .eq('cpf', cpfNormalizado)
          .neq('id', id)
          .single();

        if (clienteComCpf) {
          return { sucesso: false, erro: 'CPF já cadastrado para outro cliente' };
        }
      }
    }

    if (params.cnpj && tipoPessoaAtual === 'pj') {
      const cnpjNormalizado = normalizarCnpj(params.cnpj);
      if (cnpjNormalizado !== clienteExistente.cnpj) {
        const { data: clienteComCnpj } = await supabase
          .from('clientes')
          .select('id')
          .eq('cnpj', cnpjNormalizado)
          .neq('id', id)
          .single();

        if (clienteComCnpj) {
          return { sucesso: false, erro: 'CNPJ já cadastrado para outro cliente' };
        }
      }
    }

    // Preparar dados para atualização (apenas campos fornecidos)
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
    if (params.dataNascimento !== undefined && tipoPessoaAtual === 'pf') {
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
    if (params.naturalidade !== undefined && tipoPessoaAtual === 'pf') {
      dadosAtualizacao.naturalidade = params.naturalidade?.trim() || null;
    }
    if (params.inscricaoEstadual !== undefined && tipoPessoaAtual === 'pj') {
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

    // Atualizar cliente
    const { data, error } = await supabase
      .from('clientes')
      .update(dadosAtualizacao)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      return { sucesso: false, erro: `Erro ao atualizar cliente: ${error.message}` };
    }

    return {
      sucesso: true,
      cliente: converterParaCliente(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao atualizar cliente:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Busca um cliente por ID
 */
export async function buscarClientePorId(id: number): Promise<Cliente | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar cliente: ${error.message}`);
  }

  return data ? converterParaCliente(data) : null;
}

/**
 * Busca um cliente por CPF
 */
export async function buscarClientePorCpf(cpf: string): Promise<Cliente | null> {
  const supabase = createServiceClient();
  const cpfNormalizado = normalizarCpf(cpf);

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('cpf', cpfNormalizado)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar cliente por CPF: ${error.message}`);
  }

  return data ? converterParaCliente(data) : null;
}

/**
 * Busca um cliente por CNPJ
 */
export async function buscarClientePorCnpj(cnpj: string): Promise<Cliente | null> {
  const supabase = createServiceClient();
  const cnpjNormalizado = normalizarCnpj(cnpj);

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('cnpj', cnpjNormalizado)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar cliente por CNPJ: ${error.message}`);
  }

  return data ? converterParaCliente(data) : null;
}

/**
 * Lista clientes com filtros e paginação
 */
export async function listarClientes(
  params: ListarClientesParams = {}
): Promise<ListarClientesResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  let query = supabase.from('clientes').select('*', { count: 'exact' });

  // Aplicar filtros
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

  // Aplicar paginação
  query = query.order('created_at', { ascending: false }).range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar clientes: ${error.message}`);
  }

  const clientes = (data || []).map(converterParaCliente);
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    clientes,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

