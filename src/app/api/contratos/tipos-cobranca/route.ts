/**
 * API Route: /api/contratos/tipos-cobranca
 *
 * GET  - Lista tipos de cobrança (com filtros opcionais)
 * POST - Cria um novo tipo de cobrança
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  contratoTiposCobrancaRepo,
  createContratoTipoSchema,
} from '@/features/contratos/tipos-config';

export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(request, 'contratos', 'listar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const { searchParams } = new URL(request.url);

    const ativoParam = searchParams.get('ativo');
    const search = searchParams.get('search') ?? undefined;

    const ativo =
      ativoParam === null ? undefined : ativoParam === 'true';

    const result = await contratoTiposCobrancaRepo.findAll({ ativo, search });

    if (!result.success) {
      console.error('Erro em GET /api/contratos/tipos-cobranca:', result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.data.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro ao listar tipos de cobrança';
    console.error('Erro em GET /api/contratos/tipos-cobranca:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authOrError = await requirePermission(request, 'contratos', 'criar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const body = await request.json();
    const payload = createContratoTipoSchema.parse(body);

    const result = await contratoTiposCobrancaRepo.save(payload);

    if (!result.success) {
      if (result.error.code === 'CONFLICT') {
        return NextResponse.json({ error: result.error.message }, { status: 409 });
      }
      console.error('Erro em POST /api/contratos/tipos-cobranca:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : 'Erro ao criar tipo de cobrança';
    console.error('Erro em POST /api/contratos/tipos-cobranca:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
