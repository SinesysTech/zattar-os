import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { getTemplate } from '@/backend/assinatura-digital/services/templates.service';

/**
 * GET /api/assinatura-digital/templates/[id]/preview
 *
 * Proxy para servir o PDF do template armazenado no Backblaze B2.
 * Evita problemas de CORS ao carregar PDFs de origem externa.
 */
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

    // Buscar template para obter a URL do PDF
    const template = await getTemplate(id);
    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    const pdfUrl = template.arquivo_original;
    if (!pdfUrl) {
      return NextResponse.json({ error: 'Template não possui PDF associado' }, { status: 404 });
    }

    // Fazer proxy da requisição ao Backblaze
    const response = await fetch(pdfUrl, {
      headers: {
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      console.error(`Erro ao buscar PDF do Backblaze: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Erro ao buscar PDF: ${response.statusText}` },
        { status: response.status }
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    // Retornar o PDF com headers apropriados
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${template.arquivo_nome || 'template.pdf'}"`,
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Erro no proxy de preview do template:', error);
    const message = error instanceof Error ? error.message : 'Erro ao carregar preview';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
