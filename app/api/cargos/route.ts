/**
 * @swagger
 * /api/cargos:
 *   get:
 *     summary: Lista todos os cargos
 *     description: Retorna lista de cargos com filtros e paginação
 *     tags:
 *       - Cargos
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
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
 *         description: Quantidade de itens por página
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: Termo de busca
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo
 *       - in: query
 *         name: ordenarPor
 *         schema:
 *           type: string
 *           default: nome
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
 *         description: Lista de cargos
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
 *                     cargos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                           descricao:
 *                             type: string
 *                           ativo:
 *                             type: boolean
 *                     total:
 *                       type: integer
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *   post:
 *     summary: Cria um novo cargo
 *     description: Cria um cargo no sistema
 *     tags:
 *       - Cargos
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
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome do cargo
 *               descricao:
 *                 type: string
 *                 description: Descrição do cargo
 *               ativo:
 *                 type: boolean
 *                 default: true
 *                 description: Status ativo do cargo
 *     responses:
 *       201:
 *         description: Cargo criado com sucesso
 *       400:
 *         description: Dados inválidos ou cargo já existe
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/backend/auth/require-permission';
import {
  listarCargos,
  criarCargo,
  buscarCargoPorNome,
} from '@/backend/cargos/services/persistence/cargo-persistence.service';
import { validarCriarCargoDTO } from '@/backend/types/cargos/types';

/**
 * GET /api/cargos
 * Listar cargos com filtros e paginação
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar permissão: cargos.listar
    const authOrError = await requirePermission(request, 'cargos', 'listar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }

    // Extrair query params
    const { searchParams } = new URL(request.url);
    const pagina = parseInt(searchParams.get('pagina') || '1', 10);
    const limite = parseInt(searchParams.get('limite') || '50', 10);
    const busca = searchParams.get('busca') || undefined;
    const ativo = searchParams.get('ativo')
      ? searchParams.get('ativo') === 'true'
      : undefined;
    const ordenarPor = (searchParams.get('ordenarPor') || 'nome') as 'nome' | 'created_at' | 'updated_at';
    const ordem = (searchParams.get('ordem') || 'asc') as 'asc' | 'desc';

    // Listar cargos
    const resultado = await listarCargos({
      pagina,
      limite,
      busca,
      ativo,
      ordenarPor,
      ordem,
    });

    return NextResponse.json(
      {
        success: true,
        data: resultado,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao listar cargos:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cargos
 * Criar novo cargo
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar permissão: cargos.criar
    const authOrError = await requirePermission(request, 'cargos', 'criar');
    if (authOrError instanceof NextResponse) {
      return authOrError;
    }
    const { usuarioId } = authOrError;

    // Parse body
    const body = await request.json();

    // Validar DTO
    if (!validarCriarCargoDTO(body)) {
      return NextResponse.json(
        { error: 'Dados inválidos. Campo "nome" é obrigatório.' },
        { status: 400 }
      );
    }

    // Verificar se nome já existe
    const cargoExistente = await buscarCargoPorNome(body.nome);
    if (cargoExistente) {
      return NextResponse.json(
        { error: 'Cargo com este nome já existe' },
        { status: 400 }
      );
    }

    // Criar cargo
    const cargo = await criarCargo(body, usuarioId);

    return NextResponse.json(
      {
        success: true,
        data: cargo,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar cargo:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
