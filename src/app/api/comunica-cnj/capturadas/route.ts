/**
 * API Route para listar comunicações CNJ capturadas (do banco de dados)
 * GET: Retorna lista paginada de comunicações capturadas
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { listarComunicacoesCapturadas } from '@/core/comunica-cnj';
import type { ListarComunicacoesParams } from '@/core/comunica-cnj/domain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/comunica-cnj/capturadas:
 *   get:
 *     summary: Lista comunicações CNJ capturadas
 *     description: |
 *       Retorna lista paginada de comunicações CNJ já capturadas e armazenadas no banco de dados.
 *       Suporta filtros por número de processo, tribunal, advogado, expediente e data.
 *     tags:
 *       - Comunica CNJ
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: numeroProcesso
 *         schema:
 *           type: string
 *         description: Número do processo (sem máscara)
 *       - in: query
 *         name: siglaTribunal
 *         schema:
 *           type: string
 *         description: Sigla do tribunal (ex: TRT1)
 *       - in: query
 *         name: advogadoId
 *         schema:
 *           type: integer
 *         description: ID do advogado
 *       - in: query
 *         name: expedienteId
 *         schema:
 *           type: integer
 *         description: ID do expediente vinculado
 *       - in: query
 *         name: semExpediente
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas comunicações sem expediente vinculado
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de comunicações capturadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     comunicacoes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ComunicacaoCNJ'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter parâmetros da query string
    const { searchParams } = new URL(request.url);

    // Função auxiliar para converter string para number ou undefined
    const parseNumber = (value: string | null): number | undefined => {
      if (value === null) return undefined;
      const num = parseInt(value, 10);
      return isNaN(num) ? undefined : num;
    };

    // Função auxiliar para converter string para boolean
    const parseBoolean = (value: string | null): boolean | undefined => {
      if (value === null) return undefined;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return undefined;
    };

    const params: ListarComunicacoesParams = {
      numeroProcesso: searchParams.get('numeroProcesso') || undefined,
      siglaTribunal: searchParams.get('siglaTribunal') || undefined,
      advogadoId: parseNumber(searchParams.get('advogadoId')),
      expedienteId: parseNumber(searchParams.get('expedienteId')),
      semExpediente: parseBoolean(searchParams.get('semExpediente')),
      page: parseNumber(searchParams.get('page')) || 1,
      limit: parseNumber(searchParams.get('limit')) || 50,
    };

    // 3. Buscar comunicações usando serviço
    console.log('[GET /api/comunica-cnj/capturadas] Buscando comunicações:', params);

    const result = await listarComunicacoesCapturadas(params);

    if (!result.success) {
      console.error('[GET /api/comunica-cnj/capturadas] Erro:', result.error);
      
      // Mapeia códigos de erro para status HTTP apropriados
      const statusCode = result.error.code === 'VALIDATION_ERROR' ? 400 : 500;
      
      return NextResponse.json(
        { error: result.error.message, details: result.error.details },
        { status: statusCode }
      );
    }

    // 4. Retornar resposta
    return NextResponse.json({
      success: true,
      data: {
        comunicacoes: result.data.data,
        pagination: result.data.pagination,
      },
    });
  } catch (error) {
    console.error('[GET /api/comunica-cnj/capturadas] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar comunicações capturadas' },
      { status: 500 }
    );
  }
}
