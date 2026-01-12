#!/bin/bash
# ============================================================================
# Script: build-no-cache.sh
# Descrição: Build usando Dockerfile alternativo (sem cache mounts ou sem syntax)
# Uso: ./scripts/docker/build-no-cache.sh [dockerfile]
# Exemplos:
#   ./scripts/docker/build-no-cache.sh                    # Usa Dockerfile.no-cache
#   ./scripts/docker/build-no-cache.sh Dockerfile.no-syntax  # Usa Dockerfile.no-syntax
# ============================================================================

set -e

# Dockerfile a usar (padrão: Dockerfile.no-cache)
DOCKERFILE="${1:-Dockerfile.no-cache}"

echo "🔨 Iniciando build com $DOCKERFILE..."
echo ""

# Carregar variáveis do .env.local se existir
if [ -f .env.local ]; then
  echo "📋 Carregando variáveis de .env.local..."
  export $(grep -v '^#' .env.local | grep -E '^NEXT_PUBLIC_SUPABASE' | xargs)
fi

# Verificar se variáveis estão definidas
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY" ]; then
  echo "❌ Erro: Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY são obrigatórias"
  echo ""
  echo "Defina-as no .env.local ou exporte-as:"
  echo "  export NEXT_PUBLIC_SUPABASE_URL=..."
  echo "  export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=..."
  exit 1
fi

echo "✅ Variáveis de ambiente configuradas"
echo "   NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
echo ""

# Verificar se Dockerfile existe
if [ ! -f "$DOCKERFILE" ]; then
  echo "❌ Erro: Dockerfile '$DOCKERFILE' não encontrado!"
  exit 1
fi

# Build usando Dockerfile alternativo
echo "🚀 Executando build com $DOCKERFILE..."
if [ "$DOCKERFILE" = "Dockerfile.no-syntax" ]; then
  echo "   (Sem syntax directive - evita problemas de proxy/rede)"
else
  echo "   (Sem cache mount - evita problemas de conexão BuildKit)"
fi
echo ""

docker build \
  -f "$DOCKERFILE" \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY="$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY" \
  -t sinesys:latest \
  .

echo ""
echo "✅ Build concluído com sucesso!"
echo ""
echo "💡 Para executar o container:"
echo "   docker run -p 3000:3000 sinesys:latest"
