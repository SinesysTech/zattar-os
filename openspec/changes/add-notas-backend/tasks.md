# Tasks: Backend para Notas (app/(dashboard)/notas)

## 1. Banco de Dados (Declarative Schema)

- [ ] **1.1** Definir o modelo final para notas compatível com o front atual (`type`, `is_archived`, `items`, `image`)
- [ ] **1.2** Evoluir `public.notas` (append-only de colunas) e adicionar comentários/índices/constraints
- [ ] **1.3** Criar `public.nota_etiquetas` (labels) com `usuario_id`, `titulo`, `cor`
- [ ] **1.4** Criar `public.nota_etiqueta_vinculos` (join) com FKs e índices
- [ ] **1.5** Habilitar RLS e policies alinhadas ao padrão do projeto (service_role + authenticated own rows)

## 2. Backend em `src/app/(dashboard)/notas`

- [ ] **2.1** Criar `domain.ts` com Zod schemas para:
  - listar notas (filtros: arquivadas, busca)
  - criar/atualizar/arquivar/excluir nota
  - criar/atualizar/excluir etiqueta
- [ ] **2.2** Criar `repository.ts` com queries Supabase (createDbClient) e filtros por `usuario_id`
- [ ] **2.3** Criar `service.ts` com validação e montagem do payload consumido pela UI
- [ ] **2.4** Criar `actions/notas-actions.ts` (authenticatedAction + revalidatePath('/notas'))
- [ ] **2.5** Atualizar `page.tsx` para SSR: autenticar, carregar dados e renderizar `NoteApp` com `initialData`

## 3. Adaptações mínimas no Front (mantendo UI)

- [ ] **3.1** Corrigir imports do template antigo para imports locais em `src/app/(dashboard)/notas/*`
- [ ] **3.2** Trocar `data.ts` mock por dados vindos do backend (inicial via props + mutações via actions)
- [ ] **3.3** Garantir estados/handlers para criar nota, editar etiquetas, arquivar/excluir

## 4. Tradução PT-BR

- [ ] **4.1** Traduzir todos os textos visíveis (sidebar, placeholders, empty-states, tooltips, botões)
- [ ] **4.2** Atualizar metadata (`title`, `description`, `canonical`) para `/notas`

## 5. Navegação

- [ ] **5.1** Adicionar item “Notas” na sidebar (`/notas`)


