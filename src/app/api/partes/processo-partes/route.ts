/**
 * API Route: /api/partes/processo-partes
 * Collection endpoint - GET (list) and POST (vincular) processo-partes
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarProcessoPartes,
  vincularParteProcesso,
} from '@/backend/partes/services/processo-partes-persistence.service';
import type {
  GrauProcessoParte,
  ListarProcessoPartesParams,
  VincularParteProcessoParams,
} from '@/backend/types/partes/processo-partes-types';

function normalizeGrauInput(value: unknown): GrauProcessoParte | undefined {
  if (typeof value === 'number') {
    return normalizeGrauInput(String(value));
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  if (value === '1' || value === 'primeiro_grau') {
    return 'primeiro_grau';
  }

  if (value === '2' || value === 'segundo_grau') {
    return 'segundo_grau';
  }

  return undefined;
}

/**
 * @swagger
 * /api/partes/processo-partes:
 *   get:
 *     summary: Lista vínculos processo-partes com paginação e filtros
 *     tags: [Processo-Partes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Itens por página
 *       - in: query
 *         name: tipo_entidade
 *         schema:
 *           type: string
 *           enum: [cliente, parte_contraria, terceiro]
 *         description: Filtrar por tipo de entidade
 *       - in: query
 *         name: entidade_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID da entidade
 *       - in: query
 *         name: processo_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do processo
 *       - in: query
 *         name: trt
 *         schema:
 *           type: string
 *         description: Filtrar por TRT
 *       - in: query
 *         name: grau
 *         schema:
 *           type: string
 *           enum: ["1", "2"]
 *         description: Filtrar por grau
 *       - in: query
 *         name: numero_processo
 *         schema:
 *           type: string
 *         description: Filtrar por número do processo
 *       - in: query
 *         name: polo
 *         schema:
 *           type: string
 *           enum: [ATIVO, PASSIVO, NEUTRO, TERCEIRO]
 *         description: Filtrar por polo processual
 *       - in: query
 *         name: tipo_parte
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de parte
 *       - in: query
 *         name: principal
 *         schema:
 *           type: boolean
 *         description: Filtrar partes principais
 *       - in: query
 *         name: ordenar_por
 *         schema:
 *           type: string
 *           enum: [polo, ordem, tipo_parte, principal, created_at, updated_at]
 *         description: Campo para ordenação
 *       - in: query
 *         name: ordem
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Direção da ordenação
 *     responses:
 *       200:
 *         description: Lista de vínculos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     processoPartes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProcessoParte'
 *                     total:
 *                       type: integer
 *                     pagina:
 *                       type: integer
 *                     limite:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params: ListarProcessoPartesParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!) : undefined,
      tipo_entidade: searchParams.get('tipo_entidade') as ListarProcessoPartesParams['tipo_entidade'],
      entidade_id: searchParams.get('entidade_id') ? parseInt(searchParams.get('entidade_id')!) : undefined,
      processo_id: searchParams.get('processo_id') ? parseInt(searchParams.get('processo_id')!) : undefined,
      trt: searchParams.get('trt') || undefined,
      grau: normalizeGrauInput(searchParams.get('grau')),
      numero_processo: searchParams.get('numero_processo') || undefined,
      polo: searchParams.get('polo') as ListarProcessoPartesParams['polo'],
      tipo_parte: searchParams.get('tipo_parte') as ListarProcessoPartesParams['tipo_parte'],
      principal: searchParams.get('principal') === 'true' ? true : searchParams.get('principal') === 'false' ? false : undefined,
      ordenar_por: searchParams.get('ordenar_por') as ListarProcessoPartesParams['ordenar_por'],
      ordem: searchParams.get('ordem') as 'asc' | 'desc' | undefined,
    };

    // List processo-partes
    const result = await listarProcessoPartes(params);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('Erro ao listar vínculos processo-partes:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar vínculos processo-partes' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/partes/processo-partes:
 *   post:
 *     summary: Vincula entidade a processo
 *     tags: [Processo-Partes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - processo_id
 *               - tipo_entidade
 *               - entidade_id
 *               - id_pje
 *               - tipo_parte
 *               - polo
 *               - trt
 *               - grau
 *               - numero_processo
 *             properties:
 *               processo_id:
 *                 type: integer
 *                 description: ID do processo
 *               tipo_entidade:
 *                 type: string
 *                 enum: [cliente, parte_contraria, terceiro]
 *                 description: Tipo de entidade vinculada
 *               entidade_id:
 *                 type: integer
 *                 description: ID da entidade vinculada
 *               id_pje:
 *                 type: integer
 *                 description: ID da parte no PJE
 *               id_pessoa_pje:
 *                 type: integer
 *                 description: ID da pessoa no PJE
 *               id_tipo_parte:
 *                 type: integer
 *                 description: ID do tipo de parte no PJE
 *               tipo_parte:
 *                 type: string
 *                 description: Tipo de participante (AUTOR, REU, etc.)
 *               polo:
 *                 type: string
 *                 enum: [ATIVO, PASSIVO, NEUTRO, TERCEIRO]
 *                 description: Polo processual
 *               trt:
 *                 type: string
 *                 description: Tribunal Regional do Trabalho
 *               grau:
 *                 type: string
 *                 enum: ["1", "2"]
 *                 description: Grau do processo
 *               numero_processo:
 *                 type: string
 *                 description: Número do processo
 *               principal:
 *                 type: boolean
 *                 description: Indica se é a parte principal no polo
 *               ordem:
 *                 type: integer
 *                 description: Ordem de exibição dentro do polo
 *     responses:
 *       201:
 *         description: Vínculo criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProcessoParte'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       409:
 *         description: Vínculo já existe
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const grauNormalizado = normalizeGrauInput(body?.grau);

    if (!grauNormalizado) {
      return NextResponse.json(
        { success: false, error: 'grau inválido (use valores "1" ou "2")' },
        { status: 400 }
      );
    }

    const params: VincularParteProcessoParams = {
      ...body,
      grau: grauNormalizado,
    };

    // Validate required fields
    if (!params.processo_id || !params.tipo_entidade || !params.entidade_id ||
        !params.id_pje || !params.tipo_parte || !params.polo ||
        !params.trt || !params.grau || !params.numero_processo) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não informados' },
        { status: 400 }
      );
    }

    // Vincular parte ao processo
    const result = await vincularParteProcesso(params);

    if (!result.sucesso) {
      // Check for unique constraint violation
      if (result.erro?.includes('já existe')) {
        return NextResponse.json(
          { success: false, error: result.erro },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: result.erro },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.processoParte },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao vincular parte a processo:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao vincular parte a processo' },
      { status: 500 }
    );
  }
}
