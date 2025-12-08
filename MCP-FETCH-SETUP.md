# Guia de Configuração do MCP Server Fetch

## Problema
Erro ao iniciar o MCP Server fetch:
```
failed to create MCP client for fetch: failed to start stdio transport: 
failed to start command: exec: "uvx": executable file not found in $PATH
```

## Solução Implementada

### 1. ✅ Instalação do uvx (Concluída)

O `uv` (Python package manager) foi instalado com sucesso em:
```
/Users/jordanmedeiros/.local/bin/
```

### 2. ✅ Configuração do PATH no .zshrc (Concluída)

A seguinte linha foi adicionada ao seu `~/.zshrc`:
```bash
export PATH="$HOME/.local/bin:$PATH"
```

### 3. ⚠️ Instalação do coreutils (Em Andamento)

O Homebrew estava instalando o `coreutils` quando houve uma interrupção.

---

## Passos para Completar a Configuração

### Passo 1: Executar o Script Automático

Abra um novo terminal e execute:

```bash
cd /Users/jordanmedeiros/Documents/GitHub/Sinesys
chmod +x scripts/setup-mcp-fetch.sh
./scripts/setup-mcp-fetch.sh
```

### Passo 2: Verificação Manual (Alternativa)

Se preferir fazer manualmente, siga estes comandos:

#### 2.1. Verificar se uvx está instalado
```bash
ls -la ~/.local/bin/uvx
```

Se não existir, instale o uv:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### 2.2. Instalar GNU coreutils
```bash
brew install coreutils
```

#### 2.3. Atualizar .zshrc
```bash
# Adicionar uvx ao PATH (se ainda não estiver)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc

# Adicionar coreutils ao PATH
echo 'export PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"' >> ~/.zshrc

# Recarregar configurações
source ~/.zshrc
```

#### 2.4. Testar a instalação
```bash
# Verificar uvx
which uvx
# Deve mostrar: /Users/jordanmedeiros/.local/bin/uvx

# Verificar realpath
which realpath
# Deve mostrar: /usr/local/opt/coreutils/libexec/gnubin/realpath

# Testar MCP Server fetch
uvx mcp-server-fetch --help
```

### Passo 3: Reiniciar o Qoder

Após a configuração bem-sucedida:

1. **Feche completamente o Qoder**
2. **Reabra o Qoder**
3. O MCP Server fetch deve iniciar sem erros

---

## Solução Rápida (Workaround)

Se você não quiser instalar o coreutils completo, pode criar um wrapper Python para o realpath:

```bash
# Criar um script realpath em ~/.local/bin/
cat > ~/.local/bin/realpath << 'EOF'
#!/usr/bin/env python3
import os
import sys

if len(sys.argv) > 1:
    print(os.path.realpath(sys.argv[1]))
else:
    print("Usage: realpath <path>")
    sys.exit(1)
EOF

# Dar permissão de execução
chmod +x ~/.local/bin/realpath

# Recarregar shell
source ~/.zshrc
```

---

## Verificação Final

Execute este comando para verificar se tudo está configurado:

```bash
echo "=== Verificação de Instalação ==="
echo ""
echo "1. uvx:"
which uvx && echo "✅ uvx encontrado" || echo "❌ uvx NÃO encontrado"
echo ""
echo "2. realpath:"
which realpath && echo "✅ realpath encontrado" || echo "❌ realpath NÃO encontrado"
echo ""
echo "3. MCP Server fetch:"
uvx mcp-server-fetch --help > /dev/null 2>&1 && echo "✅ MCP Server fetch funcional" || echo "❌ MCP Server fetch com erro"
```

---

## Notas Importantes

- **macOS 12.7.6**: Sua versão do macOS não tem suporte oficial do Homebrew, mas as ferramentas devem funcionar normalmente
- **PATH permanente**: As alterações no `.zshrc` garantem que o PATH seja configurado sempre que você abrir um novo terminal
- **Reiniciar IDE**: É ESSENCIAL reiniciar o Qoder após configurar o PATH para que o MCP Server use as novas variáveis de ambiente

---

## Troubleshooting

### Se ainda houver erro após configuração:

1. Verifique se o `.zshrc` foi atualizado:
   ```bash
   cat ~/.zshrc | grep "local/bin"
   ```

2. Verifique se o shell atual tem o PATH correto:
   ```bash
   echo $PATH | grep "local/bin"
   ```

3. Se necessário, force o reload:
   ```bash
   exec zsh
   ```

4. Verifique logs do MCP (se disponível no Qoder)

---

## Contato

Se o problema persistir após seguir todos os passos, documente:
- Saída do comando: `which uvx`
- Saída do comando: `which realpath`
- Saída do comando: `echo $PATH`
- Erro completo do MCP Server
