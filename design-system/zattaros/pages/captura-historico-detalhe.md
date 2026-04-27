# Captura — Detalhe de Execução

> **PROJECT:** ZattarOS
> **Updated:** 2026-04-27
> **Page Type:** Operational Dashboard / Audit Log Detail

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Arquitetura de Informação (Ordem obrigatória)

A hierarquia de disclosure da página segue do mais alto nível ao mais granular:

```
1. HERO         → Título formatado do tipo de captura + ID + status inline
2. KPI STRIP    → Status · Iniciado em · Concluído em · Duração (GlassPanel depth=1)
3. RESULTADO    → Banner de status + stat cards por categoria (processos/partes/timeline)
4. DIAGNÓSTICO  → Erros formatados por tipo (timeout/auth/rede) agrupados por tribunal
5. LOGS         → Accordion por tribunal/grau com estatísticas internas (aba padrão)
6. PAYLOAD      → JSON bruto escondido atrás de aba "Payload bruto" (tab secundária)
```

**Nunca inverter essa ordem.** O usuário deve entender "o que aconteceu" antes de "como aconteceu".

---

## Regras de Formatação de Dados (OBRIGATÓRIO)

Todos os dados técnicos devem ser formatados via `utils/format-captura.ts` antes de exibir:

| Dado Bruto | Exibir como |
|---|---|
| `acervo_geral` | "Acervo Geral" |
| `primeiro_grau` | "1º Grau" |
| `sem_prazo` | "Sem Prazo" |
| `campos_alterados: ['orgao_julgador_id']` | "Órgão Julgador" |
| `entidade: 'acervo'` | "Acervo" |
| `tipo: 'auth'` | "Autenticação" |
| `credencial_id: 7` | "Credencial #7" (com font-mono no número) |

**Nunca exibir snake_case ao usuário.** A única exceção é o JSON bruto na aba "Payload bruto".

---

## Layout Overrides

- **Max Width:** 1400px ou full-width herdado do shell
- **Grid:** 12 colunas para stat cards
- **Stat Cards:** `grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4`

---

## Componentes da Página

### `CapturaResult` — Resultado da captura

Estrutura visual:
1. **Banner de status** — rounded-lg com border/bg semântico (`success/[0.06]` ou `info/[0.06]`)
2. **Stat Cards** — grade por categoria (processos, partes, timeline/documentos)
3. **Período de referência** — pill com ícone de clock
4. **Erros de processos** — lista colapsada (max 5, com contagem do restante)

**Nunca usar `bg-success` (cor sólida) como background.** Sempre usar `bg-success/5` ou `bg-success/[0.06]`.

### `CapturaErrosFormatados` — Diagnóstico de falhas

Estrutura visual:
1. **Header unificado** — XCircle + contagem + badges de tipo (timeout/auth/rede)
2. **Cards por tribunal** — rounded-lg border, sem `bg-destructive` sólido
3. **Linha de erro** — IconeErro + badges (grau, filtro, credencial#, tipo) + mensagem

### `CapturaRawLogs` — Logs por tribunal

Estrutura visual:
1. **Resumo** — badges de contagem total/sucesso/erro
2. **Accordion** — um item por rawLog, cursor-pointer obrigatório
3. **Trigger** — TRT + grau + tipo + resumo inline (inseridos · atualizados · erros)
4. **Content** — LogStats (4 cards) + LogEntries por tipo

### `LogStats` (dentro de CapturaRawLogs)

```
Grid 2×2 (sm: 4 colunas):
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ ✅ Inseridos    │ ℹ️ Atualizados   │ — Sem Alteração │ ⚠️ Erros        │
│ bg-success/5    │ bg-info/5       │ bg-muted/40     │ bg-destructive/5│
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

## Tokens de Cor Semânticos

| Semântica | Background | Border | Text |
|---|---|---|---|
| Sucesso | `bg-success/5` ou `bg-success/[0.06]` | `border-success/20` ou `border-success/30` | `text-success` |
| Erro | `bg-destructive/5` ou `bg-destructive/[0.06]` | `border-destructive/20` ou `border-destructive/30` | `text-destructive` |
| Info | `bg-info/5` ou `bg-info/[0.04]` | `border-info/20` ou `border-info/10` | `text-info` |
| Aviso | `bg-warning/5` | `border-warning/20` | `text-warning` |
| Neutro | `bg-muted/40` | `border-border` | `text-muted-foreground` |

**Nunca usar classes sólidas** (`bg-success`, `bg-destructive`) como background de container. Sempre usar opacidade ≤10%.

---

## Anti-patterns desta página

- ❌ `bg-success` ou `bg-destructive` como background (usar `/5` ou `/[0.06]`)
- ❌ `tipo_captura.replace(/_/g, ' ')` — usar `formatarTipoCaptura()`
- ❌ Mostrar `credencial_id` como número isolado — mostrar como "Credencial #7"
- ❌ `campos_alterados.join(', ')` com nomes técnicos — usar `formatarCampoAlterado()`
- ❌ `entidade` como texto direto — usar `formatarEntidade()`
- ❌ Accordion sem `cursor-pointer` — obrigatório para UX
- ❌ "Sem alteracao" (sem acento) — "Sem Alteração"
- ❌ "autenticacao" em badges — "Autenticação"
- ❌ JSON bruto como conteúdo principal — mover para aba "Payload bruto" secundária

---

## Spacing Overrides

- **Content Density:** Alta — página de auditoria, prioriza dados sobre espaço

## Recommendations

- Animações: `animate-pulse` apenas no indicador de status `in_progress`
- Accordion: `type="multiple"` para permitir abrir vários simultaneamente
- Mobile: badges extras (`tipo_captura`) `hidden sm:inline-flex` para não sobrecarregar
