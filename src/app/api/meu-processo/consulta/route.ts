/**
 * API Route: Consulta de dados do cliente por CPF
 * 
 * Endpoint para o app "Meu Processo" consumir dados do Sinesys.
 * Retorna dados nativos da API Sinesys sem transformações.
 * 
 * @endpoint POST /api/meu-processo/consulta
 * @authentication Service API Key (via header x-service-api-key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sinesysClient } from '@/lib/services/sinesys-client';
import {
  MeuProcessoLogger,
  Timer,
} from '@/lib/services/meu-processo-metrics';

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

// Tempo máximo de execução (30s)
export const maxDuration = 30;

// Timeout configurável
const TIMEOUT_MS = parseInt(process.env.MEU_PROCESSO_TIMEOUT || '30000', 10);

// Cache TTL configurável (5 minutos)
const CACHE_TTL = parseInt(process.env.MEU_PROCESSO_CACHE_TTL || '300', 10);

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

    logger.logRequest(cpf, 'sinesys', 'Iniciando busca de dados via Sinesys API');

    // Buscar dados via API Sinesys
    const dados = await sinesysClient.buscarDadosClientePorCpf(cpf);

    // Buscar acordos se houver processos
    let acordos = null;
    if ('success' in dados.processos && dados.processos.success) {
      try {
        acordos = await sinesysClient.buscarAcordosDoCliente(cpf);
      } catch (error) {
        logger.warn('Erro ao buscar acordos, continuando sem eles', { error });
      }
    }

    const elapsedTime = timer.stop();

    logger.info('Dados encontrados com sucesso', {
      cpf_masked: cpf.replace(/\d(?=\d{4})/g, '*'),
      duration_ms: elapsedTime,
    });

    // Retornar dados nativos do Sinesys
    return NextResponse.json(
      {
        ...dados,
        acordos,
      },
      {
        headers: {
          'Cache-Control': `private, max-age=${CACHE_TTL}`,
          'X-Response-Time': `${elapsedTime}ms`,
          'X-API-Source': 'sinesys',
        },
      }
    );

  } catch (error) {
    const elapsedTime = timer.stop();

    logger.logError(error as Error, {
      cpf_masked: cpf ? cpf.replace(/\d(?=\d{4})/g, '*') : 'unknown',
      duration_ms: elapsedTime,
    });

    // Erro genérico
    return NextResponse.json(
      {
        error: 'Erro ao processar consulta',
        details: (error as Error).message,
      },
      { 
        status: 500,
        headers: {
          'X-Response-Time': `${elapsedTime}ms`,
          'X-API-Source': 'sinesys',
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
      api_source: 'Sinesys API',
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
      processos: 'Resposta nativa da API Sinesys',
      audiencias: 'Resposta nativa da API Sinesys',
      contratos: 'Resposta nativa da API Sinesys',
      acordos: 'Resposta nativa da API Sinesys',
    },
    headers: {
      'X-Response-Time': 'Tempo de resposta em ms',
      'X-API-Source': 'Sempre "sinesys"',
    },
    example: {
      request: {
        cpf: '12345678901',
      },
    },
  });
}
