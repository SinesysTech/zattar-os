import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import { uploadToBackblaze } from '@/backend/storage/backblaze-b2.service';
import { randomUUID } from 'crypto';

/**
 * POST /api/assinatura-digital/templates/upload
 *
 * Faz upload de um arquivo PDF de template para o Backblaze B2.
 * Salva na pasta: assinatura-digital/templates/
 */
export async function POST(request: NextRequest) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'criar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    }

    // Validar tipo do arquivo
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Apenas arquivos PDF são permitidos' }, { status: 400 });
    }

    // Validar tamanho (máx 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo permitido: 10MB' }, { status: 400 });
    }

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Gerar nome único para o arquivo
    const uuid = randomUUID();
    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-');
    const key = `assinatura-digital/templates/${uuid}-${sanitizedName}`;

    // Upload para Backblaze
    const result = await uploadToBackblaze({
      buffer,
      key,
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        key: result.key,
        nome: file.name,
        tamanho: file.size,
      },
    });
  } catch (error) {
    console.error('Erro no upload de template:', error);
    const message = error instanceof Error ? error.message : 'Erro ao fazer upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
