import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarTransacaoPorId, buscarLancamentosCandidatos } from '@/backend/financeiro/conciliacao-bancaria/services/persistence/conciliacao-bancaria-persistence.service';
import { buscarSugestoesConciliacao } from '@/backend/financeiro/conciliacao-bancaria/services/matching/matching-automatico.service';

interface Params {
  params: { transacaoId: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transacaoId = Number(params.transacaoId);
    if (!transacaoId) {
      return NextResponse.json({ error: 'ID inv\u00e1lido' }, { status: 400 });
    }

    const transacao = await buscarTransacaoPorId(transacaoId);
    if (!transacao) {
      return NextResponse.json({ error: 'Transa\u00e7\u00e3o n\u00e3o encontrada' }, { status: 404 });
    }

    const candidatos = await buscarLancamentosCandidatos(transacao);
    const sugestoes = buscarSugestoesConciliacao(transacao, candidatos);

    return NextResponse.json({ success: true, data: sugestoes });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro ao buscar sugest\u00f5es';
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
