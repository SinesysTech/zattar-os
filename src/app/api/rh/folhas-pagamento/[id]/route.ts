/**
 * API Routes para Folha de Pagamento (detalhe)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { checkPermission } from '@/backend/auth/authorization';
import {
  buscarFolhaPorId,
  atualizarFolhaPagamento,
  deletarFolhaPagamento,
} from '@/backend/rh/salarios/services/persistence/folhas-pagamento-persistence.service';
import { cancelarFolhaPagamento } from '@/backend/rh/salarios/services/folhas/cancelar-folha.service';
import type { FolhaPagamentoComDetalhes } from '@/backend/types/financeiro/salarios.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const filtrarFolhaParaUsuario = (
  folha: FolhaPagamentoComDetalhes,
  usuarioId: number
): FolhaPagamentoComDetalhes | null => {
  const itens = (folha.itens ?? []).filter((item) => item.usuarioId === usuarioId);
  if (!itens.length) {
    return null;
  }
  const valorTotal = itens.reduce((total, item) => total + Number(item.valorBruto), 0);
  return {
    ...folha,
    itens,
    totalFuncionarios: itens.length,
    valorTotal,
  };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authOrError = await requirePermission(request, 'folhas_pagamento', 'visualizar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId } = authOrError;
    const { id } = await params;
    const folhaId = Number(id);

    const folha = await buscarFolhaPorId(folhaId);
    if (!folha) {
      return NextResponse.json({ error: 'Folha de pagamento não encontrada' }, { status: 404 });
    }

    const podeVisualizarTodos = await checkPermission(
      usuarioId,
      'folhas_pagamento',
      'visualizar_todos'
    );
    if (!podeVisualizarTodos) {
      const folhaFiltrada = filtrarFolhaParaUsuario(folha, usuarioId);
      if (!folhaFiltrada) {
        return NextResponse.json(
          { error: 'Você não tem permissão para visualizar esta folha' },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: true, data: folhaFiltrada });
    }

    return NextResponse.json({ success: true, data: folha });
  } catch (error) {
    console.error('Erro ao buscar folha de pagamento:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authOrError = await requirePermission(request, 'folhas_pagamento', 'editar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId } = authOrError;
    const { id } = await params;
    const folhaId = Number(id);

    const folhaAtual = await buscarFolhaPorId(folhaId);
    if (!folhaAtual) {
      return NextResponse.json({ error: 'Folha de pagamento não encontrada' }, { status: 404 });
    }

    const podeVisualizarTodos = await checkPermission(
      usuarioId,
      'folhas_pagamento',
      'visualizar_todos'
    );
    if (!podeVisualizarTodos) {
      const folhaFiltrada = filtrarFolhaParaUsuario(folhaAtual, usuarioId);
      if (!folhaFiltrada) {
        return NextResponse.json(
          { error: 'Você não tem permissão para editar esta folha' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const folha = await atualizarFolhaPagamento(folhaId, body);

    return NextResponse.json({ success: true, data: folha });
  } catch (error) {
    console.error('Erro ao atualizar folha de pagamento:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    const status = erroMsg.includes('não encontrado') ? 404 : 400;
    return NextResponse.json({ error: erroMsg }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const folhaId = Number(id);
    const modo = new URL(request.url).searchParams.get('modo') || 'cancelar';

    const operacao = modo === 'excluir' ? 'deletar' : 'cancelar';
    const authOrError = await requirePermission(request, 'folhas_pagamento', operacao);
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId } = authOrError;

    const folhaAtual = await buscarFolhaPorId(folhaId);
    if (!folhaAtual) {
      return NextResponse.json({ error: 'Folha de pagamento não encontrada' }, { status: 404 });
    }

    const podeVisualizarTodos = await checkPermission(
      usuarioId,
      'folhas_pagamento',
      'visualizar_todos'
    );
    if (!podeVisualizarTodos) {
      const folhaFiltrada = filtrarFolhaParaUsuario(folhaAtual, usuarioId);
      if (!folhaFiltrada) {
        return NextResponse.json(
          { error: 'Você não tem permissão para esta folha' },
          { status: 403 }
        );
      }
    }

    if (modo === 'excluir') {
      await deletarFolhaPagamento(folhaId);
    } else {
      const body = await request.json().catch(() => ({}));
      const motivo = typeof body?.motivo === 'string' ? body.motivo : undefined;
      await cancelarFolhaPagamento(folhaId, motivo, usuarioId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao cancelar/excluir folha:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    const status = erroMsg.includes('não encontrado') ? 404 : 400;
    return NextResponse.json({ error: erroMsg }, { status });
  }
}
