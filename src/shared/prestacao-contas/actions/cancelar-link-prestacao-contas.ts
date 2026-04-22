'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { authenticatedAction } from '@/lib/safe-action';
import { cancelarLinkPrestacaoContas } from '../service';

const schema = z.object({ parcelaId: z.number().int().positive() });

export const actionCancelarLinkPrestacaoContas = authenticatedAction(
  schema,
  async ({ parcelaId }) => {
    await cancelarLinkPrestacaoContas(parcelaId);
    revalidatePath('/obrigacoes');
    return { ok: true };
  },
);
