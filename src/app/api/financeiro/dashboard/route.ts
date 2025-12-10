import { NextRequest, NextResponse } from 'next/server';
import { requireAuthentication } from '@/backend/auth/require-permission';
import { getDashboardFinanceiro } from '@/backend/financeiro/dashboard/services/dashboard/dashboard-financeiro.service';

export async function GET(request: NextRequest) {
  const authOrError = await requireAuthentication(request);
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  const data = await getDashboardFinanceiro(authOrError.usuarioId);
  return NextResponse.json({ success: true, data });
}
