/**
 * API Routes para conta 2FAuth específica
 *
 * GET    /api/twofauth/accounts/[id] - Obtém uma conta
 * PUT    /api/twofauth/accounts/[id] - Atualiza uma conta
 * DELETE /api/twofauth/accounts/[id] - Exclui uma conta
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  getAccount,
  updateAccount,
  deleteAccount,
  TwoFAuthError,
  type UpdateAccountParams,
} from "@/lib/integrations/twofauth/";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/twofauth/accounts/{id}:
 *   get:
 *     summary: Obtém uma conta específica
 *     tags:
 *       - 2FAuth
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conta retornada com sucesso
 *       404:
 *         description: Conta não encontrada
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const accountId = parseInt(id, 10);

    if (isNaN(accountId)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const account = await getAccount(accountId);

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error("Error in twofauth account GET:", error);

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
 * /api/twofauth/accounts/{id}:
 *   put:
 *     summary: Atualiza uma conta
 *     tags:
 *       - 2FAuth
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service:
 *                 type: string
 *               account:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conta atualizada com sucesso
 *       404:
 *         description: Conta não encontrada
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const accountId = parseInt(id, 10);

    if (isNaN(accountId)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as UpdateAccountParams;

    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhum campo para atualizar" },
        { status: 400 }
      );
    }

    const account = await updateAccount(accountId, body);

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error("Error in twofauth account PUT:", error);

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
 * /api/twofauth/accounts/{id}:
 *   delete:
 *     summary: Exclui uma conta
 *     tags:
 *       - 2FAuth
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conta excluída com sucesso
 *       404:
 *         description: Conta não encontrada
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const accountId = parseInt(id, 10);

    if (isNaN(accountId)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    await deleteAccount(accountId);

    return NextResponse.json({
      success: true,
      message: "Conta excluída com sucesso",
    });
  } catch (error) {
    console.error("Error in twofauth account DELETE:", error);

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
