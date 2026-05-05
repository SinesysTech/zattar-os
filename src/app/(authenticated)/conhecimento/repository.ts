import { createDbClient } from '@/lib/supabase';
import type {
  KnowledgeBase,
  KnowledgeDocument,
  KnowledgeChunk,
  CriarBaseInput,
  AtualizarBaseInput,
} from './domain';

export async function listarBases(): Promise<KnowledgeBase[]> {
  const supabase = createDbClient();
  const { data, error } = await supabase
    .from('knowledge_bases')
    .select('*')
    .order('nome');
  if (error) throw error;
  return (data ?? []) as KnowledgeBase[];
}

export async function buscarBasePorSlug(slug: string): Promise<KnowledgeBase | null> {
  const supabase = createDbClient();
  const { data, error } = await supabase
    .from('knowledge_bases')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as KnowledgeBase | null;
}

export async function inserirBase(input: CriarBaseInput, userId: number): Promise<KnowledgeBase> {
  const supabase = createDbClient();
  const { data, error } = await supabase
    .from('knowledge_bases')
    .insert({ ...input, created_by: userId })
    .select('*')
    .single();
  if (error) throw error;
  return data as KnowledgeBase;
}

export async function atualizarBase(input: AtualizarBaseInput): Promise<KnowledgeBase> {
  const supabase = createDbClient();
  const { id, ...updates } = input;
  const { data, error } = await supabase
    .from('knowledge_bases')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as KnowledgeBase;
}

export async function deletarBase(id: number): Promise<void> {
  const supabase = createDbClient();
  const { error } = await supabase
    .from('knowledge_bases')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function listarDocumentosDaBase(baseId: number): Promise<KnowledgeDocument[]> {
  const supabase = createDbClient();
  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('*')
    .eq('base_id', baseId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as KnowledgeDocument[];
}

export async function inserirDocumento(args: {
  base_id: number;
  nome: string;
  arquivo_path: string;
  arquivo_tipo: string;
  arquivo_tamanho_bytes: number;
  texto_extraido: string;
  created_by: number;
}): Promise<KnowledgeDocument> {
  const supabase = createDbClient();
  const { data, error } = await supabase
    .from('knowledge_documents')
    .insert({
      ...args,
      status: 'pending',
      tentativas: 0,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as KnowledgeDocument;
}

export async function deletarDocumento(documentId: number): Promise<{ arquivo_path: string }> {
  const supabase = createDbClient();
  const { data: doc, error: selectErr } = await supabase
    .from('knowledge_documents')
    .select('arquivo_path')
    .eq('id', documentId)
    .single();
  if (selectErr) throw selectErr;
  const { error: deleteErr } = await supabase
    .from('knowledge_documents')
    .delete()
    .eq('id', documentId);
  if (deleteErr) throw deleteErr;
  return { arquivo_path: (doc as { arquivo_path: string }).arquivo_path };
}

export async function resetarDocumentoParaReindexar(documentId: number): Promise<void> {
  const supabase = createDbClient();
  const { error: errChunks } = await supabase
    .from('knowledge_chunks')
    .delete()
    .eq('document_id', documentId);
  if (errChunks) throw errChunks;
  const { error: errDoc } = await supabase
    .from('knowledge_documents')
    .update({
      status: 'pending',
      tentativas: 0,
      ultimo_erro: null,
      indexed_at: null,
      total_chunks: 0,
    })
    .eq('id', documentId);
  if (errDoc) throw errDoc;
}

export async function buscarSemantico(args: {
  embedding: number[];
  threshold: number;
  limit: number;
  baseIds?: number[];
}): Promise<KnowledgeChunk[]> {
  const supabase = createDbClient();
  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: args.embedding as unknown as string,
    match_threshold: args.threshold,
    match_count: args.limit,
    filter_base_ids: args.baseIds ?? null,
  });
  if (error) throw error;
  return (data ?? []) as KnowledgeChunk[];
}

export async function uploadArquivoBucket(args: {
  path: string;
  file: Blob | Buffer;
  contentType: string;
}): Promise<void> {
  const supabase = createDbClient();
  const { error } = await supabase.storage
    .from('conhecimento')
    .upload(args.path, args.file as Blob, { contentType: args.contentType, upsert: false });
  if (error) throw error;
}

export async function gerarSignedUrl(arquivoPath: string, expiresInSeconds = 300): Promise<string> {
  const supabase = createDbClient();
  const { data, error } = await supabase.storage
    .from('conhecimento')
    .createSignedUrl(arquivoPath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function removerArquivoBucket(arquivoPath: string): Promise<void> {
  const supabase = createDbClient();
  const { error } = await supabase.storage
    .from('conhecimento')
    .remove([arquivoPath]);
  if (error) throw error;
}
