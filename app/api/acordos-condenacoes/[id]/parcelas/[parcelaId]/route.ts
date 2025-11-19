// Rota de API para atualização de parcela individual

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { atualizarParcela } from '@/backend/acordos-condenacoes/services/persistence/parcela-persistence.service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; parcelaId: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { parcelaId: parcelaIdStr } = await params;
    const parcelaId = parseInt(parcelaIdStr, 10);

    const body = await request.json();

    // Validações
    if (body.valorBrutoCreditoPrincipal !== undefined && body.valorBrutoCreditoPrincipal <= 0) {
      return NextResponse.json(
        { error: 'Valor bruto do crédito principal deve ser maior que zero' },
        { status: 400 }
      );
    }

    if (body.honorariosSucumbenciais !== undefined && body.honorariosSucumbenciais < 0) {
      return NextResponse.json(
        { error: 'Honorários sucumbenciais não podem ser negativos' },
        { status: 400 }
      );
    }

    const resultado = await atualizarParcela(parcelaId, body);

    if (!resultado) {
      return NextResponse.json(
        { error: 'Erro ao atualizar parcela' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    console.error('Erro ao atualizar parcela:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
