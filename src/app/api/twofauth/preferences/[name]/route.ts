/**
 * API Routes para preferência 2FAuth específica
 *
 * GET /api/twofauth/preferences/[name] - Obtém uma preferência
 * PUT /api/twofauth/preferences/[name] - Atualiza uma preferência
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  getPreference,
  updatePreference,
  TwoFAuthError,
  type PreferenceName,
} from "@/lib/integrations/twofauth/";

type RouteParams = { params: Promise<{ name: string }> };

/**
 * @swagger
 * /api/twofauth/preferences/{name}:
 *   get:
 *     summary: Obtém uma preferência específica
 *     tags:
 *       - 2FAuth
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await params;
    const value = await getPreference(name as PreferenceName);

    return NextResponse.json({
      success: true,
      data: { name, value },
    });
  } catch (error) {
    console.error("Error in twofauth preference GET:", error);

    if (error instanceof TwoFAuthError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        },
        { status: error.statusCode === 404 ? 404 : error.statusCode >= 500 ? 500 : error.statusCode }
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
 * /api/twofauth/preferences/{name}:
 *   put:
 *     summary: Atualiza uma preferência
 *     tags:
 *       - 2FAuth
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
 *                 description: Novo valor da preferência
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await params;
    const body = await request.json();

    if (body.value === undefined) {
      return NextResponse.json(
        { success: false, error: "Campo 'value' é obrigatório" },
        { status: 400 }
      );
    }

    await updatePreference(name as PreferenceName, body.value);

    return NextResponse.json({
      success: true,
      message: `Preferência '${name}' atualizada com sucesso`,
    });
  } catch (error) {
    console.error("Error in twofauth preference PUT:", error);

    if (error instanceof TwoFAuthError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        },
        { status: error.statusCode === 404 ? 404 : error.statusCode >= 500 ? 500 : error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
