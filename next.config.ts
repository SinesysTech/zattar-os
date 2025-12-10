import type { NextConfig } from "next";
import path from "path";
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  // Generates a build optimized for Docker, reducing image size and improving startup time
  output: 'standalone',
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  // Disables browser source maps in production to save ~500MB during build and reduce bundle size
  productionBrowserSourceMaps: false,
  // Exclude test files from compilation
  excludeDefaultMomentLocales: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].filter(ext => !ext.includes('test')),
  // ESLint disabled via NEXT_LINT_DISABLED=true in Dockerfile
  // (eslint config key removed - not supported in Next.js 16)
  experimental: {
    // Server source maps desabilitados para reduzir tamanho da imagem Docker
    serverSourceMaps: false,
  },
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname),
    },
  },
  typescript: {
    // Allows builds to proceed even with TypeScript errors; useful for rapid development but risky as it may hide bugs
    // Risks: Potential runtime errors from type mismatches; consider removing and fixing errors gradually
    ignoreBuildErrors: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  allowedDevOrigins: ['192.168.1.100', '192.168.1.100:3000'],
  webpack: (config, { isServer }) => {
    // Otimizar webpack para builds determinísticos
    config.optimization = config.optimization || {};
    config.optimization.moduleIds = 'deterministic';

    // Exclude test files from bundle
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /node_modules\/@copilotkit\/runtime\/node_modules\/thread-stream\/test\/.*/,
      use: 'null-loader',
    });

    if (process.env.ANALYZE === 'true') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- require necessário em configuração webpack
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
          openAnalyzer: false,
        })
      );
    }
    return config;
  },
};

// ============================================================================
// PWA Configuration (@ducanh2912/next-pwa)
// ============================================================================
// Generates a production-ready service worker with Workbox strategies.
// IMPORTANT: Requires Webpack build (use 'npm run build:prod').
// The service worker is auto-generated in public/ during build and ignored by git.
// See DEPLOY.md section "Progressive Web App (PWA)" for troubleshooting.
export default withPWA({
  // Destination folder for generated service worker files
  dest: 'public',
  // Disable PWA in development to avoid caching issues
  disable: process.env.NODE_ENV === 'development',
  // Automatically register the service worker (no manual registration needed)
  register: true,
  // Fallback page when offline
  fallbacks: {
    document: '/offline',
  },
  // Workbox caching strategies
  workboxOptions: {
    // Activate new service worker immediately
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        urlPattern: /\/_next\/static.+\.js$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static-js',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        // Exclude /api/health from caching - always fetch from network
        urlPattern: /\/api\/health$/,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\/api\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
})(nextConfig);