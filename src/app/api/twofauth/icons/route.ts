/**
 * API Routes para ícones do 2FAuth
 *
 * POST /api/twofauth/icons - Faz upload de um ícone
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  uploadIcon,
  TwoFAuthError,
} from "@/lib/integrations/twofauth/";

/**
 * @swagger
 * /api/twofauth/icons:
 *   post:
 *     summary: Faz upload de um ícone
 *     description: Envia um arquivo de ícone para o servidor 2FAuth
 *     tags:
 *       - 2FAuth
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - icon
 *             properties:
 *               icon:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo de ícone a ser enviado
 *     responses:
 *       201:
 *         description: Ícone enviado com sucesso
 *       400:
 *         description: Arquivo não fornecido ou inválido
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

    const formData = await request.formData();
    const file = formData.get("icon") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Campo obrigatório: icon (arquivo)" },
        { status: 400 }
      );
    }

    const result = await uploadIcon(file);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in twofauth icons POST:", error);

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
