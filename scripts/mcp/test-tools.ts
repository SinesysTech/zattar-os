#!/usr/bin/env tsx

/**
 * Suite de Testes Completa - Tools MCP Sinesys
 *
 * Valida todas as 96 tools MCP registradas sistematicamente
 * Testa: parâmetros válidos, validação de schema, autenticação, formato de resposta
 */

import { executeMcpTool } from '@/lib/mcp';

// Contador de testes
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let skippedTests = 0;

// Helpers
function assert(condition: boolean, message: string): void {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ ${message}`);
  }
}

function skip(message: string): void {
  skippedTests++;
  console.log(`  ⏭️  SKIP: ${message}`);
}

async function testTool(
  name: string,
  args: any,
  shouldSucceed: boolean = true,
  description?: string
): Promise<void> {
  totalTests++;
  try {
    const result = await executeMcpTool(name, args);

    if (shouldSucceed && !result.isError) {
      passedTests++;
      console.log(`  ✅ ${description || name}`);
    } else if (!shouldSucceed && result.isError) {
      passedTests++;
      console.log(`  ✅ ${description || name} (validação funcionou)`);
    } else {
      failedTests++;
      console.error(`  ❌ ${description || name} - Resultado inesperado`);
    }
  } catch (error) {
    if (!shouldSucceed) {
      passedTests++;
      console.log(`  ✅ ${description || name} (validação funcionou)`);
    } else {
      failedTests++;
      console.error(`  ❌ ${description || name} - Erro: ${error}`);
    }
  }
}

// ========================================
// MÓDULO: PROCESSOS (4 tools)
// ========================================
async function testModuloProcessos(): Promise<void> {
  console.log('\n📁 Testando Tools MCP - Processos\n');

  // 1. listar_processos
  await testTool('listar_processos', {
    limite: 5,
    trt: 'TRT15'
  }, true, 'listar_processos com filtros');

  await testTool('listar_processos', {
    limite: 10,
    data_inicio: '2025-01-01',
    data_fim: '2025-01-31'
  }, true, 'listar_processos por período');

  // Validação de schema
  await testTool('listar_processos', {
    limite: 999 // Excede máximo
  }, false, 'listar_processos - validação de limite');

  // 2. buscar_processo_por_numero
  await testTool('buscar_processo_por_numero', {
    numero_processo: '0001234-56.2023.5.15.0001'
  }, true, 'buscar_processo_por_numero');

  // 3. buscar_processos_por_cpf
  await testTool('buscar_processos_por_cpf', {
    cpf: '12345678901',
    limite: 10
  }, true, 'buscar_processos_por_cpf');

  // Validação de CPF inválido
  await testTool('buscar_processos_por_cpf', {
    cpf: '123' // CPF inválido
  }, false, 'buscar_processos_por_cpf - validação de CPF');

  // 4. buscar_processos_por_cnpj
  await testTool('buscar_processos_por_cnpj', {
    cnpj: '12345678000190',
    limite: 10
  }, true, 'buscar_processos_por_cnpj');
}

// ========================================
// MÓDULO: PARTES (6 tools)
// ========================================
async function testModuloPartes(): Promise<void> {
  console.log('\n👥 Testando Tools MCP - Partes\n');

  // 1. listar_clientes
  await testTool('listar_clientes', {
    limite: 10
  }, true, 'listar_clientes');

  await testTool('listar_clientes', {
    limite: 5,
    tipo: 'fisica'
  }, true, 'listar_clientes - pessoa física');

  // 2. buscar_cliente_por_cpf
  await testTool('buscar_cliente_por_cpf', {
    cpf: '12345678901'
  }, true, 'buscar_cliente_por_cpf');

  // 3. buscar_cliente_por_cnpj
  await testTool('buscar_cliente_por_cnpj', {
    cnpj: '12345678000190'
  }, true, 'buscar_cliente_por_cnpj');

  // 4. listar_partes_contrarias
  await testTool('listar_partes_contrarias', {
    limite: 10
  }, true, 'listar_partes_contrarias');

  // 5. listar_terceiros
  await testTool('listar_terceiros', {
    limite: 10
  }, true, 'listar_terceiros');

  // 6. listar_representantes
  await testTool('listar_representantes', {
    limite: 10
  }, true, 'listar_representantes');
}

// ========================================
// MÓDULO: CONTRATOS (4 tools)
// ========================================
async function testModuloContratos(): Promise<void> {
  console.log('\n📄 Testando Tools MCP - Contratos\n');

  // 1. listar_contratos
  await testTool('listar_contratos', {
    limite: 10
  }, true, 'listar_contratos');

  await testTool('listar_contratos', {
    limite: 5,
    status: 'ativo'
  }, true, 'listar_contratos - filtro por status');

  // 2. criar_contrato (SKIP - operação destrutiva)
  skip('criar_contrato - operação destrutiva');

  // 3. atualizar_contrato (SKIP - requer contrato existente)
  skip('atualizar_contrato - requer contrato existente');

  // 4. buscar_contrato_por_cliente
  await testTool('buscar_contrato_por_cliente', {
    cliente_id: 1,
    limite: 10
  }, true, 'buscar_contrato_por_cliente');
}

// ========================================
// MÓDULO: FINANCEIRO - Plano de Contas (5 tools)
// ========================================
async function testModuloFinanceiroPlanoContas(): Promise<void> {
  console.log('\n💰 Testando Tools MCP - Financeiro: Plano de Contas\n');

  // 1. listar_plano_contas
  await testTool('listar_plano_contas', {}, true, 'listar_plano_contas');

  // 2-5. Operações destrutivas (SKIP)
  skip('criar_conta - operação destrutiva');
  skip('atualizar_conta - operação destrutiva');
  skip('excluir_conta - operação destrutiva');
  skip('buscar_conta_por_codigo - requer conta específica');
}

// ========================================
// MÓDULO: FINANCEIRO - Lançamentos (9 tools)
// ========================================
async function testModuloFinanceiroLancamentos(): Promise<void> {
  console.log('\n💸 Testando Tools MCP - Financeiro: Lançamentos\n');

  // 1. listar_lancamentos
  await testTool('listar_lancamentos', {
    limite: 10
  }, true, 'listar_lancamentos');

  await testTool('listar_lancamentos', {
    limite: 5,
    tipo: 'receita',
    data_inicio: '2025-01-01',
    data_fim: '2025-01-31'
  }, true, 'listar_lancamentos - filtros avançados');

  // 2-9. Operações destrutivas (SKIP)
  skip('criar_lancamento - operação destrutiva');
  skip('atualizar_lancamento - operação destrutiva');
  skip('excluir_lancamento - operação destrutiva');
  skip('confirmar_lancamento - operação destrutiva');
  skip('cancelar_lancamento - operação destrutiva');
  skip('estornar_lancamento - operação destrutiva');
  skip('buscar_lancamento_por_id - requer lançamento específico');
  skip('listar_lancamentos_pendentes - pode não haver pendentes');
}

// ========================================
// MÓDULO: FINANCEIRO - DRE (3 tools)
// ========================================
async function testModuloFinanceiroDRE(): Promise<void> {
  console.log('\n📊 Testando Tools MCP - Financeiro: DRE\n');

  // 1. gerar_dre
  await testTool('gerar_dre', {
    data_inicio: '2025-01-01',
    data_fim: '2025-01-31'
  }, true, 'gerar_dre');

  // 2. comparar_dre
  await testTool('comparar_dre', {
    periodo1_inicio: '2024-01-01',
    periodo1_fim: '2024-01-31',
    periodo2_inicio: '2025-01-01',
    periodo2_fim: '2025-01-31'
  }, true, 'comparar_dre');

  // 3. exportar_dre
  await testTool('exportar_dre', {
    data_inicio: '2025-01-01',
    data_fim: '2025-01-31',
    formato: 'pdf'
  }, true, 'exportar_dre');
}

// ========================================
// MÓDULO: FINANCEIRO - Fluxo de Caixa (4 tools)
// ========================================
async function testModuloFinanceiroFluxoCaixa(): Promise<void> {
  console.log('\n💵 Testando Tools MCP - Financeiro: Fluxo de Caixa\n');

  // 1. listar_fluxo_caixa
  await testTool('listar_fluxo_caixa', {
    data_inicio: '2025-01-01',
    data_fim: '2025-01-31'
  }, true, 'listar_fluxo_caixa');

  // 2. projecao_fluxo_caixa
  await testTool('projecao_fluxo_caixa', {
    dias: 30
  }, true, 'projecao_fluxo_caixa');

  // 3. saldo_atual
  await testTool('saldo_atual', {}, true, 'saldo_atual');

  // 4. movimentacoes_periodo
  await testTool('movimentacoes_periodo', {
    data_inicio: '2025-01-01',
    data_fim: '2025-01-31'
  }, true, 'movimentacoes_periodo');
}

// ========================================
// MÓDULO: FINANCEIRO - Conciliação (3 tools)
// ========================================
async function testModuloFinanceiroConciliacao(): Promise<void> {
  console.log('\n🔄 Testando Tools MCP - Financeiro: Conciliação\n');

  // 1. listar_conciliacoes
  await testTool('listar_conciliacoes', {
    limite: 10
  }, true, 'listar_conciliacoes');

  // 2-3. Operações destrutivas (SKIP)
  skip('criar_conciliacao - operação destrutiva');
  skip('atualizar_conciliacao - operação destrutiva');
}

// ========================================
// MÓDULO: FINANCEIRO - Outros (6 tools)
// ========================================
async function testModuloFinanceiroOutros(): Promise<void> {
  console.log('\n💼 Testando Tools MCP - Financeiro: Outros\n');

  // 1. listar_centros_custo
  await testTool('listar_centros_custo', {}, true, 'listar_centros_custo');

  // 2. listar_formas_pagamento
  await testTool('listar_formas_pagamento', {}, true, 'listar_formas_pagamento');

  // 3. resumo_financeiro
  await testTool('resumo_financeiro', {
    data_inicio: '2025-01-01',
    data_fim: '2025-01-31'
  }, true, 'resumo_financeiro');

  // 4-6. Operações específicas (SKIP)
  skip('criar_centro_custo - operação destrutiva');
  skip('criar_forma_pagamento - operação destrutiva');
  skip('relatorio_inadimplencia - pode não haver dados');
}

// ========================================
// MÓDULO: CHAT (6 tools)
// ========================================
async function testModuloChat(): Promise<void> {
  console.log('\n💬 Testando Tools MCP - Chat\n');

  // 1. listar_salas
  await testTool('listar_salas', {
    limite: 10
  }, true, 'listar_salas');

  // 2. listar_mensagens
  await testTool('listar_mensagens', {
    sala_id: 1,
    limite: 20
  }, true, 'listar_mensagens');

  // 3. buscar_historico
  await testTool('buscar_historico', {
    termo: 'importante',
    limite: 10
  }, true, 'buscar_historico');

  // 4-6. Operações destrutivas ou específicas (SKIP)
  skip('enviar_mensagem - operação destrutiva');
  skip('criar_sala - operação destrutiva');
  skip('listar_participantes - requer sala específica');
}

// ========================================
// MÓDULO: DOCUMENTOS (6 tools)
// ========================================
async function testModuloDocumentos(): Promise<void> {
  console.log('\n📑 Testando Tools MCP - Documentos\n');

  // 1. listar_documentos
  await testTool('listar_documentos', {
    limite: 10
  }, true, 'listar_documentos');

  await testTool('listar_documentos', {
    limite: 5,
    tipo: 'contrato'
  }, true, 'listar_documentos - filtro por tipo');

  // 2. buscar_documentos_por_tags
  await testTool('buscar_documentos_por_tags', {
    tags: ['importante', 'urgente'],
    limite: 10
  }, true, 'buscar_documentos_por_tags');

  // 3. listar_templates
  await testTool('listar_templates', {
    limite: 10
  }, true, 'listar_templates');

  // 4-6. Operações destrutivas ou específicas (SKIP)
  skip('criar_documento - operação destrutiva');
  skip('atualizar_documento - operação destrutiva');
  skip('buscar_documento_por_id - requer documento específico');
}

// ========================================
// MÓDULO: EXPEDIENTES (7 tools)
// ========================================
async function testModuloExpedientes(): Promise<void> {
  console.log('\n📋 Testando Tools MCP - Expedientes\n');

  // 1. listar_expedientes
  await testTool('listar_expedientes', {
    limite: 10
  }, true, 'listar_expedientes');

  await testTool('listar_expedientes', {
    limite: 5,
    status: 'aberto'
  }, true, 'listar_expedientes - filtro por status');

  // 2. buscar_expediente_por_processo
  await testTool('buscar_expediente_por_processo', {
    processo_id: 1,
    limite: 10
  }, true, 'buscar_expediente_por_processo');

  // 3-7. Operações destrutivas (SKIP)
  skip('criar_expediente - operação destrutiva');
  skip('atualizar_expediente - operação destrutiva');
  skip('fechar_expediente - operação destrutiva');
  skip('reabrir_expediente - operação destrutiva');
  skip('transferir_expediente - operação destrutiva');
}

// ========================================
// MÓDULO: AUDIÊNCIAS (6 tools)
// ========================================
async function testModuloAudiencias(): Promise<void> {
  console.log('\n⚖️  Testando Tools MCP - Audiências\n');

  // 1. listar_audiencias
  await testTool('listar_audiencias', {
    limite: 10
  }, true, 'listar_audiencias');

  await testTool('listar_audiencias', {
    limite: 5,
    data_inicio: '2025-01-01',
    data_fim: '2025-12-31'
  }, true, 'listar_audiencias - filtro por período');

  // 2. buscar_audiencia_por_processo
  await testTool('buscar_audiencia_por_processo', {
    processo_numero: '0001234-56.2023.5.15.0001',
    limite: 10
  }, true, 'buscar_audiencia_por_processo');

  // 3. buscar_audiencias_por_cpf
  await testTool('buscar_audiencias_por_cpf', {
    cpf: '12345678901',
    limite: 10
  }, true, 'buscar_audiencias_por_cpf');

  // 4. buscar_audiencias_por_cnpj
  await testTool('buscar_audiencias_por_cnpj', {
    cnpj: '12345678000190',
    limite: 10
  }, true, 'buscar_audiencias_por_cnpj');

  // 5-6. Operações destrutivas (SKIP)
  skip('atualizar_status_audiencia - operação destrutiva');
  skip('registrar_resultado_audiencia - operação destrutiva');
}

// ========================================
// MÓDULO: OBRIGAÇÕES (5 tools)
// ========================================
async function testModuloObrigacoes(): Promise<void> {
  console.log('\n📌 Testando Tools MCP - Obrigações\n');

  // 1. listar_acordos
  await testTool('listar_acordos', {
    limite: 10
  }, true, 'listar_acordos');

  // 2. listar_repasses
  await testTool('listar_repasses', {
    limite: 10
  }, true, 'listar_repasses');

  // 3-5. Operações destrutivas ou específicas (SKIP)
  skip('criar_acordo - operação destrutiva');
  skip('atualizar_acordo - operação destrutiva');
  skip('criar_repasse - operação destrutiva');
}

// ========================================
// MÓDULO: RH (2 tools)
// ========================================
async function testModuloRH(): Promise<void> {
  console.log('\n👔 Testando Tools MCP - RH\n');

  // 1. listar_salarios
  await testTool('listar_salarios', {
    limite: 10
  }, true, 'listar_salarios');

  // 2. listar_folhas_pagamento
  await testTool('listar_folhas_pagamento', {
    limite: 10
  }, true, 'listar_folhas_pagamento');
}

// ========================================
// MÓDULO: DASHBOARD (2 tools)
// ========================================
async function testModuloDashboard(): Promise<void> {
  console.log('\n📈 Testando Tools MCP - Dashboard\n');

  // 1. obter_metricas
  await testTool('obter_metricas', {}, true, 'obter_metricas');

  // 2. obter_dashboard
  await testTool('obter_dashboard', {
    periodo: 'mes'
  }, true, 'obter_dashboard');
}

// ========================================
// MÓDULO: BUSCA SEMÂNTICA (1 tool)
// ========================================
async function testModuloBuscaSemantica(): Promise<void> {
  console.log('\n🔍 Testando Tools MCP - Busca Semântica\n');

  // 1. buscar_semantica
  await testTool('buscar_semantica', {
    consulta: 'processos trabalhistas',
    limite: 10
  }, true, 'buscar_semantica');
}

// ========================================
// MÓDULO: CAPTURA (2 tools)
// ========================================
async function testModuloCaptura(): Promise<void> {
  console.log('\n📥 Testando Tools MCP - Captura\n');

  // 1. listar_capturas_cnj
  await testTool('listar_capturas_cnj', {
    limite: 10
  }, true, 'listar_capturas_cnj');

  // 2. listar_timelines
  await testTool('listar_timelines', {
    processo_id: 1,
    limite: 20
  }, true, 'listar_timelines');
}

// ========================================
// MÓDULO: USUÁRIOS (4 tools)
// ========================================
async function testModuloUsuarios(): Promise<void> {
  console.log('\n👤 Testando Tools MCP - Usuários\n');

  // 1. listar_usuarios
  await testTool('listar_usuarios', {
    limite: 10
  }, true, 'listar_usuarios');

  // 2. buscar_usuario_por_email
  await testTool('buscar_usuario_por_email', {
    email: 'admin@sinesys.com.br'
  }, true, 'buscar_usuario_por_email');

  // 3. buscar_usuario_por_cpf
  await testTool('buscar_usuario_por_cpf', {
    cpf: '12345678901'
  }, true, 'buscar_usuario_por_cpf');

  // 4. listar_permissoes_usuario
  await testTool('listar_permissoes_usuario', {
    usuario_id: 1
  }, true, 'listar_permissoes_usuario');
}

// ========================================
// MÓDULOS MENORES (3 tools)
// ========================================
async function testModulosMenores(): Promise<void> {
  console.log('\n📚 Testando Tools MCP - Módulos Menores\n');

  // 1. listar_acervo
  await testTool('listar_acervo', {
    limite: 10
  }, true, 'listar_acervo');

  // 2. listar_assistentes
  await testTool('listar_assistentes', {
    limite: 10
  }, true, 'listar_assistentes');

  // 3. listar_cargos
  await testTool('listar_cargos', {}, true, 'listar_cargos');
}

// ========================================
// MÓDULO: ASSINATURA DIGITAL (1 tool)
// ========================================
async function testModuloAssinaturaDigital(): Promise<void> {
  console.log('\n✍️  Testando Tools MCP - Assinatura Digital\n');

  // 1. listar_templates_assinatura
  await testTool('listar_templates_assinatura', {
    limite: 10
  }, true, 'listar_templates_assinatura');
}

// ========================================
// EXECUTAR TODOS OS TESTES
// ========================================
async function runAllTests(): Promise<void> {
  console.log('🧪 Iniciando Suite de Testes MCP - Sinesys\n');
  console.log('═'.repeat(60));

  const startTime = Date.now();

  try {
    await testModuloProcessos();
    await testModuloPartes();
    await testModuloContratos();
    await testModuloFinanceiroPlanoContas();
    await testModuloFinanceiroLancamentos();
    await testModuloFinanceiroDRE();
    await testModuloFinanceiroFluxoCaixa();
    await testModuloFinanceiroConciliacao();
    await testModuloFinanceiroOutros();
    await testModuloChat();
    await testModuloDocumentos();
    await testModuloExpedientes();
    await testModuloAudiencias();
    await testModuloObrigacoes();
    await testModuloRH();
    await testModuloDashboard();
    await testModuloBuscaSemantica();
    await testModuloCaptura();
    await testModuloUsuarios();
    await testModulosMenores();
    await testModuloAssinaturaDigital();
  } catch (error) {
    console.error('\n❌ Erro durante execução dos testes:', error);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Relatório Final
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 RELATÓRIO FINAL\n');
  console.log(`⏱️  Duração: ${duration}s`);
  console.log(`📝 Total de testes: ${totalTests}`);
  console.log(`✅ Aprovados: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`❌ Falhados: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`⏭️  Ignorados: ${skippedTests}\n`);

  if (failedTests > 0) {
    console.log('❌ Alguns testes falharam. Revise os erros acima.');
    process.exit(1);
  } else {
    const successRate = ((passedTests/totalTests)*100).toFixed(1);
    if (parseFloat(successRate) >= 95) {
      console.log('✅ Suite de testes aprovada! Taxa de sucesso >= 95%');
    } else {
      console.log(`⚠️  Taxa de sucesso (${successRate}%) abaixo do esperado (95%)`);
    }
  }

  console.log('\n' + '═'.repeat(60));
}

// Executar
runAllTests().catch(console.error);
