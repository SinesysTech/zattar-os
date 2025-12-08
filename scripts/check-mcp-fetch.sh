#!/bin/bash

# Script de verificação rápida do MCP Server Fetch
# Execute: ./scripts/check-mcp-fetch.sh

echo "=== Verificação de Instalação do MCP Server Fetch ==="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar uvx
echo -n "1. Verificando uvx... "
if command -v uvx &> /dev/null; then
    echo -e "${GREEN}✅ ENCONTRADO${NC} em $(which uvx)"
elif [ -f "$HOME/.local/bin/uvx" ]; then
    echo -e "${YELLOW}⚠️  INSTALADO mas não no PATH${NC}"
    echo "   Localização: $HOME/.local/bin/uvx"
    echo "   Execute: export PATH=\"\$HOME/.local/bin:\$PATH\""
else
    echo -e "${RED}❌ NÃO INSTALADO${NC}"
    echo "   Execute: curl -LsSf https://astral.sh/uv/install.sh | sh"
fi

echo ""

# Verificar realpath
echo -n "2. Verificando realpath... "
if command -v realpath &> /dev/null; then
    echo -e "${GREEN}✅ ENCONTRADO${NC} em $(which realpath)"
elif command -v grealpath &> /dev/null; then
    echo -e "${YELLOW}⚠️  GNU realpath (grealpath) disponível${NC}"
    echo "   Execute: brew install coreutils"
    echo "   Ou crie alias: alias realpath=grealpath"
else
    echo -e "${RED}❌ NÃO ENCONTRADO${NC}"
    echo "   Execute: brew install coreutils"
fi

echo ""

# Verificar PATH no .zshrc
echo -n "3. Verificando .zshrc... "
if grep -q "/.local/bin" ~/.zshrc 2>/dev/null; then
    echo -e "${GREEN}✅ PATH configurado${NC}"
else
    echo -e "${RED}❌ PATH não configurado${NC}"
    echo "   Execute: echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.zshrc"
fi

echo ""

# Verificar PATH atual
echo -n "4. Verificando PATH atual... "
if echo "$PATH" | grep -q "/.local/bin"; then
    echo -e "${GREEN}✅ PATH ativo${NC}"
else
    echo -e "${YELLOW}⚠️  PATH não carregado nesta sessão${NC}"
    echo "   Execute: source ~/.zshrc"
fi

echo ""

# Testar MCP Server fetch
echo -n "5. Testando MCP Server fetch... "
if command -v uvx &> /dev/null; then
    if uvx mcp-server-fetch --help &> /dev/null; then
        echo -e "${GREEN}✅ FUNCIONANDO${NC}"
    else
        echo -e "${RED}❌ ERRO ao executar${NC}"
        echo "   Tentando executar para ver o erro..."
        uvx mcp-server-fetch --help 2>&1 | head -10
    fi
else
    echo -e "${RED}❌ uvx não disponível${NC}"
fi

echo ""
echo "=========================================="
echo ""

# Resumo
uvx_ok=false
realpath_ok=false

command -v uvx &> /dev/null && uvx_ok=true
[ -f "$HOME/.local/bin/uvx" ] && uvx_ok=true

command -v realpath &> /dev/null && realpath_ok=true
command -v grealpath &> /dev/null && realpath_ok=true

if $uvx_ok && $realpath_ok; then
    echo -e "${GREEN}Status: Configuração completa!${NC}"
    echo "Próximo passo: Reinicie o Qoder para aplicar as mudanças"
elif $uvx_ok; then
    echo -e "${YELLOW}Status: uvx instalado, mas falta realpath${NC}"
    echo "Execute: brew install coreutils"
else
    echo -e "${RED}Status: Configuração incompleta${NC}"
    echo "Execute o script de setup: ./scripts/setup-mcp-fetch.sh"
fi

echo ""
