#!/usr/bin/env tsx
/**
 * Gera código de registro MCP a partir de Server Actions
 * Uso: npm run mcp:generate -- --feature financeiro
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ToolSpec {
  name: string;
  actionName: string;
  feature: string;
  description: string;
  schemaCode: string;
  requiresAuth: boolean;
}

interface ActionInfo {
  name: string;
  params: string[];
  returnType: string;
}

/**
 * Extrai informações de actions de um arquivo TypeScript
 */
function extractActionsFromFile(filePath: string): ActionInfo[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const actions: ActionInfo[] = [];

  // Regex para encontrar funções exportadas que começam com 'action'
  const actionRegex = /export\s+async\s+function\s+(action\w+)\s*\(([^)]*)\)\s*:\s*Promise<([^>]+)>/g;

  let match;
  while ((match = actionRegex.exec(content)) !== null) {
    actions.push({
      name: match[1],
      params: match[2].split(',').map((p) => p.trim()).filter(Boolean),
      returnType: match[3],
    });
  }

  return actions;
}

/**
 * Gera nome de tool a partir do nome da action
 * Ex: actionListarProcessos -> listar_processos
 */
function generateToolName(actionName: string): string {
  return actionName
    .replace(/^action/, '')
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Gera descrição baseada no nome da action
 */
function generateDescription(actionName: string, feature: string): string {
  const action = actionName.replace(/^action/, '');
  const words = action.split(/(?=[A-Z])/).map((w) => w.toLowerCase());

  const verb = words[0];
  const entity = words.slice(1).join(' ');

  const verbDescriptions: Record<string, string> = {
    listar: `Lista ${entity} do módulo ${feature}`,
    buscar: `Busca ${entity} por ID ou critérios`,
    criar: `Cria novo(a) ${entity}`,
    atualizar: `Atualiza ${entity} existente`,
    excluir: `Exclui ${entity} do sistema`,
    deletar: `Remove ${entity} do sistema`,
    obter: `Obtém dados de ${entity}`,
    gerar: `Gera ${entity}`,
    exportar: `Exporta ${entity}`,
    confirmar: `Confirma ${entity}`,
    cancelar: `Cancela ${entity}`,
    estornar: `Estorna ${entity}`,
  };

  return verbDescriptions[verb] || `Operação ${verb} com ${entity}`;
}

/**
 * Gera código de registro de tool
 */
function generateToolRegistration(spec: ToolSpec): string {
  return `
  registerMcpTool({
    name: '${spec.name}',
    description: '${spec.description}',
    feature: '${spec.feature}',
    requiresAuth: ${spec.requiresAuth},
    schema: ${spec.schemaCode},
    handler: async (args) => {
      try {
        const result = await ${spec.actionName}(args as Parameters<typeof ${spec.actionName}>[0]);
        return actionResultToMcp(result as ActionResult<unknown>);
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : 'Erro na operação');
      }
    },
  });
`;
}

/**
 * Processa um módulo/feature e gera código de registro
 */
async function processFeature(feature: string, basePath: string): Promise<string> {
  const actionsPath = path.join(basePath, 'src', 'features', feature, 'actions');

  if (!fs.existsSync(actionsPath)) {
    console.error(`Diretório de actions não encontrado: ${actionsPath}`);
    return '';
  }

  const files = await glob('**/*.ts', { cwd: actionsPath });
  const allActions: ActionInfo[] = [];

  for (const file of files) {
    const filePath = path.join(actionsPath, file);
    const actions = extractActionsFromFile(filePath);
    allActions.push(...actions);
  }

  console.log(`Encontradas ${allActions.length} actions no módulo ${feature}`);

  const tools: ToolSpec[] = allActions.map((action) => ({
    name: generateToolName(action.name),
    actionName: action.name,
    feature,
    description: generateDescription(action.name, feature),
    schemaCode: 'z.object({})', // TODO: inferir schema dos parâmetros
    requiresAuth: true,
  }));

  const registrations = tools.map(generateToolRegistration).join('\n');

  return `
// =============================================================================
// ${feature.toUpperCase()} - Auto-generated
// =============================================================================
${registrations}
`;
}

/**
 * Lista todas as features disponíveis
 */
async function listFeatures(basePath: string): Promise<string[]> {
  const featuresPath = path.join(basePath, 'src', 'features');
  const dirs = fs.readdirSync(featuresPath, { withFileTypes: true });
  return dirs.filter((d) => d.isDirectory()).map((d) => d.name);
}

/**
 * Gera relatório de cobertura
 */
async function generateCoverageReport(basePath: string): Promise<void> {
  const features = await listFeatures(basePath);

  console.log('\n📊 Relatório de Cobertura MCP\n');
  console.log('='.repeat(60));

  let totalActions = 0;

  for (const feature of features) {
    const actionsPath = path.join(basePath, 'src', 'features', feature, 'actions');

    if (!fs.existsSync(actionsPath)) {
      continue;
    }

    const files = await glob('**/*.ts', { cwd: actionsPath });
    let featureActions = 0;

    for (const file of files) {
      const filePath = path.join(actionsPath, file);
      const actions = extractActionsFromFile(filePath);
      featureActions += actions.length;
    }

    if (featureActions > 0) {
      console.log(`${feature.padEnd(20)} ${featureActions} actions`);
      totalActions += featureActions;
    }
  }

  console.log('='.repeat(60));
  console.log(`Total: ${totalActions} actions em ${features.length} módulos`);
}

// CLI
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const basePath = process.cwd();

  if (args.includes('--list')) {
    const features = await listFeatures(basePath);
    console.log('Features disponíveis:');
    features.forEach((f) => console.log(`  - ${f}`));
    return;
  }

  if (args.includes('--coverage')) {
    await generateCoverageReport(basePath);
    return;
  }

  const featureIndex = args.indexOf('--feature');
  if (featureIndex === -1 || !args[featureIndex + 1]) {
    console.log('Uso:');
    console.log('  npm run mcp:generate -- --feature <feature>  Gera código para feature');
    console.log('  npm run mcp:generate -- --list              Lista features');
    console.log('  npm run mcp:generate -- --coverage          Relatório de cobertura');
    return;
  }

  const feature = args[featureIndex + 1];
  console.log(`Gerando código para feature: ${feature}`);

  const code = await processFeature(feature, basePath);
  console.log('\n📄 Código gerado:\n');
  console.log(code);
}

main().catch(console.error);
