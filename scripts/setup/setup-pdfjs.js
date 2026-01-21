#!/usr/bin/env node
/**
 * Script para copiar o PDF.js worker do node_modules para public/pdfjs/
 * Executado automaticamente após npm install via postinstall hook
 */

const fs = require('fs');
const path = require('path');

// Possíveis localizações do pdfjs-dist worker (dependência direta ou via react-pdf)
const possiblePaths = [
  path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
  path.join(__dirname, '..', 'node_modules', 'react-pdf', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
];

const targetDir = path.join(__dirname, '..', 'public', 'pdfjs');
const targetFile = path.join(targetDir, 'pdf.worker.min.mjs');

try {
  // Criar diretório se não existir
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('✓ Diretório public/pdfjs/ criado');
  }

  // Tentar copiar de qualquer caminho disponível
  const sourceFile = possiblePaths.find(p => fs.existsSync(p));

  if (sourceFile) {
    fs.copyFileSync(sourceFile, targetFile);
    console.log('✓ PDF.js worker copiado para public/pdfjs/pdf.worker.min.mjs');
  } else {
    console.warn('⚠ Arquivo pdf.worker.min.mjs não encontrado. Caminhos verificados:');
    possiblePaths.forEach(p => console.warn('  -', p));
  }
} catch (error) {
  console.error('✗ Erro ao copiar PDF.js worker:', error.message);
  process.exit(1);
}
