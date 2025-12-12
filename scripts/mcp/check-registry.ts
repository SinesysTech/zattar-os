#!/usr/bin/env tsx
/**
 * Script de Verificação do Registry MCP - Sinesys
 *
 * Verifica se todas as Server Actions das features estão registradas
 * como ferramentas MCP.
 *
 * Uso:
 *   npm run mcp:check
 *   npx tsx scripts/mcp/check-registry.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const FEATURES_DIR = path.join(process.cwd(), 'src/features');
const REGISTRY_FILE = path.join(process.cwd(), 'src/lib/mcp/registry.ts');

interface ActionInfo {
  name: string;
  feature: string;
  file: string;
}

interface CheckResult {
  total: number;
  registered: number;
  missing: ActionInfo[];
}

/**
 * Encontra todas as Server Actions nas features
 */
function findAllActions(): ActionInfo[] {
  const actions: ActionInfo[] = [];

  // Listar features
  const features = fs.readdirSync(FEATURES_DIR).filter((f) => {
    const stat = fs.statSync(path.join(FEATURES_DIR, f));
    return stat.isDirectory();
  });

  for (const feature of features) {
    const actionsDir = path.join(FEATURES_DIR, feature, 'actions');

    if (!fs.existsSync(actionsDir)) {
      continue;
    }

    // Listar arquivos de actions
    const actionFiles = fs.readdirSync(actionsDir).filter((f) => f.endsWith('.ts'));

    for (const file of actionFiles) {
      const filePath = path.join(actionsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Encontrar exports de actions (funções que começam com "action")
      const actionRegex = /export\s+(?:async\s+)?function\s+(action\w+)/g;
      const constActionRegex = /export\s+const\s+(action\w+)\s*=/g;

      let match;
      while ((match = actionRegex.exec(content)) !== null) {
        actions.push({
          name: match[1],
          feature,
          file: path.relative(process.cwd(), filePath),
        });
      }

      while ((match = constActionRegex.exec(content)) !== null) {
        actions.push({
          name: match[1],
          feature,
          file: path.relative(process.cwd(), filePath),
        });
      }
    }
  }

  return actions;
}

/**
 * Encontra actions registradas no registry MCP
 */
function findRegisteredActions(): Set<string> {
  const registered = new Set<string>();

  if (!fs.existsSync(REGISTRY_FILE)) {
    console.warn('⚠️  Arquivo de registry não encontrado:', REGISTRY_FILE);
    return registered;
  }

  const content = fs.readFileSync(REGISTRY_FILE, 'utf-8');

  // Procurar por imports de actions
  const importRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/features\/[^'"]+['"]/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const imports = match[1].split(',').map((s) => s.trim());
    for (const imp of imports) {
      // Remover alias se houver
      const actionName = imp.split(/\s+as\s+/)[0].trim();
      if (actionName.startsWith('action')) {
        registered.add(actionName);
      }
    }
  }

  // Procurar por chamadas diretas a actions no handler
  const handlerRegex = /await\s+(action\w+)/g;
  while ((match = handlerRegex.exec(content)) !== null) {
    registered.add(match[1]);
  }

  return registered;
}

/**
 * Verifica o registry
 */
function checkRegistry(): CheckResult {
  console.log('🔍 Verificando Registry MCP do Sinesys...\n');

  // Encontrar todas as actions
  const allActions = findAllActions();
  console.log(`📁 Encontradas ${allActions.length} Server Actions nas features\n`);

  // Encontrar actions registradas
  const registeredActions = findRegisteredActions();
  console.log(`🔧 Encontradas ${registeredActions.size} actions no registry MCP\n`);

  // Encontrar actions não registradas
  const missing: ActionInfo[] = [];

  for (const action of allActions) {
    if (!registeredActions.has(action.name)) {
      missing.push(action);
    }
  }

  return {
    total: allActions.length,
    registered: registeredActions.size,
    missing,
  };
}

/**
 * Execução principal
 */
function main(): void {
  const result = checkRegistry();

  console.log('═'.repeat(60));
  console.log('📊 RESULTADO DA VERIFICAÇÃO');
  console.log('═'.repeat(60));
  console.log(`   Total de Actions:         ${result.total}`);
  console.log(`   Registradas no MCP:       ${result.registered}`);
  console.log(`   Não registradas:          ${result.missing.length}`);
  console.log('═'.repeat(60));

  if (result.missing.length > 0) {
    console.log('\n⚠️  Actions NÃO registradas no MCP:\n');

    // Agrupar por feature
    const byFeature = new Map<string, ActionInfo[]>();
    for (const action of result.missing) {
      if (!byFeature.has(action.feature)) {
        byFeature.set(action.feature, []);
      }
      byFeature.get(action.feature)!.push(action);
    }

    for (const [feature, actions] of byFeature) {
      console.log(`📦 ${feature}:`);
      for (const action of actions) {
        console.log(`   - ${action.name}`);
        console.log(`     Arquivo: ${action.file}`);
      }
      console.log();
    }

    console.log('💡 Para registrar essas actions, adicione-as ao arquivo:');
    console.log('   src/lib/mcp/registry.ts\n');

    process.exit(1);
  } else {
    console.log('\n✅ Todas as actions estão registradas no MCP!\n');
    process.exit(0);
  }
}

main();
