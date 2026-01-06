## Context
Existe um template de UI em `src/app/(dashboard)/todo-list-app` com:
- listagem com filtros (status, usuário, prioridade, starred), busca e alternância list/grid
- criação/edição em sheet (React Hook Form + Zod)
- detalhe em sheet (subtasks, comentários, anexos)
- reorder via drag-and-drop (DndKit) persistindo “posição”

O padrão já adotado no projeto para templates similares (ex.: `tarefas`, `kanban`, `notas`) é:
- `domain.ts` (Zod + tipos)
- `repository.ts` (Supabase)
- `service.ts` (validação + regras)
- `actions/*-actions.ts` (authenticatedAction + revalidatePath)
- Tabelas em `supabase/schemas/*.sql` com `usuario_id` + RLS (via vínculo `public.usuarios.auth_user_id`)

## Goals / Non-Goals
- Goals:
  - Persistir todos do usuário com RLS e índices adequados
  - Manter o comportamento do template (CRUD + filtros + reorder + starred)
  - Permitir evolução incremental para anexos em Storage sem armazenar base64 no banco
- Non-Goals:
  - Não migrar/alterar o módulo `tarefas` (a menos que aprovado como “substituição”)
  - Não implementar Realtime nesta primeira entrega (pode ser adicionado depois)

## Decisions
- **Data model**:
  - Criar uma tabela “head” para os itens (`todo_items`) com campos normalizados (status, prioridade, datas, starred, posição).
  - Modelar subtasks e comentários de forma persistente:
    - Opção preferida (v1): tabelas próprias (`todo_subtasks`, `todo_comments`) para permitir update granular e evitar JSONB grande.
  - Anexos:
    - v1: persistir apenas metadados no banco (`todo_files`) e preparar caminho para Storage (bucket) numa etapa posterior.
- **Security**:
  - RLS habilitado em todas as tabelas.
  - Policies para `authenticated` restringindo por `usuario_id` via `public.usuarios.auth_user_id`.
  - Policies para `service_role` permitindo acesso total (padrão atual do projeto).
- **Integration**:
  - Adicionar entrada no `AppSidebar` em “Serviços”.
  - Página passa a buscar dados via service usando `authenticateRequest()`.
- **UI adaptations**:
  - Remover “hardcode” de classes de cor em badges (usar variants do design system / `Badge` variantes).

## Proposed Schema (draft)
> Observação: nomes/tipos podem ser ajustados na aprovação (especialmente “Assigned To”).

### `public.todo_items`
- **id**: `text primary key` com sequence (`TD-0001`)
- **usuario_id**: `bigint not null references public.usuarios(id) on delete cascade`
- **title**: `text not null`
- **description**: `text null`
- **status**: `text not null` com check em `('pending', 'in-progress', 'completed')`
- **priority**: `text not null` com check em `('low', 'medium', 'high')`
- **due_date**: `date null`
- **reminder_at**: `timestamptz null`
- **starred**: `boolean not null default false`
- **position**: `integer not null default 0`
- **created_at/updated_at**: `timestamptz not null default now()`

Índices:
- `(usuario_id)`, `(usuario_id, position)`, `(usuario_id, status)`, `(usuario_id, priority)`, `(usuario_id, starred)`

RLS:
- `authenticated`: somente itens cujo `usuario_id` vincula ao `auth.uid()` via `public.usuarios.auth_user_id`
- `service_role`: acesso total

### `public.todo_subtasks`
- **id**: `text primary key` com sequence (`TDS-0001`)
- **todo_id**: `text not null references public.todo_items(id) on delete cascade`
- **title**: `text not null`
- **completed**: `boolean not null default false`
- **position**: `integer not null default 0`
- **created_at/updated_at**: `timestamptz not null default now()`

Índices:
- `(todo_id)`, `(todo_id, position)`

RLS:
- `authenticated`: permitido apenas se `todo_id` pertencer ao usuário (via `exists (select 1 from public.todo_items ...)`)
- `service_role`: acesso total

### `public.todo_comments`
- **id**: `text primary key` com sequence (`TDC-0001`)
- **todo_id**: `text not null references public.todo_items(id) on delete cascade`
- **body**: `text not null`
- **created_at**: `timestamptz not null default now()`

Índices:
- `(todo_id)`, `(todo_id, created_at)`

RLS:
- mesmo padrão de `todo_subtasks`

### `public.todo_files` (metadados)
- **id**: `text primary key` com sequence (`TDF-0001`)
- **todo_id**: `text not null references public.todo_items(id) on delete cascade`
- **file_name**: `text not null`
- **mime_type**: `text null`
- **size_bytes**: `bigint null`
- **url**/**storage_path**: `text not null` (a decidir na implementação)
- **created_at**: `timestamptz not null default now()`

Índices:
- `(todo_id)`

RLS:
- mesmo padrão de `todo_subtasks`

### Assigned To (decisão pendente)
- Opção A (texto livre): `todo_items.assigned_to text[] not null default '{}'`
- Opção B (usuários reais): tabela `todo_assignees(todo_id, usuario_id)` com RLS via ownership do `todo_items`

## Risks / Trade-offs
- A escolha entre “Assigned To texto livre” vs “usuários reais” impacta o modelo e o UI:
  - Texto livre mantém template quase intacto, mas reduz integração e consistência.
  - Usuários reais melhora integração, mas exige ajuste do formulário e filtros.
- Anexos via Storage exigem políticas de Storage/RLS e tratamento de URLs (pode virar etapa 2).

## Migration Plan
- Criar novas tabelas em `supabase/schemas` (não mexe em dados existentes).
- Deploy do schema.
- Atualizar a página para carregar do banco; manter fallback/seed somente para dev se necessário (decidir na implementação).

## Open Questions
- Confirmar decisão de “Assigned To” e rota final.


