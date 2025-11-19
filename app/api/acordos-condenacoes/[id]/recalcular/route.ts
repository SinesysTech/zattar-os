// Rota de API para recalcular distribuição de valores entre parcelas

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { recalcularDistribuicao } from '@/backend/acordos-condenacoes/services/parcelas/recalcular-distribuicao.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const acordoCondenacaoId = parseInt(idStr, 10);

    const resultado = await recalcularDistribuicao(acordoCondenacaoId);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao recalcular distribuição' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        parcelasAtualizadas: resultado.parcelasAtualizadas,
      }
    });
  } catch (error) {
    console.error('Erro ao recalcular distribuição:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
