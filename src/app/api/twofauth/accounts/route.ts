/**
 * API Routes para contas 2FAuth
 *
 * GET  /api/twofauth/accounts - Lista todas as contas
 * POST /api/twofauth/accounts - Cria uma nova conta
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  listAccounts,
  createAccount,
  TwoFAuthError,
  type CreateAccountParams,
} from "@/lib/integrations/twofauth/";

/**
 * @swagger
 * /api/twofauth/accounts:
 *   get:
 *     summary: Lista contas do 2FAuth
 *     description: Retorna uma lista de todas as contas 2FA cadastradas no servidor 2FAuth
 *     tags:
 *       - 2FAuth
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de contas retornada com sucesso
 *       401:
 *         description: Nao autenticado
 *       500:
 *         description: Erro interno ou 2FAuth nao configurado
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await listAccounts();

    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error("Error in twofauth accounts GET:", error);

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
 * /api/twofauth/accounts:
 *   post:
 *     summary: Cria uma nova conta 2FA
 *     description: Adiciona uma nova conta 2FA ao servidor 2FAuth
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
 *               - service
 *               - secret
 *               - otp_type
 *             properties:
 *               service:
 *                 type: string
 *                 description: Nome do servico (ex Google, GitHub)
 *               account:
 *                 type: string
 *                 description: Identificador da conta (ex email)
 *               secret:
 *                 type: string
 *                 description: Chave secreta em base32
 *               otp_type:
 *                 type: string
 *                 enum: [totp, hotp]
 *               digits:
 *                 type: integer
 *                 default: 6
 *               algorithm:
 *                 type: string
 *                 enum: [sha1, sha256, sha512]
 *                 default: sha1
 *               period:
 *                 type: integer
 *                 default: 30
 *               group_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Conta criada com sucesso
 *       400:
 *         description: Dados invalidos
 *       401:
 *         description: Nao autenticado
 *       500:
 *         description: Erro interno
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateAccountParams;

    // Validar campos obrigatorios
    if (!body.service || !body.secret || !body.otp_type) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos obrigatórios: service, secret, otp_type",
        },
        { status: 400 }
      );
    }

    // Validar otp_type
    if (!["totp", "hotp"].includes(body.otp_type)) {
      return NextResponse.json(
        {
          success: false,
          error: "otp_type deve ser 'totp' ou 'hotp'",
        },
        { status: 400 }
      );
    }

    const account = await createAccount(body);

    return NextResponse.json(
      {
        success: true,
        data: account,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in twofauth accounts POST:", error);

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
