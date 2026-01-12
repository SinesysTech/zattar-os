# Change: Add unified event aggregation to /app/calendar

## Why
Hoje a rota `/app/calendar` usa eventos mockados em memória e não reflete eventos reais do sistema (Audiências, Expedientes, Obrigações, etc.). Isso impede que a Agenda funcione como “fonte única” de visão temporal para o escritório.

## What Changes
- Adiciona a capability **calendar** (Agenda global) com requisitos formais de agregação de eventos por período.
- Cria um modelo unificado de evento (metadados de origem + deep-link para entidade).
- Implementa uma camada de agregação que reúne eventos de múltiplos módulos (inicialmente: Audiências, Expedientes, Obrigações).
- Atualiza `/app/calendar` para consumir eventos agregados (read-only no MVP), mantendo o UI existente.

## Scope (MVP)
- **Inclui:** Listagem unificada por período, filtro por origem, navegação para entidade origem.
- **Não inclui:** CRUD completo de “eventos livres” persistidos, sincronização bidirecional (ex.: editar audiência pelo calendário), importação iCal/Google.

## Impact
- Affected specs:
  - `calendar` (nova)
  - Potenciais deltas futuros: `audiencias`, `expedientes`, `notifications` (apenas se adicionarmos eventos/integrações novas)
- Affected code (expected):
  - `src/app/app/calendar/*`
  - `src/features/calendar/*` (novo/expandido)
  - `src/features/audiencias/*` (consumo de service/repository existente)
  - `src/features/expedientes/*`
  - `src/features/obrigacoes/*`

## Risks / Notes
- Existem hoje duas implementações de calendário (um template em `src/app/app/calendar` e um esqueleto em `src/features/calendar`). Este change define um caminho único: `/app/calendar` deve ser “powered by” `src/features/calendar`.
- Atenção a performance: agregação pode envolver queries grandes; MVP deve limitar período e usar fetch paralelo.
