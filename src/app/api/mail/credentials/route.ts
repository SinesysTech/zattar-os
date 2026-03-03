import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  getEmailCredentials,
  saveEmailCredentials,
  deleteEmailCredentials,
  type SaveEmailCredentialsInput,
} from "@/lib/mail/credentials";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated || !auth.usuarioId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const creds = await getEmailCredentials(auth.usuarioId);
  if (!creds) {
    return NextResponse.json({ configured: false });
  }

  // Retorna credenciais com senha mascarada
  return NextResponse.json({
    configured: true,
    credentials: {
      id: creds.id,
      imap_host: creds.imap_host,
      imap_port: creds.imap_port,
      imap_user: creds.imap_user,
      imap_pass: "••••••••",
      smtp_host: creds.smtp_host,
      smtp_port: creds.smtp_port,
      smtp_user: creds.smtp_user,
      smtp_pass: "••••••••",
      active: creds.active,
      updated_at: creds.updated_at,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated || !auth.usuarioId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as SaveEmailCredentialsInput;

    if (!body.imap_user || !body.imap_pass || !body.smtp_user || !body.smtp_pass) {
      return NextResponse.json(
        { error: "Campos imap_user, imap_pass, smtp_user e smtp_pass são obrigatórios" },
        { status: 400 }
      );
    }

    const creds = await saveEmailCredentials(auth.usuarioId, body);

    return NextResponse.json({
      success: true,
      credentials: {
        id: creds.id,
        imap_host: creds.imap_host,
        imap_port: creds.imap_port,
        imap_user: creds.imap_user,
        smtp_host: creds.smtp_host,
        smtp_port: creds.smtp_port,
        smtp_user: creds.smtp_user,
        active: creds.active,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao salvar credenciais";
    console.error("[mail-credentials]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated || !auth.usuarioId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    await deleteEmailCredentials(auth.usuarioId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao remover credenciais";
    console.error("[mail-credentials]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
