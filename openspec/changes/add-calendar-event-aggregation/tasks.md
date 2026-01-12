## 1. Implementation
- [ ] 1.1 Criar `src/features/calendar/domain.ts` com tipo canônico `UnifiedCalendarEvent` e enums de `source`
- [ ] 1.2 Criar `src/features/calendar/service.ts` com `listarEventosPorPeriodo` (fetch paralelo + ordenação)
- [ ] 1.3 Implementar adaptador Audiências -> `UnifiedCalendarEvent`
- [ ] 1.4 Implementar adaptador Expedientes -> `UnifiedCalendarEvent`
- [ ] 1.5 Implementar adaptador Obrigações -> `UnifiedCalendarEvent`
- [ ] 1.6 Adicionar Server Action `actionListarEventosCalendar` (auth + validação Zod) no feature calendar
- [ ] 1.7 Atualizar `/app/calendar` para consumir a action/service e remover `sampleEvents` (read-only MVP)

## 2. Validation
- [ ] 2.1 Testes unitários do agregador (`src/features/calendar/__tests__/unit/`)
- [ ] 2.2 Rodar `npm run type-check` (ou `npm run type-check:skip-lib` se necessário)
- [ ] 2.3 Rodar `npm run check:architecture`

## 3. Docs
- [ ] 3.1 Documentar no spec `calendar` os requisitos e cenários
