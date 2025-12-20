import {
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

import { NextRequest, NextResponse } from "next/server";

const serviceAdapter = new GoogleGenerativeAIAdapter({
  model: "gemini-3-pro-preview",
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const runtime = new CopilotRuntime();

// Criar o endpoint handler uma vez, não a cada requisição
const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  serviceAdapter,
  endpoint: "/api/copilotkit",
});

export const POST = async (req: NextRequest) => {
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("CopilotKit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
