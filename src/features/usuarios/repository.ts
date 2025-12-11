
import { createServiceClient } from '@/lib/supabase/service-client';
import { 
  getCached, 
  setCached, 
  deleteCached, 
  getUsuariosListKey, 
  invalidateUsuariosCache,
  getCargosListKey
} from '@/lib/redis';
import { 
  Usuario, 
  UsuarioDados, 
  ListarUsuariosParams, 
  ListarUsuariosResult, 
  OperacaoUsuarioResult, 
  GeneroUsuario,
  Endereco
} from './types';
import { UsuarioDetalhado, Permissao, PermissaoMatriz } from './types';
import { normalizarCpf } from './utils';

// Conversores
function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function converterParaUsuario(data: any): Usuario {
  return {
    id: data.id,
    authUserId: data.auth_user_id ?? null,
    nomeCompleto: data.nome_completo,
    nomeExibicao: data.nome_exibicao,
    cpf: data.cpf,
    rg: data.rg ?? null,
    dataNascimento: data.data_nascimento ?? null,
    genero: (data.genero as GeneroUsuario) ?? null,
    oab: data.oab ?? null,
    ufOab: data.uf_oab ?? null,
    emailPessoal: data.email_pessoal ?? null,
    emailCorporativo: data.email_corporativo,
    telefone: data.telefone ?? null,
    ramal: data.ramal ?? null,
    endereco: data.endereco as Endereco ?? null,
    cargoId: data.cargo_id ?? null,
    cargo: data.cargos ? {
      id: data.cargos.id,
      nome: data.cargos.nome,
      descricao: data.cargos.descricao || null,
    } : undefined,
    avatarUrl: data.avatar_url ?? null,
    isSuperAdmin: data.is_super_admin ?? false,
    ativo: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export const usuarioRepository = {
  async findById(id: number): Promise<Usuario | null> {
    const cacheKey = `usuarios:id:${id}`;
    const cached = await getCached<Usuario>(cacheKey);
    if (cached) return cached;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, cargos!cargo_id(id, nome, descricao, ativo)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Erro ao buscar usuário: ${error.message}`);
    }

    const usuario = converterParaUsuario(data);
    await setCached(cacheKey, usuario, 1800);
    return usuario;
  },

  async findByCpf(cpf: string): Promise<Usuario | null> {
    const cpfNormalizado = normalizarCpf(cpf);
    const cacheKey = `usuarios:cpf:${cpfNormalizado}`;
    const cached = await getCached<Usuario>(cacheKey);
    if (cached) return cached;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, cargos!cargo_id(id, nome, descricao, ativo)')
      .eq('cpf', cpfNormalizado)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Erro ao buscar usuário por CPF: ${error.message}`);
    }

    const usuario = converterParaUsuario(data);
    await setCached(cacheKey, usuario, 1800);
    return usuario;
  },

  async findByEmail(email: string): Promise<Usuario | null> {
    const emailLower = email.trim().toLowerCase();
    const cacheKey = `usuarios:email:${emailLower}`;
    const cached = await getCached<Usuario>(cacheKey);
    if (cached) return cached;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, cargos!cargo_id(id, nome, descricao, ativo)')
      .eq('email_corporativo', emailLower)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Erro ao buscar usuário por e-mail: ${error.message}`);
    }

    const usuario = converterParaUsuario(data);
    await setCached(cacheKey, usuario, 1800);
    return usuario;
  },

  async findAll(params: ListarUsuariosParams = {}): Promise<ListarUsuariosResult> {
    const cacheKey = getUsuariosListKey(params);
    const cached = await getCached<ListarUsuariosResult>(cacheKey);
    if (cached) return cached;

    const supabase = createServiceClient();
    const pagina = params.pagina ?? 1;
    const limite = params.limite ?? 50;
    const offset = (pagina - 1) * limite;

    let query = supabase.from('usuarios').select('*, cargos!cargo_id(id, nome, descricao, ativo)', { count: 'exact' });

    if (params.busca) {
      const busca = params.busca.trim();
      query = query.or(`nome_completo.ilike.%${busca}%,nome_exibicao.ilike.%${busca}%,cpf.ilike.%${busca}%,email_corporativo.ilike.%${busca}%`);
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
    
    if (params.cargoId) {
      query = query.eq('cargo_id', params.cargoId);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) throw new Error(`Erro ao listar usuários: ${error.message}`);

    const result: ListarUsuariosResult = {
      usuarios: (data || []).map(converterParaUsuario),
      total: count ?? 0,
      pagina,
      limite,
      totalPaginas: Math.ceil((count ?? 0) / limite),
    };

    await setCached(cacheKey, result);
    return result;
  },

  async create(params: UsuarioDados): Promise<Usuario> {
    const supabase = createServiceClient();
    
    // Normalizações antes de salvar
    const cpfNormalizado = normalizarCpf(params.cpf);
    const emailCorporativoLower = params.emailCorporativo.trim().toLowerCase();
    
    // Limpar endereço vazio
    let enderecoFinal = params.endereco;
    if (enderecoFinal && Object.keys(enderecoFinal).length === 0) {
      enderecoFinal = null;
    }

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
      endereco: enderecoFinal,
      cargo_id: params.cargoId ?? null,
      is_super_admin: params.isSuperAdmin ?? false,
      ativo: params.ativo ?? true,
    };

    const { data, error } = await supabase
      .from('usuarios')
      .insert(dadosNovos)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar usuário: ${error.message}`);

    await invalidateUsuariosCache();
    // Cache individual keys? No need immediately as they are usually fetched by list first or id.
    
    return converterParaUsuario(data);
  },

  async update(id: number, params: Partial<UsuarioDados>): Promise<Usuario> {
    const supabase = createServiceClient();
    
    const dadosAtualizacao: any = {};
    
    if (params.nomeCompleto !== undefined) dadosAtualizacao.nome_completo = params.nomeCompleto.trim();
    if (params.nomeExibicao !== undefined) dadosAtualizacao.nome_exibicao = params.nomeExibicao.trim();
    if (params.cpf !== undefined) dadosAtualizacao.cpf = normalizarCpf(params.cpf);
    if (params.rg !== undefined) dadosAtualizacao.rg = params.rg?.trim() || null;
    if (params.dataNascimento !== undefined) dadosAtualizacao.data_nascimento = parseDate(params.dataNascimento);
    if (params.genero !== undefined) dadosAtualizacao.genero = params.genero || null;
    if (params.oab !== undefined) dadosAtualizacao.oab = params.oab?.trim() || null;
    if (params.ufOab !== undefined) dadosAtualizacao.uf_oab = params.ufOab?.trim() || null;
    if (params.emailPessoal !== undefined) dadosAtualizacao.email_pessoal = params.emailPessoal?.trim().toLowerCase() || null;
    if (params.emailCorporativo !== undefined) dadosAtualizacao.email_corporativo = params.emailCorporativo.trim().toLowerCase();
    if (params.telefone !== undefined) dadosAtualizacao.telefone = params.telefone?.trim() || null;
    if (params.ramal !== undefined) dadosAtualizacao.ramal = params.ramal?.trim() || null;
    if (params.endereco !== undefined) dadosAtualizacao.endereco = params.endereco; // Validação de objeto vazio deve ser feita antes se necessário, mas update parcial assume valor
    if (params.cargoId !== undefined) dadosAtualizacao.cargo_id = params.cargoId;
    if (params.authUserId !== undefined) dadosAtualizacao.auth_user_id = params.authUserId || null;
    if (params.ativo !== undefined) dadosAtualizacao.ativo = params.ativo;

    const { data, error } = await supabase
      .from('usuarios')
      .update(dadosAtualizacao)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);

    await invalidateUsuariosCache();
    await deleteCached(`usuarios:id:${id}`);
    if (params.cpf) await deleteCached(`usuarios:cpf:${normalizarCpf(params.cpf)}`);
    if (params.emailCorporativo) await deleteCached(`usuarios:email:${params.emailCorporativo.trim().toLowerCase()}`);

    return converterParaUsuario(data);
  },

  // Busca cargos para dropdowns
  async listarCargos() {
    // Implementação básica para carregar cargos
    // Como não foi especificado um arquivo de repository de cargos, fazemos aqui por enquanto
    const cacheKey = getCargosListKey({});
    const cached = await getCached<any[]>(cacheKey);
    if (cached) return cached;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('cargos')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (error) return [];
    
    await setCached(cacheKey, data, 3600);
    return data;
  },

  // Desativação completa com desatribuição
  async desativarComDesatribuicao(usuarioId: number, executorId: number) {
    const supabase = createServiceClient();
    
    // Contar antes
    const queries = ['acervo', 'audiencias', 'expedientes', 'expedientes_manuais', 'contratos'].map(table => 
      supabase.from(table).select('*', { count: 'exact', head: true }).eq('responsavel_id', usuarioId)
    );
    
    const results = await Promise.all(queries);
    const contagens = {
      processos: results[0].count ?? 0,
      audiencias: results[1].count ?? 0,
      pendentes: results[2].count ?? 0,
      expedientes_manuais: results[3].count ?? 0,
      contratos: results[4].count ?? 0,
    };
    
    // Configurar contexto
    await supabase.rpc('set_config', {
      setting_name: 'app.current_user_id',
      new_value: executorId.toString(),
      is_local: false,
    });

    // RPCs
    if (contagens.processos > 0) await supabase.rpc('desatribuir_todos_processos_usuario', { p_usuario_id: usuarioId });
    if (contagens.audiencias > 0) await supabase.rpc('desatribuir_todas_audiencias_usuario', { p_usuario_id: usuarioId });
    if (contagens.pendentes > 0) await supabase.rpc('desatribuir_todos_pendentes_usuario', { p_usuario_id: usuarioId });
    if (contagens.expedientes_manuais > 0) await supabase.rpc('desatribuir_todos_expedientes_usuario', { p_usuario_id: usuarioId });
    if (contagens.contratos > 0) await supabase.rpc('desatribuir_todos_contratos_usuario', { p_usuario_id: usuarioId });

    // Update users
    const { error: errorUpdate } = await supabase.from('usuarios').update({ ativo: false }).eq('id', usuarioId);
    if (errorUpdate) throw new Error(errorUpdate.message);
    
    await invalidateUsuariosCache();
    await deleteCached(`usuarios:id:${usuarioId}`);

    return contagens;
  },

  async buscarUsuariosAuthNaoSincronizados() {
     const supabase = createServiceClient();
     const { data, error } = await supabase.rpc('list_auth_users_nao_sincronizados');
     if (error) throw new Error(error.message);
     return data || [];
  },

  async getCargoById(id: number) {
    const supabase = createServiceClient();
    const { data } = await supabase.from('cargos').select('id').eq('id', id).single();
    return data;
  },
};

// =============================================================================
// PERMISSÕES REPOSITORY
// =============================================================================

export interface Permissao {
  recurso: string;
  operacao: string;
  permitido: boolean;
}

/**
 * Lista todas as permissões de um usuário
 */
export async function listarPermissoesUsuario(usuarioId: number): Promise<Permissao[]> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('permissoes')
    .select('recurso, operacao, permitido')
    .eq('usuario_id', usuarioId)
    .eq('permitido', true);

  if (error) {
    throw new Error(`Erro ao listar permissões: ${error.message}`);
  }

  return (data || []).map((p) => ({
    recurso: p.recurso,
    operacao: p.operacao,
    permitido: p.permitido,
  }));
}

/**
 * Atribui múltiplas permissões a um usuário (upsert)
 */
export async function atribuirPermissoesBatch(
  usuarioId: number,
  permissoes: Permissao[],
  executorId: number
): Promise<void> {
  const supabase = createServiceClient();

  // Preparar dados para upsert
  const dadosPermissoes = permissoes.map((p) => ({
    usuario_id: usuarioId,
    recurso: p.recurso,
    operacao: p.operacao,
    permitido: p.permitido,
    created_by: executorId,
  }));

  // Upsert em batch
  const { error } = await supabase
    .from('permissoes')
    .upsert(dadosPermissoes, {
      onConflict: 'usuario_id,recurso,operacao',
    });

  if (error) {
    throw new Error(`Erro ao atribuir permissões: ${error.message}`);
  }
}

/**
 * Substitui todas as permissões de um usuário (deleta todas e adiciona novas)
 */
export async function substituirPermissoes(
  usuarioId: number,
  permissoes: Permissao[],
  executorId: number
): Promise<void> {
  const supabase = createServiceClient();

  // Iniciar transação: deletar todas as permissões existentes
  const { error: deleteError } = await supabase
    .from('permissoes')
    .delete()
    .eq('usuario_id', usuarioId);

  if (deleteError) {
    throw new Error(`Erro ao remover permissões antigas: ${deleteError.message}`);
  }

  // Inserir novas permissões
  if (permissoes.length > 0) {
    const dadosPermissoes = permissoes.map((p) => ({
      usuario_id: usuarioId,
      recurso: p.recurso,
      operacao: p.operacao,
      permitido: p.permitido,
      created_by: executorId,
    }));

    const { error: insertError } = await supabase
      .from('permissoes')
      .insert(dadosPermissoes);

    if (insertError) {
      throw new Error(`Erro ao inserir novas permissões: ${insertError.message}`);
    }
  }
}
