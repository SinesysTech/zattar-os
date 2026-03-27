#!/usr/bin/env node
/**
 * Remove tsconfig.json de pacotes em node_modules que causam erros no VSCode.
 *
 * Pacotes como @copilotkit/runtime publicam seu tsconfig.json no npm,
 * fazendo o TS Language Server do VSCode tentar analisá-los como projetos.
 * Como esses tsconfigs referenciam dependências de dev (vitest) e configs
 * de monorepo (@copilotkit/tsconfig/base.json) que não existem localmente,
 * o VSCode exibe erros falso-positivos.
 *
 * Executado automaticamente após npm install via postinstall hook.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');

const filesToRemove = [
  'node_modules/@copilotkit/runtime/tsconfig.json',
  'node_modules/@copilotkit/shared/tsconfig.json',
];

let removed = 0;

for (const file of filesToRemove) {
  const fullPath = path.join(projectRoot, file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    removed++;
  }
}

if (removed > 0) {
  console.log(`✓ Removidos ${removed} tsconfig(s) problemáticos de node_modules`);
}
