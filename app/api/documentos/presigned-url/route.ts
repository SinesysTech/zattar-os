/**
 * @swagger
 * /api/documentos/presigned-url:
 *   post:
 *     summary: Gera URL assinada para documento
 *     description: Gera uma URL assinada (presigned URL) para download de documento do storage privado
 *     tags:
 *       - Documentos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *             properties:
 *               key:
 *                 type: string
 *                 description: Chave (caminho) do documento no storage
 *                 example: "processos/123/documento.pdf"
 *     responses:
 *       200:
 *         description: URL assinada gerada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL assinada para download
 *                 expiresIn:
 *                   type: integer
 *                   description: Tempo de expiração em segundos
 *                   example: 3600
 *       400:
 *         description: Parâmetro key ausente ou inválido
 *       500:
 *         description: Erro ao gerar URL assinada
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
