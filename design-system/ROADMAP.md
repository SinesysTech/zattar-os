# Design System Roadmap — ZattarOS

> Plano de adequação trimestral do Design System Glass Briefing.
> Baseline: **2026-04-22** · Documento dinâmico, atualizado após cada snapshot.

---

## 1. Baseline atual (2026-04-22, post fix)

Capturado por `npm run audit:design-system -- --save`. Snapshot em [`reports/2026-04-22.md`](./reports/2026-04-22.md).

### Overall score: **C (65/100)**

Blocking KPIs **zerados**. Warnings restantes: Typography Adoption (+8 para meta), Hex Literals (+3 para meta).

### KPIs

| Métrica | Current | Meta | Severidade | Status |
|---|---:|---:|:---:|:---:|
| Typography Adoption | 192 | ≥ 200 | warn | WARN (−8) |
| GlassPanel Adoption | 126 | ≥ 115 | info | ✅ +11 |
| Manual Composition | 0 | ≤ 0 | **block** | ✅ OK |
| `shadow-xl/2xl` em `(authenticated)/` | 0 | ≤ 0 | **block** | ✅ OK |
| Hardcoded Tailwind Colors | 3 | ≤ 3 | warn | ✅ OK |
| Hex Literals em `(authenticated)/` | 12 | ≤ 9 | warn | WARN (+3) |
| Token Documentation Coverage | **95%** | ≥ 95% | warn | ✅ OK |
| CSS Variables in Registry | **100%** | ≥ 99% | warn | ✅ OK |

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
| 2026-04-22 | **2.0.0** | **D (48/100)** | Baseline: audit + registry + DTCG hierarchy |

---

_Documento vivo — atualizar após cada snapshot semanal._
