# Tasks: Remove Chat Legacy Files

## 1. Verificação Pré-Remoção

- [ ] 1.1 Confirmar que `src/features/chat/` contém todos os arquivos necessários
- [ ] 1.2 Executar type-check para garantir que não há erros relacionados ao chat
- [ ] 1.3 Verificar que a página `/chat` funciona corretamente com a nova estrutura

## 2. Atualizar Imports em Consumidores

- [ ] 2.1 Buscar arquivos que importam de `@/core/chat` e atualizar para `@/features/chat`
- [ ] 2.2 Buscar arquivos que importam de `@/components/modules/chat` e atualizar
- [ ] 2.3 Buscar arquivos que importam de `@/components/chat` e atualizar
- [ ] 2.4 Buscar arquivos que importam de `@/hooks/modules/chat` e atualizar
- [ ] 2.5 Buscar arquivos que importam de `@/app/actions/chat` e atualizar

## 3. Remover Arquivos Legados

- [ ] 3.1 Remover diretório `src/core/chat/`
- [ ] 3.2 Remover diretório `src/components/modules/chat/`
- [ ] 3.3 Remover diretório `src/components/chat/`
- [ ] 3.4 Remover diretório `src/hooks/modules/chat/`
- [ ] 3.5 Remover arquivo `src/app/actions/chat.ts`
- [ ] 3.6 Remover diretório `src/app/api/chat/` (API Routes deprecadas)
- [ ] 3.7 Remover arquivo `backend/documentos/services/persistence/chat-persistence.service.ts`

## 4. Validação Pós-Remoção

- [ ] 4.1 Executar type-check completo
- [ ] 4.2 Testar funcionalidade do chat manualmente
- [ ] 4.3 Verificar que não há imports quebrados
