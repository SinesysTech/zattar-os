# Proposta: Backend para Notas (app/(dashboard)/notas) + PT-BR + Sidebar

**Status**: draft  
**Autor**: GPT-5.2 (Cursor)  
**Criado**: 2026-01-03  

## Why

Já existe um front-end completo em `src/app/(dashboard)/notas`, porém ele ainda está conectado a dados mock (`data.ts`) e contém imports/textos do template antigo (`/apps/notes`). Isso impede uso real em produção (sem persistência, sem multiusuário, sem segurança, sem CRUD).

## What Changes

### 1) Banco de dados (Supabase / Postgres)

- Evoluir a tabela existente `public.notas` (já declarada em `supabase/schemas/23_dashboard.sql`) para suportar o contrato do front atual:
  - arquivamento
  - tipo da nota (`text | checklist | image`)
  - itens do checklist (jsonb)
  - imagem (url/path)
  - título/conteúdo compatíveis com o editor (HTML/string)
- Criar tabelas para etiquetas (labels) e vínculo nota↔etiqueta (muitos-para-muitos), mantendo `usuario_id` como “dono”.
- Manter RLS habilitado e policies permissivas alinhadas ao padrão do projeto (service_role full access + authenticated somente próprias linhas via `public.usuarios.auth_user_id`).

### 2) Backend dentro de `app/(dashboard)/notas` (padrão kanban/tarefas)

Adicionar as camadas seguindo o padrão já adotado em `kanban/`:

- `domain.ts`: schemas Zod e tipos (entrada/saída) para notas e etiquetas
- `repository.ts`: persistência via `createDbClient()` (secret key) com filtros explícitos por `usuario_id`
- `service.ts`: regras de negócio e validação, montagem do payload consumido pela UI
- `actions/notas-actions.ts`: Server Actions via `authenticatedAction` + `revalidatePath('/notas')`

### 3) Front-end (sem “re-templating”)

- Preservar os componentes e layout como estão, fazendo apenas adaptações necessárias para:
  - corrigir imports que ainda apontam para o template antigo
  - trocar dados mock por dados vindos do backend (SSR inicial + interações via actions)
  - traduzir todos os textos/labels para PT-BR
  - atualizar `metadata` (título/descrição/canonical) para `/notas`

### 4) Sidebar

- Adicionar item “Notas” em `src/components/layout/app-sidebar.tsx` apontando para `/notas`.

## Impact

### Specs afetadas

- **ADDED**: `notas` (nova capacidade funcional do dashboard)

### Código afetado (alto nível)

- `src/app/(dashboard)/notas/*` (backend + adaptação de consumo)
- `supabase/schemas/23_dashboard.sql` (e/ou novo arquivo incremental para o módulo de notas, se preferirmos separar)
- `src/components/layout/app-sidebar.tsx` (novo item de navegação)

## Riscos / Considerações

- Já existe uma tabela `public.notas` (modelo simples: `titulo`, `conteudo`, `cor`, `fixada`). A proposta é **evoluir** o schema para suportar o front atual sem quebrar compatibilidade (novas colunas no final, mantendo colunas antigas).
- Upload de imagem: decidir entre (a) armazenar apenas URL/path na tabela e fazer upload em Storage em etapa posterior, ou (b) implementar bucket/policies agora.


