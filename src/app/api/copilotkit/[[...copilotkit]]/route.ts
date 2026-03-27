/**
 * CopilotKit v2 Runtime Endpoint (multi-route)
 *
 * Usa BuiltInAgent com:
 * - Google Gemini 2.5 Flash como LLM (via AI SDK)
 * - Todas as ferramentas MCP como server tools (defineTool + Zod nativo)
 * - maxSteps: 5 para permitir chains de tool calls
 *
 * As ferramentas MCP são executadas no mesmo processo via bridge direta.
 *
 * NOTA: Usa createCopilotEndpoint (multi-route) em vez de
 * copilotRuntimeNextJSAppRouterEndpoint (single-route) porque o SDK v2
 * do client faz requests em múltiplos endpoints:
 *   - GET  /api/copilotkit/info
 *   - POST /api/copilotkit/agent/:id/connect
 *   - POST /api/copilotkit/agent/:id/run
 *   - POST /api/copilotkit/agent/:id/stop/:threadId
 */

import { CopilotRuntime } from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { createCopilotEndpoint } from "@copilotkitnext/runtime";
import { handle } from "hono/vercel";
import { NextRequest, NextResponse } from "next/server";
import {
  ensureMcpToolsRegistered,
  getMcpToolsAsDefinitions,
} from "@/lib/copilotkit/mcp-bridge";
import { SYSTEM_PROMPT } from "@/lib/copilotkit/system-prompt";
import { SupabaseAgentRunner } from "@/lib/copilotkit/supabase-agent-runner";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// Lazy-init: cria o handler Hono multi-route uma única vez
let cachedHandler: ReturnType<typeof handle> | null = null;

async function getOrCreateHandler() {
  if (cachedHandler) return cachedHandler;

  await ensureMcpToolsRegistered();
  const tools = getMcpToolsAsDefinitions();

  const agent = new BuiltInAgent({
    model: "google/gemini-2.5-flash",
    apiKey,
    tools,
    prompt: SYSTEM_PROMPT,
    maxSteps: 5,
  });

  const runtime = new CopilotRuntime({
    agents: { default: agent },
    runner: new SupabaseAgentRunner(),
  });

  // Multi-route Hono app: GET /info, POST /agent/:id/connect, etc.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- .instance retorna o CopilotRuntime interno (@copilotkitnext/runtime)
  const internalRuntime = (runtime as any).instance;
  const app = createCopilotEndpoint({
    runtime: internalRuntime,
    basePath: "/api/copilotkit",
  });

  cachedHandler = handle(app);
  return cachedHandler;
}

async function handleRequest(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Copilot is not configured (missing GOOGLE_GENERATIVE_AI_API_KEY)" },
      { status: 503 },
    );
  }

  try {
    const handler = await getOrCreateHandler();
    return await handler(req);
  } catch (error) {
    console.error("CopilotKit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
