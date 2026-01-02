#!/usr/bin/env tsx

/**
 * Gera documentação Markdown a partir do JSON de metadata
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const metadataPath = join(process.cwd(), 'scripts/mcp/tools-metadata.json');
const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));

const { totalTools, totalModules, modules } = metadata;

const moduleNames: Record<string, string> = {
  processos: 'Processos',
  partes: 'Partes (Clientes, Contrárias, Terceiros, Representantes)',
  contratos: 'Contratos',
  financeiro: 'Financeiro',
  chat: 'Chat e Comunicação',
  documentos: 'Documentos',
  expedientes: 'Expedientes',
  audiencias: 'Audiências',
  obrigacoes: 'Obrigações (Acordos e Repasses)',
  rh: 'Recursos Humanos',
  dashboard: 'Dashboard e Métricas',
  busca: 'Busca Semântica',
  captura: 'Captura (CNJ e Timeline)',
  usuarios: 'Usuários',
  acervo: 'Acervo',
  assistentes: 'Assistentes IA',
  cargos: 'Cargos',
  assinatura: 'Assinatura Digital',
};

let md = `# Referência Completa - Tools MCP Sinesys

## Visão Geral

O Sinesys expõe **${totalTools} ferramentas MCP** organizadas em ${totalModules} módulos funcionais. Estas ferramentas permitem que agentes de IA interajam com o sistema de forma estruturada e segura.

## Índice Rápido

| Módulo | Tools | Descrição |
|--------|-------|-----------|
`;

// Tabela de índice
for (const [moduleKey, moduleTools] of Object.entries(modules) as [string, any[]][]) {
  const moduleName = moduleNames[moduleKey] || moduleKey;
  const description = moduleTools[0]?.description?.slice(0, 60) || '';
  md += `| ${moduleName} | ${moduleTools.length} | ${description}... |\n`;
}

md += `\n---\n\n## Módulos\n\n`;

// Detalhes de cada módulo
for (const [moduleKey, moduleTools] of Object.entries(modules) as [string, any[]][]) {
  const moduleName = moduleNames[moduleKey] || moduleKey;

  md += `### ${moduleName}\n\n`;
  md += `**Total de tools:** ${moduleTools.length}\n\n`;

  for (const tool of moduleTools) {
    md += `#### \`${tool.name}\`\n\n`;
    md += `${tool.description}\n\n`;

    if (tool.requiresAuth) {
      md += `**🔒 Requer autenticação**\n\n`;
    }

    md += `**Parâmetros:**\n\n`;
    md += `| Nome | Tipo | Obrigatório | Padrão | Descrição |\n`;
    md += `|------|------|-------------|---------|----------|\n`;

    for (const [paramName, paramInfo] of Object.entries(tool.schema || {}) as [string, any][]) {
      const required = paramInfo.required ? '✅' : '❌';
      const defaultVal = paramInfo.default !== undefined ? `\`${paramInfo.default}\`` : '-';

      let typeStr = paramInfo.type || 'unknown';
      if (paramInfo.constraints) {
        const constraints = [];
        if (paramInfo.constraints.min !== undefined) constraints.push(`min: ${paramInfo.constraints.min}`);
        if (paramInfo.constraints.max !== undefined) constraints.push(`max: ${paramInfo.constraints.max}`);
        if (paramInfo.constraints.enum) constraints.push(`enum: ${paramInfo.constraints.enum.join(', ')}`);

        if (constraints.length > 0) {
          typeStr += ` (${constraints.join(', ')})`;
        }
      }

      md += `| \`${paramName}\` | \`${typeStr}\` | ${required} | ${defaultVal} | ${paramInfo.description || '-'} |\n`;
    }

    md += `\n`;

    if (tool.examples && tool.examples.length > 0) {
      md += `**Exemplos:**\n\n`;
      for (const example of tool.examples) {
        md += `\`\`\`typescript\n${example}\n\`\`\`\n\n`;
      }
    }

    md += `**Casos de erro:**\n\n`;
    if (tool.requiresAuth) {
      md += `- **401 Unauthorized:** Token de autenticação inválido ou ausente\n`;
    }

    for (const [paramName, paramInfo] of Object.entries(tool.schema || {}) as [string, any][]) {
      if (paramInfo.required) {
        md += `- **400 Bad Request:** \`${paramName}\` é obrigatório\n`;
      }

      if (paramInfo.constraints) {
        if (paramInfo.constraints.min !== undefined) {
          const unit = paramInfo.type === 'string' ? 'caracteres' : '';
          md += `- **400 Bad Request:** \`${paramName}\` deve ter no mínimo ${paramInfo.constraints.min} ${unit}\n`;
        }

        if (paramInfo.constraints.max !== undefined) {
          const unit = paramInfo.type === 'string' ? 'caracteres' : '';
          md += `- **400 Bad Request:** \`${paramName}\` deve ter no máximo ${paramInfo.constraints.max} ${unit}\n`;
        }

        if (paramInfo.constraints.enum) {
          md += `- **400 Bad Request:** \`${paramName}\` deve ser um de: ${paramInfo.constraints.enum.join(', ')}\n`;
        }
      }
    }

    md += `\n---\n\n`;
  }
}

md += `## Padrões de Uso

### Autenticação

Todas as tools com autenticação obrigatória requerem:

- Header \`x-service-api-key\` com API key válida, OU
- Cookie de sessão autenticada

### Paginação

Tools de listagem suportam \`limite\` e \`offset\`:

\`\`\`json
{
  "limite": 20,
  "offset": 40
}
\`\`\`

### Tratamento de Erros

Padrão de resposta:

**Sucesso:**
\`\`\`json
{ "success": true, "data": {...} }
\`\`\`

**Erro:**
\`\`\`json
{ "success": false, "error": "Mensagem descritiva" }
\`\`\`

### Rate Limiting

- **Anonymous:** 10 req/min
- **Authenticated:** 100 req/min
- **Service:** 1000 req/min

Headers de resposta:
- \`X-RateLimit-Limit\`
- \`X-RateLimit-Remaining\`
- \`X-RateLimit-Reset\`

## Tabela Comparativa de Tools

| Tool | Módulo | Auth | Uso Comum |
|------|--------|------|-----------|
`;

for (const [moduleKey, moduleTools] of Object.entries(modules) as [string, any[]][]) {
  const moduleName = moduleNames[moduleKey] || moduleKey;
  for (const tool of moduleTools.slice(0, 2)) {
    const auth = tool.requiresAuth ? '🔒' : '🔓';
    const use = tool.description.split('.')[0] || tool.description.slice(0, 50);
    md += `| \`${tool.name}\` | ${moduleName} | ${auth} | ${use} |\n`;
  }
}

md += `
## Workflows Comuns

### 1. Buscar Processos de um Cliente

\`\`\`typescript
// 1. Buscar cliente por CPF
const cliente = await executeMcpTool('buscar_cliente_por_cpf', {
  cpf: '12345678901'
});

// 2. Buscar processos do cliente
const processos = await executeMcpTool('buscar_processos_por_cpf', {
  cpf: '12345678901',
  limite: 50
});
\`\`\`

### 2. Criar Lançamento Financeiro

\`\`\`typescript
// 1. Listar plano de contas
const contas = await executeMcpTool('listar_plano_contas', {});

// 2. Criar lançamento
const lancamento = await executeMcpTool('criar_lancamento', {
  tipo: 'receita',
  valor: 1500.00,
  contaId: 10,
  descricao: 'Honorários - Processo 123'
});

// 3. Confirmar lançamento
await executeMcpTool('confirmar_lancamento', {
  lancamentoId: lancamento.data.id
});
\`\`\`

## Referências

- **Registry:** \`src/lib/mcp/registry.ts\`
- **Server:** \`src/lib/mcp/server.ts\`
- **API Endpoint:** \`src/app/api/mcp/route.ts\`
- **Testes:** \`scripts/mcp/test-tools.ts\`
- **Auditoria:** \`docs/mcp-audit/\`
`;

const outputPath = join(process.cwd(), 'docs/mcp-tools-reference.md');
writeFileSync(outputPath, md, 'utf-8');

console.log(`✅ Documentação gerada: ${outputPath}`);
console.log(`📊 Total: ${totalTools} tools em ${totalModules} módulos`);
