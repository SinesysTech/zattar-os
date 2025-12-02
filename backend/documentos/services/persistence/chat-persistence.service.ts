/**
 * Serviço de persistência para chat interno
 *
 * Responsável por operações relacionadas a salas de chat e mensagens.
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  SalaChat,
  CriarSalaChatParams,
  SalaChatComInfo,
  ListarSalasChatParams,
  MensagemChat,
  CriarMensagemChatParams,
  AtualizarMensagemChatParams,
  MensagemChatComUsuario,
  ListarMensagensChatParams,
} from '@/backend/types/documentos/types';

// ============================================================================
// SALAS DE CHAT
// ============================================================================

/**
 * Cria uma nova sala de chat
 */
export async function criarSalaChat(
  params: CriarSalaChatParams,
  usuario_id: number
): Promise<SalaChat> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('salas_chat')
    .insert({
      nome: params.nome,
      tipo: params.tipo,
      documento_id: params.documento_id ?? null,
      participante_id: params.participante_id ?? null,
      criado_por: usuario_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar sala de chat: ${error.message}`);
  }

  return data;
}

/**
 * Busca uma sala de chat por ID
 */
export async function buscarSalaChatPorId(id: number): Promise<SalaChat | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('salas_chat')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar sala de chat: ${error.message}`);
  }

  return data;
}

/**
 * Busca sala de chat de um documento (cria se não existir)
 */
export async function buscarOuCriarSalaPorDocumento(
  documento_id: number,
  usuario_id: number
): Promise<SalaChat> {
  const supabase = createServiceClient();

  // Tentar buscar sala existente
  const { data: salaExistente } = await supabase
    .from('salas_chat')
    .select()
    .eq('tipo', 'documento')
    .eq('documento_id', documento_id)
    .single();

  if (salaExistente) {
    return salaExistente;
  }

  // Buscar nome do documento
  const { data: documento } = await supabase
    .from('documentos')
    .select('titulo')
    .eq('id', documento_id)
    .single();

  // Criar sala
  return await criarSalaChat(
    {
      nome: `Documento: ${documento?.titulo ?? 'Sem título'}`,
      tipo: 'documento',
      documento_id,
    },
    usuario_id
  );
}

/**
 * Lista salas de chat com informações adicionais
 */
export async function listarSalasChat(
  params: ListarSalasChatParams,
  usuario_id?: number
): Promise<{ salas: SalaChatComInfo[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase
    .from('salas_chat')
    .select(`
      *,
      criador:usuarios!salas_chat_criado_por_fkey(
        id,
        nome_completo,
        nome_exibicao
      ),
      participante:usuarios!salas_chat_participante_id_fkey(
        id,
        nome_completo,
        nome_exibicao
      ),
      documento:documentos!salas_chat_documento_id_fkey(
        id,
        titulo
      )
    `, { count: 'exact' });

  // Filtro: tipo
  if (params.tipo) {
    query = query.eq('tipo', params.tipo);
  }

  // Filtro: documento_id
  if (params.documento_id) {
    query = query.eq('documento_id', params.documento_id);
  }

  // Ordenação
  query = query.order('created_at', { ascending: false });

  // Paginação
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar salas de chat: ${error.message}`);
  }

  const salas = (data ?? []) as any[];

  // Buscar última mensagem e contador de não lidas para cada sala
  const salasComInfo: SalaChatComInfo[] = await Promise.all(
    salas.map(async (sala) => {
      // Buscar última mensagem
      const { data: ultimaMensagem } = await supabase
        .from('mensagens_chat')
        .select('conteudo, created_at')
        .eq('sala_id', sala.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Contar não lidas (se usuario_id fornecido)
      let totalNaoLidas = 0;
      if (usuario_id) {
        // Aqui deveria buscar de uma tabela de "leituras" ou "última visualização"
        // Por simplicidade, retornando 0 por enquanto
        // TODO: Implementar tabela de leituras
        totalNaoLidas = 0;
      }

      // Para conversas privadas, determinar o nome correto baseado em quem está vendo
      let nomeExibicao = sala.nome;
      if (sala.tipo === 'privado' && usuario_id) {
        // Se o usuário atual é o criador, mostrar nome do participante
        // Se o usuário atual é o participante, mostrar nome do criador
        if (sala.criado_por === usuario_id && sala.participante) {
          nomeExibicao = sala.participante.nome_exibicao || sala.participante.nome_completo;
        } else if (sala.participante_id === usuario_id && sala.criador) {
          nomeExibicao = sala.criador.nome_exibicao || sala.criador.nome_completo;
        }
      }

      return {
        ...sala,
        nome: nomeExibicao,
        ultima_mensagem: ultimaMensagem ?? undefined,
        total_nao_lidas: totalNaoLidas,
      };
    })
  );

  return {
    salas: salasComInfo,
    total: count ?? 0,
  };
}

/**
 * Busca a sala "Sala Geral"
 */
export async function buscarSalaGeral(): Promise<SalaChat | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('salas_chat')
    .select()
    .eq('tipo', 'geral')
    .eq('nome', 'Sala Geral')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar Sala Geral: ${error.message}`);
  }

  return data;
}

/**
 * Deleta uma sala de chat
 */
export async function deletarSalaChat(id: number): Promise<void> {
  const supabase = createServiceClient();

  // Verificar se não é sala geral
  const sala = await buscarSalaChatPorId(id);
  if (sala?.tipo === 'geral') {
    throw new Error('Sala Geral não pode ser deletada');
  }

  const { error } = await supabase
    .from('salas_chat')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao deletar sala de chat: ${error.message}`);
  }
}

// ============================================================================
// MENSAGENS DE CHAT
// ============================================================================

/**
 * Cria uma nova mensagem de chat
 */
export async function criarMensagemChat(
  params: CriarMensagemChatParams,
  usuario_id: number
): Promise<MensagemChat> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('mensagens_chat')
    .insert({
      sala_id: params.sala_id,
      usuario_id,
      conteudo: params.conteudo,
      tipo: params.tipo,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar mensagem: ${error.message}`);
  }

  return data;
}

/**
 * Busca uma mensagem por ID
 */
export async function buscarMensagemChatPorId(id: number): Promise<MensagemChat | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('mensagens_chat')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar mensagem: ${error.message}`);
  }

  return data;
}

/**
 * Lista mensagens de uma sala
 */
export async function listarMensagensChat(
  params: ListarMensagensChatParams
): Promise<{ mensagens: MensagemChatComUsuario[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase
    .from('mensagens_chat')
    .select(`
      *,
      usuario:usuarios!mensagens_chat_usuario_id_fkey(
        id,
        nome_completo,
        nome_exibicao,
        email_corporativo
      )
    `, { count: 'exact' })
    .eq('sala_id', params.sala_id)
    .is('deleted_at', null);

  // Filtro: antes_de (para paginação reversa)
  if (params.antes_de) {
    query = query.lt('created_at', params.antes_de);
  }

  // Ordenação (mais antiga primeiro)
  query = query.order('created_at', { ascending: true });

  // Paginação
  const limit = params.limit ?? 50;
  query = query.limit(limit);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar mensagens: ${error.message}`);
  }

  return {
    mensagens: (data as unknown as MensagemChatComUsuario[]) ?? [],
    total: count ?? 0,
  };
}

/**
 * Atualiza uma mensagem (editar)
 */
export async function atualizarMensagemChat(
  id: number,
  params: AtualizarMensagemChatParams
): Promise<MensagemChat> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('mensagens_chat')
    .update({
      conteudo: params.conteudo,
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar mensagem: ${error.message}`);
  }

  return data;
}

/**
 * Soft delete de uma mensagem
 */
export async function deletarMensagemChat(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('mensagens_chat')
    .update({
      deleted_at: new Date().toISOString(),
      conteudo: '[Mensagem deletada]',
    })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Erro ao deletar mensagem: ${error.message}`);
  }
}

/**
 * Conta total de mensagens em uma sala
 */
export async function contarMensagensSala(sala_id: number): Promise<number> {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from('mensagens_chat')
    .select('id', { count: 'exact', head: true })
    .eq('sala_id', sala_id)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Erro ao contar mensagens: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Busca últimas N mensagens de uma sala
 */
export async function buscarUltimasMensagens(
  sala_id: number,
  limite = 50
): Promise<MensagemChatComUsuario[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('mensagens_chat')
    .select(`
      *,
      usuario:usuarios!mensagens_chat_usuario_id_fkey(
        id,
        nome_completo,
        nome_exibicao,
        email_corporativo
      )
    `)
    .eq('sala_id', sala_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error) {
    throw new Error(`Erro ao buscar últimas mensagens: ${error.message}`);
  }

  // Reverter para ordem cronológica
  return ((data as unknown as MensagemChatComUsuario[]) ?? []).reverse();
}

/**
 * Busca mensagens por texto (search)
 */
export async function buscarMensagensPorTexto(
  sala_id: number,
  texto: string
): Promise<MensagemChatComUsuario[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('mensagens_chat')
    .select(`
      *,
      usuario:usuarios!mensagens_chat_usuario_id_fkey(
        id,
        nome_completo,
        nome_exibicao,
        email_corporativo
      )
    `)
    .eq('sala_id', sala_id)
    .is('deleted_at', null)
    .ilike('conteudo', `%${texto}%`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar mensagens por texto: ${error.message}`);
  }

  return (data as unknown as MensagemChatComUsuario[]) ?? [];
}

/**
 * Verifica se usuário pode editar mensagem (15 minutos)
 */
export async function verificarPodeEditarMensagem(
  mensagem_id: number,
  usuario_id: number
): Promise<boolean> {
  const mensagem = await buscarMensagemChatPorId(mensagem_id);

  if (!mensagem) {
    return false;
  }

  // Verificar se é o autor
  if (mensagem.usuario_id !== usuario_id) {
    return false;
  }

  // Verificar tempo (15 minutos)
  const agora = new Date();
  const criacao = new Date(mensagem.created_at);
  const diferencaMinutos = (agora.getTime() - criacao.getTime()) / (1000 * 60);

  return diferencaMinutos <= 15;
}

/**
 * Cria mensagem do sistema (notificação)
 */
export async function criarMensagemSistema(
  sala_id: number,
  conteudo: string,
  usuario_id: number
): Promise<MensagemChat> {
  return await criarMensagemChat(
    {
      sala_id,
      conteudo,
      tipo: 'sistema',
    },
    usuario_id
  );
}

/**
 * Deleta todas as mensagens de uma sala
 */
export async function deletarTodasMensagensSala(sala_id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('mensagens_chat')
    .delete()
    .eq('sala_id', sala_id);

  if (error) {
    throw new Error(`Erro ao deletar todas as mensagens: ${error.message}`);
  }
}
