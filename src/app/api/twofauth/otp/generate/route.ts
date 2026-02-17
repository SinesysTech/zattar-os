/**
 * API Route para gerar OTP sob demanda via 2FAuth
 *
 * POST /api/twofauth/otp/generate - Gera OTP sem salvar conta
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  generateOTP,
  TwoFAuthError,
  type GenerateOTPParams,
} from "@/lib/integrations/twofauth/";

/**
 * @swagger
 * /api/twofauth/otp/generate:
 *   post:
 *     summary: Gera OTP sob demanda sem salvar conta
 *     description: Gera um OTP (TOTP ou HOTP) diretamente via 2FAuth sem precisar cadastrar a conta. Útil para validações pontuais ou testes.
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
 *               - secret
 *               - otp_type
 *             properties:
 *               secret:
 *                 type: string
 *                 description: Chave secreta em base32
 *               otp_type:
 *                 type: string
 *                 enum: [totp, hotp, steamtotp]
 *                 description: Tipo de OTP a ser gerado
 *               uri:
 *                 type: string
 *                 description: URI otpauth:// (alternativa ao uso de secret + otp_type)
 *               service:
 *                 type: string
 *                 description: Nome do servico (opcional, informativo)
 *               account:
 *                 type: string
 *                 description: Identificador da conta (opcional, informativo)
 *               digits:
 *                 type: integer
 *                 description: Numero de digitos do OTP
 *                 default: 6
 *               algorithm:
 *                 type: string
 *                 enum: [sha1, sha256, sha512, md5]
 *                 description: Algoritmo de hash
 *                 default: sha1
 *               period:
 *                 type: integer
 *                 description: Periodo em segundos (apenas TOTP)
 *                 default: 30
 *               counter:
 *                 type: integer
 *                 description: Contador atual (apenas HOTP)
 *     responses:
 *       200:
 *         description: OTP gerado com sucesso
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
 *                     password:
 *                       type: string
 *                       description: OTP gerado
 *                     nextPassword:
 *                       type: string
 *                       description: Proximo OTP (quando disponivel)
 *       400:
 *         description: Dados invalidos - secret e otp_type sao obrigatorios
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

    const body = (await request.json()) as GenerateOTPParams;

    // Validar campos obrigatorios
    if (!body.secret || !body.otp_type) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos obrigatórios: secret, otp_type",
        },
        { status: 400 }
      );
    }

    // Validar otp_type
    if (!["totp", "hotp", "steamtotp"].includes(body.otp_type)) {
      return NextResponse.json(
        {
          success: false,
          error: "otp_type deve ser 'totp', 'hotp' ou 'steamtotp'",
        },
        { status: 400 }
      );
    }

    const otp = await generateOTP(body);

    return NextResponse.json({
      success: true,
      data: otp,
    });
  } catch (error) {
    console.error("Error in twofauth otp/generate POST:", error);

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
