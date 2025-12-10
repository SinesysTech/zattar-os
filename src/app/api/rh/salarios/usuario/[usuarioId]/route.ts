/**
 * API Routes para histórico de salários de um usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { checkPermission } from '@/backend/auth/authorization';
import {
  buscarSalariosDoUsuario,
  buscarSalarioVigente,
} from '@/backend/rh/salarios/services/persistence/salarios-persistence.service';

interface RouteParams {
  params: Promise<{ usuarioId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authOrError = await requirePermission(request, 'salarios', 'listar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId } = authOrError;
    const { usuarioId: usuarioIdParam } = await params;
    const alvoId = Number(usuarioIdParam);
    const podeVisualizarTodos = await checkPermission(
      usuarioId,
      'salarios',
      'visualizar_todos'
    );

    if (!podeVisualizarTodos && alvoId !== usuarioId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para visualizar salários de outros usuários' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const somenteVigente = searchParams.get('vigente') === 'true';
    const dataReferencia = searchParams.get('dataReferencia') || undefined;

    if (somenteVigente) {
      const salarioVigente = await buscarSalarioVigente(alvoId, dataReferencia);
      if (!salarioVigente) {
        return NextResponse.json({ error: 'Salário não encontrado' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: salarioVigente });
    }

    const salarios = await buscarSalariosDoUsuario(alvoId);
    return NextResponse.json({ success: true, data: { items: salarios } });
  } catch (error) {
    console.error('Erro ao buscar salários do usuário:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
