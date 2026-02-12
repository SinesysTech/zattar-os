/**
 * API Route para gerar QR Code de uma conta 2FAuth
 *
 * GET /api/twofauth/qrcode/[id] - Gera QR Code de uma conta
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { generateQRCode, TwoFAuthError } from "@/lib/integrations/twofauth/";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/twofauth/qrcode/{id}:
 *   get:
 *     summary: Gera QR Code de uma conta
 *     tags:
 *       - 2FAuth
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: QR Code gerado com sucesso
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
 *                     qrcode:
 *                       type: string
 *                       description: QR Code em base64
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const accountId = parseInt(id, 10);

    if (isNaN(accountId)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const qrcode = await generateQRCode(accountId);

    return NextResponse.json({
      success: true,
      data: qrcode,
    });
  } catch (error) {
    console.error("Error in twofauth qrcode GET:", error);

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
