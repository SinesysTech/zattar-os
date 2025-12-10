import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarTransacaoPorId } from '@/backend/financeiro/conciliacao-bancaria/services/persistence/conciliacao-bancaria-persistence.service';

interface Params {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = Number(params.id);
    if (!id) {
      return NextResponse.json({ error: 'ID inv\u00e1lido' }, { status: 400 });
    }

    const transacao = await buscarTransacaoPorId(id);

    if (!transacao) {
      return NextResponse.json({ error: 'Transa\u00e7\u00e3o n\u00e3o encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: transacao });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro ao buscar transa\u00e7\u00e3o';
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
