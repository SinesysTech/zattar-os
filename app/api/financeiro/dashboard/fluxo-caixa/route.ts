import { NextRequest, NextResponse } from 'next/server';
import { requireAuthentication } from '@/backend/auth/require-permission';
import { getFluxoCaixaProjetadoDashboard } from '@/backend/financeiro/dashboard/services/dashboard/dashboard-financeiro.service';

export async function GET(request: NextRequest) {
  const authOrError = await requireAuthentication(request);
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  const { searchParams } = new URL(request.url);
  const meses = Number(searchParams.get('meses') || 6);
  const data = await getFluxoCaixaProjetadoDashboard(meses);

  return NextResponse.json({ success: true, data });
}
