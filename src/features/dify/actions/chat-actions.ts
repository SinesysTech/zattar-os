'use server';

import { authenticatedAction } from '@/lib/safe-action';
import {
  enviarMensagemSchema,
  listarConversasSchema,
  obterHistoricoSchema,
  enviarFeedbackSchema,
} from '../domain';

// ---------------------------------------------------------------------------
// Chat Actions
// ---------------------------------------------------------------------------

export const actionEnviarMensagemDify = authenticatedAction(
  enviarMensagemSchema,
  async (data, { user }) => {
    const { createDifyService } = await import('../service');
    const service = await createDifyService(String(user.id));
    const result = await service.enviarMensagem(data);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionListarConversasDify = authenticatedAction(
  listarConversasSchema,
  async (data, { user }) => {
    const { createDifyService } = await import('../service');
    const service = await createDifyService(String(user.id));
    const result = await service.listarConversas(data);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionObterHistoricoDify = authenticatedAction(
  obterHistoricoSchema,
  async (data, { user }) => {
    const { createDifyService } = await import('../service');
    const service = await createDifyService(String(user.id));
    const result = await service.obterHistorico(data);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionEnviarFeedbackDify = authenticatedAction(
  enviarFeedbackSchema,
  async (data, { user }) => {
    const { createDifyService } = await import('../service');
    const service = await createDifyService(String(user.id));
    const result = await service.enviarFeedback(data);

    if (result.isErr()) throw new Error(result.error.message);
    return { sucesso: true };
  }
);
