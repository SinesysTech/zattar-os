/**
 * API Routes para Folhas de Pagamento
 * GET: Listar folhas de pagamento com filtros
 * POST: Gerar nova folha de pagamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarFolhasPagamento,
  calcularTotaisPorStatus,
} from '@/backend/rh/salarios/services/persistence/folhas-pagamento-persistence.service';
import { gerarFolhaPagamento, previewGerarFolha } from '@/backend/rh/salarios/services/folhas/gerar-folha.service';
import {
  validarGerarFolhaDTO,
  isStatusFolhaValido,
  type ListarFolhasParams,
  type StatusFolhaPagamento,
} from '@/backend/types/financeiro/salarios.types';

/**
 * @swagger
 * /api/rh/folhas-pagamento:
 *   get:
 *     summary: Lista folhas de pagamento
 *     description: Retorna uma lista paginada de folhas de pagamento com filtros opcionais
 *     tags:
 *       - Folhas de Pagamento
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
 *         name: mesReferencia
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: anoReferencia
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [rascunho, aprovada, paga, cancelada]
 *       - in: query
 *         name: incluirTotais
 *         schema:
 *           type: boolean
 *         description: Incluir totais por status
 *     responses:
 *       200:
 *         description: Lista de folhas retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Gera uma nova folha de pagamento
 *     description: Cria uma nova folha de pagamento para o período especificado
 *     tags:
 *       - Folhas de Pagamento
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
 *               - mesReferencia
 *               - anoReferencia
 *             properties:
 *               mesReferencia:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               anoReferencia:
 *                 type: integer
 *               dataPagamento:
 *                 type: string
 *                 format: date
 *               observacoes:
 *                 type: string
 *               preview:
 *                 type: boolean
 *                 description: Se true, retorna apenas preview sem criar a folha
 *     responses:
 *       201:
 *         description: Folha criada com sucesso
 *       200:
 *         description: Preview da folha (quando preview=true)
 *       400:
 *         description: Dados inválidos ou já existe folha para o período
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
    const validStatusValues = statusValues.filter(isStatusFolhaValido) as StatusFolhaPagamento[];
    let statusParam: StatusFolhaPagamento | StatusFolhaPagamento[] | undefined;
    if (validStatusValues.length === 1) {
      statusParam = validStatusValues[0];
    } else if (validStatusValues.length > 1) {
      statusParam = validStatusValues;
    }

    const params: ListarFolhasParams = {
      pagina: searchParams.get('pagina')
        ? parseInt(searchParams.get('pagina')!, 10)
        : undefined,
      limite: searchParams.get('limite')
        ? Math.min(parseInt(searchParams.get('limite')!, 10), 100)
        : undefined,
      mesReferencia: searchParams.get('mesReferencia')
        ? parseInt(searchParams.get('mesReferencia')!, 10)
        : undefined,
      anoReferencia: searchParams.get('anoReferencia')
        ? parseInt(searchParams.get('anoReferencia')!, 10)
        : undefined,
      status: statusParam,
      ordenarPor:
        (searchParams.get('ordenarPor') as
          | 'periodo'
          | 'valor_total'
          | 'status'
          | 'created_at') || undefined,
      ordem: (searchParams.get('ordem') as 'asc' | 'desc') || undefined,
    };

    // 3. Listar folhas de pagamento
    const resultado = await listarFolhasPagamento(params);

    // 4. Incluir totais se solicitado
    const incluirTotais = searchParams.get('incluirTotais') === 'true';
    let totais;
    if (incluirTotais) {
      totais = await calcularTotaisPorStatus();
    }

    return NextResponse.json({
      success: true,
      data: {
        ...resultado,
        totais,
      },
    });
  } catch (error) {
    console.error('Erro ao listar folhas de pagamento:', error);
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

    // 4. Verificar se é apenas preview
    if (body.preview === true) {
      const preview = await previewGerarFolha(body.mesReferencia, body.anoReferencia);
      return NextResponse.json({
        success: true,
        data: preview,
        preview: true,
      });
    }

    // 5. Validar dados
    const validacao = validarGerarFolhaDTO(body);
    if (!validacao.valido) {
      return NextResponse.json(
        {
          error: validacao.erros.join('. '),
        },
        { status: 400 }
      );
    }

    // 6. Gerar folha de pagamento
    const folha = await gerarFolhaPagamento(body, usuarioId);

    return NextResponse.json(
      {
        success: true,
        data: folha,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao gerar folha de pagamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    // Verificar se é erro de validação
    if (
      erroMsg.includes('obrigatório') ||
      erroMsg.includes('inválid') ||
      erroMsg.includes('Já existe') ||
      erroMsg.includes('Não há') ||
      erroMsg.includes('período futuro')
    ) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
