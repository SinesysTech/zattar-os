# Guia de Integração - Sinesys MCP Server

## Visão Geral

O **Model Context Protocol (MCP)** é um protocolo aberto desenvolvido pela Anthropic para conectar grandes modelos de linguagem (LLMs) a fontes de dados externas e ferramentas. O Sinesys MCP Server implementa este protocolo, expondo 52 ferramentas para interação programática com o sistema Sinesys via agentes AI.

### Como Funciona o Protocolo

O MCP usa comunicação **stdio (stdin/stdout)** com mensagens JSON-RPC 2.0:

- **Cliente MCP** (ex: Claude Desktop) inicia o servidor como subprocesso
- Comunicação bidirecional via JSON-RPC sobre stdio
- Servidor responde a duas requisições principais:
  - `tools/list`: Lista todas as ferramentas disponíveis
  - `tools/call`: Executa uma ferramenta específica

### Por que é Útil para LLMs

- **Acesso Estruturado**: LLMs podem invocar ferramentas de forma determinística
- **Dados Atualizados**: Acesso direto às APIs do Sinesys sem limitações de conhecimento pré-treinado
- **Automação Segura**: Execução de workflows complexos (ex: capturas assíncronas, gestão de processos)
- **Validação Robusta**: Schemas Zod garantem entrada/saída consistentes

## Integração com Claude Desktop

### Pré-requisitos

- **Claude Desktop** instalado e atualizado
- **Node.js 20+** instalado
- **MCP Server buildado**: Execute `npm run mcp:build` na raiz do projeto
- **Configuração válida**: Arquivo `~/.sinesys/config.json` ou variáveis de ambiente configuradas

### Passo a Passo

1. **Localizar arquivo de configuração:**
   - **Linux/Mac**: `~/.config/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - Se o diretório não existir, crie-o manualmente

2. **Adicionar configuração do Sinesys:**
   Adicione a seguinte configuração ao arquivo JSON:

   ```json
   {
     "mcpServers": {
       "sinesys": {
         "command": "node",
         "args": ["/caminho/absoluto/para/sinesys/mcp/build/index.js"],
         "env": {
           "SINESYS_BASE_URL": "https://seu-sinesys.com",
           "SINESYS_API_KEY": "sua_service_api_key"
         }
       }
     }
   }
   ```

   **Explicação dos campos:**
   - `command`: Executável Node.js
   - `args`: Array com path absoluto para `index.js` (não use caminhos relativos)
   - `env`: Variáveis de ambiente para configuração (opcional, pode usar arquivo de config)

3. **Verificar configuração:**
   - Valide o JSON: `cat ~/.config/Claude/claude_desktop_config.json | jq .`
   - Teste o path: `ls -la /caminho/absoluto/para/sinesys/mcp/build/index.js`
   - Verifique permissões: `chmod +x /caminho/absoluto/para/sinesys/mcp/build/index.js`

4. **Reiniciar Claude Desktop:**
   - Feche completamente o Claude Desktop (não apenas minimize)
   - Reabra a aplicação
   - Verifique se "Sinesys" aparece na lista de servidores MCP

5. **Testar conexão:**
   Use prompts como:
   - "Liste os clientes usando a ferramenta sinesys_listar_clientes"
   - "Verifique a saúde do sistema com sinesys_verificar_saude_sistema"
   
   Para verificar disponibilidade: Procure por "sinesys_" nas ferramentas sugeridas.
   Erros comuns: "Tool not found" (configuração inválida) ou "401 Unauthorized" (autenticação).

### Troubleshooting Claude Desktop

- **MCP não aparece na lista:** Verifique path absoluto, JSON válido, permissões de execução
- **Erro de conexão:** Consulte logs do Claude Desktop, teste servidor manualmente com `node build/index.js`
- **Tools não funcionam:** Verifique autenticação (API Key válida), servidor Sinesys online
- **Respostas lentas:** Verifique latência de rede, aumente timeout para capturas (padrão 5min)

### Dicas de Uso

- **Prompts efetivos:** "Use a ferramenta sinesys_listar_clientes para buscar clientes com busca 'João'"
- **Workflows:** Combine tools: primeiro `sinesys_iniciar_captura_audiencias`, depois `sinesys_aguardar_captura_concluir`
- **Boas práticas:** Use tools específicas, valide argumentos, monitore status de capturas assíncronas

## Integração com Outros Clientes MCP

### Clientes Compatíveis

- **Claude Desktop** (recomendado): Suporte nativo via configuração JSON
- **MCP CLI Tools**: Ferramentas de linha de comando para teste
- **Clientes customizados**: Qualquer aplicação que implemente MCP client
- **Documentação**: [Model Context Protocol](https://modelcontextprotocol.io/)

### Integração Genérica

Qualquer cliente MCP pode conectar via stdio executando o servidor como subprocesso.

**Protocolo esperado:**
- Requisições JSON-RPC 2.0 no stdin
- Respostas JSON-RPC 2.0 no stdout
- Logs de erro no stderr (não interferem com protocolo)

### Teste Manual via stdio

Teste o servidor diretamente:

```bash
# Listar tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node build/index.js

# Chamar tool
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"sinesys_verificar_saude_sistema","arguments":{}}}' | node build/index.js
```

**Interpretar respostas:**
- Sucesso: `{"jsonrpc":"2.0","id":1,"result":{...}}`
- Erro: `{"jsonrpc":"2.0","id":1,"error":{...}}`

## Integração Programática

### Usando o SDK MCP

Para criar cliente customizado:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['/path/to/sinesys/mcp/build/index.js'],
  env: { SINESYS_BASE_URL: '...', SINESYS_API_KEY: '...' }
});

const client = new Client({ name: 'my-client', version: '1.0.0' });
await client.connect(transport);

// Listar tools
const tools = await client.request({ method: 'tools/list' });

// Chamar tool
const result = await client.request({
  method: 'tools/call',
  params: { name: 'sinesys_listar_clientes', arguments: {} }
});
```

### Usando Scripts Diretos

Use `SinesysApiClient` diretamente para integração sem MCP:

```typescript
import { SinesysApiClient, loadConfig } from './src/client/index.js';

const config = loadConfig();
const client = new SinesysApiClient(config);

// Chamada direta
const clientes = await client.get('/clientes');
```

**Quando usar:**
- Scripts diretos: Para automação simples, testes unitários
- MCP: Para integração com LLMs, workflows complexos

Exemplos em `examples/`: `test-tools.ts`, `workflow-captura.ts`

## Segurança

### Autenticação

- **API Key (recomendado)**: Service API Key (header `x-service-api-key`), acesso total, ideal para automação
- **Bearer Token**: Token JWT de usuário (header `Authorization`), acesso baseado em permissões

**Gerenciamento:** API Keys geradas no painel admin do Sinesys.

### Permissões

- **Tools admin**: `sinesys_limpar_cache` requer admin ou Service API Key
- **Capturas**: Requer credenciais PJE válidas
- **Princípio**: Use menor privilégio, rotacione chaves periodicamente

### Boas Práticas

- Não commite credenciais no código
- Use variáveis de ambiente em produção
- Rotacione API Keys a cada 90 dias
- Monitore uso via logs do servidor

## Ambientes

### Desenvolvimento

- **Configuração**: `baseUrl: "http://localhost:3000"`, API Key de dev
- **Logs**: Habilite stderr detalhado
- **Testes**: Use dados de teste, valide workflows

### Staging

- **Configuração**: URL de staging, API Key específica
- **Dados**: Use dados de teste
- **Validação**: Teste workflows antes de produção

### Produção

- **Configuração**: HTTPS obrigatório, API Key de produção
- **Monitoramento**: Alertas para falhas, backup de config
- **Segurança**: Rotação de chaves, auditoria de logs

## Monitoramento

### Logs

- **Localização**: stderr do processo MCP Server
- **Habilitação**: Logs automáticos em erros; use `console.error()` para debug
- **Interpretação**: Busque por "401", "ECONNREFUSED", "Erro de validação"

### Métricas

- **Uso de tools**: Monitore frequência de chamadas
- **Tools mais usadas**: Identifique gargalos
- **Erros recorrentes**: Detecte problemas sistêmicos

### Alertas

- **Falhas**: Configure alertas para 5xx consecutivos
- **Latência**: Monitore tempo de resposta >30s
- **Autenticação**: Alerte em 401/403 frequentes

## Próximos Passos

- Explore as 52 tools em `mcp/README.md`
- Crie workflows customizados combinando tools
- Contribua com exemplos em `examples/`
- Reporte bugs ou sugestões no repositório