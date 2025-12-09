
import { glob } from "glob";
import fs from "fs/promises";
import path from "path";

// REGEX PATTERNS PARA VALIDAÇÃO
const oklchPattern = /oklch\s*\(/i;
// TODO: Futuras versões do validador irão usar estas regex para reforçar regras de tipografia
// e alinhamento numérico para tabelas, garantindo o uso correto de `font-heading` e `tabular-nums`.
const tabularNumsPattern = /<[^>]+class="[^\"]*tabular-nums[^\"]*"[^>]+>\s*\{?[\d,.]+\}?<\/[^>]+>/;
const shadowXlPattern = /shadow-xl/;
const fontHeadingPattern = /font-heading/;

// DIRETÓRIOS A SEREM VERIFICADOS
const checkDirectories = ["app", "components"];

interface ValidationError {
  filePath: string;
  line: number;
  message: string;
}

async function validateFile(filePath: string): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // 1. Verifica uso direto de oklch()
      if (oklchPattern.test(line)) {
        errors.push({
          filePath,
          line: lineNumber,
          message: "Uso direto de `oklch()` encontrado. Prefira usar variáveis CSS (ex: `bg-primary`).",
        });
      }

      // 2. Verifica uso de shadow-xl
      if (shadowXlPattern.test(line)) {
        errors.push({
          filePath,
          line: lineNumber,
          message: "Uso de `shadow-xl` proibido. Prefira `shadow-lg` ou `shadow-md` para manter a profundidade sutil do design system.",
        });
      }

      // Validações adicionais podem ser mais complexas e contextuais.
      // Por exemplo, validar `tabular-nums` em tabelas ou `font-heading` em títulos
      // pode exigir uma análise mais sofisticada do que simples regex por linha.
      // Esta é uma implementação inicial para demonstração.
    });
  } catch (error) {
    console.error(`Erro ao ler o arquivo ${filePath}:`, error);
  }
  return errors;
}

async function main() {
  console.log("🚀 Iniciando validação do Design System...");
  const allErrors: ValidationError[] = [];
  let totalFilesChecked = 0;

  const files = await glob(`{${checkDirectories.join(",")}}/**/*.{ts,tsx}`, {
    ignore: "node_modules/**",
  });

  totalFilesChecked = files.length;

  for (const file of files) {
    const errors = await validateFile(file);
    allErrors.push(...errors);
  }

  console.log(`\n✅ Verificação concluída. ${totalFilesChecked} arquivos analisados.`);

  if (allErrors.length > 0) {
    console.error(`\n❌ Encontrados ${allErrors.length} erros de validação:\n`);
    allErrors.forEach(error => {
      console.error(`  [ARQUIVO]: ${path.relative(process.cwd(), error.filePath)}:${error.line}`);
      console.error(`  [ERRO]: ${error.message}\n`);
    });
    process.exit(1); // Encerra com código de erro
  } else {
    console.log("🎉 Nenhum erro encontrado. O código está em conformidade com as regras do Design System!");
  }
}

main().catch(error => {
  console.error("Ocorreu um erro inesperado durante a validação:", error);
  process.exit(1);
});
