/**
 * CopilotKit Runtime Endpoint (Next.js App Router — v2 API)
 *
 * Usa BuiltInAgent com:
 * - Google Gemini como LLM (via AI SDK)
 * - Todas as ferramentas MCP como server tools (defineTool + Zod nativo)
 * - maxSteps: 5 para permitir chains de tool calls
 *
 * As ferramentas MCP são executadas no mesmo processo via bridge direta.
 *
 * Usa a API v2 do CopilotKit (createCopilotEndpoint + Hono) que é compatível
 * com o client v2 (@copilotkit/react-core/v2) e serve os endpoints:
 * /info, /agent/:name/connect, /agent/:name/run, etc.
 */

import {
  CopilotRuntime,
  createCopilotEndpoint,
} from "@copilotkit/runtime/v2";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { NextRequest, NextResponse } from "next/server";
import {
  ensureMcpToolsRegistered,
  getMcpToolsAsDefinitions,
} from "@/lib/copilotkit/mcp-bridge";
import { SYSTEM_PROMPT } from "@/lib/copilotkit/system-prompt";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;

// Lazy-init: cria o Hono app uma única vez
let cachedApp: { fetch: (req: Request) => Response | Promise<Response> } | null = null;

async function getOrCreateApp() {
  if (cachedApp) return cachedApp;

  await ensureMcpToolsRegistered();
  const tools = getMcpToolsAsDefinitions();

  const agent = new BuiltInAgent({
    model: "google/gemini-3.1-pro-preview-customtools",
    apiKey,
    tools,
    prompt: SYSTEM_PROMPT,
    maxSteps: 5,
  });

  const runtime = new CopilotRuntime({
    agents: { default: agent },
  });

  cachedApp = createCopilotEndpoint({
    runtime,
    basePath: "/api/copilotkit",
  });

  return cachedApp;
}

async function handleCopilotRequest(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Copilot is not configured (missing GOOGLE_GENERATIVE_AI_API_KEY)" },
      { status: 503 },
    );
  }

  try {
    const app = await getOrCreateApp();
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
