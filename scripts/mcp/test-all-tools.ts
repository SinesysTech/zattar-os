#!/usr/bin/env tsx

/**
 * Script de Teste Automatizado - Todas as Tools MCP
 *
 * Executa testes de todas as tools e gera relatório em JSON
 */

import * as fs from 'fs';
import * as path from 'path';
import { executeMcpTool, listMcpTools } from '@/lib/mcp';

interface TestResult {
  tool: string;
  success: boolean;
  error?: string;
  duration: number;
  timestamp: string;
}

// Argumentos mínimos válidos para cada tipo de tool
function getMinimalValidArgs(toolName: string): Record<string, any> {
  // Mapeamento de args para tools específicas
  const specificArgs: Record<string, Record<string, any>> = {
    // PROCESSOS
    listar_processos: { limite: 5 },
    buscar_processos_por_cpf: { cpf: '12345678901', limite: 5 },
    buscar_processos_por_cnpj: { cnpj: '12345678000190', limite: 5 },
    buscar_processo_por_numero: { numero_processo: '0001234-56.2023.5.15.0001' },

    // PARTES
    listar_clientes: { limite: 5 },
    buscar_cliente_por_cpf: { cpf: '12345678901' },
    buscar_cliente_por_cnpj: { cnpj: '12345678000190' },
    listar_partes_contrarias: { limite: 5 },
    listar_terceiros: { limite: 5 },
    listar_representantes: { limite: 5 },

    // CONTRATOS
    listar_contratos: { limite: 5 },
    buscar_contrato_por_cliente: { cliente_id: 1, limite: 5 },

    // FINANCEIRO
    listar_plano_contas: {},
    listar_lancamentos: { limite: 5 },
    gerar_dre: { data_inicio: '2025-01-01', data_fim: '2025-01-31' },
    obter_evolucao_dre: { data_inicio: '2025-01-01', data_fim: '2025-01-31', agrupamento: 'mensal' },
    exportar_dre_csv: { data_inicio: '2025-01-01', data_fim: '2025-01-31' },
    exportar_dre_pdf: { data_inicio: '2025-01-01', data_fim: '2025-01-31' },
    obter_fluxo_caixa_unificado: { data_inicio: '2025-01-01', data_fim: '2025-01-31' },
    obter_fluxo_caixa_diario: { data_inicio: '2025-01-01', data_fim: '2025-01-31' },
    obter_fluxo_caixa_por_periodo: { data_inicio: '2025-01-01', data_fim: '2025-01-31', agrupamento: 'mensal' },
    obter_indicadores_saude: {},
    obter_alertas_caixa: {},
    obter_resumo_dashboard: {},
    obter_saldo_inicial: { data_referencia: '2025-01-01' },
    listar_contas_bancarias: {},
    listar_centros_custo: {},
    listar_transacoes: { conta_bancaria_id: 1, data_inicio: '2025-01-01', data_fim: '2025-01-31' },
    obter_sugestoes: { transacao_id: 1 },
    buscar_lancamentos_candidatos: { transacao_id: 1 },
    conciliar_manual: { transacao_id: 1, lancamento_id: 1 },
    desconciliar: { conciliacao_id: 1 },

    // CHAT
    listar_salas: { limite: 5 },
    listar_mensagens: { sala_id: 1, limite: 20 },
    buscar_historico: { termo: 'teste', limite: 10 },
    criar_grupo: { nome: 'Grupo Teste', descricao: 'Descrição teste', participantes_ids: [1] },
    iniciar_chamada: { sala_id: 1, tipo: 'audio' },
    buscar_historico_chamadas: { sala_id: 1 },

    // DOCUMENTOS
    listar_documentos: { limite: 10 },
    buscar_documento_por_tags: { tags: ['teste'], limite: 10 },
    listar_templates: { limite: 10 },
    usar_template: { template_id: 1, dados: {} },
    listar_categorias_templates: {},
    listar_templates_mais_usados: { limite: 5 },

    // EXPEDIENTES
    listar_expedientes: { limite: 10 },
    criar_expediente: { processo_id: 1, tipo: 'oficio', descricao: 'Teste' },
    baixar_expediente: { expediente_id: 1 },
    reverter_baixa_expediente: { expediente_id: 1 },
    transferir_responsavel_expediente: { expediente_id: 1, novo_responsavel_id: 2 },
    baixar_expedientes_em_massa: { expedientes_ids: [1, 2] },
    listar_expedientes_pendentes: { limite: 10 },

    // AUDIÊNCIAS
    listar_audiencias: { limite: 10 },
    atualizar_status_audiencia: { audiencia_id: 1, status: 'realizada' },
    listar_tipos_audiencia: {},
    buscar_audiencias_por_cpf: { cpf: '12345678901', limite: 10 },
    buscar_audiencias_por_cnpj: { cnpj: '12345678000190', limite: 10 },
    buscar_audiencias_por_numero_processo: { numero_processo: '0001234-56.2023.5.15.0001', limite: 10 },

    // OBRIGAÇÕES
    listar_acordos: { limite: 10 },
    buscar_acordos_por_cpf: { cpf: '12345678901', limite: 10 },
    buscar_acordos_por_cnpj: { cnpj: '12345678000190', limite: 10 },
    buscar_acordos_por_processo: { processo_id: 1, limite: 10 },
    listar_repasses_pendentes: { limite: 10 },

    // RH
    listar_salarios: { limite: 10 },
    listar_folhas_pagamento: { limite: 10 },

    // DASHBOARD
    obter_metricas_escritorio: {},
    obter_dashboard_usuario: { usuario_id: 1 },

    // BUSCA SEMÂNTICA
    buscar_semantica: { consulta: 'teste', limite: 10 },

    // CAPTURA
    listar_capturas_cnj: { limite: 10 },
    obter_timeline_captura: { processo_id: 1 },

    // USUÁRIOS
    listar_usuarios: { limite: 10 },
    buscar_usuario_por_email: { email: 'teste@exemplo.com' },
    buscar_usuario_por_cpf: { cpf: '12345678901' },
    listar_permissoes_usuario: { usuario_id: 1 },

    // OUTROS
    listar_acervo: { limite: 10 },
    listar_assistentes: { limite: 10 },
    listar_cargos: {},
    listar_templates_assinatura: { limite: 10 },
  };

  // Retornar args específicos ou vazio
  return specificArgs[toolName] || {};
}

// Tools que devem ser skipadas (operações destrutivas ou que requerem dados específicos)
const SKIP_TOOLS = new Set([
  'criar_contrato',
  'atualizar_contrato',
  'criar_conta',
  'atualizar_conta',
  'excluir_conta',
  'criar_lancamento',
  'atualizar_lancamento',
  'excluir_lancamento',
  'confirmar_lancamento',
  'cancelar_lancamento',
  'estornar_lancamento',
  'enviar_mensagem',
  'criar_documento',
  'atualizar_documento',
  'criar_expediente',
  'baixar_expediente',
  'reverter_baixa_expediente',
  'transferir_responsavel_expediente',
  'baixar_expedientes_em_massa',
  'atualizar_status_audiencia',
  'criar_acordo',
  'atualizar_acordo',
  'criar_repasse',
]);

async function testTool(toolName: string): Promise<TestResult> {
  const start = Date.now();

  try {
    // Verificar se deve ser skipada
    if (SKIP_TOOLS.has(toolName)) {
      return {
        tool: toolName,
        success: true,
        error: 'SKIP: Operação destrutiva',
        duration: 0,
        timestamp: new Date().toISOString(),
      };
    }

    const args = getMinimalValidArgs(toolName);
    const result = await executeMcpTool(toolName, args);

    return {
      tool: toolName,
      success: !result.isError,
      error: result.isError ? (result.error || 'Erro desconhecido') : undefined,
      duration: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      tool: toolName,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }
}

async function testAllTools(): Promise<void> {
  console.log('🧪 Iniciando Testes Automatizados de Todas as Tools MCP\n');
  console.log('═'.repeat(60));

  const tools = listMcpTools();
  const results: TestResult[] = [];

  console.log(`\n📊 Total de tools a testar: ${tools.length}\n`);

  let current = 0;
  for (const tool of tools) {
    current++;
    const progress = `[${current}/${tools.length}]`;
    process.stdout.write(`\r${progress} Testando ${tool.name}...`.padEnd(80));

    const result = await testTool(tool.name);
    results.push(result);
  }

  console.log('\n');

  // Estatísticas
  const total = results.length;
  const passed = results.filter(r => r.success && !r.error?.startsWith('SKIP')).length;
  const failed = results.filter(r => !r.success).length;
  const skipped = results.filter(r => r.error?.startsWith('SKIP')).length;
  const successRate = total > 0 ? ((passed / (total - skipped)) * 100).toFixed(1) : '0.0';

  // Relatório Console
  console.log('═'.repeat(60));
  console.log('\n📊 RELATÓRIO DE TESTES\n');
  console.log(`Total de tools: ${total}`);
  console.log(`✅ Sucesso: ${passed} (${successRate}%)`);
  console.log(`❌ Falha: ${failed}`);
  console.log(`⏭️  Ignoradas: ${skipped}`);

  if (failed > 0) {
    console.log('\n❌ Tools com falha:\n');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  - ${r.tool}`);
        console.log(`    Erro: ${r.error}`);
      });
  }

  // Salvar relatório JSON
  const reportDir = path.join(process.cwd(), 'docs', 'mcp-audit');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, 'test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total,
      passed,
      failed,
      skipped,
      successRate: parseFloat(successRate),
    },
    results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\n📄 Relatório salvo em: ${reportPath}`);
  console.log('\n' + '═'.repeat(60));

  // Status de saída
  if (failed > 0) {
    console.log('\n❌ Alguns testes falharam');
    process.exit(1);
  } else if (parseFloat(successRate) < 95) {
    console.log(`\n⚠️  Taxa de sucesso (${successRate}%) abaixo do esperado (95%)`);
    process.exit(1);
  } else {
    console.log('\n✅ Todos os testes passaram!');
  }
}

// Executar
testAllTools().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
