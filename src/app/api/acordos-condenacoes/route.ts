// Rota de API para acordos e condenações
// GET: Listar acordos/condenações | POST: Criar acordo/condenação

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { criarAcordoComParcelas, type CriarAcordoComParcelasParams } from '@/backend/acordos-condenacoes/services/acordos-condenacoes/criar-acordo-condenacao.service';
import { listarAcordosCondenacoes, type ListarAcordosParams } from '@/backend/acordos-condenacoes/services/persistence/acordo-condenacao-persistence.service';

/**
 * @swagger
 * /api/acordos-condenacoes:
 *   get:
 *     summary: Lista acordos e condenações
 *     description: Retorna uma lista paginada de acordos, condenações e custas processuais com filtros opcionais
 *     tags:
 *       - Acordos e Condenações
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
 *         description: Número da página
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Quantidade de itens por página
 *       - in: query
 *         name: processoId
 *         schema:
 *           type: integer
 *         description: Filtrar por processo
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [acordo, condenacao, custas_processuais]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: direcao
 *         schema:
 *           type: string
 *           enum: [recebimento, pagamento]
 *         description: Filtrar por direção
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, pago_parcial, pago_total, atrasado]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de acordos retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria um novo acordo ou condenação
 *     description: Cadastra um novo acordo, condenação ou custas processuais com parcelas
 *     tags:
 *       - Acordos e Condenações
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
 *               - processoId
 *               - tipo
 *               - direcao
 *               - valorTotal
 *               - dataVencimentoPrimeiraParcela
 *               - numeroParcelas
 *               - formaPagamentoPadrao
 *             properties:
 *               processoId:
 *                 type: integer
 *               tipo:
 *                 type: string
 *                 enum: [acordo, condenacao, custas_processuais]
 *               direcao:
 *                 type: string
 *                 enum: [recebimento, pagamento]
 *               valorTotal:
 *                 type: number
 *               dataVencimentoPrimeiraParcela:
 *                 type: string
 *                 format: date
 *               numeroParcelas:
 *                 type: integer
 *               formaDistribuicao:
 *                 type: string
 *                 enum: [integral, dividido]
 *               percentualEscritorio:
 *                 type: number
 *                 default: 30
 *               honorariosSucumbenciaisTotal:
 *                 type: number
 *                 default: 0
 *               formaPagamentoPadrao:
 *                 type: string
 *                 enum: [transferencia_direta, deposito_judicial, deposito_recursal]
 *               intervaloEntreParcelas:
 *                 type: integer
 *                 default: 30
 *     responses:
 *       201:
 *         description: Acordo/condenação criado com sucesso
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter parâmetros da query string
    const { searchParams } = new URL(request.url);
    const params: ListarAcordosParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      processoId: searchParams.get('processoId') ? parseInt(searchParams.get('processoId')!, 10) : undefined,
      tipo: searchParams.get('tipo') as ListarAcordosParams['tipo'],
      direcao: searchParams.get('direcao') as ListarAcordosParams['direcao'],
      status: searchParams.get('status') as ListarAcordosParams['status'],
      dataInicio: searchParams.get('dataInicio') || undefined,
      dataFim: searchParams.get('dataFim') || undefined,
    };

    // 3. Listar acordos/condenações
    const resultado = await listarAcordosCondenacoes(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar acordos/condenações:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validar e parsear body da requisição
    const body = await request.json();
    const dados = body as CriarAcordoComParcelasParams;

    // Validações básicas
    if (!dados.processoId || !dados.tipo || !dados.direcao) {
      return NextResponse.json(
        { error: 'Missing required fields: processoId, tipo, direcao' },
        { status: 400 }
      );
    }

    if (!dados.valorTotal || dados.valorTotal <= 0) {
      return NextResponse.json(
        { error: 'valorTotal deve ser maior que zero' },
        { status: 400 }
      );
    }

    if (!dados.numeroParcelas || dados.numeroParcelas <= 0) {
      return NextResponse.json(
        { error: 'numeroParcelas deve ser maior que zero' },
        { status: 400 }
      );
    }

    if (!dados.formaPagamentoPadrao) {
      return NextResponse.json(
        { error: 'formaPagamentoPadrao é obrigatório' },
        { status: 400 }
      );
    }

    // Adicionar usuário que criou
    dados.createdBy = authResult.userId;

    // 3. Criar acordo/condenação com parcelas
    const resultado = await criarAcordoComParcelas(dados);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao criar acordo/condenação' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          acordo: resultado.acordo,
          parcelas: resultado.parcelas,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar acordo/condenação:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}
