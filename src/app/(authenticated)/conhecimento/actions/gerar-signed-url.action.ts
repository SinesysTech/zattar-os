'use server';

import { z } from 'zod';
import { gerarSignedUrl } from '../repository';
import { getCurrentUser } from '@/lib/auth/server';
import { createDbClient } from '@/lib/supabase';

const InputSchema = z.object({ document_id: z.number().int().positive() });

export async function gerarUrlAssinada(input: { document_id: number }): Promise<{ url: string }> {
  const { document_id } = InputSchema.parse(input);
  const user = await getCurrentUser();
  if (!user) throw new Error('Não autenticado');

  const supabase = createDbClient();
  const { data: doc, error } = await supabase
    .from('knowledge_documents')
    .select('arquivo_path')
    .eq('id', document_id)
    .single();
  if (error || !doc) throw new Error('Documento não encontrado');

  const url = await gerarSignedUrl((doc as { arquivo_path: string }).arquivo_path, 300);
  return { url };
}
