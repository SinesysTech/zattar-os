# Dockerfile para Sinesys (Next.js App)
#
# Este Dockerfile cria uma imagem LEVE do Next.js.
# O Playwright/Browser é um serviço SEPARADO (ver DEPLOY.md).
#
# Para CapRover: o arquivo captain-definition já aponta para este Dockerfile
#
# Otimizações aplicadas:
# - .dockerignore otimizado (contexto menor)
# - Memória limitada para evitar OOM no CapRover
#
# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Impedir download de browsers do Playwright (browser está em container separado)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./

# Instalar dependências
RUN npm ci --ignore-scripts

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Memória para Node.js durante build
# 2GB é suficiente para Next.js e evita OOM em servidores menores
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Silenciar warning do baseline-browser-mapping (não afeta funcionalidade)
ENV BROWSERSLIST_IGNORE_OLD_DATA=true

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments para variáveis NEXT_PUBLIC_* (obrigatórias no build)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

# Converter ARGs para ENVs para o build
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY}

# Desabilitar telemetria durante build
ENV NEXT_TELEMETRY_DISABLED=1

# Limitar workers para reduzir uso de CPU (1 = sequencial, mais lento mas estável)
ENV NEXT_BUILD_WORKERS=1

# Build da aplicação (sem turbopack - mais estável)
RUN npm run build:prod

# Stage 3: Runner (imagem final leve)
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root para segurança
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Copiar arquivos necessários do build
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check integrado
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
