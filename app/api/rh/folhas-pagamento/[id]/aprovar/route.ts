/**
 * API Route: Aprovar Folha de Pagamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { aprovarFolhaPagamento } from '@/backend/rh/salarios/services/folhas/aprovar-folha.service';
import { validarAprovarFolhaDTO } from '@/backend/types/financeiro/salarios.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authOrError = await requirePermission(request, 'folhas_pagamento', 'aprovar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId } = authOrError;
    const { id } = await params;
    const folhaId = Number(id);

    const body = await request.json();

    const validacao = validarAprovarFolhaDTO(body);
    if (!validacao.valido) {
      return NextResponse.json(
        { error: validacao.erros.join('. ') },
        { status: 400 }
      );
    }

    const folha = await aprovarFolhaPagamento(folhaId, body, usuarioId);

    return NextResponse.json({ success: true, data: folha });
  } catch (error) {
    console.error('Erro ao aprovar folha de pagamento:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    const status = erroMsg.includes('não encontrada') ? 404 : 400;
    return NextResponse.json({ error: erroMsg }, { status });
  }
}
