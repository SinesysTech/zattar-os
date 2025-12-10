/**
 * API Routes para Contas a Receber
 * GET: Listar contas a receber com filtros
 * POST: Criar nova conta a receber
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarContasReceber,
  criarContaReceber,
  buscarResumoInadimplencia,
} from '@/backend/financeiro/contas-receber/services/persistence/contas-receber-persistence.service';
import {
  validarCriarContaReceberDTO,
  isStatusValido,
  type ListarContasReceberParams,
  type StatusContaReceber,
  type OrigemContaReceber,
} from '@/backend/types/financeiro/contas-receber.types';

/**
 * @swagger
 * /api/financeiro/contas-receber:
 *   get:
 *     summary: Lista contas a receber
 *     description: Retorna uma lista paginada de contas a receber com filtros opcionais
 *     tags:
 *       - Contas a Receber
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
 *         name: clienteId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: contratoId
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
 *         description: Incluir resumo de inadimplência
 *     responses:
 *       200:
 *         description: Lista de contas a receber retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria uma nova conta a receber
 *     description: Cadastra uma nova conta a receber no sistema
 *     tags:
 *       - Contas a Receber
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
 *               clienteId:
 *                 type: integer
 *               contratoId:
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
 *         description: Conta a receber criada com sucesso
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
    const validStatusValues = statusValues.filter(isStatusValido) as StatusContaReceber[];
    let statusParam: StatusContaReceber | StatusContaReceber[] | undefined;
    if (validStatusValues.length === 1) {
      statusParam = validStatusValues[0];
    } else if (validStatusValues.length > 1) {
      statusParam = validStatusValues;
    }

    const params: ListarContasReceberParams = {
      pagina: searchParams.get('pagina')
        ? parseInt(searchParams.get('pagina')!, 10)
        : undefined,
      limite: searchParams.get('limite')
        ? Math.min(parseInt(searchParams.get('limite')!, 10), 100) // Máximo 100
        : undefined,
      busca: searchParams.get('busca') || undefined,
      status: statusParam,
      dataVencimentoInicio: searchParams.get('dataVencimentoInicio') || undefined,
      dataVencimentoFim: searchParams.get('dataVencimentoFim') || undefined,
      dataCompetenciaInicio: searchParams.get('dataCompetenciaInicio') || undefined,
      dataCompetenciaFim: searchParams.get('dataCompetenciaFim') || undefined,
      clienteId: searchParams.get('clienteId')
        ? parseInt(searchParams.get('clienteId')!, 10)
        : undefined,
      contratoId: searchParams.get('contratoId')
        ? parseInt(searchParams.get('contratoId')!, 10)
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
      origem: (searchParams.get('origem') as OrigemContaReceber) || undefined,
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

    // 3. Listar contas a receber
    const resultado = await listarContasReceber(params);

    // 4. Incluir resumo de inadimplência se solicitado
    const incluirResumo = searchParams.get('incluirResumo') === 'true';
    let resumo;
    if (incluirResumo) {
      resumo = await buscarResumoInadimplencia();
    }

    return NextResponse.json({
      success: true,
      data: {
        ...resultado,
        resumoInadimplencia: resumo,
      },
    });
  } catch (error) {
    console.error('Erro ao listar contas a receber:', error);
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
    if (!validarCriarContaReceberDTO(body)) {
      return NextResponse.json(
        {
          error:
            'Dados inválidos. Campos obrigatórios: descricao, valor (> 0), dataVencimento, contaContabilId',
        },
        { status: 400 }
      );
    }

    // 5. Criar conta a receber
    const contaReceber = await criarContaReceber(body, usuarioId);

    return NextResponse.json(
      {
        success: true,
        data: contaReceber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar conta a receber:', error);
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
