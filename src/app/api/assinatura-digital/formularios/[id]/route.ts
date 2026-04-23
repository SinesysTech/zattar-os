import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  deleteFormulario,
  getFormulario,
  updateFormulario,
} from '@/shared/assinatura-digital/services/formularios.service';
import {
  updateFormularioSchema,
  type UpsertFormularioInput,
} from '@/shared/assinatura-digital';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'visualizar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const { id } = await params;
    const formulario = await getFormulario(id);
    if (!formulario) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: formulario });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao obter formulário';
    console.error('Erro em GET /assinatura-digital/formularios/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'editar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const payload = updateFormularioSchema.parse(body) as Partial<UpsertFormularioInput>;
    const formulario = await updateFormulario(id, payload);
    return NextResponse.json({ success: true, data: formulario });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao atualizar formulário';
    console.error('Erro em PUT /assinatura-digital/formularios/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'deletar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const { id } = await params;
    await deleteFormulario(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar formulário';
    console.error('Erro em DELETE /assinatura-digital/formularios/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}