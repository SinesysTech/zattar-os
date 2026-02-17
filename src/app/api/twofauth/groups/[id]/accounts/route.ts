/**
 * API Routes para contas de um grupo 2FAuth
 *
 * GET  /api/twofauth/groups/[id]/accounts - Lista contas do grupo
 * POST /api/twofauth/groups/[id]/accounts - Atribui contas ao grupo
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  listGroupAccounts,
  assignAccountsToGroup,
  TwoFAuthError,
} from "@/lib/integrations/twofauth/";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/twofauth/groups/{id}/accounts:
 *   get:
 *     summary: Lista contas de um grupo específico
 *     tags:
 *       - 2FAuth
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do grupo
 *     responses:
 *       200:
 *         description: Lista de contas do grupo
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const groupId = parseInt(id, 10);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const accounts = await listGroupAccounts(groupId);

    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error("Error in twofauth group accounts GET:", error);

    if (error instanceof TwoFAuthError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        },
        { status: error.statusCode === 404 ? 404 : error.statusCode >= 500 ? 500 : error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/twofauth/groups/{id}/accounts:
 *   post:
 *     summary: Atribui contas a um grupo
 *     tags:
 *       - 2FAuth
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do grupo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Lista de IDs de contas a atribuir ao grupo
 *     responses:
 *       200:
 *         description: Contas atribuídas com sucesso
 *       400:
 *         description: ID inválido ou corpo da requisição inválido
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const groupId = parseInt(id, 10);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as { ids: number[] };

    if (!Array.isArray(body.ids)) {
      return NextResponse.json(
        { success: false, error: "Campo 'ids' é obrigatório e deve ser um array" },
        { status: 400 }
      );
    }

    const result = await assignAccountsToGroup(groupId, body.ids);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in twofauth group accounts POST:", error);

    if (error instanceof TwoFAuthError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        },
        { status: error.statusCode === 404 ? 404 : error.statusCode >= 500 ? 500 : error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
