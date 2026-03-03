import { NextRequest, NextResponse } from "next/server";
import { getMessage, moveMessage } from "@/lib/mail/imap-client";
import { authenticateMailRequest, errorResponse, handleMailError } from "@/lib/mail/api-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const result = await authenticateMailRequest(request);
  if (result instanceof NextResponse) return result;
  const { config } = result;

  const { uid } = await params;
  const folder = request.nextUrl.searchParams.get("folder");

  if (!folder) {
    return errorResponse("Parâmetro 'folder' é obrigatório", 400);
  }

  try {
    const message = await getMessage(config, folder, Number(uid));
    if (!message) {
      return errorResponse("Mensagem não encontrada", 404);
    }
    return NextResponse.json(message);
  } catch (err) {
    return handleMailError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const result = await authenticateMailRequest(request);
  if (result instanceof NextResponse) return result;
  const { config } = result;

  const { uid } = await params;
  const folder = request.nextUrl.searchParams.get("folder");

  if (!folder) {
    return errorResponse("Parâmetro 'folder' é obrigatório", 400);
  }

  try {
    await moveMessage(config, folder, Number(uid), "Trash");
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleMailError(err);
  }
}
