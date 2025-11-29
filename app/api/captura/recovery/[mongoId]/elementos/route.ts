/**
 * API de Elementos de Recovery
 *
 * GET /api/captura/recovery/[mongoId]/elementos
 *
 * Retorna TODOS os elementos capturados no payload MongoDB,
 * com status de persistência de cada um no PostgreSQL.
 *
 * IMPORTANTE: A estrutura de elementos varia conforme o tipo de captura:
 * - partes: partes, endereços, representantes (suporta re-persistência)
 * - pendentes: processos pendentes (apenas visualização)
 * - audiencias: audiências (apenas visualização)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  extrairTodosElementos,
  extrairElementosPorTipo,
} from '@/backend/captura/services/recovery/recovery-analysis.service';
import { buscarLogPorMongoId } from '@/backend/captura/services/recovery/captura-recovery.service';

interface RouteParams {
  params: Promise<{
    mongoId: string;
  }>;
}

/**
 * @swagger
 * /api/captura/recovery/{mongoId}/elementos:
 *   get:
 *     summary: Lista elementos capturados de um log de recovery
 *     description: |
 *       Retorna TODOS os elementos capturados no payload MongoDB,
 *       com status de persistência de cada um no PostgreSQL.
 *
 *       A estrutura de elementos varia conforme o tipo de captura:
 *       - **partes**: partes, endereços, representantes (suporta re-persistência)
 *       - **pendentes**: processos pendentes (apenas visualização)
 *       - **audiencias**: audiências (apenas visualização)
 *     tags:
 *       - Captura Recovery
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: mongoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do documento MongoDB (ObjectId)
 *         example: "64abc123def456789012345"
 *       - in: query
 *         name: filtro
 *         schema:
 *           type: string
 *           enum: [todos, faltantes, existentes]
 *           default: todos
 *         description: |
 *           Filtro de elementos por status de persistência:
 *           - **todos**: retorna todos os elementos
 *           - **faltantes**: apenas elementos não persistidos no PostgreSQL
 *           - **existentes**: apenas elementos já persistidos
 *       - in: query
 *         name: modo
 *         schema:
 *           type: string
 *           enum: [generico, partes]
 *           default: generico
 *         description: |
 *           Modo de retorno dos elementos:
 *           - **generico**: estrutura unificada {elementos} baseada no tipo de captura
 *           - **partes**: estrutura legada {partes, enderecos, representantes}
 *     responses:
 *       200:
 *         description: Elementos retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     log:
 *                       type: object
 *                       properties:
 *                         mongoId:
 *                           type: string
 *                         capturaLogId:
 *                           type: integer
 *                         tipoCaptura:
 *                           type: string
 *                           enum: [partes, pendentes, audiencias, acervo-geral, arquivados]
 *                         status:
 *                           type: string
 *                         trt:
 *                           type: integer
 *                         grau:
 *                           type: integer
 *                         advogadoId:
 *                           type: integer
 *                         criadoEm:
 *                           type: string
 *                           format: date-time
 *                         erro:
 *                           type: string
 *                           nullable: true
 *                     payloadDisponivel:
 *                       type: boolean
 *                     suportaRepersistencia:
 *                       type: boolean
 *                       description: Indica se os elementos podem ser re-persistidos
 *                     filtroAplicado:
 *                       type: string
 *                       enum: [todos, faltantes, existentes]
 *                     elementos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tipo:
 *                             type: string
 *                           identificador:
 *                             type: string
 *                           statusPersistencia:
 *                             type: string
 *                             enum: [existente, faltando]
 *                           dados:
 *                             type: object
 *                     totais:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         existentes:
 *                           type: integer
 *                         faltantes:
 *                           type: integer
 *                         filtrados:
 *                           type: integer
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Log não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
    const modo = searchParams.get('modo') || 'generico';

    // Buscar informações básicas do log
    const documento = await buscarLogPorMongoId(mongoId);

    if (!documento) {
      return NextResponse.json(
        { success: false, error: { message: 'Log não encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Log básico para resposta
    const logInfo = {
      mongoId,
      capturaLogId: documento.captura_log_id,
      tipoCaptura: documento.tipo_captura,
      status: documento.status,
      trt: documento.trt,
      grau: documento.grau,
      advogadoId: documento.advogado_id,
      criadoEm: documento.criado_em,
      erro: documento.erro,
    };

    if (!documento.payload_bruto) {
      // Retornar estrutura apropriada baseada no modo
      if (modo === 'partes') {
        // Modo legado: retorna estrutura separada
        return NextResponse.json(
          {
            success: true,
            data: {
              log: logInfo,
              payloadDisponivel: false,
              suportaRepersistencia: false,
              filtroAplicado: filtro,
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

      // Modo genérico: retorna array vazio
      return NextResponse.json(
        {
          success: true,
          data: {
            log: logInfo,
            payloadDisponivel: false,
            suportaRepersistencia: false,
            filtroAplicado: filtro,
            elementos: [],
            totais: { total: 0, existentes: 0, faltantes: 0, filtrados: 0 },
          },
        },
        { status: 200 }
      );
    }

    // Modo genérico: usa nova função que suporta todos os tipos de captura
    if (modo === 'generico') {
      const resultado = await extrairElementosPorTipo(mongoId);

      if (!resultado) {
        return NextResponse.json(
          { success: false, error: { message: 'Erro ao extrair elementos', code: 'EXTRACTION_ERROR' } },
          { status: 500 }
        );
      }

      // Aplicar filtro se necessário
      let elementosFiltered = resultado.elementos;

      if (filtro === 'faltantes') {
        elementosFiltered = resultado.elementos.filter((e) => e.statusPersistencia === 'faltando');
      } else if (filtro === 'existentes') {
        elementosFiltered = resultado.elementos.filter((e) => e.statusPersistencia === 'existente');
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            log: logInfo,
            payloadDisponivel: true,
            filtroAplicado: filtro,
            suportaRepersistencia: resultado.suportaRepersistencia,
            mensagem: resultado.mensagem,
            elementos: elementosFiltered,
            totais: {
              total: resultado.totais.total,
              existentes: resultado.totais.existentes,
              faltantes: resultado.totais.faltantes,
              // Contar filtrados também
              filtrados: elementosFiltered.length,
            },
          },
        },
        { status: 200 }
      );
    }

    // Modo legado (partes): usa função original que retorna estrutura separada
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
          log: logInfo,
          payloadDisponivel: true,
          filtroAplicado: filtro,
          suportaRepersistencia: documento.tipo_captura === 'partes',
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
