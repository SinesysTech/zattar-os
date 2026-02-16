'use server';

import { createClient } from '@/lib/supabase/server';
import { DifyService } from '../service';
import { executarWorkflowSchema, StatusExecucaoDify } from '../domain';
import { difyRepository } from '../repository';
import { revalidatePath } from 'next/cache';

export async function actionExecutarWorkflow(params: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Usuário não autenticado' };
  }

  const parseResult = executarWorkflowSchema.safeParse(params);
  if (!parseResult.success) {
    return { error: 'Parâmetros inválidos', details: parseResult.error.format() };
  }

  const difyServiceResult = DifyService.create(process.env.DIFY_WORKFLOW_APP_KEY);
  if (difyServiceResult.isErr()) {
    return { error: difyServiceResult.error.message };
  }

  const service = difyServiceResult.value;
  const result = await service.executarWorkflow(parseResult.data, user.email || 'anonymous');

  if (result.isErr()) {
    return { error: result.error.message };
  }

  // Persistir execução
  const execData = result.value.data;
  await difyRepository.salvarExecucaoWorkflow({
    workflow_run_id: result.value.workflow_run_id,
    task_id: result.value.task_id,
    status: execData.status as StatusExecucaoDify,
    inputs: parseResult.data.inputs,
    outputs: execData.outputs,
    total_tokens: execData.total_tokens,
    elapsed_time: execData.elapsed_time,
    total_steps: execData.total_steps,
    usuario_id: user.id as any, // uuid
    finished_at: execData.finished_at ? new Date(execData.finished_at * 1000) : undefined,
  });

  return { data: result.value };
}
