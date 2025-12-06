/**
 * API Routes para Salários de um Usuário
 * GET: Buscar salários de um usuário (histórico ou vigente)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarSalariosDoUsuario,
  buscarSalarioVigente,
} from '@/backend/rh/salarios/services/persistence/salarios-persistence.service';

interface RouteParams {
  params: Promise<{ usuarioId: string }>;
}

/**
 * @swagger
 * /api/rh/salarios/usuario/{usuarioId}:
 *   get:
 *     summary: Busca salários de um usuário
 *     description: Retorna o histórico completo ou o salário vigente de um usuário
 *     tags:
 *       - Salários
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: vigente
 *         schema:
 *           type: boolean
 *         description: Se true, retorna apenas o salário vigente atual
 *       - in: query
 *         name: dataReferencia
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de referência para buscar salário vigente (default=hoje)
 *     responses:
 *       200:
 *         description: Salário(s) encontrado(s)
 *       404:
 *         description: Usuário não tem salário vigente
 *       401:
 *         description: Não autenticado
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { usuarioId: id } = await params;
    const usuarioId = parseInt(id, 10);

    if (isNaN(usuarioId)) {
      return NextResponse.json({ error: 'ID de usuário inválido' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const apenasVigente = searchParams.get('vigente') === 'true';
    const dataReferencia = searchParams.get('dataReferencia') || undefined;

    if (apenasVigente) {
      // Retornar apenas o salário vigente
      const salarioVigente = await buscarSalarioVigente(usuarioId, dataReferencia);

      if (!salarioVigente) {
        return NextResponse.json(
          {
            error: 'Usuário não possui salário vigente no período especificado',
            data: null
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: salarioVigente,
      });
    }

    // Retornar histórico completo
    const salarios = await buscarSalariosDoUsuario(usuarioId);

    return NextResponse.json({
      success: true,
      data: {
        items: salarios,
        total: salarios.length,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar salários do usuário:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
