import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/backend/auth/require-permission';
import {
  createSegmento,
  listSegmentos,
} from '@/backend/formsign-admin/services/segmentos.service';
import type { UpsertSegmentoInput } from '@/backend/types/formsign-admin/types';

const upsertSegmentoSchema = z.object({
  nome: z.string().min(1),
  slug: z.string().min(1),
  descricao: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(request, 'formsign_admin', 'listar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const ativoParam = searchParams.get('ativo');
    const search = searchParams.get('search') ?? undefined;

    const result = await listSegmentos({
      ativo: ativoParam === null ? undefined : ativoParam === 'true',
      search,
    });

    return NextResponse.json({ success: true, data: result.segmentos, total: result.total });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar segmentos';
    console.error('Erro em GET /formsign-admin/segmentos:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authOrError = await requirePermission(request, 'formsign_admin', 'criar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const body = await request.json();
    const payload = upsertSegmentoSchema.parse(body) as UpsertSegmentoInput;
    const segmento = await createSegmento(payload);
    return NextResponse.json({ success: true, data: segmento }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao criar segmento';
    console.error('Erro em POST /formsign-admin/segmentos:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
