# Sinesys MCP Server

Servidor MCP (Model Context Protocol) que expõe as APIs do Sinesys para agentes AI.

## Estrutura

- `src/tools/`: Contém as definições de ferramentas (tools) do MCP. Cada arquivo neste diretório representa um grupo de tools relacionadas (ex: `clientes.ts`, `contratos.ts`, `audiencias.ts`).
- `src/client/`: Contém o cliente HTTP que faz requisições para as APIs do Sinesys. Implementa autenticação via Service API Key e Bearer Token.
- `src/types/`: Contém definições de tipos TypeScript compartilhados entre os módulos do MCP Server (interfaces de resposta da API, tipos de configuração, etc.).

## Cliente HTTP

O diretório `src/client/` contém o cliente HTTP para comunicação com as APIs do Sinesys. Este cliente é modular e reutiliza padrões existentes do projeto.

- `api-client.ts`: Classe principal `SinesysApiClient` com métodos HTTP (GET, POST, PATCH, DELETE) tipados.
- `config-loader.ts`: Carregamento de configuração de `~/.sinesys/config.json` ou variáveis de ambiente.
- `retry-logic.ts`: Lógica de retry com exponential backoff para resiliência em requisições.
- `index.ts`: Barrel export para importações simplificadas.

## Execução

### Método Recomendado (via raiz do projeto)

O MCP Server é configurado como um **npm workspace** do projeto principal. A execução recomendada é através dos scripts da raiz, que reutilizam o `typescript` e o `tsx` já instalados:

```bash
# Na raiz do projeto (sinesys/)

# Compilar o MCP Server
npm run mcp:build

# Executar em modo desenvolvimento (com hot-reload via tsx)
npm run mcp:dev

# Executar em modo produção (requer build prévio)
npm run mcp:start

# Assistir mudanças e recompilar automaticamente
npm run mcp:watch
```

### Execução Direta (dentro de `mcp/`)

Os scripts também podem ser executados diretamente dentro do diretório `mcp/`, desde que as dependências estejam instaladas na raiz do projeto (via npm workspaces):

```bash
cd mcp

# Compilar
npm run build

# Desenvolvimento
npm run dev

# Produção
npm run start

# Watch mode
npm run watch
```

> **Nota:** Como este pacote participa do workspace do projeto principal, ele compartilha o `node_modules` da raiz. Não é necessário executar `npm install` dentro de `mcp/` separadamente.

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `build` | Compila o TypeScript para JavaScript no diretório `build/` |
| `watch` | Compila em modo watch, recompilando automaticamente em mudanças |
| `dev` | Executa diretamente o TypeScript via `tsx` (desenvolvimento) |
| `start` | Executa o código compilado (produção) |

## Build

Para compilar o projeto:

```bash
# Via raiz (recomendado)
npm run mcp:build

# Ou diretamente
cd mcp && npm run build
```

Isso irá gerar os arquivos JavaScript no diretório `mcp/build/`.

## Configuração

### Opção 1 - Arquivo de configuração

Crie o arquivo `~/.sinesys/config.json` com a seguinte estrutura:

```json
{
  "baseUrl": "https://sinesys.app",
  "apiKey": "sua_service_api_key_aqui"
}
```

O campo `apiKey` corresponde à Service API Key (variável `SERVICE_API_KEY` do `.env`).

### Opção 2 - Variáveis de ambiente

- `SINESYS_BASE_URL`: URL base da API (padrão: http://localhost:3000)
- `SINESYS_API_KEY`: Service API Key para autenticação de sistema
- `SINESYS_SESSION_TOKEN`: Bearer token JWT do Supabase (alternativa ao apiKey)

**Prioridade:** Arquivo de configuração > variáveis de ambiente.

**Prioridade de autenticação:** Service API Key > Bearer Token.

## Autenticação

O cliente suporta dois métodos de autenticação:

- **Service API Key** (recomendado para MCP): Header `x-service-api-key`, fornece acesso total ao sistema.
- **Bearer Token**: Header `Authorization: Bearer <token>`, acesso baseado em permissões do usuário.

O Service API Key tem prioridade e é mais adequado para agentes e automação.

## Retry e Resiliência

O cliente HTTP implementa retry automático para erros temporários.

- **Configuração padrão:** 3 tentativas, exponential backoff (1s, 2s, 4s), jitter aleatório.
- **Erros retryable:** 5xx, 429, 408, erros de rede (timeout, ECONNREFUSED).
- **Erros não-retryable:** 4xx (exceto 408/429), 401, 403.

## Configuração de Workspaces

Este pacote faz parte do npm workspace do projeto Sinesys. A configuração está em `package.json` na raiz:

```json
{
  "workspaces": ["mcp"]
}
```

Isso permite:
- Compartilhar dependências como `typescript` e `tsx` com o projeto principal
- Evitar duplicação de `node_modules`
- Executar scripts do MCP via `npm run --workspace=sinesys-mcp-server`

---

Nota: Documentação completa será adicionada nas próximas fases.