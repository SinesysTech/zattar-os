import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { desconciliar } from '@/backend/financeiro/conciliacao-bancaria/services/persistence/conciliacao-bancaria-persistence.service';

interface Params {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = Number(params.id);
    if (!id) {
      return NextResponse.json({ error: 'ID inv\u00e1lido' }, { status: 400 });
    }

    await desconciliar(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro ao desconciliar';
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
