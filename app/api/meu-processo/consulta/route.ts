/**
 * API Route: Consulta de dados do cliente por CPF
 * 
 * Endpoint para o app "Meu Processo" consumir dados do Sinesys.
 * Mantém compatibilidade com o formato legado do webhook N8N.
 * 
 * @endpoint POST /api/meu-processo/consulta
 * @authentication Service API Key (via header x-service-api-key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sinesysClient } from '@/lib/services/sinesys-client';
import { transformDadosClienteParaLegacy } from '@/lib/transformers/meu-processo-transformers';
import { SinesysAPIError } from '@/lib/types/meu-processo-types';

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

// Tempo máximo de execução (30s)
export const maxDuration = 30;

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

    const { cpf } = body;

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

    // Buscar dados no Sinesys
    console.log(`[Meu Processo] Buscando dados para CPF: ${cpf.replace(/\d(?=\d{4})/g, '*')}`);

    const dadosSinesys = await sinesysClient.buscarDadosClientePorCpf(cpf);

    // Buscar acordos se houver processos
    let acordos;
    if ('success' in dadosSinesys.processos && dadosSinesys.processos.success) {
      try {
        acordos = await sinesysClient.buscarAcordosDoCliente(cpf);
      } catch (error) {
        console.warn('[Meu Processo] Erro ao buscar acordos:', error);
        // Continuar sem acordos ao invés de falhar
        acordos = { success: false, error: 'Acordos não disponíveis' };
      }
    }

    // Transformar para formato legado
    const dadosLegacy = transformDadosClienteParaLegacy({
      ...dadosSinesys,
      acordos,
    });

    console.log(`[Meu Processo] Dados encontrados - Processos: ${dadosLegacy.processos.length}, Audiências: ${dadosLegacy.audiencias.length}`);

    return NextResponse.json(dadosLegacy, {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache de 5 minutos
      },
    });

  } catch (error) {
    console.error('[Meu Processo] Erro ao consultar:', error);

    // Tratamento de erros específicos
    if (error instanceof SinesysAPIError) {
      const statusCode = error.statusCode || 500;
      
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          code: error.code,
        },
        { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
      );
    }

    // Erro genérico
    return NextResponse.json(
      {
        error: 'Erro ao processar consulta',
        details: (error as Error).message,
      },
      { status: 500 }
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
    example: {
      request: {
        cpf: '12345678901',
      },
    },
  });
}
