/**
 * Script para migrar imports de @/app/_lib para os locais corretos
 * seguindo a arquitetura FSD
 */

const fs = require('fs');
const path = require('path');

// Mapeamento de imports antigos para novos
const IMPORT_MAPPINGS = {
  // Hooks de features
  "@/app/_lib/hooks/use-acervo": "@/features/acervo",
  "@/app/_lib/hooks/use-audiencias": "@/features/audiencias",
  "@/app/_lib/hooks/use-usuarios": "@/features/usuarios",
  "@/app/_lib/hooks/use-obrigacoes": "@/features/financeiro",
  "@/app/_lib/hooks/use-contas-pagar": "@/features/financeiro",
  "@/app/_lib/hooks/use-contas-receber": "@/features/financeiro",
  "@/app/_lib/hooks/use-orcamentos": "@/features/financeiro",
  "@/app/_lib/hooks/use-plano-contas": "@/features/financeiro",
  "@/app/_lib/hooks/use-conciliacao-bancaria": "@/features/financeiro",
  "@/app/_lib/hooks/use-centros-custo": "@/features/financeiro",
  "@/app/_lib/hooks/use-contas-bancarias": "@/features/financeiro",
  
  // Hooks globais (que não pertencem a uma feature específica)
  "@/app/_lib/hooks/use-mobile": "@/hooks/use-media-query",
  "@/app/_lib/hooks/use-is-touch-device": "@/hooks/use-orientation",
  "@/app/_lib/hooks/use-mounted": "@/hooks",
  
  // Hooks que não existem mais (removidos/substituídos)
  "@/app/_lib/hooks/use-minhas-permissoes": "@/features/usuarios",
  "@/app/_lib/hooks/use-clientes": "@/features/partes",
  "@/app/_lib/hooks/use-tribunais": "@/features/captura",
  "@/app/_lib/hooks/use-tipos-audiencias": "@/features/audiencias",
  
  // Types
  "@/app/_lib/types/audiencias": "@/features/audiencias/types",
  "@/app/_lib/types/credenciais": "@/features/captura/types",
  "@/app/_lib/types/representantes": "@/features/partes/types",
  "@/app/_lib/types/terceiros": "@/features/partes/types",
  "@/app/_lib/types/tribunais": "@/features/captura/types",
  
  // Assinatura Digital
  "@/app/_lib/assinatura-digital/slug-helpers": "@/features/assinatura-digital/utils/slug-helpers",
  "@/app/_lib/assinatura-digital/formatters/cep": "@/features/assinatura-digital/utils",
  "@/app/_lib/assinatura-digital/formatters/cpf": "@/features/assinatura-digital/utils",
  "@/app/_lib/assinatura-digital/formatters/data": "@/features/assinatura-digital/utils",
  "@/app/_lib/assinatura-digital/formatters/telefone": "@/features/assinatura-digital/utils",
  "@/app/_lib/assinatura-digital/form-schema/schema-validator": "@/features/assinatura-digital/utils",
  "@/app/_lib/assinatura-digital/form-schema/zod-generator": "@/features/assinatura-digital/utils",
  "@/app/_lib/assinatura-digital/validations/business.validations": "@/features/assinatura-digital/utils",
  "@/app/_lib/assinatura-digital/validators/cpf.validator": "@/features/assinatura-digital/utils",
  
  // Stores
  "@/app/_lib/stores/assinatura-digital/formulario-store": "@/features/assinatura-digital/stores",
  
  // Outros
  "@/app/_lib/markdown-joiner-transform": "@/lib/utils",
};

function findFiles(dir, extensions) {
  let results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      // Ignorar node_modules e .next
      if (!['node_modules', '.next', 'dist', 'build'].includes(file.name)) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else if (extensions.some(ext => file.name.endsWith(ext))) {
      results.push(filePath);
    }
  }
  
  return results;
}

function migrateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const [oldImport, newImport] of Object.entries(IMPORT_MAPPINGS)) {
      const patterns = [
        new RegExp(`from ['"]${oldImport.replace(/\//g, '\\/')}['"]`, 'g'),
        new RegExp(`from ["']${oldImport.replace(/\//g, '\\/')}["']`, 'g'),
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, `from '${newImport}'`);
          modified = true;
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Iniciando migração de imports...\n');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir, ['.ts', '.tsx']);
  
  console.log(`📁 Encontrados ${files.length} arquivos para verificar\n`);
  
  let modifiedCount = 0;
  
  for (const file of files) {
    if (migrateImports(file)) {
      modifiedCount++;
      const relativePath = path.relative(process.cwd(), file);
      console.log(`✓ ${relativePath}`);
    }
  }
  
  console.log(`\n✅ Migração concluída!`);
  console.log(`📊 ${modifiedCount} arquivos modificados de ${files.length} verificados\n`);
}

main();
