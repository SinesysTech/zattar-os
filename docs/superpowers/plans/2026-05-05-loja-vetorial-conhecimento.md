# Loja Vetorial de Bases de Conhecimento — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um módulo `/conhecimento` no ZattarOS que permite super_admin curar bases de conhecimento (jurisprudências, doutrina, modelos de petição) via upload de arquivos, com indexação vetorial automática e busca semântica disponível tanto pela UI quanto por agentes CopilotKit/MCP.

**Architecture:** Subsistema isolado com tabela vetorial dedicada (`knowledge_chunks` com HNSW), pipeline sob demanda (Server Action extrai texto e dispara Edge Function fire-and-forget que faz chunking + embedding + insert), UI dedicada com 3 tabs (documentos, buscar, configurações), e duas tools MCP genéricas (`listar_bases_conhecimento` + `buscar_conhecimento`) registradas via `registerMcpTool` para consumo automático pelo CopilotKit via `mcp-bridge.ts`.

**Tech Stack:**
- Postgres 17 + pgvector (HNSW, vector_cosine_ops)
- Supabase: Storage (bucket privado), Edge Functions (Deno), Realtime
- Next.js 16 (App Router, Server Actions, Server Components)
- TypeScript strict, Zod, React Query
- OpenAI `text-embedding-3-small` (1536d) — reusa `src/lib/ai/embedding.ts`
- `pdf-parse` (já instalado) + `mammoth` (a adicionar)
- Jest (unit + integration), Playwright (e2e)
- CopilotKit v2 + MCP bridge existente

**Spec:** [docs/superpowers/specs/2026-05-05-loja-vetorial-conhecimento-design.md](../specs/2026-05-05-loja-vetorial-conhecimento-design.md)

---

## File Structure

### Banco (Supabase)

```
supabase/schemas/52_knowledge_bases.sql                 ← schema declarativo (tabelas, RLS, RPC, trigger)
supabase/migrations/<timestamp>_create_knowledge_bases.sql  ← migration aplicável
supabase/functions/indexar-conhecimento/index.ts        ← Edge Function: chunking + embed + insert
```

### Domain layer (compartilhado server/client)

```
src/lib/conhecimento/
  ├─ chunking.ts                  ← divide texto em chunks com overlap
  ├─ chunking.test.ts             ← unit tests
  ├─ extracao-texto.ts            ← parsers por formato (txt|md|html|pdf|docx)
  ├─ extracao-texto.test.ts       ← unit tests
  └─ index.ts                     ← exports públicos
```

### Módulo Next.js

```
src/app/(authenticated)/conhecimento/
  ├─ layout.tsx
  ├─ page.tsx                              ← server component, fetch lista de bases
  ├─ index.ts                              ← barrel exports
  ├─ domain.ts                             ← types + Zod schemas
  ├─ repository.ts                         ← acesso a knowledge_bases/documents/chunks
  ├─ service.ts                            ← lógica de negócio
  ├─ queries.ts                            ← React Query hooks
  ├─ conhecimento-client.tsx               ← lista de bases (Client Component)
  ├─ actions/
  │   ├─ criar-base.action.ts
  │   ├─ atualizar-base.action.ts
  │   ├─ deletar-base.action.ts
  │   ├─ criar-documento.action.ts         ← extrai texto + dispara edge function
  │   ├─ deletar-documento.action.ts
  │   ├─ reindexar-documento.action.ts
  │   ├─ buscar-conhecimento.action.ts     ← embed query + RPC match_knowledge
  │   └─ gerar-signed-url.action.ts
  ├─ components/
  │   └─ nova-base-dialog.tsx
  ├─ [slug]/
  │   ├─ page.tsx
  │   ├─ conhecimento-detalhe-client.tsx   ← roteador de tabs
  │   └─ components/
  │       ├─ documentos-tab.tsx
  │       ├─ documentos-list.tsx
  │       ├─ upload-documento-dialog.tsx
  │       ├─ buscar-tab.tsx
  │       ├─ resultado-chunk-card.tsx
  │       └─ configuracoes-tab.tsx
  └─ __tests__/
      ├─ unit/
      │   ├─ domain.test.ts
      │   └─ service.test.ts
      ├─ actions/
      │   ├─ criar-base.test.ts
      │   ├─ criar-documento.test.ts
      │   └─ buscar-conhecimento.test.ts
      ├─ components/
      │   └─ documentos-list.test.tsx
      └─ e2e/
          └─ conhecimento-flow.spec.ts
```

### MCP

```
src/lib/mcp/registries/conhecimento-tools.ts      ← registra listar_bases_conhecimento + buscar_conhecimento
src/lib/mcp/permission-map.ts                     ← MODIFY: mapear novas tools
src/lib/mcp/registry.ts                           ← MODIFY: importar registerConhecimentoTools
src/lib/mcp/registries/index.ts                   ← MODIFY: re-exportar
src/lib/mcp/registries/__tests__/conhecimento-tools.test.ts
```

---

## Phase 1 — Database foundation

### Task 1: Schema declarativo + migration de knowledge_bases

**Files:**
- Create: `supabase/schemas/52_knowledge_bases.sql`
- Create: `supabase/migrations/20260505120000_create_knowledge_bases.sql`

**Context for the engineer:** O ZattarOS tem schemas declarativos em `supabase/schemas/` (snapshot do estado desejado) e migrations aplicáveis em `supabase/migrations/`. Para uma feature nova, você cria AMBOS — o schema declarativo é a fonte da verdade pra lint/code review, a migration é o que roda no banco. Não precisa rodar a migration agora; será aplicada na Fase final via `supabase db push` ou MCP.

- [ ] **Step 1.1: Criar schema declarativo**

Criar `supabase/schemas/52_knowledge_bases.sql`:

```sql
-- ============================================================================
-- Tabelas: knowledge_bases / knowledge_documents / knowledge_chunks
-- Loja vetorial de bases de conhecimento (jurisprudências, doutrina, modelos)
-- Subsistema independente do schema 38_embeddings.sql
-- ============================================================================

-- pgvector já habilitado pelo schema 38
create extension if not exists vector;

-- Coleções de conhecimento
create table if not exists public.knowledge_bases (
  id bigint generated always as identity primary key,
  nome text not null,
  slug text not null unique,
  descricao text,
  cor text,
  icone text,
  total_documentos int not null default 0,
  total_chunks int not null default 0,
  created_by bigint references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documentos (1 arquivo = 1 documento)
create table if not exists public.knowledge_documents (
  id bigint generated always as identity primary key,
  base_id bigint not null references public.knowledge_bases(id) on delete cascade,
  nome text not null,
  arquivo_path text not null,
  arquivo_tipo text not null check (arquivo_tipo in ('txt','md','html','pdf','docx')),
  arquivo_tamanho_bytes bigint not null,
  texto_extraido text,
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
create table if not exists public.knowledge_chunks (
  id bigint generated always as identity primary key,
  document_id bigint not null references public.knowledge_documents(id) on delete cascade,
  base_id bigint not null references public.knowledge_bases(id) on delete cascade,
  posicao int not null,
  conteudo text not null,
  embedding vector(1536),
  tokens int,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Índices
create index if not exists idx_knowledge_chunks_vector
  on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists idx_knowledge_chunks_base
  on public.knowledge_chunks (base_id);
create index if not exists idx_knowledge_chunks_doc
  on public.knowledge_chunks (document_id);
create index if not exists idx_knowledge_documents_status
  on public.knowledge_documents (status)
  where status in ('pending','failed');
create index if not exists idx_knowledge_documents_base
  on public.knowledge_documents (base_id);

-- Trigger: atualizar contadores denormalizados em knowledge_bases
create or replace function public.tg_atualizar_contadores_base() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_base_id bigint;
begin
  v_base_id := coalesce(NEW.base_id, OLD.base_id);
  update public.knowledge_bases b set
    total_documentos = (
      select count(*) from public.knowledge_documents
      where base_id = b.id and status = 'indexed'
    ),
    total_chunks = (
      select count(*) from public.knowledge_chunks
      where base_id = b.id
    ),
    updated_at = now()
  where b.id = v_base_id;
  return coalesce(NEW, OLD);
end; $$;

drop trigger if exists tg_documents_contadores on public.knowledge_documents;
create trigger tg_documents_contadores
  after insert or update or delete on public.knowledge_documents
  for each row execute function public.tg_atualizar_contadores_base();

drop trigger if exists tg_chunks_contadores on public.knowledge_chunks;
create trigger tg_chunks_contadores
  after insert or delete on public.knowledge_chunks
  for each row execute function public.tg_atualizar_contadores_base();

-- RLS
alter table public.knowledge_bases enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;

-- service_role: full
create policy "service_role full - knowledge_bases" on public.knowledge_bases
  for all to service_role using (true) with check (true);
create policy "service_role full - knowledge_documents" on public.knowledge_documents
  for all to service_role using (true) with check (true);
create policy "service_role full - knowledge_chunks" on public.knowledge_chunks
  for all to service_role using (true) with check (true);

-- authenticated read em bases e documents
create policy "authenticated read - knowledge_bases" on public.knowledge_bases
  for select to authenticated using (true);
create policy "authenticated read - knowledge_documents" on public.knowledge_documents
  for select to authenticated using (true);

-- super_admin write em bases e documents
create policy "super_admin write - knowledge_bases" on public.knowledge_bases
  for all to authenticated
  using ((select is_super_admin from public.usuarios where id = auth.uid()::bigint))
  with check ((select is_super_admin from public.usuarios where id = auth.uid()::bigint));
create policy "super_admin write - knowledge_documents" on public.knowledge_documents
  for all to authenticated
  using ((select is_super_admin from public.usuarios where id = auth.uid()::bigint))
  with check ((select is_super_admin from public.usuarios where id = auth.uid()::bigint));

-- knowledge_chunks: SEM policy de SELECT direto. Acesso só via RPC match_knowledge (security definer).

-- RPC de busca semântica
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

grant execute on function public.match_knowledge to authenticated;
grant execute on function public.match_knowledge to service_role;

comment on table public.knowledge_bases is 'Coleções de conhecimento curadas (jurisprudência, doutrina, modelos)';
comment on table public.knowledge_documents is 'Arquivos uploadados em bases de conhecimento';
comment on table public.knowledge_chunks is 'Chunks vetorizados de documentos de conhecimento';
comment on function public.match_knowledge is 'Busca semântica nas bases de conhecimento via similaridade de cosseno';
```

- [ ] **Step 1.2: Criar migration aplicável (cópia exata do schema)**

Copiar o conteúdo do schema declarativo para `supabase/migrations/20260505120000_create_knowledge_bases.sql`. Pode ser literalmente o mesmo arquivo (sem o header de comentário). Esta migration é o que será aplicada via `supabase db push`.

- [ ] **Step 1.3: Validar lint RLS local**

Run: `npm run lint:rls`

Expected: PASS. O subselect `(select is_super_admin from public.usuarios where id = auth.uid()::bigint)` é o pattern aceito pelo lint do projeto.

- [ ] **Step 1.4: Commit**

```bash
git status --short
git add supabase/schemas/52_knowledge_bases.sql supabase/migrations/20260505120000_create_knowledge_bases.sql
git commit -m "feat(conhecimento): schema knowledge_bases/documents/chunks + RPC match_knowledge"
```

---

### Task 2: Storage bucket `conhecimento` + policies

**Files:**
- Create: `supabase/migrations/20260505120100_create_conhecimento_bucket.sql`

**Context:** Buckets do Supabase Storage são criados via SQL na schema `storage`. O bucket é privado (sem URL pública); UI vai usar signed URLs via Server Action.

- [ ] **Step 2.1: Criar migration do bucket**

Criar `supabase/migrations/20260505120100_create_conhecimento_bucket.sql`:

```sql
-- Bucket privado para arquivos de bases de conhecimento
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'conhecimento',
  'conhecimento',
  false,
  52428800,  -- 50 MB
  array[
    'text/plain',
    'text/markdown',
    'text/html',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

-- Policies: apenas service_role lê/escreve. UI gera signed URLs via Server Action.
create policy "service_role full - conhecimento bucket"
  on storage.objects for all
  to service_role
  using (bucket_id = 'conhecimento')
  with check (bucket_id = 'conhecimento');
```

- [ ] **Step 2.2: Commit**

```bash
git add supabase/migrations/20260505120100_create_conhecimento_bucket.sql
git commit -m "feat(conhecimento): cria bucket Storage 'conhecimento' (privado, 50MB)"
```

---

## Phase 2 — Utilitários (chunking + extração)

### Task 3: Adicionar dependência mammoth

**Files:**
- Modify: `package.json`

- [ ] **Step 3.1: Instalar mammoth**

Run: `npm install mammoth@^1.8.0`

Expected: package.json atualizado, lockfile coerente.

- [ ] **Step 3.2: Confirmar `pdf-parse` e `mammoth` em dependencies**

Run: `grep -E '"(mammoth|pdf-parse)"' package.json`

Expected:
```
    "mammoth": "^1.8.0",
    "pdf-parse": "^2.4.5",
```

- [ ] **Step 3.3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: adiciona dependência mammoth para extração de DOCX"
```

---

### Task 4: Utilitário de chunking (TDD)

**Files:**
- Create: `src/lib/conhecimento/chunking.ts`
- Create: `src/lib/conhecimento/chunking.test.ts`

**Context:** Chunking divide texto em pedaços que cabem no contexto do modelo de embedding (max ~8K tokens, mas alvo prático ~1K para evitar diluição semântica). Overlap entre chunks adjacentes preserva contexto cross-boundary. Estratégia: dividir por separadores semânticos (parágrafo > linha > frase > palavra) priorizando os maiores antes de quebrar arbitrariamente.

- [ ] **Step 4.1: Escrever testes (RED)**

Criar `src/lib/conhecimento/chunking.test.ts`:

```typescript
import { chunkText, type ChunkOptions } from './chunking';

describe('chunkText', () => {
  it('retorna um único chunk se o texto cabe inteiro', () => {
    const text = 'Texto curto.';
    const result = chunkText(text, { targetTokens: 100, overlapTokens: 20 });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      conteudo: 'Texto curto.',
      posicao: 0,
      tokens: expect.any(Number),
    });
  });

  it('divide texto longo em múltiplos chunks com overlap', () => {
    const paragraphs = Array.from({ length: 30 }, (_, i) =>
      `Parágrafo número ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`
    );
    const text = paragraphs.join('\n\n');

    const result = chunkText(text, { targetTokens: 100, overlapTokens: 20 });

    expect(result.length).toBeGreaterThan(1);
    expect(result[0].posicao).toBe(0);
    expect(result[1].posicao).toBe(1);
    // chunks consecutivos devem ter overlap (parte do final de um aparece no começo do próximo)
    const fimDoPrimeiro = result[0].conteudo.slice(-50);
    expect(result[1].conteudo).toContain(fimDoPrimeiro.split('\n').at(-1)?.slice(0, 20) ?? '');
  });

  it('preserva ordem original dos parágrafos', () => {
    const text = ['Alpha.', 'Beta.', 'Gamma.'].join('\n\n').repeat(20);
    const result = chunkText(text, { targetTokens: 50, overlapTokens: 10 });
    const fullJoined = result.map((c) => c.conteudo).join(' ');
    const alphaIndex = fullJoined.indexOf('Alpha');
    const betaIndex = fullJoined.indexOf('Beta');
    const gammaIndex = fullJoined.indexOf('Gamma');
    expect(alphaIndex).toBeLessThan(betaIndex);
    expect(betaIndex).toBeLessThan(gammaIndex);
  });

  it('respeita separadores semânticos (não quebra no meio de palavra)', () => {
    const text = 'A '.repeat(500) + '. ' + 'B '.repeat(500);
    const result = chunkText(text, { targetTokens: 200, overlapTokens: 30 });
    result.forEach((chunk) => {
      // não deve terminar com letra solta (palavra cortada)
      expect(chunk.conteudo).not.toMatch(/\s[A-Za-z]$/);
    });
  });

  it('rejeita texto vazio', () => {
    expect(() => chunkText('', { targetTokens: 100, overlapTokens: 20 }))
      .toThrow('Texto vazio');
  });

  it('rejeita opções inválidas', () => {
    expect(() => chunkText('texto', { targetTokens: 0, overlapTokens: 0 }))
      .toThrow('targetTokens deve ser positivo');
    expect(() => chunkText('texto', { targetTokens: 100, overlapTokens: 100 }))
      .toThrow('overlapTokens deve ser menor que targetTokens');
  });

  it('estima tokens por heurística chars/4 quando tiktoken indisponível', () => {
    const text = 'a'.repeat(400);
    const result = chunkText(text, { targetTokens: 100, overlapTokens: 20 });
    expect(result[0].tokens).toBeGreaterThanOrEqual(90);
    expect(result[0].tokens).toBeLessThanOrEqual(110);
  });
});
```

- [ ] **Step 4.2: Rodar testes para confirmar falha (RED)**

Run: `npm test -- src/lib/conhecimento/chunking.test.ts`

Expected: FAIL com "Cannot find module './chunking'".

- [ ] **Step 4.3: Implementar (GREEN)**

Criar `src/lib/conhecimento/chunking.ts`:

```typescript
export interface ChunkOptions {
  targetTokens: number;
  overlapTokens: number;
}

export interface Chunk {
  conteudo: string;
  posicao: number;
  tokens: number;
}

const SEPARATORS = ['\n\n', '\n', '. ', ' '];

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitBySeparator(text: string, separator: string): string[] {
  if (separator === ' ') return text.split(/\s+/);
  return text.split(separator);
}

function joinUnits(units: string[], separator: string, startIdx: number, targetTokens: number): { content: string; nextIdx: number } {
  let content = '';
  let i = startIdx;
  while (i < units.length) {
    const next = i === startIdx ? units[i] : content + separator + units[i];
    if (estimateTokens(next) > targetTokens && content.length > 0) break;
    content = next;
    i++;
  }
  return { content, nextIdx: i };
}

export function chunkText(text: string, options: ChunkOptions): Chunk[] {
  if (!text || text.trim().length === 0) {
    throw new Error('Texto vazio');
  }
  if (options.targetTokens <= 0) {
    throw new Error('targetTokens deve ser positivo');
  }
  if (options.overlapTokens >= options.targetTokens) {
    throw new Error('overlapTokens deve ser menor que targetTokens');
  }

  if (estimateTokens(text) <= options.targetTokens) {
    return [{ conteudo: text.trim(), posicao: 0, tokens: estimateTokens(text) }];
  }

  // Escolhe o melhor separador: o primeiro que produz pedaços <= targetTokens
  let bestSeparator = ' ';
  for (const sep of SEPARATORS) {
    const units = splitBySeparator(text, sep);
    const allFit = units.every((u) => estimateTokens(u) <= options.targetTokens);
    if (allFit && units.length > 1) {
      bestSeparator = sep;
      break;
    }
  }

  const units = splitBySeparator(text, bestSeparator);
  const chunks: Chunk[] = [];
  let posicao = 0;
  let i = 0;

  while (i < units.length) {
    const { content, nextIdx } = joinUnits(units, bestSeparator, i, options.targetTokens);
    chunks.push({
      conteudo: content.trim(),
      posicao,
      tokens: estimateTokens(content),
    });
    posicao++;

    // Calcular overlap: voltar units suficientes pra cobrir overlapTokens
    if (nextIdx >= units.length) break;
    let overlapAcc = 0;
    let backtrack = nextIdx;
    while (backtrack > i && overlapAcc < options.overlapTokens) {
      backtrack--;
      overlapAcc += estimateTokens(units[backtrack]);
    }
    i = backtrack < nextIdx ? backtrack : nextIdx;
  }

  return chunks;
}
```

- [ ] **Step 4.4: Rodar testes para confirmar sucesso (GREEN)**

Run: `npm test -- src/lib/conhecimento/chunking.test.ts`

Expected: PASS, todos os testes verdes.

- [ ] **Step 4.5: Commit**

```bash
git add src/lib/conhecimento/chunking.ts src/lib/conhecimento/chunking.test.ts
git commit -m "feat(conhecimento): utilitário de chunking com separadores semânticos e overlap"
```

---

### Task 5: Utilitário de extração de texto (TDD)

**Files:**
- Create: `src/lib/conhecimento/extracao-texto.ts`
- Create: `src/lib/conhecimento/extracao-texto.test.ts`
- Create: `src/lib/conhecimento/index.ts`

**Context:** Cada formato exige estratégia diferente. PDF usa `pdf-parse`, DOCX usa `mammoth`, HTML usa regex de strip-tags (decisão consciente: evitar adicionar `cheerio` por causa de tamanho — regex cobre o caso de uso jurídico). TXT/MD são leitura direta UTF-8.

- [ ] **Step 5.1: Escrever testes (RED)**

Criar `src/lib/conhecimento/extracao-texto.test.ts`:

```typescript
import { extrairTexto, type FormatoArquivo } from './extracao-texto';

jest.mock('pdf-parse', () => jest.fn(async (buf: Buffer) => ({
  text: 'Texto extraído do PDF de teste',
  numpages: 1,
})));

jest.mock('mammoth', () => ({
  extractRawText: jest.fn(async () => ({
    value: 'Texto extraído do DOCX de teste',
    messages: [],
  })),
}));

describe('extrairTexto', () => {
  it('extrai texto de TXT (UTF-8)', async () => {
    const buf = Buffer.from('Conteúdo simples em UTF-8 com acentos: ção, são.', 'utf-8');
    const result = await extrairTexto(buf, 'txt');
    expect(result).toContain('Conteúdo simples');
    expect(result).toContain('ção');
  });

  it('extrai texto de MD removendo marcadores básicos opcionalmente', async () => {
    const md = '# Título\n\n**negrito** e *itálico*.';
    const buf = Buffer.from(md, 'utf-8');
    const result = await extrairTexto(buf, 'md');
    // markdown é tratado como texto puro (preserva sintaxe)
    expect(result).toContain('Título');
    expect(result).toContain('negrito');
  });

  it('extrai texto de HTML removendo tags', async () => {
    const html = '<html><body><h1>Título</h1><p>Parágrafo com <strong>negrito</strong>.</p><script>alert(1)</script></body></html>';
    const buf = Buffer.from(html, 'utf-8');
    const result = await extrairTexto(buf, 'html');
    expect(result).toContain('Título');
    expect(result).toContain('Parágrafo com negrito');
    expect(result).not.toContain('<h1>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert(1)');
  });

  it('extrai texto de PDF via pdf-parse', async () => {
    const buf = Buffer.from('fake pdf bytes');
    const result = await extrairTexto(buf, 'pdf');
    expect(result).toBe('Texto extraído do PDF de teste');
  });

  it('extrai texto de DOCX via mammoth', async () => {
    const buf = Buffer.from('fake docx bytes');
    const result = await extrairTexto(buf, 'docx');
    expect(result).toBe('Texto extraído do DOCX de teste');
  });

  it('rejeita formato desconhecido', async () => {
    const buf = Buffer.from('x');
    await expect(extrairTexto(buf, 'xyz' as FormatoArquivo))
      .rejects.toThrow('Formato não suportado: xyz');
  });

  it('lança erro descritivo quando PDF parser falha', async () => {
    const pdfParse = require('pdf-parse');
    pdfParse.mockImplementationOnce(async () => { throw new Error('PDF malformado'); });
    const buf = Buffer.from('bad');
    await expect(extrairTexto(buf, 'pdf'))
      .rejects.toThrow(/PDF malformado/);
  });

  it('rejeita texto vazio extraído', async () => {
    const pdfParse = require('pdf-parse');
    pdfParse.mockImplementationOnce(async () => ({ text: '   ', numpages: 0 }));
    const buf = Buffer.from('empty');
    await expect(extrairTexto(buf, 'pdf'))
      .rejects.toThrow('Texto extraído está vazio');
  });
});
```

- [ ] **Step 5.2: Rodar testes para confirmar falha**

Run: `npm test -- src/lib/conhecimento/extracao-texto.test.ts`

Expected: FAIL com "Cannot find module './extracao-texto'".

- [ ] **Step 5.3: Implementar (GREEN)**

Criar `src/lib/conhecimento/extracao-texto.ts`:

```typescript
export type FormatoArquivo = 'txt' | 'md' | 'html' | 'pdf' | 'docx';

const FORMATOS_VALIDOS: ReadonlyArray<FormatoArquivo> = ['txt', 'md', 'html', 'pdf', 'docx'];

function isFormatoValido(f: string): f is FormatoArquivo {
  return (FORMATOS_VALIDOS as ReadonlyArray<string>).includes(f);
}

function stripHtml(html: string): string {
  // Remove scripts e styles inteiros (incluindo conteúdo)
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // Remove tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  // Decode entidades HTML básicas
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Colapsa whitespace
  return cleaned.replace(/\s+/g, ' ').trim();
}

async function extrairPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    throw new Error(`Falha ao extrair PDF: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function extrairDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (err) {
    throw new Error(`Falha ao extrair DOCX: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function extrairTexto(buffer: Buffer, formato: FormatoArquivo): Promise<string> {
  if (!isFormatoValido(formato)) {
    throw new Error(`Formato não suportado: ${formato}`);
  }

  let texto: string;
  switch (formato) {
    case 'txt':
    case 'md':
      texto = buffer.toString('utf-8');
      break;
    case 'html':
      texto = stripHtml(buffer.toString('utf-8'));
      break;
    case 'pdf':
      texto = await extrairPdf(buffer);
      break;
    case 'docx':
      texto = await extrairDocx(buffer);
      break;
  }

  if (!texto || texto.trim().length === 0) {
    throw new Error('Texto extraído está vazio');
  }

  return texto.trim();
}
```

- [ ] **Step 5.4: Criar barrel export**

Criar `src/lib/conhecimento/index.ts`:

```typescript
export { chunkText, type Chunk, type ChunkOptions } from './chunking';
export { extrairTexto, type FormatoArquivo } from './extracao-texto';
```

- [ ] **Step 5.5: Rodar testes**

Run: `npm test -- src/lib/conhecimento`

Expected: PASS em ambos arquivos de teste.

- [ ] **Step 5.6: Commit**

```bash
git add src/lib/conhecimento/extracao-texto.ts src/lib/conhecimento/extracao-texto.test.ts src/lib/conhecimento/index.ts
git commit -m "feat(conhecimento): utilitário de extração de texto (txt, md, html, pdf, docx)"
```

---

## Phase 3 — Domain layer + Repository

### Task 6: Types e Zod schemas do domínio

**Files:**
- Create: `src/app/(authenticated)/conhecimento/domain.ts`
- Create: `src/app/(authenticated)/conhecimento/__tests__/unit/domain.test.ts`

- [ ] **Step 6.1: Escrever testes (RED)**

Criar `src/app/(authenticated)/conhecimento/__tests__/unit/domain.test.ts`:

```typescript
import {
  KnowledgeBaseSchema,
  KnowledgeDocumentSchema,
  KnowledgeChunkSchema,
  CriarBaseInputSchema,
  CriarDocumentoInputSchema,
  BuscarConhecimentoInputSchema,
  type StatusDocumento,
} from '../../domain';

describe('domain schemas', () => {
  it('KnowledgeBaseSchema valida base completa', () => {
    const valid = {
      id: 1,
      nome: 'Jurisprudência TST',
      slug: 'jurisprudencia-tst',
      descricao: 'Súmulas e OJs do TST',
      cor: '#0EA5E9',
      icone: 'gavel',
      total_documentos: 12,
      total_chunks: 340,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(() => KnowledgeBaseSchema.parse(valid)).not.toThrow();
  });

  it('CriarBaseInputSchema rejeita slug com espaços', () => {
    expect(() => CriarBaseInputSchema.parse({ nome: 'X', slug: 'tem espaco' }))
      .toThrow();
  });

  it('CriarBaseInputSchema aceita slug kebab-case', () => {
    expect(() => CriarBaseInputSchema.parse({ nome: 'X', slug: 'meu-slug' }))
      .not.toThrow();
  });

  it('CriarDocumentoInputSchema rejeita arquivo > 50MB', () => {
    expect(() => CriarDocumentoInputSchema.parse({
      base_id: 1,
      nome: 'doc.pdf',
      arquivo_tipo: 'pdf',
      arquivo_tamanho_bytes: 60 * 1024 * 1024,
    })).toThrow(/50/);
  });

  it('BuscarConhecimentoInputSchema aplica defaults', () => {
    const result = BuscarConhecimentoInputSchema.parse({ query: 'teste' });
    expect(result.limit).toBe(8);
    expect(result.threshold).toBe(0.7);
  });

  it('StatusDocumento aceita apenas valores conhecidos', () => {
    const statuses: StatusDocumento[] = ['pending', 'processing', 'indexed', 'failed'];
    statuses.forEach((s) => {
      expect(() => KnowledgeDocumentSchema.shape.status.parse(s)).not.toThrow();
    });
    expect(() => KnowledgeDocumentSchema.shape.status.parse('unknown')).toThrow();
  });
});
```

- [ ] **Step 6.2: Rodar testes para confirmar falha**

Run: `npm test -- src/app/\(authenticated\)/conhecimento/__tests__/unit/domain.test.ts`

Expected: FAIL com módulo não encontrado.

- [ ] **Step 6.3: Implementar (GREEN)**

Criar `src/app/(authenticated)/conhecimento/domain.ts`:

```typescript
import { z } from 'zod';

export const FORMATOS_ARQUIVO = ['txt', 'md', 'html', 'pdf', 'docx'] as const;
export type FormatoArquivo = (typeof FORMATOS_ARQUIVO)[number];

export const STATUS_DOCUMENTO = ['pending', 'processing', 'indexed', 'failed'] as const;
export type StatusDocumento = (typeof STATUS_DOCUMENTO)[number];

export const TAMANHO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const KnowledgeBaseSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().min(1).max(200),
  slug: z.string().regex(SLUG_REGEX),
  descricao: z.string().nullable().optional(),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  icone: z.string().max(64).nullable().optional(),
  total_documentos: z.number().int().nonnegative(),
  total_chunks: z.number().int().nonnegative(),
  created_by: z.number().int().positive().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;

export const KnowledgeDocumentSchema = z.object({
  id: z.number().int().positive(),
  base_id: z.number().int().positive(),
  nome: z.string().min(1).max(255),
  arquivo_path: z.string().min(1),
  arquivo_tipo: z.enum(FORMATOS_ARQUIVO),
  arquivo_tamanho_bytes: z.number().int().positive(),
  texto_extraido: z.string().nullable().optional(),
  total_chunks: z.number().int().nonnegative(),
  status: z.enum(STATUS_DOCUMENTO),
  ultimo_erro: z.string().nullable().optional(),
  tentativas: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_by: z.number().int().positive().nullable(),
  created_at: z.string(),
  indexed_at: z.string().nullable().optional(),
});
export type KnowledgeDocument = z.infer<typeof KnowledgeDocumentSchema>;

export const KnowledgeChunkSchema = z.object({
  chunk_id: z.number().int().positive(),
  conteudo: z.string(),
  similarity: z.number().min(0).max(1),
  document_id: z.number().int().positive(),
  document_nome: z.string(),
  base_id: z.number().int().positive(),
  base_nome: z.string(),
  posicao: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type KnowledgeChunk = z.infer<typeof KnowledgeChunkSchema>;

export const CriarBaseInputSchema = z.object({
  nome: z.string().min(1).max(200),
  slug: z.string().regex(SLUG_REGEX, 'slug deve ser kebab-case (ex: jurisprudencia-tst)'),
  descricao: z.string().max(1000).optional(),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icone: z.string().max(64).optional(),
});
export type CriarBaseInput = z.infer<typeof CriarBaseInputSchema>;

export const AtualizarBaseInputSchema = CriarBaseInputSchema.partial().extend({
  id: z.number().int().positive(),
});
export type AtualizarBaseInput = z.infer<typeof AtualizarBaseInputSchema>;

export const CriarDocumentoInputSchema = z.object({
  base_id: z.number().int().positive(),
  nome: z.string().min(1).max(255),
  arquivo_tipo: z.enum(FORMATOS_ARQUIVO),
  arquivo_tamanho_bytes: z.number().int().positive().max(
    TAMANHO_MAX_BYTES,
    `Arquivo excede o limite de 50 MB`,
  ),
});
export type CriarDocumentoInput = z.infer<typeof CriarDocumentoInputSchema>;

export const BuscarConhecimentoInputSchema = z.object({
  query: z.string().min(3).max(2000),
  base_ids: z.array(z.number().int().positive()).optional(),
  limit: z.number().int().min(1).max(20).default(8),
  threshold: z.number().min(0).max(1).default(0.7),
});
export type BuscarConhecimentoInput = z.infer<typeof BuscarConhecimentoInputSchema>;
```

- [ ] **Step 6.4: Rodar testes (GREEN)**

Run: `npm test -- src/app/\(authenticated\)/conhecimento/__tests__/unit/domain.test.ts`

Expected: PASS.

- [ ] **Step 6.5: Commit**

```bash
git add src/app/\(authenticated\)/conhecimento/domain.ts src/app/\(authenticated\)/conhecimento/__tests__/unit/domain.test.ts
git commit -m "feat(conhecimento): tipos de domínio e schemas Zod"
```

---

### Task 7: Repository (acesso ao banco)

**Files:**
- Create: `src/app/(authenticated)/conhecimento/repository.ts`

**Context:** O padrão de repository do projeto encapsula chamadas Supabase e converte para tipos de domínio. Sempre via `createServerClient()` (respeita RLS) ou `createServiceClient()` (bypass — usado só onde necessário, ex: leitura de signed URL).

- [ ] **Step 7.1: Implementar repository**

Criar `src/app/(authenticated)/conhecimento/repository.ts`:

```typescript
import { createServerClient } from '@/lib/supabase/server-client';
import { createServiceClient } from '@/lib/supabase/service-client';
import type {
  KnowledgeBase,
  KnowledgeDocument,
  KnowledgeChunk,
  CriarBaseInput,
  AtualizarBaseInput,
} from './domain';

export async function listarBases(): Promise<KnowledgeBase[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('knowledge_bases')
    .select('*')
    .order('nome');
  if (error) throw error;
  return data ?? [];
}

export async function buscarBasePorSlug(slug: string): Promise<KnowledgeBase | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('knowledge_bases')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function inserirBase(input: CriarBaseInput, userId: number): Promise<KnowledgeBase> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('knowledge_bases')
    .insert({ ...input, created_by: userId })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarBase(input: AtualizarBaseInput): Promise<KnowledgeBase> {
  const supabase = await createServerClient();
  const { id, ...updates } = input;
  const { data, error } = await supabase
    .from('knowledge_bases')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deletarBase(id: number): Promise<void> {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('knowledge_bases')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function listarDocumentosDaBase(baseId: number): Promise<KnowledgeDocument[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('*')
    .eq('base_id', baseId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
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
  const supabase = createServiceClient();
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
  return data;
}

export async function deletarDocumento(documentId: number): Promise<{ arquivo_path: string }> {
  const supabase = createServiceClient();
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
  return { arquivo_path: doc.arquivo_path };
}

export async function resetarDocumentoParaReindexar(documentId: number): Promise<void> {
  const supabase = createServiceClient();
  // 1. Apaga chunks
  const { error: errChunks } = await supabase
    .from('knowledge_chunks')
    .delete()
    .eq('document_id', documentId);
  if (errChunks) throw errChunks;
  // 2. Reseta status do documento
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
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: args.embedding as unknown as string, // pgvector aceita array via JSON
    match_threshold: args.threshold,
    match_count: args.limit,
    filter_base_ids: args.baseIds ?? null,
  });
  if (error) throw error;
  return data ?? [];
}

export async function uploadArquivoBucket(args: {
  path: string;
  file: Blob | Buffer;
  contentType: string;
}): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.storage
    .from('conhecimento')
    .upload(args.path, args.file, { contentType: args.contentType, upsert: false });
  if (error) throw error;
}

export async function gerarSignedUrl(arquivoPath: string, expiresInSeconds = 300): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from('conhecimento')
    .createSignedUrl(arquivoPath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function removerArquivoBucket(arquivoPath: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.storage
    .from('conhecimento')
    .remove([arquivoPath]);
  if (error) throw error;
}
```

- [ ] **Step 7.2: Type-check**

Run: `npm run type-check 2>&1 | grep conhecimento`

Expected: nenhum erro relacionado a `conhecimento/repository.ts`.

- [ ] **Step 7.3: Commit**

```bash
git add src/app/\(authenticated\)/conhecimento/repository.ts
git commit -m "feat(conhecimento): repository com CRUD de bases, documentos e busca semântica"
```

---

### Task 8: Service layer

**Files:**
- Create: `src/app/(authenticated)/conhecimento/service.ts`
- Create: `src/app/(authenticated)/conhecimento/__tests__/unit/service.test.ts`

**Context:** O service orquestra repository + utilitários, e contém lógica de negócio (slug do path do bucket, dispara edge function).

- [ ] **Step 8.1: Escrever testes (RED)**

Criar `src/app/(authenticated)/conhecimento/__tests__/unit/service.test.ts`:

```typescript
import { construirPathArquivo, sanitizarNomeArquivo } from '../../service';

describe('service helpers', () => {
  describe('construirPathArquivo', () => {
    it('monta path no formato {base_slug}/{document_id}-{nome-slug}.{ext}', () => {
      const path = construirPathArquivo({
        baseSlug: 'jurisprudencia-tst',
        documentId: 42,
        nomeOriginal: 'Súmula 331 — Terceirização.pdf',
        extensao: 'pdf',
      });
      expect(path).toBe('jurisprudencia-tst/42-sumula-331-terceirizacao.pdf');
    });
  });

  describe('sanitizarNomeArquivo', () => {
    it('remove acentos e converte para kebab-case', () => {
      expect(sanitizarNomeArquivo('Ação Trabalhista — Modelo')).toBe('acao-trabalhista-modelo');
    });

    it('limita o tamanho a 80 caracteres', () => {
      const longo = 'a'.repeat(200);
      expect(sanitizarNomeArquivo(longo).length).toBeLessThanOrEqual(80);
    });

    it('preserva números', () => {
      expect(sanitizarNomeArquivo('Documento 2024 v2')).toBe('documento-2024-v2');
    });
  });
});
```

- [ ] **Step 8.2: Rodar testes (RED)**

Run: `npm test -- src/app/\(authenticated\)/conhecimento/__tests__/unit/service.test.ts`

Expected: FAIL.

- [ ] **Step 8.3: Implementar (GREEN)**

Criar `src/app/(authenticated)/conhecimento/service.ts`:

```typescript
import { extrairTexto, type FormatoArquivo } from '@/lib/conhecimento';
import * as repository from './repository';
import { createServiceClient } from '@/lib/supabase/service-client';

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
  const supabase = createServiceClient();
  const { data: documento, error } = await supabase
    .from('knowledge_documents')
    .update({ arquivo_path: arquivoPath })
    .eq('id', documentoTemp.id)
    .select('*')
    .single();
  if (error) throw error;

  // 5. Disparar edge function fire-and-forget
  await dispararIndexacao(documento.id);

  return documento;
}

export async function dispararIndexacao(documentId: number): Promise<void> {
  const supabase = createServiceClient();
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
```

- [ ] **Step 8.4: Rodar testes**

Run: `npm test -- src/app/\(authenticated\)/conhecimento/__tests__/unit/service.test.ts`

Expected: PASS.

- [ ] **Step 8.5: Commit**

```bash
git add src/app/\(authenticated\)/conhecimento/service.ts src/app/\(authenticated\)/conhecimento/__tests__/unit/service.test.ts
git commit -m "feat(conhecimento): service layer com upload e disparo de indexação"
```

---

## Phase 4 — Edge Function

### Task 9: Edge Function `indexar-conhecimento`

**Files:**
- Create: `supabase/functions/indexar-conhecimento/index.ts`

**Context:** Edge Functions rodam em Deno. Importações usam URLs (`esm.sh`/`deno.land`). Reusa o pattern do `indexar-documentos` mas processa um único `document_id` por invocação (não fila polling).

- [ ] **Step 9.1: Implementar edge function**

Criar `supabase/functions/indexar-conhecimento/index.ts`:

```typescript
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

    const embeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchEmbeddings = await embedBatch(batch.map((c) => c.conteudo), openaiApiKey, embeddingModel);
      embeddings.push(...batchEmbeddings);
    }

    const rows = chunks.map((chunk, idx) => ({
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
        total_chunks: chunks.length,
        indexed_at: new Date().toISOString(),
        ultimo_erro: null,
      })
      .eq('id', documentId);

    return jsonResponse({ ok: true, chunks: chunks.length });
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
  if (estimateTokens(text) <= target) {
    return [{ conteudo: text.trim(), posicao: 0, tokens: estimateTokens(text) }];
  }

  let bestSep = ' ';
  for (const sep of SEPARATORS) {
    const units = sep === ' ' ? text.split(/\s+/) : text.split(sep);
    if (units.length > 1 && units.every((u) => estimateTokens(u) <= target)) {
      bestSep = sep;
      break;
    }
  }

  const units = bestSep === ' ' ? text.split(/\s+/) : text.split(bestSep);
  const chunks: Chunk[] = [];
  let posicao = 0;
  let i = 0;
  while (i < units.length) {
    let content = '';
    let j = i;
    while (j < units.length) {
      const next = j === i ? units[j] : content + bestSep + units[j];
      if (estimateTokens(next) > target && content.length > 0) break;
      content = next;
      j++;
    }
    chunks.push({ conteudo: content.trim(), posicao, tokens: estimateTokens(content) });
    posicao++;
    if (j >= units.length) break;
    let overlapAcc = 0;
    let backtrack = j;
    while (backtrack > i && overlapAcc < overlap) {
      backtrack--;
      overlapAcc += estimateTokens(units[backtrack]);
    }
    i = backtrack < j ? backtrack : j;
  }
  return chunks;
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
```

- [ ] **Step 9.2: Validar TypeScript da edge function**

Run: `cd supabase/functions/indexar-conhecimento && deno check index.ts`

Expected: PASS sem erros.

(Se deno não estiver instalado, pular este passo — será validado no deploy.)

- [ ] **Step 9.3: Commit**

```bash
git add supabase/functions/indexar-conhecimento/index.ts
git commit -m "feat(conhecimento): edge function indexar-conhecimento (chunking + embedding)"
```

---

## Phase 5 — Server Actions

### Task 10: Action criar/atualizar/deletar base

**Files:**
- Create: `src/app/(authenticated)/conhecimento/actions/criar-base.action.ts`
- Create: `src/app/(authenticated)/conhecimento/actions/atualizar-base.action.ts`
- Create: `src/app/(authenticated)/conhecimento/actions/deletar-base.action.ts`
- Create: `src/app/(authenticated)/conhecimento/__tests__/actions/criar-base.test.ts`

**Context:** Padrão de Server Action do projeto: usa `safeAction` ou `actionClient` (verificar em `src/lib/safe-action.ts`), input validado via Zod, autorização via `checkPermission` ou helper. Para super_admin, padrão é checar `is_super_admin` antes da operação.

- [ ] **Step 10.1: Inspecionar padrão de Server Action existente**

Run: `grep -l "use server" src/app/\(authenticated\)/audiencias/**/*.ts | head -3`

Inspecionar um arquivo retornado para confirmar:
- Como aplicar `'use server'` directive
- Como obter usuário autenticado
- Como verificar permissão de super_admin
- Padrão de retorno (`{ success, data, error }` ou throw)

- [ ] **Step 10.2: Escrever teste de criar-base (RED)**

Criar `src/app/(authenticated)/conhecimento/__tests__/actions/criar-base.test.ts`:

```typescript
import { criarBase } from '../../actions/criar-base.action';

jest.mock('../../repository', () => ({
  inserirBase: jest.fn(async (input, userId) => ({
    id: 1,
    ...input,
    total_documentos: 0,
    total_chunks: 0,
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })),
}));

jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(async () => ({ id: 99, is_super_admin: true })),
}));

describe('criarBase action', () => {
  it('retorna a base criada quando super_admin', async () => {
    const result = await criarBase({
      nome: 'Jurisprudência TST',
      slug: 'jurisprudencia-tst',
      descricao: 'Súmulas e OJs',
    });
    expect(result).toMatchObject({
      id: 1,
      nome: 'Jurisprudência TST',
      slug: 'jurisprudencia-tst',
      created_by: 99,
    });
  });

  it('rejeita usuário não super_admin', async () => {
    const { getCurrentUser } = require('@/lib/auth/get-current-user');
    getCurrentUser.mockResolvedValueOnce({ id: 99, is_super_admin: false });

    await expect(criarBase({ nome: 'X', slug: 'x' }))
      .rejects.toThrow(/super_admin|permissão/i);
  });

  it('rejeita slug inválido', async () => {
    await expect(criarBase({ nome: 'X', slug: 'tem espaço' } as never))
      .rejects.toThrow();
  });
});
```

- [ ] **Step 10.3: Implementar criar-base (GREEN)**

Criar `src/app/(authenticated)/conhecimento/actions/criar-base.action.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { CriarBaseInputSchema, type CriarBaseInput, type KnowledgeBase } from '../domain';
import { inserirBase } from '../repository';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export async function criarBase(input: CriarBaseInput): Promise<KnowledgeBase> {
  const parsed = CriarBaseInputSchema.parse(input);

  const user = await getCurrentUser();
  if (!user?.is_super_admin) {
    throw new Error('Apenas super_admin pode criar bases de conhecimento');
  }

  const base = await inserirBase(parsed, user.id);
  revalidatePath('/conhecimento');
  return base;
}
```

- [ ] **Step 10.4: Implementar atualizar-base e deletar-base**

Criar `src/app/(authenticated)/conhecimento/actions/atualizar-base.action.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { AtualizarBaseInputSchema, type AtualizarBaseInput, type KnowledgeBase } from '../domain';
import { atualizarBase as repoAtualizar } from '../repository';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export async function atualizarBase(input: AtualizarBaseInput): Promise<KnowledgeBase> {
  const parsed = AtualizarBaseInputSchema.parse(input);
  const user = await getCurrentUser();
  if (!user?.is_super_admin) {
    throw new Error('Apenas super_admin pode editar bases de conhecimento');
  }
  const base = await repoAtualizar(parsed);
  revalidatePath('/conhecimento');
  revalidatePath(`/conhecimento/${base.slug}`);
  return base;
}
```

Criar `src/app/(authenticated)/conhecimento/actions/deletar-base.action.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { deletarBase as repoDeletar, listarDocumentosDaBase } from '../repository';
import { removerArquivoBucket } from '../repository';
import { getCurrentUser } from '@/lib/auth/get-current-user';

const InputSchema = z.object({ id: z.number().int().positive() });

export async function deletarBase(input: { id: number }): Promise<{ success: true }> {
  const { id } = InputSchema.parse(input);
  const user = await getCurrentUser();
  if (!user?.is_super_admin) {
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
```

- [ ] **Step 10.5: Rodar testes**

Run: `npm test -- src/app/\(authenticated\)/conhecimento/__tests__/actions/criar-base.test.ts`

Expected: PASS.

- [ ] **Step 10.6: Commit**

```bash
git add src/app/\(authenticated\)/conhecimento/actions/criar-base.action.ts src/app/\(authenticated\)/conhecimento/actions/atualizar-base.action.ts src/app/\(authenticated\)/conhecimento/actions/deletar-base.action.ts src/app/\(authenticated\)/conhecimento/__tests__/actions/criar-base.test.ts
git commit -m "feat(conhecimento): server actions de CRUD de bases"
```

---

### Task 11: Action criar-documento (extração + dispara edge function)

**Files:**
- Create: `src/app/(authenticated)/conhecimento/actions/criar-documento.action.ts`
- Create: `src/app/(authenticated)/conhecimento/__tests__/actions/criar-documento.test.ts`

- [ ] **Step 11.1: Escrever teste**

Criar `src/app/(authenticated)/conhecimento/__tests__/actions/criar-documento.test.ts`:

```typescript
import { criarDocumento } from '../../actions/criar-documento.action';

jest.mock('../../repository', () => ({
  buscarBasePorSlug: jest.fn(async (slug) => ({ id: 1, slug })),
}));

jest.mock('../../service', () => ({
  processarUpload: jest.fn(async (args) => ({
    id: 42,
    base_id: args.baseId,
    nome: args.nomeOriginal,
    arquivo_tipo: args.arquivoTipo,
    status: 'pending',
  })),
}));

jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(async () => ({ id: 99, is_super_admin: true })),
}));

describe('criarDocumento action', () => {
  function makeFormData(opts: {
    baseSlug: string;
    nome: string;
    bytes: Buffer;
    mimeType: string;
  }): FormData {
    const fd = new FormData();
    fd.append('base_slug', opts.baseSlug);
    fd.append('nome', opts.nome);
    fd.append('arquivo', new Blob([opts.bytes], { type: opts.mimeType }), opts.nome);
    return fd;
  }

  it('processa upload com sucesso', async () => {
    const fd = makeFormData({
      baseSlug: 'jurisprudencia-tst',
      nome: 'sumula.pdf',
      bytes: Buffer.from('fake'),
      mimeType: 'application/pdf',
    });
    const result = await criarDocumento(fd);
    expect(result).toMatchObject({ id: 42, status: 'pending' });
  });

  it('rejeita arquivo > 50MB', async () => {
    const big = Buffer.alloc(51 * 1024 * 1024);
    const fd = makeFormData({
      baseSlug: 'x',
      nome: 'big.pdf',
      bytes: big,
      mimeType: 'application/pdf',
    });
    await expect(criarDocumento(fd)).rejects.toThrow(/50/);
  });

  it('rejeita formato não suportado', async () => {
    const fd = makeFormData({
      baseSlug: 'x',
      nome: 'arquivo.xls',
      bytes: Buffer.from('a'),
      mimeType: 'application/vnd.ms-excel',
    });
    await expect(criarDocumento(fd)).rejects.toThrow(/formato/i);
  });

  it('rejeita não super_admin', async () => {
    const { getCurrentUser } = require('@/lib/auth/get-current-user');
    getCurrentUser.mockResolvedValueOnce({ id: 99, is_super_admin: false });
    const fd = makeFormData({
      baseSlug: 'x',
      nome: 'a.pdf',
      bytes: Buffer.from('a'),
      mimeType: 'application/pdf',
    });
    await expect(criarDocumento(fd)).rejects.toThrow(/super_admin|permissão/i);
  });
});
```

- [ ] **Step 11.2: Implementar action**

Criar `src/app/(authenticated)/conhecimento/actions/criar-documento.action.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { TAMANHO_MAX_BYTES, FORMATOS_ARQUIVO, type FormatoArquivo, type KnowledgeDocument } from '../domain';
import { buscarBasePorSlug } from '../repository';
import { processarUpload } from '../service';
import { getCurrentUser } from '@/lib/auth/get-current-user';

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
  if (!user?.is_super_admin) {
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
  return documento;
}
```

- [ ] **Step 11.3: Rodar testes**

Run: `npm test -- src/app/\(authenticated\)/conhecimento/__tests__/actions/criar-documento.test.ts`

Expected: PASS.

- [ ] **Step 11.4: Commit**

```bash
git add src/app/\(authenticated\)/conhecimento/actions/criar-documento.action.ts src/app/\(authenticated\)/conhecimento/__tests__/actions/criar-documento.test.ts
git commit -m "feat(conhecimento): action criar-documento com extração e disparo de indexação"
```

---

### Task 12: Actions deletar-documento + reindexar-documento

**Files:**
- Create: `src/app/(authenticated)/conhecimento/actions/deletar-documento.action.ts`
- Create: `src/app/(authenticated)/conhecimento/actions/reindexar-documento.action.ts`

- [ ] **Step 12.1: Implementar deletar-documento**

Criar `src/app/(authenticated)/conhecimento/actions/deletar-documento.action.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { deletarDocumento as repoDeletar, removerArquivoBucket } from '../repository';
import { getCurrentUser } from '@/lib/auth/get-current-user';

const InputSchema = z.object({
  document_id: z.number().int().positive(),
  base_slug: z.string(),
});

export async function deletarDocumento(input: { document_id: number; base_slug: string }) {
  const { document_id, base_slug } = InputSchema.parse(input);
  const user = await getCurrentUser();
  if (!user?.is_super_admin) {
    throw new Error('Apenas super_admin pode deletar documentos');
  }

  const { arquivo_path } = await repoDeletar(document_id);
  if (arquivo_path && arquivo_path !== 'pending') {
    try { await removerArquivoBucket(arquivo_path); }
    catch (err) { console.warn('[deletarDocumento] Falha ao remover arquivo:', err); }
  }

  revalidatePath(`/conhecimento/${base_slug}`);
  return { success: true };
}
```

- [ ] **Step 12.2: Implementar reindexar-documento**

Criar `src/app/(authenticated)/conhecimento/actions/reindexar-documento.action.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { resetarDocumentoParaReindexar } from '../repository';
import { dispararIndexacao } from '../service';
import { getCurrentUser } from '@/lib/auth/get-current-user';

const InputSchema = z.object({
  document_id: z.number().int().positive(),
  base_slug: z.string(),
});

export async function reindexarDocumento(input: { document_id: number; base_slug: string }) {
  const { document_id, base_slug } = InputSchema.parse(input);
  const user = await getCurrentUser();
  if (!user?.is_super_admin) {
    throw new Error('Apenas super_admin pode reindexar');
  }
  await resetarDocumentoParaReindexar(document_id);
  await dispararIndexacao(document_id);
  revalidatePath(`/conhecimento/${base_slug}`);
  return { success: true };
}
```

- [ ] **Step 12.3: Commit**

```bash
git add src/app/\(authenticated\)/conhecimento/actions/deletar-documento.action.ts src/app/\(authenticated\)/conhecimento/actions/reindexar-documento.action.ts
git commit -m "feat(conhecimento): actions deletar e reindexar documento"
```

---

### Task 13: Action buscar-conhecimento (UI)

**Files:**
- Create: `src/app/(authenticated)/conhecimento/actions/buscar-conhecimento.action.ts`
- Create: `src/app/(authenticated)/conhecimento/__tests__/actions/buscar-conhecimento.test.ts`

- [ ] **Step 13.1: Escrever teste**

Criar `src/app/(authenticated)/conhecimento/__tests__/actions/buscar-conhecimento.test.ts`:

```typescript
import { buscarConhecimento } from '../../actions/buscar-conhecimento.action';

jest.mock('@/lib/ai/embedding', () => ({
  gerarEmbedding: jest.fn(async () => Array(1536).fill(0.1)),
}));

jest.mock('../../repository', () => ({
  buscarSemantico: jest.fn(async (args) => [
    {
      chunk_id: 1,
      conteudo: 'Trecho de exemplo',
      similarity: 0.85,
      document_id: 10,
      document_nome: 'Súmula 331',
      base_id: 1,
      base_nome: 'Jurisprudência TST',
      posicao: 0,
    },
  ]),
}));

jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(async () => ({ id: 99 })),
}));

describe('buscarConhecimento action', () => {
  it('retorna chunks rankeados', async () => {
    const result = await buscarConhecimento({ query: 'horas in itinere' });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      chunk_id: 1,
      similarity: 0.85,
      base_nome: 'Jurisprudência TST',
    });
  });

  it('rejeita query muito curta', async () => {
    await expect(buscarConhecimento({ query: 'ab' })).rejects.toThrow();
  });

  it('aceita filtro por base_ids', async () => {
    const { buscarSemantico } = require('../../repository');
    await buscarConhecimento({ query: 'teste', base_ids: [1, 2] });
    expect(buscarSemantico).toHaveBeenCalledWith(
      expect.objectContaining({ baseIds: [1, 2] })
    );
  });
});
```

- [ ] **Step 13.2: Implementar action**

Criar `src/app/(authenticated)/conhecimento/actions/buscar-conhecimento.action.ts`:

```typescript
'use server';

import { BuscarConhecimentoInputSchema, type BuscarConhecimentoInput, type KnowledgeChunk } from '../domain';
import { buscarSemantico } from '../repository';
import { gerarEmbedding } from '@/lib/ai/embedding';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export async function buscarConhecimento(input: BuscarConhecimentoInput): Promise<KnowledgeChunk[]> {
  const parsed = BuscarConhecimentoInputSchema.parse(input);
  const user = await getCurrentUser();
  if (!user) throw new Error('Não autenticado');

  const embedding = await gerarEmbedding(parsed.query);

  return buscarSemantico({
    embedding,
    threshold: parsed.threshold,
    limit: parsed.limit,
    baseIds: parsed.base_ids,
  });
}
```

- [ ] **Step 13.3: Validar que `gerarEmbedding` está exportado em `src/lib/ai/embedding.ts`**

Run: `grep "^export" src/lib/ai/embedding.ts`

Expected: presença de `export async function gerarEmbedding` ou similar. Se não estiver, exportar (no arquivo existente, adicionar `export` à função `gerarEmbedding` que já existe — confirmar pelo nome exato).

- [ ] **Step 13.4: Rodar testes**

Run: `npm test -- src/app/\(authenticated\)/conhecimento/__tests__/actions/buscar-conhecimento.test.ts`

Expected: PASS.

- [ ] **Step 13.5: Commit**

```bash
git add src/app/\(authenticated\)/conhecimento/actions/buscar-conhecimento.action.ts src/app/\(authenticated\)/conhecimento/__tests__/actions/buscar-conhecimento.test.ts
git commit -m "feat(conhecimento): action buscar-conhecimento com embedding + RPC"
```

---

### Task 14: Action gerar-signed-url

**Files:**
- Create: `src/app/(authenticated)/conhecimento/actions/gerar-signed-url.action.ts`

- [ ] **Step 14.1: Implementar**

Criar `src/app/(authenticated)/conhecimento/actions/gerar-signed-url.action.ts`:

```typescript
'use server';

import { z } from 'zod';
import { gerarSignedUrl } from '../repository';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createServiceClient } from '@/lib/supabase/service-client';

const InputSchema = z.object({ document_id: z.number().int().positive() });

export async function gerarUrlAssinada(input: { document_id: number }): Promise<{ url: string }> {
  const { document_id } = InputSchema.parse(input);
  const user = await getCurrentUser();
  if (!user) throw new Error('Não autenticado');

  const supabase = createServiceClient();
  const { data: doc, error } = await supabase
    .from('knowledge_documents')
    .select('arquivo_path')
    .eq('id', document_id)
    .single();
  if (error || !doc) throw new Error('Documento não encontrado');

  const url = await gerarSignedUrl(doc.arquivo_path, 300);
  return { url };
}
```

- [ ] **Step 14.2: Commit**

```bash
git add src/app/\(authenticated\)/conhecimento/actions/gerar-signed-url.action.ts
git commit -m "feat(conhecimento): action gerar-signed-url para download de documento"
```

---

## Phase 6 — UI

### Task 15: Page e client da lista de bases

**Files:**
- Create: `src/app/(authenticated)/conhecimento/page.tsx`
- Create: `src/app/(authenticated)/conhecimento/layout.tsx`
- Create: `src/app/(authenticated)/conhecimento/conhecimento-client.tsx`
- Create: `src/app/(authenticated)/conhecimento/index.ts`

**Context:** O padrão é Server Component em `page.tsx` que faz `await listarBases()` e passa para um Client Component que renderiza UI. Header segue canônico: `Heading` + `Text` + `Button size="sm" rounded-xl + Plus size-3.5`.

- [ ] **Step 15.1: Inspecionar page.tsx canônico de audiencias**

Run: `cat src/app/\(authenticated\)/audiencias/page.tsx`

Confirmar pattern de fetch e layout.

- [ ] **Step 15.2: Implementar layout.tsx**

Criar `src/app/(authenticated)/conhecimento/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Conhecimento — ZattarOS',
};

export default function ConhecimentoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 15.3: Implementar page.tsx (Server Component)**

Criar `src/app/(authenticated)/conhecimento/page.tsx`:

```tsx
import { listarBases } from './repository';
import { ConhecimentoClient } from './conhecimento-client';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export default async function ConhecimentoPage() {
  const [bases, user] = await Promise.all([
    listarBases(),
    getCurrentUser(),
  ]);
  return <ConhecimentoClient bases={bases} isSuperAdmin={!!user?.is_super_admin} />;
}
```

- [ ] **Step 15.4: Implementar conhecimento-client.tsx**

Criar `src/app/(authenticated)/conhecimento/conhecimento-client.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useAgentContext } from '@copilotkit/react-core/v2';
import { NovaBaseDialog } from './components/nova-base-dialog';
import type { KnowledgeBase } from './domain';

interface Props {
  bases: KnowledgeBase[];
  isSuperAdmin: boolean;
}

export function ConhecimentoClient({ bases, isSuperAdmin }: Props) {
  const [novaAberto, setNovaAberto] = useState(false);

  useAgentContext({
    description: 'Tela de bases de conhecimento — lista de coleções disponíveis para busca semântica',
    value: {
      total_bases: bases.length,
      bases: bases.map((b) => ({ slug: b.slug, nome: b.nome, total_documentos: b.total_documentos })),
    },
  });

  const totalDocs = bases.reduce((sum, b) => sum + b.total_documentos, 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <Heading level={1}>Conhecimento</Heading>
          <Text className="text-muted-foreground">
            {bases.length} {bases.length === 1 ? 'base' : 'bases'} · {totalDocs} {totalDocs === 1 ? 'documento' : 'documentos'} indexados
          </Text>
        </div>
        {isSuperAdmin && (
          <Button size="sm" className="rounded-xl" onClick={() => setNovaAberto(true)}>
            <Plus className="size-3.5" />
            Nova base
          </Button>
        )}
      </header>

      {bases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="size-12 text-muted-foreground mb-4" />
          <Heading level={3}>Nenhuma base de conhecimento ainda</Heading>
          <Text className="text-muted-foreground max-w-md mt-2">
            {isSuperAdmin
              ? 'Crie sua primeira base para começar a indexar jurisprudências, modelos e doutrina.'
              : 'Aguarde um administrador criar bases de conhecimento.'}
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bases.map((base) => (
            <Link
              key={base.id}
              href={`/conhecimento/${base.slug}`}
              className="group rounded-2xl border bg-card p-6 transition hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <Heading level={3}>{base.nome}</Heading>
                {base.cor && (
                  <span className="size-3 rounded-full" style={{ backgroundColor: base.cor }} />
                )}
              </div>
              {base.descricao && (
                <Text className="text-sm text-muted-foreground mt-2 line-clamp-2">{base.descricao}</Text>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{base.total_documentos} docs</span>
                <span>{base.total_chunks} chunks</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <NovaBaseDialog open={novaAberto} onOpenChange={setNovaAberto} />
    </div>
  );
}
```

- [ ] **Step 15.5: Implementar barrel exports**

Criar `src/app/(authenticated)/conhecimento/index.ts`:

```typescript
export * from './domain';
```

- [ ] **Step 15.6: Type-check**

Run: `npm run type-check 2>&1 | grep conhecimento`

Expected: nenhum erro.

- [ ] **Step 15.7: Commit**

```bash
git add src/app/\(authenticated\)/conhecimento/page.tsx src/app/\(authenticated\)/conhecimento/layout.tsx src/app/\(authenticated\)/conhecimento/conhecimento-client.tsx src/app/\(authenticated\)/conhecimento/index.ts
git commit -m "feat(conhecimento): rota /conhecimento com lista de bases"
```

---

### Task 16: Dialog de nova base

**Files:**
- Create: `src/app/(authenticated)/conhecimento/components/nova-base-dialog.tsx`

- [ ] **Step 16.1: Inspecionar pattern de glass-dialog**

Run: `find src/components -name "glass-dialog*" | head -3 && find src/app -name "*-dialog.tsx" | grep audiencias | head -3`

Inspecionar a estrutura de imports e props de um dialog existente (ex: `audiencias-alterar-responsavel-dialog.tsx`).

- [ ] **Step 16.2: Implementar dialog**

Criar `src/app/(authenticated)/conhecimento/components/nova-base-dialog.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { GlassDialog, GlassDialogContent, GlassDialogHeader, GlassDialogTitle, GlassDialogFooter } from '@/components/ui/glass-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { criarBase } from '../actions/criar-base.action';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaBaseDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nome, setNome] = useState('');
  const [slug, setSlug] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState('#0EA5E9');

  function handleNomeChange(value: string) {
    setNome(value);
    if (!slug || slug === gerarSlug(nome)) {
      setSlug(gerarSlug(value));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const base = await criarBase({ nome, slug, descricao: descricao || undefined, cor });
        toast.success(`Base "${base.nome}" criada`);
        onOpenChange(false);
        router.push(`/conhecimento/${base.slug}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao criar base');
      }
    });
  }

  return (
    <GlassDialog open={open} onOpenChange={onOpenChange}>
      <GlassDialogContent>
        <form onSubmit={handleSubmit}>
          <GlassDialogHeader>
            <GlassDialogTitle>Nova base de conhecimento</GlassDialogTitle>
          </GlassDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                placeholder="Ex: Jurisprudência TST"
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="jurisprudencia-tst"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                required
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="cor">Cor</Label>
              <Input id="cor" type="color" value={cor} onChange={(e) => setCor(e.target.value)} />
            </div>
          </div>
          <GlassDialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending || !nome || !slug}>
              {pending ? 'Criando...' : 'Criar base'}
            </Button>
          </GlassDialogFooter>
        </form>
      </GlassDialogContent>
    </GlassDialog>
  );
}

function gerarSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

- [ ] **Step 16.3: Confirmar imports do glass-dialog estão corretos**

Run: `grep -h "export" src/components/ui/glass-dialog.tsx 2>/dev/null | head -10`

Se o nome dos exports for diferente, ajustar os imports do dialog acima.

- [ ] **Step 16.4: Type-check**

Run: `npm run type-check 2>&1 | grep nova-base`

Expected: nenhum erro.

- [ ] **Step 16.5: Commit**

```bash
git add src/app/\(authenticated\)/conhecimento/components/nova-base-dialog.tsx
git commit -m "feat(conhecimento): dialog de criação de nova base"
```

---

### Task 17: Detalhe da base com tabs

**Files:**
- Create: `src/app/(authenticated)/conhecimento/[slug]/page.tsx`
- Create: `src/app/(authenticated)/conhecimento/[slug]/conhecimento-detalhe-client.tsx`
- Create: `src/app/(authenticated)/conhecimento/[slug]/components/documentos-tab.tsx`
- Create: `src/app/(authenticated)/conhecimento/[slug]/components/documentos-list.tsx`

- [ ] **Step 17.1: Implementar page.tsx do slug**

Criar `src/app/(authenticated)/conhecimento/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { buscarBasePorSlug, listarDocumentosDaBase } from '../repository';
import { ConhecimentoDetalheClient } from './conhecimento-detalhe-client';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export default async function ConhecimentoDetalhePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = await buscarBasePorSlug(slug);
  if (!base) notFound();
  const [documentos, user] = await Promise.all([
    listarDocumentosDaBase(base.id),
    getCurrentUser(),
  ]);
  return (
    <ConhecimentoDetalheClient
      base={base}
      documentos={documentos}
      isSuperAdmin={!!user?.is_super_admin}
    />
  );
}
```

- [ ] **Step 17.2: Implementar detalhe-client.tsx (roteador de tabs)**

Criar `src/app/(authenticated)/conhecimento/[slug]/conhecimento-detalhe-client.tsx`:

```tsx
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useAgentContext } from '@copilotkit/react-core/v2';
import { DocumentosTab } from './components/documentos-tab';
import { BuscarTab } from './components/buscar-tab';
import { ConfiguracoesTab } from './components/configuracoes-tab';
import type { KnowledgeBase, KnowledgeDocument } from '../domain';

const TABS = [
  { id: 'documentos', label: 'Documentos' },
  { id: 'buscar', label: 'Buscar' },
  { id: 'configuracoes', label: 'Configurações' },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface Props {
  base: KnowledgeBase;
  documentos: KnowledgeDocument[];
  isSuperAdmin: boolean;
}

export function ConhecimentoDetalheClient({ base, documentos, isSuperAdmin }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const currentTab: TabId = (searchParams.get('tab') as TabId) ?? 'documentos';

  useAgentContext({
    description: 'Detalhe de uma base de conhecimento',
    value: {
      base_slug: base.slug,
      base_nome: base.nome,
      total_documentos: documentos.length,
      tab_atual: currentTab,
    },
  });

  function setTab(tab: TabId) {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Link href="/conhecimento" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Bases de conhecimento
      </Link>

      <header>
        <Heading level={1}>{base.nome}</Heading>
        {base.descricao && <Text className="text-muted-foreground mt-1">{base.descricao}</Text>}
      </header>

      <nav className="border-b">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`px-4 py-2 text-sm border-b-2 transition ${
                currentTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {currentTab === 'documentos' && (
        <DocumentosTab base={base} documentos={documentos} isSuperAdmin={isSuperAdmin} />
      )}
      {currentTab === 'buscar' && <BuscarTab base={base} />}
      {currentTab === 'configuracoes' && (
        <ConfiguracoesTab base={base} isSuperAdmin={isSuperAdmin} />
      )}
    </div>
  );
}
```

- [ ] **Step 17.3: Implementar documentos-tab.tsx**

Criar `src/app/(authenticated)/conhecimento/[slug]/components/documentos-tab.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentosList } from './documentos-list';
import { UploadDocumentoDialog } from './upload-documento-dialog';
import type { KnowledgeBase, KnowledgeDocument } from '../../domain';

interface Props {
  base: KnowledgeBase;
  documentos: KnowledgeDocument[];
  isSuperAdmin: boolean;
}

export function DocumentosTab({ base, documentos, isSuperAdmin }: Props) {
  const [uploadAberto, setUploadAberto] = useState(false);

  return (
    <div className="space-y-4">
      {isSuperAdmin && (
        <div className="flex justify-end">
          <Button size="sm" className="rounded-xl" onClick={() => setUploadAberto(true)}>
            <Plus className="size-3.5" />
            Adicionar documento
          </Button>
        </div>
      )}

      <DocumentosList
        baseSlug={base.slug}
        documentos={documentos}
        isSuperAdmin={isSuperAdmin}
      />

      <UploadDocumentoDialog
        open={uploadAberto}
        onOpenChange={setUploadAberto}
        baseSlug={base.slug}
      />
    </div>
  );
}
```

- [ ] **Step 17.4: Implementar documentos-list.tsx**

Criar `src/app/(authenticated)/conhecimento/[slug]/components/documentos-list.tsx`:

```tsx
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Trash2, RotateCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { deletarDocumento } from '../../actions/deletar-documento.action';
import { reindexarDocumento } from '../../actions/reindexar-documento.action';
import { gerarUrlAssinada } from '../../actions/gerar-signed-url.action';
import type { KnowledgeDocument, StatusDocumento } from '../../domain';

interface Props {
  baseSlug: string;
  documentos: KnowledgeDocument[];
  isSuperAdmin: boolean;
}

const STATUS_LABEL: Record<StatusDocumento, string> = {
  pending: 'Pendente',
  processing: 'Indexando',
  indexed: 'Indexado',
  failed: 'Falha',
};

const STATUS_VARIANT: Record<StatusDocumento, 'default' | 'secondary' | 'success' | 'destructive'> = {
  pending: 'secondary',
  processing: 'default',
  indexed: 'success',
  failed: 'destructive',
};

export function DocumentosList({ baseSlug, documentos, isSuperAdmin }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDeletar(documentId: number) {
    if (!confirm('Tem certeza que quer deletar este documento? Os chunks indexados também serão removidos.')) return;
    startTransition(async () => {
      try {
        await deletarDocumento({ document_id: documentId, base_slug: baseSlug });
        toast.success('Documento removido');
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao deletar');
      }
    });
  }

  function handleReindexar(documentId: number) {
    startTransition(async () => {
      try {
        await reindexarDocumento({ document_id: documentId, base_slug: baseSlug });
        toast.success('Reindexação iniciada');
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao reindexar');
      }
    });
  }

  async function handleAbrir(documentId: number) {
    try {
      const { url } = await gerarUrlAssinada({ document_id: documentId });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao abrir documento');
    }
  }

  if (documentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="size-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhum documento ainda</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Tamanho</th>
            <th className="px-4 py-3">Chunks</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {documentos.map((doc) => (
            <tr key={doc.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{doc.nome}</td>
              <td className="px-4 py-3 uppercase text-muted-foreground">{doc.arquivo_tipo}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatBytes(doc.arquivo_tamanho_bytes)}</td>
              <td className="px-4 py-3 text-muted-foreground">{doc.total_chunks}</td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANT[doc.status]}>
                  {STATUS_LABEL[doc.status]}
                </Badge>
                {doc.status === 'failed' && doc.ultimo_erro && (
                  <p className="mt-1 text-xs text-destructive max-w-xs truncate" title={doc.ultimo_erro}>
                    {doc.ultimo_erro}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleAbrir(doc.id)} title="Abrir">
                    <Download className="size-3.5" />
                  </Button>
                  {isSuperAdmin && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => handleReindexar(doc.id)} disabled={pending} title="Reindexar">
                        <RotateCw className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeletar(doc.id)} disabled={pending} title="Deletar">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

- [ ] **Step 17.5: Commit (sem upload-dialog ainda — virá na próxima task)**

Antes de commitar, criar stub mínimo para `upload-documento-dialog.tsx`, `buscar-tab.tsx` e `configuracoes-tab.tsx` para o build não quebrar:

```tsx
// upload-documento-dialog.tsx (stub)
'use client';
export function UploadDocumentoDialog({ open, onOpenChange, baseSlug }: { open: boolean; onOpenChange: (o: boolean) => void; baseSlug: string }) {
  return null;
}
```

```tsx
// buscar-tab.tsx (stub)
'use client';
import type { KnowledgeBase } from '../../domain';
export function BuscarTab({ base }: { base: KnowledgeBase }) {
  return <p className="text-muted-foreground">Em construção</p>;
}
```

```tsx
// configuracoes-tab.tsx (stub)
'use client';
import type { KnowledgeBase } from '../../domain';
export function ConfiguracoesTab({ base, isSuperAdmin }: { base: KnowledgeBase; isSuperAdmin: boolean }) {
  return <p className="text-muted-foreground">Em construção</p>;
}
```

```bash
git add src/app/\(authenticated\)/conhecimento/\[slug\]/
git commit -m "feat(conhecimento): rota /conhecimento/[slug] com tabs e lista de documentos"
```

---

### Task 18: Upload-documento-dialog (substituir stub)

**Files:**
- Modify: `src/app/(authenticated)/conhecimento/[slug]/components/upload-documento-dialog.tsx`

- [ ] **Step 18.1: Implementar dialog com upload**

Substituir conteúdo do stub `upload-documento-dialog.tsx`:

```tsx
'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText } from 'lucide-react';
import {
  GlassDialog, GlassDialogContent, GlassDialogHeader,
  GlassDialogTitle, GlassDialogFooter,
} from '@/components/ui/glass-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { criarDocumento } from '../../actions/criar-documento.action';

const TAMANHO_MAX_MB = 50;
const ACCEPT = '.txt,.md,.html,.pdf,.docx';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseSlug: string;
}

export function UploadDocumentoDialog({ open, onOpenChange, baseSlug }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [nome, setNome] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > TAMANHO_MAX_MB * 1024 * 1024) {
      toast.error(`Arquivo excede ${TAMANHO_MAX_MB} MB`);
      return;
    }
    setFile(f);
    if (f && !nome) setNome(f.name.replace(/\.[^.]+$/, ''));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append('base_slug', baseSlug);
        fd.append('nome', nome || file.name);
        fd.append('arquivo', file, file.name);
        await criarDocumento(fd);
        toast.success('Documento enviado, indexação em andamento');
        onOpenChange(false);
        setFile(null);
        setNome('');
        if (inputRef.current) inputRef.current.value = '';
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro no upload');
      }
    });
  }

  return (
    <GlassDialog open={open} onOpenChange={onOpenChange}>
      <GlassDialogContent>
        <form onSubmit={handleSubmit}>
          <GlassDialogHeader>
            <GlassDialogTitle>Adicionar documento</GlassDialogTitle>
          </GlassDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="arquivo">Arquivo</Label>
              <div className="mt-1">
                <Input
                  id="arquivo"
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  onChange={handleFileChange}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos: TXT, MD, HTML, PDF, DOCX. Máx {TAMANHO_MAX_MB} MB.
                </p>
              </div>
            </div>
            {file && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                <FileText className="size-4" />
                <span className="font-medium">{file.name}</span>
                <span className="text-muted-foreground ml-auto">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            )}
            <div>
              <Label htmlFor="nome">Nome de exibição</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como aparece na lista"
              />
            </div>
          </div>
          <GlassDialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending || !file}>
              {pending ? 'Enviando...' : (<><Upload className="size-3.5" /> Enviar</>)}
            </Button>
          </GlassDialogFooter>
        </form>
      </GlassDialogContent>
    </GlassDialog>
  );
}
```

- [ ] **Step 18.2: Commit**

```bash
git add src/app/\(authenticated\)/conhecimento/\[slug\]/components/upload-documento-dialog.tsx
git commit -m "feat(conhecimento): dialog de upload com validação client-side"
```

---

### Task 19: Tab Buscar

**Files:**
- Modify: `src/app/(authenticated)/conhecimento/[slug]/components/buscar-tab.tsx`
- Create: `src/app/(authenticated)/conhecimento/[slug]/components/resultado-chunk-card.tsx`

- [ ] **Step 19.1: Implementar resultado-chunk-card.tsx**

Criar `src/app/(authenticated)/conhecimento/[slug]/components/resultado-chunk-card.tsx`:

```tsx
'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { gerarUrlAssinada } from '../../actions/gerar-signed-url.action';
import { toast } from 'sonner';
import type { KnowledgeChunk } from '../../domain';

export function ResultadoChunkCard({ chunk }: { chunk: KnowledgeChunk }) {
  async function abrir() {
    try {
      const { url } = await gerarUrlAssinada({ document_id: chunk.document_id });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao abrir');
    }
  }

  return (
    <article className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{chunk.base_nome}</span>
            {' · '}
            <span>{chunk.document_nome}</span>
            {' · '}
            <span>chunk {chunk.posicao}</span>
          </p>
        </div>
        <Badge variant="secondary">{(chunk.similarity * 100).toFixed(1)}%</Badge>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{chunk.conteudo}</p>
      <Button size="sm" variant="ghost" onClick={abrir} className="rounded-xl">
        <ExternalLink className="size-3.5" />
        Abrir documento
      </Button>
    </article>
  );
}
```

- [ ] **Step 19.2: Implementar buscar-tab.tsx**

Substituir conteúdo do stub `buscar-tab.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ResultadoChunkCard } from './resultado-chunk-card';
import { buscarConhecimento } from '../../actions/buscar-conhecimento.action';
import { toast } from 'sonner';
import type { KnowledgeBase, KnowledgeChunk } from '../../domain';

export function BuscarTab({ base }: { base: KnowledgeBase }) {
  const [query, setQuery] = useState('');
  const [threshold, setThreshold] = useState(0.7);
  const [limit, setLimit] = useState(8);
  const [resultados, setResultados] = useState<KnowledgeChunk[] | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 3) {
      toast.error('Query deve ter pelo menos 3 caracteres');
      return;
    }
    startTransition(async () => {
      try {
        const r = await buscarConhecimento({
          query: query.trim(),
          base_ids: [base.id],
          limit,
          threshold,
        });
        setResultados(r);
        if (r.length === 0) toast.info('Nenhum resultado acima do threshold');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro na busca');
      }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="query">Pergunta ou trecho a buscar</Label>
          <Textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            placeholder="Ex: o que diz a Súmula 331 sobre terceirização?"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Threshold (similaridade mínima): {threshold.toFixed(2)}</Label>
            <Slider value={[threshold]} onValueChange={(v) => setThreshold(v[0])} min={0.5} max={0.95} step={0.05} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Resultados: {limit}</Label>
            <Slider value={[limit]} onValueChange={(v) => setLimit(v[0])} min={1} max={20} step={1} />
          </div>
        </div>
        <Button type="submit" size="sm" className="rounded-xl" disabled={pending || query.trim().length < 3}>
          <Search className="size-3.5" />
          {pending ? 'Buscando...' : 'Buscar'}
        </Button>
      </form>

      {resultados && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}</p>
          {resultados.map((chunk) => (
            <ResultadoChunkCard key={chunk.chunk_id} chunk={chunk} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 19.3: Commit**

```bash
git add src/app/\(authenticated\)/conhecimento/\[slug\]/components/buscar-tab.tsx src/app/\(authenticated\)/conhecimento/\[slug\]/components/resultado-chunk-card.tsx
git commit -m "feat(conhecimento): tab Buscar com recuperação semântica e cards de resultado"
```

---

### Task 20: Tab Configurações

**Files:**
- Modify: `src/app/(authenticated)/conhecimento/[slug]/components/configuracoes-tab.tsx`

- [ ] **Step 20.1: Implementar**

Substituir conteúdo do stub `configuracoes-tab.tsx`:

```tsx
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { deletarBase } from '../../actions/deletar-base.action';
import { toast } from 'sonner';
import type { KnowledgeBase } from '../../domain';

interface Props {
  base: KnowledgeBase;
  isSuperAdmin: boolean;
}

export function ConfiguracoesTab({ base, isSuperAdmin }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDeletar() {
    if (!confirm(`Deletar base "${base.nome}"? Todos os documentos e chunks serão removidos. Esta ação não pode ser desfeita.`)) {
      return;
    }
    startTransition(async () => {
      try {
        await deletarBase({ id: base.id });
        toast.success('Base removida');
        router.push('/conhecimento');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao deletar');
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <Heading level={3}>Informações</Heading>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Slug</dt>
          <dd className="font-medium">{base.slug}</dd>
          <dt className="text-muted-foreground">Total de documentos</dt>
          <dd className="font-medium">{base.total_documentos}</dd>
          <dt className="text-muted-foreground">Total de chunks</dt>
          <dd className="font-medium">{base.total_chunks}</dd>
          <dt className="text-muted-foreground">Criada em</dt>
          <dd className="font-medium">{new Date(base.created_at).toLocaleString('pt-BR')}</dd>
          <dt className="text-muted-foreground">Última atualização</dt>
          <dd className="font-medium">{new Date(base.updated_at).toLocaleString('pt-BR')}</dd>
        </dl>
      </section>

      {isSuperAdmin && (
        <section className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <Heading level={3}>Zona de perigo</Heading>
          <Text className="text-sm text-muted-foreground">
            Deletar esta base remove permanentemente todos os documentos e chunks indexados.
          </Text>
          <Button variant="destructive" size="sm" onClick={handleDeletar} disabled={pending} className="rounded-xl">
            <Trash2 className="size-3.5" />
            {pending ? 'Deletando...' : 'Deletar base'}
          </Button>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 20.2: Commit**

```bash
git add src/app/\(authenticated\)/conhecimento/\[slug\]/components/configuracoes-tab.tsx
git commit -m "feat(conhecimento): tab Configurações com info da base e delete"
```

---

### Task 21: Realtime subscription para status do documento

**Files:**
- Modify: `src/app/(authenticated)/conhecimento/[slug]/components/documentos-list.tsx`

**Context:** Quando upload é feito, status muda `pending → processing → indexed`. Queremos refresh automático sem o usuário ter que clicar refresh. Supabase Realtime via channel.

- [ ] **Step 21.1: Adicionar subscription Realtime**

Adicionar ao `documentos-list.tsx` (após os hooks, antes do `if (documentos.length === 0)`):

```tsx
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// dentro do componente DocumentosList:
useEffect(() => {
  const supabase = createClient();
  const channel = supabase
    .channel(`knowledge_documents:${baseSlug}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'knowledge_documents' },
      () => router.refresh()
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [baseSlug, router]);
```

(Os imports `useEffect` e `createClient` já devem ser adicionados ao topo do arquivo.)

- [ ] **Step 21.2: Validar uso correto do client Supabase no browser**

Run: `grep -n "createClient" src/lib/supabase/client.ts`

Confirmar que existe export `createClient` para uso em Client Component. Se não, ajustar o import.

- [ ] **Step 21.3: Commit**

```bash
git add src/app/\(authenticated\)/conhecimento/\[slug\]/components/documentos-list.tsx
git commit -m "feat(conhecimento): realtime subscription atualiza status durante indexação"
```

---

## Phase 7 — MCP Tools

### Task 22: Registry e tools MCP

**Files:**
- Create: `src/lib/mcp/registries/conhecimento-tools.ts`
- Create: `src/lib/mcp/registries/__tests__/conhecimento-tools.test.ts`

- [ ] **Step 22.1: Inspecionar registry existente como referência**

Run: `cat src/lib/mcp/registries/busca-semantica-tools.ts`

Confirmar pattern de `registerMcpTool({ name, description, feature, requiresAuth, schema, handler })`.

- [ ] **Step 22.2: Implementar registries de conhecimento**

Criar `src/lib/mcp/registries/conhecimento-tools.ts`:

```typescript
import { z } from 'zod';
import { registerMcpTool } from '../server';
import { errorResult } from '../types';
import { createServiceClient } from '@/lib/supabase/service-client';
import { gerarEmbedding } from '@/lib/ai/embedding';

export async function registerConhecimentoTools(): Promise<void> {
  registerMcpTool({
    name: 'listar_bases_conhecimento',
    description:
      'Lista todas as bases de conhecimento do escritório (jurisprudências, doutrina, modelos de petição). ' +
      'Use quando o usuário pedir contexto jurídico, jurisprudência, modelo de peça ou doutrina, ' +
      'para descobrir quais bases existem antes de buscar.',
    feature: 'conhecimento',
    requiresAuth: true,
    schema: z.object({}),
    handler: async () => {
      try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
          .from('knowledge_bases')
          .select('id, nome, slug, descricao, total_documentos, total_chunks')
          .order('nome');
        if (error) throw error;
        return {
          content: [
            {
              type: 'text',
              text: `${(data ?? []).length} bases de conhecimento disponíveis.`,
            },
          ],
          structuredContent: { bases: data ?? [] },
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : 'Erro ao listar bases');
      }
    },
  });

  registerMcpTool({
    name: 'buscar_conhecimento',
    description:
      'Busca semântica nas bases de conhecimento do escritório. Retorna chunks relevantes ' +
      'com fonte (base e documento). Use quando precisar de jurisprudência, doutrina, modelo ' +
      'de petição ou referência jurídica para fundamentar uma resposta.',
    feature: 'conhecimento',
    requiresAuth: true,
    schema: z.object({
      query: z.string().min(3).describe('Pergunta ou trecho a buscar semanticamente'),
      base_ids: z.array(z.number().int().positive()).optional()
        .describe('IDs das bases para filtrar; vazio = busca em todas'),
      limit: z.number().int().min(1).max(20).default(8)
        .describe('Quantidade máxima de chunks a retornar'),
      threshold: z.number().min(0).max(1).default(0.7)
        .describe('Similaridade mínima de cosseno (0-1)'),
    }),
    handler: async (args) => {
      try {
        const { query, base_ids, limit, threshold } = args as {
          query: string;
          base_ids?: number[];
          limit: number;
          threshold: number;
        };
        const embedding = await gerarEmbedding(query);
        const supabase = createServiceClient();
        const { data, error } = await supabase.rpc('match_knowledge', {
          query_embedding: embedding as unknown as string,
          filter_base_ids: base_ids ?? null,
          match_count: limit,
          match_threshold: threshold,
        });
        if (error) throw error;
        const resultados = data ?? [];
        return {
          content: [
            {
              type: 'text',
              text: `${resultados.length} resultados encontrados acima do threshold ${threshold}.`,
            },
          ],
          structuredContent: { resultados },
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : 'Erro na busca');
      }
    },
  });
}
```

- [ ] **Step 22.3: Escrever teste de registro**

Criar `src/lib/mcp/registries/__tests__/conhecimento-tools.test.ts`:

```typescript
import { registerConhecimentoTools } from '../conhecimento-tools';

jest.mock('../../server', () => {
  const registered: Array<{ name: string }> = [];
  return {
    registerMcpTool: jest.fn((tool) => registered.push({ name: tool.name })),
    __getRegistered: () => registered,
  };
});

describe('registerConhecimentoTools', () => {
  it('registra exatamente 2 tools', async () => {
    await registerConhecimentoTools();
    const { registerMcpTool } = require('../../server');
    const calls = (registerMcpTool as jest.Mock).mock.calls.map((c) => c[0].name);
    expect(calls).toEqual(
      expect.arrayContaining(['listar_bases_conhecimento', 'buscar_conhecimento'])
    );
    expect(calls).toHaveLength(2);
  });

  it('todas as tools têm requiresAuth=true e feature=conhecimento', async () => {
    const { registerMcpTool } = require('../../server');
    (registerMcpTool as jest.Mock).mockClear();
    await registerConhecimentoTools();
    const calls = (registerMcpTool as jest.Mock).mock.calls.map((c) => c[0]);
    calls.forEach((tool) => {
      expect(tool.requiresAuth).toBe(true);
      expect(tool.feature).toBe('conhecimento');
    });
  });
});
```

- [ ] **Step 22.4: Rodar testes**

Run: `npm test -- src/lib/mcp/registries/__tests__/conhecimento-tools.test.ts`

Expected: PASS.

- [ ] **Step 22.5: Commit**

```bash
git add src/lib/mcp/registries/conhecimento-tools.ts src/lib/mcp/registries/__tests__/conhecimento-tools.test.ts
git commit -m "feat(mcp): tools listar_bases_conhecimento + buscar_conhecimento"
```

---

### Task 23: Registrar no registry principal e permission map

**Files:**
- Modify: `src/lib/mcp/registries/index.ts`
- Modify: `src/lib/mcp/registry.ts`
- Modify: `src/lib/mcp/permission-map.ts`

- [ ] **Step 23.1: Adicionar export ao barrel**

Inspecionar `src/lib/mcp/registries/index.ts` e adicionar:

```typescript
export { registerConhecimentoTools } from './conhecimento-tools';
```

(Local exato: ao lado dos outros exports `register*Tools`. Manter ordem alfabética se for o padrão.)

- [ ] **Step 23.2: Importar e chamar no registry principal**

Em `src/lib/mcp/registry.ts`:
1. Adicionar `registerConhecimentoTools` à lista de imports do `./registries` (segue o padrão dos outros).
2. Adicionar a chamada na função que registra todas as tools (procurar `registerAllTools` ou similar e adicionar `await registerConhecimentoTools()` perto do final, antes do log).

- [ ] **Step 23.3: Adicionar entradas no permission map**

Inspecionar `src/lib/mcp/permission-map.ts` para entender o formato. Tipicamente é um objeto `{ [toolName]: { roles: string[] } }` ou similar.

Adicionar:

```typescript
listar_bases_conhecimento: { roles: ['authenticated'] },
buscar_conhecimento: { roles: ['authenticated'] },
```

(Adaptar ao formato exato que o arquivo usa.)

- [ ] **Step 23.4: Smoke-test do registro**

Run: `npm run type-check 2>&1 | tail -20`

Expected: nenhum erro relacionado a `mcp/registry`, `permission-map` ou `conhecimento-tools`.

Run: `npm test -- src/lib/mcp/registries`

Expected: PASS.

- [ ] **Step 23.5: Commit**

```bash
git add src/lib/mcp/registries/index.ts src/lib/mcp/registry.ts src/lib/mcp/permission-map.ts
git commit -m "feat(mcp): registra tools de conhecimento no registry e permission map"
```

---

## Phase 8 — Validação final

### Task 24: Lint, type-check, build, RLS lint, validação manual

- [ ] **Step 24.1: Rodar todos os lints**

Run: `npm run lint`

Expected: zero warnings (`--max-warnings=0`).

Run: `npm run lint:rls`

Expected: PASS.

- [ ] **Step 24.2: Type-check**

Run: `npm run type-check`

Expected: zero erros.

- [ ] **Step 24.3: Bateria de testes**

Run: `npm run test:unit -- src/lib/conhecimento src/app/\(authenticated\)/conhecimento src/lib/mcp/registries`

Expected: todos os arquivos relacionados PASS.

- [ ] **Step 24.4: Build**

Run: `npm run build:ci`

Expected: build success, sem warnings novos.

- [ ] **Step 24.5: Aplicar migrations no Supabase (produção/dev — confirmar com usuário antes)**

⚠️ **PARAR e confirmar com o usuário antes deste passo.** A memória diz que `Supabase MCP` aponta para produção. Apply é irreversível.

Opções:
- Via MCP: `apply_migration` com o conteúdo de `supabase/migrations/20260505120000_create_knowledge_bases.sql`
- Via CLI local (se tiver setup local): `supabase db push`
- Via SQL Editor do dashboard

Aplicar AMBAS as migrations:
1. `20260505120000_create_knowledge_bases.sql`
2. `20260505120100_create_conhecimento_bucket.sql`

- [ ] **Step 24.6: Deploy da edge function**

Run: `supabase functions deploy indexar-conhecimento --project-ref <ref>`

Confirmar variáveis de ambiente da edge function: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `OPENAI_EMBEDDING_MODEL` (já vêm das config padrão).

- [ ] **Step 24.7: Validação manual end-to-end**

Em ambiente dev (ou após deploy):
1. Acessar `/conhecimento` como super_admin
2. Criar base "Jurisprudência Teste"
3. Subir um PDF pequeno (ex: súmula em PDF nativo)
4. Confirmar que status passa de `Pendente` → `Indexando` → `Indexado` em ~30s
5. Ir na aba "Buscar" e fazer uma query relacionada ao conteúdo
6. Verificar que retorna chunks com snippet, similaridade e link de download
7. No agente CopilotKit (qualquer tela), perguntar algo que o agente possa querer buscar
8. Inspecionar logs do agente para confirmar uso de `listar_bases_conhecimento` ou `buscar_conhecimento`

- [ ] **Step 24.8: Commit final (se sobrou alguma coisa) e tag**

```bash
git status --short
# Se sobrou algo (ex: package-lock.json), commitar
git log --oneline -20  # revisar histórico
```

---

## Self-Review

**Spec coverage check:**

- ✅ Tabela vetorial separada `knowledge_chunks` com HNSW — Task 1
- ✅ OpenAI text-embedding-3-small reusado via `gerarEmbedding` existente — Task 13, 22
- ✅ Bases globais com permissão super_admin para escrita — RLS na Task 1, checagem em todas as actions
- ✅ Formatos TXT/MD/HTML/PDF/DOCX — Task 5 (extracao-texto), Task 11 (criar-documento)
- ✅ UI módulo `/conhecimento` com 3 tabs — Task 15-20
- ✅ Tools MCP `listar_bases_conhecimento` + `buscar_conhecimento` — Task 22-23
- ✅ Pipeline sob demanda (sem cron) com Server Action → Edge Function — Task 8, 9, 11
- ✅ Bucket Storage privado `conhecimento` — Task 2
- ✅ Realtime subscription para status — Task 21
- ✅ Reindexação manual — Task 12, 17 (botão), 9 (edge processa de novo)

**Placeholder scan:** Sem `TBD`, sem `TODO`, sem "implement later". Todos os steps têm código completo.

**Type consistency:**
- `KnowledgeBase`/`KnowledgeDocument`/`KnowledgeChunk` usados consistentemente entre domain.ts (Task 6), repository.ts (Task 7), actions (Tasks 10-14) e UI (Tasks 15-20).
- `FormatoArquivo` união `'txt'|'md'|'html'|'pdf'|'docx'` usada idênticamente em domain.ts e em `lib/conhecimento/extracao-texto.ts`.
- `dispararIndexacao(documentId)` definida em service.ts (Task 8) e chamada por reindexar-documento.action.ts (Task 12).
- `gerarEmbedding(query)` é chamada em buscar-conhecimento.action.ts (Task 13) e em conhecimento-tools.ts (Task 22) — Step 13.3 verifica o nome real do export.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-05-loja-vetorial-conhecimento.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - Eu disparo um subagente fresco por task, revisando entre tasks. Iteração rápida, contexto isolado.

**2. Inline Execution** - Executar tasks nesta sessão usando executing-plans, com checkpoints para revisão.

**Qual abordagem?**
