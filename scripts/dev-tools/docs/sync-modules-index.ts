#!/usr/bin/env npx tsx

import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const FEATURES_DIR = path.join(ROOT_DIR, 'src/features');
const DOCS_MODULES_DIR = path.join(ROOT_DIR, 'docs/modules');
const MODULES_INDEX_PATH = path.join(DOCS_MODULES_DIR, 'README.md');

interface FeatureMetrics {
  module: string;
  domain: boolean;
  service: boolean;
  repository: boolean;
  index: boolean;
  actions: boolean;
  components: boolean;
  rules: boolean;
  readme: boolean;
}

function listDirectories(dirPath: string): string[] {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function featureMetrics(module: string): FeatureMetrics {
  const modulePath = path.join(FEATURES_DIR, module);
  const hasFile = (name: string) => fs.existsSync(path.join(modulePath, name));
  const hasDir = (name: string) => {
    const p = path.join(modulePath, name);
    return fs.existsSync(p) && fs.statSync(p).isDirectory();
  };

  return {
    module,
    domain: hasFile('domain.ts'),
    service: hasFile('service.ts'),
    repository: hasFile('repository.ts'),
    index: hasFile('index.ts'),
    actions: hasDir('actions'),
    components: hasDir('components'),
    rules: hasFile('RULES.md'),
    readme: hasFile('README.md'),
  };
}

function classify(m: FeatureMetrics): 'Completo' | 'Parcial' | 'Inicial' {
  const score = [m.domain, m.service, m.repository, m.index, m.actions, m.components].filter(Boolean).length;
  const complete = m.domain && m.service && m.repository && m.index && m.actions && m.components;

  if (complete) return 'Completo';
  if (score >= 3) return 'Parcial';
  return 'Inicial';
}

function formatModuleList(modules: string[]): string {
  if (modules.length === 0) return 'nenhum';
  return modules.map((module) => `\`${module}\``).join(', ');
}

function extractCurrentSummaryDate(content: string): string | null {
  const match = content.match(/## Resumo \((\d{4}-\d{2}-\d{2})\)/);
  return match?.[1] ?? null;
}

function buildDynamicSection(summaryDate: string): string {
  const featureModules = listDirectories(FEATURES_DIR);
  const docModules = listDirectories(DOCS_MODULES_DIR);
  const metrics = featureModules.map(featureMetrics);

  const complete = metrics.filter((m) => classify(m) === 'Completo').map((m) => m.module);
  const partial = metrics.filter((m) => classify(m) === 'Parcial').map((m) => m.module);
  const initial = metrics.filter((m) => classify(m) === 'Inicial').map((m) => m.module);

  const missingInDocs = featureModules.filter((module) => !docModules.includes(module));
  const extraInDocs = docModules.filter((module) => !featureModules.includes(module));

  const coverage = {
    index: metrics.filter((m) => m.index).length,
    components: metrics.filter((m) => m.components).length,
    domain: metrics.filter((m) => m.domain).length,
    actions: metrics.filter((m) => m.actions).length,
    service: metrics.filter((m) => m.service).length,
    repository: metrics.filter((m) => m.repository).length,
    rules: metrics.filter((m) => m.rules).length,
    readme: metrics.filter((m) => m.readme).length,
  };

  const tableRows = docModules
    .map((module) => {
      if (!featureModules.includes(module)) {
        return `| ${module} | [README](./${module}/README.md) | Histórico | Não há módulo correspondente em \`src/features\` |`;
      }

      const moduleMetrics = metrics.find((m) => m.module === module);
      if (!moduleMetrics) {
        return `| ${module} | [README](./${module}/README.md) | Inicial | — |`;
      }

      return `| ${module} | [README](./${module}/README.md) | ${classify(moduleMetrics)} | — |`;
    })
    .join('\n');

  return `## Resumo (${summaryDate})

<!-- AUTO-GENERATED:START -->
- Módulos em \`src/features\`: **${featureModules.length}**
- Pastas em \`docs/modules\`: **${docModules.length}**
- Módulos sem pasta em \`docs/modules\`: ${formatModuleList(missingInDocs)}
- Pasta sem módulo correspondente em \`src/features\`: ${formatModuleList(extraInDocs)}

## Classificação estrutural dos módulos

Critério de módulo **completo**: \`domain.ts\` + \`service.ts\` + \`repository.ts\` + \`index.ts\` + \`actions/\` + \`components/\`.

- ✅ **Completos (${complete.length})**: ${formatModuleList(complete)}
- ⚠️ **Parciais (${partial.length})**: ${formatModuleList(partial)}
- 🧩 **Iniciais (${initial.length})**: ${formatModuleList(initial)}

## Cobertura de artefatos por módulo

| Artefato              | Cobertura |
| --------------------- | --------- |
| \`index.ts\`            | ${coverage.index}/${featureModules.length}     |
| \`components/\`         | ${coverage.components}/${featureModules.length}     |
| \`domain.ts\`           | ${coverage.domain}/${featureModules.length}     |
| \`actions/\`            | ${coverage.actions}/${featureModules.length}     |
| \`service.ts\`          | ${coverage.service}/${featureModules.length}     |
| \`repository.ts\`       | ${coverage.repository}/${featureModules.length}     |
| \`RULES.md\`            | ${coverage.rules}/${featureModules.length}      |
| \`README.md\` no módulo | ${coverage.readme}/${featureModules.length}      |

## Documentação funcional disponível

Índice navegável com status (ordem alfabética):

| Módulo | Documento | Status estrutural | Observação |
| --- | --- | --- | --- |
${tableRows}
<!-- AUTO-GENERATED:END -->`;
}

function main() {
  if (!fs.existsSync(MODULES_INDEX_PATH)) {
    throw new Error(`Arquivo não encontrado: ${MODULES_INDEX_PATH}`);
  }

  const current = fs.readFileSync(MODULES_INDEX_PATH, 'utf-8');
  const summaryDate = extractCurrentSummaryDate(current) ?? new Date().toISOString().slice(0, 10);
  const dynamicSection = buildDynamicSection(summaryDate);

  const start = current.indexOf('## Resumo');
  const end = current.indexOf('## Testes por feature');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Não foi possível localizar as seções "## Resumo" e "## Testes por feature" no docs/modules/README.md');
  }

  const before = current.slice(0, start).trimEnd();
  const after = current.slice(end).trimStart();
  const nextContent = `${before}\n\n${dynamicSection}\n\n${after}\n`;

  fs.writeFileSync(MODULES_INDEX_PATH, nextContent, 'utf-8');
  console.log('✅ docs/modules/README.md sincronizado com sucesso.');
}

main();
