#!/usr/bin/env node

/**
 * Script de verificação de imports arquiteturais
 *
 * Verifica se há imports de pastas legadas (@/backend, @/core, @/app/_lib, @/features)
 * em arquivos de src/, e se há imports diretos de subpastas de módulos em
 * @/app/(authenticated)/ que deveriam passar pelo barrel export (index.ts).
 *
 * Este script funciona como um "alarme precoce" para regressões arquiteturais.
 */

const fs = require("fs");
const path = require("path");


const LEGACY_PATTERNS = [
  /from\s+['"]@\/backend\//,
  /from\s+['"]@\/core\//,
  /from\s+['"]@\/app\/_lib\//,
  /require\s*\(\s*['"]@\/backend\//,
  /require\s*\(\s*['"]@\/core\//,
  /require\s*\(\s*['"]@\/app\/_lib\//,
  // Legacy features/ directory (migrated to app/(authenticated)/)
  /from\s+['"]@\/features\//,
  /require\s*\(\s*['"]@\/features\//,
  // Feature Boundary Violations (Force Barrel Exports)
  // Catch deep imports like @/app/(authenticated)/xyz/components/...
  /from\s+['"]@\/app\/\(authenticated\)\/[^/]+\/(components|hooks|actions|utils|types|domain|service|repository)/,
  /require\s*\(\s*['"]@\/app\/\(authenticated\)\/[^/]+\/(components|hooks|actions|utils|types|domain|service|repository)/,
];

const ALLOWED_PATHS = [
  "backend/",
  "core/",
  "scripts/",
  ".next/",
  "node_modules/",
  "supabase/",
];

function shouldCheckFile(filePath) {
  // Não verificar arquivos em pastas permitidas
  for (const allowed of ALLOWED_PATHS) {
    if (filePath.includes(allowed)) {
      return false;
    }
  }
  
  // Verificar apenas arquivos TypeScript/JavaScript em src/
  return (
    filePath.startsWith("src/") &&
    (filePath.endsWith(".ts") ||
      filePath.endsWith(".tsx") ||
      filePath.endsWith(".js") ||
      filePath.endsWith(".jsx"))
  );
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const violations = [];

    lines.forEach((line, index) => {
      LEGACY_PATTERNS.forEach((pattern) => {
        if (pattern.test(line)) {
          violations.push({
            line: index + 1,
            content: line.trim(),
            file: filePath,
          });
        }
      });
    });

    return violations;
  } catch (error) {
    console.error(`Erro ao ler arquivo ${filePath}:`, error.message);
    return [];
  }
}

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (shouldCheckFile(filePath)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function main() {
  console.log("🔍 Verificando imports arquiteturais...\n");

  const srcDir = path.join(process.cwd(), "src");
  if (!fs.existsSync(srcDir)) {
    console.error("❌ Diretório src/ não encontrado");
    process.exit(1);
  }

  const files = findFiles(srcDir);
  const allViolations = [];

  files.forEach((file) => {
    const violations = checkFile(file);
    allViolations.push(...violations);
  });

  if (allViolations.length > 0) {
    console.error("❌ Violações arquiteturais encontradas:\n");
    
    allViolations.forEach((violation) => {
      console.error(`  ${violation.file}:${violation.line}`);
      console.error(`    ${violation.content}\n`);
    });

    console.error(
      "💡 Use imports de módulos via barrel exports: @/app/(authenticated)/{modulo}"
    );
    console.error(
      "💡 Para mais informações, consulte docs/arquitetura-sistema.md (seção 14.2)"
    );
    console.error(
      "💡 Violações de Feature: Use import { ... } from '@/app/(authenticated)/nomedafeature' ao invés de importar de subpastas."
    );
    console.error(
      "💡 A pasta @/features/ foi removida — módulos estão em @/app/(authenticated)/"
    );

    process.exit(1);
  }

  console.log("✅ Nenhuma violação arquitetural encontrada");
  process.exit(0);
}

main();

