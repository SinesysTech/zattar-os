import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/require-permission';
import { createDbClient } from '@/lib/supabase';

const updateEstagioSchema = z.object({
  estagio_id: z.number().int().positive(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authOrError = await requirePermission(request, 'contratos', 'editar');
  if (authOrError instanceof NextResponse) return authOrError;

  try {
    const { id } = await params;
    const contratoId = Number(id);
    if (!Number.isFinite(contratoId) || contratoId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID do contrato inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { estagio_id } = updateEstagioSchema.parse(body);

    const db = createDbClient();

    // Buscar contrato para obter segmento_id
    const { data: contrato, error: contratoError } = await db
      .from('contratos')
      .select('id, segmento_id, estagio_id')
      .eq('id', contratoId)
      .single();

    if (contratoError || !contrato) {
      return NextResponse.json(
        { success: false, error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    // Validar que o estágio pertence ao pipeline do mesmo segmento
    const { data: estagio, error: estagioError } = await db
      .from('contrato_pipeline_estagios')
      .select('id, pipeline_id, contrato_pipelines!inner(segmento_id)')
      .eq('id', estagio_id)
      .single();

    if (estagioError || !estagio) {
      return NextResponse.json(
        { success: false, error: 'Estágio não encontrado' },
        { status: 404 }
      );
    }

    const pipelineSegmentoId = (estagio.contrato_pipelines as unknown as { segmento_id: number }).segmento_id;
    if (pipelineSegmentoId !== contrato.segmento_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Estágio pertence a pipeline de outro segmento. O contrato só pode ser movido para estágios do pipeline do seu segmento.',
        },
        { status: 422 }
      );
    }

    // Atualizar estágio do contrato
    const { data: updated, error: updateError } = await db
      .from('contratos')
      .update({ estagio_id })
      .eq('id', contratoId)
      .select('id, estagio_id')
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Erro ao atualizar estágio: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.flatten() },
        { status: 400 }
      );
    }
    console.error('Erro em PATCH /api/contratos/[id]/estagio:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
