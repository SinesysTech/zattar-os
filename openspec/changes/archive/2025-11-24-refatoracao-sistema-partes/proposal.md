# Refatoração do Sistema de Partes

## Why

O sistema atual de clientes e partes contrárias não reflete adequadamente a estrutura de dados do PJE, bloqueando a implementação da captura automatizada de partes processuais. A estrutura de campos não mapeia diretamente aos dados retornados pela API do PJE, endereços em JSONB dificultam consultas, falta suporte para terceiros interessados, não há tabela de relacionamento processo-partes, e a UI está fragmentada em páginas separadas.

## What Changes

Reestruturação completa do sistema de gestão de partes para alinhar com PJE:

- ✅ Criar tabela `enderecos` normalizada e polimórfica
- ✅ Reestruturar tabelas `clientes` e `partes_contrarias` com 42 campos PJE cada
- ✅ Criar tabela `terceiros` para peritos, MP, etc
- ✅ Criar tabela `processo_partes` (relacionamento N:N)
- ✅ Implementar tipos TypeScript com discriminated union (PF/PJ)
- ✅ Criar serviços de persistência para todas as entidades
- ✅ Implementar API routes com validação Zod
- ✅ Unificar interface em `/partes` com 3 tabs (ClientOnlyTabs para React 19)
- ✅ Implementar busca, filtros, paginação e TableToolbar padronizado
- 🔄 Dialogs CRUD (criação/edição) - pendente para mudança futura
- 🔄 Testes E2E completos - pendente

## Impact

### Affected Specs
- **Modified**: `clientes`, `clientes-frontend`
- **New**: `partes-contrarias`, `enderecos`, `terceiros`, `processo-partes`, `frontend-partes`

### Affected Code
- Database: migrations em `supabase/migrations/`
- Backend: `backend/partes/`, `backend/types/partes/`
- Frontend: `app/(dashboard)/partes/`
- APIs: `/api/partes/partes-contrarias`, `/api/partes/terceiros`
