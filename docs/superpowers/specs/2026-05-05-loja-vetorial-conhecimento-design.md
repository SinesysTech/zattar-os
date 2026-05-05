# Loja Vetorial Nativa de Bases de Conhecimento

**Data:** 2026-05-05
**Autor:** brainstorming session com Jordan
**Status:** aprovado, aguardando plano de implementação

## Contexto

O ZattarOS já possui um sistema de embeddings funcional (schema `38_embeddings.sql`,
edge function `indexar-documentos`) que vetoriza entidades do CRM jurídico —
processos, peças, contratos, expedientes. Esse sistema é "vivo": embeddings
nascem da sincronização das entidades de negócio.

O escritório precisa de um **segundo sistema de conhecimento**, paralelo e
independente, que permita curar e consultar **bases documentais estáticas** —
jurisprudências, doutrinas, modelos de petição, sumas, peças de referência.
Esses documentos não pertencem ao CRM; são ativos de conhecimento que advogados
sobem manualmente e consultam tanto via UI dedicada quanto via agentes do
CopilotKit.

A v1 deve permitir:

1. Super admin criar/editar/deletar bases de conhecimento
2. Super admin subir arquivos (TXT, MD, HTML, PDF nativo, DOCX) em uma base
3. Indexação automática assíncrona via edge function
4. Qualquer usuário autenticado fazer busca semântica manual via UI
5. Agentes (CopilotKit) consultarem as bases via duas tools MCP

## Decisões aprovadas

| # | Decisão | Escolha |
|---|---|---|
| 1 | Tabela vetorial | **Separada** (`knowledge_chunks`), não reusa `public.embeddings` |
| 2 | Modelo de embedding | **OpenAI `text-embedding-3-small` (1536d)** |
| 3 | Escopo de permissão | **Bases globais do escritório** — super_admin cria, todos buscam |
| 4 | Formatos aceitos | **TXT, MD, HTML, PDF nativo, DOCX** (sem OCR, sem paste-text na v1) |
| 5 | UI | **Módulo dedicado `/conhecimento`** com lista de bases → detalhe (3 tabs) |
| 6 | Tools MCP | **Duas tools genéricas:** `listar_bases_conhecimento` + `buscar_conhecimento` |

## Arquitetura geral

Subsistema isolado, paralelo ao sistema atual de embeddings de entidades.
**Indexação sob demanda** — disparada diretamente pela Server Action de upload,
sem cron e sem fila polling. A edge function existe apenas para isolar o
trabalho pesado (parsing já feito → chunking + chamadas à OpenAI) do request
HTTP do Next.js, mantendo a UI responsiva.

```
[UI /conhecimento] → [Server Action criarDocumento] → [Storage Bucket conhecimento]
                                                    ↓
                                          INSERT knowledge_documents
                                          (status='pending', texto_extraido)
                                                    ↓
                              supabase.functions.invoke('indexar-conhecimento')
                                          (fire-and-forget, não bloqueia UI)
                                                    ↓
                              [Edge Function indexar-conhecimento]
                              UPDATE status='processing'
                              chunking → OpenAI embed → INSERT knowledge_chunks
                              UPDATE status='indexed' / 'failed'
                                                    ↓
                              [UI faz polling do status via realtime ou refetch]

[Agente CopilotKit] → [MCP tool buscar_conhecimento] → match_knowledge() RPC
                                                            ↓
                                                   knowledge_chunks via HNSW
```

**Por que não cron:** o sistema é alimentado manualmente pelo super_admin
(upload ad-hoc), não por sincronização contínua de entidades. Não há fluxo
de novos documentos "chegando sozinhos". Cron rodando a cada minuto sem ter
o que fazer 99% do tempo seria desperdício.

**Por que manter a edge function (e não fazer tudo inline na Server Action):**
chamadas à OpenAI Embeddings API podem levar 10-60s para um documento de 100
páginas (múltiplos batches sequenciais). Manter esse trabalho fora do request
HTTP do Next.js evita timeout, mantém o response da Server Action instantâneo
("documento criado, indexação iniciada") e libera o usuário pra continuar
trabalhando enquanto a indexação roda em background.

**Fronteiras do módulo:** o subsistema expõe ao resto do ZattarOS apenas
duas interfaces — UI em `/conhecimento` e duas tools MCP. Internamente é
livre pra evoluir (modelo de embedding, chunking, reranking, hybrid search)
sem impactar entidades do CRM.

**Por que tabela vetorial separada (não reusa schema 38):**

- Ciclo de vida diferente: upload manual ad-hoc vs sincronização contínua de entidade.
- O `entity_type` checked no schema 38 não comporta `knowledge_chunk` sem migration disruptiva.
- Permite reindexar bases inteiras com modelo diferente no futuro sem tocar embeddings de processos.
- Permite policies RLS distintas (chunks de conhecimento são lidos só via RPC; chunks de entidades têm regra de acervo).

## Schema de banco — `52_knowledge_bases.sql`

```sql
-- Coleções de conhecimento (jurisprudências, modelos, doutrina)
create table public.knowledge_bases (
  id bigint generated always as identity primary key,
  nome text not null,
  slug text not null unique,                    -- ex: "jurisprudencia-tst"
  descricao text,
  cor text,                                     -- hex pra UI (badges)
  icone text,                                   -- nome de ícone lucide-react
  total_documentos int not null default 0,      -- denormalizado, mantido por trigger
  total_chunks int not null default 0,
  created_by bigint references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documentos uploadados (1 arquivo = 1 documento)
create table public.knowledge_documents (
  id bigint generated always as identity primary key,
  base_id bigint not null references public.knowledge_bases(id) on delete cascade,
  nome text not null,                           -- nome de exibição
  arquivo_path text not null,                   -- path no bucket Storage
  arquivo_tipo text not null check (arquivo_tipo in ('txt','md','html','pdf','docx')),
  arquivo_tamanho_bytes bigint not null,
  texto_extraido text,                          -- texto pós-parsing (cache)
  total_chunks int not null default 0,
  status text not null default 'pending'
    check (status in ('pending','processing','indexed','failed')),
  ultimo_erro text,
  tentativas int not null default 0,
  metadata jsonb default '{}'::jsonb,
  created_by bigint references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  indexed_at timestamptz
);

-- Chunks vetorizados
create table public.knowledge_chunks (
  id bigint generated always as identity primary key,
  document_id bigint not null references public.knowledge_documents(id) on delete cascade,
  base_id bigint not null references public.knowledge_bases(id) on delete cascade,
  posicao int not null,                         -- ordem do chunk no documento
  conteudo text not null,
  embedding vector(1536),                       -- OpenAI text-embedding-3-small
  tokens int,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_knowledge_chunks_vector
  on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);
create index idx_knowledge_chunks_base on public.knowledge_chunks (base_id);
create index idx_knowledge_chunks_doc on public.knowledge_chunks (document_id);
create index idx_knowledge_documents_status on public.knowledge_documents (status)
  where status in ('pending','failed');
create index idx_knowledge_documents_base on public.knowledge_documents (base_id);

-- Trigger para denormalizar contadores em knowledge_bases
create or replace function public.tg_atualizar_contadores_base() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- recalcula total_documentos e total_chunks para a base afetada
  update public.knowledge_bases b set
    total_documentos = (select count(*) from public.knowledge_documents
                        where base_id = b.id and status = 'indexed'),
    total_chunks = (select count(*) from public.knowledge_chunks
                    where base_id = b.id),
    updated_at = now()
  where b.id = coalesce(NEW.base_id, OLD.base_id);
  return coalesce(NEW, OLD);
end; $$;

create trigger tg_documents_contadores
  after insert or update or delete on public.knowledge_documents
  for each row execute function public.tg_atualizar_contadores_base();

create trigger tg_chunks_contadores
  after insert or delete on public.knowledge_chunks
  for each row execute function public.tg_atualizar_contadores_base();
```

**RPC de busca semântica:**

```sql
create or replace function public.match_knowledge (
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 10,
  filter_base_ids bigint[] default null
) returns table (
  chunk_id bigint,
  conteudo text,
  similarity float,
  document_id bigint,
  document_nome text,
  base_id bigint,
  base_nome text,
  posicao int,
  metadata jsonb
)
language plpgsql security definer set search_path = '' as $$
begin
  return query
  select
    c.id as chunk_id,
    c.conteudo,
    1 - (c.embedding <=> query_embedding) as similarity,
    c.document_id,
    d.nome as document_nome,
    c.base_id,
    b.nome as base_nome,
    c.posicao,
    c.metadata
  from public.knowledge_chunks c
  join public.knowledge_documents d on d.id = c.document_id
  join public.knowledge_bases b on b.id = c.base_id
  where
    1 - (c.embedding <=> query_embedding) > match_threshold
    and (filter_base_ids is null or c.base_id = any(filter_base_ids))
    and d.status = 'indexed'
  order by c.embedding <=> query_embedding
  limit match_count;
end; $$;
```

## RLS, permissões, Storage

**Policies em `knowledge_bases` e `knowledge_documents`:**

```sql
alter table public.knowledge_bases enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;

-- Service role full access (edge function indexa via service role)
create policy "service_role full - knowledge_bases" on public.knowledge_bases
  for all to service_role using (true) with check (true);
create policy "service_role full - knowledge_documents" on public.knowledge_documents
  for all to service_role using (true) with check (true);
create policy "service_role full - knowledge_chunks" on public.knowledge_chunks
  for all to service_role using (true) with check (true);

-- Leitura: qualquer autenticado em bases e documents
create policy "authenticated read - knowledge_bases" on public.knowledge_bases
  for select to authenticated using (true);
create policy "authenticated read - knowledge_documents" on public.knowledge_documents
  for select to authenticated using (true);

-- Escrita: apenas super_admin
create policy "super_admin write - knowledge_bases" on public.knowledge_bases
  for all to authenticated
  using (exists (select 1 from public.usuarios where auth_user_id = (select auth.uid()) and is_super_admin = true))
  with check (exists (select 1 from public.usuarios where auth_user_id = (select auth.uid()) and is_super_admin = true));
create policy "super_admin write - knowledge_documents" on public.knowledge_documents
  for all to authenticated
  using (exists (select 1 from public.usuarios where auth_user_id = (select auth.uid()) and is_super_admin = true))
  with check (exists (select 1 from public.usuarios where auth_user_id = (select auth.uid()) and is_super_admin = true));

-- knowledge_chunks: SEM policy de SELECT direto. Apenas via RPC match_knowledge (security definer).
```

O `exists`-subselect com `auth_user_id = (select auth.uid())` joinedo com `is_super_admin = true`
é o pattern canônico do projeto (ver `08_usuarios.sql` e `40_mcp_audit.sql`) e passa no
`npm run lint:rls`. **Importante:** `usuarios.id` é `bigint` mas `auth.uid()` retorna
`uuid` — sempre joinar via `auth_user_id`, nunca tentar cast `auth.uid()::bigint`.

**Storage bucket `conhecimento`:**

- Privado (sem URL pública)
- Path: `{base_slug}/{document_id}-{slug-do-nome}.{ext}`
- Acesso UI: signed URLs temporárias geradas via Server Action quando o usuário pede "abrir documento original"
- Tamanho máximo por arquivo: **50 MB** (bloqueio na Server Action de upload)

## Pipeline de upload e indexação

**Onde o texto é extraído:** Server Action no Next.js (Node runtime), **não**
na Edge Function. Razões: `mammoth.js` (DOCX) e `unpdf` (PDF) rodam
confortavelmente em Node mas têm fricção em Deno; centralizar parsing no
Next.js mantém a Edge Function pura (chunking + embedding + insert).

**Fluxo de upload + indexação sob demanda:**

```
[Cliente UI] file picker → upload-documento-dialog
    ↓
[Server Action criarDocumentoConhecimento]
  1. Valida tipo (txt|md|html|pdf|docx) e tamanho (≤50MB)
  2. Extrai texto:
       - txt/md: leitura direta UTF-8
       - html: parser via cheerio (texto sem tags)
       - pdf: unpdf (fallback se falhar: status='failed' com erro descritivo)
       - docx: mammoth.js (texto puro, ignora estilos)
  3. Upload do arquivo original ao bucket 'conhecimento'
  4. INSERT knowledge_documents (status='pending', texto_extraido=...)
  5. Dispara edge function: supabase.functions.invoke('indexar-conhecimento',
       { body: { document_id } }) — fire-and-forget, sem await do término
  6. Retorna documento criado (UI mostra "Indexando..." com loader)
```

**Fluxo da edge function `indexar-conhecimento`:**

```
[Edge Function recebe POST com { document_id }]
  Auth: header Authorization com service_role key (Server Action passa via env)
       ou alternativamente verify_jwt habilitado e Server Action repassa session

  SELECT * FROM knowledge_documents WHERE id = document_id AND status = 'pending'
  Se não encontrar: retorna 404 (document_id inválido ou já processado)

  - UPDATE status='processing'
  - Chunkar texto_extraido (utilitário em src/lib/conhecimento/chunking.ts)
      - target ~1000 tokens, overlap ~200
      - separadores semânticos: ['\n\n', '\n', '. ', ' ']
      - contagem de tokens: tiktoken se disponível em Deno; fallback aceitável é heurística `chars / 4`
  - Batch embed via OpenAI (max 100 inputs/request)
  - INSERT knowledge_chunks (todos do documento numa transação)
  - UPDATE knowledge_documents (status='indexed', total_chunks=N, indexed_at=now())
  - Trigger atualiza knowledge_bases.total_documentos / total_chunks

  Em erro:
    - UPDATE tentativas = tentativas + 1, ultimo_erro = msg, status = 'failed'
    - Retorna 500 (Server Action já não está aguardando)
```

**Atualização da UI durante indexação:** após o INSERT, a UI mostra o documento
com status `pending`/`processing`. Refresh da lista (manual via botão ou
automático via Supabase Realtime subscription em `knowledge_documents` filtrando
pelo `base_id`) atualiza o status quando a edge function termina. Realtime
é a opção mais ergonômica e o projeto já usa esse pattern em outros módulos.

**Reindexação manual:** botão "Reindexar" no detalhe do documento (super_admin
only) → Server Action que:
1. `DELETE FROM knowledge_chunks WHERE document_id=X`
2. `UPDATE knowledge_documents SET status='pending', tentativas=0, ultimo_erro=NULL`
3. Dispara `supabase.functions.invoke('indexar-conhecimento', { body: { document_id }})`

**Por que `tentativas` continua no schema:** mesmo sem cron de retry automático,
o contador serve para o caso "edge function falhou, super_admin reindexou
manualmente, falhou de novo". Após N tentativas falhas o sistema pode marcar
o documento como problemático e exigir intervenção (re-upload do arquivo,
investigar formato).

## UI — Rotas e componentes

```
/conhecimento                          → Lista de bases (cards/tabela)
/conhecimento/[slug]                   → Detalhe da base (3 tabs via query param)
   ├─ ?tab=documentos (default)        → Lista, upload, deletar
   ├─ ?tab=buscar                      → Textarea de query + lista de chunks
   └─ ?tab=configuracoes               → Renomear, deletar base, reindexar tudo
```

**Componentes (colocation em `src/app/(authenticated)/conhecimento/`):**

- `conhecimento-client.tsx` — lista de bases, padrão `audiencias-client.tsx`
- `nova-base-dialog.tsx` — `glass-dialog`, formulário (nome, descrição, cor, ícone)
- `[slug]/page.tsx` + `[slug]/conhecimento-detalhe-client.tsx` — tabs
- `[slug]/components/upload-documento-dialog.tsx` — file picker + dropzone
- `[slug]/components/documentos-list.tsx` — tabela: nome, tipo, status badge, tamanho, data, ações (reindexar, deletar)
- `[slug]/components/buscar-tab.tsx` — textarea + slider threshold (default 0.7) + slider limit (default 8) + lista de resultados
- `[slug]/components/resultado-chunk-card.tsx` — card de resultado: snippet, base, doc, score, "abrir documento original"
- `[slug]/components/configuracoes-tab.tsx`

**Server Actions em `src/app/(authenticated)/conhecimento/[slug]/actions/`:**

- `criar-base.action.ts`, `atualizar-base.action.ts`, `deletar-base.action.ts`
- `criar-documento.action.ts` (extração + insert), `deletar-documento.action.ts`
- `reindexar-documento.action.ts`, `reindexar-base.action.ts`
- `buscar-conhecimento.action.ts` (embed query + RPC `match_knowledge`)
- `gerar-signed-url.action.ts` (URL temporária para abrir documento original)

**Padrão visual obrigatório (canônico do projeto):**

- Header: `Button size="sm" className="rounded-xl"` + `<Plus className="size-3.5" />`, conforme `audiencias-client.tsx:231`
- Todos os formulários em `glass-dialog` (sem `Sheet`)
- `Heading` + `Text` (sem `font-mono`)
- Cores e ícones de bases via tokens do design system

## Tools MCP

**Localização:** `src/lib/mcp/tools/conhecimento.ts`. Registradas no
`registerAllTools` do registry, expostas automaticamente ao CopilotKit pelo
`mcp-bridge.ts` existente.

```typescript
// listar_bases_conhecimento
{
  name: 'listar_bases_conhecimento',
  description: 'Lista todas as bases de conhecimento disponíveis no escritório (jurisprudências, doutrina, modelos de petição). Use quando o usuário pedir contexto jurídico, jurisprudência, modelo de peça ou doutrina.',
  schema: z.object({}),
  execute: async (_args, ctx) => {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('knowledge_bases')
      .select('id, nome, slug, descricao, total_documentos, total_chunks')
      .order('nome');
    return { bases: data ?? [] };
  }
}

// buscar_conhecimento
{
  name: 'buscar_conhecimento',
  description: 'Busca semântica nas bases de conhecimento do escritório. Retorna chunks relevantes com fonte (base e documento). Use quando precisar de jurisprudência, doutrina, modelo de petição ou referência jurídica.',
  schema: z.object({
    query: z.string().min(3).describe('Pergunta ou trecho a buscar semanticamente'),
    base_ids: z.array(z.number()).optional().describe('IDs das bases a filtrar; vazio = busca em todas'),
    limit: z.number().min(1).max(20).default(8).describe('Quantidade máxima de resultados'),
    threshold: z.number().min(0).max(1).default(0.7).describe('Similaridade mínima (0-1)')
  }),
  execute: async ({ query, base_ids, limit, threshold }) => {
    const openai = getOpenAIClient();
    const { data: [{ embedding }] } = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query
    });
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      filter_base_ids: base_ids ?? null,
      match_count: limit,
      match_threshold: threshold
    });
    if (error) throw error;
    return { resultados: data ?? [] };
  }
}
```

**Permission map (`src/lib/mcp/permission-map.ts`):**

- `listar_bases_conhecimento` → role `authenticated`
- `buscar_conhecimento` → role `authenticated`
- **Sem tools destrutivas na v1** (criar/deletar base é UI-only)

**Auditoria:** automática via `mcp_audit` (schema `40_mcp_audit.sql`).

**Integração CopilotKit:** zero código adicional. O `mcp-bridge.ts`
(`getMcpToolsAsDefinitions`) converte automaticamente toda tool MCP em
`ToolDefinition` para o BuiltInAgent v2.

## Testes

**Unit:**

- `src/lib/conhecimento/chunking.test.ts` — separadores, overlap, edge cases (doc curto, doc gigante, doc sem quebras de linha)
- `src/lib/conhecimento/extracao-texto.test.ts` — mocks de mammoth, unpdf, cheerio; cobertura de cada formato e cenários de falha

**Integration:**

- `src/app/(authenticated)/conhecimento/__tests__/actions/criar-base.test.ts`
- `src/app/(authenticated)/conhecimento/__tests__/actions/criar-documento.test.ts` (com Supabase real)
- `src/app/(authenticated)/conhecimento/__tests__/actions/buscar-conhecimento.test.ts`

**Edge Function:**

- Teste manual via `supabase functions invoke indexar-conhecimento` com documento de teste fixo
- Snapshot dos chunks gerados (regressão)

**MCP tools:**

- `src/lib/mcp/tools/__tests__/conhecimento.test.ts` — schema válido, execução com Supabase mockado

## Observabilidade

- Logs estruturados na edge function (padrão do `indexar-documentos`)
- Header da rota `/conhecimento` mostra badge "X pendentes / Y falharam" se houver
- Tab "Configurações" mostra timestamps de última indexação por documento

## Fora de escopo da v1

Decisões já tomadas; cada item abaixo é potencial v2+:

- ❌ OCR de PDF escaneado
- ❌ Bases privadas por usuário ou por cargo
- ❌ Hierarquia / sub-coleções dentro de bases
- ❌ Tools MCP destrutivas (criar/deletar base via agente)
- ❌ Síntese LLM na busca manual (busca = recuperação pura)
- ❌ Reranking com cross-encoder
- ❌ Hybrid search (BM25 + vetorial)
- ❌ Versionamento de documentos
- ❌ Migração para Gemini Embedding ou EmbeddingGemma
- ❌ Command palette ⌘K cross-bases (evolução natural pós-v1)
- ❌ Streaming de upload em larga escala (drag-and-drop de 100 arquivos)

## Riscos identificados

1. **Limite de TPM da OpenAI** — tier 1 = 1M tokens/min. Se super_admin subir 50 PDFs grandes simultaneamente, várias edge functions são disparadas em paralelo e podem competir pelo limite. **Mitigação:** dentro da edge function, batch interno limitado a 100 inputs/request com pequeno delay entre batches; documento que receber `429 rate_limit` é marcado `failed` com erro descritivo, super_admin reindexa manualmente depois de alguns minutos.

2. **`unpdf` em PDFs malformados** — alguns PDFs do PJE têm encoding estranho. **Mitigação:** try/catch com `status='failed'` + erro descritivo; super_admin vê na UI e reindexa após corrigir manualmente (re-upload do arquivo limpo).

3. **`mammoth.js` em DOCX com macros/objetos OLE** — pode ignorar conteúdo embutido. **Mitigação:** aceitável na v1 (texto puro é suficiente para conhecimento jurídico); documentar limitação.

4. **Crescimento de `knowledge_chunks`** — HNSW escala bem até ~10M vetores. Acima disso, considerar particionamento por `base_id`. Sem urgência (estimativa: 1M páginas → ~5M chunks → ainda dentro do confortável).

5. **Custo de re-embedding em migração futura** — trocar para Gemini exige re-embeddar tudo (~$0.02/M tokens × volume com OpenAI; comparável com Gemini). Aceitável mas vale lembrar.

6. **Carga do trigger de denormalização** — `total_documentos` e `total_chunks` recalculados a cada INSERT de chunk pode ser caro em batch grande. **Mitigação:** trigger é `after`, não bloqueia; se virar gargalo, mover para job periódico.

7. **Edge function "fire-and-forget" sem feedback síncrono** — se o invoke falhar antes da edge function começar (rede, edge offline), o documento fica eternamente em `status='pending'`. **Mitigação:** Server Action faz `invoke` com timeout curto (5s) só para confirmar que a função foi aceita; se falhar nesse handshake, marca `status='failed'` com erro "edge function unreachable"; UI mostra como falha e oferece botão de retry.

## Sequência de implementação sugerida

(Detalhes vão para o plano de implementação que será gerado pelo `writing-plans`.)

1. Schema declarativo + migration (`52_knowledge_bases.sql`, RLS, RPC, trigger)
2. Bucket Storage `conhecimento` + policies
3. Utilitários: chunking, extração de texto (com testes unit)
4. Server Actions de CRUD de bases e documentos
5. Edge Function `indexar-conhecimento` (chunking + embedding + insert)
6. UI: lista de bases, dialog de criação
7. UI: detalhe com tabs (documentos, buscar, configurações)
8. Tools MCP + permission map + testes
9. Validação manual end-to-end
10. Validação de lint, type-check, build, RLS lint

## Referências do código existente

- Schema atual de embeddings: [supabase/schemas/38_embeddings.sql](../../../supabase/schemas/38_embeddings.sql)
- Edge function existente como pattern: [supabase/functions/indexar-documentos/index.ts](../../../supabase/functions/indexar-documentos/index.ts)
- MCP bridge → CopilotKit: [src/lib/copilotkit/mcp-bridge.ts](../../../src/lib/copilotkit/mcp-bridge.ts)
- Schema de auditoria MCP: [supabase/schemas/40_mcp_audit.sql](../../../supabase/schemas/40_mcp_audit.sql)
- Padrão canônico de header de módulo: [src/app/(authenticated)/audiencias/audiencias-client.tsx](../../../src/app/\(authenticated\)/audiencias/audiencias-client.tsx)
- Service de Supabase Storage: [src/lib/storage/supabase-storage.service.ts](../../../src/lib/storage/supabase-storage.service.ts)
