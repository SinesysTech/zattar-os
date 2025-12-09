# syntax=docker/dockerfile:1.4
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
# TROUBLESHOOTING DE MEMÓRIA
# ============================================================================
# Se o build falhar com OOM:
# 1. Verifique memória disponível no servidor: free -h
# 2. Aumente memória do build no CapRover (App Configs → Build Memory)
# 3. Considere adicionar swap: sudo fallocate -l 4G /swapfile
# 4. Execute script de verificação: bash scripts/check-build-memory.sh
# 5. Veja documentação completa em DEPLOY.md seção "Proteções Contra OOM"
# 
# Sintomas comuns de OOM:
# - "JavaScript heap out of memory" → Aumentar NODE_OPTIONS
# - "Killed" ou exit code 137 → Sistema matou processo, adicionar swap
# - Build muito lento → Usando swap, aumentar RAM física
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
FROM node:20-slim AS deps
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
FROM node:20-slim AS builder
WORKDIR /app

# Memória para Node.js durante build
# 6GB é necessário para projetos grandes com muitas dependências (+150 deps)
# Aumentado de 4GB para 6GB para evitar OOM durante build
ENV NODE_OPTIONS="--max-old-space-size=6144"
# ============================================================================
# CONFIGURAÇÃO DE MEMÓRIA PARA PREVENIR OOM
# ============================================================================
# NODE_OPTIONS="--max-old-space-size=6144" limita heap do Node.js a 6GB
#
# OTIMIZAÇÕES ADICIONAIS (ver next.config.ts):
# - webpackMemoryOptimizations: true (reduz uso de memória)
# - productionBrowserSourceMaps: false (economiza ~500MB)
# - serverSourceMaps: false (reduz memória do servidor)
# - output: 'standalone' (build otimizado para Docker)
# - parallelism: 1 (reduz uso de memória durante build)
#
# Por que 6GB?
# - Next.js build com muitas dependências consome ~4-5GB em projetos grandes
# - Projeto tem +150 dependências (Plate.js, CopilotKit, Supabase, etc.)
# - Deixa margem para webpack e outros processos
# - Total recomendado no servidor: 8-10GB RAM (6GB Node + 2-4GB sistema)
#
# Quando aumentar este valor:
# - Build falha com "JavaScript heap out of memory"
# - Servidor tem >12GB RAM disponível
# - Projeto continua crescendo em complexidade
#
# Valores alternativos:
# - Projetos pequenos: --max-old-space-size=2048 (2GB)
# - Projetos médios: --max-old-space-size=4096 (4GB)
# - Projetos grandes: --max-old-space-size=6144 (6GB) [ATUAL]
# - Projetos muito grandes: --max-old-space-size=8192 (8GB)
#
# IMPORTANTE: Aumentar este valor requer aumentar memória do CapRover
# proporcionalmente (ver DEPLOY.md seção "Proteções Contra OOM")
# ============================================================================

# Silenciar warning do baseline-browser-mapping (não afeta funcionalidade)
ENV BROWSERSLIST_IGNORE_OLD_DATA=true

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

# Build da aplicação usando Webpack (mais estável para produção)
# Webpack é production-ready e tem melhor suporte
# Nota: Turbopack ainda é experimental para builds de produção
# Script build:caprover inclui NODE_OPTIONS=6144 e ESLINT_NO_DEV_ERRORS=true
RUN npm run build:caprover

# Stage 3: Runner (imagem final leve)
# ============================================================================
# STAGE: Runner
# ============================================================================
# Estratégia: Copiar apenas arquivos necessários reduz tamanho final
# Standalone output: Inclui apenas dependências necessárias
# Tamanho final: ~200-300MB vs ~1GB sem otimização
# ============================================================================
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