/**
 * CopilotKit v2 Runtime Endpoint
 *
 * Usa BuiltInAgent com:
 * - Google Gemini 2.5 Flash como LLM (via AI SDK)
 * - Todas as ferramentas MCP como server tools (defineTool + Zod nativo)
 * - maxSteps: 5 para permitir chains de tool calls
 *
 * As ferramentas MCP são executadas no mesmo processo via bridge direta.
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

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export const POST = async (req: NextRequest) => {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Copilot is not configured (missing GOOGLE_GENERATIVE_AI_API_KEY)" },
      { status: 503 }
    );
  }

  try {
    // Garantir que ferramentas MCP estão registradas (idempotente)
    await ensureMcpToolsRegistered();

    // Converter MCP tools para ToolDefinition[] do v2
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
    });

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      endpoint: "/api/copilotkit",
    });

    return await handleRequest(req);
  } catch (error) {
    console.error("CopilotKit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};
