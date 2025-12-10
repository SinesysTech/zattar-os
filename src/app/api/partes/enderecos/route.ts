/**
 * API Route: /api/partes/enderecos
 * Collection endpoint - GET (list) and POST (create) enderecos
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  listarEnderecos,
  criarEndereco,
} from '@/backend/partes/services/enderecos-persistence.service';
import type {
  ListarEnderecosParams,
  CriarEnderecoParams,
} from '@/backend/types/partes/enderecos-types';

/**
 * @swagger
 * /api/partes/enderecos:
 *   get:
 *     summary: Lista endereços com paginação e filtros
 *     tags: [Endereços]
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
 *         name: entidade_tipo
 *         schema:
 *           type: string
 *           enum: [cliente, parte_contraria, terceiro, representante]
 *         description: Filtrar por tipo de entidade
 *       - in: query
 *         name: entidade_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID da entidade
 *       - in: query
 *         name: cep
 *         schema:
 *           type: string
 *         description: Filtrar por CEP
 *       - in: query
 *         name: municipio
 *         schema:
 *           type: string
 *         description: Filtrar por município
 *       - in: query
 *         name: estado_sigla
 *         schema:
 *           type: string
 *         description: Filtrar por UF do estado
 *       - in: query
 *         name: correspondencia
 *         schema:
 *           type: boolean
 *         description: Filtrar endereços de correspondência
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *         description: Filtrar endereços ativos/inativos
 *       - in: query
 *         name: ordenar_por
 *         schema:
 *           type: string
 *           enum: [logradouro, municipio, estado_sigla, created_at, updated_at]
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
 *         description: Lista de endereços retornada com sucesso
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
 *                     enderecos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Endereco'
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
    const params: ListarEnderecosParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!) : undefined,
      entidade_tipo: searchParams.get('entidade_tipo') as ListarEnderecosParams['entidade_tipo'],
      entidade_id: searchParams.get('entidade_id') ? parseInt(searchParams.get('entidade_id')!) : undefined,
      cep: searchParams.get('cep') || undefined,
      municipio: searchParams.get('municipio') || undefined,
      estado_sigla: searchParams.get('estado_sigla') || undefined,
      correspondencia: searchParams.get('correspondencia') === 'true' ? true : searchParams.get('correspondencia') === 'false' ? false : undefined,
      ativo: searchParams.get('ativo') === 'true' ? true : searchParams.get('ativo') === 'false' ? false : undefined,
      ordenar_por: searchParams.get('ordenar_por') as ListarEnderecosParams['ordenar_por'],
      ordem: searchParams.get('ordem') as 'asc' | 'desc' | undefined,
    };

    // List enderecos
    const result = await listarEnderecos(params);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('Erro ao listar endereços:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar endereços' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/partes/enderecos:
 *   post:
 *     summary: Cria novo endereço
 *     tags: [Endereços]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entidade_tipo
 *               - entidade_id
 *             properties:
 *               id_pje:
 *                 type: integer
 *                 description: ID do endereço no PJE
 *               entidade_tipo:
 *                 type: string
 *                 enum: [cliente, parte_contraria, terceiro, representante]
 *                 description: Tipo de entidade vinculada
 *               entidade_id:
 *                 type: integer
 *                 description: ID da entidade vinculada
 *               logradouro:
 *                 type: string
 *                 description: Nome da rua/avenida
 *               numero:
 *                 type: string
 *                 description: Número do imóvel
 *               complemento:
 *                 type: string
 *                 description: Complemento do endereço
 *               bairro:
 *                 type: string
 *                 description: Bairro
 *               municipio:
 *                 type: string
 *                 description: Município/cidade
 *               estado_sigla:
 *                 type: string
 *                 description: UF do estado
 *                 example: SP
 *               cep:
 *                 type: string
 *                 description: CEP (apenas números)
 *                 example: "01310100"
 *               correspondencia:
 *                 type: boolean
 *                 description: Indica se é endereço de correspondência
 *               ativo:
 *                 type: boolean
 *                 description: Indica se o endereço está ativo
 *     responses:
 *       201:
 *         description: Endereço criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Endereco'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
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
    const params: CriarEnderecoParams = body;

    // Validate required fields
    if (!params.entidade_tipo || !params.entidade_id) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não informados' },
        { status: 400 }
      );
    }

    // Create endereco
    const result = await criarEndereco(params);

    if (!result.sucesso) {
      return NextResponse.json(
        { success: false, error: result.erro },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.endereco },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar endereço' },
      { status: 500 }
    );
  }
}
