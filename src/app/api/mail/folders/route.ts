import { NextRequest, NextResponse } from "next/server";
import { listFolders } from "@/lib/mail/imap-client";
import { authenticateMailRequest, handleMailError } from "@/lib/mail/api-helpers";

export async function GET(request: NextRequest) {
  const result = await authenticateMailRequest(request);
  if (result instanceof NextResponse) return result;
  const { config } = result;

  try {
    const folders = await listFolders(config);
    return NextResponse.json({ folders });
  } catch (err) {
    return handleMailError(err);
  }
}
