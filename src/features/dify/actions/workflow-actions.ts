'use server';

import { authenticatedAction } from '@/lib/safe-action';
import { z } from 'zod';
import { executarWorkflowSchema } from '../domain';

// ---------------------------------------------------------------------------
// Workflow Actions
// ---------------------------------------------------------------------------

export const actionExecutarWorkflowDify = authenticatedAction(
  executarWorkflowSchema,
  async (data, { user }) => {
    const { createDifyService } = await import('../service');
    const service = await createDifyService(String(user.id));
    const result = await service.executarWorkflow(data);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionPararTarefaDify = authenticatedAction(
  z.object({ taskId: z.string().min(1, 'ID da tarefa é obrigatório') }),
  async (data, { user }) => {
    const { createDifyService } = await import('../service');
    const service = await createDifyService(String(user.id));
    const result = await service.pararTarefa(data.taskId);

    if (result.isErr()) throw new Error(result.error.message);
    return { sucesso: true };
  }
);

export const actionListarExecucoesDify = authenticatedAction(
  z.object({
    limite: z.number().int().min(1).max(100).optional().default(20),
    offset: z.number().int().min(0).optional().default(0),
  }),
  async (data, { user }) => {
    const { createDifyRepository } = await import('../repository');
    const repo = await createDifyRepository();
    return repo.listarExecucoes(user.id, data.limite, data.offset);
  }
);
