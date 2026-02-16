import { NextRequest, NextResponse } from 'next/server';
import { createDifyService } from '@/features/dify/factory';
import { enviarMensagemSchema } from '@/features/dify/domain';

// Definir runtime como edge para melhor performance em streaming se suportado pela infra
// Se houver dependências Node.js específicas no service, remover essa linha
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    // O schema espera 'user' como string obrigatória, mas no frontend as vezes o user vem do contexto de auth
    // Vamos garantir que ele exista ou usar um fallback
    const payload = {
      ...json,
      user: json.user || 'anonymous-user',
    };

    const parseResult = enviarMensagemSchema.safeParse(payload);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { query, inputs, conversation_id, user } = parseResult.data;

    const userId = user || 'anonymous-user';

    // Inicializa o serviço
    const service = await createDifyService(userId);

    // Chama o método de stream do service
    const result = await service.enviarMensagemStream({
      query,
      inputs,
      conversation_id,
    }, userId);

    if (result.isErr()) {
      console.error('[API Dify] Erro no service:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const stream = result.value;

    // Retorna o stream como resposta SSE
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[API Dify] Erro não tratado:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar chat', details: error.message },
      { status: 500 }
    );
  }
}
