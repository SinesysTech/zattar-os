# Tasks: Backend para Notas (app/(dashboard)/notas)

## 1. Banco de Dados (Declarative Schema)

- [x] **1.1** Definir o modelo final para notas (`tipo`, `is_archived`, `items`, `image_url`)
- [x] **1.2** Evoluir `public.notas` com novas colunas
- [x] **1.3** Etiquetas via campo JSONB `etiquetas` (simplificacao)
- [x] **1.4** N/A - join table simplificada via JSONB
- [x] **1.5** RLS habilitado e policies configuradas

## 2. Backend em `src/app/(dashboard)/notas`

- [x] **2.1** Criar `domain.ts` com Zod schemas
- [x] **2.2** Criar `repository.ts` com queries Supabase
- [x] **2.3** Criar `service.ts` com validacao e montagem do payload
- [x] **2.4** Criar `actions/notas-actions.ts` (authenticatedAction + revalidatePath)
- [x] **2.5** Atualizar `page.tsx` para SSR

## 3. Adaptacoes minimas no Front (mantendo UI)

- [x] **3.1** Corrigir imports do template antigo
- [x] **3.2** Trocar `data.ts` mock por dados vindos do backend
- [x] **3.3** Handlers para criar nota, editar etiquetas, arquivar/excluir

## 4. Traducao PT-BR

- [x] **4.1** Traduzir textos visiveis
- [x] **4.2** Atualizar metadata para `/notas`

## 5. Navegacao

- [x] **5.1** Adicionar item "Notas" na sidebar (`/notas`) - linha 127 em app-sidebar.tsx

> **STATUS FINAL (2026-01-06)**: 100% implementado.
