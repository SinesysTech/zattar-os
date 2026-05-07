# Wave 12a — Typography Weight Codemod Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduzir Typography Raw Violations de ~2900 para ≤500 via duas mudanças coordenadas: detector context-aware no `audit-design-system.ts` + codemod regex que migra `<Text>`/`<Heading>` com `font-*` na className para a prop `weight`.

**Architecture:** Detector e codemod vivem em `scripts/dev-tools/design/`. Detector é modificação no auditor existente. Codemod é script `.mjs` standalone (segue padrão de `codemod-white-opacity.mjs`) com flags `--apply` (default: dry-run) e `--test` (roda smoke tests com fixtures).

**Tech Stack:** Node.js ESM, regex multi-passo (sem AST/ts-morph para aderir ao padrão do projeto), `glob`, `tsx` para o auditor TS.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `scripts/dev-tools/design/audit-design-system.ts` | **Modify**: detector context-aware (ignora `font-*`/`leading-*`/`tracking-*` fora de `<Text>`/`<Heading>`) |
| `scripts/dev-tools/design/codemod-typography-weight.mjs` | **Create**: script principal de transformação |
| `scripts/dev-tools/design/__fixtures__/codemod-typography-weight/input-*.tsx` | **Create**: TSX input para smoke tests |
| `scripts/dev-tools/design/__fixtures__/codemod-typography-weight/expected-*.tsx` | **Create**: TSX esperado pós-transformação |
| `src/app/(authenticated)/**/*.tsx` | **Modify (codemod output)**: ~200-400 arquivos com `<Text>`/`<Heading>` migrados |

---

## Task 1: Baseline snapshot

**Files:** nenhum (somente leitura).

- [ ] **Step 1: Rodar auditor e salvar baseline em /tmp**

```bash
cd /Users/jordanmedeiros/Projetos/dev-now/zattar-os
npx tsx scripts/dev-tools/design/audit-design-system.ts --metrics > /tmp/wave-12a-before.txt 2>&1
grep -E "(Typography Raw|Spacing Raw|Toolbar|Overall|KPIs)" /tmp/wave-12a-before.txt
```

Expected output deve conter:
```
Typography Raw Violations: 2900 (lte 0)
```

- [ ] **Step 2: Confirmar working tree limpo**

```bash
git status
```

Expected: `nothing to commit, working tree clean`. Se sujo, parar e investigar antes de prosseguir.

---

## Task 2: Detector context-aware — adicionar função helper

**Files:**
- Modify: `scripts/dev-tools/design/audit-design-system.ts`

- [ ] **Step 1: Localizar a seção `// UTILS` no auditor**

```bash
grep -n "^// UTILS\|^// =\|async function findViolations" scripts/dev-tools/design/audit-design-system.ts | head -10
```

Espera-se algo como `// UTILS` perto da linha 600+. Identificar a função existente `findViolations`.

- [ ] **Step 2: Ler `findViolations` atual**

Leia o bloco da função `findViolations` em `scripts/dev-tools/design/audit-design-system.ts`. Memorizar a assinatura e o corpo. Tipicamente recebe `(files, pattern, rule)`.

- [ ] **Step 3: Adicionar função `extractTypedJsxRanges` antes de `findViolations`**

Inserir esta função no auditor, na seção `// UTILS`:

```ts
/**
 * Extrai os intervalos de caracteres ocupados por aberturas <Text ...> e <Heading ...>
 * num arquivo TSX. Usado pelo detector context-aware: violações font-*, leading-*,
 * tracking-* só contam quando caem dentro destes intervalos.
 *
 * Diretiva da Wave 9 (commit 8a69ac9c3): font-* em wrapper bruto (span/div/p/...) é
 * uso legítimo de Tailwind. Só conta como violação quando o wrapper é tipado.
 *
 * Limitação: regex multi-linha. Casos patológicos (>= dentro de string de prop antes
 * do > real do JSX) são raros em JSX bem formatado. Aceitável.
 */
function extractTypedJsxRanges(content: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const re = /<(Text|Heading)\b[\s\S]*?>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}
```

- [ ] **Step 4: Commit incremental (checkpoint)**

NÃO commitar ainda — esta é uma task de checkpoint mental. As tasks 2-4 vão num único commit final na Task 13.

---

## Task 3: Detector context-aware — modificar `findViolations`

**Files:**
- Modify: `scripts/dev-tools/design/audit-design-system.ts`

- [ ] **Step 1: Estender assinatura de `findViolations` com predicado opcional**

Substituir a assinatura atual de `findViolations` pelo seguinte (manter o corpo, apenas estender):

```ts
async function findViolations(
  files: string[],
  pattern: RegExp,
  rule: string,
  shouldCount?: (file: string, content: string, matchIndex: number) => boolean,
): Promise<Violation[]> {
  const violations: Violation[] = [];
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');
    let lineStart = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(line)) !== null) {
        const absIndex = lineStart + m.index;
        if (shouldCount && !shouldCount(file, content, absIndex)) continue;
        violations.push({
          file: path.relative(REPO_ROOT, file),
          line: i + 1,
          match: m[0],
          rule,
        });
      }
      lineStart += line.length + 1; // +1 para \n
    }
  }
  return violations;
}
```

**Nota crítica:** o corpo atual de `findViolations` pode iterar diferente. **Se** o atual já calcula `absIndex`, basta plugar o predicado. **Se** o atual itera só por linha sem offset absoluto, é necessário acrescentar o cálculo `lineStart` como acima.

- [ ] **Step 2: Localizar a chamada para `PATTERNS.typographyRaw` em `auditViolations`**

```bash
grep -n "PATTERNS.typographyRaw\|PATTERNS.spacingRaw" scripts/dev-tools/design/audit-design-system.ts
```

Expected: linhas tipo `findViolations(files, PATTERNS.typographyRaw, 'typography-raw')`.

- [ ] **Step 3: Refatorar a regex `typographyRaw` em duas — uma para tipografia tipada, outra para tamanhos**

Substituir o `PATTERNS.typographyRaw` atual:

```ts
typographyRaw: /\b(text-(xs|sm|base|lg|xl|2xl|3xl)|font-(semibold|bold|medium)|leading-|tracking-)\b/g,
```

por dois patterns separados:

```ts
// Tamanhos text-* — detectados em qualquer contexto (alvo de migração estrutural — Categoria C)
typographySizesRaw: /\btext-(xs|sm|base|lg|xl|2xl|3xl)\b/g,
// Pesos e métricas — só contam quando dentro de <Text>/<Heading> (Categoria B)
typographyWeightsRaw: /\b(font-(semibold|bold|medium)|leading-|tracking-)/g,
```

- [ ] **Step 4: Atualizar `auditViolations` para chamar duas vezes com predicado certo**

Localizar a chamada atual:
```ts
findViolations(files, PATTERNS.typographyRaw, 'typography-raw'),
```

Substituir por **duas** chamadas em paralelo dentro do `Promise.all` existente:

```ts
findViolations(files, PATTERNS.typographySizesRaw, 'typography-raw'),
findViolations(files, PATTERNS.typographyWeightsRaw, 'typography-raw',
  async (_file, content, matchIndex) => {
    // Cache simples por content — extrai ranges uma vez por arquivo
    const ranges = (extractTypedJsxRanges as any).cache?.get(content)
      ?? (() => {
        const r = extractTypedJsxRanges(content);
        if (!(extractTypedJsxRanges as any).cache) (extractTypedJsxRanges as any).cache = new WeakMap();
        return r;
      })();
    return ranges.some(([s, e]: [number, number]) => matchIndex >= s && matchIndex < e);
  },
),
```

**Simplificação:** se a complexidade do cache atrapalhar, omitir cache e aceitar O(n²) — o auditor já é rápido (~3s no codebase atual). Versão simples sem cache:

```ts
findViolations(files, PATTERNS.typographyWeightsRaw, 'typography-raw',
  (_file, content, matchIndex) => {
    const ranges = extractTypedJsxRanges(content);
    return ranges.some(([s, e]) => matchIndex >= s && matchIndex < e);
  },
),
```

Use a versão simples. Desempenho não é crítico aqui.

- [ ] **Step 5: Mesclar resultados das duas chamadas em um só array `typographyRaw`**

Procurar onde o resultado é atribuído. Agora `findViolations` retorna 2 arrays separados; concatenar:

```ts
const [bg, text, border, hex, oklch, shadow, composition, white, typoSizes, typoWeights, spacingRaw] = await Promise.all([
  // ... (8 primeiros mantidos)
  findViolations(files, PATTERNS.typographySizesRaw, 'typography-raw'),
  findViolations(files, PATTERNS.typographyWeightsRaw, 'typography-raw',
    (_file, content, matchIndex) => {
      const ranges = extractTypedJsxRanges(content);
      return ranges.some(([s, e]) => matchIndex >= s && matchIndex < e);
    },
  ),
  findViolations(files, PATTERNS.spacingRaw, 'spacing-raw'),
]);
const typographyRaw = [...typoSizes, ...typoWeights];
```

Restante do código (`return { ..., typographyRaw, ... }`) permanece intacto.

---

## Task 4: Verificar detector — primeira queda do KPI

**Files:** nenhum (somente leitura).

- [ ] **Step 1: Rodar auditor com detector context-aware**

```bash
npx tsx scripts/dev-tools/design/audit-design-system.ts --metrics > /tmp/wave-12a-after-detector.txt 2>&1
grep -E "(Typography Raw|Spacing Raw|Overall)" /tmp/wave-12a-after-detector.txt
```

Expected: `Typography Raw Violations` deve cair de 2900 para algo entre **400 e 1000** (a maioria das 2900 era Categoria A em wrappers brutos). Spacing Raw permanece ~5430 (não tocamos).

- [ ] **Step 2: Verificar que a queda é coerente**

```bash
diff /tmp/wave-12a-before.txt /tmp/wave-12a-after-detector.txt | head -30
```

Inspeção visual: confirmar que apenas a linha de typography raw mudou (com outras KPIs estáveis).

- [ ] **Step 3: Se Typography Raw < 200 ou > 1500 → STOP e investigar**

Queda fora do range esperado (200-1500) sinaliza bug no predicado. Reverter Task 3 com `git checkout scripts/dev-tools/design/audit-design-system.ts` e revisar.

---

## Task 5: Codemod — criar fixtures de smoke test

**Files:**
- Create: `scripts/dev-tools/design/__fixtures__/codemod-typography-weight/input-string-literal.tsx`
- Create: `scripts/dev-tools/design/__fixtures__/codemod-typography-weight/expected-string-literal.tsx`
- Create: `scripts/dev-tools/design/__fixtures__/codemod-typography-weight/input-cn-call.tsx`
- Create: `scripts/dev-tools/design/__fixtures__/codemod-typography-weight/expected-cn-call.tsx`
- Create: `scripts/dev-tools/design/__fixtures__/codemod-typography-weight/input-skip-cases.tsx`
- Create: `scripts/dev-tools/design/__fixtures__/codemod-typography-weight/expected-skip-cases.tsx`

- [ ] **Step 1: Criar diretório de fixtures**

```bash
mkdir -p scripts/dev-tools/design/__fixtures__/codemod-typography-weight
```

- [ ] **Step 2: Fixture input — string literal simples**

Caminho: `scripts/dev-tools/design/__fixtures__/codemod-typography-weight/input-string-literal.tsx`

```tsx
import { Text, Heading } from '@/components/ui/typography';

export function StringLiteralCases() {
  return (
    <>
      <Text variant="caption" className="font-medium text-foreground">label A</Text>
      <Text variant="body" className="font-bold">label B (only weight)</Text>
      <Heading level="card" className="font-semibold mt-4">heading C</Heading>
      <span className="font-medium uppercase">wrapper bruto — não toca</span>
      <Text variant="label">sem className — não toca</Text>
    </>
  );
}
```

- [ ] **Step 3: Fixture expected — string literal simples**

Caminho: `scripts/dev-tools/design/__fixtures__/codemod-typography-weight/expected-string-literal.tsx`

```tsx
import { Text, Heading } from '@/components/ui/typography';

export function StringLiteralCases() {
  return (
    <>
      <Text variant="caption" weight="medium" className="text-foreground">label A</Text>
      <Text variant="body" weight="bold">label B (only weight)</Text>
      <Heading level="card" weight="semibold" className="mt-4">heading C</Heading>
      <span className="font-medium uppercase">wrapper bruto — não toca</span>
      <Text variant="label">sem className — não toca</Text>
    </>
  );
}
```

- [ ] **Step 4: Fixture input — chamada cn(...)**

Caminho: `scripts/dev-tools/design/__fixtures__/codemod-typography-weight/input-cn-call.tsx`

```tsx
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

export function CnCallCases({ active }: { active: boolean }) {
  return (
    <>
      <Text variant="caption" className={cn("font-medium", active && "text-primary")}>cn case A</Text>
      <Text variant="body" className={cn("text-foreground", "font-bold", "leading-tight")}>cn case B</Text>
    </>
  );
}
```

- [ ] **Step 5: Fixture expected — chamada cn(...)**

Caminho: `scripts/dev-tools/design/__fixtures__/codemod-typography-weight/expected-cn-call.tsx`

```tsx
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

export function CnCallCases({ active }: { active: boolean }) {
  return (
    <>
      <Text variant="caption" weight="medium" className={cn(active && "text-primary")}>cn case A</Text>
      <Text variant="body" weight="bold" className={cn("text-foreground", "leading-tight")}>cn case B</Text>
    </>
  );
}
```

- [ ] **Step 6: Fixture input — skip cases**

Caminho: `scripts/dev-tools/design/__fixtures__/codemod-typography-weight/input-skip-cases.tsx`

```tsx
import { Text } from '@/components/ui/typography';

export function SkipCases({ cond, extra }: { cond: boolean; extra: string }) {
  return (
    <>
      <Text variant="caption" className={cond ? "font-medium" : "font-bold"}>ternário</Text>
      <Text variant="body" className={"font-medium " + extra}>concat</Text>
      <Text variant="caption" className="font-medium font-bold">peso duplo</Text>
      <Text variant="caption" weight="medium" className="font-bold">já tem weight</Text>
    </>
  );
}
```

- [ ] **Step 7: Fixture expected — skip cases (idêntico ao input)**

Caminho: `scripts/dev-tools/design/__fixtures__/codemod-typography-weight/expected-skip-cases.tsx`

Conteúdo: **idêntico ao input-skip-cases.tsx** (todos esses casos são pulados — o codemod não os modifica).

```tsx
import { Text } from '@/components/ui/typography';

export function SkipCases({ cond, extra }: { cond: boolean; extra: string }) {
  return (
    <>
      <Text variant="caption" className={cond ? "font-medium" : "font-bold"}>ternário</Text>
      <Text variant="body" className={"font-medium " + extra}>concat</Text>
      <Text variant="caption" className="font-medium font-bold">peso duplo</Text>
      <Text variant="caption" weight="medium" className="font-bold">já tem weight</Text>
    </>
  );
}
```

---

## Task 6: Codemod — escrever script principal

**Files:**
- Create: `scripts/dev-tools/design/codemod-typography-weight.mjs`

- [ ] **Step 1: Criar arquivo com cabeçalho e imports**

```js
#!/usr/bin/env node
/**
 * Codemod: <Text|Heading className="font-medium ..."> → <... weight="medium" className="...">
 *
 * Migra `font-{normal,medium,semibold,bold}` da className para a prop `weight`
 * (introduzida na Wave 9). Aplica APENAS quando o JSX é <Text> ou <Heading>;
 * font-* em <span>/<div>/<p> é uso legítimo (diretiva da Wave 9).
 *
 * Aborta (skip) em casos ambíguos: ternário sobre weight, concat dinâmica,
 * peso duplo, prop weight pré-existente. Skips são logados para Wave 12a-residual.
 *
 * CLI:
 *   node scripts/dev-tools/design/codemod-typography-weight.mjs            # dry-run
 *   node scripts/dev-tools/design/codemod-typography-weight.mjs --apply    # aplica
 *   node scripts/dev-tools/design/codemod-typography-weight.mjs --test     # smoke fixtures
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';

const ROOT = process.cwd();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, '__fixtures__/codemod-typography-weight');

const WEIGHT_TOKENS = ['font-normal', 'font-medium', 'font-semibold', 'font-bold'];
const WEIGHT_TO_VALUE = {
  'font-normal': 'normal',
  'font-medium': 'medium',
  'font-semibold': 'semibold',
  'font-bold': 'bold',
};
```

- [ ] **Step 2: Implementar `extractWeightFromString(literal)`**

Cole abaixo dos imports:

```js
/**
 * Recebe uma string literal de className (sem aspas) e tenta extrair UM token de weight.
 * Retorna { weight, newLiteral, skipReason }.
 *   - weight: 'medium' | 'semibold' | 'bold' | 'normal' | null
 *   - newLiteral: a string sem o token (trim normalizado)
 *   - skipReason: motivo se não puder transformar (peso duplo, sem weight)
 */
function extractWeightFromString(literal) {
  const tokens = literal.split(/\s+/).filter(Boolean);
  const weightTokens = tokens.filter((t) => WEIGHT_TOKENS.includes(t));

  if (weightTokens.length === 0) {
    return { weight: null, newLiteral: literal, skipReason: null };
  }
  if (weightTokens.length > 1) {
    return { weight: null, newLiteral: literal, skipReason: 'multiple weight tokens' };
  }

  const [wt] = weightTokens;
  const remaining = tokens.filter((t) => t !== wt).join(' ');
  return {
    weight: WEIGHT_TO_VALUE[wt],
    newLiteral: remaining,
    skipReason: null,
  };
}
```

- [ ] **Step 3: Implementar `transformClassNameAttr(rawAttr)`**

Cole logo depois:

```js
/**
 * Recebe o conteúdo bruto do atributo className (entre `="..."` ou `={...}`) e tenta
 * extrair weight. Retorna { weight, newAttrText, skipReason, classNameNowEmpty }.
 *
 * rawAttr pode ser:
 *   `"font-medium text-x"`        → string literal
 *   `{cn("font-medium", x && "y")}` → expressão cn()
 *   `{cond ? "a" : "b"}`           → ternário (skip)
 *   `{"font-medium " + x}`         → concat (skip)
 *   `{`font-medium ${x}`}`         → template literal (skip)
 */
function transformClassNameAttr(rawAttr) {
  const trimmed = rawAttr.trim();

  // Caso 1: string literal "..."
  const stringLiteralMatch = trimmed.match(/^"([^"]*)"$/);
  if (stringLiteralMatch) {
    const inner = stringLiteralMatch[1];
    const r = extractWeightFromString(inner);
    if (r.skipReason || !r.weight) return { weight: null, skipReason: r.skipReason };
    const newAttr = r.newLiteral ? `"${r.newLiteral}"` : '';
    return {
      weight: r.weight,
      newAttrText: newAttr,
      classNameNowEmpty: r.newLiteral.length === 0,
    };
  }

  // Caso 2: expressão {cn(...)} — apenas argumentos string literal
  const cnMatch = trimmed.match(/^\{\s*cn\(([\s\S]*)\)\s*\}$/);
  if (cnMatch) {
    const argsRaw = cnMatch[1];
    // Detectar se algum arg é string literal contendo weight
    // Estratégia: tokenizar args por vírgula no top-level (cuidado com strings com vírgula)
    const args = splitCnArgs(argsRaw);
    let foundWeight = null;
    let foundIdx = -1;
    let weightOnly = false;

    for (let i = 0; i < args.length; i++) {
      const a = args[i].trim();
      const lit = a.match(/^"([^"]*)"$/);
      if (!lit) continue;
      const r = extractWeightFromString(lit[1]);
      if (r.skipReason) return { weight: null, skipReason: r.skipReason };
      if (r.weight) {
        if (foundWeight) return { weight: null, skipReason: 'multiple weight tokens across cn args' };
        foundWeight = r.weight;
        foundIdx = i;
        weightOnly = r.newLiteral.length === 0;
        // Substituir o argumento na lista
        args[i] = r.newLiteral ? `"${r.newLiteral}"` : null;
      }
    }

    if (!foundWeight) return { weight: null, skipReason: null };
    const filtered = args.filter((a) => a !== null);
    const newCn = filtered.length === 0 ? '' : `{cn(${filtered.join(', ')})}`;
    return {
      weight: foundWeight,
      newAttrText: newCn,
      classNameNowEmpty: filtered.length === 0,
    };
  }

  // Casos não suportados: ternário, concat, template literal, etc.
  if (/font-(medium|semibold|bold|normal)/.test(trimmed)) {
    if (trimmed.includes('?') && trimmed.includes(':')) return { weight: null, skipReason: 'ternary on weight' };
    if (trimmed.includes('+')) return { weight: null, skipReason: 'string concat' };
    if (trimmed.includes('`')) return { weight: null, skipReason: 'template literal' };
    return { weight: null, skipReason: 'unsupported expression' };
  }
  return { weight: null, skipReason: null };
}

/** Tokeniza argumentos de cn(...) por vírgula, respeitando strings e parênteses. */
function splitCnArgs(s) {
  const args = [];
  let depth = 0;
  let inString = null;
  let buf = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const prev = i > 0 ? s[i - 1] : '';
    if (inString) {
      buf += ch;
      if (ch === inString && prev !== '\\') inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      buf += ch;
      continue;
    }
    if (ch === '(' || ch === '{' || ch === '[') depth++;
    else if (ch === ')' || ch === '}' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      args.push(buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim().length > 0) args.push(buf);
  return args;
}
```

- [ ] **Step 4: Implementar `transformFile(content)`**

Cole logo depois:

```js
/**
 * Transforma um arquivo TSX. Retorna { newContent, transformations, skips }.
 */
function transformFile(content) {
  // Localiza todas aberturas <Text|Heading ...>
  const tagRegex = /<(Text|Heading)\b([\s\S]*?)>/g;
  const transformations = [];
  const skips = [];
  let result = '';
  let lastIdx = 0;
  let m;

  while ((m = tagRegex.exec(content)) !== null) {
    const fullMatch = m[0];
    const tagName = m[1];
    const attrsBlock = m[2]; // tudo entre <Text e >
    const matchStart = m.index;

    // Pula matches dentro de strings (aproximação simples — improvável em JSX real)
    // Para robustez: verificar se está em string contando aspas até matchStart? omitido.

    // Já tem weight=?
    const hasWeight = /\bweight\s*=/.test(attrsBlock);
    if (hasWeight) {
      // Não vamos forçar; só log se houver font-* para resolver
      if (/font-(medium|semibold|bold|normal)/.test(attrsBlock)) {
        skips.push({ line: lineOf(content, matchStart), reason: 'weight prop already present' });
      }
      result += content.slice(lastIdx, matchStart) + fullMatch;
      lastIdx = matchStart + fullMatch.length;
      continue;
    }

    // Localiza className=... no attrsBlock
    const classNameRegex = /\bclassName\s*=\s*("[^"]*"|\{[\s\S]*?\})/;
    const cnMatch = attrsBlock.match(classNameRegex);
    if (!cnMatch) {
      result += content.slice(lastIdx, matchStart) + fullMatch;
      lastIdx = matchStart + fullMatch.length;
      continue;
    }

    const rawAttr = cnMatch[1];
    const r = transformClassNameAttr(rawAttr);
    if (r.skipReason) {
      skips.push({ line: lineOf(content, matchStart), reason: r.skipReason });
      result += content.slice(lastIdx, matchStart) + fullMatch;
      lastIdx = matchStart + fullMatch.length;
      continue;
    }
    if (!r.weight) {
      // sem font-* na className — nada a fazer
      result += content.slice(lastIdx, matchStart) + fullMatch;
      lastIdx = matchStart + fullMatch.length;
      continue;
    }

    // Construir nova abertura: substituir className=raw por weight="X" + className=newAttrText
    const weightAttr = `weight="${r.weight}"`;
    let newAttrsBlock;
    if (r.classNameNowEmpty) {
      // Remove className inteiro
      const fullClassName = cnMatch[0]; // 'className="..."'
      newAttrsBlock = attrsBlock.replace(fullClassName, weightAttr).replace(/\s+/g, ' ').trim();
      newAttrsBlock = ' ' + newAttrsBlock;
    } else {
      const newClassName = `className=${r.newAttrText}`;
      newAttrsBlock = attrsBlock.replace(classNameRegex, `${weightAttr} ${newClassName}`);
    }
    const newTag = `<${tagName}${newAttrsBlock}>`;

    transformations.push({ line: lineOf(content, matchStart) });
    result += content.slice(lastIdx, matchStart) + newTag;
    lastIdx = matchStart + fullMatch.length;
  }

  result += content.slice(lastIdx);
  return { newContent: result, transformations, skips };
}

function lineOf(content, idx) {
  return content.slice(0, idx).split('\n').length;
}
```

- [ ] **Step 5: Implementar driver (`runApply`, `runTests`, `main`)**

Cole no fim do arquivo:

```js
async function findFiles() {
  return glob('src/app/(authenticated)/**/*.tsx', {
    cwd: ROOT,
    absolute: true,
    ignore: ['**/node_modules/**', '**/*.d.ts', '**/*.test.*', '**/*.stories.*'],
  });
}

async function runApply({ apply }) {
  const files = await findFiles();
  console.log(`[codemod-typography-weight] ${apply ? 'APPLY' : 'DRY-RUN'} — ${files.length} arquivos`);
  let totalTransformations = 0;
  let filesChanged = 0;
  const allSkips = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    if (!/<(Text|Heading)\b/.test(content)) continue;
    const { newContent, transformations, skips } = transformFile(content);
    if (transformations.length > 0) {
      totalTransformations += transformations.length;
      filesChanged++;
      if (apply && newContent !== content) {
        await fs.writeFile(file, newContent, 'utf-8');
      }
    }
    for (const s of skips) {
      allSkips.push({ file: path.relative(ROOT, file), ...s });
    }
  }

  console.log(`\n[codemod-typography-weight] Resultado:`);
  console.log(`  Arquivos modificados: ${filesChanged}`);
  console.log(`  Elementos transformados: ${totalTransformations}`);
  console.log(`  Skips: ${allSkips.length}`);
  if (allSkips.length > 0) {
    console.log(`\n[codemod-typography-weight] Skips (alvo de Wave 12a-residual):`);
    for (const s of allSkips) console.log(`  ${s.file}:${s.line} — ${s.reason}`);
  }
  if (!apply) console.log(`\n  (dry-run — re-execute com --apply para gravar mudanças)`);
}

async function runTests() {
  const inputs = await glob('input-*.tsx', { cwd: FIXTURES_DIR, absolute: true });
  let pass = 0, fail = 0;
  for (const inputPath of inputs) {
    const name = path.basename(inputPath).replace(/^input-/, '').replace(/\.tsx$/, '');
    const expectedPath = path.join(FIXTURES_DIR, `expected-${name}.tsx`);
    const inputContent = await fs.readFile(inputPath, 'utf-8');
    const expectedContent = await fs.readFile(expectedPath, 'utf-8');
    const { newContent } = transformFile(inputContent);
    if (newContent === expectedContent) {
      console.log(`  ✓ ${name}`);
      pass++;
    } else {
      console.log(`  ✗ ${name}`);
      console.log('--- expected:');
      console.log(expectedContent);
      console.log('--- got:');
      console.log(newContent);
      fail++;
    }
  }
  console.log(`\n[codemod-typography-weight] Testes: ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--test')) {
    await runTests();
    return;
  }
  const apply = args.includes('--apply');
  await runApply({ apply });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

---

## Task 7: Rodar smoke tests do codemod

**Files:** nenhum.

- [ ] **Step 1: Executar `--test`**

```bash
node scripts/dev-tools/design/codemod-typography-weight.mjs --test
```

Expected:
```
  ✓ string-literal
  ✓ cn-call
  ✓ skip-cases

[codemod-typography-weight] Testes: 3 pass, 0 fail
```

- [ ] **Step 2: Se algum teste falhar, ler o diff impresso, corrigir o codemod, re-rodar**

Não prosseguir para Task 8 enquanto algum teste falhar. Iterar.

Erros comuns a investigar:
- Espaços extras/faltantes em `weight="X"` antes do `>`.
- `cn()` vazio que deveria virar string sem `cn`. (Aceitável para fixture, mas atenção em arquivos reais.)
- Atributo `className=""` residual em vez de removido.

---

## Task 8: Dry-run em arquivos reais

**Files:** nenhum (apenas leitura).

- [ ] **Step 1: Rodar codemod sem `--apply`**

```bash
node scripts/dev-tools/design/codemod-typography-weight.mjs > /tmp/wave-12a-dry-run.txt
tail -40 /tmp/wave-12a-dry-run.txt
```

Expected (números aproximados):
```
[codemod-typography-weight] DRY-RUN — 1023 arquivos
[codemod-typography-weight] Resultado:
  Arquivos modificados: 200-400
  Elementos transformados: 300-700
  Skips: 0-30
```

- [ ] **Step 2: Inspecionar lista de skips**

Skips devem ser raros e razoáveis (ternário, concat, peso duplo). Se aparecer algum skip com `reason: 'unsupported expression'` em quantidade alta (>10), abrir 2-3 desses arquivos e ver se há padrão recorrente que vale ser tratado no codemod (volta na Task 6 e amplia o `transformClassNameAttr`).

---

## Task 9: Aplicar codemod

**Files:**
- Modify (saída do codemod): `src/app/(authenticated)/**/*.tsx`

- [ ] **Step 1: Confirmar working tree limpo (apenas alterações da Task 2-3 stagaadas)**

```bash
git status
```

Expected: alterações apenas em `scripts/dev-tools/design/audit-design-system.ts` e arquivos novos em `scripts/dev-tools/design/codemod-typography-weight.mjs` e fixtures.

- [ ] **Step 2: Executar `--apply`**

```bash
node scripts/dev-tools/design/codemod-typography-weight.mjs --apply > /tmp/wave-12a-apply.txt 2>&1
tail -40 /tmp/wave-12a-apply.txt
```

- [ ] **Step 3: Conferir escopo do diff**

```bash
git status --short | head -20
git diff --stat | tail -10
```

Expected: arquivos modificados em `src/app/(authenticated)/**` na ordem de centenas. Nenhum arquivo fora desse escopo (exceto os 3 já tocados em Task 2-3).

---

## Task 10: Verificação técnica — typecheck + lint + auditor

**Files:** nenhum.

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | tail -20
```

Expected: nenhum erro novo. Se aparecer erro de tipo na prop `weight`, é provavelmente porque o codemod gerou um valor inválido — abrir o arquivo e investigar.

- [ ] **Step 2: ESLint**

```bash
npm run lint 2>&1 | tail -30
```

Expected: nenhum erro novo. Warnings pré-existentes podem permanecer.

- [ ] **Step 3: Rodar auditor de novo**

```bash
npx tsx scripts/dev-tools/design/audit-design-system.ts --metrics > /tmp/wave-12a-after-codemod.txt 2>&1
grep -E "(Typography Raw|Spacing Raw|Overall|font-medium|font-semibold|font-bold)" /tmp/wave-12a-after-codemod.txt | head
```

Expected:
- `Typography Raw Violations` ≤ 500 (ideal); ≤ 800 (teto de segurança).
- Outras KPIs estáveis (não regredir).

- [ ] **Step 4: Comparar com baselines**

```bash
echo "=== BEFORE (intacto):" && grep "Typography Raw" /tmp/wave-12a-before.txt
echo "=== APÓS DETECTOR:" && grep "Typography Raw" /tmp/wave-12a-after-detector.txt
echo "=== APÓS CODEMOD:" && grep "Typography Raw" /tmp/wave-12a-after-codemod.txt
```

Expected: queda monotônica (cada estágio reduz, nunca aumenta).

---

## Task 11: Smoke visual em 3 arquivos representativos

**Files:** nenhum (apenas inspeção).

- [ ] **Step 1: Escolher arquivos de 3 módulos diferentes**

```bash
git diff --name-only | grep -E "^src/app/\(authenticated\)" | head -20
```

Escolher 3 que representem módulos com volume alto (assinatura-digital, dashboard, audiencias).

- [ ] **Step 2: Inspecionar diff de cada um**

Para cada um dos 3 arquivos:

```bash
git diff -- <path/to/file.tsx>
```

Verificar:
- Cada `<Text>` ou `<Heading>` modificado tem `weight="..."` adicionado e `className` reduzida (ou removida).
- Nenhuma quebra de sintaxe (`>` perdido, aspas mal-fechadas).
- Indentação preservada.

- [ ] **Step 3: Se algum arquivo apresentar problema, registrar e corrigir manualmente**

Se for problema em 1-2 arquivos pontuais, corrigir manualmente. Se for problema em 10+ arquivos, é bug no codemod — reverter (`git checkout src/app/(authenticated)`) e voltar para Task 6.

---

## Task 12: (Opcional) Iniciar dev server e olhar 2-3 telas

**Files:** nenhum.

- [ ] **Step 1: Iniciar dev em background**

```bash
npm run dev &
```

Aguardar 10-15s para Turbopack subir.

- [ ] **Step 2: Sugerir ao usuário abrir o navegador em uma rota representativa**

(Nota para o engenheiro: este passo é opcional e depende de o usuário estar disponível para validar visualmente. Se ambiente headless, pular.)

- [ ] **Step 3: Encerrar dev server**

```bash
kill %1
```

---

## Task 13: Commit final

**Files:** nenhum (apenas commit).

- [ ] **Step 1: Stage seletivo**

```bash
git add scripts/dev-tools/design/audit-design-system.ts
git add scripts/dev-tools/design/codemod-typography-weight.mjs
git add scripts/dev-tools/design/__fixtures__/codemod-typography-weight/
git add 'src/app/(authenticated)'
git status
```

Confirmar que `git status` lista exatamente os arquivos esperados, nada mais.

- [ ] **Step 2: Capturar números reais para a mensagem do commit**

```bash
TYPOGRAPHY_NOW=$(grep "Typography Raw" /tmp/wave-12a-after-codemod.txt | grep -oE '[0-9]+' | head -1)
FILES_CHANGED=$(grep "Arquivos modificados" /tmp/wave-12a-apply.txt | grep -oE '[0-9]+')
ELEMS_TRANSFORMED=$(grep "Elementos transformados" /tmp/wave-12a-apply.txt | grep -oE '[0-9]+')
SKIPS=$(grep "^  Skips:" /tmp/wave-12a-apply.txt | grep -oE '[0-9]+')
echo "now=$TYPOGRAPHY_NOW files=$FILES_CHANGED elems=$ELEMS_TRANSFORMED skips=$SKIPS"
```

- [ ] **Step 3: Commit com mensagem descritiva**

```bash
git commit -m "$(cat <<EOF
feat(typography): detector context-aware + codemod weight-prop (Wave 12a)

Reduz Typography Raw Violations de 2900 → ${TYPOGRAPHY_NOW} consolidando duas
mudanças coordenadas:

1. Detector context-aware (audit-design-system.ts):
   font-*, leading-*, tracking-* só contam quando dentro de <Text> ou
   <Heading>. Em wrappers brutos (span/div/p/button/...) são uso legítimo
   de Tailwind (diretiva da Wave 9 — commit 8a69ac9c3).
   text-{xs,...,3xl} continuam sendo detectados em qualquer contexto
   (alvo de migração estrutural, Wave 12a-residual).

2. Codemod weight-prop (regex multi-passo, padrão codemod-white-opacity.mjs):
   <Text variant="x" className="font-medium ...">
     → <Text variant="x" weight="medium" className="...">
   ${ELEMS_TRANSFORMED} elementos transformados em ${FILES_CHANGED} arquivos.
   ${SKIPS} skips (peso ambíguo/dinâmico) registrados como TODO de
   Wave 12a-residual.

Optei por regex em vez de ts-morph para aderir ao padrão estabelecido pelo
codemod-white-opacity.mjs e evitar adicionar dependência. Os casos onde
regex falharia (string literals com '<Text' embutido em outras props) não
ocorrem no codebase. Smoke tests via fixtures (__fixtures__/) validam os
três casos de uso (string literal, cn(...), skips).

Wave 12a-residual ainda pendente: text-3xl/2xl/xl em wrappers brutos
que deveriam ser <Heading level="display-*"> ou <Text variant="kpi-value">.
EOF
)"
```

- [ ] **Step 4: Verificar commit**

```bash
git log --oneline -1
git show --stat HEAD | head
```

Expected: commit no master, ~3 arquivos novos + 1 modificado em `scripts/`, e ~200-400 modificados em `src/`.

- [ ] **Step 5: Atualizar memória do projeto sobre o estado da normalização**

Editar `~/.claude/projects/-Users-jordanmedeiros-Projetos-dev-now-zattar-os/memory/project_design_system_normalization.md` para refletir Wave 12a concluída e indicar Wave 12a-residual + 12b/c/d/e como pendentes.

---

## Critério de sucesso geral

A Wave 12a está concluída quando **todos** os itens abaixo são verdadeiros:

- [ ] `tsc --noEmit` exit 0 (sem erros novos).
- [ ] `npm run lint` exit 0 (sem erros novos).
- [ ] Auditor mostra `Typography Raw Violations` ≤ 500 (ideal) ou ≤ 800 (teto).
- [ ] Commit único no master com escopo correto (apenas `scripts/dev-tools/design/` e `src/app/(authenticated)/`).
- [ ] Skips do codemod (se houver) listados no corpo do commit.
- [ ] Memória de projeto atualizada com novo estado.
