#!/bin/bash

echo "=========================================="
echo "Script de Configuração do MCP Server Fetch"
echo "=========================================="
echo ""

# Verificar se uvx está instalado
echo "1. Verificando instalação do uvx..."
if command -v uvx &> /dev/null; then
    echo "✅ uvx está instalado em: $(which uvx)"
else
    echo "❌ uvx não encontrado no PATH"
    echo "   Verificando instalação em ~/.local/bin..."
    
    if [ -f "$HOME/.local/bin/uvx" ]; then
        echo "✅ uvx encontrado em ~/.local/bin/uvx"
        echo "   Adicionando ao PATH..."
        export PATH="$HOME/.local/bin:$PATH"
    else
        echo "❌ uvx não está instalado. Instalando..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        export PATH="$HOME/.local/bin:$PATH"
    fi
fi

echo ""

# Verificar se realpath/grealpath está disponível
echo "2. Verificando comando realpath..."
if command -v realpath &> /dev/null; then
    echo "✅ realpath está disponível"
elif command -v grealpath &> /dev/null; then
    echo "✅ grealpath está disponível (GNU coreutils)"
    echo "   Criando alias para realpath..."
    alias realpath=grealpath
else
    echo "❌ realpath não encontrado"
    echo "   Instalando coreutils via Homebrew..."
    brew install coreutils
    
    # Adicionar GNU coreutils ao PATH
    if [ -d "/usr/local/opt/coreutils/libexec/gnubin" ]; then
        export PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"
    fi
fi

echo ""

# Atualizar .zshrc permanentemente
echo "3. Configurando .zshrc..."
if ! grep -q "/.local/bin" ~/.zshrc; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
    echo "✅ PATH do uvx adicionado ao .zshrc"
else
    echo "✅ PATH do uvx já está no .zshrc"
fi

if ! grep -q "coreutils/libexec/gnubin" ~/.zshrc; then
    echo 'export PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"' >> ~/.zshrc
    echo "✅ PATH do coreutils adicionado ao .zshrc"
else
    echo "✅ PATH do coreutils já está no .zshrc"
fi

echo ""

# Testar MCP Server fetch
echo "4. Testando MCP Server fetch..."
export PATH="$HOME/.local/bin:$PATH"
export PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"

if uvx mcp-server-fetch --help &> /dev/null; then
    echo "✅ MCP Server fetch está funcionando!"
else
    echo "⚠️  Erro ao executar mcp-server-fetch"
    echo "   Executando para ver detalhes do erro..."
    uvx mcp-server-fetch --help
fi

echo ""
echo "=========================================="
echo "Configuração concluída!"
echo "=========================================="
echo ""
echo "PRÓXIMOS PASSOS:"
echo "1. Execute: source ~/.zshrc"
echo "2. Reinicie o Qoder/IDE para que o MCP Server seja reiniciado"
echo "3. O erro 'executable file not found in \$PATH' deve estar resolvido"
echo ""
