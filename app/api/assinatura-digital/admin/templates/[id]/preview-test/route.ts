import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { getTemplate } from '@/backend/formsign-admin/services/templates.service';
import { generatePdfFromTemplate } from '@/backend/formsign-signature/services/template-pdf.service';
import { storePdf } from '@/backend/formsign-signature/services/storage.service';
import { generateMockDataForPreview } from '@/lib/formsign/utils/mock-data-generator';
import type { TemplateCampo, ApiPreviewTestResponse } from '@/types/formsign/template.types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Autenticação
    const authOrError = await requirePermission(request, 'formsign_admin', 'visualizar');
    if (authOrError instanceof NextResponse) return authOrError;

    // Buscar template
    const template = await getTemplate(id);
    if (!template) return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 });

    // Parse e merge campos
    let campos_parsed: TemplateCampo[] = [];
    try {
      campos_parsed = typeof template.campos === 'string' ? JSON.parse(template.campos) : template.campos;
    } catch { campos_parsed = []; }
    
    const finalCampos = body.campos || campos_parsed;

    // Validar template tem conteúdo
    const hasCampos = finalCampos.length > 0;
    const hasMarkdown = template.conteudo_markdown?.trim().length > 0;
    if (!hasCampos && !hasMarkdown) {
      return NextResponse.json(
        { success: false, error: 'Template deve ter campos ou markdown para preview' },
        { status: 400 }
      );
    }

    // Gerar dados mock
    const mockData = generateMockDataForPreview(
      { ...template, campos: finalCampos },
      { segmentoId: body.segmento?.id, segmentoNome: body.segmento?.nome }
    );

    // Gerar PDF
    const templateBasico = {
      id: template.id,
      template_uuid: template.template_uuid,
      nome: template.nome,
      arquivo_original: template.arquivo_original,
      campos: JSON.stringify(finalCampos),
      conteudo_markdown: template.conteudo_markdown,
    };
    
    const pdfBuffer = await generatePdfFromTemplate(
      templateBasico,
      {
        cliente: mockData.cliente,
        segmento: mockData.segmento,
        formulario: mockData.formulario,
        protocolo: mockData.protocolo,
        ip: mockData.ip,
        user_agent: mockData.user_agent,
      },
      mockData.extras,
      mockData.images
    );

    // Armazenar PDF temporariamente
    const fileName = `preview-${id}-${Date.now()}.pdf`;
    const stored = await storePdf(pdfBuffer);
    const pdfUrl = stored.url;

    return NextResponse.json({
      success: true,
      arquivo_url: pdfUrl,
      arquivo_nome: fileName,
      is_preview: true,
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Preview-Mode': 'true',
      },
    });
  } catch (error) {
    console.error('Preview generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar preview', detalhes: error.message },
      { status: 500 }
    );
  }
}