#!/usr/bin/env node

/**
 * Script de verificação de imports arquiteturais
 *
 * Verifica se há imports de pastas legadas (@/backend, @/core, @/app/_lib, @/features)
 * em arquivos de src/, e se há imports diretos de subpastas de módulos em
 * @/app/(authenticated)/ que deveriam passar pelo barrel export (index.ts).
 *
 * Exceções:
 * - Self-imports (módulo importando de suas próprias subpastas) são permitidos
 * - Comentários são ignorados
 * - Server-only imports (service, repository) de API routes, server actions,
 *   outros services/repositories e testes são permitidos (documentados nos barrels)
 * - Imports de `feature/` dentro de assinatura-digital são permitidos (sub-módulo)
 *
 * Este script funciona como um "alarme precoce" para regressões arquiteturais.
 */

const fs = require("fs");
const path = require("path");

// Legacy import patterns — always a violation
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
];

// Feature Boundary Violations — deep imports that bypass barrel exports
const FEATURE_BOUNDARY_PATTERNS = [
  /from\s+['"]@\/app\/\(authenticated\)\/([^/'"]+)\/(components|hooks|actions|utils|types|domain|service|repository|services|feature|store|lib|drivers|credentials)/,
  /require\s*\(\s*['"]@\/app\/\(authenticated\)\/([^/'"]+)\/(components|hooks|actions|utils|types|domain|service|repository|services|feature|store|lib|drivers|credentials)/,
];

/**
 * Server-only subfolder names. Imports from these subfolders are allowed
 * when the importing file is in a server-side context (API routes, server
 * actions, other services/repositories, layout.tsx, tests).
 */
const SERVER_ONLY_SUBFOLDERS = new Set([
  "service",
  "repository",
  "services",
  "actions",
  "feature",       // sub-modules like assinatura-digital/feature have own barrel
  "types",         // type imports are safe in server context
  "domain",        // domain types are safe in server context
  "utils",         // utility imports from server context
  "credentials",   // captura/credentials is server-only
  "drivers",       // captura/drivers is server-only
]);

/**
 * Check if a file is in a server-side context where deep imports
 * to server-only modules are acceptable.
 */
function isServerSideFile(filePath) {
  return (
    filePath.includes("src/app/api/") ||
    filePath.includes("src/app/portal/") ||
    filePath.includes("src/lib/") ||
    filePath.includes("/actions/") ||
    filePath.includes("/actions.ts") ||
    filePath.endsWith("/service.ts") ||
    filePath.endsWith("-service.ts") ||
    filePath.includes("/services/") ||
    filePath.endsWith("/repository.ts") ||
    filePath.includes("/repository/") ||
    filePath.includes("/repositories/") ||
    filePath.endsWith("/layout.tsx") ||
    filePath.includes("__tests__/") ||
    filePath.endsWith(".test.ts") ||
    filePath.endsWith(".test.tsx") ||
    filePath.endsWith(".spec.ts") ||
    filePath.endsWith(".spec.tsx") ||
    filePath.endsWith("/page.tsx")  // Server Components
  );
}

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

/**
 * Extract the module name from a file path under (authenticated)/
 * e.g. "src/app/(authenticated)/captura/components/foo.tsx" → "captura"
 */
function getModuleName(filePath) {
  const match = filePath.match(/src\/app\/\(authenticated\)\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Check if a line is a comment (single-line // or block comment *)
 */
function isComment(line) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("/*")
  );
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const violations = [];
    const fileModule = getModuleName(filePath);
    const serverSide = isServerSideFile(filePath);

    lines.forEach((line, index) => {
      // Skip comments
      if (isComment(line)) return;

      // Check legacy patterns (always a violation)
      LEGACY_PATTERNS.forEach((pattern) => {
        if (pattern.test(line)) {
          violations.push({
            line: index + 1,
            content: line.trim(),
            file: filePath,
            type: "legacy",
          });
        }
      });

      // Check feature boundary patterns (only cross-module violations)
      FEATURE_BOUNDARY_PATTERNS.forEach((pattern) => {
        const match = line.match(pattern);
        if (match) {
          const importedModule = match[1];
          const importedSubfolder = match[2];

          // Self-imports within the same module are allowed
          if (fileModule && importedModule === fileModule) return;

          // Server-only imports from server-side files are allowed
          // (service.ts, repository.ts, services/, actions/ can't go through barrel)
          if (serverSide && SERVER_ONLY_SUBFOLDERS.has(importedSubfolder)) return;

          // Action imports are allowed from any file
          // (Server Actions are designed to be called from client components)
          if (importedSubfolder === "actions") return;

          // Type-only imports from types/ and domain/ are always allowed
          // (types are erased at build time, no server-only leak risk)
          const isTypeImport = /import\s+type\s/.test(line);
          if (isTypeImport && (importedSubfolder === "types" || importedSubfolder === "domain")) return;

          // Imports from sub-module barrels (e.g. assinatura-digital/feature) are allowed
          // when the import path ends at the barrel level (no deeper path segments)
          if (importedSubfolder === "feature") {
            const featureBarrelPattern = /from\s+['"]@\/app\/\(authenticated\)\/[^/'"]+\/feature['"]/;
            if (featureBarrelPattern.test(line)) return;
          }

          violations.push({
            line: index + 1,
            content: line.trim(),
            file: filePath,
            type: "feature-boundary",
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

function findFiles(dir, rootDir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const absolutePath = path.join(dir, file);
    const stat = fs.statSync(absolutePath);

    if (stat.isDirectory()) {
      findFiles(absolutePath, rootDir, fileList);
    } else {
      // Convert to relative path for shouldCheckFile
      const relativePath = path.relative(rootDir, absolutePath);
      if (shouldCheckFile(relativePath)) {
        fileList.push(relativePath);
      }
    }
  });

  return fileList;
}

function main() {
  console.log("🔍 Verificando imports arquiteturais...\n");

  const rootDir = process.cwd();
  const srcDir = path.join(rootDir, "src");
  if (!fs.existsSync(srcDir)) {
    console.error("❌ Diretório src/ não encontrado");
    process.exit(1);
  }

  const files = findFiles(srcDir, rootDir);
  const allViolations = [];

  files.forEach((file) => {
    const violations = checkFile(file);
    allViolations.push(...violations);
  });

  if (allViolations.length > 0) {
    console.error(`❌ ${allViolations.length} violações arquiteturais encontradas:\n`);

    // Group violations by file for readability
    const byFile = {};
    allViolations.forEach((v) => {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    });

    Object.entries(byFile).forEach(([file, violations]) => {
      console.error(`  📄 ${file}`);
      violations.forEach((v) => {
        console.error(`     L${v.line}: ${v.content}`);
      });
      console.error("");
    });

    console.error(
      "💡 Use imports de módulos via barrel exports: @/app/(authenticated)/{modulo}"
    );
    console.error(
      "💡 Violações de Feature: Use import { ... } from '@/app/(authenticated)/nomedafeature' ao invés de importar de subpastas."
    );
    console.error(
      "💡 Server-only imports (service.ts, repository.ts) de API routes e server actions são permitidos."
    );

    process.exit(1);
  }

  console.log(`✅ Nenhuma violação arquitetural encontrada (${files.length} arquivos verificados)`);
  process.exit(0);
}

main();
