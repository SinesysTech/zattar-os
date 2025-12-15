
import { glob } from "glob";
import fs from "fs/promises";
import path from "path";

// =============================================================================
// REGEX PATTERNS PARA VALIDACAO
// =============================================================================

// Cores hardcoded proibidas em componentes de feature
const hardcodedColorPattern = /className=["'][^"']*bg-(blue|green|red|yellow|purple|pink|indigo|orange|teal|cyan|emerald|amber|violet|rose|fuchsia|lime|sky|slate|zinc|neutral|stone|gray)-(50|100|200|300|400|500|600|700|800|900)/g;

// Funcoes getXXXColorClass proibidas (indica logica duplicada)
const colorClassFunctionPattern = /\bget\w*Color\w*Class\s*[=(]/g;

// Uso direto de oklch() proibido
const oklchPattern = /oklch\s*\(/i;

// shadow-xl proibido
const shadowXlPattern = /shadow-xl/;

// Padroes de cores inline em badges
const inlineBadgeColorPattern = /text-(blue|green|red|yellow|purple|pink|indigo|orange|teal|cyan|emerald|amber|violet|rose|fuchsia)-(100|200|300|400|500|600|700|800)/g;

// Padroes de borda com cores hardcoded
const hardcodedBorderPattern = /border-(blue|green|red|yellow|purple|pink|indigo|orange|teal|cyan|emerald|amber|violet|rose|fuchsia)-(100|200|300|400|500|600|700|800)/g;

// =============================================================================
// DIRETORIOS E EXCLUSOES
// =============================================================================

const checkDirectories = ["src/app", "src/components", "src/features"];
const excludePatterns = [
  "node_modules/**",
  "**/*.d.ts",
  "**/ui/badge.tsx",           // Primitivo pode ter cores
  "**/ui/button.tsx",          // Primitivo pode ter cores
  "**/ui/alert.tsx",           // Primitivo pode ter cores
  "**/ui/semantic-badge.tsx",  // Usa design system internamente
  "**/design-system/**",       // Design system define cores
  "**/widgets/stat-card.tsx",  // Widget com variants próprias (design system)
];

// =============================================================================
// TIPOS
// =============================================================================

interface ValidationError {
  filePath: string;
  line: number;
  message: string;
  severity: "error" | "warning";
  suggestion?: string;
}

interface ValidationSummary {
  totalFiles: number;
  filesWithErrors: number;
  totalErrors: number;
  totalWarnings: number;
  errorsByType: Record<string, number>;
}

// =============================================================================
// VALIDACAO
// =============================================================================

async function validateFile(filePath: string): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");

    // Verifica se eh um arquivo de feature (componentes de dominio)
    const isFeatureFile = filePath.includes("/features/") || filePath.includes("/app/");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // 1. Verifica uso direto de oklch()
      if (oklchPattern.test(line)) {
        errors.push({
          filePath,
          line: lineNumber,
          message: "Uso direto de `oklch()` encontrado",
          severity: "error",
          suggestion: "Use variaveis CSS (ex: `bg-primary`) ou variantes semanticas",
        });
      }

      // 2. Verifica uso de shadow-xl
      if (shadowXlPattern.test(line)) {
        errors.push({
          filePath,
          line: lineNumber,
          message: "Uso de `shadow-xl` proibido",
          severity: "error",
          suggestion: "Use `shadow-lg` ou `shadow-md` para manter profundidade sutil",
        });
      }

      // 3. Verifica funcoes getXXXColorClass (logica duplicada)
      if (colorClassFunctionPattern.test(line)) {
        colorClassFunctionPattern.lastIndex = 0; // Reset regex
        errors.push({
          filePath,
          line: lineNumber,
          message: "Funcao de cor local detectada (getXXXColorClass)",
          severity: "error",
          suggestion: "Use `getSemanticBadgeVariant()` de @/lib/design-system",
        });
      }

      // 4. Verifica cores hardcoded em arquivos de feature
      if (isFeatureFile) {
        // Background colors
        const bgMatches = line.match(hardcodedColorPattern);
        if (bgMatches) {
          hardcodedColorPattern.lastIndex = 0;
          errors.push({
            filePath,
            line: lineNumber,
            message: `Cor de fundo hardcoded detectada: ${bgMatches.join(", ")}`,
            severity: "warning",
            suggestion: "Use variantes semanticas do Badge ou design system",
          });
        }

        // Text colors em badges
        const textMatches = line.match(inlineBadgeColorPattern);
        if (textMatches && (line.includes("Badge") || line.includes("badge"))) {
          inlineBadgeColorPattern.lastIndex = 0;
          errors.push({
            filePath,
            line: lineNumber,
            message: `Cor de texto hardcoded em badge: ${textMatches.join(", ")}`,
            severity: "warning",
            suggestion: "Use `<Badge variant={getSemanticBadgeVariant(...)}>` ",
          });
        }

        // Border colors
        const borderMatches = line.match(hardcodedBorderPattern);
        if (borderMatches) {
          hardcodedBorderPattern.lastIndex = 0;
          errors.push({
            filePath,
            line: lineNumber,
            message: `Cor de borda hardcoded detectada: ${borderMatches.join(", ")}`,
            severity: "warning",
            suggestion: "Use variantes semanticas que incluem bordas apropriadas",
          });
        }
      }
    });
  } catch (error) {
    console.error(`Erro ao ler o arquivo ${filePath}:`, error);
  }

  return errors;
}

function generateSummary(allErrors: ValidationError[]): ValidationSummary {
  const filesWithErrors = new Set(allErrors.map(e => e.filePath)).size;
  const errors = allErrors.filter(e => e.severity === "error");
  const warnings = allErrors.filter(e => e.severity === "warning");

  const errorsByType: Record<string, number> = {};
  allErrors.forEach(e => {
    const type = e.message.split(":")[0];
    errorsByType[type] = (errorsByType[type] || 0) + 1;
  });

  return {
    totalFiles: 0, // Sera preenchido no main
    filesWithErrors,
    totalErrors: errors.length,
    totalWarnings: warnings.length,
    errorsByType,
  };
}

function printError(error: ValidationError, relativePath: string) {
  const icon = error.severity === "error" ? "\x1b[31m\u2717\x1b[0m" : "\x1b[33m\u26A0\x1b[0m";
  console.log(`  ${icon} ${relativePath}:${error.line}`);
  console.log(`    ${error.message}`);
  if (error.suggestion) {
    console.log(`    \x1b[36m\u21B3 ${error.suggestion}\x1b[0m`);
  }
  console.log();
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose") || args.includes("-v");
  const fixMode = args.includes("--fix");

  console.log("\n\x1b[1m Design System Validator \x1b[0m");
  console.log("=".repeat(50));
  console.log();

  if (fixMode) {
    console.log("\x1b[33m Modo --fix ainda nao implementado\x1b[0m\n");
  }

  const allErrors: ValidationError[] = [];
  let totalFilesChecked = 0;

  // Buscar arquivos
  const globPattern = `{${checkDirectories.join(",")}}/**/*.{ts,tsx}`;
  const files = await glob(globPattern, {
    ignore: excludePatterns,
    cwd: process.cwd(),
  });

  totalFilesChecked = files.length;
  console.log(`Analisando ${totalFilesChecked} arquivos...\n`);

  // Validar cada arquivo
  for (const file of files) {
    const errors = await validateFile(file);
    if (errors.length > 0) {
      allErrors.push(...errors);
      if (verbose) {
        const relativePath = path.relative(process.cwd(), file);
        errors.forEach(error => printError(error, relativePath));
      }
    }
  }

  // Gerar e exibir sumario
  const summary = generateSummary(allErrors);
  summary.totalFiles = totalFilesChecked;

  console.log("=".repeat(50));
  console.log("\n\x1b[1m Sumario \x1b[0m\n");
  console.log(`  Arquivos analisados: ${summary.totalFiles}`);
  console.log(`  Arquivos com problemas: ${summary.filesWithErrors}`);
  console.log(`  \x1b[31mErros: ${summary.totalErrors}\x1b[0m`);
  console.log(`  \x1b[33mWarnings: ${summary.totalWarnings}\x1b[0m`);

  if (Object.keys(summary.errorsByType).length > 0) {
    console.log("\n  Por tipo:");
    Object.entries(summary.errorsByType).forEach(([type, count]) => {
      console.log(`    - ${type}: ${count}`);
    });
  }

  console.log();

  // Resultado final
  if (summary.totalErrors > 0) {
    console.log("\x1b[31m\u2717 Validacao falhou com erros\x1b[0m\n");
    if (!verbose) {
      console.log("  Execute com --verbose para ver detalhes\n");
    }
    process.exit(1);
  } else if (summary.totalWarnings > 0) {
    console.log("\x1b[33m\u26A0 Validacao passou com warnings\x1b[0m\n");
    if (!verbose) {
      console.log("  Execute com --verbose para ver detalhes\n");
    }
    process.exit(0);
  } else {
    console.log("\x1b[32m\u2713 Codigo em conformidade com o Design System!\x1b[0m\n");
    process.exit(0);
  }
}

main().catch(error => {
  console.error("Erro inesperado durante validacao:", error);
  process.exit(1);
});
