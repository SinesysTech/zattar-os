#!/usr/bin/env tsx

/**
 * Extrai metadata de todas as tools MCP registradas
 * para gerar documentação completa
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface ToolMetadata {
  name: string;
  description: string;
  feature: string;
  requiresAuth: boolean;
  schema: any;
  examples: string[];
}

// Parse do arquivo registry.ts
const registryPath = join(process.cwd(), 'src/lib/mcp/registry.ts');
const registryContent = readFileSync(registryPath, 'utf-8');

// Extrair todas as chamadas registerMcpTool
const toolMatches = registryContent.matchAll(/registerMcpTool\(\{([^}]+(?:\{[^}]*\})*)+\}\);/gs);

const tools: ToolMetadata[] = [];
let currentFeature = '';

// Parse por linha para capturar contexto
const lines = registryContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Detectar feature module
  if (line.includes('async function register') && line.includes('Tools()')) {
    const match = line.match(/register(\w+)Tools/);
    if (match) {
      currentFeature = match[1].toLowerCase();
    }
  }

  // Detectar início de registerMcpTool
  if (line.includes('registerMcpTool({')) {
    let toolBlock = '';
    let braceCount = 0;
    let startLine = i;

    // Capturar o bloco completo
    for (let j = i; j < lines.length; j++) {
      const currentLine = lines[j];
      toolBlock += currentLine + '\n';

      // Contar chaves
      for (const char of currentLine) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }

      if (braceCount === 0 && currentLine.includes('});')) {
        i = j;
        break;
      }
    }

    // Extrair JSDoc acima
    let jsdoc = '';
    for (let j = startLine - 1; j >= 0; j--) {
      if (lines[j].trim().startsWith('/**')) {
        jsdoc = lines.slice(j, startLine).join('\n');
        break;
      }
      if (lines[j].trim() && !lines[j].trim().startsWith('*')) {
        break;
      }
    }

    // Parse do tool
    try {
      const nameMatch = toolBlock.match(/name:\s*['"]([\w_]+)['"]/);
      const descMatch = toolBlock.match(/description:\s*['"](.*?)['"]/s);
      const featureMatch = toolBlock.match(/feature:\s*['"]([\w-]+)['"]/);
      const authMatch = toolBlock.match(/requiresAuth:\s*(true|false)/);

      if (nameMatch && descMatch) {
        const tool: ToolMetadata = {
          name: nameMatch[1],
          description: descMatch[1],
          feature: featureMatch ? featureMatch[1] : currentFeature,
          requiresAuth: authMatch ? authMatch[1] === 'true' : false,
          schema: extractSchema(toolBlock),
          examples: extractExamples(jsdoc),
        };

        tools.push(tool);
      }
    } catch (error) {
      console.error(`Erro ao processar tool na linha ${i}:`, error);
    }
  }
}

function extractSchema(toolBlock: string): any {
  const schemaMatch = toolBlock.match(/schema:\s*z\.object\(\{([\s\S]*?)\}\)/);
  if (!schemaMatch) return {};

  const schemaContent = schemaMatch[1];
  const params: any = {};

  // Parse simples de parâmetros z.object
  const paramMatches = schemaContent.matchAll(/(\w+):\s*z\.(\w+)\(\)(.*?)(?:,|\n)/gs);

  for (const match of paramMatches) {
    const [, paramName, zodType, modifiers] = match;

    params[paramName] = {
      type: zodType,
      required: !modifiers.includes('.optional()'),
      default: extractDefault(modifiers),
      description: extractDescription(modifiers),
      constraints: extractConstraints(modifiers),
    };
  }

  return params;
}

function extractDefault(modifiers: string): any {
  const match = modifiers.match(/\.default\((.*?)\)/);
  if (!match) return undefined;

  try {
    return eval(match[1]);
  } catch {
    return match[1];
  }
}

function extractDescription(modifiers: string): string {
  const match = modifiers.match(/\.describe\(['"](.*?)['"]\)/);
  return match ? match[1] : '';
}

function extractConstraints(modifiers: string): any {
  const constraints: any = {};

  const minMatch = modifiers.match(/\.min\((\d+)\)/);
  if (minMatch) constraints.min = parseInt(minMatch[1]);

  const maxMatch = modifiers.match(/\.max\((\d+)\)/);
  if (maxMatch) constraints.max = parseInt(maxMatch[1]);

  const enumMatch = modifiers.match(/\.enum\(\[(.*?)\]\)/);
  if (enumMatch) {
    constraints.enum = enumMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
  }

  return Object.keys(constraints).length > 0 ? constraints : undefined;
}

function extractExamples(jsdoc: string): string[] {
  const examples: string[] = [];
  const exampleMatches = jsdoc.matchAll(/@example\s*([\s\S]*?)(?=\*\s*@|\*\/)/g);

  for (const match of exampleMatches) {
    const example = match[1]
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, ''))
      .filter(line => line.trim())
      .join('\n');

    if (example.trim()) {
      examples.push(example.trim());
    }
  }

  return examples;
}

// Agrupar por módulo
const byModule = tools.reduce((acc, tool) => {
  if (!acc[tool.feature]) acc[tool.feature] = [];
  acc[tool.feature].push(tool);
  return acc;
}, {} as Record<string, ToolMetadata[]>);

// Exportar JSON
console.log(JSON.stringify({
  totalTools: tools.length,
  totalModules: Object.keys(byModule).length,
  modules: byModule,
  tools,
}, null, 2));
