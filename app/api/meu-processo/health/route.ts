/**
 * Health Check Endpoint
 * 
 * Verifica o status da API Meu Processo e suas dependências.
 * Útil para monitoramento e alertas.
 * 
 * @endpoint GET /api/meu-processo/health
 */

import { NextResponse } from 'next/server';

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const USE_SINESYS_API = process.env.MEU_PROCESSO_USE_SINESYS_API === 'true';
const N8N_WEBHOOK_URL = process.env.MEU_PROCESSO_N8N_WEBHOOK_URL;
const TIMEOUT_MS = 5000; // 5s para health check

// =============================================================================
// HELPERS
// =============================================================================

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime_ms: number;
  checks: {
    configuration: HealthStatus;
    sinesys_api?: HealthStatus;
    n8n_webhook?: HealthStatus;
  };
  metadata: {
    api_source: string;
    fallback_available: boolean;
    feature_flags: Record<string, boolean>;
  };
}

interface HealthStatus {
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration_ms?: number;
}

/**
 * Verifica se as variáveis de ambiente estão configuradas
 */
function checkConfiguration(): HealthStatus {
  const missingVars: string[] = [];

  if (!process.env.SERVICE_API_KEY) {
    missingVars.push('SERVICE_API_KEY');
  }

  if (USE_SINESYS_API) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    }
  }

  if (!USE_SINESYS_API || !N8N_WEBHOOK_URL) {
    if (!N8N_WEBHOOK_URL) missingVars.push('MEU_PROCESSO_N8N_WEBHOOK_URL');
    if (!process.env.MEU_PROCESSO_N8N_WEBHOOK_USER) {
      missingVars.push('MEU_PROCESSO_N8N_WEBHOOK_USER');
    }
    if (!process.env.MEU_PROCESSO_N8N_WEBHOOK_PASSWORD) {
      missingVars.push('MEU_PROCESSO_N8N_WEBHOOK_PASSWORD');
    }
  }

  if (missingVars.length > 0) {
    return {
      status: 'fail',
      message: `Variáveis faltando: ${missingVars.join(', ')}`,
    };
  }

  return {
    status: 'pass',
    message: 'Todas as variáveis configuradas',
  };
}

/**
 * Verifica conectividade com a API Sinesys
 */
async function checkSinesysAPI(): Promise<HealthStatus> {
  const startTime = Date.now();

  try {
    // Tentar fazer uma chamada simples - CPF inválido retorna erro mas confirma conectividade
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      return {
        status: 'pass',
        message: 'API Sinesys acessível',
        duration_ms: duration,
      };
    }

    return {
      status: 'warn',
      message: `API retornou ${response.status}`,
      duration_ms: duration,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      status: 'fail',
      message: `Erro: ${(error as Error).message}`,
      duration_ms: duration,
    };
  }
}

/**
 * Verifica conectividade com o webhook N8N
 */
async function checkN8NWebhook(): Promise<HealthStatus> {
  if (!N8N_WEBHOOK_URL) {
    return {
      status: 'warn',
      message: 'Webhook N8N não configurado',
    };
  }

  const startTime = Date.now();

  try {
    const auth = Buffer.from(
      `${process.env.MEU_PROCESSO_N8N_WEBHOOK_USER}:${process.env.MEU_PROCESSO_N8N_WEBHOOK_PASSWORD}`
    ).toString('base64');

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({ cpf: '00000000000' }), // CPF inválido para teste
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const duration = Date.now() - startTime;

    // N8N pode retornar 400 para CPF inválido, mas isso confirma conectividade
    if (response.ok || response.status === 400) {
      return {
        status: 'pass',
        message: 'Webhook N8N acessível',
        duration_ms: duration,
      };
    }

    return {
      status: 'warn',
      message: `Webhook retornou ${response.status}`,
      duration_ms: duration,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      status: 'fail',
      message: `Erro: ${(error as Error).message}`,
      duration_ms: duration,
    };
  }
}

// =============================================================================
// HANDLER
// =============================================================================

export async function GET() {
  const startTime = Date.now();

  try {
    // Verificar configuração
    const configCheck = checkConfiguration();

    // Verificar dependências
    const checks: HealthCheckResult['checks'] = {
      configuration: configCheck,
    };

    // Verificar API Sinesys se habilitada
    if (USE_SINESYS_API) {
      checks.sinesys_api = await checkSinesysAPI();
    }

    // Verificar N8N se configurado (para fallback)
    if (N8N_WEBHOOK_URL) {
      checks.n8n_webhook = await checkN8NWebhook();
    }

    // Determinar status geral
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Crítico: configuração deve estar ok
    if (configCheck.status === 'fail') {
      overallStatus = 'unhealthy';
    }

    // Crítico: API primária deve estar ok
    if (USE_SINESYS_API && checks.sinesys_api?.status === 'fail') {
      // Se tem fallback N8N disponível, apenas degraded
      if (checks.n8n_webhook?.status === 'pass') {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'unhealthy';
      }
    }

    // Warn: degraded
    const hasWarnings = Object.values(checks).some(c => c.status === 'warn');
    if (hasWarnings && overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime_ms: Date.now() - startTime,
      checks,
      metadata: {
        api_source: USE_SINESYS_API ? 'sinesys' : 'n8n',
        fallback_available: USE_SINESYS_API && checks.n8n_webhook?.status === 'pass',
        feature_flags: {
          use_sinesys_api: USE_SINESYS_API,
        },
      },
    };

    // Status HTTP baseado no status geral
    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(result, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime_ms: Date.now() - startTime,
        error: (error as Error).message,
      },
      { status: 503 }
    );
  }
}
