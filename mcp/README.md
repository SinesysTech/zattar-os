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

## Available Tools

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

---

Nota: Documentação completa será adicionada nas próximas fases.
