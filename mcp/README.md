# Sinesys MCP Server

[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-0.5.0-blue)](https://modelcontextprotocol.io/) [![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

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

### Arquivo de Configuração (~/.sinesys/config.json)

O MCP Server carrega a configuração prioritariamente do arquivo `~/.sinesys/config.json`. Este arquivo contém as credenciais e URLs necessárias para conectar às APIs do Sinesys.

> **⚠️ Importante:** O arquivo de configuração deve ser JSON válido. **Não use comentários** (`//` ou `/* */`) dentro do arquivo, pois JSON não suporta comentários e isso causará erros de parsing. Use o exemplo em `mcp/.sinesys.config.example.json` como referência.

#### Formato JSON Completo

```json
{
  "baseUrl": "https://api.sinesys.com",
  "apiKey": "sk_your_service_api_key_here",
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Explicação dos Campos

- **`baseUrl`** (string, obrigatório): URL base da API do Sinesys. Deve incluir o protocolo (http/https) e não terminar com `/`. Exemplo: `"https://sinesys.app"` ou `"http://localhost:3000"`.
- **`apiKey`** (string, opcional): Service API Key para autenticação de sistema. Header `x-service-api-key`. Tem prioridade sobre `sessionToken`. Recomendado para automação e MCP.
- **`sessionToken`** (string, opcional): Bearer token JWT de usuário autenticado. Header `Authorization: Bearer <token>`. Usado quando `apiKey` não é fornecido.

**Nota:** Pelo menos um método de autenticação deve ser configurado (`apiKey` ou `sessionToken`).

#### Exemplos para Diferentes Ambientes

##### Desenvolvimento Local (localhost:3000)
```json
{
  "baseUrl": "http://localhost:3000",
  "apiKey": "sk_dev_api_key_12345"
}
```

##### Produção (HTTPS)
```json
{
  "baseUrl": "https://api.sinesys.com",
  "apiKey": "sk_prod_api_key_67890"
}
```

##### Staging
```json
{
  "baseUrl": "https://staging.sinesys.com",
  "apiKey": "sk_staging_api_key_abcde"
}
```

##### Múltiplos Ambientes (usando variáveis de ambiente para alternar)
```json
{
  "baseUrl": "https://api.sinesys.com",
  "apiKey": "sk_prod_api_key_67890"
}
```
Para desenvolvimento, sobrescreva com variáveis de ambiente:
```bash
export SINESYS_BASE_URL="http://localhost:3000"
export SINESYS_API_KEY="sk_dev_api_key_12345"
```

#### Precedência de Configuração

1. **Arquivo `~/.sinesys/config.json`** (prioridade máxima)
2. **Variáveis de ambiente**: `SINESYS_BASE_URL`, `SINESYS_API_KEY`, `SINESYS_SESSION_TOKEN`
3. **Defaults**: `baseUrl: "http://localhost:3000"`, outros campos vazios

### Opção 2 - Variáveis de ambiente

- `SINESYS_BASE_URL`: URL base da API (padrão: http://localhost:3000)
- `SINESYS_API_KEY`: Service API Key para autenticação de sistema
- `SINESYS_SESSION_TOKEN`: Bearer token JWT do Supabase (alternativa ao apiKey)

**Prioridade:** Arquivo de configuração > variáveis de ambiente.

**Prioridade de autenticação:** Service API Key > Bearer Token.

O Service API Key tem prioridade e é mais adequado para agentes e automação.

## Executando o Servidor

O servidor MCP roda via stdio (stdin/stdout) para comunicação JSON-RPC.

### Três formas de execução:

1. **Desenvolvimento** (com hot-reload): `npm run mcp:dev` (usa `tsx src/index.ts`)
2. **Build + Execução**: `npm run mcp:build && npm run mcp:start` (compila TypeScript e executa `node build/index.js`)
3. **Executável direto** (após build): `node mcp/build/index.js` ou `./mcp/build/index.js` (se tiver permissão de execução)

Logs do servidor aparecem no stderr e não interferem com o protocolo JSON-RPC no stdout.

#### Exemplo de teste manual via stdio:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npm run mcp:start
```

Em produção o servidor é iniciado automaticamente pelo cliente MCP (ex: Claude Desktop) como subprocesso.

## Integração com Claude Desktop

Claude Desktop pode usar o servidor MCP para acessar as APIs do Sinesys.

### Localização do Arquivo de Configuração

- **Linux/Mac**: `~/.config/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Exemplo Completo de Configuração JSON

```json
{
  "mcpServers": {
    "sinesys": {
      "command": "node",
      "args": ["/home/user/projects/sinesys/mcp/build/index.js"],
      "env": {
        "SINESYS_BASE_URL": "https://api.sinesys.com",
        "SINESYS_API_KEY": "sk_your_service_api_key_here"
      }
    }
  }
}
```

**Nota:** Substitua `/home/user/projects/sinesys` pelo caminho absoluto real do projeto no seu sistema.

### Instruções Passo-a-Passo

1. **Compilar o MCP Server:**
   ```bash
   cd /path/to/sinesys
   npm run mcp:build
   ```

2. **Localizar ou criar o arquivo de configuração do Claude:**
   - Abra o arquivo `~/.config/Claude/claude_desktop_config.json` (Linux/Mac) ou `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
   - Se o arquivo não existir, crie-o como um JSON vazio: `{}`
   - Se já existir, adicione a seção `mcpServers` se não houver

3. **Adicionar a configuração do Sinesys:**
   - Adicione o objeto `sinesys` dentro de `mcpServers`
   - Use o caminho absoluto para `index.js` em `args`
   - Configure as variáveis de ambiente necessárias em `env`

4. **Reiniciar o Claude Desktop:**
   - Feche completamente o Claude Desktop (não apenas minimize)
   - Reabra a aplicação
   - O servidor MCP será iniciado automaticamente como subprocesso

5. **Verificar a conexão:**
   - No Claude Desktop, digite uma mensagem como: "Liste os clientes do Sinesys"
   - O Claude deve reconhecer e usar as tools do MCP
   - Verifique se não há erros nos logs do Claude

### Dicas de Uso

- **Invocando Tools:** Use prompts naturais como "Crie um cliente PF chamado João Silva com CPF 123.456.789-00" ou "Liste os contratos em andamento"
- **Exemplos de Prompts Eficazes:**
  - "Busque informações sobre o cliente com ID 123 no Sinesys"
  - "Inicie uma captura de audiências para o advogado 1 usando as credenciais 5 e 6"
  - "Liste os processos pendentes de manifestação que estão vencidos"
- **Workflows Complexos:** Combine múltiplas tools em sequência, como iniciar captura → aguardar conclusão → processar resultados
- **Debugging:** Se tools não funcionarem, verifique os logs do Claude Desktop e do servidor MCP (stderr)

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

## Tool Naming Convention

As ferramentas MCP seguem o padrão de nomenclatura `sinesys_[entidade]_[acao]`, onde:
- `[entidade]`: Representa a entidade principal do sistema (ex: `clientes`, `contratos`, `acervo`)
- `[acao]`: Descreve a operação realizada (ex: `listar`, `buscar`, `criar`, `atualizar`, `atribuir`)

Este padrão garante consistência e facilita a descoberta de ferramentas relacionadas.

## Error Handling

Erros nas ferramentas MCP são retornados no formato padrão do protocolo:
- **Estrutura**: `{ content: [{ type: 'text', text: string }], isError: true }`
- **Conteúdo**: O campo `text` contém uma string JSON com a mensagem de erro ou detalhes da falha (ex: erro de validação, 404, etc.)
- **Tratamento**: Verifique sempre o campo `isError` nas respostas para identificar falhas. Em caso de erro, a resposta não contém dados válidos.

## Exemplos de Uso Expandida

### Gestão de Clientes

#### Criar Cliente PF
**Contexto:** Cadastrar um novo cliente pessoa física com dados básicos.

**JSON de Entrada:**
```json
{
  "tipoPessoa": "pf",
  "nome": "João Silva",
  "cpf": "12345678900",
  "emails": ["joao@email.com"],
  "dddCelular": "11",
  "numeroCelular": "999999999"
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "tipoPessoa": "pf",
    "nome": "João Silva",
    "cpf": "12345678900",
    "emails": ["joao@email.com"],
    "dddCelular": "11",
    "numeroCelular": "999999999",
    "ativo": true,
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

**Possíveis Erros:**
- `Erro de validação: cpf: String must be exactly 11 characters` - CPF deve ter exatamente 11 dígitos
- `Erro: Cliente já existe com este CPF` - CPF duplicado

#### Buscar Cliente por Filtros
**Contexto:** Encontrar clientes usando busca textual e filtros.

**JSON de Entrada:**
```json
{
  "busca": "João Silva",
  "tipoPessoa": "pf",
  "ativo": true,
  "incluirEndereco": true
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "clientes": [
      {
        "id": 123,
        "nome": "João Silva",
        "cpf": "12345678900",
        "emails": ["joao@email.com"],
        "endereco": {
          "logradouro": "Rua das Flores, 123",
          "cidade": "São Paulo",
          "estado": "SP"
        }
      }
    ],
    "paginacao": {
      "pagina": 1,
      "limite": 10,
      "total": 1,
      "totalPaginas": 1
    }
  }
}
```

**Possíveis Erros:**
- Nenhum (filtros são opcionais)

#### Atualizar Dados do Cliente
**Contexto:** Atualizar informações de contato de um cliente existente.

**JSON de Entrada:**
```json
{
  "id": 123,
  "dados": {
    "emails": ["joao.novo@email.com", "joao.pessoal@email.com"],
    "dddCelular": "21",
    "numeroCelular": "888888888",
    "observacoes": "Cliente preferencial"
  }
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "nome": "João Silva",
    "emails": ["joao.novo@email.com", "joao.pessoal@email.com"],
    "dddCelular": "21",
    "numeroCelular": "888888888",
    "observacoes": "Cliente preferencial"
  }
}
```

**Possíveis Erros:**
- `Erro: Cliente não encontrado` - ID inexistente

### Gestão de Contratos

#### Criar Contrato Vinculado a Cliente
**Contexto:** Criar um novo contrato de ajuizamento trabalhista para um cliente existente.

**JSON de Entrada:**
```json
{
  "areaDireito": "trabalhista",
  "tipoContrato": "ajuizamento",
  "tipoCobranca": "pro_exito",
  "clienteId": 123,
  "poloCliente": "autor",
  "observacoes": "Contrato para ajuizamento de reclamação trabalhista"
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "areaDireito": "trabalhista",
    "tipoContrato": "ajuizamento",
    "tipoCobranca": "pro_exito",
    "clienteId": 123,
    "poloCliente": "autor",
    "status": "em_contratacao",
    "observacoes": "Contrato para ajuizamento de reclamação trabalhista",
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

**Possíveis Erros:**
- `Erro de validação: clienteId: Required` - Cliente ID obrigatório
- `Erro: Cliente não encontrado` - Cliente inexistente

#### Listar Contratos com Filtros
**Contexto:** Listar contratos trabalhistas em andamento.

**JSON de Entrada:**
```json
{
  "areaDireito": "trabalhista",
  "status": "contratado",
  "pagina": 1,
  "limite": 20
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "contratos": [
      {
        "id": 456,
        "areaDireito": "trabalhista",
        "tipoContrato": "ajuizamento",
        "status": "contratado",
        "cliente": {
          "nome": "João Silva"
        }
      }
    ],
    "paginacao": {
      "pagina": 1,
      "limite": 20,
      "total": 1,
      "totalPaginas": 1
    }
  }
}
```

**Possíveis Erros:**
- Nenhum (filtros são opcionais)

### Gestão Processual

#### Listar Processos
**Contexto:** Listar processos do acervo com filtros de TRT e grau.

**JSON de Entrada:**
```json
{
  "trt": "TRT3",
  "grau": "primeiro_grau",
  "busca": "João Silva",
  "pagina": 1,
  "limite": 10
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "processos": [
      {
        "id": 789,
        "numeroProcesso": "0010702-80.2025.5.03.0111",
        "trt": "TRT3",
        "grau": "primeiro_grau",
        "poloAtivoNome": "João Silva",
        "status": "ativo"
      }
    ],
    "paginacao": {
      "pagina": 1,
      "limite": 10,
      "total": 1,
      "totalPaginas": 1
    }
  }
}
```

**Possíveis Erros:**
- Nenhum (filtros são opcionais)

#### Atribuir Responsável
**Contexto:** Atribuir um advogado responsável por um processo.

**JSON de Entrada:**
```json
{
  "processoId": 789,
  "responsavelId": 101
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "id": 789,
    "responsavel_id": 101
  }
}
```

**Possíveis Erros:**
- `Erro: Processo não encontrado` - ID inexistente
- `Erro: Usuário não encontrado` - Responsável inexistente

#### Consultar Audiências
**Contexto:** Listar audiências virtuais da próxima semana.

**JSON de Entrada:**
```json
{
  "modalidade": "virtual",
  "data_inicio_inicio": "2024-01-01T00:00:00Z",
  "data_inicio_fim": "2024-01-07T23:59:59Z",
  "status": "M",
  "pagina": 1,
  "limite": 50
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "audiencias": [
      {
        "id": 111,
        "numeroProcesso": "0010702-80.2025.5.03.0111",
        "dataInicio": "2024-01-03T10:00:00Z",
        "modalidade": "virtual",
        "status": "M",
        "tipoAudiencia": "Instrução"
      }
    ],
    "paginacao": {
      "pagina": 1,
      "limite": 50,
      "total": 1,
      "totalPaginas": 1
    }
  }
}
```

**Possíveis Erros:**
- Nenhum (filtros são opcionais)

### Workflows de Captura

#### Captura com Polling Manual
**Contexto:** Capturar audiências e monitorar progresso manualmente.

**Passo 1 - Iniciar Captura:**
```json
{
  "advogado_id": 1,
  "credencial_ids": [5, 6],
  "data_inicio": "2024-01-01",
  "data_fim": "2024-12-31"
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "capture_id": 123,
    "status": "in_progress",
    "message": "Captura iniciada com sucesso"
  }
}
```

**Passo 2 - Consultar Status (repetir até completar):**
```json
{
  "capture_id": 123
}
```

**Resposta Esperada (quando concluída):**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "resultado": {
      "audiencias_capturadas": 150,
      "novas_audiencias": 15,
      "atualizadas": 135
    }
  }
}
```

**Possíveis Erros:**
- `Erro: Credenciais PJE inválidas` - Verificar credenciais do advogado
- `Erro: Timeout na captura` - Operação demorou muito

#### Captura com Polling Automático
**Contexto:** Capturar audiências e aguardar conclusão automaticamente.

**Passo 1 - Iniciar Captura (igual ao manual)**

**Passo 2 - Aguardar Conclusão:**
```json
{
  "capture_id": 123,
  "interval_ms": 5000,
  "timeout_ms": 300000
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "data": {
      "audiencias_capturadas": 150,
      "novas_audiencias": 15,
      "atualizadas": 135
    },
    "polling_info": {
      "total_polls": 12,
      "elapsed_ms": 60000
    }
  }
}
```

**Possíveis Erros:**
- `Erro: Timeout aguardando conclusão` - Captura demorou mais que timeout_ms
- `Erro: Captura falhou` - Verificar logs do servidor

### Administração

#### Verificar Cache
**Contexto:** Obter estatísticas do cache Redis.

**JSON de Entrada:**
```json
{}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "redis_connected": true,
    "memory_used": "45MB",
    "total_keys": 1250,
    "hits": 15420,
    "misses": 2340,
    "uptime_days": 7
  }
}
```

**Possíveis Erros:**
- `Erro: Acesso negado` - Requer permissões de admin

#### Limpar Cache
**Contexto:** Limpar todo o cache Redis.

**JSON de Entrada:**
```json
{}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "message": "Cache limpo com sucesso",
    "keys_removed": 1250
  }
}
```

**Possíveis Erros:**
- `Erro: Acesso negado` - Requer permissões de admin

#### Health Check
**Contexto:** Verificar se o sistema está saudável.

**JSON de Entrada:**
```json
{}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "version": "1.0.0"
  }
}
```

**Possíveis Erros:**
- `Erro: Serviço indisponível` - Servidor fora do ar

## Troubleshooting

### Erros de Autenticação

#### 401 Unauthorized
**Sintoma:** Todas as tools retornam erro 401 Unauthorized.

**Causas possíveis:**
- API Key inválida ou expirada
- Bearer Token inválido ou expirado
- Nenhum método de autenticação configurado

**Soluções:**
1. Verificar se `~/.sinesys/config.json` existe e contém `apiKey` ou `sessionToken` válidos
2. Testar autenticação manualmente:
   ```bash
   curl -H "x-service-api-key: SUA_API_KEY" https://seu-sinesys.com/api/health
   ```
3. Verificar se a API Key tem permissões adequadas no Sinesys (admin ou service)
4. Para Bearer Token, verificar se não expirou (geralmente 1 hora)

### Erros de Conexão

#### ECONNREFUSED
**Sintoma:** Erro "connect ECONNREFUSED" ao chamar qualquer tool.

**Causas possíveis:**
- Servidor Sinesys não está rodando
- `baseUrl` incorreta na configuração
- Firewall bloqueando conexão
- Porta incorreta (padrão 80/443)

**Soluções:**
1. Verificar se o servidor Sinesys está rodando: `curl https://seu-sinesys.com/api/health`
2. Confirmar `baseUrl` no `~/.sinesys/config.json` (sem trailing slash)
3. Testar conectividade básica: `ping seu-sinesys.com`
4. Verificar firewall/proxy corporativo
5. Em desenvolvimento, garantir que `npm run dev` está executando na porta correta

### Erros de Validação

#### Erro de validação Zod
**Sintoma:** "Erro de validação: campo X: mensagem de erro"

**Causas possíveis:**
- Tipo de dado incorreto (string em vez de number)
- Campo obrigatório faltando
- Formato inválido (datas, enums)
- Valor fora do range permitido

**Soluções:**
1. Verificar o schema da tool na documentação (tipos exatos requeridos)
2. Para números: sempre enviar como `number`, não `string`
3. Para datas: usar formato ISO 8601: `"2024-01-01"` ou `"2024-01-01T10:00:00Z"`
4. Para enums: usar valores exatos da lista permitida
5. Verificar campos obrigatórios marcados no schema

### Erros de Build

#### Cannot find module
**Sintoma:** Erro "Cannot find module '@/...'" ou similar durante build.

**Causas possíveis:**
- Dependências não instaladas
- Build desatualizado
- tsconfig.json incorreto
- Imports com path errado

**Soluções:**
1. Instalar dependências na raiz: `npm install`
2. Limpar e rebuild: `cd mcp && rm -rf build/ node_modules && npm run build`
3. Verificar tsconfig.json: paths devem estar corretos (`"@/*": ["src/*"]`)
4. Garantir uso de imports ESM (`.js` no final dos paths)

### Erros de Timeout em Capturas

#### Captura fica travada ou timeout
**Sintoma:** Capturas demoram muito ou falham com timeout.

**Causas possíveis:**
- Servidor sobrecarregado
- Operação de captura muito grande
- Credenciais PJE inválidas
- Rede lenta
- Timeout configurado muito baixo

**Soluções:**
1. Aumentar `timeout_ms` em `sinesys_aguardar_captura_concluir` (padrão 5min)
2. Verificar credenciais PJE: usar `sinesys_listar_credenciais_advogado`
3. Testar login manual no PJE com as credenciais
4. Verificar logs do servidor Sinesys para erros específicos
5. Para capturas grandes, dividir em períodos menores

### Claude Desktop não reconhece MCP

#### MCP não aparece na lista
**Sintoma:** Claude Desktop não reconhece o servidor MCP configurado.

**Causas possíveis:**
- Configuração JSON inválida em `claude_desktop_config.json`
- Path absoluto incorreto para `index.js`
- Arquivo `build/index.js` não existe
- Permissões de execução insuficientes
- Claude não reiniciado

**Soluções:**
1. Validar JSON: `cat ~/.config/Claude/claude_desktop_config.json | jq .`
2. Usar path absoluto completo: `/home/user/sinesys/mcp/build/index.js`
3. Verificar se arquivo existe: `ls -la /path/to/index.js`
4. Dar permissão de execução: `chmod +x /path/to/index.js`
5. Fechar Claude completamente (não minimizar) e reabrir
6. Verificar logs do Claude Desktop (procure por erros MCP)

### Debug e Logs

#### Habilitar logs detalhados
```bash
# Adicionar variável de ambiente
export MCP_DEBUG=true

# Ou no claude_desktop_config.json
{
  "mcpServers": {
    "sinesys": {
      "command": "node",
      "args": ["/path/to/index.js"],
      "env": {
        "MCP_DEBUG": "true",
        "SINESYS_BASE_URL": "...",
        "SINESYS_API_KEY": "..."
      }
    }
  }
}
```

#### Testar tools manualmente via stdio
```bash
# Listar todas as tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node mcp/build/index.js

# Chamar uma tool específica
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"sinesys_listar_clientes","arguments":{"pagina":1,"limite":5}}}' | node mcp/build/index.js
```

#### Verificar status do servidor
```bash
# Verificar se processo está rodando
ps aux | grep "node.*index.js"

# Verificar porta (se aplicável)
netstat -tlnp | grep :3000

# Testar conectividade
curl https://seu-sinesys.com/api/health
```

## FAQ (Perguntas Frequentes)

### Q: Qual a diferença entre API Key e Bearer Token?
**A:** API Key (`x-service-api-key`) é para serviços e automação, com acesso total ao sistema. Bearer Token (`Authorization: Bearer <token>`) é para usuários autenticados, com permissões baseadas no perfil. API Key tem prioridade e é recomendada para MCP.

### Q: Posso usar o MCP Server sem Claude Desktop?
**A:** Sim, qualquer cliente compatível com MCP pode usar o servidor via stdio JSON-RPC. Exemplos incluem outros LLMs ou ferramentas customizadas.

### Q: Como testar tools localmente sem LLM?
**A:** Use os scripts em `mcp/examples/` ou teste manual via stdio. Por exemplo: `tsx examples/test-tools.ts listar_clientes` ou pipes JSON para `node build/index.js`.

### Q: Capturas são síncronas ou assíncronas?
**A:** Assíncronas. Tools de captura retornam imediatamente com `capture_id`. Use `sinesys_consultar_status_captura` para polling manual ou `sinesys_aguardar_captura_concluir` para automático.

### Q: Posso rodar múltiplas instâncias do MCP Server?
**A:** Sim, cada instância é independente e stateless. Útil para diferentes ambientes ou clientes simultâneos.

### Q: Como atualizar o MCP Server após mudanças?
**A:** Execute `npm run mcp:build` no diretório raiz, reinicie o Claude Desktop. O servidor será recarregado automaticamente.

### Q: Há limite de requisições?
**A:** Depende da configuração do servidor Sinesys. Geralmente há rate limiting por IP/API Key. Em caso de erro 429, aguarde e tente novamente.

## Próximos Passos

- **Recursos Avançados:** Explore sampling, prompts customizados e resources do MCP
- **Integração Programática:** Use o SDK MCP para criar clientes customizados
- **Monitoramento:** Configure alertas para falhas de captura e uso excessivo
- **Performance:** Otimize queries com índices apropriados no banco
- **Segurança:** Implemente rotação automática de API Keys e auditoria de logs

## Contribuindo

### Adicionando Novas Tools

1. **Criar arquivo na estrutura correta:** Adicione em `src/tools/[entidade].ts`
2. **Seguir convenções:**
   - Nome: `sinesys_[entidade]_[acao]`
   - Input schema com Zod
   - Handler assíncrono com tipagem
   - Tratamento de erros consistente
3. **Documentação:** Atualize este README com descrição, parâmetros e exemplos
4. **Testes:** Adicione casos em `examples/test-tools.ts`
5. **Build e teste:** `npm run mcp:build && npm run mcp:start`

### Guidelines Gerais

- Use TypeScript estrito
- Mantenha compatibilidade com Node.js 20+
- Siga padrões de nomenclatura existentes
- Documente todos os campos obrigatórios/opcionais
- Inclua exemplos práticos de uso
- Trate erros gracefully com mensagens claras

## Available Tools

O servidor MCP oferece atualmente 53 ferramentas para interação com o sistema Sinesys, organizadas por entidades principais.

### 1. Clientes Tools

#### `sinesys_listar_clientes`
Lista clientes do sistema com paginação e filtros opcionais.
- **Descrição**: Retorna uma lista paginada de clientes, com suporte a filtros por busca textual, tipo de pessoa, TRT, grau, status ativo e inclusão de endereço.
- **Parâmetros de entrada**:
  - `pagina` (number, opcional): Número da página (padrão: 1)
  - `limite` (number, opcional): Itens por página (padrão: 10)
  - `busca` (string, opcional): Busca textual em nome, fantasia, CPF, CNPJ ou e-mail
  - `tipoPessoa` ('pf' | 'pj', opcional): Tipo de pessoa (física ou jurídica)
  - `trt` (string, opcional): Tribunal Regional do Trabalho
  - `grau` ('primeiro_grau' | 'segundo_grau', opcional): Grau do processo
  - `incluirEndereco` (boolean, opcional): Incluir dados de endereço via JOIN
  - `ativo` (boolean, opcional): Filtrar por status ativo/inativo
- **Exemplo de uso**:
  ```json
  {
    "pagina": 1,
    "limite": 10,
    "busca": "João Silva",
    "tipoPessoa": "pf",
    "incluirEndereco": true
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: { clientes: Cliente[], paginacao: { pagina, limite, total, totalPaginas } }, error?: string }`

#### `sinesys_buscar_cliente`
Busca um cliente específico pelo ID.
- **Descrição**: Retorna os dados completos de um cliente ou erro 404 se não encontrado.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID do cliente (inteiro positivo)
- **Exemplo de uso**:
  ```json
  {
    "id": 123
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: Cliente, error?: string }`

#### `sinesys_criar_cliente`
Cria um novo cliente (pessoa física ou jurídica).
- **Descrição**: Cria um cliente PF ou PJ com validação de campos obrigatórios (nome e CPF para PF; nome e CNPJ para PJ). Outros campos são opcionais.
- **Parâmetros de entrada**: Objeto discriminado por `tipoPessoa`:
  - Para PF: `{ tipoPessoa: 'pf', nome: string, cpf: string, nomeSocialFantasia?: string, emails?: string[], ... }` (campos adicionais como endereços, contatos, etc.)
  - Para PJ: `{ tipoPessoa: 'pj', nome: string, cnpj: string, nomeSocialFantasia?: string, inscricaoEstadual?: string, ... }` (campos adicionais como dados empresariais)
- **Exemplo de uso**:
  ```json
  {
    "tipoPessoa": "pf",
    "nome": "João Silva",
    "cpf": "12345678900",
    "emails": ["joao@email.com"]
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: Cliente, error?: string }`

#### `sinesys_atualizar_cliente`
Atualiza um cliente existente.
- **Descrição**: Atualiza parcialmente um cliente com os campos fornecidos em `dados`.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID do cliente (inteiro positivo)
  - `dados` (object, obrigatório): Campos parciais a atualizar (ex: nome, cpf, emails, observacoes, ativo)
- **Exemplo de uso**:
  ```json
  {
    "id": 123,
    "dados": {
      "nome": "João Silva Atualizado",
      "ativo": true
    }
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: Cliente, error?: string }`

### 2. Contratos Tools

#### `sinesys_listar_contratos`
Lista contratos com paginação e filtros.
- **Descrição**: Retorna uma lista paginada de contratos, com filtros por área de direito, tipo de contrato, status, etc.
- **Parâmetros de entrada**:
  - `pagina` (number, opcional): Número da página
  - `limite` (number, opcional): Itens por página
  - `busca` (string, opcional): Busca textual em observações
  - `areaDireito` ('trabalhista' | 'civil' | ..., opcional): Área de direito
  - `tipoContrato` ('ajuizamento' | 'defesa' | ..., opcional): Tipo de contrato
  - `tipoCobranca` ('pro_exito' | 'pro_labore', opcional): Tipo de cobrança
  - `status` ('em_contratacao' | 'contratado' | ..., opcional): Status do contrato
  - `clienteId` (number, opcional): ID do cliente
  - `parteContrariaId` (number, opcional): ID da parte contrária
  - `responsavelId` (number, opcional): ID do responsável
- **Exemplo de uso**:
  ```json
  {
    "pagina": 1,
    "limite": 10,
    "areaDireito": "trabalhista",
    "status": "contratado"
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: { contratos: Contrato[], paginacao: { pagina, limite, total, totalPaginas } }, error?: string }`

#### `sinesys_buscar_contrato`
Busca um contrato por ID.
- **Descrição**: Retorna dados completos de um contrato, incluindo partes JSONB.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID do contrato (inteiro positivo)
- **Exemplo de uso**:
  ```json
  {
    "id": 456
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: Contrato, error?: string }`

#### `sinesys_criar_contrato`
Cria um novo contrato.
- **Descrição**: Cria um contrato com campos obrigatórios (areaDireito, tipoContrato, tipoCobranca, clienteId, poloCliente).
- **Parâmetros de entrada**:
  - `areaDireito` (enum, obrigatório): Área de direito
  - `tipoContrato` (enum, obrigatório): Tipo de contrato
  - `tipoCobranca` (enum, obrigatório): Tipo de cobrança
  - `clienteId` (number, obrigatório): ID do cliente
  - `poloCliente` ('autor' | 're', obrigatório): Polo do cliente
  - Outros campos opcionais: parteContrariaId, parteAutora, parteRe, datas, responsavelId, observacoes
- **Exemplo de uso**:
  ```json
  {
    "areaDireito": "trabalhista",
    "tipoContrato": "ajuizamento",
    "tipoCobranca": "pro_exito",
    "clienteId": 123,
    "poloCliente": "autor",
    "observacoes": "Contrato de ajuizamento trabalhista"
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: Contrato, error?: string }`

#### `sinesys_atualizar_contrato`
Atualiza um contrato existente.
- **Descrição**: Atualiza parcialmente um contrato com os campos em `dados`.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID do contrato
  - `dados` (object, obrigatório): Campos parciais a atualizar (ex: status, responsavelId, observacoes)
- **Exemplo de uso**:
  ```json
  {
    "id": 456,
    "dados": {
      "status": "distribuido",
      "responsavelId": 789
    }
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: Contrato, error?: string }`

### 3. Acervo Tools

#### `sinesys_listar_acervo`
Lista processos do acervo com filtros avançados.
- **Descrição**: Lista processos com paginação, filtros, ordenação e agrupamento. Suporte a modo unificado e agrupado.
- **Parâmetros de entrada**: Múltiplos filtros (todos opcionais), incluindo pagina, limite, unified, origem, trt, grau, responsavelId, busca, numeroProcesso, datas, ordenarPor, ordem, agruparPor, incluirContagem
- **Exemplo de uso**:
  ```json
  {
    "pagina": 1,
    "limite": 20,
    "busca": "João",
    "ordenarPor": "data_autuacao",
    "ordem": "desc"
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: { processos: Acervo[], paginacao: ... } | { agrupamentos: ..., total: number }, error?: string }`

#### `sinesys_buscar_acervo`
Busca um processo por ID.
- **Descrição**: Retorna dados completos de um processo do acervo.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID do processo
- **Exemplo de uso**:
  ```json
  {
    "id": 789
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: Acervo, error?: string }`

#### `sinesys_atribuir_responsavel_acervo`
Atribui/transfere/desatribui responsável de um processo.
- **Descrição**: Gerencia atribuição de responsável (null para desatribuir).
- **Parâmetros de entrada**:
  - `processoId` (number, obrigatório): ID do processo
  - `responsavelId` (number | null, obrigatório): ID do responsável ou null
- **Exemplo de uso**:
  ```json
  {
    "processoId": 789,
    "responsavelId": 101
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: { id: number, responsavel_id: number | null }, error?: string }`

### 4. Audiências Tools

#### `sinesys_listar_audiencias`
Lista audiências com filtros avançados (TRT, grau, responsável, busca, status, modalidade, datas, ordenação). Limite máximo 1000 para visualizações de calendário.
- **Descrição**: Lista audiências com paginação, filtros complexos incluindo modalidade (virtual/presencial/híbrida), status (M=Marcada, R=Realizada, C=Cancelada), tipos de audiência, ranges de datas ISO, e ordenação por múltiplos campos. Limite máximo 1000 (ideal para calendários).
- **Parâmetros de entrada**:
  - `pagina` (number, opcional): Número da página
  - `limite` (number, opcional): Itens por página (máx 1000)
  - `trt` (string, opcional): Tribunal Regional do Trabalho
  - `grau` ('primeiro_grau' | 'segundo_grau', opcional): Grau do processo
  - `responsavel_id` (number | 'null', opcional): ID do responsável ou "null" para sem responsável
  - `sem_responsavel` (boolean, opcional): Filtrar sem responsável
  - `busca` (string, opcional): Busca textual
  - `numero_processo` (string, opcional): Número do processo
  - `polo_ativo_nome` (string, opcional): Nome do polo ativo
  - `polo_passivo_nome` (string, opcional): Nome do polo passivo
  - `status` ('M' | 'R' | 'C', opcional): Status da audiência
  - `modalidade` ('virtual' | 'presencial' | 'hibrida', opcional): Modalidade
  - `tipo_descricao` (string, opcional): Descrição do tipo
  - `tipo_codigo` (string, opcional): Código do tipo
  - `tipo_is_virtual` (boolean, opcional): Se é virtual
  - `data_inicio_inicio` (string, opcional): Data início mínimo (ISO)
  - `data_inicio_fim` (string, opcional): Data início máximo (ISO)
  - `data_fim_inicio` (string, opcional): Data fim mínimo (ISO)
  - `data_fim_fim` (string, opcional): Data fim máximo (ISO)
  - `ordenar_por` (enum, opcional): Campo de ordenação
  - `ordem` ('asc' | 'desc', opcional): Ordem
- **Exemplo de uso**:
  ```json
  {
    "pagina": 1,
    "limite": 50,
    "modalidade": "virtual",
    "data_inicio_inicio": "2023-01-01T00:00:00Z",
    "ordenar_por": "data_inicio",
    "ordem": "asc"
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: { audiencias: Audiencia[], paginacao: ... }, error?: string }`

#### `sinesys_criar_audiencia`
Cria audiência manual (id_pje=0). Requer processo_id, advogado_id, data_inicio, data_fim.
- **Descrição**: Cria audiência manual com id_pje=0. Campos obrigatórios: processo_id, advogado_id, data_inicio, data_fim (ISO 8601).
- **Parâmetros de entrada**:
  - `processo_id` (number, obrigatório): ID do processo
  - `advogado_id` (number, obrigatório): ID do advogado
  - `data_inicio` (string, obrigatório): Data início (ISO)
  - `data_fim` (string, obrigatório): Data fim (ISO)
  - `tipo_audiencia_id` (number, opcional): ID do tipo
  - `sala_audiencia_id` (number, opcional): ID da sala
  - `url_audiencia_virtual` (string, opcional): URL virtual
  - `endereco_presencial` (string, opcional): Endereço presencial
  - `observacoes` (string, opcional): Observações
  - `responsavel_id` (number, opcional): ID do responsável
- **Exemplo de uso**:
  ```json
  {
    "processo_id": 123,
    "advogado_id": 456,
    "data_inicio": "2023-06-01T10:00:00Z",
    "data_fim": "2023-06-01T12:00:00Z",
    "modalidade": "virtual"
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: Audiencia, error?: string }`

#### `sinesys_atribuir_responsavel_audiencia`
Atribui/transfere/desatribui responsável de audiência.
- **Descrição**: Atribui responsável (número positivo) ou desatribui (null). Registra em logs.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID da audiência
  - `responsavelId` (number | null, obrigatório): ID do responsável ou null
- **Exemplo de uso**:
  ```json
  {
    "id": 789,
    "responsavelId": 101
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: { id: number, responsavel_id: number | null }, error?: string }`

#### `sinesys_atualizar_modalidade_audiencia`
Atualiza modalidade (virtual/presencial/híbrida). Híbrida só pode ser definida manualmente.
- **Descrição**: Atualiza modalidade. Híbrida manual; virtual/presencial por triggers.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID da audiência
  - `modalidade` ('virtual' | 'presencial' | 'hibrida', obrigatório): Modalidade
- **Exemplo de uso**:
  ```json
  {
    "id": 789,
    "modalidade": "hibrida"
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: Audiencia, error?: string }`

#### `sinesys_atualizar_observacoes_audiencia`
Atualiza observações da audiência.
- **Descrição**: Atualiza observações (string ou null para remover).
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID da audiência
  - `observacoes` (string | null, obrigatório): Observações
- **Exemplo de uso**:
  ```json
  {
    "id": 789,
    "observacoes": "Audiência remarcada"
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: Audiencia, error?: string }`

### 5. Pendentes de Manifestação Tools

#### `sinesys_listar_pendentes_manifestacao`
Lista pendentes com filtros específicos (prazo_vencido, datas de ciência/expediente) e suporte a agrupamento (agrupar_por). Retorna estrutura diferente quando agrupado.
- **Descrição**: Lista pendentes com filtros avançados, agrupamento (retorna agrupamentos com contagens ou pendentes completos), limite máx 100. Quando agrupar_por presente, estrutura muda para agrupamentos.
- **Parâmetros de entrada**:
  - `pagina` (number, opcional): Página
  - `limite` (number, opcional): Limite (máx 100)
  - `trt` (string, opcional): TRT
  - `grau` ('primeiro_grau' | 'segundo_grau', opcional): Grau
  - `responsavel_id` (number | 'null', opcional): Responsável
  - `sem_responsavel` (boolean, opcional): Sem responsável
  - `busca` (string, opcional): Busca textual
  - `numero_processo` (string, opcional): Número processo
  - `nome_parte_autora` (string, opcional): Nome autora
  - `nome_parte_re` (string, opcional): Nome ré
  - `descricao_orgao_julgador` (string, opcional): Descrição órgão
  - `sigla_orgao_julgador` (string, opcional): Sigla órgão
  - `classe_judicial` (string, opcional): Classe judicial
  - `codigo_status_processo` (string, opcional): Código status
  - `segredo_justica` (boolean, opcional): Segredo justiça
  - `juizo_digital` (boolean, opcional): Juízo digital
  - `processo_id` (number, opcional): ID processo
  - `prazo_vencido` (boolean, opcional): Prazo vencido
  - `tipo_expediente_id` (number | 'null', opcional): Tipo expediente
  - `sem_tipo` (boolean, opcional): Sem tipo
  - `baixado` (boolean, opcional): Baixado
  - `data_prazo_legal_inicio` (string, opcional): Prazo legal min (ISO)
  - `data_prazo_legal_fim` (string, opcional): Prazo legal max (ISO)
  - `data_ciencia_inicio` (string, opcional): Ciência min (ISO)
  - `data_ciencia_fim` (string, opcional): Ciência max (ISO)
  - `data_criacao_expediente_inicio` (string, opcional): Criação expediente min (ISO)
  - `data_criacao_expediente_fim` (string, opcional): Criação expediente max (ISO)
  - `data_autuacao_inicio` (string, opcional): Autuação min (ISO)
  - `data_autuacao_fim` (string, opcional): Autuação max (ISO)
  - `data_arquivamento_inicio` (string, opcional): Arquivamento min (ISO)
  - `data_arquivamento_fim` (string, opcional): Arquivamento max (ISO)
  - `ordenar_por` (enum, opcional): Ordenação
  - `ordem` ('asc' | 'desc', opcional): Ordem
  - `agrupar_por` (enum, opcional): Agrupamento (ex: 'trt', 'responsavel_id')
  - `incluir_contagem` (boolean, opcional): Incluir contagem
- **Exemplo de uso**:
  ```json
  {
    "pagina": 1,
    "limite": 50,
    "prazo_vencido": true,
    "agrupar_por": "responsavel_id",
    "incluir_contagem": true
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: { pendentes: Pendente[], paginacao: ... } | { agrupamentos: ..., total: number }, error?: string }`

#### `sinesys_atribuir_responsavel_pendente`
Atribui/transfere/desatribui responsável de pendente.
- **Descrição**: Atribui responsável (número ou null). Registra em logs.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID do pendente
  - `responsavelId` (number | null, obrigatório): ID responsável ou null
- **Exemplo de uso**:
  ```json
  {
    "id": 101,
    "responsavelId": 202
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: { id: number, responsavel_id: number | null }, error?: string }`

#### `sinesys_baixar_pendente`
Marca pendente como respondido. Requer protocolo_id OU justificativa.
- **Descrição**: Marca como respondido. Obrigatório protocolo_id ou justificativa. Registra em logs.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID do pendente
  - `protocolo_id` (string, opcional): Protocolo
  - `justificativa` (string, opcional): Justificativa
- **Exemplo de uso**:
  ```json
  {
    "id": 101,
    "protocolo_id": "PROTO-123"
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: Pendente, error?: string }`

#### `sinesys_reverter_baixa_pendente`
Reverte baixa de pendente, limpando campos relacionados.
- **Descrição**: Reverte baixa, limpa baixado_em, protocolo_id, justificativa_baixa. Registra em logs.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID do pendente
- **Exemplo de uso**:
  ```json
  {
    "id": 101
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: Pendente, error?: string }`

### 6. Expedientes Manuais Tools

#### `sinesys_listar_expedientes_manuais`
Lista expedientes manuais com filtros (processo, TRT, grau, tipo, responsável, prazo_vencido, baixado, criado_por).
- **Descrição**: Lista expedientes manuais com paginação, filtros, limite máx 100.
- **Parâmetros de entrada**:
  - `pagina` (number, opcional): Página
  - `limite` (number, opcional): Limite (máx 100)
  - `busca` (string, opcional): Busca textual
  - `processo_id` (number, opcional): ID processo
  - `trt` (string, opcional): TRT
  - `grau` ('primeiro_grau' | 'segundo_grau', opcional): Grau
  - `tipo_expediente_id` (number, opcional): Tipo expediente
  - `responsavel_id` (number | 'null', opcional): Responsável
  - `prazo_vencido` (boolean, opcional): Prazo vencido
  - `baixado` (boolean, opcional): Baixado
  - `criado_por` (number, opcional): Criado por
  - `data_prazo_legal_inicio` (string, opcional): Prazo legal min (ISO)
  - `data_prazo_legal_fim` (string, opcional): Prazo legal max (ISO)
  - `ordenar_por` (string, opcional): Ordenação
  - `ordem` ('asc' | 'desc', opcional): Ordem
- **Exemplo de uso**:
  ```json
  {
    "pagina": 1,
    "limite": 20,
    "baixado": false,
    "ordenar_por": "data_prazo_legal",
    "ordem": "asc"
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: { expedientes: ExpedienteManual[], paginacao: ... }, error?: string }`

#### `sinesys_criar_expediente_manual`
Cria expediente manual. Requer processo_id e descricao.
- **Descrição**: Cria expediente manual. Obrigatório processo_id e descricao.
- **Parâmetros de entrada**:
  - `processo_id` (number, obrigatório): ID processo
  - `descricao` (string, obrigatório): Descrição
  - `tipo_expediente_id` (number, opcional): Tipo
  - `data_prazo_legal` (string, opcional): Prazo legal (ISO)
  - `responsavel_id` (number, opcional): Responsável
  - `observacoes` (string, opcional): Observações
- **Exemplo de uso**:
  ```json
  {
    "processo_id": 123,
    "descricao": "Expediente de contestação"
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: ExpedienteManual, error?: string }`

#### `sinesys_buscar_expediente_manual`
Busca expediente manual por ID.
- **Descrição**: Retorna dados completos ou erro 404.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID expediente
- **Exemplo de uso**:
  ```json
  {
    "id": 456
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: ExpedienteManual, error?: string }`

#### `sinesys_atualizar_expediente_manual`
Atualiza campos de expediente manual (atualização parcial).
- **Descrição**: Atualiza parcialmente campos fornecidos em dados.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID expediente
  - `dados` (object, obrigatório): Campos parciais (descricao, tipo_expediente_id, data_prazo_legal, responsavel_id, observacoes)
- **Exemplo de uso**:
  ```json
  {
    "id": 456,
    "dados": {
      "observacoes": "Atualizado"
    }
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: ExpedienteManual, error?: string }`

#### `sinesys_deletar_expediente_manual`
Deleta expediente manual permanentemente.
- **Descrição**: Deleta permanentemente.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID expediente
- **Exemplo de uso**:
  ```json
  {
    "id": 456
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: { message: string }, error?: string }`

#### `sinesys_atribuir_responsavel_expediente_manual`
Atribui/remove responsável de expediente manual.
- **Descrição**: Atribui (número) ou remove (null).
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID expediente
  - `responsavel_id` (number | null, obrigatório): Responsável
- **Exemplo de uso**:
  ```json
  {
    "id": 456,
    "responsavel_id": 789
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: ExpedienteManual, error?: string }`

#### `sinesys_baixar_expediente_manual`
Marca expediente como concluído. Requer protocolo_id OU justificativa_baixa. Usa POST (diferente de pendentes que usa PATCH).
- **Descrição**: Marca como concluído. Obrigatório protocolo_id ou justificativa_baixa. Usa POST.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID expediente
  - `protocolo_id` (string, opcional): Protocolo
  - `justificativa_baixa` (string, opcional): Justificativa
- **Exemplo de uso**:
  ```json
  {
    "id": 456,
    "justificativa_baixa": "Respondido via e-mail"
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: ExpedienteManual, error?: string }`

#### `sinesys_reverter_baixa_expediente_manual`
Reverte baixa de expediente manual. Usa POST (diferente de pendentes que usa PATCH).
- **Descrição**: Reverte baixa. Usa POST.
- **Parâmetros de entrada**:
  - `id` (number, obrigatório): ID expediente
- **Exemplo de uso**:
  ```json
  {
    "id": 456
  }
  ```
- **Resposta esperada**: JSON com `{ success: boolean, data: ExpedienteManual, error?: string }`

### 7. Captura (8 tools)

#### `sinesys_iniciar_captura_acervo_geral`
Inicia captura de acervo geral.
- **Descrição**: Inicia captura de processos do acervo geral (todos os processos ativos).

#### `sinesys_iniciar_captura_audiencias`
Inicia captura de audiências.
- **Descrição**: Inicia captura de audiências marcadas no período especificado (padrão: hoje até +365 dias).

#### `sinesys_iniciar_captura_pendentes`
Inicia captura de pendentes de manifestação.
- **Descrição**: Inicia captura de processos pendentes de manifestação, com filtros de prazo.

#### `sinesys_iniciar_captura_timeline`
Captura timeline de processo específico.
- **Descrição**: Captura timeline completa de um processo específico (movimentos + documentos).

#### `sinesys_iniciar_captura_partes`
Captura partes de processos.
- **Descrição**: Captura partes (pessoas envolvidas) de processos, identificando clientes/partes contrárias/terceiros.

#### `sinesys_consultar_status_captura`
Consulta status de captura assíncrona.
- **Descrição**: Consulta status de uma captura assíncrona (pending/in_progress/completed/failed) com resultado detalhado.

#### `sinesys_listar_historico_capturas`
Lista histórico de capturas.
- **Descrição**: Lista histórico de capturas realizadas com filtros avançados.

#### `sinesys_aguardar_captura_concluir`
Aguarda captura concluir com polling automático.
- **Descrição**: Aguarda uma captura assíncrona ser concluída (completed/failed) com polling automático. Útil quando você precisa do resultado final sem monitorar manualmente. Intervalo padrão: 5s, timeout padrão: 5min.
- **Parâmetros de entrada**:
  - `capture_id` (number, obrigatório): ID da captura a aguardar
  - `interval_ms` (number, opcional): Intervalo entre consultas em ms (padrão: 5000)
  - `timeout_ms` (number, opcional): Timeout máximo em ms (padrão: 300000 = 5min)
- **Exemplo de uso**:
  ```json
  {
    "capture_id": 123,
    "interval_ms": 3000,
    "timeout_ms": 120000
  }
  ```
- **Resposta esperada**: JSON com `{ status, data, polling_info: { total_polls, elapsed_ms } }`

### 8. Advogados (7 tools)

#### `sinesys_listar_advogados`
Lista advogados.
- **Descrição**: Lista advogados do escritório com filtros opcionais (busca em nome completo, CPF ou OAB).

#### `sinesys_criar_advogado`
Cria advogado.
- **Descrição**: Cadastra novo advogado no sistema.

#### `sinesys_listar_credenciais_advogado`
Lista credenciais PJE.
- **Descrição**: Lista credenciais de acesso ao PJE de um advogado (filtro por ativas/inativas).

#### `sinesys_criar_credencial_advogado`
Cria credencial PJE.
- **Descrição**: Cadastra nova credencial de acesso ao tribunal para o advogado (senha é criptografada no backend).

#### `sinesys_atualizar_credencial_advogado`
Atualiza credencial.
- **Descrição**: Atualiza credencial existente (atualização parcial, apenas campos fornecidos são alterados).

#### `sinesys_ativar_credencial_advogado`
Ativa credencial.
- **Descrição**: Ativa credencial desativada (atalho para atualizar active=true).

#### `sinesys_desativar_credencial_advogado`
Desativa credencial.
- **Descrição**: Desativa credencial ativa (atalho para atualizar active=false, não deleta do banco).

### 9. Usuários (6 tools)

#### `sinesys_listar_usuarios`
Lista usuários.
- **Descrição**: Lista usuários do sistema com filtros (busca em nome completo, nome de exibição, CPF ou e-mail corporativo).
- **Parâmetros de entrada** (todos camelCase):
  - `pagina` (number, opcional): Número da página
  - `limite` (number, opcional): Itens por página
  - `busca` (string, opcional): Busca textual
  - `ativo` (boolean, opcional): Filtrar por status ativo/inativo
  - `oab` (string, opcional): Filtrar por número OAB
  - `ufOab` (string, opcional): Filtrar por UF da OAB
- **Exemplo de uso**:
  ```json
  {
    "pagina": 1,
    "limite": 10,
    "busca": "João",
    "ufOab": "MG"
  }
  ```

#### `sinesys_buscar_usuario_por_id`
Busca por ID.
- **Descrição**: Busca usuário específico por ID com dados completos.

#### `sinesys_buscar_usuario_por_email`
Busca por email.
- **Descrição**: Busca usuário por e-mail corporativo (útil para verificar existência antes de criar).

#### `sinesys_buscar_usuario_por_cpf`
Busca por CPF.
- **Descrição**: Busca usuário por CPF (aceita com ou sem formatação).

#### `sinesys_criar_usuario`
Cria usuário.
- **Descrição**: Cria novo usuário no sistema (cria conta em auth.users + registro em public.usuarios).
- **Parâmetros de entrada** (todos camelCase):
  - `nomeCompleto` (string, obrigatório): Nome completo
  - `nomeExibicao` (string, obrigatório): Nome de exibição
  - `cpf` (string, obrigatório): CPF
  - `emailCorporativo` (string, obrigatório): E-mail corporativo
  - `senha` (string, obrigatório): Senha (mín. 6 caracteres)
  - `rg` (string, opcional): RG
  - `dataNascimento` (string, opcional): Data de nascimento
  - `genero` (enum, opcional): masculino, feminino, outro, prefiro_nao_informar
  - `oab` (string, opcional): Número OAB
  - `ufOab` (string, opcional): UF da OAB
  - `emailPessoal` (string, opcional): E-mail pessoal
  - `telefone` (string, opcional): Telefone
  - `ramal` (string, opcional): Ramal
  - `endereco` (object, opcional): Objeto com campos de endereço
  - `ativo` (boolean, opcional): Status ativo
- **Exemplo de uso**:
  ```json
  {
    "nomeCompleto": "João Silva",
    "nomeExibicao": "João",
    "cpf": "12345678900",
    "emailCorporativo": "joao@empresa.com",
    "senha": "senha123",
    "ufOab": "MG"
  }
  ```

#### `sinesys_atualizar_usuario`
Atualiza usuário.
- **Descrição**: Atualiza usuário existente (atualização parcial). Campo `isSuperAdmin` só pode ser alterado por outro super admin. Ao desativar (ativo=false), todos os itens atribuídos ao usuário serão automaticamente desatribuídos.
- **Parâmetros de entrada** (todos camelCase):
  - `usuarioId` (number, obrigatório): ID do usuário
  - `nomeCompleto` (string, opcional): Nome completo
  - `nomeExibicao` (string, opcional): Nome de exibição
  - `cpf` (string, opcional): CPF
  - `rg` (string, opcional): RG
  - `dataNascimento` (string, opcional): Data de nascimento
  - `genero` (enum, opcional): masculino, feminino, outro, prefiro_nao_informar
  - `oab` (string, opcional): Número OAB
  - `ufOab` (string, opcional): UF da OAB
  - `emailPessoal` (string, opcional): E-mail pessoal
  - `emailCorporativo` (string, opcional): E-mail corporativo
  - `telefone` (string, opcional): Telefone
  - `ramal` (string, opcional): Ramal
  - `endereco` (object, opcional): Objeto com campos de endereço
  - `ativo` (boolean, opcional): Status ativo
  - `isSuperAdmin` (boolean, opcional): Status de super admin
- **Exemplo de uso**:
  ```json
  {
    "usuarioId": 123,
    "nomeCompleto": "João Silva Atualizado",
    "ativo": true
  }
  ```

### 10. Admin (3 tools)

#### `sinesys_obter_estatisticas_cache`
Estatísticas do Redis.
- **Descrição**: Retorna estatísticas do Redis (memória usada, hits, misses, uptime, disponibilidade). Requer autenticação.

#### `sinesys_limpar_cache`
Limpa cache (requer admin).
- **Descrição**: Limpa cache Redis manualmente. Se `pattern` fornecido (ex: 'pendentes:*'), remove apenas chaves correspondentes; caso contrário, limpa todo o cache. **Requer permissão de administrador** (ou Service API Key).

#### `sinesys_verificar_saude_sistema`
Health check.
- **Descrição**: Verifica status da aplicação (health check endpoint). Retorna timestamp ISO 8601 e status 'ok'. Não requer autenticação.

## Usage Examples

#### Captura Assíncrona com Polling Manual

As operações de captura retornam imediatamente com um `capture_id` e processam em background:

```json
// 1. Iniciar captura
{
  "tool": "sinesys_iniciar_captura_audiencias",
  "arguments": {
    "advogado_id": 1,
    "credencial_ids": [5, 6],
    "data_inicio": "2024-01-01",
    "data_fim": "2024-12-31"
  }
}
// Response: { "success": true, "capture_id": 123, "status": "in_progress" }

// 2. Consultar status periodicamente
{
  "tool": "sinesys_consultar_status_captura",
  "arguments": { "capture_id": 123 }
}
// Response: { "status": "completed", "resultado": {...} }
```

#### Captura Assíncrona com Polling Automático (Recomendado)

Para aguardar automaticamente a conclusão de uma captura:

```json
// 1. Iniciar captura
{
  "tool": "sinesys_iniciar_captura_audiencias",
  "arguments": {
    "advogado_id": 1,
    "credencial_ids": [5, 6],
    "data_inicio": "2024-01-01",
    "data_fim": "2024-12-31"
  }
}
// Response: { "success": true, "capture_id": 123, "status": "in_progress" }

// 2. Aguardar conclusão com polling automático
{
  "tool": "sinesys_aguardar_captura_concluir",
  "arguments": {
    "capture_id": 123,
    "interval_ms": 5000,
    "timeout_ms": 300000
  }
}
// Response: { "status": "completed", "data": {...}, "polling_info": { "total_polls": 5, "elapsed_ms": 25000 } }
```

#### Gerenciar Credenciais PJE

```json
// Criar credencial para TRT3 primeiro grau
{
  "tool": "sinesys_criar_credencial_advogado",
  "arguments": {
    "advogado_id": 1,
    "tribunal": "TRT3",
    "grau": "primeiro_grau",
    "senha": "senha_segura"
  }
}
```

## Important Notes

- **Capturas são assíncronas**: Tools de captura retornam imediatamente. Use `sinesys_consultar_status_captura` para polling manual ou `sinesys_aguardar_captura_concluir` para polling automático.
- **Credenciais são criptografadas**: Senhas de credenciais PJE são armazenadas com criptografia no banco.
- **Permissões de admin**: `sinesys_limpar_cache` requer permissão de administrador ou Service API Key.
- **Campos camelCase**: Os tools de usuários (`sinesys_criar_usuario`, `sinesys_atualizar_usuario`, `sinesys_listar_usuarios`) usam campos em camelCase (ex: `nomeCompleto`, `emailCorporativo`, `ufOab`) para compatibilidade com a API.

---

Diferenças importantes entre entidades:
- **Audiências**: Limite máximo 1000 para calendários; modalidade híbrida só manual.
- **Pendentes**: Suporte a agrupamento (estrutura diferente); baixa/reverter usa PATCH.
- **Expedientes Manuais**: CRUD completo; baixa/reverter usa POST (não PATCH como pendentes).
- **Capturas**: Operações assíncronas que retornam `capture_id` imediatamente; use polling manual com `sinesys_consultar_status_captura` ou automático com `sinesys_aguardar_captura_concluir`.
- **Credenciais PJE**: Senhas armazenadas criptografadas; gerenciamento via advogados.
- **Usuários**: Permissões gerenciadas via `isSuperAdmin`; desativação automática de atribuições; todos os campos em camelCase (`nomeCompleto`, `emailCorporativo`, `ufOab`, etc.).
- **Admin**: Ferramentas sensíveis que requerem permissões especiais.