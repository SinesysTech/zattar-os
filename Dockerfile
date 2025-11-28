# Dockerfile para Sinesys (Next.js App)
# 
# Este Dockerfile cria uma imagem LEVE do Next.js.
# O Playwright/Browser é um serviço SEPARADO (ver DEPLOY.md).
#
# Para CapRover: o arquivo captain-definition já aponta para este Dockerfile
#
# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./

# Instalar dependências (sem scripts para evitar problemas com binários nativos)
RUN npm ci --ignore-scripts

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Aumentar memória disponível para o Node.js durante o build
ENV NODE_OPTIONS="--max-old-space-size=4096"

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

# Build da aplicação SEM turbopack (mais estável e consome menos memória)
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
