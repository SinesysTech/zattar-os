/**
 * API Routes para Obrigações Financeiras
 * GET: Listar obrigações consolidadas com filtros
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { listarObrigacoes } from '@/backend/financeiro/obrigacoes/services/obrigacoes/listar-obrigacoes.service';
import {
  isTipoObrigacaoValido,
  isStatusObrigacaoValido,
  type ListarObrigacoesParams,
  type TipoObrigacao,
  type StatusObrigacao,
} from '@/backend/types/financeiro/obrigacoes.types';

/**
 * @swagger
 * /api/financeiro/obrigacoes:
 *   get:
 *     summary: Lista obrigações financeiras consolidadas
 *     description: Retorna uma lista paginada de obrigações (acordos + contas a pagar/receber) com filtros opcionais
 *     tags:
 *       - Obrigações Financeiras
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
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
 *           maximum: 100
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: Busca textual na descrição
 *       - in: query
 *         name: tipos
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [acordo_recebimento, acordo_pagamento, conta_receber, conta_pagar]
 *         style: form
 *         explode: true
 *       - in: query
 *         name: status
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [pendente, vencida, efetivada, cancelada, estornada]
 *         style: form
 *         explode: true
 *       - in: query
 *         name: dataVencimentoInicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dataVencimentoFim
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: processoId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: acordoId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: apenasVencidas
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: apenasInconsistentes
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: ordenarPor
 *         schema:
 *           type: string
 *           enum: [data_vencimento, valor, descricao, status, tipo, created_at]
 *       - in: query
 *         name: ordem
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Lista de obrigações retornada com sucesso
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
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Obrigacao'
 *                     paginacao:
 *                       type: object
 *                     resumo:
 *                       type: object
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

    // Processar tipos (suporta múltiplos valores)
    const tiposValues = searchParams.getAll('tipos');
    const validTiposValues = tiposValues.filter(isTipoObrigacaoValido) as TipoObrigacao[];

    // Processar status (suporta múltiplos valores)
    const statusValues = searchParams.getAll('status');
    const validStatusValues = statusValues.filter(isStatusObrigacaoValido) as StatusObrigacao[];

    const params: ListarObrigacoesParams = {
      pagina: searchParams.get('pagina')
        ? parseInt(searchParams.get('pagina')!, 10)
        : undefined,
      limite: searchParams.get('limite')
        ? Math.min(parseInt(searchParams.get('limite')!, 10), 100) // Máximo 100
        : undefined,
      busca: searchParams.get('busca') || undefined,
      tipos: validTiposValues.length > 0 ? validTiposValues : undefined,
      status: validStatusValues.length > 0 ? validStatusValues : undefined,
      dataVencimentoInicio: searchParams.get('dataVencimentoInicio') || undefined,
      dataVencimentoFim: searchParams.get('dataVencimentoFim') || undefined,
      dataCompetenciaInicio: searchParams.get('dataCompetenciaInicio') || undefined,
      dataCompetenciaFim: searchParams.get('dataCompetenciaFim') || undefined,
      clienteId: searchParams.get('clienteId')
        ? parseInt(searchParams.get('clienteId')!, 10)
        : undefined,
      processoId: searchParams.get('processoId')
        ? parseInt(searchParams.get('processoId')!, 10)
        : undefined,
      acordoId: searchParams.get('acordoId')
        ? parseInt(searchParams.get('acordoId')!, 10)
        : undefined,
      contaContabilId: searchParams.get('contaContabilId')
        ? parseInt(searchParams.get('contaContabilId')!, 10)
        : undefined,
      centroCustoId: searchParams.get('centroCustoId')
        ? parseInt(searchParams.get('centroCustoId')!, 10)
        : undefined,
      apenasVencidas: searchParams.get('apenasVencidas') === 'true',
      apenasInconsistentes: searchParams.get('apenasInconsistentes') === 'true',
      ordenarPor: (searchParams.get('ordenarPor') as ListarObrigacoesParams['ordenarPor']) || undefined,
      ordem: (searchParams.get('ordem') as 'asc' | 'desc') || undefined,
    };

    // 3. Listar obrigações
    const resultado = await listarObrigacoes(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar obrigações:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
