/**
 * API Route para importação de contas 2FAuth
 *
 * POST /api/twofauth/accounts/import - Importa contas de um backup
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  importAccounts,
  TwoFAuthError,
  type MigrationData,
} from "@/lib/integrations/twofauth/";

/**
 * @swagger
 * /api/twofauth/accounts/import:
 *   post:
 *     summary: Importa contas para o 2FAuth
 *     description: Importa contas 2FA a partir de um payload de backup (migração)
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
 *               - payload
 *             properties:
 *               payload:
 *                 type: string
 *                 description: Conteúdo do arquivo de backup (JSON ou URI otpauth)
 *               withSecret:
 *                 type: boolean
 *                 description: Indica se o payload contém os segredos das contas
 *                 default: false
 *     responses:
 *       200:
 *         description: Contas importadas com sucesso
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
 *                   description: Lista de contas importadas
 *       400:
 *         description: Payload ausente ou inválido
 *       401:
 *         description: Nao autenticado
 *       500:
 *         description: Erro interno ou 2FAuth nao configurado
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<MigrationData>;

    if (!body.payload || typeof body.payload !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Campo obrigatório ausente: payload (string)",
        },
        { status: 400 }
      );
    }

    const migrationData: MigrationData = {
      payload: body.payload,
      ...(body.withSecret !== undefined && { withSecret: body.withSecret }),
    };

    const accounts = await importAccounts(migrationData);

    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error("Error in twofauth accounts import POST:", error);

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
