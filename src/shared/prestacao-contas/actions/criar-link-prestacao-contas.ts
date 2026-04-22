'use server';

import { revalidatePath } from 'next/cache';
import { authenticatedAction } from '@/lib/safe-action';
import { criarLinkPrestacaoContasSchema } from '../domain';
import { criarLinkPrestacaoContas } from '../service';

export const actionCriarLinkPrestacaoContas = authenticatedAction(
  criarLinkPrestacaoContasSchema,
  async ({ parcelaId }, { user }) => {
    const link = await criarLinkPrestacaoContas(parcelaId, user.id);
    revalidatePath('/obrigacoes');
    return link;
  },
);
