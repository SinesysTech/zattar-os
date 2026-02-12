/**
 * API Routes para grupo 2FAuth específico
 *
 * GET    /api/twofauth/groups/[id] - Obtém um grupo
 * PUT    /api/twofauth/groups/[id] - Atualiza um grupo
 * DELETE /api/twofauth/groups/[id] - Exclui um grupo
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  getGroup,
  updateGroup,
  deleteGroup,
  TwoFAuthError,
  type UpdateGroupParams,
} from "@/lib/integrations/twofauth/";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/twofauth/groups/{id}:
 *   get:
 *     summary: Obtém um grupo específico
 *     tags:
 *       - 2FAuth
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const groupId = parseInt(id, 10);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const group = await getGroup(groupId);

    return NextResponse.json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error in twofauth group GET:", error);

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
 * /api/twofauth/groups/{id}:
 *   put:
 *     summary: Atualiza um grupo
 *     tags:
 *       - 2FAuth
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const groupId = parseInt(id, 10);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as UpdateGroupParams;

    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Campo 'name' é obrigatório" },
        { status: 400 }
      );
    }

    const group = await updateGroup(groupId, body);

    return NextResponse.json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error in twofauth group PUT:", error);

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
 * /api/twofauth/groups/{id}:
 *   delete:
 *     summary: Exclui um grupo
 *     tags:
 *       - 2FAuth
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const groupId = parseInt(id, 10);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    await deleteGroup(groupId);

    return NextResponse.json({
      success: true,
      message: "Grupo excluído com sucesso",
    });
  } catch (error) {
    console.error("Error in twofauth group DELETE:", error);

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
