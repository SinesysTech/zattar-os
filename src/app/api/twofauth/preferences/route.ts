/**
 * API Routes para preferências 2FAuth
 *
 * GET /api/twofauth/preferences - Obtém todas as preferências
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { getPreferences, TwoFAuthError } from "@/lib/integrations/twofauth/";

/**
 * @swagger
 * /api/twofauth/preferences:
 *   get:
 *     summary: Obtém preferências do usuário 2FAuth
 *     tags:
 *       - 2FAuth
 *     responses:
 *       200:
 *         description: Preferências retornadas com sucesso
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getPreferences();

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error("Error in twofauth preferences GET:", error);

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
