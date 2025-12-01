import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/backend/auth/require-permission';
import {
  createFormulario,
  listFormularios,
} from '@/backend/formsign-admin/services/formularios.service';
import type { UpsertFormularioInput } from '@/backend/types/formsign-admin/types';

const upsertFormularioSchema = z.object({
  nome: z.string().min(1),
  slug: z.string().min(1),
  segmento_id: z.coerce.number(),
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

export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(request, 'formsign_admin', 'listar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const segmentoId = searchParams.get('segmento_id');
    const ativoParam = searchParams.get('ativo');
    const search = searchParams.get('search') ?? undefined;

    const result = await listFormularios({
      segmento_id: segmentoId ? Number(segmentoId) : undefined,
      ativo: ativoParam === null ? undefined : ativoParam === 'true',
      search,
    });

    return NextResponse.json({ success: true, data: result.formularios, total: result.total });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar formulários';
    console.error('Erro em GET /formsign-admin/formularios:', error);
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
    const payload = upsertFormularioSchema.parse(body) as UpsertFormularioInput;
    const formulario = await createFormulario(payload);
    return NextResponse.json({ success: true, data: formulario }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao criar formulário';
    console.error('Erro em POST /formsign-admin/formularios:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
