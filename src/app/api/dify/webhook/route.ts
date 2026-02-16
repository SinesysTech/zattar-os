import { NextRequest, NextResponse } from 'next/server';
import { getDifyConfig } from '@/lib/dify';

/**
 * POST /api/dify/webhook
 *
 * Recebe callbacks do Dify (ex: workflow completion).
 * Valida o secret e persiste o resultado no Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar webhook secret
    const config = getDifyConfig();
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (config.DIFY_WEBHOOK_SECRET && providedSecret !== config.DIFY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parsear payload
    const payload = await request.json();
    const { event, workflow_run_id, data } = payload;

    console.log(`[Dify Webhook] Evento recebido: ${event}`, {
      workflowRunId: workflow_run_id,
    });

    // 3. Processar por tipo de evento
    if (event === 'workflow_finished' && workflow_run_id && data) {
      const { createDifyRepository } = await import('@/features/dify/repository');
      const repo = await createDifyRepository();

      await repo.atualizarStatusExecucao(
        workflow_run_id,
        data.status || 'succeeded',
        data.outputs,
        data.error
      );

      console.log(`[Dify Webhook] Execução ${workflow_run_id} atualizada: ${data.status}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Dify Webhook] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar webhook' },
      { status: 500 }
    );
  }
}
