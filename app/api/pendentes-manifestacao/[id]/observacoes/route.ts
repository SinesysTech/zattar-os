import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { deletePattern, CACHE_PREFIXES } from '@/backend/utils/redis/cache-utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authOrError = await requirePermission(request, 'pendentes', 'editar_tipo_descricao');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    const { id: idParam } = await params;
    const expedienteId = parseInt(idParam, 10);
    if (isNaN(expedienteId) || expedienteId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { observacoes } = body as { observacoes: string | null };

    if (observacoes !== null && observacoes !== undefined && observacoes !== '') {
      if (typeof observacoes !== 'string') {
        return NextResponse.json({ error: 'Observações devem ser uma string' }, { status: 400 });
      }
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('pendentes_manifestacao')
      .update({ observacoes: observacoes || null, updated_at: new Date().toISOString() })
      .eq('id', expedienteId)
      .select()
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return NextResponse.json({ error: 'Expediente não encontrado' }, { status: 404 });
      }
      throw error;
    }

    try {
      await deletePattern(`${CACHE_PREFIXES.pendentes}:*`);
    } catch {}

    return NextResponse.json({ success: true, message: 'Observações atualizadas com sucesso', data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno do servidor';
    if (msg.includes('não encontrado')) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    if (msg.includes('inválido') || msg.includes('inválida')) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

