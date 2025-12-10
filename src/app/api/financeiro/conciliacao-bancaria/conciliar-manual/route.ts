import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { conciliarManual } from '@/backend/financeiro/conciliacao-bancaria/services/conciliacao-bancaria/conciliar-manual.service';
import { validarConciliarManualDTO } from '@/backend/types/financeiro/conciliacao-bancaria.types';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.usuarioId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!validarConciliarManualDTO(body)) {
      return NextResponse.json({ error: 'Dados inv\u00e1lidos para concilia\u00e7\u00e3o manual' }, { status: 400 });
    }

    const conciliacao = await conciliarManual(body, auth.usuarioId);
    return NextResponse.json({ success: true, data: conciliacao });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro ao conciliar manualmente';
    const status = mensagem.includes('n\u00e3o encontrada') ? 404 : 500;
    return NextResponse.json({ error: mensagem }, { status });
  }
}
