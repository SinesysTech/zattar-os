# Tasks: Remove Chat Legacy Files

## 1. Verificação Pré-Remoção

- [x] 1.1 Confirmar que `src/features/chat/` contém todos os arquivos necessários
- [x] 1.2 Executar type-check para garantir que não há erros relacionados ao chat
- [x] 1.3 Verificar que a página `/chat` funciona corretamente com a nova estrutura

## 2. Atualizar Imports em Consumidores

- [x] 2.1 Buscar arquivos que importam de `@/core/chat` e atualizar para `@/features/chat`
- [x] 2.2 Buscar arquivos que importam de `@/components/modules/chat` e atualizar
- [x] 2.3 Buscar arquivos que importam de `@/components/chat` e atualizar
- [x] 2.4 Buscar arquivos que importam de `@/hooks/modules/chat` e atualizar
- [x] 2.5 Buscar arquivos que importam de `@/app/actions/chat` e atualizar

## 3. Remover Arquivos Legados

- [x] 3.1 Remover diretório `src/core/chat/`
- [x] 3.2 Remover diretório `src/components/modules/chat/`
- [x] 3.3 Remover diretório `src/components/chat/`
- [x] 3.4 Remover diretório `src/hooks/modules/chat/`
- [x] 3.5 Remover arquivo `src/app/actions/chat.ts`
- [x] 3.6 Remover diretório `src/app/api/chat/` (API Routes deprecadas)
- [x] 3.7 Remover arquivo `backend/documentos/services/persistence/chat-persistence.service.ts`
- [x] 3.8 Remover arquivo `src/components/realtime-chat.tsx` (componente legado)

## 4. Validação Pós-Remoção

- [x] 4.1 Executar type-check completo
- [x] 4.2 Verificar que não há imports quebrados
- [x] 4.3 Nenhum erro relacionado ao chat encontrado
