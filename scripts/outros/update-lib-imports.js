#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

/**
 * Script para atualizar imports de @/lib para @/app/_lib
 * Atualiza automaticamente todos os arquivos do frontend
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mapeamento de imports antigos -> novos
const importMappings = {
  "@/lib/utils": "@/app/_lib/utils",
  "@/lib/api/": "@/app/_lib/api/",
  "@/lib/hooks/": "@/app/_lib/hooks/",
  "@/lib/types/": "@/app/_lib/types/",
  "@/lib/constants/": "@/app/_lib/constants/",
  "@/lib/client": "@/app/_lib/supabase/client",
};

// Diretórios para processar (apenas frontend)
const directories = ['app/', 'components/'];

function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Substituir cada mapeamento
    for (const [oldPath, newPath] of Object.entries(importMappings)) {
      const regex = new RegExp(oldPath.replace(/\//g, '\\/'), 'g');
      if (content.includes(oldPath)) {
        content = content.replace(regex, newPath);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Atualizado: ${filePath}`);
      return 1;
    }
    return 0;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return 0;
  }
}

function processDirectory(dir) {
  let count = 0;
  
  try {
    // Buscar todos os arquivos .ts e .tsx
    const command = `find ${dir} -type f \\( -name "*.ts" -o -name "*.tsx" \\) -not -path "*/node_modules/*" -not -path "*/.next/*"`;
    const files = execSync(command, { encoding: 'utf8' })
      .split('\n')
      .filter(f => f.trim());

    files.forEach(file => {
      count += updateImportsInFile(file);
    });
  } catch (error) {
    console.error(`❌ Erro ao processar diretório ${dir}:`, error.message);
  }

  return count;
}

function main() {
  console.log('🚀 Iniciando atualização de imports...\n');
  
  let totalUpdated = 0;
  
  directories.forEach(dir => {
    console.log(`📁 Processando ${dir}...`);
    const count = processDirectory(dir);
    totalUpdated += count;
    console.log(`   ${count} arquivo(s) atualizado(s)\n`);
  });

  console.log(`\n✨ Concluído! ${totalUpdated} arquivo(s) atualizado(s) no total.`);
}

main();
