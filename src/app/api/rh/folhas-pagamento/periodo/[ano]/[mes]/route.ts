/**
 * API Route: Buscar folha por período (ano/mês)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { checkPermission } from '@/backend/auth/authorization';
import {
  buscarFolhaPorPeriodo,
} from '@/backend/rh/salarios/services/persistence/folhas-pagamento-persistence.service';
import type { FolhaPagamentoComDetalhes } from '@/backend/types/financeiro/salarios.types';

interface RouteParams {
  params: Promise<{ ano: string; mes: string }>;
}

const filtrarFolha = (
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
    const { ano, mes } = await params;
    const anoInt = Number(ano);
    const mesInt = Number(mes);

    const folha = await buscarFolhaPorPeriodo(mesInt, anoInt);
    if (!folha) {
      return NextResponse.json({ error: 'Folha não encontrada' }, { status: 404 });
    }

    const podeVisualizarTodos = await checkPermission(
      usuarioId,
      'folhas_pagamento',
      'visualizar_todos'
    );
    if (!podeVisualizarTodos) {
      const folhaFiltrada = filtrarFolha(folha, usuarioId);
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
    console.error('Erro ao buscar folha do período:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
