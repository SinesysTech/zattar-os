/**
 * API Routes para Folhas de Pagamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { checkPermission } from '@/backend/auth/authorization';
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
  type FolhaPagamentoComDetalhes,
} from '@/backend/types/financeiro/salarios.types';

const filtrarFolhasParaUsuario = (
  folhas: FolhaPagamentoComDetalhes[],
  usuarioId: number
): FolhaPagamentoComDetalhes[] => {
  return folhas
    .map((folha) => {
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
    })
    .filter(Boolean) as FolhaPagamentoComDetalhes[];
};

export async function GET(request: NextRequest) {
  try {
    const authOrError = await requirePermission(request, 'folhas_pagamento', 'listar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId } = authOrError;
    const podeVisualizarTodos = await checkPermission(
      usuarioId,
      'folhas_pagamento',
      'visualizar_todos'
    );

    const { searchParams } = new URL(request.url);

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

    const resultado = await listarFolhasPagamento(params);

    const folhasFiltradas = podeVisualizarTodos
      ? resultado.items
      : filtrarFolhasParaUsuario(resultado.items, usuarioId);

    const incluirTotais =
      podeVisualizarTodos && searchParams.get('incluirTotais') === 'true';
    let totais;
    if (incluirTotais) {
      totais = await calcularTotaisPorStatus();
    }

    return NextResponse.json({
      success: true,
      data: {
        items: folhasFiltradas,
        paginacao: podeVisualizarTodos
          ? resultado.paginacao
          : {
              pagina: 1,
              limite: folhasFiltradas.length,
              total: folhasFiltradas.length,
              totalPaginas: 1,
            },
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
    const authOrError = await requirePermission(request, 'folhas_pagamento', 'criar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const usuarioId = authOrError.usuarioId;
    if (!usuarioId) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o usuário' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const validacao = validarGerarFolhaDTO(body);
    if (!validacao.valido) {
      return NextResponse.json(
        {
          error: validacao.erros.join('. '),
        },
        { status: 400 }
      );
    }

    const preview = body.preview === true;

    if (preview) {
      const resultado = await previewGerarFolha(body);
      return NextResponse.json({ success: true, data: resultado });
    }

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

    if (
      erroMsg.includes('obrigatório') ||
      erroMsg.includes('inválido') ||
      erroMsg.includes('já existe') ||
      erroMsg.includes('duplicada')
    ) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
