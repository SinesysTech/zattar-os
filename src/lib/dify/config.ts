import { z } from 'zod';

export const difyConfigSchema = z.object({
  DIFY_API_URL: z.string().url().default('https://api.dify.ai/v1'),
  DIFY_API_KEY: z.string().optional(), // API Key padrão (opcional se usar keys específicas por app)
  DIFY_CHAT_APP_KEY: z.string().optional(),
  DIFY_WORKFLOW_APP_KEY: z.string().optional(),
  DIFY_WEBHOOK_SECRET: z.string().optional(),
});

export type DifyConfig = z.infer<typeof difyConfigSchema>;

export function getDifyConfig(): DifyConfig {
  const config = {
    DIFY_API_URL: process.env.DIFY_API_URL,
    DIFY_API_KEY: process.env.DIFY_API_KEY,
    DIFY_CHAT_APP_KEY: process.env.DIFY_CHAT_APP_KEY,
    DIFY_WORKFLOW_APP_KEY: process.env.DIFY_WORKFLOW_APP_KEY,
    DIFY_WEBHOOK_SECRET: process.env.DIFY_WEBHOOK_SECRET,
  };

  const result = difyConfigSchema.safeParse(config);

  if (!result.success) {
    console.warn('⚠️ Configuração do Dify inválida ou incompleta:', result.error.format());
    return {
      DIFY_API_URL: 'https://api.dify.ai/v1',
    };
  }

  return result.data;
}

export function isDifyConfigured(appKey?: string): boolean {
  const config = getDifyConfig();
  // Se uma appKey específica for passada, verifica se ela existe.
  // Caso contrário, verifica se existe pelo menos uma chave configurada (padrão ou específica).
  if (appKey) return true;
  return !!(config.DIFY_API_KEY || config.DIFY_CHAT_APP_KEY || config.DIFY_WORKFLOW_APP_KEY);
}

export const DIFY_DEFAULT_URL = 'https://api.dify.ai/v1';
