/**
 * CopilotKit Runtime Endpoint (Next.js App Router)
 *
 * Usa BuiltInAgent com:
 * - Google Gemini como LLM (via AI SDK)
 * - Todas as ferramentas MCP como server tools (defineTool + Zod nativo)
 * - maxSteps: 5 para permitir chains de tool calls
 *
 * As ferramentas MCP são executadas no mesmo processo via bridge direta.
 *
 * Segue o padrão oficial da documentação CopilotKit v1.54:
 * https://docs.copilotkit.ai/integrations/built-in-agent/quickstart
 */

import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { NextRequest, NextResponse } from "next/server";
import {
  ensureMcpToolsRegistered,
  getMcpToolsAsDefinitions,
} from "@/lib/copilotkit/mcp-bridge";
import { SYSTEM_PROMPT } from "@/lib/copilotkit/system-prompt";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;

// Lazy-init: cria o runtime uma única vez
let cachedRuntime: CopilotRuntime | null = null;

async function getOrCreateRuntime() {
  if (cachedRuntime) return cachedRuntime;

  await ensureMcpToolsRegistered();
  const tools = getMcpToolsAsDefinitions();

  const agent = new BuiltInAgent({
    model: "google/gemini-3.1-pro-preview-customtools",
    apiKey,
    tools,
    prompt: SYSTEM_PROMPT,
    maxSteps: 5,
  });

  cachedRuntime = new CopilotRuntime({
    agents: { default: agent },
  });

  return cachedRuntime;
}

async function handleCopilotRequest(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Copilot is not configured (missing GOOGLE_GENERATIVE_AI_API_KEY)" },
      { status: 503 },
    );
  }

  try {
    const runtime = await getOrCreateRuntime();
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      endpoint: "/api/copilotkit",
    });

    return handleRequest(req);
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
