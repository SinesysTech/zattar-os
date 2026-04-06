# Expedientes — Blueprint de Refatoracao

> Sequencia executavel para refatorar o modulo de expedientes pagina por pagina.

**Objetivo:** migrar o modulo para o novo layout operacional sem interromper as views temporais existentes.

---

## 1. Estrategia

Refatorar em camadas:

1. Estrutura e navegacao
2. Nova view de controle
3. Unificacao visual das views existentes
4. Convergencia de detalhe e acoes
5. Testes e polimento

---

## 2. Sequencia arquivo por arquivo

### Fase 1 — Estrutura base

1. `src/app/(authenticated)/expedientes/page.tsx`
   - trocar view inicial para `quadro`
   - redefinir a home do modulo como centro de comando

2. `src/app/(authenticated)/expedientes/quadro/page.tsx`
   - criar rota dedicada para a nova view
   - manter consistencia com `semana`, `lista`, `mes`, `ano`

3. `src/app/(authenticated)/expedientes/components/expedientes-content.tsx`
   - incluir `quadro` no mapeamento de rota
   - customizar opcoes do `ViewModePopover`
   - renderizar `ExpedientesControlView`

4. `src/app/(authenticated)/expedientes/index.ts`
   - exportar a nova view para manter API publica do modulo

### Fase 2 — Nova view Controle

5. `src/app/(authenticated)/expedientes/components/expedientes-control-view.tsx`
   - implementar cockpit principal
   - KPIs, triagem, fila principal, radar lateral

6. `src/app/(authenticated)/expedientes/components/expediente-control-detail-sheet.tsx`
   - implementar inspector lateral persistente
   - expor contexto operacional e CTA de processo

### Fase 3 — Unificacao das views filhas

7. `src/app/(authenticated)/expedientes/components/expedientes-table-wrapper.tsx`
   - injetar KPI strip no topo
   - preparar selecao para futuro inspector lateral compartilhado

8. `src/app/(authenticated)/expedientes/components/expedientes-list-wrapper.tsx`
   - alinhar toolbar e filtros com a linguagem do Controle
   - preparar linha/row para detalhe consistente

9. `src/app/(authenticated)/expedientes/components/expedientes-month-wrapper.tsx`
   - adotar shell visual unificado
   - manter layout master-detail do calendario

10. `src/app/(authenticated)/expedientes/components/expedientes-year-wrapper.tsx`

- alinhar filtros, vazios e feedback visual

### Fase 4 — Convergencia de detalhe e operacao

11. `src/app/(authenticated)/expedientes/components/expediente-detalhes-dialog.tsx`

- convergir para o mesmo contrato de detalhe do inspector

12. `src/app/(authenticated)/expedientes/components/columns.tsx`

- reduzir ruído visual
- aproximar a leitura da linha do modelo do cockpit

13. `src/app/(authenticated)/expedientes/components/expedientes-bulk-actions.tsx`

- alinhar acoes em lote com as filas do Controle

### Fase 5 — Validacao

14. `src/app/(authenticated)/expedientes/__tests__/...`

- adicionar cobertura de roteamento `quadro`
- validar KPIs derivados e selecao de detalhe

---

## 3. Contrato por pagina

### Home / Quadro

- papel: triagem e redistribuicao
- CTA principal: abrir processo e agir no expediente
- foco: risco, dono, classificacao, prazo

### Semana

- papel: execucao diaria
- CTA principal: baixar, ajustar prazo, visualizar documento
- foco: trabalho por dia

### Lista

- papel: densidade operacional e bulk actions
- CTA principal: filtrar, selecionar, processar em massa
- foco: produtividade

### Mes

- papel: previsao proxima
- CTA principal: entender concentracao por dia
- foco: distribuicao de carga

### Ano

- papel: sazonalidade e leitura sistemica
- CTA principal: detectar pads de sobrecarga
- foco: visao macro

---

## 4. Dependencias internas relevantes

- `useExpedientes` como fonte de dados atual
- `GlassPanel` e primitives de dashboard para o novo shell visual
- `DetailSheet` para inspector lateral
- `ViewModePopover` e `ViewType` para navegacao
- `DataShell` para views densas existentes

---

## 5. Riscos de refatoracao

1. Quebrar a expectativa de que `/expedientes` abre em semana.
   Mitigacao: manter `semana` como view explicita e destacar o novo quadro como home operacional.

2. Introduzir sobrecarga cognitiva no cockpit.
   Mitigacao: filas claras, busca unica e radar lateral resumido.

3. Divergir visualmente do resto do produto.
   Mitigacao: usar `GlassPanel`, `TabPills`, `SearchInput`, `ViewToggle` e tokens do design system.

4. Repetir logica de detalhe em dialog e sheet.
   Mitigacao: convergir gradualmente para um contrato unico.

---

## 6. Resultado minimo desta implementacao

- blueprint documentado
- UI-SPEC documentado
- rota `quadro` implementada
- home de expedientes migrada para `quadro`
- selector de visualizacao com `Controle`
- inspector lateral funcional para o item selecionado
