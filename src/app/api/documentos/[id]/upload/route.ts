/**
 * API Route para upload de arquivos em documentos
 *
 * POST /api/documentos/[id]/upload - Upload de arquivo para documento
 * GET /api/documentos/[id]/upload - Lista uploads do documento
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { verificarAcessoDocumento } from '@/backend/documentos/services/persistence/documentos-persistence.service';
import {
  registrarUpload,
  listarUploadsPorDocumento,
} from '@/backend/documentos/services/persistence/uploads-persistence.service';
import {
  uploadFileToB2,
  validateFileType,
  validateFileSize,
  getTipoMedia,
} from '@/backend/documentos/services/upload/b2-upload.service';

/**
 * GET /api/documentos/[id]/upload
 * Lista uploads de um documento
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const documento_id = parseInt(id);
    if (isNaN(documento_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar acesso
    const { temAcesso } = await verificarAcessoDocumento(
      documento_id,
      authResult.usuario.id
    );

    if (!temAcesso) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const uploads = await listarUploadsPorDocumento(documento_id);

    return NextResponse.json({
      success: true,
      data: uploads,
    });
  } catch (error) {
    console.error('Erro ao listar uploads:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documentos/[id]/upload
 * Faz upload de arquivo para documento
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
    const documento_id = parseInt(id);
    if (isNaN(documento_id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar permissão de edição
    const { temAcesso, permissao } = await verificarAcessoDocumento(
      documento_id,
      authResult.usuario.id
    );

    if (!temAcesso || (permissao !== 'proprietario' && permissao !== 'editar')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para fazer upload' },
        { status: 403 }
      );
    }

    // Processar FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validações
    if (!validateFileType(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de arquivo não permitido' },
        { status: 400 }
      );
    }

    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande (máximo 50MB)' },
        { status: 400 }
      );
    }

    // Converter para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload para B2
    const { key, url, size } = await uploadFileToB2({
      file: buffer,
      fileName: file.name,
      contentType: file.type,
      folder: `documentos/${documento_id}`,
    });

    // Registrar no banco
    const upload = await registrarUpload(
      {
        documento_id,
        nome_arquivo: file.name,
        tipo_mime: file.type,
        tamanho_bytes: size,
        b2_key: key,
        b2_url: url,
        tipo_media: getTipoMedia(file.type),
      },
      authResult.usuario.id
    );

    return NextResponse.json(
      {
        success: true,
        data: upload,
        message: 'Arquivo enviado com sucesso',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer upload',
      },
      { status: 500 }
    );
  }
}
