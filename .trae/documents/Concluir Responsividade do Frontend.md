## Estado Atual
- Fases 1–8 concluídas com componentes centrais prontos: `ResponsiveTable`, `ResponsiveGrid`, `ResponsiveFormLayout`, `ResponsiveDialog`, `ResponsiveContainer`, além dos hooks `useViewport`, `useBreakpoint`, `useOrientation`.
- Migrações de listagens: `/processos` e `/contratos` usam `ResponsiveTable`. Há divergência de status em `/audiencias` e filtros; será consolidado na Etapa 1.
- Chat possui responsividade básica, mas carece de regras de orientação e property-tests completos.
- A partir das Fases 9–12, pendências concentram-se em orientação, acessibilidade responsiva, testes E2E/performance/a11y e documentação.

## Pendências Principais
- Propriedades de Chat (Properties 44–47) e checkpoint da Fase 6.
- Orientação (Properties 62–66) aplicada em páginas críticas e componentes.
- Acessibilidade responsiva (Properties 67–71): ARIA, teclado, foco, touch targets.
- E2E Playwright, auditorias Lighthouse e integração `@axe-core/playwright`.
- Documentação de componentes/hooks, guia e checklist de responsividade.

## Plano de Execução
### Etapa 1: Consolidar Listagens Restantes
- Confirmar/migrar `/audiencias` para `ResponsiveTable` onde aplicável:
  - `app/(dashboard)/audiencias/components/audiencias-content.tsx`
- Migrar `/partes/clientes`:
  - `app/(dashboard)/partes/components/clientes-tab.tsx`
- Migrar `/usuarios` mantendo alternância tabela/grid:
  - `app/(dashboard)/usuarios/page.tsx`
- Padronizar `priority`, `sticky`, `cardLabel`, `mobileLayout`, `rowActions` em todas as colunas.
- Validar filtros responsivos (FilterPanel + Sheet) e compact pagination.

### Etapa 2: Orientação (Fase 9)
- Introduzir `useOrientation` em containers de página para regras por orientação:
  - Formulários: em landscape mobile usar até 2 colunas.
  - Chat: em landscape mobile mostrar rooms + messages simultâneos quando espaço permitir.
  - Dashboard: aumentar colunas via `ResponsiveGrid`.
  - Preservar `scroll position` e estado ao rotacionar.
- Escrever property-tests (Properties 62–66) cobrindo reflow, ajuste, otimização de forms, preservação de estado e mídia em landscape.

### Etapa 3: Chat (Fase 6 complementada)
- Integrar `useOrientation` e melhorar navegação:
  - `app/(dashboard)/chat/page.tsx`
  - `components/chat/chat-interface.tsx`
- Otimizar message bubbles e attachments para telas estreitas.
- Garantir input visível acima do teclado, com altura mínima adequada.
- Property-tests (Properties 44–47) para views separadas, navegação, otimização de bubbles e anexos.

### Etapa 4: Acessibilidade Responsiva (Fase 10)
- ARIA e roles em componentes:
  - Sidebar, Dialog, Table, FilterPanel, Breadcrumb.
- Anúncio de estados (menus colapsáveis, sheet/drawer) e foco visível.
- Navegação por teclado em `ResponsiveDialog`, `ResponsiveTable` (modo cards), Sidebar mobile.
- Auditar touch targets ≥ `44x44` em buttons, selects, date picker cells, checkboxes/radios.
- Testes de propriedades (Properties 67–71) e verificação com `@axe-core/playwright`.

### Etapa 5: E2E, Performance e A11y (Fase 11)
- Expandir Playwright para fluxos críticos em mobile: login, criação de processo, edição de documento, chat, upload.
- Testes de resize e orientação durante uso; preservação de estado e scroll.
- Auditorias Lighthouse em `/dashboard`, `/processos`, `/documentos`, `/chat`, `/audiencias`.
- Otimizar CWV: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- Code splitting por rotas, lazy loading e análise de bundle.

### Etapa 6: Documentação (Fase 12)
- Criar READMEs em `components/ui/` para:
  - `ResponsiveTable`, `ResponsiveGrid`, `ResponsiveDialog`, `ResponsiveFormLayout`, `ResponsiveContainer`, `ResponsiveFilterPanel`.
- Documentar hooks: `useViewport`, `useBreakpoint*`, `useOrientation*`.
- Guia de responsividade: breakpoints Tailwind, mobile-first, touch targets, performance, acessibilidade e checklist.

### Etapa 7: Finalização
- Code review e consistência de naming/estruturas.
- Otimizações de performance (memoização, evitar re-renders), limpeza de código.
- Testes em dispositivos reais (iOS/Android), revisão de documentação e aprovação final.

## Critérios de Aceitação
- Todos os requisitos (1–15) cobertos por implementações e testes (unitários, propriedade, E2E, a11y).
- Chat e orientação com propriedades validadas (44–47, 62–66).
- Acessibilidade com `@axe-core/playwright` sem issues críticos nas páginas principais.
- CWV dentro das metas e auditorias Lighthouse sem regressões.
- Documentação e guia publicados no repositório.

## Observações
- Há divergências entre `migration-progress.md` e o estado atual do código. A Etapa 1 consolidará o status real de `/audiencias` e filtros, padronizando o uso de `ResponsiveTable` e `FilterPanel`. Ao confirmar o plano, estas verificações serão executadas e alinhadas com os requisitos.