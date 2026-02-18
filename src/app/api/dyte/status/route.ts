/**
 * API Route para verificar status da conexão Dyte
 *
 * POST /api/dyte/status - Testa conexão com configuração customizada (antes de salvar)
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";

const DYTE_API_BASE = "https://api.dyte.io/v2";

/**
 * POST /api/dyte/status
 * Testa conexão com a configuração fornecida (org_id + api_key)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { org_id, api_key } = body;

    if (!org_id || !api_key) {
      return NextResponse.json(
        { success: false, error: "org_id e api_key são obrigatórios" },
        { status: 400 }
      );
    }

    // Testar conexão listando meetings
    const token = Buffer.from(`${org_id}:${api_key}`).toString("base64");
    const response = await fetch(`${DYTE_API_BASE}/meetings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          error: response.status === 401
            ? "Credenciais inválidas. Verifique o Organization ID e API Key."
            : `Erro ao conectar: ${response.status} ${errorText}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
      },
    });
  } catch (error) {
    console.error("Error in dyte status POST:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
