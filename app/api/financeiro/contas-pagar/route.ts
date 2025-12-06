/**
 * API Routes para Contas a Pagar
 * GET: Listar contas a pagar com filtros
 * POST: Criar nova conta a pagar
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarContasPagar,
  criarContaPagar,
  buscarResumoVencimentos,
} from '@/backend/financeiro/contas-pagar/services/persistence/contas-pagar-persistence.service';
import {
  validarCriarContaPagarDTO,
  type ListarContasPagarParams,
  type StatusContaPagar,
  type OrigemContaPagar,
} from '@/backend/types/financeiro/contas-pagar.types';

/**
 * @swagger
 * /api/financeiro/contas-pagar:
 *   get:
 *     summary: Lista contas a pagar
 *     description: Retorna uma lista paginada de contas a pagar com filtros opcionais
 *     tags:
 *       - Contas a Pagar
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
 *         description: Busca textual na descrição, documento ou categoria
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, confirmado, cancelado, estornado]
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
 *         name: fornecedorId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *       - in: query
 *         name: incluirResumo
 *         schema:
 *           type: boolean
 *         description: Incluir resumo de vencimentos
 *     responses:
 *       200:
 *         description: Lista de contas a pagar retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria uma nova conta a pagar
 *     description: Cadastra uma nova conta a pagar no sistema
 *     tags:
 *       - Contas a Pagar
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
 *               - descricao
 *               - valor
 *               - dataVencimento
 *               - contaContabilId
 *             properties:
 *               descricao:
 *                 type: string
 *               valor:
 *                 type: number
 *               dataVencimento:
 *                 type: string
 *                 format: date
 *               contaContabilId:
 *                 type: integer
 *               fornecedorId:
 *                 type: integer
 *               categoria:
 *                 type: string
 *               recorrente:
 *                 type: boolean
 *               frequenciaRecorrencia:
 *                 type: string
 *                 enum: [mensal, trimestral, semestral, anual]
 *     responses:
 *       201:
 *         description: Conta a pagar criada com sucesso
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

    const params: ListarContasPagarParams = {
      pagina: searchParams.get('pagina')
        ? parseInt(searchParams.get('pagina')!, 10)
        : undefined,
      limite: searchParams.get('limite')
        ? Math.min(parseInt(searchParams.get('limite')!, 10), 100) // Máximo 100
        : undefined,
      busca: searchParams.get('busca') || undefined,
      status: (searchParams.get('status') as StatusContaPagar) || undefined,
      dataVencimentoInicio: searchParams.get('dataVencimentoInicio') || undefined,
      dataVencimentoFim: searchParams.get('dataVencimentoFim') || undefined,
      dataCompetenciaInicio: searchParams.get('dataCompetenciaInicio') || undefined,
      dataCompetenciaFim: searchParams.get('dataCompetenciaFim') || undefined,
      fornecedorId: searchParams.get('fornecedorId')
        ? parseInt(searchParams.get('fornecedorId')!, 10)
        : undefined,
      contaContabilId: searchParams.get('contaContabilId')
        ? parseInt(searchParams.get('contaContabilId')!, 10)
        : undefined,
      centroCustoId: searchParams.get('centroCustoId')
        ? parseInt(searchParams.get('centroCustoId')!, 10)
        : undefined,
      contaBancariaId: searchParams.get('contaBancariaId')
        ? parseInt(searchParams.get('contaBancariaId')!, 10)
        : undefined,
      categoria: searchParams.get('categoria') || undefined,
      origem: (searchParams.get('origem') as OrigemContaPagar) || undefined,
      recorrente:
        searchParams.get('recorrente') !== null
          ? searchParams.get('recorrente') === 'true'
          : undefined,
      ordenarPor:
        (searchParams.get('ordenarPor') as
          | 'data_vencimento'
          | 'valor'
          | 'descricao'
          | 'status'
          | 'created_at') || undefined,
      ordem: (searchParams.get('ordem') as 'asc' | 'desc') || undefined,
    };

    // 3. Listar contas a pagar
    const resultado = await listarContasPagar(params);

    // 4. Incluir resumo de vencimentos se solicitado
    const incluirResumo = searchParams.get('incluirResumo') === 'true';
    let resumo;
    if (incluirResumo) {
      resumo = await buscarResumoVencimentos();
    }

    return NextResponse.json({
      success: true,
      data: {
        ...resultado,
        resumoVencimentos: resumo,
      },
    });
  } catch (error) {
    console.error('Erro ao listar contas a pagar:', error);
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
    if (!validarCriarContaPagarDTO(body)) {
      return NextResponse.json(
        {
          error:
            'Dados inválidos. Campos obrigatórios: descricao, valor (> 0), dataVencimento, contaContabilId',
        },
        { status: 400 }
      );
    }

    // 5. Criar conta a pagar
    const contaPagar = await criarContaPagar(body, usuarioId);

    return NextResponse.json(
      {
        success: true,
        data: contaPagar,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar conta a pagar:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    // Verificar se é erro de validação
    if (
      erroMsg.includes('obrigatório') ||
      erroMsg.includes('inválido') ||
      erroMsg.includes('não encontrad')
    ) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
