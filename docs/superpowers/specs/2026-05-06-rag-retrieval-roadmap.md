# RAG Retrieval — Roadmap de Melhorias

**Data:** 2026-05-06
**Contexto:** Análise do estado atual + best practices 2024-2026 → recomendações priorizadas
**Escopo:** apenas qualidade de retrieval (não tocar UI, edição, geração de texto)

---

## Sumário Executivo

O ZattarOS tem **dois subsistemas de RAG**:
1. **Schema 38** (`public.embeddings`) — embeddings de entidades CRM (peças, andamentos, contratos)
2. **Schema 52** (`public.knowledge_chunks`) — loja vetorial de conhecimento (jurisprudência, modelos)

Ambos compartilham **arquitetura simples e ingênua**:
- Chunk fixo de ~1000 tokens com overlap 200
- Embedding `text-embedding-3-small` (1536d)
- Cosine similarity via HNSW
- Top-K com threshold único, sem reranking, sem hybrid

A pesquisa de mercado (set/2024 → mai/2026) mostra que esse baseline tem **falha de 5-7% em retrieval real** (Anthropic), enquanto o pipeline _state-of-the-art_ (hybrid + contextual + rerank) chega a **~1.9%**. Isto é, há **~3x de margem** para melhorar a qualidade do retrieval atual.

---

## Tier 1 — Quick Wins (alto ROI, baixo esforço)

### 1.1. Hybrid Search (BM25 + vetor com RRF)

**Por que:** Termos jurídicos exatos ("art. 5º CF/88", "OJ-SDI1-383", número de processo) caem no BM25 onde o vetor falha. Ganho típico: **+15-20% recall@5** ([Superlinked](https://superlinked.com/vectorhub/articles/optimizing-rag-with-hybrid-search-reranking)).

**O que fazer:**
1. Adicionar coluna gerada `fts tsvector` em `knowledge_chunks` e `embeddings`:
   ```sql
   alter table public.knowledge_chunks add column fts tsvector
     generated always as (to_tsvector('portuguese', conteudo)) stored;
   create index on public.knowledge_chunks using gin(fts);
   ```
2. Criar RPC `match_knowledge_hybrid` com Reciprocal Rank Fusion (k=50):
   ```sql
   with semantic as (
     select id, row_number() over (order by embedding <=> q) as rank
     from chunks order by embedding <=> q limit count*2
   ),
   keyword as (
     select id, row_number() over (order by ts_rank_cd(fts, query)) as rank
     from chunks, plainto_tsquery('portuguese', text) query
     where fts @@ query limit count*2
   )
   select id, 1.0/(50+s.rank) + 1.0/(50+k.rank) as score ...
   ```
3. Trocar `match_knowledge` por `match_knowledge_hybrid` no Server Action e MCP tool.

**Esforço:** 1 dia (migration + RPC + ajuste action). Reusa Postgres FTS existente.

**Atenção:** usar `'portuguese'` no `to_tsvector` — sem isso, stemming inglês quebra português.

---

### 1.2. Normalização de chunks antes do embedding

**Por que:** Chunks com whitespace excessivo, marcadores de página (`-- 492 of 579 --`), hifenizações de quebra de linha (`empre-\ngados`) **degradam embeddings silenciosamente**. Já vimos no card de resultado que o texto bruto vinha sujo — o embedding da fonte tem o mesmo problema.

**O que fazer:** Adicionar etapa de normalização entre extração e chunking. Usar a função `normalizeChunkText` que já criamos em `resultado-chunk-card.tsx` mas mover pra `src/lib/conhecimento/chunking.ts` ou crear `normalize-text.ts`:
```typescript
export function normalizarTexto(text: string): string {
  return text
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '')          // marcadores de página
    .replace(/(\w)-\n(\w)/g, '$1$2')                    // hifenizações
    .replace(/[ \t]+/g, ' ')                            // espaços múltiplos
    .replace(/(?<!\n)\n(?!\n)/g, ' ')                   // newlines simples
    .replace(/\n{3,}/g, '\n\n')                         // colapsa parágrafos
    .trim();
}
```

Aplicar no `processarUpload` (service.ts) **antes** de salvar `texto_extraido` e antes de chunkar.

**Esforço:** 2h. Re-indexação opcional dos chunks existentes (deletar + reindexar).

**Ganho:** difícil quantificar precisamente, mas elimina ruído sistemático que está no embedding fonte.

---

### 1.3. Filtragem por metadata pre-vetor

**Por que:** Quando o usuário sabe o escopo (ex: "só súmulas TST de 2024"), filtrar antes do match vetorial **reduz o espaço em 60-80%** e elimina ruído semântico de outros domínios.

**O que fazer:**
- Adicionar metadata estruturado em `knowledge_chunks.metadata` durante indexação. Ex: `{tribunal, ano, tipo_documento, palavras_chave}`.
- Ampliar RPC `match_knowledge` (ou hybrid) com filtros opcionais.
- Expor filtros na UI (`buscar-tab.tsx`) — dropdowns alimentados das metadata existentes.

**Esforço:** 1-2 dias dependendo de quanta metadata fizer sentido extrair.

**Atenção em pgvector:** Filtros muito restritivos com HNSW podem **degradar recall** (graph fica desconectado). Para filtros que removem >90%, considerar IVFFlat ou post-filter.

---

### 1.4. Cache de query embeddings

**Estado atual:** O subsistema 2 já tem cache via `gerarEmbedding()` em `src/lib/ai/embedding.ts` (Redis, MD5 hash, TTL 7d). **O subsistema 1** (`generateEmbedding()` em `embedding.service.ts`) **não tem cache**.

**O que fazer:** Migrar `embedding.service.ts` para usar a infra de cache de `embedding.ts` ou duplicar o cache layer.

**Esforço:** 2-3h.

**Ganho:** Queries jurídicas são repetitivas ("responsabilidade civil médica", "rescisão indireta") — cache hit reduz custo OpenAI e latência ~300ms para zero.

---

## Tier 2 — Investimentos no Próximo Sprint (médio esforço, alto impacto)

### 2.1. Reranking com cross-encoder

**Por que:** Após retrieval (top-50 com hybrid), reranquear com cross-encoder eleva **Recall@5 para ~0.87** vs ~0.82 só com hybrid ([Superlinked](https://superlinked.com/vectorhub)). Para jurídico onde tolera-se 1-2s, é obrigatório.

**Tier list de rerankers (mai/2026):**

| Modelo | Latência | Multilingual | Custo | Recomendação |
|---|---|---|---|---|
| **Voyage Rerank 2.5** | ~595ms | ✅ | ~$2/M | Produção, melhor balanço |
| **Cohere Rerank 3.5** | ~603ms | ✅ | $2/M | Maduro, multilingual sólido |
| Jina Reranker v2 | ~700ms | ✅ open-source | grátis self-host | MVP sem custo de API |
| ZeroEntropy zerank-1 | ~60ms | limitado | $0.025/M | Latência crítica |

**O que fazer:**
1. Adicionar tier 1 hybrid retornando top-50.
2. Criar `lib/rag/rerank.ts` que chama API do Cohere/Voyage com os 50 chunks + query, retorna top-10 reranqueados.
3. Pipeline: `hybrid_search(50) → rerank(10) → LLM/UI`.

**Esforço:** 3-5 dias incluindo escolha de provedor, integração e testes.

**Custo:** ~$50/mês para volume médio de buscas.

---

### 2.2. Parent-Child chunking

**Por que:** A literatura converge em **256-512 tokens para embeddar** (precisão) e **1024-2048 tokens para devolver ao LLM** (contexto). Atualmente usamos 1000 tokens para AMBOS — conflito de objetivos.

**O que fazer:**
1. Re-arquitetar chunking: chunkar em 256t (filho) e 1024t (pai), guardar `parent_id` em `knowledge_chunks`.
2. Indexar embedding apenas do filho.
3. Na busca, recuperar filho mas **devolver o pai** (mais contexto para LLM).

**Esforço:** 1 sprint (re-ingestão completa, ajuste schema, ajuste retrieval).

**Atenção:** Re-ingestão custa OpenAI tokens. Para 440 chunks atuais → ~1100 chunks-filho. ~$0.05 por re-ingestão completa de uma base.

---

### 2.3. Hierarquia de modelos de embedding

**Estado atual:** `text-embedding-3-small` (1536d, $0.02/M tokens). Para jurídico PT-BR, não é o ideal.

**Comparativo MTEB para `law`:**

| Modelo | MTEB law | Preço | Re-ingestão? |
|---|---|---|---|
| OpenAI 3-small | ~62 | $0.02/M | atual |
| OpenAI 3-large | ~64.6 | $0.13/M | sim, 6.5x custo |
| **Voyage-3-large** | **~68** (#1 law) | $0.06/M | sim, +ROI |
| Voyage-3-lite | ~65 | $0.02/M | sim, sem custo extra |

**Recomendação:** Quando criar o golden set (Tier 3), comparar `voyage-3-lite` vs `text-embedding-3-small`. Se ganho >5% em recall → migrar.

**Esforço:** 1 dia para teste lado-a-lado, 1 dia para migração + re-ingestão.

---

## Tier 3 — Investimentos Estratégicos (alto esforço, alto impacto)

### 3.1. Contextual Retrieval (Anthropic)

**Por que:** **Padrão-ouro atual.** Anthropic publicou que `Contextual Embeddings + BM25 + Reranking` reduz falhas de retrieval em **67%** ([Anthropic, set/2024](https://www.anthropic.com/news/contextual-retrieval)).

Para cada chunk, antes de embeddar, gerar 50-100 tokens de contexto situando-o no documento completo:

```typescript
const ctx = await claude.complete(`
  <document>${docCompleto}</document>
  <chunk>${chunk}</chunk>
  Em 1-2 frases, contexto desta passagem dentro do documento.`);
const embeddingInput = `${ctx}\n\n${chunk}`;
```

**Custo com Prompt Caching:** ~$1.02 por 1M tokens de documento. Para 440 chunks atuais (~440k tokens) → ~$0.45 de custo único na ingestão.

**Esforço:** 1 sprint completo + re-ingestão.

**Quando fazer:** Após ter golden set para medir antes/depois. Sem isso, é otimização cega.

---

### 3.2. Golden set + avaliação contínua

**Por que:** Sem isso, **todas as melhorias acima são cegas**. É o que transforma RAG de "parece bom" em "é bom".

**O que fazer:**
1. Selecionar 100-200 acórdãos representativos da base.
2. Para cada um, extrair 3-5 perguntas que ele responde (Claude/GPT-4o).
3. Marcar manualmente quais chunks contêm a resposta correta.
4. Calcular **Recall@5** e **Hit Rate@10** antes/depois de cada mudança.

**Frameworks:**

| Framework | Linguagem | Recomendação |
|---|---|---|
| **Ragas** | Python | Mais leve, métricas LLM-as-judge |
| DeepEval | Python | Estilo pytest |
| LangSmith | TS/Python | SaaS, integrado ao LangChain |

**Esforço:** 2-3 dias iniciais + manutenção contínua.

**Custo:** ~$5 em LLM para gerar perguntas + 2h de trabalho manual de marcação.

---

### 3.3. OCR para PDFs escaneados

**Estado atual:** `pdf-parse` v2 retorna string vazia para PDFs escaneados (sem OCR built-in). Documentos antigos de jurisprudência são tipicamente escaneados.

**Tier list OCR (2025/2026):**

| Solução | Qualidade | Custo | Setup |
|---|---|---|---|
| **Mistral OCR** (`mistral-ocr-latest`) | #1 em jurídico | ~$1/1k páginas | API |
| Reducto.ai | Alta + estruturação | $$$ | SaaS |
| MarkItDown (Microsoft) | Boa, free | grátis | Self-host |
| Google Document AI | Boa | $$$ | GCP |

**Esforço:** Integração via API: 2-3 dias. Setup local (MarkItDown): 1 sprint.

**Quando fazer:** Quando aparecer documento escaneado real e não funcionar (degradação silenciosa).

---

## Anti-Patterns Encontrados no Projeto

Durante a auditoria, identifiquei alguns issues além dos gaps de feature:

### A1. Chunking implementado em DOIS lugares com lógica ligeiramente diferente

`src/lib/conhecimento/chunking.ts` (Node) e dentro de `supabase/functions/indexar-conhecimento/index.ts` (Deno). **Risco:** divergência silenciosa quando alguém atualiza um e esquece o outro.

**Fix:** Considerar replicar via build-time bundling (esbuild) ou aceitar a duplicação documentando explicitamente que **devem permanecer idênticos**.

### A2. Módulo legacy ativo

`src/lib/ai/retrieval.ts` e `src/lib/ai/indexing.ts` referenciam tabela `embeddings_conhecimento` que **não existe em nenhum schema**. Qualquer chamada a essas funções resulta em erro em produção.

**Fix:** Deletar arquivos ou marcar com `@deprecated` + lançamento de erro explícito ao import.

### A3. DOCX não funcional no subsistema 1

`extraction.service.ts:83` lança `'Extração de DOCX não implementada ainda'`. Subsistema 2 já tem `mammoth` funcionando.

**Fix:** Migrar `extraction.service.ts` para usar `extrairTexto` de `src/lib/conhecimento/extracao-texto.ts` (que já cobre DOCX).

### A4. Tabela `documentos_pendentes_indexacao` sem schema versionado

Central para subsistema 1, mas não há arquivo SQL definindo. **Risco:** drift entre ambientes.

**Fix:** Criar `supabase/schemas/53_documentos_pendentes_indexacao.sql` documentando a tabela.

### A5. Sem tokenizer real (usa heurística `chars/4`)

Pode levar a chunks que excedem `8191` tokens da OpenAI silenciosamente.

**Fix:** Adicionar `tiktoken` (WASM port) para contagem precisa. Ou aceitar com guard de defensive: `if (chunk.length > 8000 * 4) split further`.

---

## Stack de Bibliotecas Recomendado

Para os investimentos acima, tier list de libs TypeScript:

| Lib | Uso | Tamanho | Recomendação |
|---|---|---|---|
| `@langchain/textsplitters` | Recursive char split (alternativa ao caseiro) | ~21MB | **Não recomendo** — manter caseiro é mais simples |
| `@vercel/ai` | `embedMany()` helper, streaming | Leve | **Útil** se padronizar |
| `tiktoken` (WASM) | Contagem real de tokens | Leve | **Adicionar** — quick win |
| `cohere-ai` | API rerank | Mínimo | **Adicionar** quando rerank |
| `unpdf` | Extração PDF moderna | WASM | **Considerar** vs pdf-parse v2 |
| `@anthropic-ai/sdk` | Já está no projeto | já | Para Contextual Retrieval (Tier 3) |
| `langchain.js` completo | Framework RAG | ~36MB | **Não recomendo** — overkill |
| `llamaindex` (TS) | Framework RAG | ~36MB | **Não recomendo** — overkill |

**Pattern:** rolar caseiro para chunking/retrieval (já temos), usar libs apenas para integrações específicas (Cohere SDK para rerank, Anthropic SDK para contextual).

---

## Plano de Execução Sugerido

### Sprint 1 (1 semana) — Quick Wins
- [ ] Hybrid search com RRF + `tsvector('portuguese')`
- [ ] Normalização de chunks no ingest
- [ ] Cache de query embeddings no subsistema 1
- [ ] Filtros de metadata na UI de busca

### Sprint 2 (1 semana) — Quality gate
- [ ] Golden set: 50 perguntas + chunks marcados
- [ ] Script Ragas/DeepEval rodando localmente
- [ ] Métricas Recall@5, Hit Rate@10 baseline

### Sprint 3 (2 semanas) — Reranking + Parent-Child
- [ ] Cohere/Voyage Rerank integrado
- [ ] Re-ingestão com chunking parent-child
- [ ] Comparar métricas baseline vs novo
- [ ] Deploy gradual (feature flag)

### Sprint 4+ (estratégico) — Contextual Retrieval
- [ ] PoC de Contextual Retrieval com Claude
- [ ] Comparar custo + ganho vs pipeline anterior
- [ ] Decisão go/no-go

---

## Referências

- [Anthropic — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) (set/2024, 9k+ stars)
- [Supabase — Hybrid Search Docs](https://supabase.com/docs/guides/ai/hybrid-search)
- [Superlinked VectorHub — Optimizing RAG](https://superlinked.com/vectorhub/articles/optimizing-rag-with-hybrid-search-reranking)
- [Voyage AI — voyage-3-large announcement](https://blog.voyageai.com/2025/01/07/voyage-3-large/)
- [ZeroEntropy — Reranker Guide 2026](https://zeroentropy.dev/articles/ultimate-guide-to-choosing-the-best-reranking-model-in-2025/)
- [Crunchy Data — HNSW with pgvector](https://www.crunchydata.com/blog/hnsw-indexes-with-postgres-and-pgvector)
- [Weaviate — Chunking Strategies](https://weaviate.io/blog/chunking-strategies-for-rag)
- [Towards Data Science — Your Chunks Failed Your RAG](https://towardsdatascience.com/your-chunks-failed-your-rag-in-production/)
