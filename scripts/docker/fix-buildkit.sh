#!/bin/bash
# ============================================================================
# Script: fix-buildkit.sh
# Descrição: Recupera e reconstrói o BuildKit após erros de conexão
# Uso: ./scripts/docker/fix-buildkit.sh
# ============================================================================

set -e

echo "🔧 Recuperando BuildKit..."

# 1. Parar builders existentes
echo "📦 Parando builders existentes..."
docker buildx stop 2>/dev/null || true

# 2. Listar builders
echo "📋 Builders existentes:"
docker buildx ls

# 3. Remover builder padrão se existir
BUILDER_NAME="${BUILDER_NAME:-builder}"
if docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
  echo "🗑️  Removendo builder '$BUILDER_NAME'..."
  docker buildx rm "$BUILDER_NAME" || true
fi

# 4. Criar novo builder com mais recursos
echo "✨ Criando novo builder '$BUILDER_NAME'..."
docker buildx create \
  --name "$BUILDER_NAME" \
  --driver docker-container \
  --driver-opt network=host \
  --use

# 5. Inicializar builder
echo "🚀 Inicializando builder..."
docker buildx inspect --bootstrap

# 6. Verificar status
echo ""
echo "✅ Status do BuildKit:"
docker buildx ls

echo ""
echo "✅ BuildKit recuperado com sucesso!"
echo ""
echo "💡 Dicas:"
echo "   - Verifique memória: docker stats --no-stream"
echo "   - Build com: docker buildx build -t sinesys:latest ."
echo "   - Para usar sem cache: docker buildx build --no-cache -t sinesys:latest ."
