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

#### Configuração do `claude_desktop_config.json`:

- **Linux/Mac**: `~/.config/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### Exemplo de configuração JSON:

```json
{
  "mcpServers": {
    "sinesys": {
      "command": "node",
      "args": ["/caminho/absoluto/para/sinesys/mcp/build/index.js"],
      "env": {
        "SINESYS_BASE_URL": "https://seu-sinesys.com",
        "SINESYS_API_KEY": "sua_service_api_key_aqui"
      }
    }
  }
}
```

Substitua `/caminho/absoluto/para/sinesys` pelo caminho real do projeto.

Após configurar, reiniciar Claude Desktop para carregar o servidor.

Dica: Verifique logs do Claude Desktop em caso de problemas de conexão.

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

## Troubleshooting

- **Servidor não inicia**: Verifique se `npm run mcp:build` foi executado e se `build/index.js` existe
- **Erro de autenticação**: Confirme que `SINESYS_API_KEY` ou `SINESYS_SESSION_TOKEN` estão configurados corretamente
- **Tool não encontrada**: Execute `npm run mcp:build` para recompilar após adicionar novas tools
- **Erro de validação Zod**: Verifique se os argumentos passados correspondem ao schema da tool (use `tools/list` para ver schemas)
- **Debug**: Habilite logs detalhados com `MCP_DEBUG=true npm run mcp:start`

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