'use server';

import { authenticatedAction } from '@/lib/safe-action';
import { z } from 'zod';
import { criarDatasetSchema, criarDocumentoSchema } from '../domain';

// ---------------------------------------------------------------------------
// Knowledge Base Actions
// ---------------------------------------------------------------------------

export const actionCriarDatasetDify = authenticatedAction(
  criarDatasetSchema,
  async (data, { user }) => {
    const { createDifyService } = await import('../service');
    const service = await createDifyService(String(user.id));
    const result = await service.criarDataset(data);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionListarDatasetsDify = authenticatedAction(
  z.object({
    pagina: z.number().int().min(1).optional().default(1),
    limite: z.number().int().min(1).max(100).optional().default(20),
  }),
  async (data, { user }) => {
    const { createDifyService } = await import('../service');
    const service = await createDifyService(String(user.id));
    const result = await service.listarDatasets(data.pagina, data.limite);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionCriarDocumentoDify = authenticatedAction(
  criarDocumentoSchema,
  async (data, { user }) => {
    const { createDifyService } = await import('../service');
    const service = await createDifyService(String(user.id));
    const result = await service.criarDocumento(data);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionListarDocumentosDify = authenticatedAction(
  z.object({
    datasetId: z.string().min(1, 'ID do dataset é obrigatório'),
    pagina: z.number().int().min(1).optional().default(1),
    limite: z.number().int().min(1).max(100).optional().default(20),
  }),
  async (data, { user }) => {
    const { createDifyService } = await import('../service');
    const service = await createDifyService(String(user.id));
    const result = await service.listarDocumentos(data.datasetId, data.pagina, data.limite);

    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);
