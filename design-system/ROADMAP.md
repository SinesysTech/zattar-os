# Design System Roadmap — ZattarOS

> Plano de adequação trimestral do Design System Glass Briefing.
> Baseline: **2026-04-22** · Documento dinâmico, atualizado após cada snapshot.

---

## 1. Baseline atual (2026-04-22, post fix)

Capturado por `npm run audit:design-system -- --save`. Snapshot em [`reports/2026-04-22.md`](./reports/2026-04-22.md).

### Overall score: **C (66/100)** — pós Sprints 1+2+3

**Todos os 8 KPIs estão verdes.** O overall continua 66 porque ainda temos **237 violações no total** (principalmente `bg-white/[1-15]` em components globais fora do escopo admin) e adoption em 36% (meta info é 40%). Subir para B (≥75) requer atacar esses dois.

### KPIs

| Métrica | Current | Meta | Severidade | Status |
|---|---:|---:|:---:|:---:|
| Typography Adoption | **230** | ≥ 200 | warn | ✅ OK |
| GlassPanel Adoption | 126 | ≥ 115 | info | ✅ +11 |
| Manual Composition | 0 | ≤ 0 | **block** | ✅ OK |
| `shadow-xl/2xl` em `(authenticated)/` | 0 | ≤ 0 | **block** | ✅ OK |
| Hardcoded Tailwind Colors | 3 | ≤ 3 | warn | ✅ OK |
| Hex Literals em `(authenticated)/` | **0** | ≤ 9 | warn | ✅ OK |
| Token Documentation Coverage | **95%** | ≥ 95% | warn | ✅ OK |
| CSS Variables in Registry | **100%** | ≥ 99% | warn | ✅ OK |
| Any typed (file %) | **36%** (369/1021) | ≥ 40% | info | +15 pontos |

### Inventário de tokens

| Camada | Contagem |
|---|---:|
| CSS variables primárias em `globals.css` | **202** |
| Registradas em `token-registry.ts` | 202 (100%) |
| Documentadas em `MASTER.md` | 95% |
| Drift (CSS sem registry) | 0 |
| Drift (registry sem CSS) | 0 |
| Aliases Tailwind v4 (`--color-*`, `--radius-lg/md/sm`) — **não contabilizados** | ~140 |
| Tailwind internals (`--tw-*`) — **não contabilizados** | ~8 |

> **Nota de metodologia**: Tailwind v4 gera automaticamente aliases `--color-<name>` a partir do `@theme inline` para produzir utility classes. Esses aliases são derivados e não precisam ser documentados individualmente — o audit os identifica via `isDerivedAlias()` em [`audit-design-system.ts`](../scripts/dev-tools/design/audit-design-system.ts).

### Adoção por componente typed

| Componente | Arquivos (1021 TSX em `(authenticated)/`) | % |
|---|---:|---:|
| `<Heading>/<Text>` | 192 | 19% |
| `<GlassPanel>` | 126 | 12% |
| `<IconContainer>` | 32 | 3% |
| `<PageShell>` | 39 | 4% |
| `<SemanticBadge>` | 51 | 5% |
| **Qualquer typed** | **331** | **32%** |
| Importam `@/lib/design-system` | 48 | 5% |

### Violações (top)

| Regra | Total | Em authenticated |
|---|---:|---:|
| `bg-white/[1-15]` (risco light mode) | 110 | (maioria em components/) |
| Hardcoded bg-* color | 39 | 3 |
| Hex literal | 38 | 12 |
| `border-*` hardcoded | 23 | — |
| `shadow-xl/2xl` | 19 | 6 |
| `text-*` hardcoded | 18 | 5 |
| OKLCH inline em TSX | 8 | — |
| Manual composition | 2 | 2 |

### Top 3 módulos por adoção

| Módulo | Adoção | Violações | Grade |
|---|---:|---:|:---:|
| `entrevistas-trabalhistas` | 90% | 0 | **A** |
| `pangea` | 75% | 0 | B |
| `comunica-cnj` | 73% | 0 | C |

### Bottom 5 módulos (precisam atenção)

| Módulo | Adoção | Violações | Grade |
|---|---:|---:|:---:|
| `contratos` | 62% | 7 | **F** |
| `acervo` | 50% | 0 | D |
| `editor` | 50% | 0 | D |
| `usuarios` | 49% | 0 | D |
| (executar audit completo para lista final) | | | |

---

## 2. Metas trimestrais

### Q2 2026 (abril–junho)

**Tema: Eliminar bloqueadores + expandir registry**

| Objetivo | KPI alvo | Ação |
|---|---|---|
| Zerar Manual Composition | 0 | Refatorar 2 arquivos para `<Heading>` |
| Zerar `shadow-xl` em auth | 0 | Substituir 6 ocorrências por `shadow-lg` |
| Registry cobrir 99% do CSS | ≥ 349 tokens no registry | Adicionar 160 tokens faltantes |
| Documentação cobrir 95% | ≥ 335 tokens em MASTER | Mencionar tokens MD3/portal completos |
| Reduzir hex em auth | ≤ 9 | Migrar kanban stage colors para palette |
| Adoption typography | ≥ 200 | +8 módulos com `<Heading>` |

**Deadline**: 2026-06-30

### Q3 2026 (julho–setembro)

**Tema: Promover adoção nos módulos D/F**

| Objetivo | KPI alvo | Ação |
|---|---|---|
| Adoption typed geral | ≥ 45% | Refatorar `usuarios`, `editor`, `acervo` |
| Adoption GlassPanel | ≥ 140 | Padronizar cards em `financeiro` e `rh` |
| PageShell usage | ≥ 55 | Migrar páginas legacy |
| Module scores | ≥ 80% módulos com grade ≥ C | Auditoria por módulo mensal |
| Violações totais | ≤ 100 | Codemod para migração automática |

**Deadline**: 2026-09-30

### Q4 2026 (outubro–dezembro)

**Tema: Framework sustentável + automação**

| Objetivo | Ação |
|---|---|
| Pre-commit hook | Rodar `audit:design-system --ci` antes de commit |
| CI integration | GitHub Actions step falha PR se score < 70 |
| Snapshot mensal | Gerar `reports/YYYY-MM-01.md` automaticamente |
| Visual regression | Chromatic ou Percy integrado |
| DTCG export | Exportar `tokens.json` compatível com DTCG 2025.10 |
| Tokens Studio sync | Bidirectional sync com Figma |

**Deadline**: 2026-12-31

---

## 3. Plano de ação (sprint-by-sprint)

### Sprint 1 (2026-04-22 → 2026-05-05): **Unblock**

- [ ] Corrigir 2 `Manual Composition` → `<Heading>`
- [ ] Substituir 6 `shadow-xl/2xl` em auth por `shadow-lg`
- [ ] Corrigir 3 `chat/*` arquivos com cores hardcoded
- [ ] Migrar `components/ui/chart.tsx` (shadow-xl)
- [ ] Re-rodar `audit` — target: overall score ≥ 65

### Sprint 2 (2026-05-06 → 2026-05-19): **Registry complete**

- [ ] Adicionar 160 tokens faltantes em `token-registry.ts`
- [ ] Validar cada um tem referência em `MASTER.md`
- [ ] Documentar tokens derivados (`chart-*-soft`, `glow-*`)
- [ ] Atualizar `CLAUDE.md` com número real (353 tokens)
- [ ] Target: `CSS Variables in Registry` ≥ 95%

### Sprint 3 (2026-05-20 → 2026-06-02): **Module refactors**

- [ ] Auditar `contratos` (62%, 7 violações, grade F)
- [ ] Auditar `usuarios` (49%, grade D)
- [ ] Migrar kanban stage colors hardcoded → `--palette-N`
- [ ] Padronizar `mail-display*.tsx` para tokens
- [ ] Target: nenhum módulo grade F

### Sprint 4 (2026-06-03 → 2026-06-16): **Automation**

- [ ] npm script `precommit:design-system` rodando no husky
- [ ] GitHub Action CI obrigatório
- [ ] Snapshot semanal em `reports/`
- [ ] Dashboard SVG do score overall em `design-system/DASHBOARD.svg`
- [ ] Target: cobertura 95% e nenhum drift

### Sprint 5+ (Q3): **Adoption push**

- Rotas por Champion Adoption
- Hackathon DS (1 dia) por módulo

---

## 4. Métricas de acompanhamento

### Diário (automático)

- Snapshot overnight em `reports/`
- Alerta Slack se score cair > 5 pontos

### Semanal (Owner)

- Review `reports/latest.json` vs anterior
- Issue para cada regressão

### Mensal (Adoption Check-in — 45min)

1. Owner apresenta snapshot
2. Champions reportam violações do módulo
3. Decisão: migração vs exceção documentada

### Trimestral (Governance Retro — 90min)

1. Análise de tendência (KPIs 3m)
2. Ajuste de metas para próximo trimestre
3. Retrospectiva: o que funcionou, o que não

---

## 5. Comandos essenciais

```bash
# Rodar auditoria completa
npm run audit:design-system

# Salvar snapshot diário
npm run audit:design-system -- --save

# CI (exit 1 se bloqueado)
npm run audit:design-system -- --ci

# Detalhe de um módulo
npm run audit:design-system -- --module contratos

# Listar violações específicas
npm run audit:design-system -- --violations hardcoded-bg-colors
npm run audit:design-system -- --violations shadow-xl

# Saber onde um token é usado
npm run audit:design-system -- --where --primary
```

---

## 6. Histórico de versões

| Data | Versão MASTER | Score | Nota |
|---|---|---|---|
| 2026-04-06 | 1.0.0 | — | Primeira versão (sem audit) |
| 2026-04-22 (manhã) | 2.0.0 | D (48/100) | Baseline: audit + registry + DTCG hierarchy |
| 2026-04-22 (meio-dia) | 2.0.1 | C (65/100) | Post-fix: 2 blockers zerados + filtro de aliases |
| 2026-04-22 (tarde) | 2.1.0 | C (66/100) | Sprint 1 (Typography): +16 arquivos, meta 200 atingida (208) |
| 2026-04-22 (noite) | **2.2.0** | **C (66/100) — todos 8 KPIs verdes** | **Sprints 2+3: Hex 12→0, Typography 208→230** |

### Sprint 1 — Typography Adoption (2026-04-22)

**Arquivos migrados** (16 total):

- 12 em `ajuda/content/` top-level: assistentes, audiencias, chat, contratos, dashboard, documentos, expedientes, obrigacoes, pecas-juridicas, pericias, pesquisa-juridica, processos
- 4 em `ajuda/content/partes/`: terceiros, representantes, partes-contrarias, clientes

**Padrão aplicado**: `<h1 className="text-3xl font-bold tracking-tight font-heading">` → `<Heading level="page">` + import.

**Resultados**: Typography 192 → 208, any-typed 331 → 347 (32% → 34%), score 65 → 66.

### Sprint 2 — Hex Literals Elimination (2026-04-22)

**Estratégia dupla**: classificar (legítimo vs migrável), depois ALLOWED_OFFENDERS + migração para tokens.

**Ofensores documentados como ALLOWED** (5 ocorrências):
- `mail-display.tsx` + `mail-display-mobile.tsx` — CSS embutido em iframe isolado renderizando HTML de email (cores externas)
- `FieldMappingEditor.tsx` — valor `#000000` persistido no DB como config de campo de assinatura (PDF render)
- `contratos/pipelines/page-client.tsx` — hex como `defaultValues` do form + `placeholder` de input (dado de domínio)

**Hex migrados para tokens** (4 ocorrências):
- `contratos-kanban-view.tsx`: 3× `'#6B7280'` → constante `DEFAULT_STAGE_COLOR = 'var(--palette-18)'`
- `chat-sidebar.tsx`: `hover:bg-[#7c4ddb]` → `hover:bg-primary/90` + `text-white` → `text-primary-foreground` + arbitrary shadow → `shadow-sm`

**Resultados**: Hex em auth 12 → **0** (meta ≤9 bateu com folga de 9).

### Sprint 3 — Ajuda Content Adoption Push (2026-04-22)

**Arquivos migrados** (22 em subdiretórios de `ajuda/content/`):
- `rh/`: equipe, salarios, folhas-pagamento (3)
- `planner/`: tarefas, notas, agenda (3)
- `financeiro/`: visao-geral, plano-contas, orcamentos, dre, contas-receber, contas-pagar, conciliacao (7)
- `configuracoes/`: sistema, perfil, notificacoes (3)
- `captura/`: historico, configuracao, agendamentos (3)
- `assinatura-digital/`: templates, formularios, documentos (3)

**Padrão aplicado**: mesmo codemod do Sprint 1 (38 arquivos total cobertos por essa migração).

**Resultados**:
- Typography Adoption: 208 → **230** (+22)
- Any typed files: 347 → **369** (+22, 34% → 36%)

---

_Documento vivo — atualizar após cada snapshot semanal._
