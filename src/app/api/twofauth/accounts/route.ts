// Rota de API para listar contas do 2FAuth
// GET: Lista todas as contas disponíveis no 2FAuth

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { listAccounts, TwoFAuthError } from "@/lib/integrations/twofauth";

/**
 * @swagger
 * /api/twofauth/accounts:
 *   get:
 *     summary: Lista contas do 2FAuth
 *     description: Retorna uma lista de todas as contas 2FA cadastradas no servidor 2FAuth
 *     tags:
 *       - 2FAuth
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de contas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       service:
 *                         type: string
 *                       account:
 *                         type: string
 *                       icon:
 *                         type: string
 *                       otp_type:
 *                         type: string
 *                         enum: [totp, hotp]
 *                       digits:
 *                         type: integer
 *                       period:
 *                         type: integer
 *       401:
 *         description: Nao autenticado
 *       500:
 *         description: Erro interno ou 2FAuth nao configurado
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticacao
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Buscar contas do 2FAuth
    const accounts = await listAccounts();

    // 3. Retornar resultado
    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error("Error in twofauth accounts GET:", error);

    if (error instanceof TwoFAuthError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        },
        { status: error.statusCode >= 500 ? 500 : error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
