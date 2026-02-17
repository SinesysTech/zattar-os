/**
 * API Routes para usuário 2FAuth
 *
 * GET    /api/twofauth/user - Obtém dados do usuário atual
 * PUT    /api/twofauth/user - Atualiza dados do usuário
 * DELETE /api/twofauth/user - Exclui a conta do usuário
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  getUser,
  updateUser,
  deleteUser,
  TwoFAuthError,
  type UpdateUserParams,
} from "@/lib/integrations/twofauth/";

/**
 * @swagger
 * /api/twofauth/user:
 *   get:
 *     summary: Obtém os dados do usuário atual do 2FAuth
 *     tags:
 *       - 2FAuth
 *     responses:
 *       200:
 *         description: Dados do usuário retornados com sucesso
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
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     is_admin:
 *                       type: boolean
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUser();

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error in twofauth user GET:", error);

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
 * /api/twofauth/user:
 *   put:
 *     summary: Atualiza os dados do usuário 2FAuth
 *     tags:
 *       - 2FAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Novo nome do usuário
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Novo email do usuário
 *               password:
 *                 type: string
 *                 description: Nova senha
 *               current_password:
 *                 type: string
 *                 description: Senha atual (obrigatória ao alterar email ou senha)
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Nenhum campo para atualizar
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as UpdateUserParams;

    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhum campo para atualizar" },
        { status: 400 }
      );
    }

    const user = await updateUser(body);

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error in twofauth user PUT:", error);

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
 * /api/twofauth/user:
 *   delete:
 *     summary: Exclui a conta do usuário 2FAuth
 *     tags:
 *       - 2FAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: Senha atual para confirmação
 *     responses:
 *       200:
 *         description: Usuário excluído com sucesso
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
 *         description: Campo 'password' obrigatório
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Campo 'password' é obrigatório para confirmação" },
        { status: 400 }
      );
    }

    await deleteUser(password);

    return NextResponse.json({
      success: true,
      message: "Usuário excluído com sucesso",
    });
  } catch (error) {
    console.error("Error in twofauth user DELETE:", error);

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
