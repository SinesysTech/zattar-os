/**
 * API Routes para Salários
 * GET: Listar salários com filtros
 * POST: Criar novo salário
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarSalarios,
  criarSalario,
  calcularTotaisSalariosAtivos,
  listarUsuariosSemSalarioVigente,
} from '@/backend/rh/salarios/services/persistence/salarios-persistence.service';
import {
  validarCriarSalarioDTO,
  type ListarSalariosParams,
} from '@/backend/types/financeiro/salarios.types';

/**
 * @swagger
 * /api/rh/salarios:
 *   get:
 *     summary: Lista salários
 *     description: Retorna uma lista paginada de salários com filtros opcionais
 *     tags:
 *       - Salários
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
 *         description: Busca textual no nome do usuário ou observações
 *       - in: query
 *         name: usuarioId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: cargoId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: vigente
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas salários vigentes na data atual
 *       - in: query
 *         name: incluirTotais
 *         schema:
 *           type: boolean
 *         description: Incluir totais de salários ativos
 *       - in: query
 *         name: incluirSemSalario
 *         schema:
 *           type: boolean
 *         description: Incluir lista de usuários sem salário vigente
 *     responses:
 *       200:
 *         description: Lista de salários retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria um novo salário
 *     description: Cadastra um novo salário para um funcionário
 *     tags:
 *       - Salários
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
 *               - usuarioId
 *               - salarioBruto
 *               - dataInicioVigencia
 *             properties:
 *               usuarioId:
 *                 type: integer
 *               cargoId:
 *                 type: integer
 *               salarioBruto:
 *                 type: number
 *               dataInicioVigencia:
 *                 type: string
 *                 format: date
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Salário criado com sucesso
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

    const params: ListarSalariosParams = {
      pagina: searchParams.get('pagina')
        ? parseInt(searchParams.get('pagina')!, 10)
        : undefined,
      limite: searchParams.get('limite')
        ? Math.min(parseInt(searchParams.get('limite')!, 10), 100)
        : undefined,
      busca: searchParams.get('busca') || undefined,
      usuarioId: searchParams.get('usuarioId')
        ? parseInt(searchParams.get('usuarioId')!, 10)
        : undefined,
      cargoId: searchParams.get('cargoId')
        ? parseInt(searchParams.get('cargoId')!, 10)
        : undefined,
      ativo:
        searchParams.get('ativo') !== null
          ? searchParams.get('ativo') === 'true'
          : undefined,
      vigente:
        searchParams.get('vigente') !== null
          ? searchParams.get('vigente') === 'true'
          : undefined,
      ordenarPor:
        (searchParams.get('ordenarPor') as
          | 'data_inicio_vigencia'
          | 'salario_bruto'
          | 'usuario'
          | 'created_at') || undefined,
      ordem: (searchParams.get('ordem') as 'asc' | 'desc') || undefined,
    };

    // 3. Listar salários
    const resultado = await listarSalarios(params);

    // 4. Incluir totais se solicitado
    const incluirTotais = searchParams.get('incluirTotais') === 'true';
    let totais;
    if (incluirTotais) {
      totais = await calcularTotaisSalariosAtivos();
    }

    // 5. Incluir usuários sem salário se solicitado
    const incluirSemSalario = searchParams.get('incluirSemSalario') === 'true';
    let usuariosSemSalario;
    if (incluirSemSalario) {
      usuariosSemSalario = await listarUsuariosSemSalarioVigente();
    }

    return NextResponse.json({
      success: true,
      data: {
        ...resultado,
        totais,
        usuariosSemSalario,
      },
    });
  } catch (error) {
    console.error('Erro ao listar salários:', error);
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
    const createdBy = authResult.usuarioId;
    if (!createdBy) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o usuário' },
        { status: 401 }
      );
    }

    // 3. Obter dados do body
    const body = await request.json();

    // 4. Validar dados
    const validacao = validarCriarSalarioDTO(body);
    if (!validacao.valido) {
      return NextResponse.json(
        {
          error: validacao.erros.join('. '),
        },
        { status: 400 }
      );
    }

    // 5. Criar salário
    const salario = await criarSalario(body, createdBy);

    return NextResponse.json(
      {
        success: true,
        data: salario,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar salário:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    // Verificar se é erro de validação
    if (
      erroMsg.includes('obrigatório') ||
      erroMsg.includes('inválido') ||
      erroMsg.includes('não encontrad') ||
      erroMsg.includes('sobreposição') ||
      erroMsg.includes('já existe')
    ) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
