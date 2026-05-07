# Wave 12a — Typography Raw Cleanup (detector context-aware + weight-prop codemod)

**Data:** 2026-05-07
**Status:** Approved (brainstorming)
**Escopo:** `src/app/(authenticated)/**/*.tsx` + `scripts/dev-tools/design/audit-design-system.ts`

---

## Contexto

A normalização do design system pausou na Wave 11b. O auditor (`scripts/dev-tools/design/audit-design-system.ts`) reporta `Typography Raw Violations: 2900`, bloqueando o KPI (`lte 0`).

A inspeção amostral revelou que essas 2.900 violações se dividem em três categorias:

- **A — Wrapper bruto (falso positivo):** `font-{medium,semibold,bold}`, `leading-*`, `tracking-*` aplicados a `<span>`, `<div>`, `<p>`, etc. A diretiva da Wave 9 (commit `8a69ac9c3`) declarou esse uso legítimo, mas o detector não foi ajustado para refletir a diretiva.
- **B — `<Text>`/`<Heading>` com `font-*` na className (verdadeiro positivo cirúrgico):** elementos tipados que aplicam peso de fonte via Tailwind em vez da prop `weight` introduzida na Wave 9.
- **C — Heading/KPI bruto (verdadeiro positivo estrutural):** `<div className="text-3xl font-bold">` em contextos que semanticamente deveriam ser `<Heading level="display-*">` ou `<Text variant="kpi-value">`. Já marcado em vários arquivos por comentários `design-system-escape`.

A Wave 12a entrega correção para A e B em um único commit. Categoria C fica para Wave 12a-residual (decisão semântica caso-a-caso, fora do escopo).

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Escopo do detector context-aware | Ignorar `font-*`, `leading-*`, `tracking-*` em wrappers brutos; manter detecção de `text-{xs,sm,base,lg,xl,2xl,3xl}` em qualquer contexto | `leading`/`tracking` não têm token DS; `font-*` em wrapper bruto é legítimo (Wave 9). `text-3xl` segue capturado para alimentar a Wave 12a-residual (Categoria C). |
| Identificação de "elemento tipado" | JSX names exatos `Text` e `Heading` | Aliases via re-export são raros e podem virar caso-de-borda futuro. |
| Família migrável para prop | `font-{normal,medium,semibold,bold}` → prop `weight` | Único mapeamento 1:1 com a API atual. `leading`/`tracking` permanecem na className. |
| Ferramenta do codemod | `ts-morph` (AST) | Identificar `JSXOpeningElement` com nome exato e manipular atributos é estrutural; regex confunde `<TextField>` com `<Text>` ou pega match dentro de string de outra prop. |
| Estratégia de entrega | 1 commit monolítico (detector + codemod + arquivos transformados) | Solo dev, sem PR; rollback atômico via `git revert HEAD` se algo quebrar. |
| Conservadorismo do codemod | Skip + log em casos ambíguos (concat dinâmica, ternário sobre weight, peso duplo, conflito com prop `weight` pré-existente) | Prefere transformação parcial correta a transformação total arriscada. Skips viram TODO de Wave 12a-residual. |

## Arquitetura

```
[1 commit no master]
  ├── scripts/dev-tools/design/audit-design-system.ts  (detector refinado)
  ├── scripts/dev-tools/design/codemod-typography-weight.ts  (novo, executável)
  └── src/app/(authenticated)/**/*.tsx  (saída do codemod, ~600+ arquivos)
```

Fluxo end-to-end:

1. Snapshot baseline (`audit --metrics > /tmp/before.txt`).
2. Atualizar `audit-design-system.ts` com detector context-aware.
3. Re-rodar auditor → confirmar queda da KPI typographyRaw (esperada: ~2.900 → ~600–800).
4. Executar `codemod-typography-weight.ts`.
5. Validar: `tsc --noEmit`, `npm run lint`, auditor final, smoke visual em 3 arquivos sample.
6. Commitar.

## Componente 1 — Detector context-aware

**Arquivo afetado:** `scripts/dev-tools/design/audit-design-system.ts`

**Mudanças:**

1. Nova função `extractTypedJsxRanges(content: string): Array<[number, number]>`:
   - Regex `/<(Text|Heading)\b[\s\S]*?>/g` (modo dotall via `[\s\S]`, não-greedy).
   - Retorna pares `[startIndex, endIndex]` de cada abertura.
2. Modificar `findViolations` para aceitar predicado opcional `shouldCount(file, content, matchIndex) => boolean`.
3. Para `font-*`, `leading-*`, `tracking-*`: predicado retorna `true` apenas se `matchIndex` cai dentro de um intervalo retornado por `extractTypedJsxRanges`.
4. Para `text-{xs,...,3xl}`: sem predicado (mantém comportamento atual).

**Impacto:** apenas a função `auditViolations` precisa de ajuste para passar o predicado certo a cada chamada `findViolations`. As regex do `PATTERNS.typographyRaw` permanecem; o que muda é a lógica de contagem.

**Risco de detecção falsa:**
- Falso positivo (conta o que não deveria): match de `font-medium` numa string literal de outra prop dentro de `<Text>`. Improvável; aceitável.
- Falso negativo (não conta o que deveria): elemento tipado que tenha `>` dentro de uma string de prop antes do `>` real do JSX. Raro em JSX bem formatado.

Nenhum dos riscos compromete a integridade do código gerado pelo codemod (que opera em AST real, não regex).

## Componente 2 — Codemod weight-prop

**Arquivo novo:** `scripts/dev-tools/design/codemod-typography-weight.ts`

**Dependências:**
- `ts-morph` (verificar disponibilidade no `package.json`; se ausente, adicionar).
- `glob` (já usada pelo auditor).

**Pseudocódigo:**

```ts
const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
const files = glob.sync('src/app/(authenticated)/**/*.tsx');

let stats = { transformed: 0, skipped: 0, filesChanged: 0 };
const skips: Array<{ file: string; line: number; reason: string }> = [];

for (const file of files) {
  const sf = project.addSourceFileAtPath(file);
  let fileChanged = false;

  sf.forEachDescendant((node) => {
    if (!Node.isJsxOpeningElement(node) && !Node.isJsxSelfClosingElement(node)) return;
    const tag = node.getTagNameNode().getText();
    if (tag !== 'Text' && tag !== 'Heading') return;

    const classNameAttr = node.getAttribute('className');
    if (!classNameAttr || !Node.isJsxAttribute(classNameAttr)) return;

    const existingWeight = node.getAttribute('weight');
    if (existingWeight) {
      skips.push({ file, line: node.getStartLineNumber(), reason: 'weight prop already present' });
      return;
    }

    const initializer = classNameAttr.getInitializer();
    const result = extractWeight(initializer);  // pure function
    if (result.skip) {
      skips.push({ file, line: node.getStartLineNumber(), reason: result.skipReason });
      return;
    }
    if (!result.weight) return;  // no font-* token found

    // Mutate AST
    classNameAttr.setInitializer(result.newClassNameExpression);
    if (result.classNameEmpty) classNameAttr.remove();
    node.insertAttribute(/* index */ 1, { name: 'weight', initializer: `"${result.weight}"` });

    stats.transformed++;
    fileChanged = true;
  });

  if (fileChanged) {
    sf.saveSync();
    stats.filesChanged++;
  }
}

console.table(stats);
console.table(skips);
```

**Função `extractWeight(initializer)`** — caso a caso:

| Caso de entrada | Saída |
|---|---|
| `JsxStringLiteral`: `"font-medium text-foreground"` | `{ weight: 'medium', newClassNameExpression: '"text-foreground"' }` |
| `JsxStringLiteral` só com peso: `"font-bold"` | `{ weight: 'bold', classNameEmpty: true }` |
| `JsxExpression` com `cn(...)`: `cn("font-medium", x && "text-y")` | varre args; remove `"font-medium"` literal; reemite `cn(x && "text-y")` |
| `JsxExpression` com template literal puro: `` `font-medium ${extra}` `` | `{ skip: true, skipReason: 'template literal' }` |
| `JsxExpression` com concat: `"font-medium " + extra` | `{ skip: true, skipReason: 'string concat' }` |
| `JsxExpression` com ternário sobre peso: `cond ? "font-medium" : "font-bold"` | `{ skip: true, skipReason: 'ternary on weight' }` |
| `JsxStringLiteral` com peso duplo: `"font-medium font-bold"` | `{ skip: true, skipReason: 'multiple weight tokens' }` |

**Saída do script (stdout):**
```
[codemod-typography-weight] Iniciando…
[codemod-typography-weight] Arquivos: 1023
[codemod-typography-weight] Transformados: 487 elementos em 213 arquivos
[codemod-typography-weight] Skips: 18
  src/app/(authenticated)/foo.tsx:42 — ternary on weight
  src/app/(authenticated)/bar.tsx:88 — string concat
  …
```

## Componente 3 — Arquivos modificados

**Esperado:** entre 200 e 400 arquivos `.tsx` em `src/app/(authenticated)/**`. Volume estimado a partir do top de violações (`assinatura-digital`, `dashboard`, `expedientes`, `audiencias`, `agenda`, `usuarios`).

Cada arquivo recebe uma ou mais transformações idempotentes:
- Move `font-{normal,medium,semibold,bold}` da `className` para prop `weight`.
- Não altera nada além disso (outras classes, prop variant/level, children, eventos, etc. preservados).

## Verificação

Critérios de aceite (todos obrigatórios):

1. `npx tsc --noEmit` retorna 0.
2. `npm run lint` retorna 0 (ou só warnings que já existiam pré-codemod).
3. `npx tsx scripts/dev-tools/design/audit-design-system.ts --metrics` mostra `Typography Raw Violations` em queda significativa. Esperado: ≤ 500 (alvo razoável após detector + codemod). Teto de segurança para abortar/investigar: > 800 (sinaliza que algo não funcionou como projetado).
4. `git diff --stat` mostra 1 mudança em `audit-design-system.ts`, 1 arquivo novo `codemod-typography-weight.ts`, e mudanças em arquivos `.tsx` apenas em `src/app/(authenticated)/**`.
5. Smoke visual em 3 arquivos de módulos diferentes — confirma transformação limpa, sem garbage residual (`className=""`, `cn()` vazio).
6. Skips de codemod: registrados no stdout; quantidade aceitável (estimativa ≤30). Lista vai como bullet no commit message para virar TODO da Wave 12a-residual. **Nota:** elementos pulados continuam contando como violação no auditor (a className não foi mexida); esses casos só saem da KPI quando resolvidos manualmente em wave futura.

## Plano de commit

Mensagem (heredoc preservado):

```
feat(typography): detector context-aware + codemod weight-prop (Wave 12a)

Reduz Typography Raw Violations de 2900 → N consolidando duas mudanças:

1. Detector context-aware (audit-design-system.ts):
   font-*, leading-*, tracking-* só contam quando dentro de <Text> ou
   <Heading>. Em wrappers brutos (span/div/p/button/...) são uso legítimo
   de Tailwind (diretiva da Wave 9). text-{xs,...,3xl} continuam sendo
   detectados em qualquer contexto (são alvo de migração estrutural).

2. Codemod weight-prop (ts-morph):
   <Text variant="x" className="font-medium ...">
     → <Text variant="x" weight="medium" className="...">
   X arquivos modificados, Y elementos transformados.
   Skips: Z casos com peso ambíguo/dinâmico (listados abaixo, alvo de
   Wave 12a-residual).

Wave 12a-residual ainda pendente: text-3xl/2xl/xl em wrappers brutos
que deveriam ser <Heading level="display-*"> ou <Text variant="kpi-value">.
```

## Fora do escopo (Wave 12a-residual e além)

- **Categoria C:** `text-{xl,2xl,3xl}` em wrappers brutos. Decisão semântica caso-a-caso (Heading display vs Text kpi-value).
- **leading/tracking** dentro de `<Text>`/`<Heading>`: detectados pelo novo regime, mas sem migração automática (não há prop equivalente). Tratamento manual em wave futura.
- **Aliases de Text/Heading** via re-export: detector ignora; raríssimo no codebase.
- **Outros KPIs do auditor**: `Spacing Raw Violations` (5.430), `Toolbar Wrong Size` (34), Token Documentation Coverage (0%) — Waves 12b–e.
