/**
 * API Route para reordenação de contas 2FAuth
 *
 * PATCH /api/twofauth/accounts/reorder - Reordena as contas
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  reorderAccounts,
  TwoFAuthError,
  type ReorderAccountsParams,
} from "@/lib/integrations/twofauth/";

/**
 * @swagger
 * /api/twofauth/accounts/reorder:
 *   patch:
 *     summary: Reordena contas do 2FAuth
 *     description: Define a nova ordem de exibição das contas 2FA fornecendo os IDs na ordem desejada
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
 *               - orderedIds
 *             properties:
 *               orderedIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs das contas na nova ordem desejada
 *                 minItems: 1
 *     responses:
 *       200:
 *         description: Contas reordenadas com sucesso
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
 *         description: orderedIds ausente ou inválido
 *       401:
 *         description: Nao autenticado
 *       500:
 *         description: Erro interno ou 2FAuth nao configurado
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { orderedIds?: unknown };

    if (
      !Array.isArray(body.orderedIds) ||
      body.orderedIds.length === 0 ||
      !body.orderedIds.every(
        (id) => typeof id === "number" && Number.isInteger(id)
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Campo obrigatório inválido: orderedIds deve ser um array não vazio de inteiros",
        },
        { status: 400 }
      );
    }

    const params: ReorderAccountsParams = {
      orderedIds: body.orderedIds as number[],
    };

    await reorderAccounts(params);

    return NextResponse.json({
      success: true,
      message: "Contas reordenadas com sucesso",
    });
  } catch (error) {
    console.error("Error in twofauth accounts reorder PATCH:", error);

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
