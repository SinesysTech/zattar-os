# RAG Eval — Golden Set

Mede qualidade de retrieval do /conhecimento contra queries fixas.

## Uso

```bash
tsx scripts/rag-eval/run.ts                  # K=10, com rerank padrão
tsx scripts/rag-eval/run.ts --k=5            # top-5
tsx scripts/rag-eval/run.ts --no-rerank      # desabilita reranker

# Comparar antes/depois de uma mudança:
tsx scripts/rag-eval/run.ts > baseline.txt
# ... aplica mudança ...
tsx scripts/rag-eval/run.ts > nova.txt
diff baseline.txt nova.txt
```

Ou via npm:

```bash
npm run rag:eval
npm run rag:eval -- --k=5 --no-rerank
```

## Métricas

- **Hit Rate@K** — Pelo menos um chunk esperado está em top-K? (0 ou 1 por query, média no agregado)
- **Recall@K** — Fração dos expected_chunk_ids recuperados em top-K
- **MRR** — 1/posição do primeiro hit. 1.0 = primeiro lugar, 0.5 = segundo, 0 = não achou

## Adicionando queries

Edite `golden-set.json`. Cada query precisa de `id`, `query` e `expected_chunk_ids`. Para descobrir IDs reais:

```sql
select id, posicao, left(conteudo, 80) as preview
from public.knowledge_chunks
where conteudo ilike '%termo de interesse%'
limit 10;
```

## Convenção

- Queries com `expected_chunk_ids: []` ainda rodam mas Recall@K é descartado da média.
- Use isso pra queries exploratórias onde o "certo" depende de critério humano.
