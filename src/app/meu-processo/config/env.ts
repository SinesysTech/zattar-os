// Configuração centralizada das variáveis de ambiente

// Função para obter variável de ambiente com valor padrão
const getEnv = (key: string, defaultValue: string = ''): string => {
  // No navegador, as variáveis de ambiente públicas estão disponíveis em process.env
  // No servidor, usamos process.env diretamente
  if (typeof window === 'undefined') {
    return process.env[key] || defaultValue;
  }

  // No cliente, tenta acessar variáveis de ambiente do Next.js
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextData = (window as any).__NEXT_DATA__;
  const value = nextData?.env?.[key] || '';

  return value || defaultValue;
};

// Configuração com valores padrão
const config = {
  // URL da API
  NEXT_PUBLIC_API_URL: getEnv('NEXT_PUBLIC_API_URL', 'https://workflows.platform.sinesys.app/webhook/meu-processo'),
  
  // Credenciais de autenticação Basic Auth
  NEXT_PUBLIC_AUTH_USER: getEnv('NEXT_PUBLIC_AUTH_USER', ''),
  NEXT_PUBLIC_AUTH_PASSWORD: getEnv('NEXT_PUBLIC_AUTH_PASSWORD', ''),
  
  // Token de autenticação
  NEXT_PUBLIC_AUTH_SECRET: getEnv('NEXT_PUBLIC_AUTH_SECRET', ''),
  
  // URL base da aplicação (não necessária - removida)
  
  // Ambiente
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  
  // Método auxiliar para verificar se estamos em produção
  isProduction: () => getEnv('NODE_ENV') === 'production'
};

// Validação das variáveis de ambiente necessárias
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_AUTH_USER',
  'NEXT_PUBLIC_AUTH_PASSWORD'
] as const;

// Validação apenas no servidor
if (typeof window === 'undefined') {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    const errorMsg = `Variáveis de ambiente ausentes: ${missingVars.join(', ')}`;
    console.error(`[CONFIG] ${errorMsg}`);
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    } else {
      console.warn('[CONFIG] AVISO: Executando em desenvolvimento com variáveis de ambiente ausentes');
    }
  }
}

// Log da configuração carregada
console.log('[CONFIG] Configuração carregada:', {
  ...config,
  NEXT_PUBLIC_AUTH_SECRET: config.NEXT_PUBLIC_AUTH_SECRET ? '***' : 'não configurado',
  NEXT_PUBLIC_AUTH_PASSWORD: config.NEXT_PUBLIC_AUTH_PASSWORD ? '***' : 'não configurado'
});

export default config;
