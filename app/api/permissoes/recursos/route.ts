/**
 * API Route: /api/permissoes/recursos
 * GET - Listar todos os recursos e operações disponíveis (matriz completa)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import {
  MATRIZ_PERMISSOES,
  obterMatrizPermissoes,
  obterTotalPermissoes,
} from '@/backend/types/permissoes/types';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matriz = obterMatrizPermissoes();
    const totalPermissoes = obterTotalPermissoes();

    return NextResponse.json(
      {
        success: true,
        data: {
          matriz,
          matrizSimples: MATRIZ_PERMISSOES,
          totalRecursos: matriz.length,
          totalPermissoes,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
