// Rota de API para operações individuais de acordos/condenações
// GET: Buscar por ID | PUT: Atualizar | DELETE: Deletar

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import {
  buscarAcordoCondenacaoPorId,
  atualizarAcordoCondenacao,
  deletarAcordoCondenacao,
  type AcordoCondenacaoAtualizacaoDados,
} from '@/backend/acordos-condenacoes/services/persistence/acordo-condenacao-persistence.service';
import { listarParcelasDoAcordo } from '@/backend/acordos-condenacoes/services/persistence/parcela-persistence.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const resultado = await buscarAcordoCondenacaoPorId(id);

    if (!resultado.sucesso) {
      return NextResponse.json({ error: resultado.erro }, { status: 404 });
    }

    // Buscar parcelas
    const parcelas = await listarParcelasDoAcordo(id);

    return NextResponse.json({
      success: true,
      data: {
        ...resultado.acordo,
        parcelas,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar acordo/condenação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const body = await request.json();
    const dados = body as AcordoCondenacaoAtualizacaoDados;

    const resultado = await atualizarAcordoCondenacao(id, dados);

    if (!resultado.sucesso) {
      return NextResponse.json({ error: resultado.erro }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: resultado.acordo });
  } catch (error) {
    console.error('Erro ao atualizar acordo/condenação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const resultado = await deletarAcordoCondenacao(id);

    if (!resultado.sucesso) {
      return NextResponse.json({ error: resultado.erro }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar acordo/condenação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
