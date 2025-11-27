// workflow-captura.ts
//
// Script demonstrativo de workflow completo de captura assíncrona com polling.
// Este script mostra como iniciar uma captura de audiências, monitorar seu progresso
// e aguardar conclusão usando tanto polling manual quanto automático.
//
// Exemplos de uso:
// - Executar com dados padrão: tsx examples/workflow-captura.ts
// - Passar parâmetros: tsx examples/workflow-captura.ts 1 5 6 7
//   (advogado_id=1, credencial_ids=[5,6,7])
//
// Pré-requisitos:
// - Configuração válida em ~/.sinesys/config.json
// - Servidor Sinesys rodando e acessível
// - Credenciais PJE válidas para o advogado

import { SinesysApiClient, loadConfig } from '../src/client/index.js';
import { pollCapturaStatus } from '../src/tools/utils.js';

// Classe para gerenciar workflow de captura
class CapturaWorkflow {
  private client: SinesysApiClient;

  constructor(client: SinesysApiClient) {
    this.client = client;
  }

  // Inicia captura de audiências e retorna o capture_id
  async iniciarCapturaAudiencias(advogadoId: number, credencialIds: number[]): Promise<number> {
    console.log(`[${new Date().toISOString()}] Iniciando captura de audiências...`);
    console.log(`Advogado ID: ${advogadoId}, Credenciais: ${credencialIds.join(', ')}`);

    try {
      const response = await this.client.post('/api/captura/trt/audiencias', {
        advogado_id: advogadoId,
        credencial_ids: credencialIds,
      });

      if (response.success && response.data) {
        const captureId = response.data.capture_id;
        console.log(`[${new Date().toISOString()}] Captura iniciada com sucesso. Capture ID: ${captureId}`);
        return captureId;
      } else {
        throw new Error(response.error || 'Erro ao iniciar captura');
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro ao iniciar captura:`, error);
      throw error;
    }
  }

  // Polling manual: consulta status periodicamente até conclusão
  async aguardarConclusao(captureId: number, options: { intervalMs?: number, timeoutMs?: number } = {}): Promise<any> {
    const { intervalMs = 5000, timeoutMs = 300000 } = options;
    const startTime = Date.now();
    let polls = 0;

    console.log(`[${new Date().toISOString()}] Iniciando polling manual para capture ID ${captureId}`);
    console.log(`Intervalo: ${intervalMs}ms, Timeout: ${timeoutMs}ms`);

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        polls++;
        const elapsed = Date.now() - startTime;

        if (elapsed >= timeoutMs) {
          console.log(`[${new Date().toISOString()}] Timeout após ${elapsed}ms (${polls} polls)`);
          reject(new Error(`Timeout aguardando conclusão da captura após ${timeoutMs}ms`));
          return;
        }

        try {
          const response = await this.client.get(`/api/captura/historico/${captureId}`);
          if (!response.success) {
            throw new Error(response.error || 'Erro ao consultar status');
          }

          const status = response.data?.status;
          console.log(`[${new Date().toISOString()}] Poll ${polls}: Status = ${status}, Tempo decorrido: ${elapsed}ms`);

          if (status === 'completed') {
            console.log(`[${new Date().toISOString()}] Captura concluída com sucesso!`);
            resolve(response.data);
          } else if (status === 'failed') {
            console.log(`[${new Date().toISOString()}] Captura falhou.`);
            reject(new Error(`Captura falhou: ${response.data?.error || 'Erro desconhecido'}`));
          } else {
            // Continua polling
            setTimeout(checkStatus, intervalMs);
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Erro no poll ${polls}:`, error);
          reject(error);
        }
      };

      checkStatus();
    });
  }

  // Exibe progresso atual da captura
  async exibirProgresso(captureId: number): Promise<void> {
    try {
      const response = await this.client.get(`/api/captura/historico/${captureId}`);
      if (response.success && response.data) {
        console.log(`[${new Date().toISOString()}] Status atual da captura ${captureId}:`);
        console.log(JSON.stringify(response.data, null, 2));
      } else {
        console.error(`[${new Date().toISOString()}] Erro ao consultar progresso:`, response.error);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro ao exibir progresso:`, error);
    }
  }

  // Workflow completo: iniciar -> aguardar conclusão -> exibir resultado
  async executarWorkflowCompleto(advogadoId: number, credencialIds: number[]): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] === INICIANDO WORKFLOW COMPLETO ===`);

      // Etapa 1: Iniciar captura
      const captureId = await this.iniciarCapturaAudiencias(advogadoId, credencialIds);

      // Etapa 2: Aguardar conclusão usando polling automático (via pollCapturaStatus)
      console.log(`[${new Date().toISOString()}] Aguardando conclusão com polling automático...`);
      const result = await pollCapturaStatus(this.client, captureId, {
        intervalMs: 3000, // 3 segundos para demonstração
        timeoutMs: 120000, // 2 minutos
      });

      if (result.success && result.status === 'completed') {
        console.log(`[${new Date().toISOString()}] === WORKFLOW CONCLUÍDO COM SUCESSO ===`);
        console.log(`Resultado final:`, JSON.stringify(result.data, null, 2));
        console.log(`Total de polls: ${result.totalPolls}, Tempo total: ${result.elapsedMs}ms`);
      } else {
        console.log(`[${new Date().toISOString()}] === WORKFLOW FALHOU ===`);
        console.log(`Status: ${result.status}, Erro: ${result.error}`);
        if (result.timedOut) {
          console.log(`Timeout após ${result.elapsedMs}ms`);
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro no workflow completo:`, error);
    }
  }
}

// Função principal
async function main() {
  try {
    // Carregar configuração
    console.log(`[${new Date().toISOString()}] Carregando configuração...`);
    const config = loadConfig();
    const client = new SinesysApiClient(config);

    // Parsear argumentos da linha de comando
    const args = process.argv.slice(2);
    let advogadoId = 1; // padrão
    let credencialIds = [5, 6]; // padrão

    if (args.length >= 1) {
      advogadoId = parseInt(args[0]);
      if (isNaN(advogadoId)) {
        throw new Error('advogado_id deve ser um número');
      }
    }

    if (args.length >= 2) {
      credencialIds = args.slice(1).map(id => {
        const num = parseInt(id);
        if (isNaN(num)) {
          throw new Error('credencial_ids devem ser números');
        }
        return num;
      });
    }

    console.log(`[${new Date().toISOString()}] Usando advogado_id=${advogadoId}, credencial_ids=${credencialIds.join(',')}`);

    // Criar workflow e executar
    const workflow = new CapturaWorkflow(client);
    await workflow.executarWorkflowCompleto(advogadoId, credencialIds);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro na execução:`, error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}