/**
 * API Routes para grupos 2FAuth
 *
 * GET  /api/twofauth/groups - Lista todos os grupos
 * POST /api/twofauth/groups - Cria um novo grupo
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  listGroups,
  createGroup,
  TwoFAuthError,
  type CreateGroupParams,
} from "@/lib/integrations/twofauth/";

/**
 * @swagger
 * /api/twofauth/groups:
 *   get:
 *     summary: Lista grupos do 2FAuth
 *     tags:
 *       - 2FAuth
 *     responses:
 *       200:
 *         description: Lista de grupos retornada com sucesso
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await listGroups();

    return NextResponse.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("Error in twofauth groups GET:", error);

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
 * /api/twofauth/groups:
 *   post:
 *     summary: Cria um novo grupo
 *     tags:
 *       - 2FAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Grupo criado com sucesso
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateGroupParams;

    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Campo 'name' é obrigatório" },
        { status: 400 }
      );
    }

    const group = await createGroup(body);

    return NextResponse.json(
      {
        success: true,
        data: group,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in twofauth groups POST:", error);

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
