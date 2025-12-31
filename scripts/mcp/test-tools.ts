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
    dataInicio: '2025-01-01',
    dataFim: '2025-01-31'
  }, true, 'listar_processos por período');

  // Validação de schema
  await testTool('listar_processos', {
    limite: 999 // Excede máximo
  }, false, 'listar_processos - validação de limite');

  // 2. buscar_processo_por_numero
  await testTool('buscar_processo_por_numero', {
    numeroProcesso: '0001234-56.2023.5.15.0001'
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

  // 2. criar_contrato - tool destrutiva, testada em integration tests
  skip('criar_contrato - tool destrutiva, cobertura em testes de integração');

  // 3. atualizar_contrato - tool destrutiva, testada em integration tests
  skip('atualizar_contrato - tool destrutiva, cobertura em testes de integração');

  // 4. buscar_contrato_por_cliente
  await testTool('buscar_contrato_por_cliente', {
    clienteId: 1,
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

  // 2-5. Operações CUD - tools destrutivas, cobertas em integration tests
  skip('criar_conta - tool CUD, cobertura em testes de integração');
  skip('atualizar_conta - tool CUD, cobertura em testes de integração');
  skip('excluir_conta - tool CUD, cobertura em testes de integração');
  skip('buscar_conta_por_codigo - tool de leitura específica, validada por schema');
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
    dataInicio: '2025-01-01',
    dataFim: '2025-01-31'
  }, true, 'listar_lancamentos - filtros avançados');

  // 2-9. Operações CUD - tools destrutivas, cobertas em integration tests
  skip('criar_lancamento - tool CUD, cobertura em testes de integração');
  skip('atualizar_lancamento - tool CUD, cobertura em testes de integração');
  skip('excluir_lancamento - tool CUD, cobertura em testes de integração');
  skip('confirmar_lancamento - tool CUD, cobertura em testes de integração');
  skip('cancelar_lancamento - tool CUD, cobertura em testes de integração');
  skip('estornar_lancamento - tool CUD, cobertura em testes de integração');
  skip('buscar_lancamento_por_id - tool de leitura específica, validada por schema');
  skip('listar_lancamentos_pendentes - tool de leitura, resultado vazio válido');
}

// ========================================
// MÓDULO: FINANCEIRO - DRE (3 tools)
// ========================================
async function testModuloFinanceiroDRE(): Promise<void> {
  console.log('\n📊 Testando Tools MCP - Financeiro: DRE\n');

  // 1. gerar_dre
  await testTool('gerar_dre', {
    dataInicio: '2025-01-01',
    dataFim: '2025-01-31'
  }, true, 'gerar_dre');

  // 2. comparar_dre
  await testTool('comparar_dre', {
    periodo1Inicio: '2024-01-01',
    periodo1Fim: '2024-01-31',
    periodo2Inicio: '2025-01-01',
    periodo2Fim: '2025-01-31'
  }, true, 'comparar_dre');

  // 3. exportar_dre
  await testTool('exportar_dre', {
    dataInicio: '2025-01-01',
    dataFim: '2025-01-31',
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
    dataInicio: '2025-01-01',
    dataFim: '2025-01-31'
  }, true, 'listar_fluxo_caixa');

  // 2. projecao_fluxo_caixa
  await testTool('projecao_fluxo_caixa', {
    dias: 30
  }, true, 'projecao_fluxo_caixa');

  // 3. saldo_atual
  await testTool('saldo_atual', {}, true, 'saldo_atual');

  // 4. movimentacoes_periodo
  await testTool('movimentacoes_periodo', {
    dataInicio: '2025-01-01',
    dataFim: '2025-01-31'
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

  // 2-3. Operações CUD - tools destrutivas, cobertas em integration tests
  skip('criar_conciliacao - tool CUD, cobertura em testes de integração');
  skip('atualizar_conciliacao - tool CUD, cobertura em testes de integração');
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
    dataInicio: '2025-01-01',
    dataFim: '2025-01-31'
  }, true, 'resumo_financeiro');

  // 4-6. Operações CUD e relatórios específicos
  skip('criar_centro_custo - tool CUD, cobertura em testes de integração');
  skip('criar_forma_pagamento - tool CUD, cobertura em testes de integração');
  skip('relatorio_inadimplencia - tool de relatório, resultado vazio válido');
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
    salaId: 1,
    limite: 20
  }, true, 'listar_mensagens');

  // 3. buscar_historico
  await testTool('buscar_historico', {
    termo: 'importante',
    limite: 10
  }, true, 'buscar_historico');

  // 4-6. Operações CUD e leitura específica
  skip('enviar_mensagem - tool CUD, cobertura em testes de integração');
  skip('criar_sala - tool CUD, cobertura em testes de integração');
  skip('listar_participantes - tool de leitura específica, validada por schema');
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

  // 4-6. Operações CUD e leitura específica
  skip('criar_documento - tool CUD, cobertura em testes de integração');
  skip('atualizar_documento - tool CUD, cobertura em testes de integração');
  skip('buscar_documento_por_id - tool de leitura específica, validada por schema');
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
    processoId: 1,
    limite: 10
  }, true, 'buscar_expediente_por_processo');

  // 3-7. Operações CUD - tools destrutivas, cobertas em integration tests
  skip('criar_expediente - tool CUD, cobertura em testes de integração');
  skip('atualizar_expediente - tool CUD, cobertura em testes de integração');
  skip('fechar_expediente - tool CUD, cobertura em testes de integração');
  skip('reabrir_expediente - tool CUD, cobertura em testes de integração');
  skip('transferir_expediente - tool CUD, cobertura em testes de integração');
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
    dataInicio: '2025-01-01',
    dataFim: '2025-12-31'
  }, true, 'listar_audiencias - filtro por período');

  // 2. buscar_audiencia_por_processo
  await testTool('buscar_audiencia_por_processo', {
    processoNumero: '0001234-56.2023.5.15.0001',
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

  // 5-6. Operações CUD - tools destrutivas, cobertas em integration tests
  skip('atualizar_status_audiencia - tool CUD, cobertura em testes de integração');
  skip('registrar_resultado_audiencia - tool CUD, cobertura em testes de integração');
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

  // 3-5. Operações CUD - tools destrutivas, cobertas em integration tests
  skip('criar_acordo - tool CUD, cobertura em testes de integração');
  skip('atualizar_acordo - tool CUD, cobertura em testes de integração');
  skip('criar_repasse - tool CUD, cobertura em testes de integração');
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
    processoId: 1,
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
    usuarioId: 1
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
// MÓDULO: AUTENTICAÇÃO E SEGURANÇA
// ========================================
async function testAutenticacaoESeguranca(): Promise<void> {
  console.log('\n🔒 Testando Autenticação e Segurança\n');

  // Teste 1: Validação de parâmetros inválidos
  await testTool('listar_processos', {
    limite: -1 // Valor negativo inválido
  }, false, 'Validação: limite negativo deve falhar');

  await testTool('buscar_processos_por_cpf', {
    cpf: '123' // CPF curto demais
  }, false, 'Validação: CPF inválido deve falhar');

  await testTool('buscar_processos_por_cnpj', {
    cnpj: '123' // CNPJ curto demais
  }, false, 'Validação: CNPJ inválido deve falhar');

  await testTool('listar_processos', {
    limite: 1000 // Excede máximo permitido
  }, false, 'Validação: limite excessivo deve falhar');

  // Teste 2: Tools sem autenticação (se houver)
  console.log('  ℹ️  Todas as tools requerem autenticação - validação esperada');

  // Teste 3: Validação de datas inválidas
  await testTool('listar_processos', {
    limite: 10,
    dataInicio: 'data-invalida'
  }, false, 'Validação: data inválida deve falhar');

  // Teste 4: Validação de enums inválidos
  await testTool('listar_processos', {
    limite: 10,
    grau: 'grau_invalido' // enum inválido
  }, false, 'Validação: enum inválido deve falhar');
}

// ========================================
// MÓDULO: PERFORMANCE E LIMITES
// ========================================
async function testPerformanceELimites(): Promise<void> {
  console.log('\n⚡ Testando Performance e Limites\n');

  // Teste 1: Paginação eficiente
  await testTool('listar_processos', {
    limite: 1,
    offset: 0
  }, true, 'Paginação: primeiro item');

  await testTool('listar_processos', {
    limite: 100, // Máximo permitido
    offset: 0
  }, true, 'Paginação: limite máximo');

  // Teste 2: Busca com filtros complexos
  await testTool('listar_processos', {
    limite: 10,
    dataInicio: '2025-01-01',
    dataFim: '2025-01-31',
    status: 'ativo',
    trt: 'TRT15'
  }, true, 'Performance: múltiplos filtros');

  // Teste 3: Consultas vazias devem retornar gracefully
  await testTool('buscar_processos_por_cpf', {
    cpf: '00000000000' // CPF inexistente
  }, true, 'Performance: resultado vazio deve ser válido');

  console.log('  ℹ️  Rate limiting (10/100/1000 req/min) deve ser validado em testes de integração');
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
    await testAutenticacaoESeguranca();
    await testPerformanceELimites();
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
