import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDifyService } from '@/features/dify/service';
import { difyStreamToSSE } from '@/lib/dify';

/**
 * POST /api/dify/chat
 *
 * Proxy streaming de chat Dify.
 * Autenticação via cookie de sessão Supabase.
 * Retorna SSE (Server-Sent Events) para o cliente.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticar
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Obter ID do usuário interno
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // 2. Parsear body
    const body = await request.json();
    const { query, conversationId, inputs, files } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Campo "query" é obrigatório' }, { status: 400 });
    }

    // 3. Criar service e iniciar stream
    const service = await createDifyService(String(usuario.id));
    const streamResult = await service.enviarMensagemStream({
      query,
      conversationId,
      inputs,
      files,
    });

    if (streamResult.isErr()) {
      return NextResponse.json(
        { error: streamResult.error.message },
        { status: 500 }
      );
    }

    // 4. Converter para SSE e retornar
    const sseStream = difyStreamToSSE(streamResult.value);

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[API Dify Chat]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
