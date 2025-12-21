# Tasks: Refatorar Layout do Módulo de Audiências

## 1. Consolidação de Tipos e Domain

- [ ] 1.1 Consolidar tipos em `domain.ts` - adicionar TipoAudiencia, UseAudienciasResult, AudienciasPaginacao
- [ ] 1.2 Remover `src/features/audiencias/types/ai-agent.types.ts`
- [ ] 1.3 Remover `src/types/sinesys/audiencias.ts`
- [ ] 1.4 Atualizar imports em todos os arquivos do módulo
- [ ] 1.5 Atualizar barrel export em `index.ts`

## 2. Migração de Layout Base

- [ ] 2.1 Refatorar `audiencias-content.tsx` para padrão Expedientes (tabs Chrome-style + carrosséis)
- [ ] 2.2 Criar `audiencias-table-wrapper.tsx` (visualização "dia" com DataShell + DataTable)
- [ ] 2.3 Criar `audiencias-toolbar-filters.tsx` (filtros inline com Select components)
- [ ] 2.4 Testar navegação básica entre visualizações

## 3. Visualizações de Calendário

- [ ] 3.1 Refatorar `audiencias-calendar-month-view.tsx` (remover carrossel interno, receber currentDate como prop)
- [ ] 3.2 Refatorar `audiencias-calendar-year-view.tsx` (remover carrossel interno, receber currentDate como prop)
- [ ] 3.3 Remover `audiencias-calendar-week-view.tsx`
- [ ] 3.4 Remover `audiencias-calendar-filters.tsx`
- [ ] 3.5 Testar cada visualização

## 4. Refinamento de Componentes UI

- [ ] 4.1 Revisar `audiencia-card.tsx` para consistência visual
- [ ] 4.2 Revisar `audiencia-status-badge.tsx` para usar design system
- [ ] 4.3 Revisar `audiencia-modalidade-badge.tsx` para consistência
- [ ] 4.4 Revisar `audiencia-detail-sheet.tsx` para layout consistente
- [ ] 4.5 Revisar `nova-audiencia-dialog.tsx` para usar DialogFormShell

## 5. Atualização de Páginas e Rotas

- [ ] 5.1 Atualizar `src/app/(dashboard)/audiencias/page.tsx` (redirecionar para /audiencias/semana)
- [ ] 5.2 Atualizar páginas de visualização (semana, mes, ano, lista) para usar AudienciasContent
- [ ] 5.3 Validar PageShell wrapper e Suspense boundaries
- [ ] 5.4 Validar loading states

## 6. Atualização do Barrel Export e Limpeza

- [ ] 6.1 Atualizar `components/index.ts` com novos componentes e remover obsoletos
- [ ] 6.2 Atualizar `index.ts` principal com exports consolidados
- [ ] 6.3 Remover arquivos de tipos obsoletos (`types/` folder)

## 7. Testes e Validação

- [ ] 7.1 Testar navegação entre visualizações (dia, mês, ano, lista)
- [ ] 7.2 Testar carrosséis funcionando corretamente
- [ ] 7.3 Testar filtros aplicando corretamente
- [ ] 7.4 Testar busca funcionando
- [ ] 7.5 Testar criação e edição de audiência
- [ ] 7.6 Validar responsividade (mobile, tablet, desktop)
- [ ] 7.7 Executar build para verificar erros de TypeScript
