import { NextRequest, NextResponse } from "next/server";
import { listMessages } from "@/lib/mail/imap-client";
import { authenticateMailRequest, errorResponse, handleMailError } from "@/lib/mail/api-helpers";

export async function GET(request: NextRequest) {
  const result = await authenticateMailRequest(request);
  if (result instanceof NextResponse) return result;
  const { config } = result;

  const { searchParams } = request.nextUrl;
  const folder = searchParams.get("folder");
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "50");

  if (!folder) {
    return errorResponse("Parâmetro 'folder' é obrigatório", 400);
  }

  try {
    const data = await listMessages(config, folder, page, limit);
    return NextResponse.json(data);
  } catch (err) {
    return handleMailError(err);
  }
}
