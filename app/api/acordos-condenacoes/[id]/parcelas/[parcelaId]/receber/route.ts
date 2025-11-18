// Rota para marcar parcela como recebida/paga

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { marcarComoRecebida, marcarComoPaga } from '@/backend/acordos-condenacoes/services/parcelas/marcar-como-recebida.service';

export async function POST(
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
    const { tipo } = body; // 'recebida' ou 'paga'

    const resultado =
      tipo === 'paga'
        ? await marcarComoPaga(parcelaId)
        : await marcarComoRecebida(parcelaId);

    if (!resultado.sucesso) {
      return NextResponse.json({ error: resultado.erro }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: resultado.parcela });
  } catch (error) {
    console.error('Erro ao marcar parcela:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
