#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PATH_PREFIXES = ['supabase/migrations/', 'supabase/schemas/'];
const AUTH_REGEX = /\bauth\.(uid|role|jwt|email)\(\)/gi;

function stripSqlComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');
}

function isViolation(line, matchIndex) {
  const prefix = line.slice(Math.max(0, matchIndex - 40), matchIndex);
  return !/\(\s*select\s+$/i.test(prefix);
}

function scanLines(lines, pathHint) {
  const violations = [];
  for (const { lineNo, content } of lines) {
    const stripped = content.replace(/--.*$/, '');
    let m;
    while ((m = AUTH_REGEX.exec(stripped)) !== null) {
      if (isViolation(stripped, m.index)) {
        violations.push({
          file: pathHint,
          line: lineNo,
          col: m.index + 1,
          match: m[0],
          text: content.trim(),
        });
      }
    }
    AUTH_REGEX.lastIndex = 0;
  }
  return violations;
}

function scanFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const stripped = stripSqlComments(raw);
  const lines = stripped.split('\n').map((content, idx) => ({
    lineNo: idx + 1,
    content,
  }));
  return scanLines(lines, filePath);
}

function getAllSqlFiles() {
  const files = [];
  for (const prefix of PATH_PREFIXES) {
    if (!existsSync(prefix)) continue;
    for (const entry of readdirSync(prefix)) {
      const full = join(prefix, entry);
      if (statSync(full).isFile() && entry.endsWith('.sql')) {
        files.push(full);
      }
    }
  }
  return files;
}

function getAddedLinesFromDiff() {
  const diff = execSync(
    `git diff --cached --unified=0 --diff-filter=ACM -- ${PATH_PREFIXES.map((p) => `'${p}*.sql'`).join(' ')}`,
    { encoding: 'utf8' }
  );
  const byFile = {};
  let currentFile = null;
  let currentLineNo = 0;

  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ b/')) {
      const path = line.slice(6);
      currentFile = PATH_PREFIXES.some((p) => path.startsWith(p)) && path.endsWith('.sql')
        ? path
        : null;
      if (currentFile) byFile[currentFile] = [];
    } else if (line.startsWith('@@ ') && currentFile) {
      const m = line.match(/\+(\d+)(?:,(\d+))?/);
      if (m) currentLineNo = parseInt(m[1], 10);
    } else if (line.startsWith('+') && !line.startsWith('+++') && currentFile) {
      byFile[currentFile].push({ lineNo: currentLineNo, content: line.slice(1) });
      currentLineNo++;
    }
  }
  return byFile;
}

function printReport(violations) {
  if (violations.length === 0) return;

  const grouped = {};
  for (const v of violations) {
    if (!grouped[v.file]) grouped[v.file] = [];
    grouped[v.file].push(v);
  }

  console.error('');
  console.error('RLS lint: auth.<fn>() direto em policies');
  console.error('========================================');
  for (const [file, vs] of Object.entries(grouped)) {
    console.error(`\n  ${file}`);
    for (const v of vs) {
      console.error(`    L${v.line}:${v.col}  ${v.match}  ->  (SELECT ${v.match})`);
      console.error(`      ${v.text}`);
    }
  }
  console.error('');
  console.error(`${violations.length} violacao(es) em ${Object.keys(grouped).length} arquivo(s).`);
  console.error('');
  console.error('Motivo: auth.<fn>() direto e reavaliado por LINHA (Supabase advisor 0003_auth_rls_initplan).');
  console.error('Wrapping em (SELECT ...) transforma em InitPlan avaliado UMA vez por query.');
  console.error('Doc: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select');
  console.error('');
  console.error('Para bypassar apenas este commit (NAO recomendado): git commit --no-verify');
  console.error('');
}

const args = process.argv.slice(2);
const isAll = args.includes('--all');
const fileArgs = args.filter(
  (a) => !a.startsWith('-') && PATH_PREFIXES.some((p) => a.startsWith(p)) && a.endsWith('.sql')
);

let violations = [];

if (isAll) {
  for (const file of getAllSqlFiles()) {
    violations.push(...scanFile(file));
  }
} else if (fileArgs.length > 0) {
  for (const file of fileArgs) {
    if (existsSync(file)) violations.push(...scanFile(file));
  }
} else {
  const byFile = getAddedLinesFromDiff();
  for (const [file, lines] of Object.entries(byFile)) {
    violations.push(...scanLines(lines, file));
  }
}

printReport(violations);
process.exit(violations.length > 0 ? 1 : 0);
