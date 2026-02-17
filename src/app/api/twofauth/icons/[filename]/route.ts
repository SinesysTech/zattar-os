/**
 * API Routes para ícone específico do 2FAuth
 *
 * DELETE /api/twofauth/icons/[filename] - Exclui um ícone pelo nome do arquivo
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  deleteIcon,
  TwoFAuthError,
} from "@/lib/integrations/twofauth/";

type RouteParams = { params: Promise<{ filename: string }> };

/**
 * @swagger
 * /api/twofauth/icons/{filename}:
 *   delete:
 *     summary: Exclui um ícone
 *     description: Remove um arquivo de ícone do servidor 2FAuth pelo nome do arquivo
 *     tags:
 *       - 2FAuth
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome do arquivo de ícone a ser removido
 *     responses:
 *       200:
 *         description: Ícone excluído com sucesso
 *       400:
 *         description: Nome de arquivo inválido
 *       401:
 *         description: Nao autenticado
 *       404:
 *         description: Ícone não encontrado
 *       500:
 *         description: Erro interno ou 2FAuth nao configurado
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename } = await params;

    if (!filename) {
      return NextResponse.json(
        { success: false, error: "Nome do arquivo não fornecido" },
        { status: 400 }
      );
    }

    await deleteIcon(filename);

    return NextResponse.json({
      success: true,
      message: "Ícone excluído com sucesso",
    });
  } catch (error) {
    console.error("Error in twofauth icons DELETE:", error);

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
