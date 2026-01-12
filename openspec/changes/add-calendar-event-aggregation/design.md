## Context
A aplicação possui múltiplas visualizações temporais por módulo (ex.: Audiências mês/ano; Obrigações calendário; um sandbox de Expedientes), mas a rota global `/app/calendar` ainda é um template com dados mockados.

Há também duplicidade estrutural: `src/app/app/calendar` (rota) e `src/features/calendar` (feature) com barrel vazio.

## Goals / Non-Goals
- Goals
  - Definir um **modelo canônico** de evento da Agenda global.
  - Agregar eventos de múltiplas fontes de forma consistente e performática.
  - Permitir filtro por origem e navegação (deep-link) para o módulo dono do evento.
  - Manter o UI atual do calendário, mas alimentado por dados reais.

- Non-Goals (MVP)
  - Persistência/CRUD de “eventos livres” (sem entidade origem).
  - Edição inline de eventos de domínio (ex.: audiência) via Agenda.
  - Sincronização com calendários externos (iCal/Google).

## Decisions
### Decision: Evento canônico da Agenda
Criar um tipo canônico `UnifiedCalendarEvent` com:
- `id`: string (estável por origem)
- `title`: string
- `startAt`, `endAt`: ISO string (timezone-safe)
- `allDay`: boolean
- `source`: enum (`audiencias|expedientes|obrigacoes|...`)
- `sourceEntityId`: string|number
- `url`: string (rota interna para abrir a entidade)
- `responsavelId?`: number
- `color?`: string (derivada por origem/status)
- `metadata?`: JSON serializável (somente o necessário para UI)

O UI existente pode adaptar `UnifiedCalendarEvent` -> `CalendarEvent` (com `Date`) apenas na borda do client.

### Decision: Agregação via Service Layer
Implementar `src/features/calendar/service.ts` com uma função tipo:
- `listarEventosPorPeriodo({ start, end, sources? })`

Essa função chama serviços/repositórios existentes:
- Audiências: `features/audiencias/service` (já suporta filtros de data)
- Expedientes: `features/expedientes/service` (filtrar por prazo/intervalo)
- Obrigações: preferir `features/obrigacoes/service|actions` (ajustar se necessário) para listar por período

Executar fetch **em paralelo** e aplicar normalização + ordenação.

### Decision: Integração com /app/calendar
- `/app/calendar` vira um Server Component que busca os eventos agregados e renderiza um Client Component do calendário.
- MVP read-only: cliques levam ao `url` da entidade; criação/edição do template fica desabilitada ou vira “evento livre” futuro.

## Risks / Trade-offs
- Duplicidade de implementações de calendário pode confundir; mitigação: direcionar o desenvolvimento para `features/calendar` e manter `app/app/calendar` como thin route.
- Performance em períodos longos; mitigação: limitar intervalo (ex.: mês) e adicionar paginação/filtros por origem.

## Migration Plan
1. Introduzir tipos e service agregador no feature `calendar`.
2. Implementar adaptadores por origem (audiencias/expedientes/obrigacoes).
3. Atualizar `/app/calendar` para consumir agregação.
4. (Opcional) Remover ou desativar o modo “sampleEvents”.

## Open Questions
- A Agenda global deve suportar “eventos livres” persistidos no banco? (provável sim, mas fora do MVP)
- Qual a fonte de verdade para obrigações no calendário (parcelas vs obrigação em si)?
- Quais permissões granularizadas aplicam na Agenda (por módulo ou uma permissão `calendar:listar`)?
