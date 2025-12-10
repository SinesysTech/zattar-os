/**
 * API Routes para salas de chat
 *
 * GET /api/chat/salas - Lista salas de chat
 * POST /api/chat/salas - Cria nova sala de chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarSalasChat,
  criarSalaChat,
  buscarSalaGeral,
} from '@/backend/documentos/services/persistence/chat-persistence.service';
import type {
  CriarSalaChatParams,
  ListarSalasChatParams,
} from '@/backend/types/documentos/types';

/**
 * GET /api/chat/salas
 * Lista salas de chat
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Modo especial: buscar sala geral
    if (searchParams.get('modo') === 'geral') {
      const salaGeral = await buscarSalaGeral();

      if (!salaGeral) {
        return NextResponse.json(
          { success: false, error: 'Sala Geral não encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: salaGeral,
      });
    }

    const params: ListarSalasChatParams = {
      tipo: (searchParams.get('tipo') as 'geral' | 'documento' | 'privado') ?? undefined,
      documento_id: searchParams.get('documento_id')
        ? parseInt(searchParams.get('documento_id')!)
        : undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : undefined,
      offset: searchParams.get('offset')
        ? parseInt(searchParams.get('offset')!)
        : undefined,
    };

    const { salas, total } = await listarSalasChat(params, authResult.usuario.id);

    return NextResponse.json({
      success: true,
      data: salas,
      pagination: {
        total,
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
        hasMore: (params.offset ?? 0) + salas.length < total,
      },
    });
  } catch (error) {
    console.error('Erro ao listar salas de chat:', error);
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
 * POST /api/chat/salas
 * Cria uma nova sala de chat
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CriarSalaChatParams = await request.json();

    // Validação
    if (!body.nome || body.nome.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.tipo || !['geral', 'documento', 'privado', 'grupo'].includes(body.tipo)) {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido (geral, documento, privado ou grupo)' },
        { status: 400 }
      );
    }

    // Validação: sala de documento deve ter documento_id
    if (body.tipo === 'documento' && !body.documento_id) {
      return NextResponse.json(
        { success: false, error: 'documento_id é obrigatório para salas de documento' },
        { status: 400 }
      );
    }

    // Validação: sala privada deve ter participante_id
    if (body.tipo === 'privado' && !body.participante_id) {
      return NextResponse.json(
        { success: false, error: 'participante_id é obrigatório para conversas privadas' },
        { status: 400 }
      );
    }

    // Validação: não permitir criar sala geral (já existe uma)
    if (body.tipo === 'geral') {
      return NextResponse.json(
        { success: false, error: 'Sala Geral já existe' },
        { status: 400 }
      );
    }

    const sala = await criarSalaChat(body, authResult.usuario.id);

    return NextResponse.json(
      { success: true, data: sala },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar sala de chat:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
