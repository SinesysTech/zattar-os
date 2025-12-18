#!/usr/bin/env npx tsx
/**
 * Script de Validacao de Exports para Sinesys
 *
 * Detecta simbolos duplicados em barrels (index.ts) que podem causar
 * conflitos de export ao usar star exports (`export * from`).
 *
 * Funcionalidades:
 * - Analisa barrels recursivamente
 * - Detecta exports duplicados
 * - Identifica conflitos de namespace
 * - Sugere correcoes
 *
 * @usage npx tsx scripts/validate-exports.ts [--fix] [--verbose]
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// =============================================================================
// CONFIGURACAO
// =============================================================================

const ROOT_DIR = process.cwd();
const VERBOSE = process.argv.includes('--verbose');

interface ExportInfo {
  name: string;
  source: string;
  type: 'named' | 'default' | 'namespace' | 'star';
  line: number;
}

interface BarrelAnalysis {
  file: string;
  exports: ExportInfo[];
  starExports: string[];
  duplicates: Map<string, string[]>;
}

interface ValidationIssue {
  rule: string;
  file: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

const issues: ValidationIssue[] = [];

function addIssue(issue: ValidationIssue) {
  issues.push(issue);
}

function log(message: string) {
  if (VERBOSE) {
    console.log(message);
  }
}

// =============================================================================
// ANALISE DE EXPORTS
// =============================================================================

/**
 * Extrai exports de um arquivo TypeScript
 */
function parseExports(filePath: string): ExportInfo[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const exports: ExportInfo[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // export * from './module'
    const starMatch = line.match(/export\s+\*\s+from\s+['"]([^'"]+)['"]/);
    if (starMatch) {
      exports.push({
        name: '*',
        source: starMatch[1],
        type: 'star',
        line: lineNumber,
      });
      return;
    }

    // export * as namespace from './module'
    const namespaceMatch = line.match(/export\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
    if (namespaceMatch) {
      exports.push({
        name: namespaceMatch[1],
        source: namespaceMatch[2],
        type: 'namespace',
        line: lineNumber,
      });
      return;
    }

    // export { name1, name2 } from './module'
    const namedMatch = line.match(/export\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
    if (namedMatch) {
      const names = namedMatch[1].split(',').map(n => {
        const parts = n.trim().split(/\s+as\s+/);
        return parts[parts.length - 1].trim();
      });
      names.forEach(name => {
        if (name) {
          exports.push({
            name,
            source: namedMatch[2],
            type: 'named',
            line: lineNumber,
          });
        }
      });
      return;
    }

    // export default
    if (line.match(/export\s+default/)) {
      exports.push({
        name: 'default',
        source: filePath,
        type: 'default',
        line: lineNumber,
      });
    }
  });

  return exports;
}

/**
 * Resolve o caminho de um import relativo
 */
function resolveImportPath(fromFile: string, importPath: string): string | null {
  const dir = path.dirname(fromFile);
  const possiblePaths = [
    path.join(dir, `${importPath}.ts`),
    path.join(dir, `${importPath}.tsx`),
    path.join(dir, importPath, 'index.ts'),
    path.join(dir, importPath, 'index.tsx'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * Coleta todos os exports de um modulo (recursivamente para star exports)
 */
function collectAllExports(
  filePath: string,
  visited: Set<string> = new Set()
): Map<string, string[]> {
  const absolutePath = path.resolve(ROOT_DIR, filePath);

  if (visited.has(absolutePath)) {
    return new Map();
  }
  visited.add(absolutePath);

  if (!fs.existsSync(absolutePath)) {
    return new Map();
  }

  const exports = parseExports(absolutePath);
  const allExports = new Map<string, string[]>();

  for (const exp of exports) {
    if (exp.type === 'star') {
      // Resolve star export recursivamente
      const resolvedPath = resolveImportPath(absolutePath, exp.source);
      if (resolvedPath) {
        const subExports = collectAllExports(resolvedPath, visited);
        subExports.forEach((sources, name) => {
          if (!allExports.has(name)) {
            allExports.set(name, []);
          }
          allExports.get(name)!.push(...sources);
        });
      }
    } else if (exp.type === 'named' || exp.type === 'namespace') {
      if (!allExports.has(exp.name)) {
        allExports.set(exp.name, []);
      }
      allExports.get(exp.name)!.push(`${filePath}:${exp.line}`);
    }
  }

  return allExports;
}

/**
 * Analisa um barrel file para detectar duplicatas
 */
function analyzeBarrel(filePath: string): BarrelAnalysis {
  const exports = parseExports(filePath);
  const starExports = exports
    .filter(e => e.type === 'star')
    .map(e => e.source);

  const allExports = collectAllExports(filePath);

  // Encontra duplicatas
  const duplicates = new Map<string, string[]>();
  allExports.forEach((sources, name) => {
    if (sources.length > 1) {
      duplicates.set(name, sources);
    }
  });

  return {
    file: filePath,
    exports,
    starExports,
    duplicates,
  };
}

// =============================================================================
// VALIDACOES
// =============================================================================

/**
 * Valida barrels em features
 */
async function validateFeatureBarrels() {
  const barrels = await glob('src/features/*/index.ts', { cwd: ROOT_DIR });

  log(`Analisando ${barrels.length} barrels de features...`);

  for (const barrel of barrels) {
    const analysis = analyzeBarrel(path.join(ROOT_DIR, barrel));

    // Reporta duplicatas
    if (analysis.duplicates.size > 0) {
      analysis.duplicates.forEach((sources, name) => {
        addIssue({
          rule: 'duplicate-export',
          file: barrel,
          message: `Export duplicado: "${name}" encontrado em ${sources.length} locais: ${sources.join(', ')}`,
          severity: 'error',
          suggestion: `Use namespace export (export * as X from) ou renomeie o simbolo para evitar conflito`,
        });
      });
    }

    // Avisa sobre muitos star exports (risco de conflitos futuros)
    if (analysis.starExports.length > 5) {
      addIssue({
        rule: 'too-many-star-exports',
        file: barrel,
        message: `Barrel com ${analysis.starExports.length} star exports. Considere usar exports nomeados para maior controle.`,
        severity: 'warning',
        suggestion: `Substitua alguns "export * from" por exports nomeados explicitos`,
      });
    }

    log(`  ${barrel}: ${analysis.exports.length} exports, ${analysis.starExports.length} star exports`);
  }
}

/**
 * Valida barrels em componentes
 */
async function validateComponentBarrels() {
  const barrels = await glob('src/features/*/components/index.ts', { cwd: ROOT_DIR });

  log(`Analisando ${barrels.length} barrels de componentes...`);

  for (const barrel of barrels) {
    const analysis = analyzeBarrel(path.join(ROOT_DIR, barrel));

    if (analysis.duplicates.size > 0) {
      analysis.duplicates.forEach((sources, name) => {
        addIssue({
          rule: 'duplicate-export',
          file: barrel,
          message: `Export duplicado em componentes: "${name}"`,
          severity: 'error',
        });
      });
    }
  }
}

/**
 * Valida barrel principal de componentes UI
 */
async function validateUIBarrels() {
  const barrels = await glob('src/components/*/index.ts', { cwd: ROOT_DIR });

  for (const barrel of barrels) {
    const analysis = analyzeBarrel(path.join(ROOT_DIR, barrel));

    if (analysis.duplicates.size > 0) {
      analysis.duplicates.forEach((sources, name) => {
        addIssue({
          rule: 'duplicate-export',
          file: barrel,
          message: `Export duplicado em UI: "${name}"`,
          severity: 'error',
        });
      });
    }
  }
}

// =============================================================================
// EXECUCAO PRINCIPAL
// =============================================================================

async function main() {
  console.log('Validando exports...\n');

  await validateFeatureBarrels();
  await validateComponentBarrels();
  await validateUIBarrels();

  // Agrupa issues por severidade
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  // Exibe resultados
  if (warnings.length > 0) {
    console.log('\n--- AVISOS ---\n');
    warnings.forEach(w => {
      console.log(`[WARNING] ${w.file}`);
      console.log(`  Regra: ${w.rule}`);
      console.log(`  ${w.message}`);
      if (w.suggestion) {
        console.log(`  Sugestao: ${w.suggestion}`);
      }
      console.log('');
    });
  }

  if (errors.length > 0) {
    console.log('\n--- ERROS ---\n');
    errors.forEach(e => {
      console.log(`[ERROR] ${e.file}`);
      console.log(`  Regra: ${e.rule}`);
      console.log(`  ${e.message}`);
      if (e.suggestion) {
        console.log(`  Sugestao: ${e.suggestion}`);
      }
      console.log('');
    });
  }

  // Sumario
  console.log('\n=== SUMARIO ===');
  console.log(`Erros: ${errors.length}`);
  console.log(`Avisos: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\nValidacao FALHOU - corrija os erros acima.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log('\nValidacao OK com avisos.');
  } else {
    console.log('\nValidacao OK - nenhum problema encontrado.');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Erro durante validacao:', err);
  process.exit(1);
});
