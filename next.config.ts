import type { NextConfig } from "next";
import path from "path";

// Limitar workers em produção (para servidores com CPU limitada)
const buildWorkers = process.env.NEXT_BUILD_WORKERS
  ? parseInt(process.env.NEXT_BUILD_WORKERS, 10)
  : undefined;

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  // Limitar CPUs durante build (reduz uso de CPU em servidores limitados)
  ...(buildWorkers && {
    experimental: {
      cpus: buildWorkers,
    },
  }),
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname),
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
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
