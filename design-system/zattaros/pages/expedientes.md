# Página: Expedientes

> **Override do [MASTER.md](../MASTER.md)**: este arquivo complementa o Master com especificidades do módulo `src/app/(authenticated)/expedientes`. Regras não listadas aqui seguem o Master integralmente.

---

**Rota raiz:** `/app/expedientes`
**Sub-rotas:** `/app/expedientes/lista`, `/quadro`, `/semana`, `/mes`, `/ano`
**Domínio:** intimações, notificações e prazos processuais capturados do PJE / Comunica CNJ ou cadastrados manualmente.
**Referência de regras de negócio:** [RULES.md](../../../src/app/(authenticated)/expedientes/RULES.md)

---

## Estado de Conformidade (auditoria 2026-04-25)

Resultado da varredura automática em todo o módulo:

| Critério | Status |
|---|---|
| Classes CSS legadas `.typography-h1..h4` | 0 ocorrências |
| Componentes React `@deprecated` de `typography.tsx` | 0 ocorrências |
| Classes Tailwind de cor hardcoded (`bg-red-500`, `text-blue-600`, etc) | 0 ocorrências |
| Uso de `SemanticBadge` para status de domínio | Completo (detalhes, lista, visualizar) |
| `PageShell` em `layout.tsx` + todas as sub-rotas | Conforme |
| `DataShell` + `DataTable` na visualização calendário | Conforme |

Conclusão: o módulo **já opera dentro do Master** e não requer débitos tipográficos legados. As divergências abaixo são pontuais e específicas de composição.

---

## Shells e Composição Obrigatória

- `layout.tsx` envelopa todas as rotas com `PageShell` — **não** reenvelopar nas sub-rotas.
- Visões `/semana`, `/quadro`, `/mes`, `/ano`, `/lista` devem passar a visualização via prop a `ExpedientesContent`, não criar shells próprios.
- Tabela principal: `DataShell` + `DataTable` + `DataTableToolbar` (padrão atual em `expedientes-calendar.tsx`).
- Diálogos de criação/edição/baixa/transferência: `DialogFormShell`.
- Diálogos de **visualização pura** (sem formulário): **usar `DialogDetailShell`** — ver divergência #2 abaixo.

---

## Badges Semânticos — categorias relevantes

Subset autorizado de `BadgeCategory` para este módulo (fonte: [variants.ts](../../../src/lib/design-system/variants.ts)):

| Categoria | Uso típico em Expedientes |
|---|---|
| `expediente_status` | Pendente / Baixado / Atrasado — bloco principal de status |
| `expediente_tipo` | Tipo de intimação, prazo, notificação |
| `tribunal` | Chip do TRT de origem (TRT1..TRT24) |
| `grau` | Primeiro grau / Segundo grau / Tribunal superior |
| `priority` | Prioridade processual quando aplicável |
| `status` | Status processual herdado do processo vinculado |

> Qualquer novo estado de domínio (ex: resultado de decisão) deve primeiro ser adicionado em `BadgeCategory` e mapeado em `getSemanticBadgeVariant()` — **nunca** colorir via classes Tailwind hardcoded.

---

## Densidade e Layout

- Visões `lista` e `quadro`: **densidade `compact`** (`data-density="compact"`) — são superfícies operacionais de alta recorrência.
- Visões `semana`, `mes`, `ano`: **densidade `comfortable`** — priorizar respiro e leitura de prazos.
- Skeleton de carregamento em [page.tsx](../../../src/app/(authenticated)/expedientes/page.tsx) deve refletir a estrutura real: header + PulseStrip (4 colunas) + controles + linhas (5-7). Já implementado.

---

## Tipografia específica

- Número do processo em cards e tabelas: `font-mono text-xs` (tabular-nums) — padrão já aplicado em `columns.tsx` e `expedientes-glass-list.tsx`.
- Título de página: `PageShell` cuida do `.text-page-title`. Não declarar heading manualmente.
- Prazos críticos (vencidos): usar `SemanticBadge` com `expediente_status`, **não** colorir o texto diretamente.

---

## Divergências específicas do módulo (backlog do módulo)

Itens identificados na auditoria inicial. Todos endereçados nesta rodada.

### 1. `expedientes-glass-list.tsx` não aplicava glass — RESOLVIDO (Opção B)

O componente tinha "glass" no nome mas usava apenas `bg-card` + `border-border/60`. **Migrado** para `GLASS_DEPTH[1]` (`.glass-widget`) em `GlassRow` e `ListSkeleton`, honrando o nome e alinhando ao sistema de profundidade do Master.

- Arquivo: `src/app/(authenticated)/expedientes/components/expedientes-glass-list.tsx`
- Import adicionado: `import { GLASS_DEPTH } from '@/lib/design-system'`
- Hover ajustado para `hover:border-border/50` (o glass já usa `border-border/20`).

### 2. Diálogos de visualização usando `DialogFormShell` — MANTIDOS (exceção autorizada)

Análise detalhada confirmou que **ambos têm mutação inline embutida**:

- `expediente-detalhes-dialog.tsx`: possui `PrazoEditor` que dispara `actionAtualizarExpediente` dentro do diálogo.
- `expediente-visualizar-dialog.tsx`: possui `ExpedienteTipoPopover`, `ExpedienteResponsavelPopover`, `ExpedientePrazoPopover` e `ExpedienteTextEditor` — todos editáveis.

Por isso caem na exceção autorizada do Master (*"se o diálogo tem ações de mutação... mantém-se `DialogFormShell`"*) e **permanecem como `DialogFormShell`**. Nenhuma ação requerida.

Regra derivada para o módulo: se futuramente surgir um diálogo **puramente read-only** (sem popovers de edição nem ações de mutação), usar `DialogDetailShell` + `DetailSection`.

### 3. Borda `border-border/20` no separador interno — RESOLVIDO

O separador do bloco de expansão no card (ao hover) foi elevado de `border-border/20` → `border-border/40` para garantir visibilidade em light mode.

- Arquivo: `src/app/(authenticated)/expedientes/components/expedientes-glass-list.tsx` (separador `border-t` entre card e área de descrição/observações).

---

## Anti-Padrões específicos

- Colorir prazos vencidos manualmente (`text-red-500`, `bg-amber-100`) — sempre via `SemanticBadge category="expediente_status"`.
- Criar helpers locais como `getExpedienteColor()` — usar `getSemanticBadgeVariant('expediente_status', valor)` diretamente.
- Misturar visualizações (Kanban + calendário + lista) em uma única rota — cada visão tem sub-rota dedicada.
- Criar um quarto tipo de dialog além de form/detail — se surgir necessidade, levar ao Master.

---

## Checklist específico antes de entregar UI de Expedientes

- [ ] `PageShell` está apenas no `layout.tsx` (não duplicado nas sub-rotas)
- [ ] Toda classificação de status usa `SemanticBadge` com categoria de `BadgeCategory`
- [ ] Número do processo usa `font-mono` + `tabular-nums`
- [ ] Diálogos de visualização pura usam `DialogDetailShell`
- [ ] Diálogos de mutação usam `DialogFormShell`
- [ ] Densidade apropriada por visão (compact em lista/quadro, comfortable em calendário)
- [ ] Skeleton de loading espelha a estrutura final da página
- [ ] Zero cores Tailwind hardcoded (`bg-red-*`, `text-green-*`, etc)
- [ ] Zero uso de componentes `@deprecated` de `typography.tsx`

---

## Próximos passos sugeridos

1. Passar para o próximo módulo prioritário — sugestão: **audiencias** (similar em complexidade, com visões múltiplas e badges semânticos) ou **captura** (menor, bom candidato para validar o processo da skill em um módulo estável).
2. Replicar a skill `ui-ux-pro-max` no módulo escolhido para gerar `design-system/zattaros/pages/[modulo].md`.
3. Ao longo da iteração, continuar quitando os débitos técnicos globais do Master (`.typography-h*` legadas, duplicação de `.text-display-1/2`, classe `.glass-depth-3` dedicada).
