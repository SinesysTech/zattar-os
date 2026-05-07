#!/usr/bin/env node
/**
 * Codemod: <Text|Heading className="font-{normal,medium,semibold,bold}"> → weight="X"
 *
 * Wave 12a — migra usos de `<Text>` e `<Heading>` (typography.tsx) que carregam
 * peso de fonte via `font-*` no `className` para a prop `weight` introduzida na
 * Wave 9. Reduz duplicação entre className e a API de variants/weights, deixa o
 * peso explícito na prop e sai do caminho do design system de tipografia.
 *
 * Casos cobertos:
 *   - className="font-medium ..."           → weight="medium"  + className remanescente
 *   - className="font-bold"                 → weight="bold"    (remove className=)
 *   - className={cn("font-medium", x)}      → weight="medium"  + cn(x)
 *   - className={cn("font-bold")}           → weight="bold"    (remove className=)
 *
 * Casos pulados (skip — exigem revisão manual):
 *   - className={cond ? "font-medium" : "font-bold"}  → ternário
 *   - className={"font-medium " + extra}              → string concat
 *   - className={`font-medium ${x}`}                  → template literal
 *   - className="font-medium font-bold"               → peso duplo
 *   - <Text weight="X" className="font-Y">            → weight prop already present
 *   - className={someExpr} (sem string literal)       → unsupported expression
 *
 * Por que regex (e não ts-morph): segue a convenção do
 * `codemod-white-opacity.mjs` — codemods leves, sem deps de AST. O escopo aqui
 * é estreito (apenas `<Text>` e `<Heading>` JSX) e os skips cobrem os casos de
 * regex insuficiente, deixando a expressão segura.
 *
 * CLI:
 *   node scripts/dev-tools/design/codemod-typography-weight.mjs           # dry-run
 *   node scripts/dev-tools/design/codemod-typography-weight.mjs --apply   # aplica
 *   node scripts/dev-tools/design/codemod-typography-weight.mjs --test    # smoke tests
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.cwd();

const WEIGHT_RE = /\bfont-(normal|medium|semibold|bold)\b/g;

// ---------------------------------------------------------------------------
// Pure functions (testable)
// ---------------------------------------------------------------------------

/**
 * Extrai (no máximo) um token `font-{normal,medium,semibold,bold}` de uma
 * string de classes Tailwind.
 *
 * @param {string} literal — conteúdo interno (sem aspas).
 * @returns {{weight: ('normal'|'medium'|'semibold'|'bold'|null), newLiteral: string, skipReason: (string|null)}}
 */
export function extractWeightFromString(literal) {
  const matches = [...literal.matchAll(WEIGHT_RE)];
  if (matches.length === 0) {
    return { weight: null, newLiteral: literal, skipReason: null };
  }
  if (matches.length > 1) {
    return { weight: null, newLiteral: literal, skipReason: 'multiple weight tokens' };
  }
  const weight = matches[0][1];
  // Remove o token, normaliza whitespace.
  const tokens = literal.split(/\s+/).filter((t) => t.length > 0);
  const filtered = tokens.filter((t) => t !== `font-${weight}`);
  const newLiteral = filtered.join(' ');
  return { weight, newLiteral, skipReason: null };
}

/**
 * Tokeniza os argumentos de uma chamada `cn(...)` por vírgulas de topo,
 * respeitando parênteses, chaves, colchetes e literais de string aninhados.
 *
 * @param {string} s — conteúdo interno do `cn(...)` (sem o `cn(` nem o `)` de fora).
 * @returns {string[]} — argumentos brutos (com whitespace original ao redor).
 */
export function splitCnArgs(s) {
  const args = [];
  let depthParen = 0;
  let depthBrace = 0;
  let depthBracket = 0;
  let inString = null; // '"' | "'" | '`' | null
  let escape = false;
  let start = 0;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (ch === '\\') {
        escape = true;
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      continue;
    }
    if (ch === '(') depthParen++;
    else if (ch === ')') depthParen--;
    else if (ch === '{') depthBrace++;
    else if (ch === '}') depthBrace--;
    else if (ch === '[') depthBracket++;
    else if (ch === ']') depthBracket--;
    else if (
      ch === ',' &&
      depthParen === 0 &&
      depthBrace === 0 &&
      depthBracket === 0
    ) {
      args.push(s.slice(start, i));
      start = i + 1;
    }
  }
  // Último arg (se não vazio ou se há pelo menos um caractere não-WS).
  const tail = s.slice(start);
  if (args.length > 0 || tail.trim().length > 0) {
    args.push(tail);
  }
  return args;
}

/**
 * Transforma o valor cru do atributo `className` (incluindo aspas ou chaves).
 *
 * @param {string} rawAttr — texto cru do valor: `"..."` ou `{...}`.
 * @returns {{weight: ('normal'|'medium'|'semibold'|'bold'|null), newAttrText: string, skipReason: (string|null), classNameNowEmpty: boolean}}
 */
export function transformClassNameAttr(rawAttr) {
  // Caso 1: string literal "..." ou '...'.
  const strMatch = rawAttr.match(/^(['"])([\s\S]*)\1$/);
  if (strMatch) {
    const quote = strMatch[1];
    const inner = strMatch[2];
    const { weight, newLiteral, skipReason } = extractWeightFromString(inner);
    if (skipReason) {
      return { weight: null, newAttrText: rawAttr, skipReason, classNameNowEmpty: false };
    }
    if (weight === null) {
      return { weight: null, newAttrText: rawAttr, skipReason: null, classNameNowEmpty: false };
    }
    const trimmed = newLiteral.trim();
    if (trimmed.length === 0) {
      return { weight, newAttrText: '', skipReason: null, classNameNowEmpty: true };
    }
    return {
      weight,
      newAttrText: `${quote}${trimmed}${quote}`,
      skipReason: null,
      classNameNowEmpty: false,
    };
  }

  // Caso 2: expressão {...}.
  if (rawAttr.startsWith('{') && rawAttr.endsWith('}')) {
    const inner = rawAttr.slice(1, -1);
    const trimmedInner = inner.trim();

    // Sub-caso 2a: chamada cn(...).
    const cnMatch = trimmedInner.match(/^cn\s*\(([\s\S]*)\)$/);
    if (cnMatch) {
      const cnArgsRaw = cnMatch[1];
      const args = splitCnArgs(cnArgsRaw);
      // Procura UM arg que seja string literal contendo um único peso.
      let weightFound = null;
      let weightArgIdx = -1;
      let replacementArg = null; // se o arg ficar não-vazio após retirar o peso.
      const otherArgsHaveWeight = [];

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const t = arg.trim();
        const m = t.match(/^(['"])([\s\S]*)\1$/);
        if (!m) {
          // Arg não-string: pode conter peso? Se contiver, é um skip.
          if (WEIGHT_RE.test(t)) {
            // Reset lastIndex (regex /g).
            WEIGHT_RE.lastIndex = 0;
            otherArgsHaveWeight.push(i);
          }
          WEIGHT_RE.lastIndex = 0;
          continue;
        }
        const innerStr = m[2];
        const ext = extractWeightFromString(innerStr);
        if (ext.skipReason) {
          return { weight: null, newAttrText: rawAttr, skipReason: ext.skipReason, classNameNowEmpty: false };
        }
        if (ext.weight === null) continue;
        if (weightFound) {
          // Mais de um arg com peso → skip.
          return { weight: null, newAttrText: rawAttr, skipReason: 'multiple weight tokens', classNameNowEmpty: false };
        }
        weightFound = ext.weight;
        weightArgIdx = i;
        const newInner = ext.newLiteral.trim();
        if (newInner.length === 0) {
          replacementArg = null; // remove o arg.
        } else {
          // Preserva whitespace ao redor (leading/trailing) do arg original.
          const leading = arg.match(/^\s*/)[0];
          const trailing = arg.match(/\s*$/)[0];
          replacementArg = `${leading}${m[1]}${newInner}${m[1]}${trailing}`;
        }
      }

      if (otherArgsHaveWeight.length > 0) {
        return { weight: null, newAttrText: rawAttr, skipReason: 'unsupported expression', classNameNowEmpty: false };
      }

      if (!weightFound) {
        return { weight: null, newAttrText: rawAttr, skipReason: null, classNameNowEmpty: false };
      }

      // Reassembla.
      let newArgs;
      if (replacementArg === null) {
        newArgs = args.filter((_, i) => i !== weightArgIdx);
      } else {
        newArgs = args.map((a, i) => (i === weightArgIdx ? replacementArg : a));
      }

      if (newArgs.length === 0) {
        return { weight: weightFound, newAttrText: '', skipReason: null, classNameNowEmpty: true };
      }

      // Junta com vírgulas. Como cada arg preserva seu próprio whitespace
      // (lead/trail), basta unir por ','.
      // Mas, se o primeiro arg foi removido, o segundo terá ' "x"' (com space
      // leading) — está OK, pois o cn(...) original tinha `cn(<arg1>,<arg2>)`
      // onde arg1 não tinha leading space e arg2 tinha; agora arg2 vira o
      // primeiro com leading space. Para casar com o fixture, removemos o
      // leading whitespace do primeiro arg quando ele veio de uma posição
      // posterior (i.e., arg1 foi removido).
      if (replacementArg === null && weightArgIdx === 0 && newArgs.length > 0) {
        newArgs[0] = newArgs[0].replace(/^\s+/, '');
      }

      const newCnContents = newArgs.join(',');
      return {
        weight: weightFound,
        newAttrText: `{cn(${newCnContents})}`,
        skipReason: null,
        classNameNowEmpty: false,
      };
    }

    // Sub-caso 2b: outras expressões. Se contém peso, classifica o skip.
    if (WEIGHT_RE.test(trimmedInner)) {
      WEIGHT_RE.lastIndex = 0;
      let skipReason;
      if (trimmedInner.includes('?') && trimmedInner.includes(':')) {
        skipReason = 'ternary on weight';
      } else if (trimmedInner.includes('+')) {
        skipReason = 'string concat';
      } else if (trimmedInner.includes('`')) {
        skipReason = 'template literal';
      } else {
        skipReason = 'unsupported expression';
      }
      return { weight: null, newAttrText: rawAttr, skipReason, classNameNowEmpty: false };
    }
    WEIGHT_RE.lastIndex = 0;

    return { weight: null, newAttrText: rawAttr, skipReason: null, classNameNowEmpty: false };
  }

  // Forma desconhecida — não toca.
  return { weight: null, newAttrText: rawAttr, skipReason: null, classNameNowEmpty: false };
}

/**
 * Retorna a linha (1-based) do offset `idx` em `content`.
 */
export function lineOf(content, idx) {
  let line = 1;
  for (let i = 0; i < idx && i < content.length; i++) {
    if (content[i] === '\n') line++;
  }
  return line;
}

/**
 * Procura, dentro do texto da abertura de uma tag JSX, o atributo `className`.
 * Retorna offsets relativos ao texto da tag.
 *
 * @returns {{start: number, end: number, valueRaw: string} | null}
 */
function findClassNameAttr(tagText) {
  const re = /\bclassName\s*=\s*("[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\})/;
  const m = tagText.match(re);
  if (!m) return null;
  const start = m.index;
  const end = m.index + m[0].length;
  const valueRaw = m[1];
  return { start, end, valueRaw };
}

/**
 * Verifica se a tag de abertura já tem o atributo `weight=`.
 */
function hasWeightAttr(tagText) {
  return /\bweight\s*=/.test(tagText);
}

/**
 * Encontra o ponto de inserção para o atributo `weight=` na tag de abertura.
 * Prefere logo após `variant=...` ou `level=...`; senão, logo após o nome da tag.
 *
 * @returns {number} — offset relativo ao texto da tag, onde o atributo deve ser
 *   inserido (substituindo eventual whitespace anterior — cf. lógica do caller).
 */
function findWeightInsertPoint(tagText) {
  const variantRe = /\b(variant|level)\s*=\s*("[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\})/;
  const m = tagText.match(variantRe);
  if (m) {
    return m.index + m[0].length;
  }
  // Senão: após o nome da tag (`<Text` ou `<Heading`).
  const nameMatch = tagText.match(/^<(Text|Heading)\b/);
  if (nameMatch) {
    return nameMatch[0].length;
  }
  return -1;
}

/**
 * Transforma o conteúdo completo de um arquivo, processando todas as aberturas
 * de `<Text>` e `<Heading>`.
 */
export function transformFile(content) {
  const tagRe = /<(Text|Heading)\b[\s\S]*?(\/?>)/g;
  const transformations = [];
  const skips = [];

  let result = '';
  let lastIdx = 0;
  let match;

  while ((match = tagRe.exec(content)) !== null) {
    const tagText = match[0];
    const tagStart = match.index;
    const tagLine = lineOf(content, tagStart);

    // Append do trecho intermediário antes desta tag.
    result += content.slice(lastIdx, tagStart);
    lastIdx = tagStart + tagText.length;

    // 1. Procura className.
    const classAttr = findClassNameAttr(tagText);
    if (!classAttr) {
      // Sem className → nada a fazer.
      result += tagText;
      continue;
    }

    // 2. Tenta extrair weight.
    const xform = transformClassNameAttr(classAttr.valueRaw);

    // 3a. Skip explícito.
    if (xform.skipReason) {
      skips.push({ line: tagLine, reason: xform.skipReason });
      result += tagText;
      continue;
    }

    // 3b. No-op (não tem peso).
    if (xform.weight === null) {
      result += tagText;
      continue;
    }

    // 3c. Já tem weight prop e ALSO tem font-* em className → skip.
    if (hasWeightAttr(tagText)) {
      skips.push({ line: tagLine, reason: 'weight prop already present' });
      result += tagText;
      continue;
    }

    // 4. Reescreve a tag.
    let newTag = tagText;

    // 4a. Substitui ou remove `className=...`.
    if (xform.classNameNowEmpty) {
      // Remove o atributo inteiro, INCLUINDO a whitespace que o precede.
      let removeStart = classAttr.start;
      while (removeStart > 0 && /\s/.test(newTag[removeStart - 1])) {
        removeStart--;
      }
      newTag = newTag.slice(0, removeStart) + newTag.slice(classAttr.end);
    } else {
      // Substitui apenas o valor.
      newTag =
        newTag.slice(0, classAttr.start) +
        `className=${xform.newAttrText}` +
        newTag.slice(classAttr.end);
    }

    // 4b. Insere `weight="X"` após variant=/level= ou após o nome da tag.
    const insertAt = findWeightInsertPoint(newTag);
    if (insertAt < 0) {
      // Falha estrutural — não toca.
      result += tagText;
      continue;
    }
    const weightAttr = ` weight="${xform.weight}"`;
    newTag = newTag.slice(0, insertAt) + weightAttr + newTag.slice(insertAt);

    transformations.push({ line: tagLine });
    result += newTag;
  }

  result += content.slice(lastIdx);
  return { newContent: result, transformations, skips };
}

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

async function findFiles() {
  return glob('src/app/(authenticated)/**/*.tsx', {
    cwd: ROOT,
    absolute: true,
    ignore: ['**/node_modules/**', '**/*.d.ts', '**/*.test.*', '**/*.stories.*'],
  });
}

async function runApply({ apply }) {
  const files = await findFiles();
  console.log(`${apply ? '[APPLY]' : '[DRY-RUN]'} Vasculhando src/app/(authenticated)/**/*.tsx (${files.length} arquivos)...`);

  let totalFiles = 0;
  let totalTransforms = 0;
  const allSkips = [];

  for (const file of files) {
    const src = await fs.readFile(file, 'utf-8');
    const { newContent, transformations, skips } = transformFile(src);
    if (skips.length > 0) {
      const rel = path.relative(ROOT, file);
      for (const s of skips) {
        allSkips.push({ file: rel, line: s.line, reason: s.reason });
      }
    }
    if (transformations.length > 0) {
      totalFiles++;
      totalTransforms += transformations.length;
      const rel = path.relative(ROOT, file);
      console.log(`${apply ? 'WRITE' : 'PLAN '} ${rel} (${transformations.length} transformações)`);
      if (apply && newContent !== src) {
        await fs.writeFile(file, newContent, 'utf-8');
      }
    }
  }

  console.log('');
  console.log(`Arquivos modificados: ${totalFiles}`);
  console.log(`Elementos transformados: ${totalTransforms}`);
  console.log(`Skips: ${allSkips.length}`);
  if (allSkips.length > 0) {
    console.log('');
    console.log('Skips detalhados:');
    for (const s of allSkips) {
      console.log(`  ${s.file}:${s.line} — ${s.reason}`);
    }
  }
  if (!apply) {
    console.log('');
    console.log('Re-run with --apply to write changes.');
  }
}

async function runTests() {
  const fixturesDir = path.join(__dirname, '__fixtures__', 'codemod-typography-weight');
  const inputs = await glob('input-*.tsx', { cwd: fixturesDir, absolute: true });
  inputs.sort();

  let pass = 0;
  let fail = 0;

  for (const inputPath of inputs) {
    const name = path.basename(inputPath).replace(/^input-/, '').replace(/\.tsx$/, '');
    const expectedPath = path.join(fixturesDir, `expected-${name}.tsx`);
    const inputSrc = await fs.readFile(inputPath, 'utf-8');
    const expectedSrc = await fs.readFile(expectedPath, 'utf-8');
    const { newContent } = transformFile(inputSrc);

    if (newContent === expectedSrc) {
      console.log(`  ✓ ${name}`);
      pass++;
    } else {
      console.log(`  ✗ ${name}`);
      // Diff linha-a-linha simplificado.
      const aLines = newContent.split('\n');
      const bLines = expectedSrc.split('\n');
      const max = Math.max(aLines.length, bLines.length);
      for (let i = 0; i < max; i++) {
        if (aLines[i] !== bLines[i]) {
          console.log(`    line ${i + 1}:`);
          console.log(`      got:      ${JSON.stringify(aLines[i])}`);
          console.log(`      expected: ${JSON.stringify(bLines[i])}`);
        }
      }
      fail++;
    }
  }

  console.log('');
  console.log(`[codemod-typography-weight] Testes: ${pass} pass, ${fail} fail`);
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
