/**
 * API Route: GET /api/clientes/[id]/documentos
 *
 * Lista os arquivos do cliente armazenados no Backblaze B2.
 * Retorna URLs assinadas (presigned) para acesso temporário.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuração do cliente S3 para Backblaze
function getS3Client(): S3Client | null {
  const endpoint = process.env.BACKBLAZE_ENDPOINT || process.env.B2_ENDPOINT;
  const region = process.env.BACKBLAZE_REGION || process.env.B2_REGION;
  const keyId = process.env.BACKBLAZE_ACCESS_KEY_ID || process.env.B2_KEY_ID;
  const applicationKey =
    process.env.BACKBLAZE_SECRET_ACCESS_KEY || process.env.B2_APPLICATION_KEY;

  if (!endpoint || !region || !keyId || !applicationKey) {
    return null;
  }

  return new S3Client({
    endpoint: endpoint.startsWith('http') ? endpoint : `https://${endpoint}`,
    region,
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: applicationKey
    }
  });
}

interface DocumentFile {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  contentType: string;
  url: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clienteId = parseInt(id, 10);

    if (isNaN(clienteId)) {
      return NextResponse.json(
        { error: 'ID do cliente inválido' },
        { status: 400 }
      );
    }

    // Verificar autenticação
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar cliente e path dos documentos
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, nome, cpf, documentos')
      .eq('id', clienteId)
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Se não tem documentos configurados, retornar lista vazia
    if (!cliente.documentos) {
      return NextResponse.json({
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          cpf: cliente.cpf
        },
        documentos: [],
        total: 0
      });
    }

    // Configurar cliente S3
    const s3Client = getS3Client();
    if (!s3Client) {
      return NextResponse.json(
        { error: 'Backblaze não configurado' },
        { status: 500 }
      );
    }

    const bucket = process.env.BACKBLAZE_BUCKET_NAME || process.env.B2_BUCKET;
    if (!bucket) {
      return NextResponse.json(
        { error: 'Bucket não configurado' },
        { status: 500 }
      );
    }

    // Listar arquivos do cliente
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: cliente.documentos
    });

    const listResponse = await s3Client.send(listCommand);
    const objects = listResponse.Contents ?? [];

    // Gerar URLs assinadas para cada arquivo
    const documentos: DocumentFile[] = await Promise.all(
      objects.map(async (obj) => {
        const key = obj.Key ?? '';
        const name = key.split('/').pop() ?? key;

        // Determinar content type pelo nome do arquivo
        const ext = name.toLowerCase().split('.').pop();
        const contentTypeMap: Record<string, string> = {
          pdf: 'application/pdf',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          xls: 'application/vnd.ms-excel',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
        const contentType = contentTypeMap[ext ?? ''] ?? 'application/octet-stream';

        // Gerar URL assinada (válida por 1 hora)
        const getCommand = new GetObjectCommand({
          Bucket: bucket,
          Key: key
        });

        const url = await getSignedUrl(s3Client, getCommand, {
          expiresIn: 3600
        });

        return {
          key,
          name,
          size: obj.Size ?? 0,
          lastModified: obj.LastModified?.toISOString() ?? '',
          contentType,
          url
        };
      })
    );

    // Ordenar por nome
    documentos.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf
      },
      documentos,
      total: documentos.length
    });
  } catch (error) {
    console.error('Erro ao listar documentos do cliente:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
