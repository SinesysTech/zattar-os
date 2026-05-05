'use server';

import { revalidatePath } from 'next/cache';
import { CriarBaseInputSchema, type CriarBaseInput, type KnowledgeBase } from '../domain';
import { inserirBase } from '../repository';
import { getCurrentUser } from '@/lib/auth/server';

export async function criarBase(input: CriarBaseInput): Promise<KnowledgeBase> {
  const parsed = CriarBaseInputSchema.parse(input);

  const user = await getCurrentUser();
  if (!user?.roles.includes('admin')) {
    throw new Error('Apenas super_admin pode criar bases de conhecimento');
  }

  const base = await inserirBase(parsed, user.id);
  revalidatePath('/conhecimento');
  return base;
}
