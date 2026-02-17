import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Endpoint para receber Webhooks do Dify.
 * Pode ser configurado no Dify App -> Settings -> Webhooks.
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar assinatura/segredo se configurado (opcional por enquanto)
    const secret = req.headers.get('Authorization');
    const expectedSecret = process.env.DIFY_WEBHOOK_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    console.log('[Dify Webhook] Evento recebido:', body.event, body.task_id);

    // Aqui você pode implementar lógica dependendo do evento
    // Ex: message.end, workflow.completed, etc.

    // Por enquanto apenas logamos e retornamos sucesso
    return NextResponse.json({ status: 'received' });

  } catch (error: unknown) {
    console.error('[Dify Webhook] Erro:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
