/**
 * API Routes para ícones oficiais do 2FAuth
 *
 * GET /api/twofauth/icons/default/[service] - Busca o ícone oficial de um serviço
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  fetchOfficialIcon,
  TwoFAuthError,
} from "@/lib/integrations/twofauth/";

type RouteParams = { params: Promise<{ service: string }> };

/**
 * @swagger
 * /api/twofauth/icons/default/{service}:
 *   get:
 *     summary: Busca o ícone oficial de um serviço
 *     description: Obtém o ícone padrão/oficial para um serviço específico no servidor 2FAuth
 *     tags:
 *       - 2FAuth
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: service
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome do serviço para buscar o ícone oficial (ex. Google, GitHub)
 *     responses:
 *       200:
 *         description: Ícone oficial retornado com sucesso
 *       400:
 *         description: Nome do serviço não fornecido
 *       401:
 *         description: Nao autenticado
 *       404:
 *         description: Ícone não encontrado para o serviço
 *       500:
 *         description: Erro interno ou 2FAuth nao configurado
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { service } = await params;

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Nome do serviço não fornecido" },
        { status: 400 }
      );
    }

    const result = await fetchOfficialIcon(service);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in twofauth icons default GET:", error);

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
