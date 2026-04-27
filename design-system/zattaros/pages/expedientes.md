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

- Número do processo em cards e tabelas: `.text-mono-num` (Geist Mono, 10px, tabular-nums) — **classe canônica**, não `text-[11px]` nem `font-mono text-xs` avulso.
- Título de página: `PageShell` cuida do `.text-page-title`. Não declarar heading manualmente.
- Prazos críticos (vencidos): usar `SemanticBadge` com `expediente_status`, **não** colorir o texto diretamente.
- Labels ALL-CAPS de seção dentro de cards (ex: "Descrição", "Observações"): `.text-overline` — não usar `text-[9px] uppercase` avulso.
- Contadores de seção (ex: "3" ao lado de "Vencidos"): `.text-mono-num` — não usar `text-[10px] tabular-nums` avulso.
- Textos auxiliares (órgão, informações secundárias): `.text-caption` (13px) — não usar `text-[11px]` avulso.
- Listagem (GlassRow): tipografia inline seguindo padrão canônico (`text-label`, `text-caption`, `text-micro-badge`) — **não** usar os componentes `<Heading>` / `<Text>` nos rows.

---

## Quadro / Mission Control — padrão canônico

**Arquivo:** [`expedientes-control-view.tsx`](../../../src/app/(authenticated)/expedientes/components/expedientes-control-view.tsx)

A view `quadro` agrupa expedientes por urgência em um grid de cards operacionais. É a superfície de maior densidade do módulo.

### Subcomponentes

| Componente | Responsabilidade |
|---|---|
| `QueueCard` | Card individual de expediente — identificação, urgência, corpo e ações |
| `SectionHeader` | Cabeçalho de grupo por urgência (ícone + label + contador) |
| `DetailPanel` | Painel lateral de detalhes (desktop, `lg:` only) — edição inline de campos-chave |

### Hierarquia de informação do QueueCard

```
┌─ Header ─────────────────────────────────────────────────────┐
│  UrgencyDot   Tipo (sem ícone, showIcon=false)  prazo (mono) │
├─ Identificação ──────────────────────────────────────────────┤
│  Parte Autora vs Parte Ré  (text-sm font-semibold)           │
│  TRT2 · 1º Grau · 0000000-00.0000.0.00.0000  (text-mono-num)│
│  Vara / Órgão julgador  (text-caption)                       │
├─ Corpo — condicional: só se há conteúdo ─────────────────────┤
│  DESCRIÇÃO  (text-overline)                                  │
│  [texto editável inline]                                     │
│  OBSERVAÇÕES  (text-overline)                                │
│  [texto editável inline]                                     │
├─ Footer — sempre visível ────────────────────────────────────┤
│  [Baixar]  [Detalhes]                        [Avatar usuário]│
└──────────────────────────────────────────────────────────────┘
```

### Regras específicas do QueueCard

1. **Corpo vazio = seção oculta.** A seção de descrição/observações só renderiza quando `expediente.descricaoArquivos` ou `expediente.observacoes` tem valor. Não exibir placeholder de "Sem descrição — clique para adicionar" no card — isso quebra a densidade compact. A edição acontece via `DetailPanel` ou dialog completo.

2. **Urgência via border-left + UrgencyDot, nunca via cor de texto isolada.** A cor do prazo countdown usa `URGENCY_TEXT_CLASS` (tokens semânticos: `text-destructive/80`, `text-warning/80`, etc.), mas como reforço — nunca como único indicador.

3. **Linha de identificação legal unificada.** TRT, grau e número do processo ficam em **uma única linha** `.text-mono-num` no formato `TRT2 · 1º Grau · 0000000-00.0000.0.00.0000`. A vara/órgão fica na linha seguinte (`.text-caption`). Não usar "Nº" como prefixo; não usar badges para TRT/grau no QueueCard.

4. **Partes com peso semântico primário.** `font-semibold` (não `font-medium`) nas partes, pois são a identificação primária do card quando não há tipo definido.

5. **Tipo sem ícone no QueueCard.** `TipoTriggerContent` aceita `showIcon={false}` — usar sempre assim no header do QueueCard. O ícone Tag é adequado apenas em contextos de edição (DetailPanel, dialog).

6. **SectionHeader usa `<h3>` direto, nunca `<Heading>`.** O componente Heading tem estilos próprios que seriam sobrescritos — usar `<h3 className="text-overline">` para seções de agrupamento operacional.

7. **Contador de seção mono.** O número ao lado do label de urgência (ex: "3" em "Vencidos 3") usa `.text-mono-num`.

8. **Footer sempre visível com ações fixas.** Botões "Baixar" e "Detalhes" ficam sempre visíveis no footer esquerdo — sem `group-hover:flex`. Avatar do responsável fica sempre visível na extremidade direita. Não usar badges de TRT/grau no footer do QueueCard.

9. **DetailPanel** usa `GlassPanel depth={2}` e é sticky (`top-4`). Exibido apenas em `lg:`. Em mobile, as ações "Baixar" e "Detalhes" estão fixas no footer do card.

### Agrupamento por urgência

| Seção | Condição | Cor de acento |
|---|---|---|
| Vencidos | `prazoVencido || diasRestantes < 0` | `text-destructive` |
| Vence hoje | `diasRestantes === 0` | `text-warning` |
| Próximos 3 dias | `diasRestantes <= 3` | `text-primary` |
| No prazo | `diasRestantes > 3` | `text-muted-foreground/60` |
| Sem prazo | `diasRestantes === null` | `text-muted-foreground/40` |

Seções sem itens são filtradas (`.filter(s => s.items.length > 0)`).

### Layout responsivo

- **Sem seleção:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **Com item selecionado:** `grid-cols-1 sm:grid-cols-2` (dá espaço ao DetailPanel)
- **DetailPanel:** `lg:grid-cols-[1fr_380px]`, hidden em mobile

### Anti-padrões específicos do Quadro

- Mostrar seções "Descrição" e "Observações" mesmo quando vazias — quebra a densidade compact
- Usar `<Heading level="subsection">` e sobrescrever todos os estilos via `className` — usar `<h3>` direto
- Usar `text-[Xpx]` avulso onde existe classe canônica (`.text-overline`, `.text-mono-num`, `.text-caption`)
- Exibir badges de TRT e grau no footer do QueueCard — a informação já aparece na linha de identificação legal
- Usar `group-hover:flex` para ocultar ações primárias ("Baixar", "Detalhes") — ações de alto uso devem ser sempre visíveis
- Renderizar ícone Tag no header do QueueCard — usar `showIcon={false}` em `TipoTriggerContent` no contexto de card
- Separar TRT, grau e número do processo em campos distintos no card — devem compor uma única linha `.text-mono-num`

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
