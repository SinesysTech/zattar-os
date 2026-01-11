#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Verificando secrets no código...\n');

// 1. Executar ESLint
console.log('1️⃣ Executando ESLint...');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ ESLint: Nenhum secret detectado\n');
} catch (_error) {
  console.error('❌ ESLint: Secrets detectados\n');
  process.exit(1);
}

// 2. Verificar .env.local não está commitado
console.log('2️⃣ Verificando .env.local...');
const gitignore = fs.readFileSync('.gitignore', 'utf8');
if (!gitignore.includes('.env.local')) {
  console.error('❌ .env.local não está no .gitignore\n');
  process.exit(1);
}
console.log('✅ .env.local está no .gitignore\n');

// 3. Verificar se há arquivos .env commitados
console.log('3️⃣ Verificando arquivos .env commitados...');
try {
  const files = execSync('git ls-files', { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Ignorar arquivos que estão staged para deleção (ex.: removendo um .env.local já commitado)
  const deletedFromIndex = execSync('git diff --name-only --cached --diff-filter=D', {
    encoding: 'utf8',
  })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const deletedSet = new Set(deletedFromIndex);
  const effectiveFiles = files.filter((file) => !deletedSet.has(file));

  const envFiles = effectiveFiles.filter((file) => /^\.env(?!\.(example|template)$)/.test(file));

  if (envFiles.length > 0) {
    console.error('❌ Arquivos .env commitados:', envFiles.join('\n'));
    process.exit(1);
  }

  console.log('✅ Nenhum arquivo .env commitado\n');
} catch (error) {
  console.error('❌ Erro ao verificar arquivos .env:', error?.message || String(error));
  process.exit(1);
}

console.log('✅ Todas as verificações passaram!');
