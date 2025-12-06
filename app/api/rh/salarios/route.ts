/**
 * API Routes para Salários
 * GET: Listar salários com filtros
 * POST: Criar novo salário
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { checkPermission } from '@/backend/auth/authorization';
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
 *     tags:
 *       - Salários
 *   post:
 *     summary: Cria um novo salário
 *     tags:
 *       - Salários
 */
export async function GET(request: NextRequest) {
  try {
    const authOrError = await requirePermission(request, 'salarios', 'listar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId } = authOrError;
    const podeVisualizarTodos = await checkPermission(
      usuarioId,
      'salarios',
      'visualizar_todos'
    );

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

    if (!podeVisualizarTodos) {
      params.usuarioId = usuarioId;
    }

    const resultado = await listarSalarios(params);

    const incluirTotais =
      podeVisualizarTodos && searchParams.get('incluirTotais') === 'true';
    let totais;
    if (incluirTotais) {
      totais = await calcularTotaisSalariosAtivos();
    }

    const incluirSemSalario =
      podeVisualizarTodos && searchParams.get('incluirSemSalario') === 'true';
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
    const authOrError = await requirePermission(request, 'salarios', 'criar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const createdBy = authOrError.usuarioId;
    if (!createdBy) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o usuário' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const validacao = validarCriarSalarioDTO(body);
    if (!validacao.valido) {
      return NextResponse.json(
        {
          error: validacao.erros.join('. '),
        },
        { status: 400 }
      );
    }

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

    if (
      erroMsg.includes('obrigatório') ||
      erroMsg.includes('inválido') ||
      erroMsg.includes('não encontrad') ||
      erroMsg.includes('sobreposi') ||
      erroMsg.includes('já existe')
    ) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
