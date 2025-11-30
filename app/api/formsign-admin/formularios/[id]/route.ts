import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/backend/auth/require-permission';
import {
  deleteFormulario,
  getFormulario,
  updateFormulario,
} from '@/backend/formsign-admin/services/formularios.service';
import type { UpsertFormularioInput } from '@/backend/types/formsign-admin/types';

const updateFormularioSchema = z.object({
  nome: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  segmento_id: z.coerce.number().optional(),
  descricao: z.string().optional().nullable(),
  form_schema: z.any().optional(),
  schema_version: z.string().optional(),
  template_ids: z.array(z.string()).optional(),
  ativo: z.boolean().optional(),
  ordem: z.coerce.number().optional(),
  foto_necessaria: z.boolean().optional(),
  geolocation_necessaria: z.boolean().optional(),
  metadados_seguranca: z.string().optional(),
  criado_por: z.string().optional().nullable(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authOrError = await requirePermission(request, 'formsign_admin', 'visualizar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const formulario = await getFormulario(params.id);
    if (!formulario) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: formulario });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao obter formulário';
    console.error('Erro em GET /formsign-admin/formularios/[id]:', error);
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
    const payload = updateFormularioSchema.parse(body) as Partial<UpsertFormularioInput>;
    const formulario = await updateFormulario(params.id, payload);
    return NextResponse.json({ success: true, data: formulario });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao atualizar formulário';
    console.error('Erro em PUT /formsign-admin/formularios/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authOrError = await requirePermission(request, 'formsign_admin', 'deletar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    await deleteFormulario(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar formulário';
    console.error('Erro em DELETE /formsign-admin/formularios/[id]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
