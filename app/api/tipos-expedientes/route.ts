// Rota de API para tipos de expedientes
// GET: Listar tipos de expedientes | POST: Criar tipo de expediente

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { listarTiposExpedientes } from '@/backend/tipos-expedientes/services/tipos-expedientes/listar-tipos-expedientes.service';
import { criarTipoExpediente } from '@/backend/tipos-expedientes/services/tipos-expedientes/criar-tipo-expediente.service';
import type { ListarTiposExpedientesParams } from '@/backend/types/tipos-expedientes/types';

/**
 * @swagger
 * /api/tipos-expedientes:
 *   get:
 *     summary: Lista tipos de expedientes do sistema
 *     description: Retorna uma lista paginada de tipos de expedientes com filtros opcionais
 *     tags:
 *       - Tipos de Expedientes
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Quantidade de itens por página (máximo 100)
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: Busca textual no nome do tipo de expediente
 *       - in: query
 *         name: created_by
 *         schema:
 *           type: integer
 *         description: Filtrar por usuário criador
 *       - in: query
 *         name: ordenar_por
 *         schema:
 *           type: string
 *           enum: [tipo_expediente, created_at, updated_at]
 *           default: tipo_expediente
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
 *         description: Lista de tipos de expedientes retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tipos_expedientes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TipoExpediente'
 *                     total:
 *                       type: integer
 *                     pagina:
 *                       type: integer
 *                     limite:
 *                       type: integer
 *                     totalPaginas:
 *                       type: integer
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria um novo tipo de expediente
 *     description: Cadastra um novo tipo de expediente no sistema
 *     tags:
 *       - Tipos de Expedientes
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_expediente
 *             properties:
 *               tipo_expediente:
 *                 type: string
 *                 description: Nome do tipo de expediente (deve ser único)
 *                 example: "Audiência"
 *     responses:
 *       201:
 *         description: Tipo de expediente criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TipoExpediente'
 *       400:
 *         description: Dados inválidos ou tipo já existe
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter parâmetros da query string
    const { searchParams } = new URL(request.url);
    const params: ListarTiposExpedientesParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      busca: searchParams.get('busca') || undefined,
      created_by: searchParams.get('created_by') ? parseInt(searchParams.get('created_by')!, 10) : undefined,
      ordenar_por: (searchParams.get('ordenar_por') as 'tipo_expediente' | 'created_at' | 'updated_at' | null) || undefined,
      ordem: (searchParams.get('ordem') as 'asc' | 'desc' | null) || undefined,
    };

    // 3. Listar tipos de expedientes
    const resultado = await listarTiposExpedientes(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar tipos de expedientes:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter dados do body
    const body = await request.json();
    const { tipo_expediente } = body;

    if (!tipo_expediente || typeof tipo_expediente !== 'string') {
      return NextResponse.json(
        { error: 'Campo tipo_expediente é obrigatório' },
        { status: 400 }
      );
    }

    // 3. Obter ID do usuário autenticado
    const usuarioId = authResult.usuarioId;
    if (!usuarioId) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o usuário' },
        { status: 401 }
      );
    }

    // 4. Criar tipo de expediente
    const tipoExpediente = await criarTipoExpediente({
      tipo_expediente,
      created_by: usuarioId,
    });

    return NextResponse.json(
      {
        success: true,
        data: tipoExpediente,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar tipo de expediente:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    // Verificar se é erro de validação (tipo já existe)
    if (erroMsg.includes('já cadastrado') || erroMsg.includes('obrigatório')) {
      return NextResponse.json(
        { error: erroMsg },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

