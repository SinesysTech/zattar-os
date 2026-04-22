# Design System Governance — ZattarOS

> Como mudanças no Design System são propostas, revisadas e integradas.
> Modelo: **Federated with Central Core** (inspirado em Netguru Best Practices + zeroheight Maturity Model).

---

## 1. Modelo de governança

### Federated + Central Core

```
                         ┌──────────────────────┐
                         │   Design System      │
                         │       OWNER          │
                         │  (1 pessoa, core)    │
                         └──────────┬───────────┘
                                    │ aprova PRs
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
     ┌────────▼────────┐   ┌────────▼────────┐   ┌────────▼────────┐
     │   Adoption      │   │   Adoption      │   │   Adoption      │
     │   Champion      │   │   Champion      │   │   Champion      │
     │   (Financeiro)  │   │   (Processos)   │   │   (Chat+Mail)   │
     └─────────────────┘   └─────────────────┘   └─────────────────┘
              │                     │                     │
     ┌────────▼────────────────────▼─────────────────────▼────────┐
     │                   FEATURE TEAMS (todos os devs)              │
     │         consomem tokens · propõem novos · reportam drift     │
     └──────────────────────────────────────────────────────────────┘
```

### Responsabilidades

| Role | Quem | Responsabilidade |
|---|---|---|
| **DS Owner** | 1 pessoa | Mantém `globals.css`, `tokens.ts`, `MASTER.md`, aprova PRs estruturais |
| **Adoption Champion** | 1 por domínio | Garante que módulo usa tokens, reporta drift, migra quando necessário |
| **Contributor** | Qualquer dev | Consome tokens, propõe novos via workflow §3 |

---

## 2. Princípios de mudança

1. **CSS primeiro** — token só existe quando está em `@theme inline` + `:root`/`.dark` em `globals.css`
2. **Docs simultâneas** — nenhum token é merged sem entrada em `MASTER.md` e `token-registry.ts`
3. **Versionamento semântico** — adições = minor, breaking = major, fixes = patch (em `MASTER.md` header)
4. **Deprecação com prazo** — tokens deprecated têm no mínimo 1 ciclo de sprint de aviso antes da remoção
5. **Audit antes de merge** — PRs de DS rodam `audit:design-system --ci` em CI obrigatório

---

## 3. Workflow de mudança

### 3.1 Adicionar token novo

```
┌─────────────────────────────────────────────────────────────┐
│  PASSO 1 — PROPOR                                           │
│  ──────────────                                              │
│  Abrir issue no formato:                                    │
│                                                              │
│    [DS] Novo token: --foo-bar                               │
│                                                              │
│    ## Motivação                                             │
│    Por que criar? Que problema resolve?                     │
│                                                              │
│    ## Alternativas consideradas                             │
│    - Reuso de `--existing-token-X`? Por que não?            │
│    - Opacidade sobre token semântico? Por que não?          │
│                                                              │
│    ## Valor proposto                                        │
│    Light: oklch(...)                                        │
│    Dark:  oklch(...)                                        │
│                                                              │
│    ## Onde vai aparecer                                     │
│    Link para componente(s) que vão usar                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PASSO 2 — DISCUTIR                                         │
│  ──────────────────                                          │
│  Owner + 1 Champion revisam em até 48h.                     │
│  Output: approve / request-changes / reject.                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PASSO 3 — IMPLEMENTAR (PR)                                 │
│  ────────────────────────                                    │
│  Checklist obrigatório:                                     │
│                                                              │
│    [ ] globals.css: :root + .dark definições                │
│    [ ] globals.css: @theme inline mapping                   │
│    [ ] token-registry.ts: TokenEntry adicionada             │
│    [ ] tokens.ts: export em categoria correta (se TS-used)  │
│    [ ] MASTER.md: seção apropriada atualizada               │
│    [ ] Ao menos 1 uso real em componente                    │
│    [ ] audit:design-system --ci passa                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PASSO 4 — REVIEW                                           │
│  ─────────────                                               │
│  Owner aprova MASTER + globals.css + registry.              │
│  Champion aprova aplicação real.                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PASSO 5 — MERGE                                            │
│  ────────────                                                │
│  CI automático: audit valida cobertura.                     │
│  Se falhar, bloqueio com motivo específico.                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Modificar token existente

```
1. CHECK USE
   npm run audit:design-system -- --where --<token-name>
   → Lista todos os usos

2. PROPOSAL
   PR alterando valor, com:
   ├─ Screenshots antes/depois (3 rotas mínimo)
   ├─ Breakdown de impacto (# arquivos afetados)
   └─ Justificativa (contrast ratio, alinhamento com novo tema, etc.)

3. APPROVAL
   Se < 10 arquivos afetados → owner + 1 champion
   Se ≥ 10 arquivos afetados → owner + 2 champions + QA visual

4. MERGE
   Label: `design-system:breaking` se ≥ 10 arquivos ou se semantics mudou
```

### 3.3 Deprecar token

```
1. MARK
   ├─ Adicionar JSDoc @deprecated em MASTER.md
   ├─ Comment // @deprecated em globals.css
   └─ audit detecta automaticamente em reports

2. WAIT (mínimo 1 sprint — 2 semanas)
   Avisos em todos os daily/standups do core team

3. MIGRATE
   Owner cria PR de migração automática (codemod com jscodeshift ou sed)
   Champions revisam aplicação em seus módulos

4. REMOVE
   PR removendo:
   ├─ globals.css definição
   ├─ token-registry.ts entry
   ├─ tokens.ts export
   └─ MASTER.md menção (mover para CHANGELOG)
```

### 3.4 Reportar drift

Quando você encontrar UI que parece fora de padrão:

```
1. Validar: npm run audit:design-system -- --module <nome>
2. Se confirmado, abrir issue: [DS Drift] módulo/<nome>
3. Champion do módulo toma como owner da issue
4. Se não houver Champion, Owner assume
```

---

## 4. Cadência

| Evento | Frequência | Duração | Participantes | Agenda |
|---|---|---|---|---|
| **Adoption Check-in** | Mensal | 45 min | Owner + Champions | Review snapshot, prioridades |
| **Governance Retro** | Trimestral | 90 min | Todo DS team | KPIs, ajuste de metas, retro |
| **Token PR Review** | On-demand | 15–30 min | Owner + 1 Champion | Review de PR específico |
| **DS Hackathon** | Semestral | 1 dia | Time todo | Refatoração em massa |

### Adoption Check-in — agenda padrão

1. (5 min) Owner apresenta `reports/latest.json`
2. (15 min) Champions reportam:
   - Novas violações no módulo
   - PRs de DS em aberto
   - Blockers para adoção
3. (15 min) Discussão de propostas pendentes
4. (10 min) Decisões & próximos passos

### Governance Retro — agenda padrão

1. (20 min) Trend analysis: gráficos dos 3 snapshots mensais
2. (20 min) What worked / what didn't
3. (20 min) Ajuste de metas trimestrais
4. (30 min) Roadmap do próximo trimestre

---

## 5. Escalação

Quando há desacordo entre Owner e Champion, ou entre Champions:

```
Nível 1: Discussão assíncrona em issue (24h)
    ↓
Nível 2: Chamada rápida Owner + Champion (15 min)
    ↓
Nível 3: Governance Retro extraordinário (se bloquear release)
    ↓
Nível 4: Decisão do Tech Lead / CTO (raro)
```

---

## 6. Exceções

### Quando um componente pode "sair" do sistema

1. **Integrações externas** — Plate.js editor tem seus próprios tokens (Lexical). OK desde que não propague para outros módulos.
2. **Brand externa** — logos de terceiros podem usar hex exato.
3. **PDF rendering** — componentes que geram PDF (`PdfCanvasArea.tsx`) podem usar hex porque PDFs não têm CSS variables.
4. **Testes** — `__tests__/` e `*.stories.tsx` são isentos do audit.

### Documentar exceção

Exceções DEVEM ser documentadas em `allowedOffenders` em [`scripts/dev-tools/design/audit-design-system.ts`](../scripts/dev-tools/design/audit-design-system.ts) com comentário explicando motivo.

---

## 7. Métricas de saúde da governance

| Métrica | Target | Como medir |
|---|---|---|
| **Time-to-Token** | ≤ 48h (proposta → merge) | Timestamp issue vs merge commit |
| **Review Latency** | ≤ 24h (PR aberto → primeira review) | GitHub analytics |
| **Exception Log Growth** | ≤ 2/mês | Contagem `allowedOffenders` |
| **Drift Resolution Time** | ≤ 1 sprint | Issue creation vs close |
| **Champion Coverage** | ≥ 80% módulos com champion | Manual |

---

## 8. Recursos

- [MASTER.md](./MASTER.md) — Source of truth (contratos)
- [ROADMAP.md](./ROADMAP.md) — Plano trimestral + KPIs
- [reports/latest.json](./reports/latest.json) — Último snapshot
- [audit-design-system.ts](../scripts/dev-tools/design/audit-design-system.ts) — Script de auditoria
- [token-registry.ts](../src/lib/design-system/token-registry.ts) — Lista autoritativa de tokens

---

## 9. Referências externas

- [W3C DTCG v2025.10](https://www.designtokens.org/) — Design Tokens Community Group (formato)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs/theme) — `@theme inline` (sintaxe)
- [Netguru DS Governance](https://www.netguru.com/blog/design-system-governance) — Modelo federated
- [zeroheight Metrics](https://zeroheight.com/blog/whats-new-in-the-design-tokens-spec/) — Adoption framework
- [Style Dictionary](https://styledictionary.com/) — Futuro: export DTCG → multiple platforms
