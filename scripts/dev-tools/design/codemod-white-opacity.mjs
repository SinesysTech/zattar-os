#!/usr/bin/env node
/**
 * Codemod: bg-white/N | border-white/N → bg-foreground/N | border-foreground/N
 *
 * Migra classes Tailwind `bg-white/N`, `border-white/N`, `hover:*`, `dark:*` com
 * opacidades baixas (1-15) para tokens semânticos que se auto-invertem por tema
 * via CSS variable `--foreground` e `--border` já definidas em globals.css.
 *
 * Equivalência de comportamento (preserva visual):
 *   bg-white/5   light (auto-invertido)   rgba(0,0,0,0.03)
 *   bg-foreground/5 light                 oklch(0.15 0.01 281 / 0.05)  ← similar
 *
 *   bg-white/5   dark                     rgba(255,255,255,0.05)
 *   bg-foreground/5 dark                  oklch(0.98 0 0 / 0.05)       ← equivalente
 *
 * CLI:
 *   node scripts/dev-tools/design/codemod-white-opacity.mjs            # dry-run
 *   node scripts/dev-tools/design/codemod-white-opacity.mjs --apply    # aplica
 *   node scripts/dev-tools/design/codemod-white-opacity.mjs --apply --only src/app/...
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';

const ROOT = process.cwd();

// Arquivos que devem ser SKIPADOS pelo codemod (contexto always-dark legítimo).
// Mantidos em sync com ALLOWED_OFFENDERS do audit-design-system.ts.
const SKIP_PATTERNS = [
  /src\/components\/ui\/reel\.tsx$/,     // Video reel UI — always-dark overlay
  /src\/components\/editor\/plate-ui\//,  // Plate.js integrations
];

// Regexes de migração. Preserva prefixo (hover:, dark:, focus:, group-hover: etc).
const REPLACEMENTS = [
  // bg-white/N (1-15) com qualquer prefixo
  {
    pattern: /\b((?:[a-z-]+:)*)bg-white\/(1[0-5]|[1-9])\b/g,
    replacement: '$1bg-foreground/$2',
    label: 'bg-white/N',
  },
  // border-white/N (1-99)
  {
    pattern: /\b((?:[a-z-]+:)*)border-white\/(\d{1,2})\b/g,
    replacement: '$1border-foreground/$2',
    label: 'border-white/N',
  },
];

async function findFiles() {
  return glob('src/**/*.{ts,tsx}', {
    cwd: ROOT,
    absolute: true,
    ignore: ['**/node_modules/**', '**/*.d.ts', '**/*.test.*', '**/*.stories.*'],
  });
}

function shouldSkip(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  return SKIP_PATTERNS.some((re) => re.test(rel));
}

async function processFile(filePath, apply) {
  const src = await fs.readFile(filePath, 'utf-8');
  let result = src;
  const changes = [];

  for (const rule of REPLACEMENTS) {
    const matches = [...src.matchAll(rule.pattern)];
    if (matches.length === 0) continue;
    for (const m of matches) {
      changes.push({ rule: rule.label, from: m[0], to: m[0].replace(rule.pattern, rule.replacement) });
    }
    result = result.replace(rule.pattern, rule.replacement);
  }

  if (result !== src && apply) {
    await fs.writeFile(filePath, result, 'utf-8');
  }

  return { changed: result !== src, changes };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const onlyIdx = process.argv.indexOf('--only');
  const onlyPath = onlyIdx !== -1 ? process.argv[onlyIdx + 1] : null;

  console.log(`${apply ? '[APPLY]' : '[DRY-RUN]'} Searching src/**/*.{ts,tsx}...`);

  let files = await findFiles();
  if (onlyPath) {
    files = files.filter((f) => f.includes(onlyPath));
  }

  let totalFiles = 0;
  let totalChanges = 0;
  let skipped = 0;

  for (const file of files) {
    if (shouldSkip(file)) {
      const rel = path.relative(ROOT, file);
      // Só mostra skipped se o arquivo tem matches
      const { changes } = await processFile(file, false);
      if (changes.length > 0) {
        console.log(`SKIP ${rel} (${changes.length} ofensores — ALLOWED)`);
        skipped += changes.length;
      }
      continue;
    }
    const { changed, changes } = await processFile(file, apply);
    if (changed) {
      totalFiles++;
      totalChanges += changes.length;
      const rel = path.relative(ROOT, file);
      console.log(`${apply ? 'WRITE' : 'PLAN '} ${rel} (${changes.length} mudanças)`);
      if (!apply) {
        for (const c of changes.slice(0, 3)) {
          console.log(`       ${c.from}  →  ${c.to}`);
        }
        if (changes.length > 3) console.log(`       ...+${changes.length - 3} more`);
      }
    }
  }

  console.log('');
  console.log(`Total: ${totalFiles} arquivos, ${totalChanges} mudanças`);
  if (skipped > 0) console.log(`Skipped (ALLOWED): ${skipped} ofensores`);
  if (!apply) console.log('Re-run with --apply to write changes.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
