import type { ApiClientConfig, ApiResponse, RequestOptions } from '../types/index';
import { withRetry, isRetryableError } from './retry-logic';

export class SinesysApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Authentication priority: apiKey first, then sessionToken
    if (config.apiKey) {
      this.headers['x-service-api-key'] = config.apiKey;
    } else if (config.sessionToken) {
      this.headers['Authorization'] = `Bearer ${config.sessionToken}`;
    }
  }

  private async request<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    let url = `${this.baseUrl}${endpoint}`;

    // Add query params if provided
    if (options?.params) {
      const queryString = new URLSearchParams(
        Object.entries(options.params).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      url += `?${queryString}`;
    }

    // Prepare fetch config
    const fetchConfig: RequestInit = {
      method: options?.method || 'GET',
      headers: { ...this.headers, ...(options?.headers || {}) },
    };

    // Add body for non-GET methods if provided
    if (options?.body && fetchConfig.method !== 'GET') {
      fetchConfig.body = JSON.stringify(options.body);
    }

    // Execute fetch with retry
    const response = await withRetry(
      async () => {
        const res = await fetch(url, fetchConfig);
        if (!res.ok) {
          let errorMessage: string;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || `HTTP ${res.status}: ${res.statusText}`;
          } catch {
            const errorText = await res.text();
            errorMessage = errorText || `HTTP ${res.status}: ${res.statusText}`;
          }
          const error = new Error(errorMessage);
          (error as any).status = res.status;
          throw error;
        }
        return res;
      },
      {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        isRetryable: isRetryableError,
      }
    );

    // Parse successful response
    try {
      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (parseError) {
      // If JSON parsing fails, treat as error
      throw new Error('Invalid JSON response from server');
    }
  }

  public async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  public async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  public async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  public async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}