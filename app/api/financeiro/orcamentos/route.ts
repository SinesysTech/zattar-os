/**
 * API Routes para Orçamentos
 * GET: Listar orçamentos com filtros
 * POST: Criar novo orçamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarOrcamentos,
  criarOrcamento,
} from '@/backend/financeiro/orcamento/services/persistence/orcamento-persistence.service';
import {
  validarCriarOrcamentoDTO,
  isStatusValido,
  isPeriodoValido,
  type ListarOrcamentosParams,
  type StatusOrcamento,
  type PeriodoOrcamento,
} from '@/backend/types/financeiro/orcamento.types';

/**
 * @swagger
 * /api/financeiro/orcamentos:
 *   get:
 *     summary: Lista orçamentos
 *     description: Retorna uma lista paginada de orçamentos com filtros opcionais
 *     tags:
 *       - Orçamentos
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
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: Busca textual no nome e descrição
 *       - in: query
 *         name: ano
 *         schema:
 *           type: integer
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [mensal, trimestral, semestral, anual]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [rascunho, aprovado, em_execucao, encerrado]
 *     responses:
 *       200:
 *         description: Lista de orçamentos retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria um novo orçamento
 *     description: Cadastra um novo orçamento no sistema
 *     tags:
 *       - Orçamentos
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - ano
 *               - periodo
 *               - dataInicio
 *               - dataFim
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               ano:
 *                 type: integer
 *               periodo:
 *                 type: string
 *                 enum: [mensal, trimestral, semestral, anual]
 *               dataInicio:
 *                 type: string
 *                 format: date
 *               dataFim:
 *                 type: string
 *                 format: date
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Orçamento criado com sucesso
 *       400:
 *         description: Dados inválidos
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

    // Processar parâmetros de status (suporta múltiplos valores)
    const statusValues = searchParams.getAll('status');
    const validStatusValues = statusValues.filter(isStatusValido) as StatusOrcamento[];
    let statusParam: StatusOrcamento | StatusOrcamento[] | undefined;
    if (validStatusValues.length === 1) {
      statusParam = validStatusValues[0];
    } else if (validStatusValues.length > 1) {
      statusParam = validStatusValues;
    }

    const periodoParam = searchParams.get('periodo');

    const params: ListarOrcamentosParams = {
      pagina: searchParams.get('pagina')
        ? parseInt(searchParams.get('pagina')!, 10)
        : undefined,
      limite: searchParams.get('limite')
        ? Math.min(parseInt(searchParams.get('limite')!, 10), 100)
        : undefined,
      busca: searchParams.get('busca') || undefined,
      ano: searchParams.get('ano')
        ? parseInt(searchParams.get('ano')!, 10)
        : undefined,
      periodo: periodoParam && isPeriodoValido(periodoParam)
        ? (periodoParam as PeriodoOrcamento)
        : undefined,
      status: statusParam,
      ordenarPor:
        (searchParams.get('ordenarPor') as
          | 'nome'
          | 'ano'
          | 'periodo'
          | 'status'
          | 'data_inicio'
          | 'created_at') || undefined,
      ordem: (searchParams.get('ordem') as 'asc' | 'desc') || undefined,
    };

    // 3. Listar orçamentos
    const resultado = await listarOrcamentos(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar orçamentos:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter ID do usuário autenticado
    const usuarioId = authResult.usuarioId;
    if (!usuarioId) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o usuário' },
        { status: 401 }
      );
    }

    // 3. Obter dados do body
    const body = await request.json();

    // 4. Validar dados
    if (!validarCriarOrcamentoDTO(body)) {
      return NextResponse.json(
        {
          error:
            'Dados inválidos. Campos obrigatórios: nome, ano, periodo, dataInicio, dataFim. dataFim deve ser maior que dataInicio.',
        },
        { status: 400 }
      );
    }

    // 5. Criar orçamento
    const orcamento = await criarOrcamento(body, usuarioId);

    return NextResponse.json(
      {
        success: true,
        data: orcamento,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    // Verificar se é erro de validação
    if (
      erroMsg.includes('obrigatório') ||
      erroMsg.includes('inválido') ||
      erroMsg.includes('Já existe')
    ) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
