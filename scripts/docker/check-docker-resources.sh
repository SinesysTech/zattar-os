#!/bin/bash
# ============================================================================
# Script: check-docker-resources.sh
# Descrição: Verifica recursos do Docker antes do build
# Uso: ./scripts/docker/check-docker-resources.sh
# ============================================================================

set -e

echo "🔍 Verificando recursos do Docker..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se Docker está rodando
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}❌ Docker não está rodando!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Docker está rodando${NC}"

# 2. Verificar BuildKit
if docker buildx version >/dev/null 2>&1; then
  echo -e "${GREEN}✅ BuildKit está disponível${NC}"
  docker buildx version
else
  echo -e "${YELLOW}⚠️  BuildKit não está disponível${NC}"
  echo "   Execute: export DOCKER_BUILDKIT=1"
fi

# 3. Verificar memória disponível
echo ""
echo "💾 Memória disponível:"
if command -v free >/dev/null 2>&1; then
  # Linux
  MEM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
  MEM_AVAIL=$(free -m | awk '/^Mem:/{print $7}')
  MEM_USED=$(free -m | awk '/^Mem:/{print $3}')
  
  echo "   Total: ${MEM_TOTAL}MB"
  echo "   Disponível: ${MEM_AVAIL}MB"
  echo "   Usada: ${MEM_USED}MB"
  
  # Recomendação: pelo menos 8GB (8192MB)
  if [ "$MEM_TOTAL" -lt 8192 ]; then
    echo -e "${YELLOW}⚠️  Memória total menor que 8GB (recomendado: 12GB+)${NC}"
  else
    echo -e "${GREEN}✅ Memória suficiente${NC}"
  fi
elif command -v vm_stat >/dev/null 2>&1; then
  # macOS
  MEM_TOTAL=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024)}')
  echo "   Total: ${MEM_TOTAL}MB"
  
  if [ "$MEM_TOTAL" -lt 8192 ]; then
    echo -e "${YELLOW}⚠️  Memória total menor que 8GB (recomendado: 12GB+)${NC}"
  else
    echo -e "${GREEN}✅ Memória suficiente${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Não foi possível verificar memória${NC}"
fi

# 4. Verificar espaço em disco
echo ""
echo "💿 Espaço em disco:"
if command -v df >/dev/null 2>&1; then
  df -h . | tail -1 | awk '{print "   Disponível: " $4 " de " $2 " (" $5 " usado)"}'
  
  # Verificar se há pelo menos 10GB livres
  AVAIL_GB=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
  if [ "$AVAIL_GB" -lt 10 ]; then
    echo -e "${YELLOW}⚠️  Menos de 10GB disponíveis (recomendado: 20GB+)${NC}"
  else
    echo -e "${GREEN}✅ Espaço em disco suficiente${NC}"
  fi
fi

# 5. Verificar uso atual do Docker
echo ""
echo "🐳 Uso atual do Docker:"
docker system df

# 6. Verificar containers rodando
echo ""
echo "📦 Containers rodando:"
RUNNING=$(docker ps -q | wc -l)
echo "   $RUNNING container(s) rodando"

if [ "$RUNNING" -gt 10 ]; then
  echo -e "${YELLOW}⚠️  Muitos containers rodando podem consumir recursos${NC}"
fi

# 7. Verificar BuildKit builders
echo ""
echo "🔨 BuildKit builders:"
if docker buildx ls >/dev/null 2>&1; then
  docker buildx ls
else
  echo -e "${YELLOW}⚠️  Nenhum builder configurado${NC}"
  echo "   Execute: ./scripts/docker/fix-buildkit.sh"
fi

# 8. Recomendações
echo ""
echo "💡 Recomendações:"
echo "   - Docker Desktop: Settings → Resources → Memory: 8GB+ (12GB recomendado)"
echo "   - Docker Desktop: Settings → Resources → Swap: 2GB+"
echo "   - Limpar cache: docker system prune -a"
echo "   - Reconstruir BuildKit: ./scripts/docker/fix-buildkit.sh"
