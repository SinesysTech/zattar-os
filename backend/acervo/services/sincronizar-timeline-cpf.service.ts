/**
 * Serviço de sincronização lazy de timeline para processos sem timeline
 *
 * Quando um processo é retornado sem timeline pelo endpoint de CPF,
 * este serviço dispara a captura em background (fire-and-forget)
 * para que na próxima consulta a timeline já esteja disponível.
 */

// ============================================================================
// Tipos
// ============================================================================

export interface ProcessoParaSincronizar {
  processoId: string;      // id_pje do acervo (ID no PJE)
  numeroProcesso: string;
  trt: string;
  grau: string;
  advogadoId: number;
}

// ============================================================================
// Constantes
// ============================================================================

const MENSAGEM_SINCRONIZANDO =
  'A timeline deste processo está sendo sincronizada. ' +
  'Por favor, aguarde 1-2 minutos e consulte novamente.';

// ============================================================================
// Funções Públicas
// ============================================================================

/**
 * Retorna a mensagem padrão para processos em sincronização
 */
export function getMensagemSincronizando(): string {
  return MENSAGEM_SINCRONIZANDO;
}

/**
 * Dispara captura de timeline em background (fire-and-forget)
 * Não aguarda conclusão - retorna imediatamente
 *
 * Usa fetch com keepalive para garantir que a requisição seja
 * processada mesmo após a resposta principal ser enviada.
 *
 * @param processos - Lista de processos sem timeline para sincronizar
 */
export function sincronizarTimelineEmBackground(
  processos: ProcessoParaSincronizar[]
): void {
  if (processos.length === 0) {
    return;
  }

  console.log(`🔄 [SincronizarTimeline] Disparando captura para ${processos.length} processos em background`);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const serviceApiKey = process.env.SERVICE_API_KEY;

  if (!serviceApiKey) {
    console.error('❌ [SincronizarTimeline] SERVICE_API_KEY não configurada');
    return;
  }

  // Fire-and-forget: dispara todas as requisições sem aguardar
  for (const processo of processos) {
    const body = {
      trtCodigo: processo.trt,
      grau: processo.grau,
      processoId: processo.processoId,
      numeroProcesso: processo.numeroProcesso,
      advogadoId: processo.advogadoId,
      baixarDocumentos: false, // Apenas timeline, sem PDFs (mais rápido)
    };

    console.log(`  📤 [SincronizarTimeline] Disparando captura para ${processo.numeroProcesso} (${processo.trt} - ${processo.grau})`);

    // Fire-and-forget usando fetch com keepalive
    fetch(`${baseUrl}/api/captura/trt/timeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-api-key': serviceApiKey,
      },
      body: JSON.stringify(body),
      // keepalive mantém a requisição ativa mesmo se a resposta principal já foi enviada
      // Nota: keepalive tem limite de 64KB no body, mas nosso payload é pequeno
    }).catch((error) => {
      // Ignora erros - fire and forget
      // Loga apenas para debug, não bloqueia o fluxo
      console.warn(`  ⚠️ [SincronizarTimeline] Falha ao disparar captura para ${processo.numeroProcesso}:`, error.message);
    });
  }

  console.log(`✅ [SincronizarTimeline] ${processos.length} capturas disparadas em background`);
}

/**
 * Agrupa processos por advogadoId para otimizar requisições
 * (útil se no futuro quisermos fazer batch requests)
 */
export function agruparPorAdvogado(
  processos: ProcessoParaSincronizar[]
): Map<number, ProcessoParaSincronizar[]> {
  const grupos = new Map<number, ProcessoParaSincronizar[]>();

  for (const processo of processos) {
    const lista = grupos.get(processo.advogadoId) || [];
    lista.push(processo);
    grupos.set(processo.advogadoId, lista);
  }

  return grupos;
}
