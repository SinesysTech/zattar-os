import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/backend/auth/require-permission';
import {
  deleteSegmento,
  getSegmento,
  updateSegmento,
} from '@/backend/formsign-admin/services/segmentos.service';
import type { UpsertSegmentoInput } from '@/backend/types/formsign-admin/types';

const updateSegmentoSchema = z.object({
  nome: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  descricao: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authOrError = await requirePermission(request, 'formsign_admin', 'visualizar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const segmento = await getSegmento(id);
    if (!segmento) {
      return NextResponse.json({ error: 'Segmento não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: segmento });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao obter segmento';
    console.error('Erro em GET /formsign-admin/segmentos/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authOrError = await requirePermission(request, 'formsign_admin', 'editar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const body = await request.json();
    const payload = updateSegmentoSchema.parse(body) as Partial<UpsertSegmentoInput>;
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const segmento = await updateSegmento(id, payload);
    return NextResponse.json({ success: true, data: segmento });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao atualizar segmento';
    console.error('Erro em PUT /formsign-admin/segmentos/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authOrError = await requirePermission(request, 'formsign_admin', 'deletar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await deleteSegmento(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar segmento';
    console.error('Erro em DELETE /formsign-admin/segmentos/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
