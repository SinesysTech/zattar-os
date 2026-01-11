/*
 * Detecta usos potencialmente inseguros de localStorage sem useSecureStorage.
 *
 * Regra simples:
 * - Procura por localStorage.setItem/getItem/removeItem em src/
 * - Ignora o hook use-secure-storage e utilitários de limpeza
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');

const IGNORE_FILES = new Set([
  path.join(SRC, 'hooks', 'use-secure-storage.ts'),
  path.join(SRC, 'lib', 'utils', 'clear-secure-storage.ts'),
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      files.push(...walk(full));
    } else if (entry.isFile()) {
      if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
      files.push(full);
    }
  }
  return files;
}

function scanFile(filePath) {
  if (IGNORE_FILES.has(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  const findings = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (/\blocalStorage\.(setItem|getItem|removeItem)\s*\(/.test(line)) {
      findings.push({ filePath, lineNumber: i + 1, line: line.trim() });
    }
  }

  return findings;
}

function main() {
  const files = walk(SRC);
  const findings = files.flatMap(scanFile);

  if (findings.length === 0) {
    console.log('OK: nenhum uso direto de localStorage encontrado (fora das exceções).');
    process.exit(0);
  }

  console.error('Encontrado uso direto de localStorage (verificar se precisa useSecureStorage):');
  for (const f of findings) {
    const rel = path.relative(ROOT, f.filePath);
    console.error(`- ${rel}:${f.lineNumber} ${f.line}`);
  }

  process.exit(1);
}

main();
