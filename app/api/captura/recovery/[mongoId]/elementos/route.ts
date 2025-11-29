/**
 * API de Elementos de Recovery
 *
 * GET /api/captura/recovery/[mongoId]/elementos
 *
 * Retorna TODOS os elementos capturados no payload MongoDB,
 * com status de persistência de cada um no PostgreSQL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { extrairTodosElementos } from '@/backend/captura/services/recovery/recovery-analysis.service';
import { buscarLogPorMongoId } from '@/backend/captura/services/recovery/captura-recovery.service';

interface RouteParams {
  params: Promise<{
    mongoId: string;
  }>;
}

/**
 * GET /api/captura/recovery/[mongoId]/elementos
 *
 * Retorna todos os elementos (partes, endereços, representantes) do payload
 * com status de persistência.
 *
 * Query params:
 * - filtro: 'todos' | 'faltantes' | 'existentes' (default: 'todos')
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Autenticação
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: { message: 'Não autorizado', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { mongoId } = await params;

    if (!mongoId) {
      return NextResponse.json(
        { success: false, error: { message: 'mongoId é obrigatório', code: 'INVALID_PARAMS' } },
        { status: 400 }
      );
    }

    // Parâmetros de filtro
    const searchParams = request.nextUrl.searchParams;
    const filtro = searchParams.get('filtro') || 'todos';

    // Buscar informações básicas do log
    const documento = await buscarLogPorMongoId(mongoId);

    if (!documento) {
      return NextResponse.json(
        { success: false, error: { message: 'Log não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    if (!documento.payload_bruto) {
      return NextResponse.json(
        {
          success: true,
          data: {
            log: {
              mongoId,
              capturaLogId: documento.captura_log_id,
              tipoCaptura: documento.tipo_captura,
              status: documento.status,
              trt: documento.trt,
              grau: documento.grau,
              criadoEm: documento.criado_em,
            },
            payloadDisponivel: false,
            elementos: {
              partes: [],
              enderecos: [],
              representantes: [],
              totais: {
                partes: 0,
                partesExistentes: 0,
                partesFaltantes: 0,
                enderecos: 0,
                enderecosExistentes: 0,
                enderecosFaltantes: 0,
                representantes: 0,
                representantesExistentes: 0,
                representantesFaltantes: 0,
              },
            },
          },
        },
        { status: 200 }
      );
    }

    // Extrair todos os elementos
    const elementos = await extrairTodosElementos(mongoId);

    if (!elementos) {
      return NextResponse.json(
        { success: false, error: { message: 'Erro ao extrair elementos', code: 'EXTRACTION_ERROR' } },
        { status: 500 }
      );
    }

    // Aplicar filtro se necessário
    let partesFiltered = elementos.partes;
    let enderecosFiltered = elementos.enderecos;
    let representantesFiltered = elementos.representantes;

    if (filtro === 'faltantes') {
      partesFiltered = elementos.partes.filter((e) => e.statusPersistencia === 'faltando');
      enderecosFiltered = elementos.enderecos.filter((e) => e.statusPersistencia === 'faltando');
      representantesFiltered = elementos.representantes.filter((e) => e.statusPersistencia === 'faltando');
    } else if (filtro === 'existentes') {
      partesFiltered = elementos.partes.filter((e) => e.statusPersistencia === 'existente');
      enderecosFiltered = elementos.enderecos.filter((e) => e.statusPersistencia === 'existente');
      representantesFiltered = elementos.representantes.filter((e) => e.statusPersistencia === 'existente');
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          log: {
            mongoId,
            capturaLogId: documento.captura_log_id,
            tipoCaptura: documento.tipo_captura,
            status: documento.status,
            trt: documento.trt,
            grau: documento.grau,
            advogadoId: documento.advogado_id,
            criadoEm: documento.criado_em,
            erro: documento.erro,
          },
          payloadDisponivel: true,
          filtroAplicado: filtro,
          elementos: {
            partes: partesFiltered,
            enderecos: enderecosFiltered,
            representantes: representantesFiltered,
            totais: elementos.totais,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API Recovery Elementos] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Erro interno do servidor',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

