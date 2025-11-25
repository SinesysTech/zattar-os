// Rota de API para audiências
// GET: Listar audiências com filtros, paginação e ordenação

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { obterAudiencias } from '@/backend/audiencias/services/listar-audiencias.service';
import { criarAudiencia } from '@/backend/audiencias/services/criar-audiencia.service';
import type { ListarAudienciasParams, CriarAudienciaParams } from '@/backend/types/audiencias/types';

/**
 * Helper para parsear booleanos de query params
 */
function parseBoolean(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

/**
 * Helper para parsear números de query params
 */
function parseNumber(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * @swagger
 * /api/audiencias:
 *   get:
 *     summary: Lista audiências
 *     description: |
 *       Retorna uma lista paginada de audiências com filtros avançados, ordenação e busca.
 *       
 *       **Filtros disponíveis:**
 *       - Filtros básicos: TRT, grau, responsável
 *       - Busca textual em múltiplos campos
 *       - Filtros específicos por campo (status, tipo, etc.)
 *       - Filtros de data (ranges)
 *     tags:
 *       - Audiências
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
 *         description: Número da página (começa em 1)
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Quantidade de itens por página (máximo 100)
 *       - in: query
 *         name: trt
 *         schema:
 *           type: string
 *         description: "Filtrar por código do TRT (ex: TRT3, TRT1)"
 *       - in: query
 *         name: grau
 *         schema:
 *           type: string
 *           enum: [primeiro_grau, segundo_grau]
 *         description: Filtrar por grau do processo
 *       - in: query
 *         name: responsavel_id
 *         schema:
 *           type: string
 *         description: |
 *           Filtrar por ID do responsável.
 *           Use número para audiências com responsável específico.
 *           Use string 'null' para audiências sem responsável.
 *       - in: query
 *         name: sem_responsavel
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas audiências sem responsável (true)
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: |
 *           Busca textual em múltiplos campos:
 *           - numero_processo
 *           - polo_ativo_nome
 *           - polo_passivo_nome
 *       - in: query
 *         name: numero_processo
 *         schema:
 *           type: string
 *         description: Filtrar por número do processo (busca parcial)
 *       - in: query
 *         name: polo_ativo_nome
 *         schema:
 *           type: string
 *         description: Filtrar por nome da parte autora (busca parcial)
 *       - in: query
 *         name: polo_passivo_nome
 *         schema:
 *           type: string
 *         description: Filtrar por nome da parte ré (busca parcial)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [M, R, C]
 *         description: Filtrar por status (M=Marcada, R=Realizada, C=Cancelada)
 *       - in: query
 *         name: tipo_descricao
 *         schema:
 *           type: string
 *         description: Filtrar por descrição do tipo de audiência (busca parcial)
 *       - in: query
 *         name: tipo_codigo
 *         schema:
 *           type: string
 *         description: Filtrar por código do tipo de audiência
 *       - in: query
 *         name: tipo_is_virtual
 *         schema:
 *           type: boolean
 *         description: Filtrar por audiências virtuais (true) ou presenciais (false)
 *       - in: query
 *         name: data_inicio_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data inicial para filtrar por data de início (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_inicio_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data final para filtrar por data de início (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_fim_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data inicial para filtrar por data de fim (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: data_fim_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data final para filtrar por data de fim (ISO date: YYYY-MM-DD)"
 *       - in: query
 *         name: ordenar_por
 *         schema:
 *           type: string
 *           enum: [data_inicio, data_fim, numero_processo, polo_ativo_nome, polo_passivo_nome, status, tipo_descricao, created_at, updated_at]
 *           default: data_inicio
 *         description: Campo para ordenação
 *       - in: query
 *         name: ordem
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Direção da ordenação (asc = crescente, desc = decrescente)
 *     responses:
 *       200:
 *         description: Lista de audiências retornada com sucesso
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
 *                     audiencias:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Audiencia'
 *                     paginacao:
 *                       type: object
 *                       properties:
 *                         pagina:
 *                           type: integer
 *                         limite:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPaginas:
 *                           type: integer
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Parâmetro 'pagina' deve ser maior ou igual a 1"
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // 2. Extrair e parsear parâmetros da query string
    const searchParams = request.nextUrl.searchParams;

    const pagina = parseNumber(searchParams.get('pagina')) ?? 1;
    const limite = parseNumber(searchParams.get('limite')) ?? 50;

    const params: ListarAudienciasParams = {
      // Paginação
      pagina,
      limite,

      // Filtros básicos
      trt: searchParams.get('trt') || undefined,
      grau: searchParams.get('grau') as ListarAudienciasParams['grau'] | undefined,
      responsavel_id:
        searchParams.get('responsavel_id') === 'null'
          ? 'null'
          : parseNumber(searchParams.get('responsavel_id')),
      sem_responsavel: parseBoolean(searchParams.get('sem_responsavel')),

      // Busca textual
      busca: searchParams.get('busca') || undefined,

      // Filtros específicos
      numero_processo: searchParams.get('numero_processo') || undefined,
      polo_ativo_nome: searchParams.get('polo_ativo_nome') || undefined,
      polo_passivo_nome: searchParams.get('polo_passivo_nome') || undefined,
      status: searchParams.get('status') || undefined,
      tipo_descricao: searchParams.get('tipo_descricao') || undefined,
      tipo_codigo: searchParams.get('tipo_codigo') || undefined,
      tipo_is_virtual: parseBoolean(searchParams.get('tipo_is_virtual')),

      // Filtros de data
      data_inicio_inicio: searchParams.get('data_inicio_inicio') || undefined,
      data_inicio_fim: searchParams.get('data_inicio_fim') || undefined,
      data_fim_inicio: searchParams.get('data_fim_inicio') || undefined,
      data_fim_fim: searchParams.get('data_fim_fim') || undefined,

      // Ordenação
      ordenar_por: searchParams.get('ordenar_por') as ListarAudienciasParams['ordenar_por'] | undefined,
      ordem: searchParams.get('ordem') as 'asc' | 'desc' | undefined,
    };

    // 3. Validações básicas
    if (params.pagina !== undefined && params.pagina < 1) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: "Parâmetro 'pagina' deve ser maior ou igual a 1" } },
        { status: 400 }
      );
    }

    if (params.limite !== undefined && (params.limite < 1 || params.limite > 100)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: "Parâmetro 'limite' deve estar entre 1 e 100" } },
        { status: 400 }
      );
    }

    // 4. Listar audiências
    const resultado = await obterAudiencias(params);

    // 5. Formatar resposta
    return NextResponse.json({
      success: true,
      data: {
        audiencias: resultado.audiencias,
        paginacao: {
          pagina: resultado.pagina,
          limite: resultado.limite,
          total: resultado.total,
          totalPaginas: resultado.totalPaginas,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao listar audiências:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: { code: 'INTERNAL', message: erroMsg } }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/audiencias:
 *   post:
 *     summary: Cria nova audiência
 *     description: |
 *       Cria uma nova audiência manualmente no sistema.
 *       As audiências manuais terão id_pje = 0 para diferenciá-las das capturadas do PJE.
 *     tags:
 *       - Audiências
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
 *               - processo_id
 *               - advogado_id
 *               - data_inicio
 *               - data_fim
 *             properties:
 *               processo_id:
 *                 type: number
 *                 description: ID do processo na tabela acervo
 *               advogado_id:
 *                 type: number
 *                 description: ID do advogado responsável pela captura
 *               data_inicio:
 *                 type: string
 *                 format: date-time
 *                 description: Data e hora de início da audiência (ISO 8601)
 *               data_fim:
 *                 type: string
 *                 format: date-time
 *                 description: Data e hora de fim da audiência (ISO 8601)
 *               tipo_descricao:
 *                 type: string
 *                 description: Tipo da audiência (ex "Una", "Instrução")
 *               tipo_is_virtual:
 *                 type: boolean
 *                 description: Se a audiência é virtual
 *               sala_audiencia_nome:
 *                 type: string
 *                 description: Nome da sala de audiência
 *               url_audiencia_virtual:
 *                 type: string
 *                 description: URL da audiência virtual (Zoom, Meet, etc)
 *               observacoes:
 *                 type: string
 *                 description: Observações sobre a audiência
 *               responsavel_id:
 *                 type: number
 *                 description: ID do usuário responsável pela audiência
 *     responses:
 *       201:
 *         description: Audiência criada com sucesso
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
 *                     id:
 *                       type: number
 *                       description: ID da audiência criada
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // 2. Parsear body
    const body = await request.json();

    // 3. Validar campos obrigatórios
    if (!body.processo_id || typeof body.processo_id !== 'number') {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Campo processo_id é obrigatório e deve ser um número' } },
        { status: 400 }
      );
    }

    if (!body.advogado_id || typeof body.advogado_id !== 'number') {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Campo advogado_id é obrigatório e deve ser um número' } },
        { status: 400 }
      );
    }

    if (!body.data_inicio || typeof body.data_inicio !== 'string') {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Campo data_inicio é obrigatório e deve ser uma string ISO 8601' } },
        { status: 400 }
      );
    }

    if (!body.data_fim || typeof body.data_fim !== 'string') {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Campo data_fim é obrigatório e deve ser uma string ISO 8601' } },
        { status: 400 }
      );
    }

    // 4. Validar datas
    const dataInicio = new Date(body.data_inicio);
    const dataFim = new Date(body.data_fim);

    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Datas inválidas. Use formato ISO 8601' } },
        { status: 400 }
      );
    }

    if (dataFim <= dataInicio) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'data_fim deve ser posterior a data_inicio' } },
        { status: 400 }
      );
    }

    // 5. Preparar parâmetros
    const params: CriarAudienciaParams = {
      processo_id: body.processo_id,
      advogado_id: body.advogado_id,
      data_inicio: body.data_inicio,
      data_fim: body.data_fim,
      tipo_audiencia_id: body.tipo_audiencia_id,
      sala_audiencia_id: body.sala_audiencia_id,
      url_audiencia_virtual: body.url_audiencia_virtual,
      endereco_presencial: body.endereco_presencial,
      observacoes: body.observacoes,
      responsavel_id: body.responsavel_id,
    };

    // 6. Criar audiência
    const audienciaId = await criarAudiencia(params);

    // 7. Retornar sucesso
    return NextResponse.json(
      {
        success: true,
        data: { id: audienciaId },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar audiência:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: { code: 'INTERNAL', message: erroMsg } }, { status: 500 });
  }
}

