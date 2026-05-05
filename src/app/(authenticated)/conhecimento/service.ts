import { extrairTexto, type FormatoArquivo } from '@/lib/conhecimento';
import * as repository from './repository';
import { createDbClient } from '@/lib/supabase';

export function sanitizarNomeArquivo(nome: string): string {
  // Remove extensão, normaliza acentos, kebab-case, limita a 80 chars
  const semExt = nome.replace(/\.[^.]+$/, '');
  const semAcentos = semExt.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const slug = semAcentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
  return slug;
}

export function construirPathArquivo(args: {
  baseSlug: string;
  documentId: number;
  nomeOriginal: string;
  extensao: string;
}): string {
  const slug = sanitizarNomeArquivo(args.nomeOriginal);
  return `${args.baseSlug}/${args.documentId}-${slug}.${args.extensao}`;
}

export interface ProcessarUploadArgs {
  baseId: number;
  baseSlug: string;
  nomeOriginal: string;
  arquivoTipo: FormatoArquivo;
  arquivoTamanhoBytes: number;
  buffer: Buffer;
  userId: number;
}

/**
 * Cria documento, faz upload, dispara edge function fire-and-forget.
 * Retorna o documento criado em status='pending'.
 */
export async function processarUpload(args: ProcessarUploadArgs) {
  // 1. Extrair texto antes de qualquer escrita (falha rápido se formato corrompido)
  const textoExtraido = await extrairTexto(args.buffer, args.arquivoTipo);

  // 2. Inserir documento (precisa do ID antes de subir arquivo, para path)
  const documentoTemp = await repository.inserirDocumento({
    base_id: args.baseId,
    nome: args.nomeOriginal,
    arquivo_path: 'pending',
    arquivo_tipo: args.arquivoTipo,
    arquivo_tamanho_bytes: args.arquivoTamanhoBytes,
    texto_extraido: textoExtraido,
    created_by: args.userId,
  });

  // 3. Subir arquivo no bucket com path final
  const arquivoPath = construirPathArquivo({
    baseSlug: args.baseSlug,
    documentId: documentoTemp.id,
    nomeOriginal: args.nomeOriginal,
    extensao: args.arquivoTipo,
  });

  const contentType = mimeTypeFromFormato(args.arquivoTipo);
  await repository.uploadArquivoBucket({
    path: arquivoPath,
    file: args.buffer,
    contentType,
  });

  // 4. Atualizar documento com path final
  const supabase = createDbClient();
  const { data: documento, error } = await supabase
    .from('knowledge_documents')
    .update({ arquivo_path: arquivoPath })
    .eq('id', documentoTemp.id)
    .select('*')
    .single();
  if (error) throw error;

  // 5. Disparar edge function fire-and-forget
  await dispararIndexacao(documentoTemp.id);

  return documento;
}

export async function dispararIndexacao(documentId: number): Promise<void> {
  const supabase = createDbClient();
  // invoke retorna assim que a função aceita o request — não aguarda processamento
  const { error } = await supabase.functions.invoke('indexar-conhecimento', {
    body: { document_id: documentId },
  });
  if (error) {
    // Marca como failed para visibilidade na UI
    await supabase
      .from('knowledge_documents')
      .update({
        status: 'failed',
        ultimo_erro: `Edge function unreachable: ${error.message}`,
        tentativas: 1,
      })
      .eq('id', documentId);
    throw new Error(`Falha ao disparar indexação: ${error.message}`);
  }
}

function mimeTypeFromFormato(formato: FormatoArquivo): string {
  const map: Record<FormatoArquivo, string> = {
    txt: 'text/plain',
    md: 'text/markdown',
    html: 'text/html',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return map[formato];
}
