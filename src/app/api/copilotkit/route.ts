import {
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

let handleRequest: ((req: NextRequest) => Promise<Response> | Response) | null = null;

if (apiKey) {
  try {
    const serviceAdapter = new GoogleGenerativeAIAdapter({
      model: "gemini-1.5-pro",
      apiKey: apiKey,
    });

    const runtime = new CopilotRuntime();

    const endpoint = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    handleRequest = endpoint.handleRequest;
  } catch (err) {
    console.error("Failed to initialize CopilotKit:", err);
  }
}

export const POST = async (req: NextRequest) => {
  if (!handleRequest) {
    return NextResponse.json(
      { error: "Copilot is not configured (missing API key)" },
      { status: 503 }
    );
  }

  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("CopilotKit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};
