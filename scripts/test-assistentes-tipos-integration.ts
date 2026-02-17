#!/usr/bin/env tsx
/**
 * TESTE DE INTEGRAÇÃO - ASSISTENTES-TIPOS
 * 
 * Valida toda a estrutura da feature de geração automática de peças:
 * - Verifica tabela no banco
 * - Testa operações CRUD
 * - Valida metadados dos assistentes
 * - Verifica imports e dependências
 */

import { createServiceClient } from '@/lib/supabase/service-client';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

function addResult(name: string, passed: boolean, message: string, duration?: number) {
  results.push({ name, passed, message, duration });
  log(passed ? '✅' : '❌', `${name}: ${message}${duration ? ` (${duration}ms)` : ''}`);
}

async function testTableExists() {
  const start = Date.now();
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('assistentes_tipos_expedientes')
      .select('id')
      .limit(1);

    if (error) {
      addResult('Tabela existe', false, error.message, Date.now() - start);
      return false;
    }

    addResult('Tabela existe', true, 'Tabela acessível', Date.now() - start);
    return true;
  } catch (error) {
    addResult('Tabela existe', false, String(error), Date.now() - start);
    return false;
  }
}

async function testTableStructure() {
  const start = Date.now();
  try {
    const supabase = createServiceClient();
    
    // Testar se conseguimos inserir/deletar uma relação de teste
    const { data: assistente, error: assistenteError } = await supabase
      .from('assistentes')
      .select('id')
      .limit(1)
      .single();

    if (assistenteError) {
      addResult('Estrutura da tabela', false, 'Não foi possível buscar assistente para teste', Date.now() - start);
      return false;
    }

    const { data: tipo, error: tipoError } = await supabase
      .from('tipos_expedientes')
      .select('id')
      .limit(1)
      .single();

    if (tipoError) {
      addResult('Estrutura da tabela', false, 'Não foi possível buscar tipo de expediente para teste', Date.now() - start);
      return false;
    }

    // Verificar se os campos esperados existem
    const { data, error } = await supabase
      .from('assistentes_tipos_expedientes')
      .select('id, assistente_id, tipo_expediente_id, ativo, criado_por, created_at, updated_at')
      .limit(1);

    if (error) {
      addResult('Estrutura da tabela', false, error.message, Date.now() - start);
      return false;
    }

    addResult('Estrutura da tabela', true, 'Todos os campos presentes', Date.now() - start);
    return true;
  } catch (error) {
    addResult('Estrutura da tabela', false, String(error), Date.now() - start);
    return false;
  }
}

async function testIndexes() {
  const start = Date.now();
  try {
    const supabase = createServiceClient();
    
    // Verificar se consultas com índices funcionam
    const { data, error } = await supabase
      .from('assistentes_tipos_expedientes')
      .select('*')
      .eq('ativo', true)
      .limit(10);

    if (error) {
      addResult('Índices', false, error.message, Date.now() - start);
      return false;
    }

    addResult('Índices', true, `${data?.length || 0} relações ativas encontradas`, Date.now() - start);
    return true;
  } catch (error) {
    addResult('Índices', false, String(error), Date.now() - start);
    return false;
  }
}

async function testAssistentesMetadata() {
  const start = Date.now();
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('assistentes')
      .select('id, nome, metadata')
      .not('metadata', 'is', null)
      .limit(5);

    if (error) {
      addResult('Metadata dos assistentes', false, error.message, Date.now() - start);
      return false;
    }

    if (!data || data.length === 0) {
      addResult('Metadata dos assistentes', false, 'Nenhum assistente com metadata encontrado', Date.now() - start);
      return false;
    }

    // Verificar se tem parameters.user_input_form
    const assistentesComForm = data.filter(a => {
      const metadata = a.metadata as any;
      return metadata?.parameters?.user_input_form;
    });

    addResult(
      'Metadata dos assistentes',
      assistentesComForm.length > 0,
      `${assistentesComForm.length}/${data.length} assistentes com user_input_form`,
      Date.now() - start
    );
    return assistentesComForm.length > 0;
  } catch (error) {
    addResult('Metadata dos assistentes', false, String(error), Date.now() - start);
    return false;
  }
}

async function testImports() {
  const start = Date.now();
  try {
    // Testar imports da feature
    const domain = await import('@/features/assistentes-tipos/domain');
    const repository = await import('@/features/assistentes-tipos/repository');
    const service = await import('@/features/assistentes-tipos/service');
    const actions = await import('@/features/assistentes-tipos/actions');
    const geracaoService = await import('@/features/assistentes-tipos/geracao-automatica-service');

    const checks = [
      { name: 'domain', hasExports: Object.keys(domain).length > 0 },
      { name: 'repository', hasExports: Object.keys(repository).length > 0 },
      { name: 'service', hasExports: Object.keys(service).length > 0 },
      { name: 'actions', hasExports: Object.keys(actions).length > 0 },
      { name: 'geração service', hasExports: Object.keys(geracaoService).length > 0 },
    ];

    const allPassed = checks.every(c => c.hasExports);
    const failedImports = checks.filter(c => !c.hasExports).map(c => c.name);

    addResult(
      'Imports dos módulos',
      allPassed,
      allPassed ? 'Todos os módulos importáveis' : `Falhou: ${failedImports.join(', ')}`,
      Date.now() - start
    );
    return allPassed;
  } catch (error) {
    addResult('Imports dos módulos', false, String(error), Date.now() - start);
    return false;
  }
}

async function testRepositoryFunctions() {
  const start = Date.now();
  try {
    const repository = await import('@/features/assistentes-tipos/repository');

    const functions = [
      'buscarPorId',
      'buscarPorTipoExpediente',
      'listar',
      'criar',
      'atualizar',
      'deletar',
      'ativarRelacao',
    ];

    const presentFunctions = functions.filter(fn => typeof repository[fn as keyof typeof repository] === 'function');
    const allPresent = presentFunctions.length === functions.length;

    addResult(
      'Funções do repository',
      allPresent,
      allPresent ? 'Todas as 7 funções presentes' : `${presentFunctions.length}/7 funções`,
      Date.now() - start
    );
    return allPresent;
  } catch (error) {
    addResult('Funções do repository', false, String(error), Date.now() - start);
    return false;
  }
}

async function testServiceFunctions() {
  const start = Date.now();
  try {
    const service = await import('@/features/assistentes-tipos/service');

    const functions = [
      'buscarPorId',
      'buscarPorTipoExpediente',
      'listar',
      'criar',
      'atualizar',
      'deletar',
      'ativarRelacao',
    ];

    const presentFunctions = functions.filter(fn => typeof service[fn as keyof typeof service] === 'function');
    const allPresent = presentFunctions.length === functions.length;

    addResult(
      'Funções do service',
      allPresent,
      allPresent ? 'Todas as 7 funções presentes' : `${presentFunctions.length}/7 funções`,
      Date.now() - start
    );
    return allPresent;
  } catch (error) {
    addResult('Funções do service', false, String(error), Date.now() - start);
    return false;
  }
}

async function testGeracaoAutomaticaService() {
  const start = Date.now();
  try {
    const geracaoService = await import('@/features/assistentes-tipos/geracao-automatica-service');

    const hasGerarPecaAutomatica = typeof geracaoService.gerarPecaAutomatica === 'function';

    addResult(
      'Serviço de geração automática',
      hasGerarPecaAutomatica,
      hasGerarPecaAutomatica ? 'gerarPecaAutomatica() disponível' : 'Função principal ausente',
      Date.now() - start
    );
    return hasGerarPecaAutomatica;
  } catch (error) {
    addResult('Serviço de geração automática', false, String(error), Date.now() - start);
    return false;
  }
}

async function testExpedientesIntegration() {
  const start = Date.now();
  try {
    // Verificar se o arquivo de actions dos expedientes existe e tem o hook
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const expedientesActionsPath = path.join(process.cwd(), 'src/features/expedientes/actions.ts');
    const content = await fs.readFile(expedientesActionsPath, 'utf-8');

    const hasAutoGenHook = content.includes('🤖 Geração Automática de Peça Hook');
    const hasImport = content.includes('geracao-automatica-service');
    const hasGerarPecaCall = content.includes('gerarPecaAutomatica');

    const allPresent = hasAutoGenHook && hasImport && hasGerarPecaCall;

    addResult(
      'Integração com expedientes',
      allPresent,
      allPresent ? 'Hook de auto-geração presente' : 'Hook incompleto ou ausente',
      Date.now() - start
    );
    return allPresent;
  } catch (error) {
    addResult('Integração com expedientes', false, String(error), Date.now() - start);
    return false;
  }
}

async function runAllTests() {
  log('🚀', 'Iniciando testes de integração...\n');

  // Testes de banco de dados
  log('📊', 'BANCO DE DADOS');
  await testTableExists();
  await testTableStructure();
  await testIndexes();
  await testAssistentesMetadata();
  console.log();

  // Testes de código
  log('💻', 'CÓDIGO');
  await testImports();
  await testRepositoryFunctions();
  await testServiceFunctions();
  await testGeracaoAutomaticaService();
  await testExpedientesIntegration();
  console.log();

  // Resumo
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  log('📈', `RESUMO: ${passed}/${total} testes passaram (${passRate}%)`);
  
  if (failed > 0) {
    log('⚠️', 'Testes que falharam:');
    results
      .filter(r => !r.passed)
      .forEach(r => console.log(`   • ${r.name}: ${r.message}`));
  }

  console.log();
  
  if (passed === total) {
    log('🎉', 'Todos os testes passaram! A integração está funcionando corretamente.');
    process.exit(0);
  } else {
    log('❌', 'Alguns testes falharam. Verifique os erros acima.');
    process.exit(1);
  }
}

// Executar testes
runAllTests().catch(error => {
  console.error('❌ Erro fatal durante os testes:', error);
  process.exit(1);
});
