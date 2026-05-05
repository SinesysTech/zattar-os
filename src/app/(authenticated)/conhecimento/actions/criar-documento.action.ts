'use server';

import { revalidatePath } from 'next/cache';
import { TAMANHO_MAX_BYTES, FORMATOS_ARQUIVO, type FormatoArquivo, type KnowledgeDocument } from '../domain';
import { buscarBasePorSlug } from '../repository';
import { processarUpload } from '../service';
import { getCurrentUser } from '@/lib/auth/server';

const MIME_TO_FORMATO: Record<string, FormatoArquivo> = {
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/html': 'html',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

function inferirFormato(mimeType: string, nomeArquivo: string): FormatoArquivo | null {
  if (MIME_TO_FORMATO[mimeType]) return MIME_TO_FORMATO[mimeType];
  const ext = nomeArquivo.split('.').pop()?.toLowerCase();
  if (ext && (FORMATOS_ARQUIVO as ReadonlyArray<string>).includes(ext)) {
    return ext as FormatoArquivo;
  }
  return null;
}

export async function criarDocumento(formData: FormData): Promise<KnowledgeDocument> {
  const user = await getCurrentUser();
  if (!user?.roles.includes('admin')) {
    throw new Error('Apenas super_admin pode adicionar documentos');
  }

  const baseSlug = formData.get('base_slug');
  const nome = formData.get('nome');
  const arquivo = formData.get('arquivo');

  if (typeof baseSlug !== 'string' || !baseSlug) throw new Error('base_slug obrigatório');
  if (typeof nome !== 'string' || !nome) throw new Error('nome obrigatório');
  if (!(arquivo instanceof Blob)) throw new Error('arquivo obrigatório');

  if (arquivo.size > TAMANHO_MAX_BYTES) {
    throw new Error('Arquivo excede o limite de 50 MB');
  }

  const formato = inferirFormato(arquivo.type, nome);
  if (!formato) {
    throw new Error(`Formato não suportado. Aceitos: ${FORMATOS_ARQUIVO.join(', ')}`);
  }

  const base = await buscarBasePorSlug(baseSlug);
  if (!base) throw new Error('Base não encontrada');

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const documento = await processarUpload({
    baseId: base.id,
    baseSlug: base.slug,
    nomeOriginal: nome,
    arquivoTipo: formato,
    arquivoTamanhoBytes: arquivo.size,
    buffer,
    userId: user.id,
  });

  revalidatePath(`/conhecimento/${baseSlug}`);
  return documento as KnowledgeDocument;
}
