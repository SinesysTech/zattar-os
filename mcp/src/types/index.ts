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