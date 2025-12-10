/**
 * API Routes para Salário Individual
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { checkPermission } from '@/backend/auth/authorization';
import {
  buscarSalarioPorId,
  atualizarSalario,
  encerrarVigenciaSalario,
  inativarSalario,
  deletarSalario,
} from '@/backend/rh/salarios/services/persistence/salarios-persistence.service';
import { validarAtualizarSalarioDTO } from '@/backend/types/financeiro/salarios.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ensurePodeVisualizar = async (usuarioId: number, salarioUsuarioId: number) => {
  const podeVisualizarTodos = await checkPermission(
    usuarioId,
    'salarios',
    'visualizar_todos'
  );
  if (!podeVisualizarTodos && salarioUsuarioId !== usuarioId) {
    return false;
  }
  return true;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authOrError = await requirePermission(request, 'salarios', 'visualizar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId } = authOrError;
    const { id } = await params;
    const salarioId = Number(id);

    const salario = await buscarSalarioPorId(salarioId);
    if (!salario) {
      return NextResponse.json({ error: 'Salário não encontrado' }, { status: 404 });
    }

    const permitido = await ensurePodeVisualizar(usuarioId, salario.usuarioId);
    if (!permitido) {
      return NextResponse.json(
        { error: 'Você não tem permissão para visualizar este salário' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: salario });
  } catch (error) {
    console.error('Erro ao buscar salário:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authOrError = await requirePermission(request, 'salarios', 'editar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId } = authOrError;
    const { id } = await params;
    const salarioId = Number(id);

    const body = await request.json();
    const validacao = validarAtualizarSalarioDTO(body);
    if (!validacao.valido) {
      return NextResponse.json({ error: validacao.erros.join('. ') }, { status: 400 });
    }

    const salarioAtual = await buscarSalarioPorId(salarioId);
    if (!salarioAtual) {
      return NextResponse.json({ error: 'Salário não encontrado' }, { status: 404 });
    }

    const permitido = await ensurePodeVisualizar(usuarioId, salarioAtual.usuarioId);
    if (!permitido) {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar este salário' },
        { status: 403 }
      );
    }

    const salario = await atualizarSalario(salarioId, body);

    return NextResponse.json({ success: true, data: salario });
  } catch (error) {
    console.error('Erro ao atualizar salário:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    const status = erroMsg.includes('não encontrado') ? 404 : 400;
    return NextResponse.json({ error: erroMsg }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authOrError = await requirePermission(request, 'salarios', 'deletar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId } = authOrError;
    const { id } = await params;
    const salarioId = Number(id);

    const salarioAtual = await buscarSalarioPorId(salarioId);
    if (!salarioAtual) {
      return NextResponse.json({ error: 'Salário não encontrado' }, { status: 404 });
    }

    const permitido = await ensurePodeVisualizar(usuarioId, salarioAtual.usuarioId);
    if (!permitido) {
      return NextResponse.json(
        { error: 'Você não tem permissão para alterar este salário' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const modo = searchParams.get('modo') || 'encerrar';

    if (modo === 'inativar') {
      await inativarSalario(salarioId);
    } else if (modo === 'excluir') {
      await deletarSalario(salarioId);
    } else {
      const body = await request.json();
      const dataFim =
        typeof body?.dataFim === 'string' ? (body.dataFim as string) : searchParams.get('dataFim');
      if (!dataFim) {
        return NextResponse.json(
          { error: 'Data de fim da vigência é obrigatória para encerrar' },
          { status: 400 }
        );
      }
      await encerrarVigenciaSalario(salarioId, dataFim);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao encerrar/inativar salário:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    const status = erroMsg.includes('não encontrado') ? 404 : 400;
    return NextResponse.json({ error: erroMsg }, { status });
  }
}
