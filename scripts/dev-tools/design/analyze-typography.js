#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Script de análise de uso de tipografia no código
 *
 * Encontra componentes que usam classes de tipografia Tailwind inconsistentes
 * e sugere migração para o sistema de tipografia shadcn/ui
 *
 * Uso: node scripts/analyze-typography.js
 */

const fs = require('fs');
const path = require('path');

// Classes de tipografia Tailwind comuns que podem ser substituídas
const tailwindTypographyClasses = [
  /\btext-\d+xl\b/g,              // text-xl, text-2xl, text-3xl, etc.
  /\btext-lg\b/g,                 // text-lg
  /\btext-sm\b/g,                 // text-sm
  /\btext-xs\b/g,                 // text-xs
  /\btext-base\b/g,               // text-base
  /\bfont-bold\b/g,               // font-bold
  /\bfont-semibold\b/g,           // font-semibold
  /\bfont-medium\b/g,             // font-medium
  /\bleading-\w+\b/g,             // leading-tight, leading-normal, etc.
  /\btracking-\w+\b/g,            // tracking-tight, tracking-wide, etc.
];

// Diretórios a serem analisados
const directories = [
  'app',
  'components',
];

// Arquivos a ignorar
const ignorePatterns = [
  'node_modules',
  '.next',
  'dist',
  'build',
  'typography.tsx',  // Próprio componente de tipografia
  'page.tsx',        // Página de documentação
];

const results = {
  totalFiles: 0,
  filesWithTypography: 0,
  components: [],
  summary: {
    byClass: {},
    byFile: {},
  },
};

/**
 * Verifica se arquivo deve ser ignorado
 */
function shouldIgnore(filePath) {
  return ignorePatterns.some(pattern => filePath.includes(pattern));
}

/**
 * Analisa um arquivo em busca de classes de tipografia
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);

  const matches = [];

  tailwindTypographyClasses.forEach((regex) => {
    const foundMatches = content.match(regex);
    if (foundMatches) {
      foundMatches.forEach(match => {
        matches.push({
          class: match,
          count: (content.match(new RegExp(match, 'g')) || []).length,
        });
      });
    }
  });

  if (matches.length > 0) {
    results.filesWithTypography++;

    // Agrupar por classe
    matches.forEach(({ class: className, count }) => {
      if (!results.summary.byClass[className]) {
        results.summary.byClass[className] = 0;
      }
      results.summary.byClass[className] += count;
    });

    // Determinar prioridade baseado em tipo de arquivo
    let priority = 'low';
    if (filePath.includes('components/ui/')) {
      priority = 'high';
    } else if (filePath.includes('app/') && !filePath.includes('/api/')) {
      priority = 'medium';
    }

    results.components.push({
      file: relativePath,
      matches: matches.reduce((acc, { class: className, count }) => {
        acc[className] = (acc[className] || 0) + count;
        return acc;
      }, {}),
      priority,
      totalMatches: matches.reduce((sum, { count }) => sum + count, 0),
    });
  }
}

/**
 * Varre diretório recursivamente
 */
function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);

    if (shouldIgnore(fullPath)) {
      return;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      results.totalFiles++;
      analyzeFile(fullPath);
    }
  });
}

/**
 * Gera relatório
 */
function generateReport() {
  console.log('\n📊 ANÁLISE DE TIPOGRAFIA\n');
  console.log('='.repeat(60));

  console.log(`\n📁 Arquivos analisados: ${results.totalFiles}`);
  console.log(`📝 Arquivos com tipografia Tailwind: ${results.filesWithTypography}`);
  console.log(`📈 Taxa de uso: ${((results.filesWithTypography / results.totalFiles) * 100).toFixed(1)}%\n`);

  // Classes mais usadas
  console.log('='.repeat(60));
  console.log('\n🏆 CLASSES MAIS USADAS\n');

  const sortedClasses = Object.entries(results.summary.byClass)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  sortedClasses.forEach(([className, count], index) => {
    console.log(`${index + 1}. ${className.padEnd(20)} → ${count} ocorrências`);
  });

  // Componentes prioritários
  console.log('\n' + '='.repeat(60));
  console.log('\n🎯 COMPONENTES PRIORITÁRIOS (Alta prioridade)\n');

  const highPriority = results.components
    .filter(c => c.priority === 'high')
    .sort((a, b) => b.totalMatches - a.totalMatches)
    .slice(0, 15);

  if (highPriority.length > 0) {
    highPriority.forEach((component, index) => {
      console.log(`${index + 1}. ${component.file}`);
      console.log(`   Ocorrências: ${component.totalMatches}`);
      console.log(`   Classes: ${Object.keys(component.matches).join(', ')}\n`);
    });
  } else {
    console.log('Nenhum componente de alta prioridade encontrado.\n');
  }

  // Componentes de média prioridade
  console.log('='.repeat(60));
  console.log('\n📄 COMPONENTES DE MÉDIA PRIORIDADE (Páginas)\n');

  const mediumPriority = results.components
    .filter(c => c.priority === 'medium')
    .sort((a, b) => b.totalMatches - a.totalMatches)
    .slice(0, 10);

  if (mediumPriority.length > 0) {
    mediumPriority.forEach((component, index) => {
      console.log(`${index + 1}. ${component.file} (${component.totalMatches} ocorrências)`);
    });
  } else {
    console.log('Nenhum componente de média prioridade encontrado.\n');
  }

  // Recomendações
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 RECOMENDAÇÕES\n');

  console.log('1. Migrar componentes de alta prioridade primeiro (components/ui/)');
  console.log('2. Substituir classes Tailwind por Typography components ou classes CSS');
  console.log('3. Estabelecer guideline: novos componentes devem usar sistema de tipografia');
  console.log('4. Revisar páginas principais para consistência visual\n');

  console.log('='.repeat(60));
  console.log('\n✅ Análise concluída!\n');
}

// Executar análise
console.log('🔍 Analisando uso de tipografia...\n');

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  }
});

generateReport();

// Exportar resultados para JSON
const outputPath = path.join(process.cwd(), 'typography-analysis.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`📄 Resultados exportados para: ${outputPath}\n`);
