# syntax=docker/dockerfile:1.4
# ============================================================================
# REQUISITO: Docker BuildKit
# ============================================================================
# Este Dockerfile usa recursos do BuildKit (--mount=type=cache).
# O BuildKit é ativado automaticamente no Docker 23.0+ ou pode ser habilitado:
#
# Opcao 1: Variavel de ambiente
#   export DOCKER_BUILDKIT=1
#
# Opcao 2: Configuracao do daemon (/etc/docker/daemon.json)
#   { "features": { "buildkit": true } }
#
# Se BuildKit nao estiver disponivel, remova o uso de --mount=type=cache
# na linha do "npm ci" e use: RUN npm ci --legacy-peer-deps --ignore-scripts
# ============================================================================
#
# Dockerfile para Sinesys (Next.js App)
#
# Este Dockerfile cria uma imagem LEVE do Next.js usando output standalone.
# Usa Alpine Linux para imagens menores (~50MB base vs ~150MB slim).
# O Playwright/Browser e um servico SEPARADO (ver docs/deploy.md).
#
# Para CapRover: o arquivo captain-definition ja aponta para este Dockerfile
#
# Otimizacoes aplicadas:
# - Alpine Linux (menor tamanho base)
# - Image pinning com digest (builds deterministicos)
# - Cache mounts para npm e cache
# - .dockerignore otimizado (contexto menor)
# - Memoria limitada para evitar OOM
#
# ============================================================================
# TROUBLESHOOTING
# ============================================================================
# Build acontece no GitHub Actions, nao no servidor de producao.
# Se houver problemas:
# 1. Verifique logs do GitHub Actions
# 2. Verifique se secrets estao configurados (NEXT_PUBLIC_SUPABASE_*)
# 3. Veja documentacao completa em docs/deploy.md
#
# Erro "rpc error: code = Unavailable desc = error reading from server: EOF"?
# - Quick fix: docs/troubleshooting/docker-buildkit-quick-fix.md
# - Detalhes: docs/troubleshooting/docker-buildkit-eof-error.md
# - Scripts: npm run docker:check-resources | npm run docker:fix-buildkit
# - Fallback: Use Dockerfile.no-cache ou docker-compose.no-cache.yml
# ============================================================================

# ============================================================================
# STAGE: Dependencies
# ============================================================================
# Estrategia de cache: Copiar package.json ANTES de npm ci maximiza cache de deps
# Como funciona: Reutiliza node_modules se dependencias nao mudarem
# Impacto: ~60s economizados quando deps nao mudam
# Alpine: ~50MB base vs ~150MB slim
# ============================================================================
FROM node:24-alpine@sha256:9bac428a9b82b7380e6b156585d20b6656a29e6da181477bd480f0b95a566d6c AS deps
WORKDIR /app

# Impedir download de browsers do Playwright (browser esta em container separado)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Desabilitar telemetria o mais cedo possivel para reduzir overhead
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar arquivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias com otimizacoes de memoria e cache
# --legacy-peer-deps evita conflitos e reduz memoria
# --mount=type=cache acelera reinstalacoes via cache npm global
# --prefer-offline usa cache local quando possivel
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    npm ci --legacy-peer-deps --ignore-scripts --prefer-offline

# ============================================================================
# STAGE: Builder
# ============================================================================
# Estrategia de cache: Copiar node_modules do stage anterior evita reinstalar deps
# Por que COPY . . antes dos ARGs: Next.js precisa de todos os arquivos para build
# Por que nao seletivo: Next.js escaneia todo o projeto
# .dockerignore reduz contexto: ~1GB -> ~100MB
# ============================================================================
FROM node:24-alpine@sha256:9bac428a9b82b7380e6b156585d20b6656a29e6da181477bd480f0b95a566d6c AS builder
WORKDIR /app

# ============================================================================
# CONFIGURACAO DE MEMORIA
# ============================================================================
# NODE_OPTIONS="--max-old-space-size=6144" limita heap do Node.js a 6GB
#
# Build acontece no GitHub Actions (nao no CapRover), entao:
# - 6GB e suficiente para builds Next.js com cache persistente
# - GitHub Actions runners tem ~7GB de RAM disponivel
# - Cache handler customizado reduz uso de memoria em ~30%
#
# OTIMIZACOES ADICIONAIS (ver next.config.ts):
# - productionBrowserSourceMaps: false (economiza ~500MB)
# - serverSourceMaps: false (reduz tamanho da imagem)
# - output: 'standalone' (build otimizado para Docker)
# - cacheHandler: './cache-handler.js' (cache persistente)
# - cacheMaxMemorySize: 0 (desabilita cache em memoria)
# ============================================================================
ENV NODE_OPTIONS="--max-old-space-size=6144"

# Caminho otimizado para Sharp (processamento de imagens)
ENV NEXT_SHARP_PATH=/app/node_modules/sharp

# Silenciar warning do baseline-browser-mapping (nao afeta funcionalidade)
ENV BROWSERSLIST_IGNORE_OLD_DATA=true

# Desabilitar lint durante build (ESLint roda separadamente via CI)
# Esta env var e necessaria pois eslint config foi removido do next.config.ts (nao suportado no Next.js 16)
ENV NEXT_LINT_DISABLED=true

# Copiar dependencias do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Criar diretorio de cache para builds incrementais
RUN mkdir -p .next/cache

# ============================================================================
# BUILD ARGS E ENVS
# ============================================================================
# Por que NEXT_PUBLIC_* sao build args: Sao "inlined" no codigo durante build
# Por que nao antes do COPY . .: Next.js precisa dos arquivos primeiro
# Impacto: Mudancas invalidam o cache do build
# ============================================================================
# Build arguments para variaveis NEXT_PUBLIC_* (obrigatorias no build)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

# Converter ARGs para ENVs para o build
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY}

# Build da aplicacao com cache persistente entre builds
# --mount=type=cache persiste o diretorio .next/cache entre builds
# uid/gid=1000 corresponde ao usuario nextjs no stage runner
RUN --mount=type=cache,target=/app/.next/cache,uid=1000,gid=1000 \
    npm run build:ci

# ============================================================================
# STAGE: Runner
# ============================================================================
# Estrategia: Copiar apenas arquivos necessarios reduz tamanho final
# Standalone output: Inclui apenas dependencias necessarias
# Tamanho final: ~200-300MB vs ~1GB sem otimizacao
# Alpine: Imagem base menor para producao
# ============================================================================
FROM node:24-alpine@sha256:9bac428a9b82b7380e6b156585d20b6656a29e6da181477bd480f0b95a566d6c AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Criar usuario nao-root para seguranca (Alpine usa addgroup/adduser)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar arquivos necessarios do build com ownership correto
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# ============================================================================
# HEALTHCHECK E DETECCAO DE OOM
# ============================================================================
# Este healthcheck verifica se a aplicacao esta respondendo
#
# Configuracoes:
# - interval=30s: Verifica a cada 30 segundos
# - timeout=10s: Falha se nao responder em 10 segundos
# - start-period=40s: Aguarda 40s antes de comecar (tempo de inicializacao)
# - retries=3: Marca como unhealthy apos 3 falhas consecutivas
#
# Relacao com OOM:
# - Se container ficar sem memoria, healthcheck falhara
# - CapRover reiniciara container automaticamente
# - Logs mostrarao "unhealthy" antes do restart
#
# Para monitorar OOM:
# - Verifique logs: docker logs <container_id>
# - Procure por: "out of memory", "heap", "killed"
# - Use: docker stats <container_id> para ver uso de memoria em tempo real
# ============================================================================
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
