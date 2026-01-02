#!/usr/bin/env tsx

/**
 * Script para adicionar comentários JSDoc enriquecidos ao registry.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface _ToolExample {
  toolName: string;
  examples: string[];
}

// Mapeamento de exemplos para cada tool
const toolExamples: Record<string, string[]> = {
  // PROCESSOS
  listar_processos: [
    `// Listar processos ativos do TRT15
await executeMcpTool('listar_processos', {
  limite: 10,
  trt: 'TRT15',
  status: 'ativo'
});`,
    `// Listar processos por período
await executeMcpTool('listar_processos', {
  data_inicio: '2025-01-01',
  data_fim: '2025-01-31',
  limite: 20
});`
  ],
  buscar_processos_por_cpf: [
    `// Buscar processos de um cliente por CPF
await executeMcpTool('buscar_processos_por_cpf', {
  cpf: '12345678901',
  limite: 50
});`
  ],
  buscar_processos_por_cnpj: [
    `// Buscar processos de uma empresa por CNPJ
await executeMcpTool('buscar_processos_por_cnpj', {
  cnpj: '12345678000190',
  limite: 50
});`
  ],
  buscar_processo_por_numero: [
    `// Buscar processo específico por número CNJ
await executeMcpTool('buscar_processo_por_numero', {
  numero_processo: '0001234-56.2023.5.15.0001'
});`
  ],

  // PARTES
  listar_clientes: [
    `// Listar todos os clientes
await executeMcpTool('listar_clientes', {
  limite: 20
});`,
    `// Listar apenas pessoas físicas
await executeMcpTool('listar_clientes', {
  limite: 10,
  tipo: 'fisica'
});`
  ],
  buscar_cliente_por_cpf: [
    `// Buscar cliente por CPF
await executeMcpTool('buscar_cliente_por_cpf', {
  cpf: '12345678901'
});`
  ],
  buscar_cliente_por_cnpj: [
    `// Buscar cliente por CNPJ
await executeMcpTool('buscar_cliente_por_cnpj', {
  cnpj: '12345678000190'
});`
  ],

  // CONTRATOS
  listar_contratos: [
    `// Listar contratos ativos
await executeMcpTool('listar_contratos', {
  limite: 10,
  status: 'ativo'
});`
  ],

  // FINANCEIRO
  listar_plano_contas: [
    `// Listar todas as contas do plano de contas
await executeMcpTool('listar_plano_contas', {});`
  ],
  listar_lancamentos: [
    `// Listar lançamentos do mês
await executeMcpTool('listar_lancamentos', {
  data_inicio: '2025-01-01',
  data_fim: '2025-01-31',
  limite: 50
});`,
    `// Listar apenas receitas
await executeMcpTool('listar_lancamentos', {
  tipo: 'receita',
  limite: 20
});`
  ],
  gerar_dre: [
    `// Gerar DRE do mês
await executeMcpTool('gerar_dre', {
  data_inicio: '2025-01-01',
  data_fim: '2025-01-31'
});`
  ],
  listar_fluxo_caixa: [
    `// Listar fluxo de caixa do período
await executeMcpTool('listar_fluxo_caixa', {
  data_inicio: '2025-01-01',
  data_fim: '2025-01-31'
});`
  ],
  projecao_fluxo_caixa: [
    `// Projetar fluxo de caixa dos próximos 30 dias
await executeMcpTool('projecao_fluxo_caixa', {
  dias: 30
});`
  ],
  saldo_atual: [
    `// Obter saldo atual de caixa
await executeMcpTool('saldo_atual', {});`
  ],
  resumo_financeiro: [
    `// Obter resumo financeiro do mês
await executeMcpTool('resumo_financeiro', {
  data_inicio: '2025-01-01',
  data_fim: '2025-01-31'
});`
  ],

  // CHAT
  listar_salas: [
    `// Listar salas de chat
await executeMcpTool('listar_salas', {
  limite: 10
});`
  ],
  listar_mensagens: [
    `// Listar mensagens de uma sala
await executeMcpTool('listar_mensagens', {
  sala_id: 1,
  limite: 50
});`
  ],
  buscar_historico: [
    `// Buscar mensagens com termo específico
await executeMcpTool('buscar_historico', {
  termo: 'importante',
  limite: 20
});`
  ],

  // DOCUMENTOS
  listar_documentos: [
    `// Listar documentos recentes
await executeMcpTool('listar_documentos', {
  limite: 20
});`,
    `// Listar contratos
await executeMcpTool('listar_documentos', {
  tipo: 'contrato',
  limite: 10
});`
  ],
  buscar_documentos_por_tags: [
    `// Buscar documentos por tags
await executeMcpTool('buscar_documentos_por_tags', {
  tags: ['importante', 'urgente'],
  limite: 10
});`
  ],
  listar_templates: [
    `// Listar templates de documentos
await executeMcpTool('listar_templates', {
  limite: 20
});`
  ],

  // EXPEDIENTES
  listar_expedientes: [
    `// Listar expedientes abertos
await executeMcpTool('listar_expedientes', {
  limite: 20,
  status: 'aberto'
});`
  ],
  buscar_expediente_por_processo: [
    `// Buscar expedientes de um processo
await executeMcpTool('buscar_expediente_por_processo', {
  processo_id: 1,
  limite: 10
});`
  ],

  // AUDIÊNCIAS
  listar_audiencias: [
    `// Listar próximas audiências
await executeMcpTool('listar_audiencias', {
  limite: 10,
  data_inicio: '2025-01-01',
  data_fim: '2025-12-31'
});`
  ],
  buscar_audiencia_por_processo: [
    `// Buscar audiências de um processo
await executeMcpTool('buscar_audiencia_por_processo', {
  processo_numero: '0001234-56.2023.5.15.0001',
  limite: 10
});`
  ],
  buscar_audiencias_por_cpf: [
    `// Buscar audiências de um cliente por CPF
await executeMcpTool('buscar_audiencias_por_cpf', {
  cpf: '12345678901',
  limite: 10
});`
  ],

  // OBRIGAÇÕES
  listar_acordos: [
    `// Listar acordos
await executeMcpTool('listar_acordos', {
  limite: 10
});`
  ],
  listar_repasses: [
    `// Listar repasses
await executeMcpTool('listar_repasses', {
  limite: 10
});`
  ],

  // RH
  listar_salarios: [
    `// Listar salários
await executeMcpTool('listar_salarios', {
  limite: 10
});`
  ],
  listar_folhas_pagamento: [
    `// Listar folhas de pagamento
await executeMcpTool('listar_folhas_pagamento', {
  limite: 10
});`
  ],

  // DASHBOARD
  obter_metricas: [
    `// Obter métricas gerais do sistema
await executeMcpTool('obter_metricas', {});`
  ],
  obter_dashboard: [
    `// Obter dados do dashboard mensal
await executeMcpTool('obter_dashboard', {
  periodo: 'mes'
});`
  ],

  // BUSCA SEMÂNTICA
  buscar_semantica: [
    `// Busca semântica de documentos
await executeMcpTool('buscar_semantica', {
  consulta: 'processos trabalhistas sobre horas extras',
  limite: 10
});`
  ],

  // CAPTURA
  listar_capturas_cnj: [
    `// Listar capturas do CNJ
await executeMcpTool('listar_capturas_cnj', {
  limite: 10
});`
  ],
  listar_timelines: [
    `// Listar timeline de um processo
await executeMcpTool('listar_timelines', {
  processo_id: 1,
  limite: 50
});`
  ],

  // USUÁRIOS
  listar_usuarios: [
    `// Listar usuários do sistema
await executeMcpTool('listar_usuarios', {
  limite: 20
});`
  ],
  buscar_usuario_por_email: [
    `// Buscar usuário por email
await executeMcpTool('buscar_usuario_por_email', {
  email: 'usuario@exemplo.com'
});`
  ],
  buscar_usuario_por_cpf: [
    `// Buscar usuário por CPF
await executeMcpTool('buscar_usuario_por_cpf', {
  cpf: '12345678901'
});`
  ],
  listar_permissoes_usuario: [
    `// Listar permissões de um usuário
await executeMcpTool('listar_permissoes_usuario', {
  usuario_id: 1
});`
  ],

  // OUTROS
  listar_acervo: [
    `// Listar itens do acervo
await executeMcpTool('listar_acervo', {
  limite: 10
});`
  ],
  listar_assistentes: [
    `// Listar assistentes de IA
await executeMcpTool('listar_assistentes', {
  limite: 10
});`
  ],
  listar_cargos: [
    `// Listar cargos disponíveis
await executeMcpTool('listar_cargos', {});`
  ],
  listar_templates_assinatura: [
    `// Listar templates de assinatura digital
await executeMcpTool('listar_templates_assinatura', {
  limite: 10
});`
  ],
};

// Gera JSDoc para uma tool
function generateJSDoc(toolName: string, description: string): string {
  const examples = toolExamples[toolName] || [
    `// Uso básico de ${toolName}
await executeMcpTool('${toolName}', {
  // parâmetros adequados
});`
  ];

  let jsdoc = '  /**\n';
  jsdoc += `   * ${description}\n`;
  jsdoc += '   * \n';

  for (const example of examples) {
    jsdoc += '   * @example\n';
    const lines = example.split('\n');
    for (const line of lines) {
      jsdoc += `   * ${line}\n`;
    }
    if (examples.length > 1 && example !== examples[examples.length - 1]) {
      jsdoc += '   * \n';
    }
  }

  jsdoc += '   */\n';
  return jsdoc;
}

// Processa o arquivo registry.ts
function addJSDocToRegistry(): void {
  console.log('📝 Adicionando comentários JSDoc ao registry.ts...\n');

  const registryPath = path.join(process.cwd(), 'src', 'lib', 'mcp', 'registry.ts');
  let content = fs.readFileSync(registryPath, 'utf-8');

  // Regex para encontrar registerMcpTool calls
  const toolRegex = /  \/\/ Tool: (.+?)\n  registerMcpTool\(\{/gs;

  let match;
  const replacements: Array<{ original: string; replacement: string; toolName: string }> = [];

  while ((match = toolRegex.exec(content)) !== null) {
    const [fullMatch, toolComment] = match;
    const toolName = toolComment.trim();

    // Extrair descrição da linha seguinte ao registerMcpTool
    const startIndex = match.index;
    const descMatch = content.slice(startIndex).match(/description: '([^']+)'/);

    if (!descMatch) continue;

    const description = descMatch[1];
    const jsdoc = generateJSDoc(toolName, description);

    // Substituir o comentário simples por JSDoc
    const newBlock = `${jsdoc}  registerMcpTool({`;

    replacements.push({
      original: fullMatch,
      replacement: newBlock,
      toolName
    });
  }

  // Aplicar substituições
  console.log(`✅ Encontrados ${replacements.length} tools para atualizar\n`);

  for (const { original, replacement, toolName } of replacements) {
    console.log(`   - ${toolName}`);
    content = content.replace(original, replacement);
  }

  console.log('');

  // Salvar arquivo
  fs.writeFileSync(registryPath, content, 'utf-8');

  console.log('✅ JSDoc adicionado com sucesso!');
  console.log(`📄 Arquivo atualizado: ${registryPath}\n`);
}

// Executar
addJSDocToRegistry();
