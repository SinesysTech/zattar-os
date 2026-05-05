'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { deletarBase as repoDeletar, listarDocumentosDaBase, removerArquivoBucket } from '../repository';
import { getCurrentUser } from '@/lib/auth/server';

const InputSchema = z.object({ id: z.number().int().positive() });

export async function deletarBase(input: { id: number }): Promise<{ success: true }> {
  const { id } = InputSchema.parse(input);
  const user = await getCurrentUser();
  if (!user?.roles.includes('admin')) {
    throw new Error('Apenas super_admin pode deletar bases');
  }

  // Antes de cascatear delete, remover arquivos do bucket
  const documentos = await listarDocumentosDaBase(id);
  for (const doc of documentos) {
    if (doc.arquivo_path && doc.arquivo_path !== 'pending') {
      try { await removerArquivoBucket(doc.arquivo_path); }
      catch (err) { console.warn('[deletarBase] Falha ao remover arquivo:', doc.arquivo_path, err); }
    }
  }

  await repoDeletar(id);
  revalidatePath('/conhecimento');
  return { success: true };
}
