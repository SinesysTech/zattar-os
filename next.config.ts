import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Habilitar output standalone para Docker
  output: 'standalone',

  // Externalizar pacotes que causam problemas com Server Components
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],

  
  
  // Configurações para exibir warnings durante o build
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };
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
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
