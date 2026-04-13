/**
 * CopilotKit Runtime Endpoint (Next.js App Router — v2 API)
 *
 * Per-request agent creation with permission-based tool filtering:
 * 1. Authenticates user via Supabase session cookies
 * 2. getMcpToolsForUser() filters tools down to user's authorized set
 * 3. BuiltInAgent is created per-request with filtered tools
 * 4. System prompt is fetched from DB with hardcoded fallback
 *
 * Uses CopilotKit v2 API (createCopilotEndpoint + Hono).
 */

import {
  CopilotRuntime,
  createCopilotEndpoint,
} from "@copilotkit/runtime/v2";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { NextRequest, NextResponse } from "next/server";
import {
  ensureMcpToolsRegistered,
  getMcpToolsForUser,
} from "@/lib/copilotkit/mcp-bridge";
import { getPromptContent } from "@/lib/system-prompts/get-prompt";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service-client";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;

/** Ensures MCP tools are registered once (idempotent) */
let toolsInitialized = false;

async function ensureToolsInit() {
  if (!toolsInitialized) {
    await ensureMcpToolsRegistered();
    toolsInitialized = true;
  }
}

/**
 * Authenticates the user via Supabase session cookies.
 * Returns the numeric usuarioId or null if unauthenticated.
 */
async function authenticateUser(): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    const dbClient = createServiceClient();
    const { data: userData } = await dbClient
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle();

    return userData?.id ?? null;
  } catch {
    return null;
  }
}

async function handleCopilotRequest(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Copilot is not configured (missing GOOGLE_GENERATIVE_AI_API_KEY)" },
      { status: 503 },
    );
  }

  // 1. Authenticate user
  const usuarioId = await authenticateUser();
  if (!usuarioId) {
    return NextResponse.json(
      { error: "Não autorizado. Por favor faça login." },
      { status: 401 },
    );
  }

  try {
    // 2. Ensure MCP tools are registered
    await ensureToolsInit();

    // 3. Get filtered tools for this user
    const tools = await getMcpToolsForUser(usuarioId);

    // 4. Get system prompt (DB first, fallback to hardcoded)
    const prompt = await getPromptContent('copilotkit_pedrinho');

    // 5. Create agent per-request with user-specific tools
    const agent = new BuiltInAgent({
      model: "google/gemini-3.1-pro-preview-customtools",
      apiKey,
      tools,
      prompt,
      maxSteps: 5,
    });

    const runtime = new CopilotRuntime({
      agents: { default: agent },
    });

    const app = createCopilotEndpoint({
      runtime,
      basePath: "/api/copilotkit",
    });

    return app.fetch(req);
  } catch (error) {
    console.error("CopilotKit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = handleCopilotRequest;
export const POST = handleCopilotRequest;
