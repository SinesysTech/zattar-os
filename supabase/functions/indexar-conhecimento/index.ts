import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TARGET_TOKENS = 1000;
const OVERLAP_TOKENS = 200;
const SEPARATORS = ['\n\n', '\n', '. ', ' '];
const BATCH_SIZE = 64;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  const embeddingModel = Deno.env.get('OPENAI_EMBEDDING_MODEL') ?? 'text-embedding-3-small';

  if (!supabaseUrl || !serviceRoleKey || !openaiApiKey) {
    return jsonResponse({ error: 'Missing environment variables' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let documentId: number;
  try {
    const body = await req.json();
    documentId = Number(body.document_id);
    if (!Number.isInteger(documentId) || documentId <= 0) {
      return jsonResponse({ error: 'Invalid document_id' }, 400);
    }
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { data: doc, error: fetchErr } = await supabase
    .from('knowledge_documents')
    .select('*')
    .eq('id', documentId)
    .eq('status', 'pending')
    .maybeSingle();

  if (fetchErr) return jsonResponse({ error: fetchErr.message }, 500);
  if (!doc) return jsonResponse({ error: 'Document not found or already processed' }, 404);
  if (!doc.texto_extraido) {
    await markFailed(supabase, documentId, 'texto_extraido vazio');
    return jsonResponse({ error: 'texto_extraido vazio' }, 400);
  }

  await supabase
    .from('knowledge_documents')
    .update({ status: 'processing' })
    .eq('id', documentId);

  try {
    const chunks = chunkText(doc.texto_extraido, TARGET_TOKENS, OVERLAP_TOKENS);
    if (chunks.length === 0) throw new Error('Chunking produziu zero chunks');

    // Trim each chunk's content for clean embedding inputs.
    // The chunking algorithm preserves trailing whitespace as a semantic boundary marker,
    // but for embedding/storage we want the clean text.
    const trimmedChunks = chunks.map((c) => ({ ...c, conteudo: c.conteudo.trim() }));

    const embeddings: number[][] = [];
    for (let i = 0; i < trimmedChunks.length; i += BATCH_SIZE) {
      const batch = trimmedChunks.slice(i, i + BATCH_SIZE);
      const batchEmbeddings = await embedBatch(batch.map((c) => c.conteudo), openaiApiKey, embeddingModel);
      embeddings.push(...batchEmbeddings);
    }

    const rows = trimmedChunks.map((chunk, idx) => ({
      document_id: documentId,
      base_id: doc.base_id,
      posicao: chunk.posicao,
      conteudo: chunk.conteudo,
      embedding: embeddings[idx],
      tokens: chunk.tokens,
    }));

    const { error: insertErr } = await supabase.from('knowledge_chunks').insert(rows);
    if (insertErr) throw insertErr;

    await supabase
      .from('knowledge_documents')
      .update({
        status: 'indexed',
        total_chunks: trimmedChunks.length,
        indexed_at: new Date().toISOString(),
        ultimo_erro: null,
      })
      .eq('id', documentId);

    return jsonResponse({ ok: true, chunks: trimmedChunks.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markFailed(supabase, documentId, msg);
    return jsonResponse({ error: msg }, 500);
  }
});

async function markFailed(supabase: ReturnType<typeof createClient>, documentId: number, msg: string) {
  await supabase
    .from('knowledge_documents')
    .update({
      status: 'failed',
      ultimo_erro: msg,
      tentativas: 1,
    })
    .eq('id', documentId);
}

interface Chunk {
  conteudo: string;
  posicao: number;
  tokens: number;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function chunkText(text: string, target: number, overlap: number): Chunk[] {
  const trimmed = text.trim();
  if (estimateTokens(trimmed) <= target) {
    return [{ conteudo: trimmed, posicao: 0, tokens: estimateTokens(trimmed) }];
  }

  // Slicing-based algorithm (matches Task 4 implementation):
  // findChunkEnd backtracks from targetEnd to nearest separator
  const chunks: Chunk[] = [];
  let posicao = 0;
  let chunkStart = text.length - text.trimStart().length;

  while (chunkStart < text.length) {
    const chunkEnd = findChunkEnd(text, chunkStart, target);
    const rawContent = text.slice(chunkStart, chunkEnd);
    const chunkContent = rawContent.trimStart();

    if (chunkContent.trim().length > 0) {
      chunks.push({
        conteudo: chunkContent,
        posicao,
        tokens: estimateTokens(chunkContent),
      });
      posicao++;
    }

    if (chunkEnd >= text.length) break;

    const nextStart = findOverlapStart(text, chunkEnd, overlap);
    chunkStart = nextStart < chunkEnd ? nextStart : chunkEnd;
  }

  return chunks;
}

function findChunkEnd(text: string, startIdx: number, targetTokens: number): number {
  const targetChars = targetTokens * 4;
  const targetEnd = Math.min(startIdx + targetChars, text.length);
  if (targetEnd >= text.length) return text.length;

  for (const sep of SEPARATORS) {
    const searchFrom = targetEnd - sep.length + 1;
    const pos = text.lastIndexOf(sep, searchFrom);
    if (pos > startIdx) {
      return pos + sep.length;
    }
  }
  return targetEnd;
}

function findOverlapStart(text: string, chunkEnd: number, overlapTokens: number): number {
  const overlapChars = overlapTokens * 4;
  const rawStart = chunkEnd - overlapChars;
  if (rawStart <= 0) return 0;

  for (const sep of SEPARATORS) {
    const pos = text.indexOf(sep, rawStart);
    if (pos >= rawStart && pos < chunkEnd) {
      return pos + sep.length;
    }
  }
  return rawStart;
}

async function embedBatch(inputs: string[], apiKey: string, model: string): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ input: inputs, model }),
  });
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenAI embeddings ${response.status}: ${errBody.slice(0, 200)}`);
  }
  const data = await response.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
