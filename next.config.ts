import type { NextConfig } from "next";
import path from "path";
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  // Generates a build optimized for Docker, reducing image size and improving startup time
  output: 'standalone',
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  // Disables browser source maps in production to save ~500MB during build and reduce bundle size
  productionBrowserSourceMaps: false,
  experimental: {
    // Disables server source maps to reduce memory usage in the server runtime
    serverSourceMaps: false,
    // Reduces memory usage during build by optimizing webpack's memory management
    webpackMemoryOptimizations: true,
    // Uses a separate worker for building, which can improve performance and stability
    webpackBuildWorker: true,
    // preloadEntriesOnStart: false, // Reduces initial memory usage but may affect performance
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
    if (process.env.ANALYZE === 'true') {
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

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
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