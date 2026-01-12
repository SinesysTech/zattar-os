#!/bin/bash
# ============================================================================
# Script: check-memory-requirements.sh
# Descrição: Verifica se há memória suficiente para o build
# Uso: ./scripts/docker/check-memory-requirements.sh
# ============================================================================

set -e

echo "🔍 Verificando requisitos de memória para build..."
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar memória do Docker Desktop
echo "💾 Memória do Docker Desktop:"
if command -v docker >/dev/null 2>&1; then
  # Tentar obter memória do Docker (pode não funcionar em todos os sistemas)
  DOCKER_MEM=$(docker info 2>/dev/null | grep -i "Total Memory" | awk '{print $3}' || echo "N/A")
  if [ "$DOCKER_MEM" != "N/A" ]; then
    echo "   Docker: $DOCKER_MEM"
  fi
fi

# Verificar memória do sistema (Windows via WSL ou Linux)
if [ -f /proc/meminfo ]; then
  # Linux/WSL
  TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print $2}')
  TOTAL_MEM_GB=$((TOTAL_MEM / 1024 / 1024))
  AVAIL_MEM=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
  AVAIL_MEM_GB=$((AVAIL_MEM / 1024 / 1024))
  
  echo "   Sistema Total: ${TOTAL_MEM_GB}GB"
  echo "   Sistema Disponível: ${AVAIL_MEM_GB}GB"
  
  # Requisitos REALISTAS
  # - Dockerfile padrão (modo experimental): 12GB recomendado
  # - Dockerfile.efficient (Webpack): 6GB suficiente
  # - Dockerfile.low-memory: 8GB suficiente
  REQUIRED_DOCKER_EFFICIENT=6
  REQUIRED_DOCKER_LOW=8
  RECOMMENDED_DOCKER=12
  
  echo ""
  echo "📋 Requisitos por Dockerfile:"
  echo "   Dockerfile.efficient (Webpack): ${REQUIRED_DOCKER_EFFICIENT}GB - RECOMENDADO"
  echo "   Dockerfile.low-memory: ${REQUIRED_DOCKER_LOW}GB"
  echo "   Dockerfile padrão (experimental): ${RECOMMENDED_DOCKER}GB"
  echo ""
  
  if [ "$TOTAL_MEM_GB" -lt "$REQUIRED_DOCKER_EFFICIENT" ]; then
    echo -e "${RED}❌ Memória muito baixa!${NC}"
    echo "   Sistema tem apenas ${TOTAL_MEM_GB}GB"
    echo ""
    echo "💡 Soluções:"
    echo "   1. Aumente memória do Docker Desktop para ${REQUIRED_DOCKER_EFFICIENT}GB+"
    echo "   2. Use: npm run docker:build:efficient"
    exit 1
  elif [ "$TOTAL_MEM_GB" -lt "$REQUIRED_DOCKER_LOW" ]; then
    echo -e "${YELLOW}⚠️  Memória baixa para build padrão${NC}"
    echo "   Sistema tem ${TOTAL_MEM_GB}GB"
    echo ""
    echo "💡 Use build eficiente (Webpack):"
    echo "   npm run docker:build:efficient"
  elif [ "$TOTAL_MEM_GB" -lt "$RECOMMENDED_DOCKER" ]; then
    echo -e "${GREEN}✅ Memória suficiente para build eficiente${NC}"
    echo "   Sistema tem ${TOTAL_MEM_GB}GB"
    echo ""
    echo "💡 Recomendado:"
    echo "   npm run docker:build:efficient  (usa Webpack, mais estável)"
  else
    echo -e "${GREEN}✅ Memória suficiente para qualquer build${NC}"
  fi
else
  # Windows (sem WSL) - não consegue verificar diretamente
  echo -e "${YELLOW}⚠️  Não foi possível verificar memória automaticamente${NC}"
  echo ""
  echo "💡 Verifique manualmente:"
  echo "   Docker Desktop → Settings → Resources → Memory"
  echo "   Mínimo: 8GB | Recomendado: 12GB"
fi

echo ""
echo "📊 Configuração dos Dockerfiles:"
echo "   Dockerfile.efficient: 3GB heap + Webpack (RECOMENDADO - funciona com 6GB Docker)"
echo "   Dockerfile.low-memory: 4GB heap + modo experimental (funciona com 8GB Docker)"
echo "   Dockerfile padrão: 6GB heap + modo experimental (precisa 12GB Docker)"
echo ""
echo "💡 Recomendação:"
echo "   Use: npm run docker:build:efficient"
echo "   Funciona com Docker Desktop de apenas 6GB!"
