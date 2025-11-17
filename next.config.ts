import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilitar output standalone para Docker
  output: 'standalone',
  
  // Configuração vazia do Turbopack para permitir usar webpack
  // (necessário no Next.js 16 que usa Turbopack por padrão)
  turbopack: {},
  
  // Configurações para exibir warnings durante o build
  webpack: (config) => {
    // Garantir que warnings sejam exibidos
    config.infrastructureLogging = {
      level: 'verbose',
    };
    
    // Configurar para mostrar todos os warnings do webpack
    config.ignoreWarnings = [];
    
    // Garantir que warnings sejam tratados como warnings, não suprimidos
    config.stats = {
      ...config.stats,
      warnings: true,
      warningsFilter: undefined, // Não filtrar nenhum warning
    };
    
    return config;
  },
  
  // Garantir que warnings do TypeScript sejam exibidos
  typescript: {
    // Não ignorar erros de tipo durante o build
    ignoreBuildErrors: false,
  },
  
  // Configuração de logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
