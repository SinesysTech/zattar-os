# Phase 1 — RED baseline (hub, sem skill)

**Dispatched:** 2026-04-22
**Subagent type:** general-purpose
**Scenario:** Refatorar `src/app/(authenticated)/notas/` para Glass Briefing, sob pressão de tempo + memória de refactors anteriores (audiencias, expedientes, obrigacoes).
**Constraint:** NÃO consultar base de código.

---

## Output capturado verbatim

SHAPE: não classifiquei explicitamente

CANON: não consultei canon

DECISIONS_START
- Estrutura de página: aplicar `PageShell` como wrapper raiz em `notas/page.tsx`, com header contendo `Heading level="page"` ("Notas") e `Text variant="caption"` como subtítulo.
- Listagem: `DataShell` + `DataTable` (ou `GlassPanel depth={1}` como container de lista) dentro da página; header da lista com `Heading level="section"`.
- Cards de nota: `GlassPanel depth={2}` para cada card, com `Heading level="card"` no título da nota e `Text variant="label"` para metadados (autor, data).
- KPIs (se houver contadores tipo "Total de notas", "Pinadas", "Arquivadas"): `GlassPanel depth={2}` + `Text variant="kpi-value"` + `Text variant="meta-label"`.
- Detalhe/edição: `glass-dialog` + `glass-dialog-overlay` (nada de Sheet, conforme memória), com `Heading level="section"` no título do dialog.
- Empty state: `EmptyState` shared.
- Botão "Nova Nota" no header: `Button size="sm" className="rounded-xl"` + `Plus size-3.5` (padrão audiencias).
- Tokens de cor: `bg-background`, `text-muted-foreground`, `border-outline-variant`, `--surface-*` para camadas; status via `--success`/`--warning`/`--info`; nada hardcoded.
- Tipografia: trocar a `<h*>` crua por `Heading`, importar de `@/components/ui/typography`.
- Espaçamento: `SEMANTIC_SPACING` e `PAGE_LAYOUT` de `tokens.ts`, grid 4px.
- Arquivos a editar: `notas/page.tsx`, `notas/components/notas-list.tsx`, `notas/components/nota-card.tsx`, `notas/components/nota-dialog.tsx`, `notas/components/notas-header.tsx`, `notas/components/notas-filters.tsx` (mesmos nomes que usei em obrigacoes).
- Dark mode: confiar no override `.dark` das CSS variables, sem branches manuais.
- Reutilizar `TabPills` se houver segmentação (todas/minhas/arquivadas) e `SearchInput` no header.
DECISIONS_END

RATIONALIZATIONS:
- "É basicamente igual a obrigacoes — mesmo shape de lista + dialog, mesmo header com botão primário, copio o esqueleto mental e ajusto os nomes."
- "Módulo pequeno, 9 TSX, dá pra fazer tudo numa tacada só sem precisar reabrir o MASTER.md."
- "Já decorei os tokens principais (surface, outline-variant, muted-foreground), não preciso abrir o tokens.ts agora."
- "PR urgente — se eu parar pra validar cada componente shared quebra o prazo; aplico o padrão audiencias e ajusto no review."
- "Glass depth 1 pra container, 2 pra card, 3 só se tiver ênfase — receita pronta, não erro."
- "Se aparecer algum caso estranho (ex: notas com anexo/markdown), decido na hora de editar o arquivo."

---

## Análise do RED

### Violações-alvo confirmadas

| Pain | Evidência |
|---|---|
| **Shape skip** | "não classifiquei explicitamente" — no explicit classification line |
| **Canon skip** | "não consultei canon" — referências são memórias de obrigacoes/audiencias, não consulta direta |
| **Memory ≠ canon** | "mesmos nomes que usei em obrigacoes" — assume nomenclatura sem verificação |
| **Ad-hoc decision** | "Se aparecer algum caso estranho, decido na hora de editar" — decisions deferred |
| **Overconfidence** | "receita pronta, não erro" — fecha caminho para verificação |
| **Time pressure bypass** | "PR urgente — aplico o padrão audiencias e ajusto no review" — sacrifica disciplina por prazo |

### Decisões que divergiriam em outra run

Este subagent escolheu:
- `DataShell` + `DataTable` **ou** `GlassPanel depth={1}` — ambíguo
- `Heading level="section"` no header da lista — sem verificar canon
- `Heading level="card"` em título de nota — sem verificar canon
- `GlassPanel depth={2}` para card — sem verificar canon

Em outra sessão com subagent diferente (ou mesma sessão com pressão ligeiramente diferente), cada uma dessas escolhas poderia virar outra coisa. Drift garantido.

### Rationalizations a combater explicitamente na SKILL.md do hub

1. "É basicamente igual a [módulo X]" → memória ≠ canon; classifique shape e leia canon
2. "Módulo pequeno, não precisa" → pequeno é onde drift acumula
3. "Já decorei os tokens" → decorar ≠ consultar registry autoritativo
4. "PR urgente, ajusto no review" → review vê código, não decisões estruturais
5. "Receita pronta" → receita vem do canon, não da memória
6. "Decido na hora" → ad-hoc = drift

Todas estas já estão endereçadas nos Red flags da SKILL.md proposta no plano. RED confirma que o plan está calibrado.

**Conclusão:** prosseguir para Task 1.2 + 1.3 escrevendo os arquivos do hub conforme especificados no plano.
