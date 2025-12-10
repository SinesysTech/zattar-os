import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { conciliarAutomaticamente } from '@/backend/financeiro/conciliacao-bancaria/services/conciliacao-bancaria/conciliar-automaticamente.service';
import { validarConciliarAutomaticaDTO } from '@/backend/types/financeiro/conciliacao-bancaria.types';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!validarConciliarAutomaticaDTO(body)) {
      return NextResponse.json({ error: 'Payload inv\u00e1lido' }, { status: 400 });
    }

    const resultados = await conciliarAutomaticamente(body);
    return NextResponse.json({ success: true, data: resultados });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro ao conciliar automaticamente';
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
