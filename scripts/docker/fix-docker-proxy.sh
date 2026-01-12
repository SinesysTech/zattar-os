#!/bin/bash
# ============================================================================
# Script: fix-docker-proxy.sh
# Descrição: Corrige problemas de proxy/rede do Docker Desktop
# Uso: ./scripts/docker/fix-docker-proxy.sh
# ============================================================================

set -e

echo "🔧 Corrigindo problemas de proxy/rede do Docker..."
echo ""

# 1. Verificar se Docker está rodando
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker não está rodando!"
  exit 1
fi

echo "✅ Docker está rodando"
echo ""

# 2. Verificar configurações de proxy
echo "📋 Verificando configurações de proxy..."
echo ""

# Verificar se há proxy configurado
if docker info 2>/dev/null | grep -i proxy >/dev/null; then
  echo "⚠️  Proxy detectado nas configurações do Docker"
  docker info 2>/dev/null | grep -i proxy || true
else
  echo "✅ Nenhum proxy configurado"
fi

echo ""
echo "💡 Soluções:"
echo ""
echo "1. Docker Desktop → Settings → Resources → Network:"
echo "   - Desabilite 'Use kernel networking for UDP' se estiver habilitado"
echo "   - Verifique se não há proxy configurado"
echo ""
echo "2. Docker Desktop → Settings → Docker Engine:"
echo "   - Remova configurações de proxy se existirem"
echo "   - Exemplo de configuração limpa:"
echo "     {"
echo "       \"features\": {"
echo "         \"buildkit\": true"
echo "       }"
echo "     }"
echo ""
echo "3. Reiniciar Docker Desktop:"
echo "   - Feche completamente o Docker Desktop"
echo "   - Abra novamente"
echo ""
echo "4. Usar Dockerfile alternativo (sem syntax directive):"
echo "   docker build -f Dockerfile.no-syntax -t sinesys:latest ."
echo ""
echo "5. Limpar cache do Docker:"
echo "   docker system prune -a"
echo ""

# 3. Verificar conectividade
echo "🌐 Testando conectividade com Docker Hub..."
if curl -I https://registry-1.docker.io/v2/ 2>&1 | grep -q "HTTP"; then
  echo "✅ Conectividade com Docker Hub OK"
else
  echo "⚠️  Problemas de conectividade detectados"
  echo "   Verifique sua conexão com a internet"
fi

echo ""
echo "✅ Diagnóstico concluído!"
