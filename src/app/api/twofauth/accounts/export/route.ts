/**
 * API Route para exportação de contas 2FAuth
 *
 * GET /api/twofauth/accounts/export - Exporta todas as contas
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  exportAccounts,
  TwoFAuthError,
  type ExportFormat,
} from "@/lib/integrations/twofauth/";

/**
 * @swagger
 * /api/twofauth/accounts/export:
 *   get:
 *     summary: Exporta contas do 2FAuth
 *     description: Exporta todas as contas 2FA em formato JSON ou TXT para backup
 *     tags:
 *       - 2FAuth
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, txt]
 *           default: json
 *         description: Formato de exportação (json ou txt)
 *     responses:
 *       200:
 *         description: Contas exportadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: string
 *                   description: Conteúdo exportado no formato solicitado
 *       400:
 *         description: Formato inválido
 *       401:
 *         description: Nao autenticado
 *       500:
 *         description: Erro interno ou 2FAuth nao configurado
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formatParam = request.nextUrl.searchParams.get("format") ?? "json";

    if (formatParam !== "json" && formatParam !== "txt") {
      return NextResponse.json(
        {
          success: false,
          error: "Formato inválido. Use 'json' ou 'txt'",
        },
        { status: 400 }
      );
    }

    const format = formatParam as ExportFormat;
    const data = await exportAccounts(format);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in twofauth accounts export GET:", error);

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
