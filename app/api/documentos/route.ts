/**
 * API Routes para documentos
 *
 * @swagger
 * tags:
 *   - name: Documentos
 *     description: Gerenciamento de documentos do sistema
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarDocumentos,
  criarDocumento,
} from '@/backend/documentos/services/persistence/documentos-persistence.service';
import type {
  CriarDocumentoParams,
  ListarDocumentosParams,
} from '@/backend/types/documentos/types';

/**
 * @swagger
 * /api/documentos:
 *   get:
 *     tags: [Documentos]
 *     summary: Lista documentos com filtros
 *     description: Retorna lista paginada de documentos que o usuário tem acesso (criados ou compartilhados)
 *     parameters:
 *       - in: query
 *         name: pasta_id
 *         schema:
 *           type: integer
 *         description: ID da pasta para filtrar. Use 'null' para documentos na raiz.
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: Termo de busca no título e descrição
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Tags separadas por vírgula para filtrar
 *       - in: query
 *         name: criado_por
 *         schema:
 *           type: integer
 *         description: ID do criador para filtrar
 *       - in: query
 *         name: incluir_deletados
 *         schema:
 *           type: boolean
 *         description: Incluir documentos na lixeira
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limite de registros por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginação
 *     responses:
 *       200:
 *         description: Lista de documentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Documento'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const params: ListarDocumentosParams = {
      pasta_id: searchParams.get('pasta_id')
        ? searchParams.get('pasta_id') === 'null'
          ? null
          : parseInt(searchParams.get('pasta_id')!)
        : undefined,
      busca: searchParams.get('busca') ?? undefined,
      tags: searchParams.get('tags')?.split(',') ?? undefined,
      criado_por: searchParams.get('criado_por')
        ? parseInt(searchParams.get('criado_por')!)
        : undefined,
      incluir_deletados: searchParams.get('incluir_deletados') === 'true',
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : undefined,
      offset: searchParams.get('offset')
        ? parseInt(searchParams.get('offset')!)
        : undefined,
    };

    const { documentos, total } = await listarDocumentos(params);

    return NextResponse.json({
      success: true,
      data: documentos,
      pagination: {
        total,
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
        hasMore: (params.offset ?? 0) + documentos.length < total,
      },
    });
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
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
 * @swagger
 * /api/documentos:
 *   post:
 *     tags: [Documentos]
 *     summary: Cria um novo documento
 *     description: Cria um novo documento associado ao usuário autenticado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CriarDocumentoParams'
 *     responses:
 *       201:
 *         description: Documento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Documento'
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CriarDocumentoParams = await request.json();

    // Validação básica
    if (!body.titulo || body.titulo.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Título é obrigatório' },
        { status: 400 }
      );
    }

    if (body.titulo.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Título muito longo (máximo 500 caracteres)' },
        { status: 400 }
      );
    }

    const documento = await criarDocumento(body, authResult.usuario.id);

    return NextResponse.json(
      { success: true, data: documento },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
