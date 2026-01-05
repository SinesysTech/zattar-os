#!/usr/bin/env node
/**
 * Script para copiar o PDF.js worker do node_modules para public/pdfjs/
 * Executado automaticamente após npm install via postinstall hook
 */

const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const targetDir = path.join(__dirname, '..', 'public', 'pdfjs');
const targetFile = path.join(targetDir, 'pdf.worker.min.mjs');

try {
  // Criar diretório se não existir
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('✓ Diretório public/pdfjs/ criado');
  }

  // Copiar arquivo
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, targetFile);
    console.log('✓ PDF.js worker copiado para public/pdfjs/pdf.worker.min.mjs');
  } else {
    console.warn('⚠ Arquivo pdf.worker.min.mjs não encontrado em node_modules/pdfjs-dist/build/');
  }
} catch (error) {
  console.error('✗ Erro ao copiar PDF.js worker:', error.message);
  process.exit(1);
}
