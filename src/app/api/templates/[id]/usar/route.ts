/**
 * API Route para usar um template
 *
 * POST /api/templates/[id]/usar - Cria documento a partir do template
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  criarDocumentoDeTemplate,
  buscarTemplateComUsuario,
  incrementarUsoTemplate,
} from '@/backend/documentos/services/persistence/templates-persistence.service';

/**
 * POST /api/templates/[id]/usar
 * Cria um novo documento a partir de um template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const template_id = parseInt(id);
    if (isNaN(template_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar se template existe e tem acesso
    const template = await buscarTemplateComUsuario(template_id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se tem acesso (público ou próprio)
    if (
      template.visibilidade === 'privado' &&
      template.criado_por !== authResult.usuario.id
    ) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Dados opcionais do body
    const body = await request.json().catch(() => ({}));

    // Criar documento a partir do template
    const documento = await criarDocumentoDeTemplate(
      template_id,
      authResult.usuario.id,
      {
        titulo: body.titulo,
        pasta_id: body.pasta_id,
      }
    );

    // Incrementar contador de uso do template
    await incrementarUsoTemplate(template_id);

    return NextResponse.json(
      { success: true, data: documento },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao usar template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
