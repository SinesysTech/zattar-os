import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail/smtp-client";
import { authenticateMailRequest, errorResponse, handleMailError } from "@/lib/mail/api-helpers";
import type { SendEmailRequest } from "@/lib/mail/types";

export async function POST(request: NextRequest) {
  const result = await authenticateMailRequest(request);
  if (result instanceof NextResponse) return result;
  const { config } = result;

  try {
    const body = (await request.json()) as SendEmailRequest;

    if (!body.to || body.to.length === 0) {
      return errorResponse("Campo 'to' é obrigatório", 400);
    }
    if (!body.subject) {
      return errorResponse("Campo 'subject' é obrigatório", 400);
    }
    if (!body.text) {
      return errorResponse("Campo 'text' é obrigatório", 400);
    }

    await sendEmail(config, body);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleMailError(err);
  }
}
