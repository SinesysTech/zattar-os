import { z } from 'zod';

// ---------------------------------------------------------------------------
// Environment variable schema
// ---------------------------------------------------------------------------

const difyEnvSchema = z.object({
  DIFY_API_URL: z.string().url().default('https://api.dify.ai/v1'),
  DIFY_API_KEY: z.string().min(1).optional(),
  DIFY_CHAT_APP_KEY: z.string().min(1).optional(),
  DIFY_WORKFLOW_APP_KEY: z.string().min(1).optional(),
  DIFY_WEBHOOK_SECRET: z.string().min(1).optional(),
});

export type DifyEnv = z.infer<typeof difyEnvSchema>;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

let _config: DifyEnv | null = null;

export function getDifyConfig(): DifyEnv {
  if (_config) return _config;

  const result = difyEnvSchema.safeParse({
    DIFY_API_URL: process.env.DIFY_API_URL,
    DIFY_API_KEY: process.env.DIFY_API_KEY,
    DIFY_CHAT_APP_KEY: process.env.DIFY_CHAT_APP_KEY,
    DIFY_WORKFLOW_APP_KEY: process.env.DIFY_WORKFLOW_APP_KEY,
    DIFY_WEBHOOK_SECRET: process.env.DIFY_WEBHOOK_SECRET,
  });

  if (!result.success) {
    console.warn('[Dify] Configuração inválida:', result.error.flatten().fieldErrors);
    _config = {
      DIFY_API_URL: 'https://api.dify.ai/v1',
      DIFY_API_KEY: undefined,
      DIFY_CHAT_APP_KEY: undefined,
      DIFY_WORKFLOW_APP_KEY: undefined,
      DIFY_WEBHOOK_SECRET: undefined,
    };
    return _config;
  }

  _config = result.data;
  return _config;
}

/**
 * Verifica se o Dify está configurado (pelo menos uma API key presente).
 */
export function isDifyConfigured(): boolean {
  const config = getDifyConfig();
  return !!(config.DIFY_API_KEY || config.DIFY_CHAT_APP_KEY || config.DIFY_WORKFLOW_APP_KEY);
}

/**
 * Retorna a API key para o tipo de app especificado.
 * Prioridade: key específica do app → key padrão.
 */
export function getApiKeyForApp(appType: 'chat' | 'workflow' | 'default'): string | undefined {
  const config = getDifyConfig();

  switch (appType) {
    case 'chat':
      return config.DIFY_CHAT_APP_KEY || config.DIFY_API_KEY;
    case 'workflow':
      return config.DIFY_WORKFLOW_APP_KEY || config.DIFY_API_KEY;
    default:
      return config.DIFY_API_KEY;
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DIFY_DEFAULT_URL = 'https://api.dify.ai/v1';
export const DIFY_REQUEST_TIMEOUT = 30_000;
export const DIFY_STREAM_TIMEOUT = 120_000;
export const DIFY_MAX_RETRIES = 3;
