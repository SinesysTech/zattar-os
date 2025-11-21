/**
 * API Route: POST /api/documentos/presigned-url
 * 
 * Gera uma URL assinada (presigned URL) para download de documento do Backblaze B2.
 * Permite acesso temporário a documentos em bucket privado sem expor credenciais.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUrl } from '@/backend/storage/backblaze-b2.service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { key } = body;

        if (!key || typeof key !== 'string') {
            return NextResponse.json(
                { error: 'Parâmetro "key" é obrigatório' },
                { status: 400 }
            );
        }

        // Gerar URL assinada válida por 1 hora (3600 segundos)
        const presignedUrl = await generatePresignedUrl(key, 3600);

        return NextResponse.json({
            url: presignedUrl,
            expiresIn: 3600,
        });
    } catch (error) {
        console.error('Erro ao gerar URL assinada:', error);
        return NextResponse.json(
            { error: 'Erro ao gerar URL assinada para o documento' },
            { status: 500 }
        );
    }
}
