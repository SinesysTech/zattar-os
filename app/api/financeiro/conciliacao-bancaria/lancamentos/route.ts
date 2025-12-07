import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarLancamentosPorFiltro } from '@/backend/financeiro/conciliacao-bancaria/services/persistence/conciliacao-bancaria-persistence.service';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const tipo = searchParams.get('tipo') as 'receita' | 'despesa' | null;
    const contaBancariaId = searchParams.get('contaBancariaId')
      ? Number(searchParams.get('contaBancariaId'))
      : undefined;

    const data = await buscarLancamentosPorFiltro({
      busca: searchParams.get('busca') || undefined,
      dataInicio: searchParams.get('dataInicio') || undefined,
      dataFim: searchParams.get('dataFim') || undefined,
      contaBancariaId: contaBancariaId || undefined,
      tipo: tipo || undefined,
      limite: searchParams.get('limite') ? Number(searchParams.get('limite')) : undefined,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro ao buscar lan\u00e7amentos';
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
