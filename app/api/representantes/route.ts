/**
 * API Route: /api/representantes
 * Collection endpoint - GET (list) and POST (create) representantes
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarRepresentantes,
  listarRepresentantesComEndereco,
  listarRepresentantesComEnderecoEProcessos,
  criarRepresentante,
} from '@/backend/representantes/services/representantes-persistence.service';
import type {
  ListarRepresentantesParams,
  CriarRepresentanteParams,
} from '@/backend/types/representantes/representantes-types';

/**
 * @swagger
 * /api/representantes:
 *   get:
 *     summary: Lista representantes com paginação e filtros
 *     tags: [Representantes]
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
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: parte_tipo
 *         schema:
 *           type: string
 *           enum: [cliente, parte_contraria, terceiro]
 *         description: Filtrar por tipo de parte
 *       - in: query
 *         name: parte_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID da parte
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
 *         name: numero_oab
 *         schema:
 *           type: string
 *         description: Filtrar por número OAB
 *       - in: query
 *         name: situacao_oab
 *         schema:
 *           type: string
 *         description: Filtrar por situação OAB
 *       - in: query
 *         name: tipo_pessoa
 *         schema:
 *           type: string
 *           enum: [pf, pj]
 *         description: Filtrar por tipo de pessoa
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: Busca textual em nome
 *       - in: query
 *         name: ordenar_por
 *         schema:
 *           type: string
 *         description: Campo para ordenação
 *       - in: query
 *         name: ordem
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Direção da ordenação
 *       - in: query
 *         name: incluir_endereco
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Se true, inclui dados de endereço via JOIN
 *       - in: query
 *         name: incluir_processos
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Se true, inclui processos relacionados via processo_partes (implica incluir_endereco=true)
 *     responses:
 *       200:
 *         description: Lista de representantes retornada com sucesso
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
 *                     representantes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Representante'
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
    const incluirEndereco = searchParams.get('incluir_endereco') === 'true';
    const incluirProcessos = searchParams.get('incluir_processos') === 'true';
    const params: ListarRepresentantesParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!) : undefined,
      nome: searchParams.get('nome') || undefined,
      cpf: searchParams.get('cpf') || undefined,
      numero_oab: searchParams.get('numero_oab') || undefined,
      uf_oab: searchParams.get('uf_oab') || undefined,
      situacao_oab: searchParams.get('situacao_oab') || undefined,
      busca: searchParams.get('busca') || undefined,
      ordenar_por: searchParams.get('ordenar_por') as ListarRepresentantesParams['ordenar_por'],
      ordem: searchParams.get('ordem') as 'asc' | 'desc' | undefined,
    };

    // List representantes - incluir_processos implica incluir_endereco
    const result = incluirProcessos
      ? await listarRepresentantesComEnderecoEProcessos(params)
      : incluirEndereco
        ? await listarRepresentantesComEndereco(params)
        : await listarRepresentantes(params);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('Erro ao listar representantes:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar representantes' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/representantes:
 *   post:
 *     summary: Cria novo representante
 *     tags: [Representantes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_pessoa_pje
 *               - parte_tipo
 *               - parte_id
 *               - tipo_pessoa
 *               - nome
 *             properties:
 *               id_pessoa_pje:
 *                 type: integer
 *                 description: ID da pessoa no PJE
 *               parte_tipo:
 *                 type: string
 *                 enum: [cliente, parte_contraria, terceiro]
 *                 description: Tipo de parte representada
 *               parte_id:
 *                 type: integer
 *                 description: ID da parte representada
 *               tipo_pessoa:
 *                 type: string
 *                 enum: [pf, pj]
 *                 description: Tipo de pessoa (física ou jurídica)
 *               nome:
 *                 type: string
 *                 description: Nome completo do representante
 *               cpf:
 *                 type: string
 *                 description: CPF (obrigatório para pessoa física)
 *               cnpj:
 *                 type: string
 *                 description: CNPJ (obrigatório para pessoa jurídica)
 *               numero_oab:
 *                 type: string
 *                 description: Número da OAB
 *               uf_oab:
 *                 type: string
 *                 description: UF da OAB
 *               endereco_id:
 *                 type: integer
 *                 description: ID do endereço na tabela enderecos (FK)
 *     responses:
 *       201:
 *         description: Representante criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Representante'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       409:
 *         description: Representante já cadastrado
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
    const params: CriarRepresentanteParams = body;

    // Validate required fields (nova estrutura: CPF é chave única)
    if (!params.cpf || !params.nome) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não informados (cpf, nome)' },
        { status: 400 }
      );
    }

    // Create representante
    const result = await criarRepresentante(params);

    if (!result.sucesso) {
      // Check for unique constraint violation
      if (result.erro?.includes('já cadastrado')) {
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
      { success: true, data: result.representante },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar representante:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar representante' },
      { status: 500 }
    );
  }
}
