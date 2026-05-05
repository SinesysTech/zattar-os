'use server';

import { revalidatePath } from 'next/cache';
import { AtualizarBaseInputSchema, type AtualizarBaseInput, type KnowledgeBase } from '../domain';
import { atualizarBase as repoAtualizar } from '../repository';
import { getCurrentUser } from '@/lib/auth/server';

export async function atualizarBase(input: AtualizarBaseInput): Promise<KnowledgeBase> {
  const parsed = AtualizarBaseInputSchema.parse(input);
  const user = await getCurrentUser();
  if (!user?.roles.includes('admin')) {
    throw new Error('Apenas super_admin pode editar bases de conhecimento');
  }
  const base = await repoAtualizar(parsed);
  revalidatePath('/conhecimento');
  revalidatePath(`/conhecimento/${base.slug}`);
  return base;
}
