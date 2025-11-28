# Dockerfile para Sinesys MCP Server
# Servidor MCP para integração com agentes de IA
#
# Build: docker build -t sinesys-mcp:latest ./mcp
# Run: docker run -p 3001:3001 sinesys-mcp:latest

# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript
RUN npm run build

# Stage 3: Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Criar usuário não-root
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 mcp

# Copiar apenas arquivos necessários
COPY --from=builder --chown=mcp:nodejs /app/build ./build
COPY --from=builder --chown=mcp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=mcp:nodejs /app/package.json ./package.json

USER mcp

# MCP Server usa stdio por padrão, mas podemos expor HTTP se necessário
EXPOSE 3001

ENV PORT=3001

# Health check simples
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "console.log('ok')" || exit 1

CMD ["node", "build/index.js"]

