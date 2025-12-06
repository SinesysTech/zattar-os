/**
 * API Route para Obrigações por Processo
 * GET: Lista obrigações de um processo específico
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { listarObrigacoesProcesso } from '@/backend/financeiro/obrigacoes/services/obrigacoes/listar-obrigacoes.service';
import {
  isTipoObrigacaoValido,
  isStatusObrigacaoValido,
  type ListarObrigacoesParams,
  type TipoObrigacao,
  type StatusObrigacao,
} from '@/backend/types/financeiro/obrigacoes.types';

/**
 * @swagger
 * /api/financeiro/obrigacoes/processo/{processoId}:
 *   get:
 *     summary: Lista obrigações de um processo
 *     description: Retorna todas as obrigações financeiras vinculadas a um processo judicial específico
 *     tags:
 *       - Obrigações Financeiras
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: processoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do processo (acervo)
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: tipos
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [acordo_recebimento, acordo_pagamento, conta_receber, conta_pagar]
 *       - in: query
 *         name: status
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [pendente, vencida, efetivada, cancelada, estornada]
 *     responses:
 *       200:
 *         description: Lista de obrigações do processo retornada com sucesso
 *       400:
 *         description: ID do processo inválido
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ processoId: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter e validar processoId
    const resolvedParams = await params;
    const processoId = parseInt(resolvedParams.processoId, 10);
    if (isNaN(processoId) || processoId <= 0) {
      return NextResponse.json(
        { error: 'ID do processo inválido' },
        { status: 400 }
      );
    }

    // 3. Obter parâmetros da query string
    const { searchParams } = new URL(request.url);

    // Processar tipos e status
    const tiposValues = searchParams.getAll('tipos');
    const validTiposValues = tiposValues.filter(isTipoObrigacaoValido) as TipoObrigacao[];

    const statusValues = searchParams.getAll('status');
    const validStatusValues = statusValues.filter(isStatusObrigacaoValido) as StatusObrigacao[];

    const filtros: Partial<ListarObrigacoesParams> = {
      pagina: searchParams.get('pagina')
        ? parseInt(searchParams.get('pagina')!, 10)
        : undefined,
      limite: searchParams.get('limite')
        ? Math.min(parseInt(searchParams.get('limite')!, 10), 100)
        : undefined,
      tipos: validTiposValues.length > 0 ? validTiposValues : undefined,
      status: validStatusValues.length > 0 ? validStatusValues : undefined,
      dataVencimentoInicio: searchParams.get('dataVencimentoInicio') || undefined,
      dataVencimentoFim: searchParams.get('dataVencimentoFim') || undefined,
    };

    // 4. Listar obrigações do processo
    const resultado = await listarObrigacoesProcesso(processoId, filtros);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar obrigações do processo:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
