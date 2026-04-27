# Audiências — Page Design Spec

> **Projeto:** ZattarOS  
> **Atualizado:** 2026-04-27  
> ⚠️ As regras aqui **sobrescrevem** o MASTER.md. Para tudo não coberto, seguir o Master.

---

## Contexto da Página

Módulo de gestão de audiências jurídicas. Padrão "Mission Control" — trata audiências como missões
com countdown em tempo real, score de preparo e fluxo pós-audiência (debrief).

**Arquivo orquestrador:** `src/app/(authenticated)/audiencias/audiencias-client.tsx`  
**Referência de layout:** `audiencias-client.tsx` + `audiencias-mission-view.tsx`

---

## Estrutura de Página

```
AudienciasClient
├── Header (só em views != quadro)
│   ├── Heading level="page" → "Audiências"
│   └── Text variant="caption" as="p" className="mt-0.5" → subtitle
├── MissionKpiStrip (4 cards: Semana · Próxima · Realizadas · Preparo)
├── InsightBanner type="warning" (se lowPrep.length > 0)
├── View Controls
│   ├── AudienciasFilterBar
│   └── SearchInput + ViewToggle
└── Content (por viewMode)
    ├── quadro → AudienciasMissaoContent (+ header próprio)
    ├── semana → AudienciasSemanaView
    ├── mes   → AudienciasMesView
    ├── ano   → AudienciasAnoView
    └── lista → AudienciasListaView
```

### View Quadro (AudienciasMissaoContent)
O modo quadro tem seu próprio header interno — por isso `AudienciasClient` oculta o header externo
quando `viewMode === 'quadro'`. Isso é intencional e difere do módulo expedientes.

---

## KPI Strip — MissionKpiStrip

4 cards, layout `grid grid-cols-2 lg:grid-cols-4 gap-3`. Padding por card: `px-4 py-3.5`.

| Card | Métrica | Ícone | Cor |
|---|---|---|---|
| Semana | Audiências marcadas esta semana | CalendarDays | primary |
| Próxima | Tempo até a próxima audiência | Clock | warning |
| Realizadas | Finalizadas / total do mês | CheckCircle2 | success |
| Preparo | Score médio de preparo das marcadas | ShieldCheck | primary (dinâmico) |

**Tokens obrigatórios:**
- Label: `text-meta-label` (não `Text variant="micro-caption"` + overrides manuais)
- Valor: `text-kpi-value leading-none tracking-tight` (não `text-xl font-display`)
- Barra: `h-1 rounded-full bg-muted/30` com inner `{color}/25`
- Percentual: `text-micro-badge tabular-nums text-muted-foreground/50`

**Cor dinâmica de preparo:**
```ts
score >= 80 → var(--success)
score >= 50 → var(--warning)
score < 50  → var(--destructive)
```

---

## Componentes Exclusivos do Módulo

### PrepScore / PrepRing
Score de 0-100% calculado por critérios ponderados:
- Responsável (20%), Observações (15%), Tipo (10%)
- URL virtual — só virtual/híbrida (25%), Endereço — só presencial/híbrida (25%), Ata anterior (30%)

Renderizado como ring SVG inline com cor dinâmica (good/warning/danger).

### HearingCountdown
Relogio em tempo real (atualiza a cada 1s):
- `< 15min` → `text-destructive`
- `< 1h` → `text-warning`
- `> 1h` → `text-primary`

### AudienciaListRow
Linha compacta horizontal com: status dot, IconContainer, info principal, data/hora, modalidade,
TRT, prep ring (SVG), countdown/status, chevron.

Tokens usados: `text-caption`, `text-micro-caption`, `text-micro-badge`, `text-mono-num`.

### TimelineAudienciaCard (interno à mission view)
Card na timeline do dia com: coluna de horário, dot+linha, card clicável.
- Horário: `text-caption tabular-nums font-medium`
- Processo: `text-mono-num`
- Partes: `text-micro-caption`
- Badges inline: `text-micro-badge font-semibold px-1.5 py-px rounded-full`

### MissionCard (hero card)
Exibe a próxima audiência com countdown destacado, grid 4-col de informações,
partes envolvidas e checklist de preparo.

---

## Tipografia — Diferenças em Relação ao Expedientes

| Contexto | Audiências | Expedientes | Motivo |
|---|---|---|---|
| Header externo | Só em views != quadro | Sempre visível | Quadro tem header próprio |
| Subtítulo header | `Text variant="caption" as="p" className="mt-0.5"` | Idem | Alinhado pós-correção |
| KPI labels | `text-meta-label` | `text-meta-label` | Alinhado pós-correção |
| KPI valores | `text-kpi-value leading-none tracking-tight` | `text-kpi-value font-bold leading-none tracking-tight` | Alinhado pós-correção |
| KPI padding | `px-4 py-3.5` | `px-4 py-3.5` | Alinhado pós-correção |
| Data de navegação | `text-caption font-medium capitalize` | N/A | Específico da mission view |
| Score de preparo | `text-micro-badge font-bold` (no ring) | N/A | Específico do módulo |

---

## Estados Visuais por Status

| Status | Cor | Opacidade |
|---|---|---|
| Marcada (futura) | `bg-primary/50` (dot) | 100% |
| Em andamento (agora) | `bg-success animate-pulse` | 100% |
| Finalizada | `bg-success/50` (dot) | 55% |
| Cancelada | `bg-destructive/50` (dot) | 55% |
| Passada | `bg-muted-foreground/20` (dot) | 55% |

---

## Modalidades

| Modalidade | Ícone | Label |
|---|---|---|
| virtual | Video | Virtual |
| presencial | Building2 | Presencial |
| hibrida | Sparkles | Híbrida |

---

## Filtros

`AudienciasFilterBar` — filtros por: status (via Tabs), responsável (Meus/Sem responsável/lista),
TRT e modalidade (via dropdowns).

### Status Tabs (filtro de status inline)

O status é exposto como `<TabsList>` com 4 triggers visíveis — NÃO como popover:

```tsx
<Tabs value={filters.status ?? 'todas'} onValueChange={...}>
  <TabsList className="h-8">
    <TabsTrigger value="todas"     className="text-micro-caption gap-1.5 h-7 px-2.5">Todas     <span className="tabular-nums text-muted-foreground/60">{counts.total}</span></TabsTrigger>
    <TabsTrigger value="M"         className="text-micro-caption gap-1.5 h-7 px-2.5">Marcadas  <span ...>{counts.marcadas}</span></TabsTrigger>
    <TabsTrigger value="F"         className="text-micro-caption gap-1.5 h-7 px-2.5">Finalizadas <span ...>{counts.finalizadas}</span></TabsTrigger>
    <TabsTrigger value="C"         className="text-micro-caption gap-1.5 h-7 px-2.5">Canceladas  <span ...>{counts.canceladas}</span></TabsTrigger>
  </TabsList>
</Tabs>
```

- Contagens: `tabular-nums text-muted-foreground/60`
- Altura: `TabsList h-8`, triggers `h-7 px-2.5`
- Valor `null` no estado `filters.status` = trigger "todas" selecionado

### Responsável / TRT / Modalidade

Mantêm o padrão de chips com `FilterDropdownTrigger` + `<Popover>` — são filtros multi-valor
onde dropdown é a UX correta. Estado ativo: `border-primary/20 bg-primary/5 text-primary`

---

## Dialogs

- **Detalhe:** `AudienciaDetailDialog` (DialogFormShell) — nunca Sheet
- **Nova audiência:** `NovaAudienciaDialog` — 5 seções: Jurisdição, Data/Horário, Tipo/Local, Responsável, Observações
- **Editar:** `EditarAudienciaDialog`

---

## View Semana — Day Tabs (TabsTrigger)

Triggers compactos de navegação por dia da semana. **Não** são tiles/cards de painel:

```tsx
<TabsTrigger value={key} className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 min-w-16">
  <span className="text-overline capitalize">{format(day, 'EEE', { locale: ptBR })}</span>
  <div className="flex items-center gap-1">
    <span className="text-caption font-semibold tabular-nums">{format(day, 'd')}</span>
    {count > 0 && <span className="text-micro-badge tabular-nums rounded-full px-1.5 py-px ...">{count}</span>}
  </div>
</TabsTrigger>
```

- Largura mínima: `min-w-16` (não `min-w-40`)
- Badge: `bg-warning/15 text-warning` se `lowPrepCount > 0`, `bg-primary/12 text-primary` se hoje, `bg-muted/60 text-muted-foreground/60` default
- `TabsList` sem `bg-transparent` extra — usar o padrão do componente

---

## View Semana — AudienciaSemanaCard (WeekDayCard)

Segue a arquitetura GlassRow do `expedientes-glass-list.tsx`. Referência canônica:
`src/app/(authenticated)/expedientes/components/expedientes-glass-list.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│ ┌──────────┐                                         │
│ │ HH:mm    │  L1: Tipo (text-label semibold)         │
│ │ HH:mm    │      + Modalidade badge + flags         │
│ │ [Prep%]  │        (Sala, Segredo)                  │
│ └──────────┘  L2: Polo Ativo vs Polo Passivo         │
│               L3: TRT · Grau · Nº · Órgão (mono)    │
│               ─────────────────────────────────────  │
│               [Observações (MessageSquare)]          │
│                                   [Responsável]      │
└─────────────────────────────────────────────────────┘
```

**Coluna esquerda (w-22 shrink-0)**:
- Hora início: `text-caption font-semibold tabular-nums`
- Separador `–`: `text-micro-caption text-muted-foreground/30`
- Hora fim: `text-caption text-muted-foreground/60 tabular-nums`
- PrepScore badge: `text-micro-badge font-semibold rounded-md px-1.5 py-0.5`
  - `bg-success/15 text-success` (≥80), `bg-warning/15 text-warning` (≥50), `bg-destructive/15 text-destructive` (<50)
- Dot `animate-pulse bg-success` se em andamento

**L1 — Tipo + flags** (`flex items-center gap-2`):
- `<h3 className="text-label font-semibold text-foreground leading-tight truncate">`
- Badge modalidade: virtual `bg-info/10 border-info/25 text-info`, presencial `bg-warning/10`, híbrida `bg-primary/10`
- Flag "Sala": `bg-info/10 border-info/25 text-info` (só se URL virtual presente)
- Flag "Segredo": `bg-warning/10 border-warning/25 text-warning`
- Badge "OK" (Finalizada): `bg-success/15 text-success`

**L2 — Partes** (`text-caption font-semibold text-foreground/85`):
- Separador "vs": `text-[9px] font-normal text-muted-foreground/50`

**L3 — Identifiers legais** (`text-mono-num flex flex-wrap gap-x-1.5`):
- `TRT · Grau · NumeroProcesso · Órgão`
- Separadores `text-muted-foreground/30`

**Footer** (`mt-2.5 pt-2.5 border-t border-border/50 flex items-center gap-3`):
- Observações: `<MessageSquare w-3 h-3 text-muted-foreground/60>` + `text-caption line-clamp-1`
- Responsável: `<AudienciaResponsavelPopover>` + `<ResponsavelTriggerContent size="sm">`

**Border-left por estado**:
```ts
isOngoing           → 'border-l-2 border-l-success ring-1 ring-success/20 bg-success/3'
isPast || isFinalizada  → 'opacity-55'
isCancelada         → 'opacity-45'
default             → 'border-border/60'
```

**Classe base**: `rounded-2xl border border-border/60 bg-card p-4 cursor-pointer transition-all hover:border-border hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:-translate-y-px focus-visible:ring-2`

---

## Anti-Padrões Específicos

- ❌ `Text variant="helper"` para subtítulo de página — usar `variant="caption"`
- ❌ `font-display text-xl` para KPI valores — usar `text-kpi-value`
- ❌ `uppercase tracking-wider font-medium` para labels KPI — usar `text-meta-label`
- ❌ `text-sm` / `text-xs` brutos na mission view — usar `text-caption` / `text-micro-caption`
- ❌ `py-3` em GlassPanel de KPI — usar `py-3.5` (alinhado com expedientes)
- ❌ `StatusFilter` como Popover dropdown — usar `<TabsList>` com contagens visíveis
- ❌ `WeekDayCard` como layout flat single-column — usar GlassRow (coluna temporal + L1/L2/L3 + footer)
- ❌ `TabsTrigger` de dia como card-tile (`min-w-40`, multi-linha) — usar tab compacto (`min-w-16`)
