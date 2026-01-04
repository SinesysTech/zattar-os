# Change: Sistema de Notificações para Usuários

## Why

Atualmente, o sistema não possui um mecanismo de notificações para alertar usuários sobre eventos importantes relacionados a processos, audiências, expedientes e outras entidades atribuídas a eles. Usuários precisam verificar manualmente se há novas atribuições, movimentações ou mudanças, o que pode resultar em atrasos e perda de informações críticas.

## What Changes

- **ADDED**: Tabela `notificacoes` no banco de dados para armazenar notificações de usuários
- **ADDED**: Feature `notificacoes` seguindo arquitetura FSD com domain, service, repository e actions
- **ADDED**: Triggers de banco de dados para gerar notificações automaticamente quando:
  - Processo é atribuído a um usuário (`acervo.responsavel_id`)
  - Audiência é atribuída a um usuário (`audiencias.responsavel_id`)
  - Expediente é atribuído a um usuário (`expedientes.responsavel_id`)
  - Movimentações ocorrem em processos atribuídos
  - Mudanças importantes em entidades atribuídas
- **ADDED**: Componente de notificações atualizado para consumir dados reais do banco
- **ADDED**: Suporte a Realtime para notificações em tempo real via Supabase Realtime
- **ADDED**: Server Actions para marcar notificações como lidas, buscar notificações, etc.

## Impact

- **Affected specs**: Nova capability `notifications`
- **Affected code**: 
  - `src/features/notificacoes/` (nova feature)
  - `src/components/layout/header/notifications.tsx` (atualização)
  - `supabase/schemas/` (nova tabela e triggers)
  - Triggers em `acervo`, `audiencias`, `expedientes` (geração automática)

