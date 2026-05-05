'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { deletarDocumento as repoDeletar, removerArquivoBucket } from '../repository';
import { getCurrentUser } from '@/lib/auth/server';

const InputSchema = z.object({
  document_id: z.number().int().positive(),
  base_slug: z.string(),
});

export async function deletarDocumento(input: { document_id: number; base_slug: string }) {
  const { document_id, base_slug } = InputSchema.parse(input);
  const user = await getCurrentUser();
  if (!user?.roles.includes('admin')) {
    throw new Error('Apenas super_admin pode deletar documentos');
  }

  const { arquivo_path } = await repoDeletar(document_id);
  if (arquivo_path && arquivo_path !== 'pending') {
    try { await removerArquivoBucket(arquivo_path); }
    catch (err) { console.warn('[deletarDocumento] Falha ao remover arquivo:', err); }
  }

  revalidatePath(`/conhecimento/${base_slug}`);
  return { success: true };
}
