/**
 * Envio de notificação de prestação de contas via e-mail (SMTP do Cloudron sendmail addon).
 */

import nodemailer from 'nodemailer';

export interface EnviarEmailInput {
  destinatario: string;
  clienteNome: string;
  escritorioNome: string;
  processoNumero: string;
  linkCompleto: string;
}

export interface EnviarEmailOutput {
  messageId: string;
}

interface SmtpCreds {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName: string;
}

function resolverSmtpCreds(): SmtpCreds {
  const host =
    process.env.SYSTEM_SMTP_HOST ??
    process.env.CLOUDRON_MAIL_SMTP_SERVER ??
    '';
  const port = Number(
    process.env.SYSTEM_SMTP_PORT ??
      process.env.CLOUDRON_MAIL_SMTP_PORT ??
      '587',
  );
  const user =
    process.env.SYSTEM_SMTP_USER ??
    process.env.CLOUDRON_MAIL_SMTP_USERNAME ??
    '';
  const pass =
    process.env.SYSTEM_SMTP_PASS ??
    process.env.CLOUDRON_MAIL_SMTP_PASSWORD ??
    '';
  const from =
    process.env.SYSTEM_MAIL_FROM ??
    process.env.CLOUDRON_MAIL_FROM ??
    user;
  const fromName =
    process.env.SYSTEM_MAIL_DISPLAY_NAME ??
    process.env.CLOUDRON_MAIL_FROM_DISPLAY_NAME ??
    'ZattarOS';

  if (!host || !user || !pass || !from) {
    throw new Error(
      'Configuração SMTP do sistema incompleta. Verifique variáveis SYSTEM_SMTP_* ou CLOUDRON_MAIL_*.',
    );
  }

  return { host, port, user, pass, from, fromName };
}

function renderizarHtml(input: EnviarEmailInput): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Declaração de Prestação de Contas</title>
</head>
<body style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; background:#f6f6f6; padding:24px; color:#1f2937;">
  <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <h1 style="margin:0 0 16px; font-size:20px; color:#111827;">Prestação de Contas</h1>
    <p style="margin:0 0 12px; line-height:1.5;">
      Olá, <strong>${escapeHtml(input.clienteNome)}</strong>.
    </p>
    <p style="margin:0 0 12px; line-height:1.5;">
      O escritório <strong>${escapeHtml(input.escritorioNome)}</strong> disponibilizou a sua declaração de prestação de contas referente ao processo <strong>${escapeHtml(input.processoNumero)}</strong>.
    </p>
    <p style="margin:0 0 24px; line-height:1.5;">
      Para conferir os valores, informar seus dados bancários e assinar digitalmente, clique no botão abaixo:
    </p>
    <p style="margin:0 0 24px; text-align:center;">
      <a href="${escapeAttr(input.linkCompleto)}"
         style="display:inline-block; padding:12px 24px; background:#111827; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:500;">
        Abrir declaração
      </a>
    </p>
    <p style="margin:0 0 8px; line-height:1.5; color:#6b7280; font-size:13px;">
      Se o botão não funcionar, copie e cole esta URL no navegador:
    </p>
    <p style="margin:0 0 24px; word-break:break-all; font-size:12px; color:#4b5563;">
      ${escapeHtml(input.linkCompleto)}
    </p>
    <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />
    <p style="margin:0; color:#6b7280; font-size:12px; line-height:1.5;">
      Este link é pessoal e expira em 30 dias. Em caso de dúvida, responda este e-mail.
    </p>
  </div>
</body>
</html>`;
}

function renderizarTexto(input: EnviarEmailInput): string {
  return [
    `Olá, ${input.clienteNome}.`,
    '',
    `O escritório ${input.escritorioNome} disponibilizou a sua declaração de prestação de contas referente ao processo ${input.processoNumero}.`,
    '',
    'Para conferir os valores, informar seus dados bancários e assinar digitalmente, acesse:',
    input.linkCompleto,
    '',
    'Este link é pessoal e expira em 30 dias. Em caso de dúvida, responda este e-mail.',
    '',
    '— ZattarOS',
  ].join('\n');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

export async function enviarEmailPrestacaoContas(
  input: EnviarEmailInput,
): Promise<EnviarEmailOutput> {
  const creds = resolverSmtpCreds();

  const transporter = nodemailer.createTransport({
    host: creds.host,
    port: creds.port,
    secure: creds.port === 465,
    auth: { user: creds.user, pass: creds.pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  });

  const info = await transporter.sendMail({
    from: `"${creds.fromName}" <${creds.from}>`,
    to: input.destinatario,
    subject: `Prestação de contas — processo ${input.processoNumero}`,
    text: renderizarTexto(input),
    html: renderizarHtml(input),
  });

  return { messageId: info.messageId };
}
