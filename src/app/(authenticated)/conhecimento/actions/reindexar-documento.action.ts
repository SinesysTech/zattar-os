'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { resetarDocumentoParaReindexar } from '../repository';
import { dispararIndexacao } from '../service';
import { getCurrentUser } from '@/lib/auth/server';

const InputSchema = z.object({
  document_id: z.number().int().positive(),
  base_slug: z.string(),
});

export async function reindexarDocumento(input: { document_id: number; base_slug: string }) {
  const { document_id, base_slug } = InputSchema.parse(input);
  const user = await getCurrentUser();
  if (!user?.roles.includes('admin')) {
    throw new Error('Apenas super_admin pode reindexar');
  }
  await resetarDocumentoParaReindexar(document_id);
  await dispararIndexacao(document_id);
  revalidatePath(`/conhecimento/${base_slug}`);
  return { success: true };
}
