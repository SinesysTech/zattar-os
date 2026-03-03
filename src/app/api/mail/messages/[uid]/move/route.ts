import { NextRequest, NextResponse } from "next/server";
import { moveMessage } from "@/lib/mail/imap-client";
import { authenticateMailRequest, errorResponse, handleMailError } from "@/lib/mail/api-helpers";
import type { MoveRequest } from "@/lib/mail/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const result = await authenticateMailRequest(request);
  if (result instanceof NextResponse) return result;
  const { config } = result;

  const { uid } = await params;

  try {
    const body = (await request.json()) as MoveRequest;

    if (!body.fromFolder || !body.toFolder) {
      return errorResponse("Campos 'fromFolder' e 'toFolder' são obrigatórios", 400);
    }

    await moveMessage(config, body.fromFolder, Number(uid), body.toFolder);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleMailError(err);
  }
}
