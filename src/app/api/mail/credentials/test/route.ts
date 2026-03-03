import { NextRequest, NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { CLOUDRON_DEFAULTS } from "@/lib/mail/credentials";

interface TestInput {
  imap_host?: string;
  imap_port?: number;
  imap_user: string;
  imap_pass: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user: string;
  smtp_pass: string;
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated || !auth.usuarioId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: TestInput;
  try {
    body = (await request.json()) as TestInput;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!body.imap_user || !body.imap_pass || !body.smtp_user || !body.smtp_pass) {
    return NextResponse.json(
      { error: "Campos imap_user, imap_pass, smtp_user e smtp_pass são obrigatórios" },
      { status: 400 }
    );
  }

  const imapHost = body.imap_host ?? CLOUDRON_DEFAULTS.imap_host;
  const imapPort = body.imap_port ?? CLOUDRON_DEFAULTS.imap_port;
  const smtpHost = body.smtp_host ?? CLOUDRON_DEFAULTS.smtp_host;
  const smtpPort = body.smtp_port ?? CLOUDRON_DEFAULTS.smtp_port;

  // Test IMAP
  let imapResult: { success: boolean; error?: string };
  try {
    const client = new ImapFlow({
      host: imapHost,
      port: imapPort,
      secure: true,
      auth: { user: body.imap_user, pass: body.imap_pass },
      logger: false,
    });
    await client.connect();
    await client.logout();
    imapResult = { success: true };
  } catch (err) {
    imapResult = {
      success: false,
      error: err instanceof Error ? err.message : "Falha na conexão IMAP",
    };
  }

  // Test SMTP
  let smtpResult: { success: boolean; error?: string };
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: { user: body.smtp_user, pass: body.smtp_pass },
      tls: { rejectUnauthorized: false },
    });
    await transporter.verify();
    smtpResult = { success: true };
  } catch (err) {
    smtpResult = {
      success: false,
      error: err instanceof Error ? err.message : "Falha na conexão SMTP",
    };
  }

  return NextResponse.json({
    imap: imapResult,
    smtp: smtpResult,
  });
}
