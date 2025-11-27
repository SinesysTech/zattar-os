/**
 * Script para testar tools individuais do MCP Server localmente.
 * 
 * Uso:
 * - Executar todos os testes: tsx examples/test-tools.ts
 * - Testar tool específica: tsx examples/test-tools.ts listar_clientes
 * - Testar com argumentos: tsx examples/test-tools.ts buscar_cliente 123
 * 
 * Pré-requisitos:
 * - Configuração válida em ~/.sinesys/config.json ou variáveis de ambiente
 * - Servidor Sinesys rodando e acessível
 * - Dependências instaladas (npm install no diretório mcp/)
 */

import { SinesysApiClient, loadConfig } from '../src/client/index.js';
import { allTools } from '../src/tools/index.js';

// Cliente API inicializado em nível de módulo para ser acessível por todas as funções
let apiClient: SinesysApiClient;

/**
 * Função genérica para testar uma tool específica.
 * Encontra a tool pelo nome, valida os argumentos com Zod, executa o handler e imprime o resultado.
 * Usa a variável de módulo `apiClient` que é inicializada em `main()`.
 */
async function testTool(toolName: string, args: any): Promise<void> {
  console.log(`\n=== Testando tool: ${toolName} ===`);
  
  // Encontra a tool no array allTools
  const tool = allTools.find(t => t.name === toolName);
  if (!tool) {
    throw new Error(`Tool '${toolName}' não encontrada`);
  }
  
  console.log(`Descrição: ${tool.description}`);
  
  try {
    // Valida os argumentos com o inputSchema (Zod)
    const validatedArgs = tool.inputSchema.parse(args);
    console.log(`Argumentos validados: ${JSON.stringify(validatedArgs, null, 2)}`);
    
    // Executa o handler da tool
    const result = await tool.handler(validatedArgs, apiClient);
    
    // Imprime o resultado formatado
    console.log(`Resultado:\n${JSON.stringify(result, null, 2)}`);
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        console.error(`Erro de validação: ${error.message}`);
      } else {
        console.error(`Erro de execução: ${error.message}`);
      }
    } else {
      console.error(`Erro de execução: ${String(error)}`);
    }
    throw error; // Re-throw para tratamento no main
  }
}

/**
 * Testa listagem de clientes com paginação.
 */
async function testListarClientes(): Promise<void> {
  await testTool('sinesys_listar_clientes', { page: 1, limit: 10 });
}

/**
 * Testa busca de cliente por ID.
 */
async function testBuscarCliente(id: number): Promise<void> {
  await testTool('sinesys_buscar_cliente', { id });
}

/**
 * Testa busca de cliente por CPF.
 */
async function testBuscarClientePorCpf(cpf: string): Promise<void> {
  await testTool('sinesys_buscar_cliente_por_cpf', { cpf });
}

/**
 * Testa busca de cliente por CNPJ.
 */
async function testBuscarClientePorCnpj(cnpj: string): Promise<void> {
  await testTool('sinesys_buscar_cliente_por_cnpj', { cnpj });
}

/**
 * Testa busca de processos de um cliente.
 */
async function testBuscarProcessosDoCliente(clienteId: number): Promise<void> {
  await testTool('sinesys_buscar_processos_do_cliente', { clienteId });
}

/**
 * Testa busca de timeline de um processo.
 */
async function testBuscarTimelineProcesso(processoId: number): Promise<void> {
  await testTool('sinesys_buscar_timeline_processo', { processoId });
}

/**
 * Testa criação de cliente PF com dados de exemplo.
 */
async function testCriarCliente(): Promise<void> {
  await testTool('sinesys_criar_cliente', {
    tipoPessoa: 'pf',
    nome: 'João Silva',
    cpf: '123.456.789-00',
    email: 'joao.silva@example.com'
  });
}

/**
 * Testa listagem de contratos.
 */
async function testListarContratos(): Promise<void> {
  await testTool('sinesys_listar_contratos', { page: 1, limit: 10 });
}

/**
 * Testa início de captura de audiências.
 */
async function testIniciarCapturaAudiencias(): Promise<void> {
  await testTool('sinesys_iniciar_captura_audiencias', {
    advogadoId: 1,
    credencialIds: [5, 6]
  });
}

/**
 * Testa consulta de status de captura.
 */
async function testConsultarStatusCaptura(captureId: number): Promise<void> {
  await testTool('sinesys_consultar_status_captura', { captureId });
}

/**
 * Testa endpoint de health check.
 */
async function testHealthCheck(): Promise<void> {
  await testTool('sinesys_health_check', {});
}

/**
 * Função principal que inicializa o cliente e executa os testes.
 */
async function main(): Promise<void> {
  try {
    // Carrega configuração e inicializa cliente API na variável de módulo
    const config = loadConfig();
    apiClient = new SinesysApiClient(config);
    console.log('Cliente API inicializado com sucesso.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Erro ao carregar configuração: ${errorMessage}`);
    console.error('Verifique se ~/.sinesys/config.json existe ou se as variáveis de ambiente estão configuradas.');
    process.exit(1);
  }
  
  // Obtém argumentos da linha de comando
  const args = process.argv.slice(2);
  const testName = args[0];
  const testArgs = args.slice(1);
  
  if (testName) {
    // Executa teste específico
    try {
      switch (testName) {
        case 'listar_clientes':
          await testListarClientes();
          break;
        case 'buscar_cliente':
          const id = parseInt(testArgs[0]);
          if (isNaN(id)) throw new Error('ID deve ser um número');
          await testBuscarCliente(id);
          break;
        case 'buscar_cliente_por_cpf':
          const cpf = testArgs[0];
          if (!cpf) throw new Error('CPF é obrigatório');
          await testBuscarClientePorCpf(cpf);
          break;
        case 'buscar_cliente_por_cnpj':
          const cnpj = testArgs[0];
          if (!cnpj) throw new Error('CNPJ é obrigatório');
          await testBuscarClientePorCnpj(cnpj);
          break;
        case 'buscar_processos_cliente':
          const clienteId = parseInt(testArgs[0]);
          if (isNaN(clienteId)) throw new Error('Cliente ID deve ser um número');
          await testBuscarProcessosDoCliente(clienteId);
          break;
        case 'buscar_timeline':
          const processoId = parseInt(testArgs[0]);
          if (isNaN(processoId)) throw new Error('Processo ID deve ser um número');
          await testBuscarTimelineProcesso(processoId);
          break;
        case 'criar_cliente':
          await testCriarCliente();
          break;
        case 'listar_contratos':
          await testListarContratos();
          break;
        case 'iniciar_captura_audiencias':
          await testIniciarCapturaAudiencias();
          break;
        case 'consultar_status_captura':
          const captureId = parseInt(testArgs[0]);
          if (isNaN(captureId)) throw new Error('Capture ID deve ser um número');
          await testConsultarStatusCaptura(captureId);
          break;
        case 'health_check':
          await testHealthCheck();
          break;
        default:
          console.error(`Teste '${testName}' não reconhecido. Testes disponíveis: listar_clientes, buscar_cliente, buscar_cliente_por_cpf, buscar_cliente_por_cnpj, buscar_processos_cliente, buscar_timeline, criar_cliente, listar_contratos, iniciar_captura_audiencias, consultar_status_captura, health_check`);
          process.exit(1);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Erro no teste '${testName}': ${errorMessage}`);
      process.exit(1);
    }
  } else {
    // Executa todos os testes em sequência
    const tests = [
      { name: 'Health Check', fn: testHealthCheck },
      { name: 'Listar Clientes', fn: testListarClientes },
      { name: 'Buscar Cliente (ID: 1)', fn: () => testBuscarCliente(1) },
      { name: 'Criar Cliente', fn: testCriarCliente },
      { name: 'Listar Contratos', fn: testListarContratos },
      { name: 'Iniciar Captura Audiências', fn: testIniciarCapturaAudiencias },
      { name: 'Consultar Status Captura (ID: 1)', fn: () => testConsultarStatusCaptura(1) },
    ];
    
    for (const test of tests) {
      try {
        await test.fn();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Erro no teste '${test.name}': ${errorMessage}`);
        // Continua para o próximo teste
      }
    }
  }
  
  console.log('\n=== Todos os testes concluídos ===');
}

// Executa a função principal
main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Erro inesperado: ${errorMessage}`);
  process.exit(1);
});