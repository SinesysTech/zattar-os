/**
 * @swagger
 * /api/expedientes-manuais:
 *   get:
 *     summary: Lista expedientes manuais
 *     description: Retorna lista de expedientes manuais com filtros e paginação
 *     tags:
 *       - Expedientes Manuais
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número da página (0-indexed)
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Quantidade de itens por página
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: Termo de busca
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
 *           enum: [primeiro_grau, segundo_grau]
 *         description: Filtrar por grau
 *       - in: query
 *         name: tipo_expediente_id
 *         schema:
 *           type: integer
 *         description: Filtrar por tipo de expediente
 *       - in: query
 *         name: responsavel_id
 *         schema:
 *           type: string
 *         description: Filtrar por responsável (use "null" para sem responsável)
 *       - in: query
 *         name: prazo_vencido
 *         schema:
 *           type: boolean
 *         description: Filtrar por prazo vencido
 *       - in: query
 *         name: baixado
 *         schema:
 *           type: boolean
 *         description: Filtrar por status de baixa
 *     responses:
 *       200:
 *         description: Lista de expedientes manuais
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
 *                     expedientes:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     pagina:
 *                       type: integer
 *                     limite:
 *                       type: integer
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *   post:
 *     summary: Cria um expediente manual
 *     description: Cria um novo expediente manual vinculado a um processo
 *     tags:
 *       - Expedientes Manuais
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - processo_id
 *               - descricao
 *             properties:
 *               processo_id:
 *                 type: integer
 *                 description: ID do processo
 *               descricao:
 *                 type: string
 *                 description: Descrição do expediente
 *               tipo_expediente_id:
 *                 type: integer
 *                 description: ID do tipo de expediente
 *               responsavel_id:
 *                 type: integer
 *                 description: ID do responsável
 *               data_prazo_legal:
 *                 type: string
 *                 format: date-time
 *                 description: Data do prazo legal
 *               observacoes:
 *                 type: string
 *                 description: Observações adicionais
 *     responses:
 *       201:
 *         description: Expediente criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { verificarPermissoes } from '@/backend/permissoes/services/persistence/permissao-persistence.service';
import {
  criarExpedienteManual,
  listarExpedientesManuais,
} from '@/backend/expedientes/services/persistence/expedientes-manuais-persistence.service';
import { CriarExpedienteManualParams, ListarExpedientesManuaisParams } from '@/backend/types/expedientes-manuais/types';

/**
 * GET /api/expedientes-manuais
 * Listar expedientes manuais com filtros e paginação
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Permissão
    const temPermissao = await verificarPermissoes(
      authResult.usuarioId,
      'expedientes_manuais',
      'visualizar'
    );
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar expedientes manuais' },
        { status: 403 }
      );
    }

    // Parâmetros da query
    const searchParams = request.nextUrl.searchParams;
    const pagina = parseInt(searchParams.get('pagina') || '0');
    const limite = parseInt(searchParams.get('limite') || '20');
    const busca = searchParams.get('busca') || undefined;
    const processo_id = searchParams.get('processo_id')
      ? parseInt(searchParams.get('processo_id')!)
      : undefined;
    const trt = searchParams.get('trt') || undefined;
    const grau = searchParams.get('grau') || undefined;
    const tipo_expediente_id = searchParams.get('tipo_expediente_id')
      ? parseInt(searchParams.get('tipo_expediente_id')!)
      : undefined;
    const responsavel_id =
      searchParams.get('responsavel_id') === 'null'
        ? 'null'
        : searchParams.get('responsavel_id')
        ? parseInt(searchParams.get('responsavel_id')!)
        : undefined;
    const prazo_vencido = searchParams.get('prazo_vencido')
      ? searchParams.get('prazo_vencido') === 'true'
      : undefined;
    const baixado = searchParams.get('baixado')
      ? searchParams.get('baixado') === 'true'
      : undefined;
    const criado_por = searchParams.get('criado_por')
      ? parseInt(searchParams.get('criado_por')!)
      : undefined;
    const data_prazo_legal_inicio = searchParams.get('data_prazo_legal_inicio') || undefined;
    const data_prazo_legal_fim = searchParams.get('data_prazo_legal_fim') || undefined;
    const ordenar_por = searchParams.get('ordenar_por') || 'created_at';
    const ordem = searchParams.get('ordem') || 'desc';

    // Listar expedientes
    const result = await listarExpedientesManuais({
      pagina,
      limite,
      busca,
      processo_id,
      trt,
      grau: grau as ListarExpedientesManuaisParams['grau'],
      tipo_expediente_id,
      responsavel_id: responsavel_id as ListarExpedientesManuaisParams['responsavel_id'],
      prazo_vencido,
      baixado,
      criado_por,
      data_prazo_legal_inicio,
      data_prazo_legal_fim,
      ordenar_por: ordenar_por as ListarExpedientesManuaisParams['ordenar_por'],
      ordem: ordem as ListarExpedientesManuaisParams['ordem'],
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('[API] Erro ao listar expedientes manuais:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao listar expedientes manuais' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/expedientes-manuais
 * Criar novo expediente manual
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Permissão
    const temPermissao = await verificarPermissoes(
      authResult.usuarioId,
      'expedientes_manuais',
      'criar'
    );
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para criar expedientes manuais' },
        { status: 403 }
      );
    }

    // Body da requisição
    const body: CriarExpedienteManualParams = await request.json();

    // Validações
    if (!body.processo_id) {
      return NextResponse.json(
        { success: false, error: 'processo_id é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.descricao || body.descricao.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'descricao é obrigatória' },
        { status: 400 }
      );
    }

    // Criar expediente
    const expediente = await criarExpedienteManual(body, authResult.usuarioId);

    return NextResponse.json(
      { success: true, data: expediente },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Erro ao criar expediente manual:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao criar expediente manual' },
      { status: 500 }
    );
  }
}
