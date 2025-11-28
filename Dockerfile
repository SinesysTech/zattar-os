# Dockerfile multi-stage para Next.js com suporte ao Playwright/Firefox
# 
# IMPORTANTE: Para builds em máquinas com pouca RAM, use:
# docker build --memory=4g --memory-swap=8g ...
#
# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Copiar arquivos de dependências (sem dependências do sistema aqui)
COPY package.json package-lock.json* ./

# Remover workspace mcp do package.json para build mais leve
RUN sed -i '/"workspaces"/,/]/d' package.json || true

# Instalar dependências com cache otimizado
RUN npm ci --ignore-scripts

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Aumentar memória disponível para o Node.js durante o build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remover workspace mcp do package.json para evitar erros
RUN sed -i '/"workspaces"/,/]/d' package.json || true

# Build arguments para variáveis NEXT_PUBLIC_* (obrigatórias no build)
# Essas variáveis são inlined durante o build do Next.js
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

# Converter ARGs para ENVs para o build
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY}

# Desabilitar telemetria durante build
ENV NEXT_TELEMETRY_DISABLED=1

# Build da aplicação SEM turbopack (consome menos memória)
# Turbopack ainda é experimental para production builds
RUN npm run build:prod

# Stage 3: Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/home/nextjs/.cache/ms-playwright

# Criar usuário não-root para segurança
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Instalar dependências do sistema para Playwright/Firefox em uma única camada
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Criar diretório de cache do Playwright antes de instalar
RUN mkdir -p /home/nextjs/.cache/ms-playwright

# Instalar browsers do Playwright ANTES de copiar a aplicação
# Isso melhora o cache de camadas Docker
ENV PLAYWRIGHT_BROWSERS_PATH=/home/nextjs/.cache/ms-playwright
RUN npx -y playwright@1.56.1 install firefox \
    && chown -R nextjs:nodejs /home/nextjs/.cache

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
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]

