// Rota de API para recalcular distribuição de valores entre parcelas

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
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

    // Parse body to get tipoValor
    const body = await request.json();
    const tipoValor = body.tipoValor as 'credito_principal' | 'honorarios_sucumbenciais';

    if (!tipoValor || (tipoValor !== 'credito_principal' && tipoValor !== 'honorarios_sucumbenciais')) {
      return NextResponse.json(
        { error: 'Campo tipoValor é obrigatório e deve ser "credito_principal" ou "honorarios_sucumbenciais"' },
        { status: 400 }
      );
    }

    const resultado = await recalcularDistribuicao(acordoCondenacaoId, tipoValor);

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
