import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { listarTransacoesImportadas } from '@/backend/financeiro/conciliacao-bancaria/services/persistence/conciliacao-bancaria-persistence.service';
import type { ListarTransacoesImportadasParams } from '@/backend/types/financeiro/conciliacao-bancaria.types';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusConciliacaoValues = searchParams.getAll('statusConciliacao');

    const params: ListarTransacoesImportadasParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      contaBancariaId: searchParams.get('contaBancariaId')
        ? parseInt(searchParams.get('contaBancariaId')!, 10)
        : undefined,
      dataInicio: searchParams.get('dataInicio') || undefined,
      dataFim: searchParams.get('dataFim') || undefined,
      statusConciliacao:
        statusConciliacaoValues.length === 0
          ? undefined
          : statusConciliacaoValues.length === 1
            ? (statusConciliacaoValues[0] as any)
            : (statusConciliacaoValues as any),
      busca: searchParams.get('busca') || undefined,
      tipoTransacao: (searchParams.get('tipoTransacao') as 'credito' | 'debito' | null) || undefined,
      ordenarPor: (searchParams.get('ordenarPor') as ListarTransacoesImportadasParams['ordenarPor']) || undefined,
      ordem: (searchParams.get('ordem') as ListarTransacoesImportadasParams['ordem']) || undefined,
    };

    const data = await listarTransacoesImportadas(params);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro ao listar transa\u00e7\u00f5es';
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
