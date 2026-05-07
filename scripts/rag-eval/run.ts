#!/usr/bin/env tsx
/**
 * Golden Set Eval — mede qualidade do retrieval do /conhecimento.
 *
 * Uso:
 *   tsx scripts/rag-eval/run.ts [--k=10] [--no-rerank]
 *
 * Lê golden-set.json, executa cada query contra match_knowledge_hybrid,
 * compara com expected_chunk_ids, imprime Hit Rate@K, Recall@K, MRR.
 *
 * Para comparar antes/depois de uma mudança:
 *   tsx scripts/rag-eval/run.ts > baseline.txt
 *   # ... aplica mudança ...
 *   tsx scripts/rag-eval/run.ts > nova.txt
 *   diff baseline.txt nova.txt
 */
import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { gerarEmbedding } from '../../src/lib/ai/embedding';
import { getDefaultReranker, NoopReranker, type Reranker } from '../../src/lib/conhecimento';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

loadEnv({ path: resolve(process.cwd(), '.env.local') });

interface GoldenQuery {
  id: string;
  query: string;
  expected_chunk_ids: number[];
  notes?: string;
}

interface GoldenSet {
  version: number;
  base: string;
  queries: GoldenQuery[];
}

interface QueryResult {
  id: string;
  query: string;
  expected: number[];
  retrieved: number[];
  hitAtK: 0 | 1;
  recallAtK: number;
  mrr: number;
  latencyMs: number;
}

const args = process.argv.slice(2);
const K = parseInt(args.find((a) => a.startsWith('--k='))?.split('=')[1] ?? '10', 10);
const NO_RERANK = args.includes('--no-rerank');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY faltando em .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const reranker: Reranker = NO_RERANK ? new NoopReranker() : getDefaultReranker();
  const goldenPath = resolve(__dirname, 'golden-set.json');
  const golden = JSON.parse(readFileSync(goldenPath, 'utf-8')) as GoldenSet;

  // Resolve base_id pelo slug
  const { data: base, error: baseErr } = await supabase
    .from('knowledge_bases')
    .select('id')
    .eq('slug', golden.base)
    .single();
  if (baseErr || !base) {
    console.error(`Base "${golden.base}" não encontrada:`, baseErr?.message);
    process.exit(1);
  }

  console.log(`\nGolden Set Eval`);
  console.log(`Base: ${golden.base} (id=${(base as { id: number }).id})`);
  console.log(`Queries: ${golden.queries.length}`);
  console.log(`K: ${K}`);
  console.log(`Reranker: ${reranker.name}\n`);

  const results: QueryResult[] = [];

  for (const q of golden.queries) {
    const t0 = Date.now();
    const embedding = await gerarEmbedding(q.query);

    // Overfetch K*5 e rerank pra K se reranker não é Noop
    const overfetch = reranker.name === 'noop' ? K : K * 5;
    const { data: candidatos, error } = await supabase.rpc('match_knowledge_hybrid', {
      query_text: q.query,
      query_embedding: embedding as unknown as string,
      match_threshold: 0.0,
      match_count: overfetch,
      filter_base_ids: [(base as { id: number }).id],
    });
    if (error) {
      console.error(`Query ${q.id} falhou:`, error.message);
      continue;
    }

    const docs = (candidatos ?? []) as Array<{
      chunk_id: number;
      conteudo: string;
      similarity: number;
      document_id: number;
      document_nome: string;
      base_id: number;
      base_nome: string;
      posicao: number;
      metadata: Record<string, unknown>;
    }>;

    const reranked = await reranker.rerank({
      query: q.query,
      documents: docs.map((c) => ({
        chunk_id: c.chunk_id,
        conteudo: c.conteudo,
        similarity: c.similarity,
        document_id: c.document_id,
        document_nome: c.document_nome,
        base_id: c.base_id,
        base_nome: c.base_nome,
        posicao: c.posicao,
        metadata: c.metadata,
      })),
      topN: K,
    });
    const retrieved = reranked.map((r) => r.chunk.chunk_id);

    const hitAtK = q.expected_chunk_ids.some((id) => retrieved.includes(id)) ? 1 : 0;
    const recallAtK =
      q.expected_chunk_ids.length === 0
        ? NaN
        : q.expected_chunk_ids.filter((id) => retrieved.includes(id)).length /
          q.expected_chunk_ids.length;
    const firstHitIdx = retrieved.findIndex((id) => q.expected_chunk_ids.includes(id));
    const mrr = firstHitIdx === -1 ? 0 : 1 / (firstHitIdx + 1);

    results.push({
      id: q.id,
      query: q.query,
      expected: q.expected_chunk_ids,
      retrieved: retrieved.slice(0, K),
      hitAtK: hitAtK as 0 | 1,
      recallAtK,
      mrr,
      latencyMs: Date.now() - t0,
    });
  }

  // Imprime tabela
  console.log('Por query:');
  console.log('id   | hit | recall | mrr   | latência | query');
  console.log('-----|-----|--------|-------|----------|------');
  for (const r of results) {
    const recallStr = isNaN(r.recallAtK) ? '  -  ' : r.recallAtK.toFixed(2).padEnd(6);
    console.log(
      `${r.id.padEnd(4)} | ${String(r.hitAtK).padEnd(3)} | ${recallStr} | ${r.mrr
        .toFixed(2)
        .padEnd(5)} | ${(r.latencyMs + 'ms').padEnd(8)} | ${r.query.slice(0, 50)}`,
    );
  }

  const validResults = results.filter((r) => !isNaN(r.recallAtK));
  const avgHit = results.reduce((s, r) => s + r.hitAtK, 0) / results.length;
  const avgRecall =
    validResults.reduce((s, r) => s + r.recallAtK, 0) / Math.max(1, validResults.length);
  const avgMrr = results.reduce((s, r) => s + r.mrr, 0) / results.length;
  const avgLatency = results.reduce((s, r) => s + r.latencyMs, 0) / results.length;

  console.log(`\nAgregado:`);
  console.log(`Hit Rate@${K}:    ${(avgHit * 100).toFixed(1)}%`);
  console.log(
    `Recall@${K}:      ${(avgRecall * 100).toFixed(1)}% (sobre queries com expected definido)`,
  );
  console.log(`MRR:             ${avgMrr.toFixed(3)}`);
  console.log(`Latência média:  ${avgLatency.toFixed(0)}ms`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
