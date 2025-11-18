// Rota de API para repasses pendentes

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { listarRepassesPendentes, type FiltrosRepassesPendentes } from '@/backend/acordos-condenacoes/services/persistence/repasse-persistence.service';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filtros: FiltrosRepassesPendentes = {
      statusRepasse: searchParams.get('statusRepasse') as any,
      processoId: searchParams.get('processoId')
        ? parseInt(searchParams.get('processoId')!, 10)
        : undefined,
      dataInicio: searchParams.get('dataInicio') || undefined,
      dataFim: searchParams.get('dataFim') || undefined,
      valorMinimo: searchParams.get('valorMinimo')
        ? parseFloat(searchParams.get('valorMinimo')!)
        : undefined,
      valorMaximo: searchParams.get('valorMaximo')
        ? parseFloat(searchParams.get('valorMaximo')!)
        : undefined,
    };

    const repasses = await listarRepassesPendentes(filtros);

    return NextResponse.json({ success: true, data: repasses });
  } catch (error) {
    console.error('Erro ao listar repasses pendentes:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
