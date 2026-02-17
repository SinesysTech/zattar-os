/**
 * API Route para decodificar QR Code via 2FAuth
 *
 * POST /api/twofauth/qrcode/decode - Decodifica QR Code de imagem base64
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { decodeQRCode, TwoFAuthError } from "@/lib/integrations/twofauth/";

/**
 * @swagger
 * /api/twofauth/qrcode/decode:
 *   post:
 *     summary: Decodifica QR Code de imagem base64
 *     description: Envia uma imagem de QR Code em base64 para o 2FAuth e retorna a URI otpauth:// extraida. Util para importar contas 2FA a partir de imagens de QR Code.
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
 *               - qrcode
 *             properties:
 *               qrcode:
 *                 type: string
 *                 description: Imagem do QR Code codificada em base64 (data URL ou base64 puro)
 *     responses:
 *       200:
 *         description: QR Code decodificado com sucesso
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
 *                     data:
 *                       type: string
 *                       description: URI otpauth:// extraida do QR Code
 *       400:
 *         description: Dados invalidos - qrcode e obrigatorio
 *       401:
 *         description: Nao autenticado
 *       422:
 *         description: Imagem invalida ou QR Code nao reconhecido
 *       500:
 *         description: Erro interno ou 2FAuth nao configurado
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { qrcode: string };

    // Validar campo obrigatorio
    if (!body.qrcode) {
      return NextResponse.json(
        {
          success: false,
          error: "Campo obrigatório: qrcode",
        },
        { status: 400 }
      );
    }

    const result = await decodeQRCode(body.qrcode);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in twofauth qrcode/decode POST:", error);

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
