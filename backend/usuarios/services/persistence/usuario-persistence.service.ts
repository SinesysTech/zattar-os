// Serviço de persistência de usuários
// Gerencia operações de CRUD na tabela usuarios

import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Gênero do usuário
 */
export type GeneroUsuario = 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_informar';

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
 * Dados para cadastro/atualização de usuário
 */
export interface UsuarioDados {
  nomeCompleto: string;
  nomeExibicao: string;
  cpf: string;
  rg?: string;
  dataNascimento?: string; // ISO date string (YYYY-MM-DD)
  genero?: GeneroUsuario;
  oab?: string;
  ufOab?: string;
  emailPessoal?: string;
  emailCorporativo: string;
  telefone?: string;
  ramal?: string;
  endereco?: Endereco;
  authUserId?: string; // UUID do Supabase Auth
  ativo?: boolean;
}

/**
 * Dados retornados do banco
 */
export interface Usuario {
  id: number;
  authUserId: string | null;
  nomeCompleto: string;
  nomeExibicao: string;
  cpf: string;
  rg: string | null;
  dataNascimento: string | null;
  genero: GeneroUsuario | null;
  oab: string | null;
  ufOab: string | null;
  emailPessoal: string | null;
  emailCorporativo: string;
  telefone: string | null;
  ramal: string | null;
  endereco: Endereco | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Resultado de operação
 */
export interface OperacaoUsuarioResult {
  sucesso: boolean;
  usuario?: Usuario;
  erro?: string;
}

/**
 * Parâmetros para listar usuários
 */
export interface ListarUsuariosParams {
  pagina?: number;
  limite?: number;
  busca?: string; // Busca em nome_completo, nome_exibicao, cpf, email_corporativo
  ativo?: boolean;
  oab?: string;
  ufOab?: string;
}

/**
 * Resultado da listagem
 */
export interface ListarUsuariosResult {
  usuarios: Usuario[];
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
function converterParaUsuario(data: Record<string, unknown>): Usuario {
  return {
    id: data.id as number,
    authUserId: (data.auth_user_id as string | null) ?? null,
    nomeCompleto: data.nome_completo as string,
    nomeExibicao: data.nome_exibicao as string,
    cpf: data.cpf as string,
    rg: (data.rg as string | null) ?? null,
    dataNascimento: (data.data_nascimento as string | null) ?? null,
    genero: (data.genero as GeneroUsuario | null) ?? null,
    oab: (data.oab as string | null) ?? null,
    ufOab: (data.uf_oab as string | null) ?? null,
    emailPessoal: (data.email_pessoal as string | null) ?? null,
    emailCorporativo: data.email_corporativo as string,
    telefone: (data.telefone as string | null) ?? null,
    ramal: (data.ramal as string | null) ?? null,
    endereco: (data.endereco as Endereco | null) ?? null,
    ativo: data.ativo as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

/**
 * Cria um novo usuário no sistema
 */
export async function criarUsuario(
  params: UsuarioDados
): Promise<OperacaoUsuarioResult> {
  const supabase = createServiceClient();

  try {
    // Validações obrigatórias
    if (!params.nomeCompleto?.trim()) {
      return { sucesso: false, erro: 'Nome completo é obrigatório' };
    }

    if (!params.nomeExibicao?.trim()) {
      return { sucesso: false, erro: 'Nome de exibição é obrigatório' };
    }

    if (!params.cpf?.trim()) {
      return { sucesso: false, erro: 'CPF é obrigatório' };
    }

    if (!validarCpf(params.cpf)) {
      return { sucesso: false, erro: 'CPF inválido (deve conter 11 dígitos)' };
    }

    if (!params.emailCorporativo?.trim()) {
      return { sucesso: false, erro: 'E-mail corporativo é obrigatório' };
    }

    if (!validarEmail(params.emailCorporativo)) {
      return { sucesso: false, erro: 'E-mail corporativo inválido' };
    }

    if (params.emailPessoal && !validarEmail(params.emailPessoal)) {
      return { sucesso: false, erro: 'E-mail pessoal inválido' };
    }

    const cpfNormalizado = normalizarCpf(params.cpf);

    // Verificar se CPF já existe
    const { data: usuarioExistenteCpf } = await supabase
      .from('usuarios')
      .select('id, cpf')
      .eq('cpf', cpfNormalizado)
      .single();

    if (usuarioExistenteCpf) {
      return { sucesso: false, erro: 'CPF já cadastrado no sistema' };
    }

    // Verificar se e-mail corporativo já existe
    const emailCorporativoLower = params.emailCorporativo.trim().toLowerCase();
    const { data: usuarioExistenteEmail } = await supabase
      .from('usuarios')
      .select('id, email_corporativo')
      .eq('email_corporativo', emailCorporativoLower)
      .single();

    if (usuarioExistenteEmail) {
      return { sucesso: false, erro: 'E-mail corporativo já cadastrado no sistema' };
    }

    // Validar e normalizar endereço
    const enderecoNormalizado = validarEndereco(params.endereco);

    // Preparar dados para inserção
    const dadosNovos = {
      auth_user_id: params.authUserId || null,
      nome_completo: params.nomeCompleto.trim(),
      nome_exibicao: params.nomeExibicao.trim(),
      cpf: cpfNormalizado,
      rg: params.rg?.trim() || null,
      data_nascimento: parseDate(params.dataNascimento),
      genero: params.genero || null,
      oab: params.oab?.trim() || null,
      uf_oab: params.ufOab?.trim() || null,
      email_pessoal: params.emailPessoal?.trim().toLowerCase() || null,
      email_corporativo: emailCorporativoLower,
      telefone: params.telefone?.trim() || null,
      ramal: params.ramal?.trim() || null,
      endereco: enderecoNormalizado,
      ativo: params.ativo ?? true,
    };

    // Inserir usuário
    const { data, error } = await supabase
      .from('usuarios')
      .insert(dadosNovos)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return { sucesso: false, erro: `Erro ao criar usuário: ${error.message}` };
    }

    return {
      sucesso: true,
      usuario: converterParaUsuario(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao criar usuário:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Atualiza um usuário existente
 */
export async function atualizarUsuario(
  id: number,
  params: Partial<UsuarioDados>
): Promise<OperacaoUsuarioResult> {
  const supabase = createServiceClient();

  try {
    // Verificar se usuário existe
    const { data: usuarioExistente, error: erroBusca } = await supabase
      .from('usuarios')
      .select('id, cpf, email_corporativo')
      .eq('id', id)
      .single();

    if (erroBusca || !usuarioExistente) {
      return { sucesso: false, erro: 'Usuário não encontrado' };
    }

    // Validações condicionais
    if (params.cpf && !validarCpf(params.cpf)) {
      return { sucesso: false, erro: 'CPF inválido (deve conter 11 dígitos)' };
    }

    if (params.emailCorporativo && !validarEmail(params.emailCorporativo)) {
      return { sucesso: false, erro: 'E-mail corporativo inválido' };
    }

    if (params.emailPessoal && !validarEmail(params.emailPessoal)) {
      return { sucesso: false, erro: 'E-mail pessoal inválido' };
    }

    // Verificar duplicidades se campos únicos foram alterados
    if (params.cpf) {
      const cpfNormalizado = normalizarCpf(params.cpf);
      if (cpfNormalizado !== usuarioExistente.cpf) {
        const { data: usuarioComCpf } = await supabase
          .from('usuarios')
          .select('id')
          .eq('cpf', cpfNormalizado)
          .neq('id', id)
          .single();

        if (usuarioComCpf) {
          return { sucesso: false, erro: 'CPF já cadastrado para outro usuário' };
        }
      }
    }

    if (params.emailCorporativo) {
      const emailCorporativoLower = params.emailCorporativo.trim().toLowerCase();
      if (emailCorporativoLower !== usuarioExistente.email_corporativo) {
        const { data: usuarioComEmail } = await supabase
          .from('usuarios')
          .select('id')
          .eq('email_corporativo', emailCorporativoLower)
          .neq('id', id)
          .single();

        if (usuarioComEmail) {
          return { sucesso: false, erro: 'E-mail corporativo já cadastrado para outro usuário' };
        }
      }
    }

    // Preparar dados para atualização (apenas campos fornecidos)
    const dadosAtualizacao: Record<string, unknown> = {};

    if (params.nomeCompleto !== undefined) {
      dadosAtualizacao.nome_completo = params.nomeCompleto.trim();
    }
    if (params.nomeExibicao !== undefined) {
      dadosAtualizacao.nome_exibicao = params.nomeExibicao.trim();
    }
    if (params.cpf !== undefined) {
      dadosAtualizacao.cpf = normalizarCpf(params.cpf);
    }
    if (params.rg !== undefined) {
      dadosAtualizacao.rg = params.rg?.trim() || null;
    }
    if (params.dataNascimento !== undefined) {
      dadosAtualizacao.data_nascimento = parseDate(params.dataNascimento);
    }
    if (params.genero !== undefined) {
      dadosAtualizacao.genero = params.genero || null;
    }
    if (params.oab !== undefined) {
      dadosAtualizacao.oab = params.oab?.trim() || null;
    }
    if (params.ufOab !== undefined) {
      dadosAtualizacao.uf_oab = params.ufOab?.trim() || null;
    }
    if (params.emailPessoal !== undefined) {
      dadosAtualizacao.email_pessoal = params.emailPessoal?.trim().toLowerCase() || null;
    }
    if (params.emailCorporativo !== undefined) {
      dadosAtualizacao.email_corporativo = params.emailCorporativo.trim().toLowerCase();
    }
    if (params.telefone !== undefined) {
      dadosAtualizacao.telefone = params.telefone?.trim() || null;
    }
    if (params.ramal !== undefined) {
      dadosAtualizacao.ramal = params.ramal?.trim() || null;
    }
    if (params.endereco !== undefined) {
      dadosAtualizacao.endereco = validarEndereco(params.endereco);
    }
    if (params.authUserId !== undefined) {
      dadosAtualizacao.auth_user_id = params.authUserId || null;
    }
    if (params.ativo !== undefined) {
      dadosAtualizacao.ativo = params.ativo;
    }

    // Atualizar usuário
    const { data, error } = await supabase
      .from('usuarios')
      .update(dadosAtualizacao)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { sucesso: false, erro: `Erro ao atualizar usuário: ${error.message}` };
    }

    return {
      sucesso: true,
      usuario: converterParaUsuario(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao atualizar usuário:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Busca um usuário por ID
 */
export async function buscarUsuarioPorId(id: number): Promise<Usuario | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar usuário: ${error.message}`);
  }

  return data ? converterParaUsuario(data) : null;
}

/**
 * Busca um usuário por CPF
 */
export async function buscarUsuarioPorCpf(cpf: string): Promise<Usuario | null> {
  const supabase = createServiceClient();
  const cpfNormalizado = normalizarCpf(cpf);

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('cpf', cpfNormalizado)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar usuário por CPF: ${error.message}`);
  }

  return data ? converterParaUsuario(data) : null;
}

/**
 * Busca um usuário por e-mail corporativo
 */
export async function buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
  const supabase = createServiceClient();
  const emailLower = email.trim().toLowerCase();

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email_corporativo', emailLower)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar usuário por e-mail: ${error.message}`);
  }

  return data ? converterParaUsuario(data) : null;
}

/**
 * Lista usuários com filtros e paginação
 */
export async function listarUsuarios(
  params: ListarUsuariosParams = {}
): Promise<ListarUsuariosResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  let query = supabase.from('usuarios').select('*', { count: 'exact' });

  // Aplicar filtros
  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(
      `nome_completo.ilike.%${busca}%,nome_exibicao.ilike.%${busca}%,cpf.ilike.%${busca}%,email_corporativo.ilike.%${busca}%`
    );
  }

  if (params.ativo !== undefined) {
    query = query.eq('ativo', params.ativo);
  }

  if (params.oab) {
    query = query.eq('oab', params.oab.trim());
  }

  if (params.ufOab) {
    query = query.eq('uf_oab', params.ufOab.trim());
  }

  // Aplicar paginação
  query = query.order('created_at', { ascending: false }).range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar usuários: ${error.message}`);
  }

  const usuarios = (data || []).map(converterParaUsuario);
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    usuarios,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

