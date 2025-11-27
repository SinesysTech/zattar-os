import { z } from 'zod';
import { SinesysApiClient } from '../client/index.js';

export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  sessionToken?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginationInfo {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<{ items: T[]; paginacao: PaginationInfo }> {}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method: HttpMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

/**
 * Generic interface for defining an MCP tool.
 * Use this to define tools that interact with the Sinesys API via the provided client.
 * @template TInput - The type of input arguments for the tool, validated by the inputSchema.
 */
export interface ToolDefinition<TInput = unknown> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  handler: (args: TInput, client: SinesysApiClient) => Promise<ToolResponse>;
}

/**
 * Type for the response returned by an MCP tool.
 * Use this for successful tool executions to return content to the MCP client.
 */
export interface ToolResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Type for error responses from MCP tools.
 * Use this when a tool encounters an error, setting isError to true for proper handling.
 */
export interface ToolError extends ToolResponse {
  isError: true;
}
