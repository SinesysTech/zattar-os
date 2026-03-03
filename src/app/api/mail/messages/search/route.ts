import { NextRequest, NextResponse } from "next/server";
import { searchMessages } from "@/lib/mail/imap-client";
import { authenticateMailRequest, errorResponse, handleMailError } from "@/lib/mail/api-helpers";

export async function GET(request: NextRequest) {
  const result = await authenticateMailRequest(request);
  if (result instanceof NextResponse) return result;
  const { config } = result;

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");
  const folder = searchParams.get("folder") ?? "INBOX";

  if (!q) {
    return errorResponse("Parâmetro 'q' é obrigatório", 400);
  }

  try {
    const messages = await searchMessages(config, folder, q);
    return NextResponse.json({ messages, total: messages.length });
  } catch (err) {
    return handleMailError(err);
  }
}
