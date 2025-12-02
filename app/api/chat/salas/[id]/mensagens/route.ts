/**
 * API Routes para mensagens de chat
 *
 * GET /api/chat/salas/[id]/mensagens - Lista mensagens da sala
 * POST /api/chat/salas/[id]/mensagens - Cria nova mensagem
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarSalaChatPorId } from '@/backend/documentos/services/persistence/chat-persistence.service';
import { buscarCompartilhamento } from '@/backend/documentos/services/persistence/compartilhamento-persistence.service';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  listarMensagensChat,
  criarMensagemChat,
  buscarUltimasMensagens,
  buscarMensagensPorTexto,
} from '@/backend/documentos/services/persistence/chat-persistence.service';
import type {
  CriarMensagemChatParams,
  ListarMensagensChatParams,
} from '@/backend/types/documentos/types';

/**
 * GET /api/chat/salas/[id]/mensagens
 * Lista mensagens de uma sala
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sala_id = parseInt(id);
    if (isNaN(sala_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar se sala existe
    const sala = await buscarSalaChatPorId(sala_id);
    if (!sala) {
      return NextResponse.json(
        { success: false, error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

    const usuarioId = authResult.usuario.id;
    if (sala.tipo === 'privado' && sala.criado_por !== usuarioId && sala.participante_id !== usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado à conversa privada' },
        { status: 403 }
      );
    }

    if (sala.tipo === 'documento' && sala.documento_id) {
      const supabase = createServiceClient();
      const { data: doc } = await supabase
        .from('documentos')
        .select('criado_por')
        .eq('id', sala.documento_id)
        .single();

      const compartilhamento = await buscarCompartilhamento(sala.documento_id, usuarioId);
      const temAcessoDocumento = (doc?.criado_por === usuarioId) || Boolean(compartilhamento);
      if (!temAcessoDocumento) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado ao chat do documento' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);

    const modo = searchParams.get('modo') ?? 'lista'; // 'lista', 'ultimas', 'busca'

    // Modo: Busca
    if (modo === 'busca') {
      const texto = searchParams.get('texto');
      if (!texto) {
        return NextResponse.json(
          { success: false, error: 'Texto de busca é obrigatório' },
          { status: 400 }
        );
      }

      const mensagens = await buscarMensagensPorTexto(sala_id, texto);

      return NextResponse.json({
        success: true,
        data: mensagens,
      });
    }

    // Modo: Últimas mensagens
    if (modo === 'ultimas') {
      const limite = searchParams.get('limite')
        ? parseInt(searchParams.get('limite')!)
        : 50;

      const mensagens = await buscarUltimasMensagens(sala_id, limite);

      return NextResponse.json({
        success: true,
        data: mensagens,
      });
    }

    // Modo: Lista (com paginação)
    const queryParams: ListarMensagensChatParams = {
      sala_id,
      antes_de: searchParams.get('antes_de') ?? undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : undefined,
    };

    const { mensagens, total } = await listarMensagensChat(queryParams);

    return NextResponse.json({
      success: true,
      data: mensagens,
      pagination: {
        total,
        limit: queryParams.limit ?? 50,
        hasMore: mensagens.length === (queryParams.limit ?? 50),
      },
    });
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/salas/[id]/mensagens
 * Cria uma nova mensagem na sala
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sala_id = parseInt(id);
    if (isNaN(sala_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar se sala existe
    const sala = await buscarSalaChatPorId(sala_id);
    if (!sala) {
      return NextResponse.json(
        { success: false, error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

    const usuarioId = authResult.usuario.id;
    if (sala.tipo === 'privado' && sala.criado_por !== usuarioId && sala.participante_id !== usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado à conversa privada' },
        { status: 403 }
      );
    }

    if (sala.tipo === 'documento' && sala.documento_id) {
      const supabase = createServiceClient();
      const { data: doc } = await supabase
        .from('documentos')
        .select('criado_por')
        .eq('id', sala.documento_id)
        .single();

      const compartilhamento = await buscarCompartilhamento(sala.documento_id, usuarioId);
      const temAcessoDocumento = (doc?.criado_por === usuarioId) || Boolean(compartilhamento);
      if (!temAcessoDocumento) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado ao chat do documento' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    // Validação
    if (!body.conteudo || body.conteudo.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Conteúdo é obrigatório' },
        { status: 400 }
      );
    }

    const tipo = body.tipo ?? 'texto';
    if (!['texto', 'arquivo', 'sistema'].includes(tipo)) {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido (texto, arquivo ou sistema)' },
        { status: 400 }
      );
    }

    const mensagemParams: CriarMensagemChatParams = {
      sala_id,
      conteudo: body.conteudo,
      tipo,
    };

    const mensagem = await criarMensagemChat(
      mensagemParams,
      authResult.usuario.id
    );

    return NextResponse.json(
      { success: true, data: mensagem },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
