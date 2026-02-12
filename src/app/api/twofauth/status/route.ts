/**
 * API Route para verificar status da conexão 2FAuth
 *
 * GET /api/twofauth/status - Verifica se a conexão com o servidor 2FAuth está funcionando
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { checkConnection, getUser, TwoFAuthError } from "@/lib/integrations/twofauth/";

/**
 * @swagger
 * /api/twofauth/status:
 *   get:
 *     summary: Verifica status da conexão 2FAuth
 *     tags:
 *       - 2FAuth
 *     responses:
 *       200:
 *         description: Status da conexão
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
 *                     connected:
 *                       type: boolean
 *                     user:
 *                       type: object
 *                     error:
 *                       type: string
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar conexão
    const connectionResult = await checkConnection();

    if (!connectionResult.connected) {
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          error: connectionResult.error,
          configured: !!(process.env.TWOFAUTH_API_URL && process.env.TWOFAUTH_API_TOKEN),
        },
      });
    }

    // Se conectado, buscar dados do usuário
    try {
      const user = await getUser();
      return NextResponse.json({
        success: true,
        data: {
          connected: true,
          configured: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            is_admin: user.is_admin,
          },
        },
      });
    } catch {
      return NextResponse.json({
        success: true,
        data: {
          connected: true,
          configured: true,
          user: null,
        },
      });
    }
  } catch (error) {
    console.error("Error in twofauth status GET:", error);

    if (error instanceof TwoFAuthError) {
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          configured: !!(process.env.TWOFAUTH_API_URL && process.env.TWOFAUTH_API_TOKEN),
          error: error.message,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
