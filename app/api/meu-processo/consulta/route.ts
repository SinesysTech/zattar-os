/**
 * API Route: Consulta de dados do cliente por CPF
 * 
 * Endpoint para o app "Meu Processo" consumir dados do Sinesys.
 * Mantém compatibilidade com o formato legado do webhook N8N.
 * 
 * Suporta:
 * - Feature flag para toggle entre N8N e Sinesys API
 * - Fallback automático em caso de erro
 * - Métricas e logging
 * 
 * @endpoint POST /api/meu-processo/consulta
 * @authentication Service API Key (via header x-service-api-key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sinesysClient } from '@/lib/services/sinesys-client';
import { transformDadosClienteParaLegacy } from '@/lib/transformers/meu-processo-transformers';
import { SinesysAPIError } from '@/lib/types/meu-processo-types';
import {
  recordRequestMetrics,
  MeuProcessoLogger,
  Timer,
  type APISource,
} from '@/lib/services/meu-processo-metrics';

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

// Tempo máximo de execução (30s)
export const maxDuration = 30;

// Feature flag: usar API Sinesys ou webhook N8N
const USE_SINESYS_API = process.env.MEU_PROCESSO_USE_SINESYS_API === 'true';

// Configurações do webhook N8N (fallback)
const N8N_WEBHOOK_URL = process.env.MEU_PROCESSO_N8N_WEBHOOK_URL;
const N8N_WEBHOOK_USER = process.env.MEU_PROCESSO_N8N_WEBHOOK_USER;
const N8N_WEBHOOK_PASSWORD = process.env.MEU_PROCESSO_N8N_WEBHOOK_PASSWORD;

// Timeout configurável
const TIMEOUT_MS = parseInt(process.env.MEU_PROCESSO_TIMEOUT || '30000', 10);

// Cache TTL configurável
const CACHE_TTL = parseInt(process.env.MEU_PROCESSO_CACHE_TTL || '300', 10);

// =============================================================================
// WEBHOOK N8N (FALLBACK)
// =============================================================================

/**
 * Busca dados usando o webhook N8N (método legado)
 */
async function buscarDadosN8N(cpf: string): Promise<any> {
  if (!N8N_WEBHOOK_URL || !N8N_WEBHOOK_USER || !N8N_WEBHOOK_PASSWORD) {
    throw new Error('Webhook N8N não configurado');
  }

  const auth = Buffer.from(`${N8N_WEBHOOK_USER}:${N8N_WEBHOOK_PASSWORD}`).toString('base64');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({ cpf }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Webhook N8N retornou ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// =============================================================================
// VALIDAÇÃO DE CPF
// =============================================================================

/**
 * Valida formato básico do CPF
 */
function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  // Deve ter 11 dígitos
  if (cpfLimpo.length !== 11) {
    return false;
  }

  // Não pode ser sequência repetida (111.111.111-11, etc)
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }

  return true;
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  const timer = new Timer();
  const logger = new MeuProcessoLogger();
  let apiUsed: APISource = USE_SINESYS_API ? 'sinesys' : 'n8n';
  let cpf = '';

  try {
    // Verificar autenticação
    const apiKey = request.headers.get('x-service-api-key');
    const expectedKey = process.env.SERVICE_API_KEY;

    if (!apiKey || !expectedKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Autenticação inválida' },
        { status: 401 }
      );
    }

    // Parse do body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Body inválido - esperado JSON' },
        { status: 400 }
      );
    }

    const { cpf: requestCpf } = body;
    cpf = requestCpf;

    // Validações
    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF não fornecido' },
        { status: 400 }
      );
    }

    if (!validarCPF(cpf)) {
      return NextResponse.json(
        { error: 'CPF inválido - deve conter 11 dígitos numéricos' },
        { status: 400 }
      );
    }

    logger.logRequest(cpf, apiUsed, `Iniciando busca de dados via ${USE_SINESYS_API ? 'Sinesys API' : 'N8N Webhook'}`);

    let dadosLegacy;

    // Tentar buscar via API Sinesys (se habilitado)
    if (USE_SINESYS_API) {
      try {
        const dadosSinesys = await sinesysClient.buscarDadosClientePorCpf(cpf);

        // Buscar acordos se houver processos
        let acordos;
        if ('success' in dadosSinesys.processos && dadosSinesys.processos.success) {
          try {
            acordos = await sinesysClient.buscarAcordosDoCliente(cpf);
          } catch (error) {
            logger.warn('Erro ao buscar acordos, continuando sem eles', { error });
            acordos = { success: false, error: 'Acordos não disponíveis' };
          }
        }

        // Transformar para formato legado
        dadosLegacy = transformDadosClienteParaLegacy({
          ...dadosSinesys,
          acordos,
        });

      } catch (error) {
        logger.error(`Erro na API Sinesys, tentando fallback N8N`, { error });
        
        // Fallback para N8N
        try {
          apiUsed = 'fallback';
          dadosLegacy = await buscarDadosN8N(cpf);
        } catch (n8nError) {
          logger.error('Fallback N8N também falhou', { n8nError });
          throw error; // Retornar erro original da API Sinesys
        }
      }
    } else {
      // Usar N8N diretamente
      dadosLegacy = await buscarDadosN8N(cpf);
    }

    const elapsedTime = timer.stop();
    
    // Registrar métricas de sucesso
    recordRequestMetrics({
      cpf_masked: cpf.replace(/\d(?=\d{4})/g, '*'),
      api_source: apiUsed,
      duration_ms: elapsedTime,
      success: true,
      data_counts: {
        processos: dadosLegacy.processos?.length || 0,
        audiencias: dadosLegacy.audiencias?.length || 0,
        contratos: Array.isArray(dadosLegacy.contratos) ? dadosLegacy.contratos.length : 0,
        acordos: dadosLegacy.acordos_condenacoes?.length || 0,
      },
    });

    logger.info(`Dados encontrados com sucesso`, {
      api_source: apiUsed,
      duration_ms: elapsedTime,
      processos: dadosLegacy.processos?.length || 0,
      audiencias: dadosLegacy.audiencias?.length || 0,
    });

    return NextResponse.json(dadosLegacy, {
      headers: {
        'Cache-Control': `private, max-age=${CACHE_TTL}`,
        'X-Response-Time': `${elapsedTime}ms`,
        'X-API-Source': apiUsed,
      },
    });

  } catch (error) {
    const elapsedTime = timer.stop();
    
    // Determinar tipo de erro
    let errorType = 'unknown_error';
    if (error instanceof SinesysAPIError) {
      errorType = error.code || 'sinesys_api_error';
    } else if ((error as Error).message?.includes('Webhook N8N')) {
      errorType = 'n8n_webhook_error';
    }

    // Registrar métricas de erro
    recordRequestMetrics({
      cpf_masked: cpf ? cpf.replace(/\d(?=\d{4})/g, '*') : 'unknown',
      api_source: apiUsed,
      duration_ms: elapsedTime,
      success: false,
      error_type: errorType,
      error_message: (error as Error).message,
    });

    logger.logError(error as Error, {
      api_source: apiUsed,
      duration_ms: elapsedTime,
    });

    // Tratamento de erros específicos
    if (error instanceof SinesysAPIError) {
      const statusCode = error.statusCode || 500;
      
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          code: error.code,
        },
        { 
          status: statusCode >= 400 && statusCode < 600 ? statusCode : 500,
          headers: {
            'X-Response-Time': `${elapsedTime}ms`,
            'X-API-Source': apiUsed,
          },
        }
      );
    }

    // Erro genérico
    return NextResponse.json(
      {
        error: 'Erro ao processar consulta',
        details: (error as Error).message,
      },
      { 
        status: 500,
        headers: {
          'X-Response-Time': `${timer.elapsed()}ms`,
          'X-API-Source': apiUsed,
        },
      }
    );
  }
}

// =============================================================================
// SUPORTE A GET (Documentação)
// =============================================================================

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/meu-processo/consulta',
    method: 'POST',
    description: 'Consulta dados do cliente por CPF para o app Meu Processo',
    configuration: {
      api_source: USE_SINESYS_API ? 'Sinesys API' : 'N8N Webhook',
      fallback_enabled: USE_SINESYS_API && !!N8N_WEBHOOK_URL,
      timeout_ms: TIMEOUT_MS,
      cache_ttl_seconds: CACHE_TTL,
    },
    authentication: {
      type: 'Service API Key',
      header: 'x-service-api-key',
    },
    request: {
      body: {
        cpf: 'string (11 dígitos numéricos)',
      },
    },
    response: {
      contratos: 'LegacyContrato[] | string',
      processos: 'LegacyProcessoItem[]',
      audiencias: 'LegacyAudiencia[]',
      acordos_condenacoes: 'LegacyPagamento[]',
      message: 'string (opcional)',
    },
    headers: {
      'X-Response-Time': 'Tempo de resposta em ms',
      'X-API-Source': 'Fonte dos dados (sinesys | n8n | fallback)',
    },
    example: {
      request: {
        cpf: '12345678901',
      },
    },
  });
}
