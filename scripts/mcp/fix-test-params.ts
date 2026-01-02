#!/usr/bin/env tsx

/**
 * Script para gerar mapa de correções snake_case -> camelCase
 * baseado nos schemas reais do registry
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const metadataPath = join(process.cwd(), 'scripts/mcp/tools-metadata.json');
const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));

// Mapear todos os parâmetros por tool
const toolParamMappings: Record<string, Record<string, string>> = {};

for (const tool of metadata.tools) {
  const paramNames = Object.keys(tool.schema || {});

  // Criar mapeamento snake_case -> camelCase
  const mapping: Record<string, string> = {};

  for (const param of paramNames) {
    // Converter para snake_case potencial
    const snakeCase = param.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (snakeCase !== param) {
      mapping[snakeCase] = param;
    }
  }

  if (Object.keys(mapping).length > 0) {
    toolParamMappings[tool.name] = mapping;
  }
}

console.log(JSON.stringify(toolParamMappings, null, 2));
