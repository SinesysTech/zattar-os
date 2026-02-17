/**
 * API Routes para configuração 2FAuth específica
 *
 * GET /api/twofauth/settings/[name] - Obtém uma configuração específica
 * PUT /api/twofauth/settings/[name] - Atualiza uma configuração (requer admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  getSetting,
  updateSetting,
  TwoFAuthError,
  type SettingName,
} from "@/lib/integrations/twofauth/";

type RouteParams = { params: Promise<{ name: string }> };

/**
 * @swagger
 * /api/twofauth/settings/{name}:
 *   get:
 *     summary: Obtém uma configuração específica do 2FAuth
 *     tags:
 *       - 2FAuth
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome da configuração
 *     responses:
 *       200:
 *         description: Configuração retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   description: Valor da configuração
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await params;

    const value = await getSetting(name as SettingName);

    return NextResponse.json({
      success: true,
      data: value,
    });
  } catch (error) {
    console.error("Error in twofauth setting GET:", error);

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

/**
 * @swagger
 * /api/twofauth/settings/{name}:
 *   put:
 *     summary: Atualiza uma configuração do 2FAuth (requer admin)
 *     tags:
 *       - 2FAuth
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome da configuração
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 description: Novo valor da configuração
 *     responses:
 *       200:
 *         description: Configuração atualizada com sucesso
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
 *         description: Corpo da requisição inválido
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await params;
    const body = await request.json();

    if (!("value" in body)) {
      return NextResponse.json(
        { success: false, error: "Campo 'value' é obrigatório" },
        { status: 400 }
      );
    }

    const { value } = body;

    await updateSetting(name as SettingName, value);

    return NextResponse.json({
      success: true,
      message: "Configuração atualizada com sucesso",
    });
  } catch (error) {
    console.error("Error in twofauth setting PUT:", error);

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
