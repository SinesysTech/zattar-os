/**
 * API Route para operações em lote de contas 2FAuth
 *
 * DELETE /api/twofauth/accounts/batch - Exclui múltiplas contas
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { deleteAccounts, TwoFAuthError } from "@/lib/integrations/twofauth/";

/**
 * @swagger
 * /api/twofauth/accounts/batch:
 *   delete:
 *     summary: Exclui múltiplas contas do 2FAuth
 *     description: Remove um conjunto de contas 2FA em uma única operação em lote
 *     tags:
 *       - 2FAuth
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
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs das contas a serem excluídas
 *                 minItems: 1
 *     responses:
 *       200:
 *         description: Contas excluídas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: IDs ausentes ou inválidos
 *       401:
 *         description: Nao autenticado
 *       500:
 *         description: Erro interno ou 2FAuth nao configurado
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { ids?: unknown };

    if (
      !Array.isArray(body.ids) ||
      body.ids.length === 0 ||
      !body.ids.every((id) => typeof id === "number" && Number.isInteger(id))
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Campo obrigatório inválido: ids deve ser um array não vazio de inteiros",
        },
        { status: 400 }
      );
    }

    await deleteAccounts(body.ids as number[]);

    return NextResponse.json({
      success: true,
      message: "Contas excluídas com sucesso",
    });
  } catch (error) {
    console.error("Error in twofauth accounts batch DELETE:", error);

    if (error instanceof TwoFAuthError) {
      return NextResponse.json(
        { success: false, error: error.message, statusCode: error.statusCode },
        { status: error.statusCode >= 500 ? 500 : error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
