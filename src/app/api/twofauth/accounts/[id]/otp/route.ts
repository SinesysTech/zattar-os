// Rota de API para obter OTP de uma conta especifica do 2FAuth
// GET: Retorna o codigo OTP atual de uma conta

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { getOTP, TwoFAuthError } from "@/lib/integrations/twofauth/";

/**
 * @swagger
 * /api/twofauth/accounts/{id}/otp:
 *   get:
 *     summary: Obtem OTP de uma conta
 *     description: Retorna o codigo OTP atual e proximo (se disponivel) de uma conta especifica
 *     tags:
 *       - 2FAuth
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da conta no 2FAuth
 *     responses:
 *       200:
 *         description: OTP retornado com sucesso
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
 *                     password:
 *                       type: string
 *                       description: Codigo OTP atual
 *                     nextPassword:
 *                       type: string
 *                       description: Proximo codigo OTP (se disponivel)
 *       401:
 *         description: Nao autenticado
 *       404:
 *         description: Conta nao encontrada
 *       500:
 *         description: Erro interno ou 2FAuth nao configurado
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticacao
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Obter ID da conta
    const { id } = await params;
    const accountId = parseInt(id, 10);

    if (isNaN(accountId)) {
      return NextResponse.json(
        { success: false, error: "ID invalido" },
        { status: 400 }
      );
    }

    // 3. Obter OTP da conta
    const otpResult = await getOTP(accountId);

    // 4. Retornar resultado
    return NextResponse.json({
      success: true,
      data: otpResult,
    });
  } catch (error) {
    console.error("Error in twofauth OTP GET:", error);

    if (error instanceof TwoFAuthError) {
      const status =
        error.statusCode === 404
          ? 404
          : error.statusCode >= 500
            ? 500
            : error.statusCode;

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        },
        { status }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
