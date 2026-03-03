import { NextRequest, NextResponse } from "next/server";
import { updateFlags } from "@/lib/mail/imap-client";
import { authenticateMailRequest, errorResponse, handleMailError } from "@/lib/mail/api-helpers";
import type { FlagUpdateRequest } from "@/lib/mail/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const result = await authenticateMailRequest(request);
  if (result instanceof NextResponse) return result;
  const { config } = result;

  const { uid } = await params;

  try {
    const body = (await request.json()) as FlagUpdateRequest;

    if (!body.folder) {
      return errorResponse("Campo 'folder' é obrigatório", 400);
    }

    await updateFlags(config, body.folder, Number(uid), body.add ?? [], body.remove ?? []);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleMailError(err);
  }
}
