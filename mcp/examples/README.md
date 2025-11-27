# Exemplos de Uso do Sinesys MCP Server

Este diretório contém scripts de exemplo para testar e demonstrar o uso do Sinesys MCP Server. Esses exemplos mostram como interagir com as tools do MCP programaticamente, sem precisar de um cliente MCP completo (como Claude Desktop).

## Scripts Disponíveis

### 1. `test-tools.ts`

Script para testar tools individuais do MCP Server localmente.

**Funcionalidades:**
- Testa tools específicas por nome
- Executa todos os testes em sequência
- Valida argumentos com Zod antes de executar
- Exibe resultados formatados

**Exemplos de uso:**

```bash
# Executar todos os testes
tsx examples/test-tools.ts

# Testar tool específica
tsx examples/test-tools.ts listar_clientes

# Testar com argumentos
tsx examples/test-tools.ts buscar_cliente 123
```

**Testes disponíveis:**
- `listar_clientes` - Lista clientes com paginação
- `buscar_cliente <id>` - Busca cliente por ID
- `criar_cliente` - Cria cliente de exemplo
- `listar_contratos` - Lista contratos
- `iniciar_captura_audiencias` - Inicia captura de audiências
- `consultar_status_captura <capture_id>` - Consulta status de captura
- `health_check` - Verifica saúde do sistema

### 2. `workflow-captura.ts`

Script demonstrativo de workflow completo de captura assíncrona com polling.

**Funcionalidades:**
- Demonstra o fluxo completo de captura de audiências
- Implementa polling manual e automático
- Mostra como aguardar conclusão de operações assíncronas
- Exibe progresso em tempo real

**Exemplos de uso:**

```bash
# Executar com dados padrão (advogado_id=1, credencial_ids=[5,6])
tsx examples/workflow-captura.ts

# Passar parâmetros customizados
tsx examples/workflow-captura.ts 1 5 6 7
# (advogado_id=1, credencial_ids=[5,6,7])
```

## Executando os Exemplos

### Passo 1: Navegue para o diretório `mcp/`

```bash
cd mcp/
```

### Passo 2: Garanta que as dependências estão instaladas

As dependências são compartilhadas com o projeto principal via npm workspaces:

```bash
# Na raiz do projeto (sinesys/)
npm install
```

### Passo 3: Configure as credenciais

Crie o arquivo de configuração `~/.sinesys/config.json`:

```json
{
  "baseUrl": "http://localhost:3000",
  "apiKey": "sua_api_key_aqui"
}
```

Ou use variáveis de ambiente:

```bash
export SINESYS_BASE_URL="http://localhost:3000"
export SINESYS_API_KEY="sua_api_key_aqui"
```

### Passo 4: Execute o script desejado

```bash
# Testar tools
tsx examples/test-tools.ts listar_clientes

# Workflow de captura
tsx examples/workflow-captura.ts
```

## Personalizando os Exemplos

### Alterando Parâmetros de Teste

Edite os valores padrão nos scripts para usar dados do seu ambiente:

**Em `test-tools.ts`:**
```typescript
// Altere os IDs de credenciais para os do seu ambiente
async function testIniciarCapturaAudiencias(): Promise<void> {
  await testTool('sinesys_iniciar_captura_audiencias', {
    advogadoId: 1,       // Altere para um advogado válido
    credencialIds: [5, 6] // Altere para credenciais válidas
  });
}
```

**Em `workflow-captura.ts`:**
```typescript
// Altere os valores padrão
let advogadoId = 1;      // ID do advogado
let credencialIds = [5, 6]; // IDs das credenciais PJE
```

### Adicionando Novos Testes

Para adicionar um novo teste em `test-tools.ts`:

1. Crie uma função de teste:
```typescript
async function testNovaFuncionalidade(): Promise<void> {
  await testTool('sinesys_nome_da_tool', { /* argumentos */ });
}
```

2. Adicione ao switch case para execução individual:
```typescript
case 'nova_funcionalidade':
  await testNovaFuncionalidade();
  break;
```

3. Adicione ao array de testes para execução em lote:
```typescript
const tests = [
  // ... testes existentes
  { name: 'Nova Funcionalidade', fn: testNovaFuncionalidade },
];
```

## Troubleshooting

### Erro: "Cannot find module"

**Problema:** Erro de módulo não encontrado ao executar os scripts.

**Soluções:**
1. Certifique-se de estar no diretório `mcp/`
2. Execute `npm install` na raiz do projeto
3. Verifique se os imports usam extensão `.js` (convenção ESM)

### Erro: "Erro ao carregar configuração"

**Problema:** O script não consegue carregar as credenciais.

**Soluções:**
1. Crie o arquivo `~/.sinesys/config.json` com formato JSON válido
2. Ou configure as variáveis de ambiente `SINESYS_BASE_URL` e `SINESYS_API_KEY`
3. Verifique se não há comentários no arquivo JSON (JSON não suporta comentários)

### Erro: "Tool não encontrada"

**Problema:** A tool especificada não existe.

**Soluções:**
1. Verifique o nome exato da tool (use prefixo `sinesys_`)
2. Liste tools disponíveis executando sem argumentos: `tsx examples/test-tools.ts`
3. Consulte a documentação em `mcp/README.md` para lista completa de tools

### Erro: "401 Unauthorized"

**Problema:** Autenticação falhou.

**Soluções:**
1. Verifique se a API Key está correta no arquivo de configuração
2. Confirme que o servidor Sinesys está rodando
3. Teste a conectividade: `curl -H "x-service-api-key: SUA_KEY" http://localhost:3000/api/health`

### Erro: "ECONNREFUSED"

**Problema:** Não foi possível conectar ao servidor.

**Soluções:**
1. Verifique se o servidor Sinesys está rodando (`npm run dev`)
2. Confirme a URL base no arquivo de configuração
3. Verifique se não há firewall bloqueando a conexão

### Timeout em Capturas

**Problema:** Captura demora muito ou falha por timeout.

**Soluções:**
1. Aumente o timeout em `workflow-captura.ts`:
   ```typescript
   const result = await pollCapturaStatus(this.client, captureId, {
     intervalMs: 5000,
     timeoutMs: 600000  // 10 minutos
   });
   ```
2. Verifique se as credenciais PJE estão corretas
3. Consulte os logs do servidor para erros específicos

## Estrutura dos Arquivos

```
mcp/examples/
├── README.md           # Esta documentação
├── test-tools.ts       # Testes de tools individuais
└── workflow-captura.ts # Workflow de captura com polling
```

## Referências

- [Documentação principal do MCP Server](../README.md)
- [Guia de Troubleshooting](../TROUBLESHOOTING.md)
- [Exemplos de integração](../INTEGRATION.md)
