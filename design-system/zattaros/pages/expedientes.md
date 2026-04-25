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
- Listagem (GlassRow): tipografia inline seguindo padrão canônico (`text-label`, `text-caption`, `text-micro-caption`, `text-micro-badge`) — **não** usar os componentes `<Heading>` / `<Text>` nos rows (o padrão majoritário do sistema é inline).

---

## Divergências específicas do módulo (backlog do módulo)

Itens identificados nas duas rodadas de auditoria. Todos endereçados.

### 1. `expedientes-glass-list.tsx` divergia do padrão canônico de lista — RESOLVIDO

Auditoria comparativa vs. `audiencias`, `pericias`, `captura`, `contratos`, `documentos` identificou divergências em **tipografia, densidade e organização** — tornando a lista de expedientes visualmente destoante do resto do sistema.

**Divergências originais detectadas:**

| Eixo | Expedientes (antes) | Padrão majoritário |
|---|---|---|
| Wrapper | `GLASS_DEPTH[1]` (glass-widget bg-transparent) | `border border-border/60 bg-card` inline |
| Título do row | `<Heading level="card">` (~14px, tag h3) | `text-label font-semibold` inline (audiencias) |
| Textos secundários | `<Text variant="caption">` componentizado | `text-caption` inline |
| Coluna temporal | Fixa em 200px (`grid-cols-[200px_...]`) | `w-22` (~88px) como audiencias |
| Layout | Grid 4-colunas com expansão ao hover | Flex 2-seções com footer fixo |
| Edição de campos | `ExpedienteTextEditor` em área `group-hover:grid hidden` | Edição sempre visível no footer |

**Refatoração aplicada** (`src/app/(authenticated)/expedientes/components/expedientes-glass-list.tsx`):

1. Wrapper migrado para `'group w-full text-left rounded-2xl border border-border/60 bg-card p-4'` + hover `hover:border-border hover:shadow-[...] hover:-translate-y-px` (idêntico a audiencias).
2. Removidos `GLASS_DEPTH`, `URGENCY_DOT`, `<Heading>`, `<Text>` — mantido apenas `URGENCY_BORDER` e `URGENCY_COUNTDOWN` (compatíveis com pericias).
3. Layout `flex items-start gap-4` com coluna temporal `w-22 shrink-0` (data fatal + label "Fatal" + countdown/vencido).
4. Main info em 3 linhas compactas: L1 (tipo como `h3 text-label font-semibold` + flags), L2 (partes com `×`), L3 (classe · processo · TRT · grau · órgão · ciência).
5. Footer sempre visível (`mt-2.5 pt-2.5 border-t border-border/50`) com ícones `FileText`/`MessageSquare`, descrição e observações editáveis lado a lado, responsável e botão concluir.
6. Expansão ao hover **removida**. Arquivo reduzido de 513 → 372 linhas.

### 2. Diálogos de visualização usando `DialogFormShell` — MANTIDOS (exceção autorizada)

Análise detalhada confirmou que **ambos têm mutação inline embutida**:

- `expediente-detalhes-dialog.tsx`: possui `PrazoEditor` que dispara `actionAtualizarExpediente` dentro do diálogo.
- `expediente-visualizar-dialog.tsx`: possui `ExpedienteTipoPopover`, `ExpedienteResponsavelPopover`, `ExpedientePrazoPopover` e `ExpedienteTextEditor` — todos editáveis.

Por isso caem na exceção autorizada do Master (*"se o diálogo tem ações de mutação... mantém-se `DialogFormShell`"*) e **permanecem como `DialogFormShell`**. Nenhuma ação requerida.

Regra derivada para o módulo: se futuramente surgir um diálogo **puramente read-only** (sem popovers de edição nem ações de mutação), usar `DialogDetailShell` + `DetailSection`.

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
