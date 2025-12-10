# syntax=docker/dockerfile:1.4
# ============================================================================
# REQUISITO: Docker BuildKit
# ============================================================================
# Este Dockerfile usa recursos do BuildKit (--mount=type=cache).
# O BuildKit é ativado automaticamente no Docker 23.0+ ou pode ser habilitado:
#
# Opção 1: Variável de ambiente
#   export DOCKER_BUILDKIT=1
#
# Opção 2: Configuração do daemon (/etc/docker/daemon.json)
#   { "features": { "buildkit": true } }
#
# Se BuildKit não estiver disponível, remova o uso de --mount=type=cache
# na linha do "npm ci" e use: RUN npm ci --legacy-peer-deps --ignore-scripts
# ============================================================================
#
# Dockerfile para Sinesys (Next.js App)
#
# Este Dockerfile cria uma imagem LEVE do Next.js usando Turbopack.
# Turbopack é o bundler padrão no Next.js 16 e oferece builds 2-5x mais rápidos.
# O Playwright/Browser é um serviço SEPARADO (ver DEPLOY.md).
#
# Para CapRover: o arquivo captain-definition já aponta para este Dockerfile
#
# Otimizações aplicadas:
# - .dockerignore otimizado (contexto menor)
# - Memória limitada para evitar OOM no CapRover
#
# ============================================================================
# TROUBLESHOOTING
# ============================================================================
# Build acontece no GitHub Actions, não no servidor de produção.
# Se houver problemas:
# 1. Verifique logs do GitHub Actions
# 2. Verifique se secrets estão configurados (NEXT_PUBLIC_SUPABASE_*)
# 3. Veja documentação completa em DEPLOY.md
# ============================================================================
# ESTRATÉGIA GERAL DE CACHE DOCKER
# ============================================================================
# Por que multi-stage build: Reduz tamanho final da imagem (~200-300MB vs ~1GB)
# Como funciona o cache: Layers são reutilizadas se comandos não mudarem
# Importância do .dockerignore: Reduz contexto de build (~1GB → ~100MB)
# ============================================================================

# Stage 1: Dependencies
# ============================================================================
# STAGE: Dependencies
# ============================================================================
# Estratégia de cache: Copiar package.json ANTES de npm ci maximiza cache de deps
# Como funciona: Reutiliza node_modules se dependências não mudarem
# Impacto: ~60s economizados quando deps não mudam
# ============================================================================
FROM node:22-slim AS deps
WORKDIR /app

# Impedir download de browsers do Playwright (browser está em container separado)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Desabilitar telemetria o mais cedo possível para reduzir overhead
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./

# Instalar dependências com otimizações de memória e cache
# --legacy-peer-deps evita conflitos e reduz memória
# --mount=type=cache acelera reinstalações via cache npm global
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --ignore-scripts --prefer-offline

# Stage 2: Builder
# ============================================================================
# STAGE: Builder
# ============================================================================
# Estratégia de cache: Copiar node_modules do stage anterior evita reinstalar deps
# Por que COPY . . antes dos ARGs: Next.js precisa de todos os arquivos para build
# Por que não seletivo: Next.js escaneia todo o projeto
# .dockerignore reduz contexto: ~1GB → ~100MB
# ============================================================================
FROM node:22-slim AS builder
WORKDIR /app

# Memória para Node.js durante build
# Build acontece no GitHub Actions, não no CapRover
# Valor padrão do Node.js é suficiente (não precisa de otimizações agressivas)
ENV NODE_OPTIONS="--max-old-space-size=4096"
# ============================================================================
# CONFIGURAÇÃO DE MEMÓRIA
# ============================================================================
# NODE_OPTIONS="--max-old-space-size=4096" limita heap do Node.js a 4GB
#
# Build acontece no GitHub Actions (não no CapRover), então:
# - Não precisa de otimizações agressivas de memória
# - GitHub Actions tem recursos suficientes
# - Builds são mais rápidos sem parallelism=1
#
# OTIMIZAÇÕES ADICIONAIS (ver next.config.ts):
# - productionBrowserSourceMaps: false (economiza ~500MB)
# - serverSourceMaps: false (reduz tamanho da imagem)
# - output: 'standalone' (build otimizado para Docker)
# ============================================================================

# Silenciar warning do baseline-browser-mapping (não afeta funcionalidade)
ENV BROWSERSLIST_IGNORE_OLD_DATA=true

# Desabilitar lint durante build (ESLint roda separadamente via CI)
# Esta env var é necessária pois eslint config foi removido do next.config.ts (não suportado no Next.js 16)
ENV NEXT_LINT_DISABLED=true

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ============================================================================
# BUILD ARGS E ENVS
# ============================================================================
# Por que NEXT_PUBLIC_* são build args: São "inlined" no código durante build
# Por que não antes do COPY . .: Next.js precisa dos arquivos primeiro
# Impacto: Mudanças invalidam o cache do build
# ============================================================================
# Build arguments para variáveis NEXT_PUBLIC_* (obrigatórias no build)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

# Converter ARGs para ENVs para o build
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY}

# Build da aplicação usando o script específico para GitHub Actions/Docker
# Este script usa Webpack (mais estável que Turbopack para produção)
RUN npm run build:caprover

# Stage 3: Runner (imagem final leve)
# ============================================================================
# STAGE: Runner
# ============================================================================
# Estratégia: Copiar apenas arquivos necessários reduz tamanho final
# Standalone output: Inclui apenas dependências necessárias
# Tamanho final: ~200-300MB vs ~1GB sem otimização
# ============================================================================
FROM node:22-slim AS runner
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
# ============================================================================
# HEALTHCHECK E DETECÇÃO DE OOM
# ============================================================================
# Este healthcheck verifica se a aplicação está respondendo
# 
# Configurações:
# - interval=30s: Verifica a cada 30 segundos
# - timeout=10s: Falha se não responder em 10 segundos
# - start-period=40s: Aguarda 40s antes de começar (tempo de inicialização)
# - retries=3: Marca como unhealthy após 3 falhas consecutivas
# 
# Relação com OOM:
# - Se container ficar sem memória, healthcheck falhará
# - CapRover reiniciará container automaticamente
# - Logs mostrarão "unhealthy" antes do restart
# 
# Para monitorar OOM:
# - Verifique logs: docker logs <container_id>
# - Procure por: "out of memory", "heap", "killed"
# - Use: docker stats <container_id> para ver uso de memória em tempo real
# ============================================================================

CMD ["node", "server.js"]