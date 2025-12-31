# Referência Completa - Tools MCP Sinesys

## Visão Geral

O Sinesys expõe **88 ferramentas MCP** organizadas em 18 módulos funcionais. Estas ferramentas permitem que agentes de IA interajam com o sistema de forma estruturada e segura.

## Índice Rápido

| Módulo | Tools | Descrição |
|--------|-------|-----------|
| Processos | 4 | Lista processos do sistema com suporte a filtros (status, TR... |
| Partes (Clientes, Contrárias, Terceiros, Representantes) | 6 | Lista clientes/partes do sistema com filtros (nome, CPF/CNPJ... |
| Contratos | 4 | Lista contratos do sistema com filtros por tipo, status, cli... |
| Financeiro | 29 | Lista plano de contas do sistema com hierarquia... |
| Chat e Comunicação | 6 | Lista salas de chat disponíveis para o usuário... |
| Documentos | 6 | Lista documentos do sistema com filtros por pasta, tags e bu... |
| Expedientes | 7 | Lista expedientes do sistema com filtros por responsável, pr... |
| Audiências | 6 | Lista audiências do sistema com filtros por data, tipo, stat... |
| Obrigações (Acordos e Repasses) | 5 | Lista acordos/condenações do sistema com filtros... |
| Recursos Humanos | 2 | Lista salários de funcionários... |
| Dashboard e Métricas | 2 | Obtém métricas gerais do escritório (processos, receitas, de... |
| Busca Semântica | 1 | Realiza busca semântica com IA em documentos, processos e co... |
| Captura (CNJ e Timeline) | 2 | Lista capturas do sistema Comunica CNJ... |
| Usuários | 4 | Lista usuários do sistema com filtros por busca, status ativ... |
| Acervo | 1 | Lista processos do acervo com filtros... |
| Assistentes IA | 1 | Lista assistentes de IA disponíveis no sistema... |
| Cargos | 1 | Lista cargos disponíveis no sistema... |
| assinatura-digital | 1 | Lista templates de assinatura digital disponíveis... |

---

## Módulos

### Processos

**Total de tools:** 4

#### `listar_processos`

Lista processos do sistema com suporte a filtros (status, TRT, grau, advogado, período, busca textual)

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de processos |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `status` | `string` | ❌ | - | - |
| `trt` | `string` | ❌ | - | - |
| `advogadoId` | `number` | ❌ | - | Filtrar por ID do advogado responsável |
| `dataInicio` | `string` | ❌ | - | Data início do período (YYYY-MM-DD) |
| `dataFim` | `string` | ❌ | - | Data fim do período (YYYY-MM-DD) |
| `busca` | `string` | ❌ | - | Busca textual por número do processo ou partes |

**Exemplos:**

```typescript
// Listar processos ativos do TRT15
await executeMcpTool('listar_processos', {
  limite: 10,
  trt: 'TRT15',
  status: 'ativo'
});
```

```typescript
// Listar processos por período
await executeMcpTool('listar_processos', {
  data_inicio: '2025-01-01',
  data_fim: '2025-01-31',
  limite: 20
});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

#### `buscar_processos_por_cpf`

Busca todos os processos vinculados a um cliente por CPF

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `cpf` | `string (min: 11)` | ✅ | - | CPF do cliente (apenas números) |
| `limite` | `number (min: 1, max: 100)` | ❌ | `50` | Número máximo de processos |

**Exemplos:**

```typescript
// Buscar processos de um cliente por CPF
await executeMcpTool('buscar_processos_por_cpf', {
  cpf: '12345678901',
  limite: 50
});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `cpf` é obrigatório
- **400 Bad Request:** `cpf` deve ter no mínimo 11 caracteres
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 

---

#### `buscar_processos_por_cnpj`

Busca todos os processos vinculados a um cliente por CNPJ

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `cnpj` | `string (min: 14)` | ✅ | - | CNPJ do cliente (apenas números) |
| `limite` | `number (min: 1, max: 100)` | ❌ | `50` | Número máximo de processos |

**Exemplos:**

```typescript
// Buscar processos de uma empresa por CNPJ
await executeMcpTool('buscar_processos_por_cnpj', {
  cnpj: '12345678000190',
  limite: 50
});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `cnpj` é obrigatório
- **400 Bad Request:** `cnpj` deve ter no mínimo 14 caracteres
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 

---

#### `buscar_processo_por_numero`

Busca processo pelo número processual (formato CNJ ou simplificado)

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `numeroProcesso` | `string (min: 7)` | ✅ | - | Número do processo (com ou sem formatação CNJ) |

**Exemplos:**

```typescript
// Buscar processo específico por número CNJ
await executeMcpTool('buscar_processo_por_numero', {
  numero_processo: '0001234-56.2023.5.15.0001'
});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `numeroProcesso` é obrigatório
- **400 Bad Request:** `numeroProcesso` deve ter no mínimo 7 caracteres

---

### Partes (Clientes, Contrárias, Terceiros, Representantes)

**Total de tools:** 6

#### `listar_clientes`

Lista clientes/partes do sistema com filtros (nome, CPF/CNPJ, tipo)

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de clientes |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `busca` | `string` | ❌ | - | Busca por nome ou CPF/CNPJ |

**Exemplos:**

```typescript
// Listar todos os clientes
await executeMcpTool('listar_clientes', {
  limite: 20
});
```

```typescript
// Listar apenas pessoas físicas
await executeMcpTool('listar_clientes', {
  limite: 10,
  tipo: 'fisica'
});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

#### `buscar_cliente_por_cpf`

Busca cliente por CPF com endereço e processos relacionados

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `cpf` | `string (min: 11)` | ✅ | - | CPF do cliente (apenas números) |

**Exemplos:**

```typescript
// Buscar cliente por CPF
await executeMcpTool('buscar_cliente_por_cpf', {
  cpf: '12345678901'
});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `cpf` é obrigatório
- **400 Bad Request:** `cpf` deve ter no mínimo 11 caracteres

---

#### `buscar_cliente_por_cnpj`

Busca cliente por CNPJ com endereço e processos relacionados

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `cnpj` | `string (min: 14)` | ✅ | - | CNPJ do cliente (apenas números) |

**Exemplos:**

```typescript
// Buscar cliente por CNPJ
await executeMcpTool('buscar_cliente_por_cnpj', {
  cnpj: '12345678000190'
});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `cnpj` é obrigatório
- **400 Bad Request:** `cnpj` deve ter no mínimo 14 caracteres

---

#### `listar_partes_contrarias`

Lista partes contrárias cadastradas no sistema

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de resultados |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `busca` | `string` | ❌ | - | Busca por nome ou documento |

**Exemplos:**

```typescript
// Uso básico de listar_partes_contrarias
await executeMcpTool('listar_partes_contrarias', {
  // parâmetros adequados
});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

#### `listar_terceiros`

Lista terceiros cadastrados no sistema

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de resultados |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `busca` | `string` | ❌ | - | Busca por nome ou documento |

**Exemplos:**

```typescript
// Uso básico de listar_terceiros
await executeMcpTool('listar_terceiros', {
  // parâmetros adequados
});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

#### `listar_representantes`

Lista representantes (advogados, procuradores) do sistema

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `50` | Número máximo de resultados |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `busca` | `string` | ❌ | - | Busca por nome ou OAB |

**Exemplos:**

```typescript
// Uso básico de listar_representantes
await executeMcpTool('listar_representantes', {
  // parâmetros adequados
});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

### Contratos

**Total de tools:** 4

#### `listar_contratos`

Lista contratos do sistema com filtros por tipo, status, cliente

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de contratos |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `clienteId` | `number` | ❌ | - | Filtrar por ID do cliente |

**Exemplos:**

```typescript
// Listar contratos ativos
await executeMcpTool('listar_contratos', {
  limite: 10,
  status: 'ativo'
});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

#### `criar_contrato`

Cria novo contrato no sistema

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `titulo` | `string (min: 3)` | ✅ | - | Título do contrato |
| `valor` | `number` | ✅ | - | Valor do contrato |
| `dataInicio` | `string` | ✅ | - | Data de início (YYYY-MM-DD) |
| `dataFim` | `string` | ❌ | - | Data de término (YYYY-MM-DD) |
| `descricao` | `string` | ❌ | - | Descrição detalhada |
| `parteId` | `number` | ✅ | - | ID da parte |

**Exemplos:**

```typescript
// Uso básico de criar_contrato
await executeMcpTool('criar_contrato', {
  // parâmetros adequados
});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `titulo` é obrigatório
- **400 Bad Request:** `titulo` deve ter no mínimo 3 caracteres
- **400 Bad Request:** `valor` é obrigatório
- **400 Bad Request:** `dataInicio` é obrigatório
- **400 Bad Request:** `parteId` é obrigatório

---

#### `atualizar_contrato`

Atualiza contrato existente

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `id` | `number` | ✅ | - | ID do contrato |
| `titulo` | `string (min: 3)` | ❌ | - | Título do contrato |
| `valor` | `number` | ❌ | - | Valor do contrato |
| `dataFim` | `string` | ❌ | - | Data de término (YYYY-MM-DD) |
| `descricao` | `string` | ❌ | - | Descrição detalhada |

**Exemplos:**

```typescript
// Uso básico de atualizar_contrato
await executeMcpTool('atualizar_contrato', {
  // parâmetros adequados
});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `id` é obrigatório
- **400 Bad Request:** `titulo` deve ter no mínimo 3 caracteres

---

#### `buscar_contrato_por_cliente`

Busca contratos de um cliente específico

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `cliente_id` | `number` | ✅ | - | ID do cliente |
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de contratos |

**Exemplos:**

```typescript
// Uso básico de buscar_contrato_por_cliente
await executeMcpTool('buscar_contrato_por_cliente', {
  // parâmetros adequados
});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `cliente_id` é obrigatório
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 

---

### Financeiro

**Total de tools:** 29

#### `listar_plano_contas`

Lista plano de contas do sistema com hierarquia

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|

**Exemplos:**

```typescript
await executeMcpTool('listar_plano_contas', {});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente

---

#### `criar_conta`

Cria nova conta no plano de contas

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `codigo` | `string` | ✅ | - | Código da conta |
| `nome` | `string` | ✅ | - | Nome da conta |
| `nivel` | `number` | ✅ | - | Nível hierárquico |
| `contaPaiId` | `number` | ❌ | - | ID da conta pai (para subconta) |
| `descricao` | `string` | ❌ | - | Descrição da conta |

**Exemplos:**

```typescript
await executeMcpTool('criar_conta', { codigo: '1.1.01', nome: 'Conta Exemplo' });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `codigo` é obrigatório
- **400 Bad Request:** `nome` é obrigatório
- **400 Bad Request:** `nivel` é obrigatório

---

#### `atualizar_conta`

Atualiza conta existente no plano de contas

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `id` | `number` | ✅ | - | ID da conta |
| `nome` | `string` | ❌ | - | Nome da conta |
| `descricao` | `string` | ❌ | - | Descrição da conta |
| `ativa` | `boolean` | ❌ | - | Status ativo/inativo |

**Exemplos:**

```typescript
await executeMcpTool('atualizar_conta', { conta_id: 1, nome: 'Nome Atualizado' });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `id` é obrigatório

---

#### `excluir_conta`

Remove conta do plano de contas

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `id` | `number` | ✅ | - | ID da conta |

**Exemplos:**

```typescript
await executeMcpTool('excluir_conta', { conta_id: 1 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `id` é obrigatório

---

#### `listar_lancamentos`

Lista lançamentos financeiros com filtros por período, tipo, status, busca textual

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `50` | Número máximo de lançamentos |
| `pagina` | `number (min: 1)` | ✅ | `1` | Número da página |
| `dataVencimentoInicio` | `string` | ❌ | - | Data início vencimento (YYYY-MM-DD) |
| `dataVencimentoFim` | `string` | ❌ | - | Data fim vencimento (YYYY-MM-DD) |
| `dataCompetenciaInicio` | `string` | ❌ | - | Data início competência (YYYY-MM-DD) |
| `dataCompetenciaFim` | `string` | ❌ | - | Data fim competência (YYYY-MM-DD) |
| `busca` | `string` | ❌ | - | Busca textual por descrição |
| `contaBancariaId` | `number` | ❌ | - | ID da conta bancária |
| `contaContabilId` | `number` | ❌ | - | ID da conta contábil |
| `centroCustoId` | `number` | ❌ | - | ID do centro de custo |

**Exemplos:**

```typescript
await executeMcpTool('listar_lancamentos', { data_inicio: '2025-01-01', data_fim: '2025-01-31' });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `pagina` é obrigatório
- **400 Bad Request:** `pagina` deve ter no mínimo 1 

---

#### `criar_lancamento`

Cria novo lançamento financeiro

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `valor` | `number` | ✅ | - | Valor do lançamento |
| `data` | `string` | ✅ | - | Data do lançamento (YYYY-MM-DD) |
| `descricao` | `string` | ✅ | - | Descrição do lançamento |
| `contaId` | `number` | ✅ | - | ID da conta contábil |
| `categoriaId` | `number` | ❌ | - | ID da categoria |
| `processoId` | `number` | ❌ | - | ID do processo relacionado |
| `clienteId` | `number` | ❌ | - | ID do cliente relacionado |

**Exemplos:**

```typescript
await executeMcpTool('criar_lancamento', { tipo: 'receita', valor: 1500, conta_id: 10 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `valor` é obrigatório
- **400 Bad Request:** `data` é obrigatório
- **400 Bad Request:** `descricao` é obrigatório
- **400 Bad Request:** `contaId` é obrigatório

---

#### `atualizar_lancamento`

Atualiza lançamento financeiro existente

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `id` | `number` | ✅ | - | ID do lançamento |
| `valor` | `number` | ❌ | - | Valor do lançamento |
| `dataLancamento` | `string` | ❌ | - | Data do lançamento (YYYY-MM-DD) |
| `dataCompetencia` | `string` | ❌ | - | Data de competência (YYYY-MM-DD) |
| `dataVencimento` | `string` | ❌ | - | Data de vencimento (YYYY-MM-DD) |
| `descricao` | `string` | ❌ | - | Descrição do lançamento |
| `contaContabilId` | `number` | ❌ | - | ID da conta contábil |
| `contaBancariaId` | `number` | ❌ | - | ID da conta bancária |
| `centroCustoId` | `number` | ❌ | - | ID do centro de custo |

**Exemplos:**

```typescript
await executeMcpTool('atualizar_lancamento', { lancamento_id: 1, valor: 2000 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `id` é obrigatório

---

#### `excluir_lancamento`

Remove lançamento financeiro

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `id` | `number` | ✅ | - | ID do lançamento |

**Exemplos:**

```typescript
await executeMcpTool('excluir_lancamento', { lancamento_id: 1 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `id` é obrigatório

---

#### `confirmar_lancamento`

Confirma lançamento pendente

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `id` | `number` | ✅ | - | ID do lançamento |

**Exemplos:**

```typescript
await executeMcpTool('confirmar_lancamento', { lancamento_id: 1 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `id` é obrigatório

---

#### `cancelar_lancamento`

Cancela lançamento

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `id` | `number` | ✅ | - | ID do lançamento |

**Exemplos:**

```typescript
await executeMcpTool('cancelar_lancamento', { lancamento_id: 1 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `id` é obrigatório

---

#### `estornar_lancamento`

Estorna lançamento confirmado

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `id` | `number` | ✅ | - | ID do lançamento |

**Exemplos:**

```typescript
await executeMcpTool('estornar_lancamento', { lancamento_id: 1 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `id` é obrigatório

---

#### `gerar_dre`

Gera Demonstração de Resultado do Exercício para um período

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `dataInicio` | `string` | ✅ | - | Data início do período (YYYY-MM-DD) |
| `dataFim` | `string` | ✅ | - | Data fim do período (YYYY-MM-DD) |
| `incluirComparativo` | `boolean` | ❌ | - | Incluir comparativo com período anterior |
| `incluirOrcado` | `boolean` | ❌ | - | Incluir comparativo com orçado |

**Exemplos:**

```typescript
await executeMcpTool('gerar_dre', { data_inicio: '2025-01-01', data_fim: '2025-01-31' });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `dataInicio` é obrigatório
- **400 Bad Request:** `dataFim` é obrigatório

---

#### `obter_evolucao_dre`

Obtém evolução mensal da DRE para um ano específico

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `ano` | `number (min: 2020, max: 2100)` | ✅ | - | Ano para análise (ex: 2024) |

**Exemplos:**

```typescript
await executeMcpTool('obter_evolucao_dre', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `ano` é obrigatório
- **400 Bad Request:** `ano` deve ter no mínimo 2020 
- **400 Bad Request:** `ano` deve ter no máximo 2100 

---

#### `exportar_dre_csv`

Exporta DRE em formato CSV

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `dataInicio` | `string` | ✅ | - | Data início do período (YYYY-MM-DD) |
| `dataFim` | `string` | ✅ | - | Data fim do período (YYYY-MM-DD) |

**Exemplos:**

```typescript
await executeMcpTool('exportar_dre_csv', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `dataInicio` é obrigatório
- **400 Bad Request:** `dataFim` é obrigatório

---

#### `exportar_dre_pdf`

Exporta DRE em formato PDF (retorna Base64)

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `dataInicio` | `string` | ✅ | - | Data início do período (YYYY-MM-DD) |
| `dataFim` | `string` | ✅ | - | Data fim do período (YYYY-MM-DD) |

**Exemplos:**

```typescript
await executeMcpTool('exportar_dre_pdf', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `dataInicio` é obrigatório
- **400 Bad Request:** `dataFim` é obrigatório

---

#### `obter_fluxo_caixa_unificado`

Obtém fluxo de caixa consolidado com entradas, saídas e saldo

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `dataInicio` | `string` | ✅ | - | Data início do período (YYYY-MM-DD) |
| `dataFim` | `string` | ✅ | - | Data fim do período (YYYY-MM-DD) |

**Exemplos:**

```typescript
await executeMcpTool('obter_fluxo_caixa_unificado', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `dataInicio` é obrigatório
- **400 Bad Request:** `dataFim` é obrigatório

---

#### `obter_fluxo_caixa_diario`

Obtém fluxo de caixa diário para análise detalhada de uma conta bancária

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `contaBancariaId` | `number` | ✅ | - | ID da conta bancária |
| `dataInicio` | `string` | ✅ | - | Data início do período (YYYY-MM-DD) |
| `dataFim` | `string` | ✅ | - | Data fim do período (YYYY-MM-DD) |

**Exemplos:**

```typescript
await executeMcpTool('obter_fluxo_caixa_diario', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `contaBancariaId` é obrigatório
- **400 Bad Request:** `dataInicio` é obrigatório
- **400 Bad Request:** `dataFim` é obrigatório

---

#### `obter_fluxo_caixa_por_periodo`

Obtém fluxo de caixa agrupado por período (dia/semana/mês)

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `dataInicio` | `string` | ✅ | - | Data início do período (YYYY-MM-DD) |
| `dataFim` | `string` | ✅ | - | Data fim do período (YYYY-MM-DD) |
| `contaBancariaId` | `number` | ❌ | - | ID da conta bancária (opcional) |
| `centroCustoId` | `number` | ❌ | - | ID do centro de custo (opcional) |
| `incluirProjetado` | `boolean` | ❌ | - | Incluir valores projetados |

**Exemplos:**

```typescript
await executeMcpTool('obter_fluxo_caixa_por_periodo', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `dataInicio` é obrigatório
- **400 Bad Request:** `dataFim` é obrigatório

---

#### `obter_indicadores_saude`

Obtém indicadores de saúde financeira (liquidez, cobertura, tendência)

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `dataInicio` | `string` | ✅ | - | Data início do período (YYYY-MM-DD) |
| `dataFim` | `string` | ✅ | - | Data fim do período (YYYY-MM-DD) |
| `contaBancariaId` | `number` | ❌ | - | ID da conta bancária (opcional) |
| `centroCustoId` | `number` | ❌ | - | ID do centro de custo (opcional) |

**Exemplos:**

```typescript
await executeMcpTool('obter_indicadores_saude', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `dataInicio` é obrigatório
- **400 Bad Request:** `dataFim` é obrigatório

---

#### `obter_alertas_caixa`

Obtém alertas de fluxo de caixa (saldo baixo, vencimentos, variações)

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `dataInicio` | `string` | ✅ | - | Data início do período (YYYY-MM-DD) |
| `dataFim` | `string` | ✅ | - | Data fim do período (YYYY-MM-DD) |
| `contaBancariaId` | `number` | ❌ | - | ID da conta bancária (opcional) |
| `centroCustoId` | `number` | ❌ | - | ID do centro de custo (opcional) |

**Exemplos:**

```typescript
await executeMcpTool('obter_alertas_caixa', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `dataInicio` é obrigatório
- **400 Bad Request:** `dataFim` é obrigatório

---

#### `obter_resumo_dashboard`

Obtém resumo consolidado para dashboard de fluxo de caixa

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `dataInicio` | `string` | ✅ | - | Data início do período (YYYY-MM-DD) |
| `dataFim` | `string` | ✅ | - | Data fim do período (YYYY-MM-DD) |
| `contaBancariaId` | `number` | ❌ | - | ID da conta bancária (opcional) |
| `centroCustoId` | `number` | ❌ | - | ID do centro de custo (opcional) |

**Exemplos:**

```typescript
await executeMcpTool('obter_resumo_dashboard', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `dataInicio` é obrigatório
- **400 Bad Request:** `dataFim` é obrigatório

---

#### `obter_saldo_inicial`

Obtém saldo inicial de uma conta bancária em uma data específica

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `contaBancariaId` | `number` | ✅ | - | ID da conta bancária |
| `data` | `string` | ✅ | - | Data de referência (YYYY-MM-DD) |

**Exemplos:**

```typescript
await executeMcpTool('obter_saldo_inicial', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `contaBancariaId` é obrigatório
- **400 Bad Request:** `data` é obrigatório

---

#### `listar_contas_bancarias`

Lista todas as contas bancárias disponíveis no sistema

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|

**Exemplos:**

```typescript
await executeMcpTool('listar_contas_bancarias', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente

---

#### `listar_centros_custo`

Lista todos os centros de custo disponíveis no sistema

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|

**Exemplos:**

```typescript
await executeMcpTool('listar_centros_custo', {});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente

---

#### `listar_transacoes`

Lista transações bancárias importadas para conciliação

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de transações |
| `pagina` | `number (min: 1)` | ✅ | `1` | Número da página |
| `contaBancariaId` | `number` | ❌ | - | ID da conta bancária |
| `dataInicio` | `string` | ❌ | - | Data início (YYYY-MM-DD) |
| `dataFim` | `string` | ❌ | - | Data fim (YYYY-MM-DD) |
| `busca` | `string` | ❌ | - | Busca por descrição ou documento |
| `ordenarPor` | `string` | ❌ | - | Campo para ordenação |

**Exemplos:**

```typescript
await executeMcpTool('listar_transacoes', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `pagina` é obrigatório
- **400 Bad Request:** `pagina` deve ter no mínimo 1 

---

#### `conciliar_manual`

Concilia transação bancária com lançamento manualmente

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `transacaoImportadaId` | `number` | ✅ | - | ID da transação bancária importada |
| `lancamentoFinanceiroId` | `number` | ✅ | - | ID do lançamento financeiro (null para ignorar ou criar novo) |
| `criarNovoLancamento` | `boolean` | ❌ | - | Se deve criar um novo lançamento |

**Exemplos:**

```typescript
await executeMcpTool('conciliar_manual', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `transacaoImportadaId` é obrigatório
- **400 Bad Request:** `lancamentoFinanceiroId` é obrigatório

---

#### `obter_sugestoes`

Obtém sugestões de conciliação automática

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `transacaoId` | `number` | ✅ | - | ID da transação bancária |

**Exemplos:**

```typescript
await executeMcpTool('obter_sugestoes', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `transacaoId` é obrigatório

---

#### `buscar_lancamentos_candidatos`

Busca lançamentos candidatos para conciliação manual com uma transação bancária

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `valor` | `number` | ✅ | - | Valor da transação |
| `dataInicio` | `string` | ✅ | - | Data início da busca (YYYY-MM-DD) |
| `dataFim` | `string` | ✅ | - | Data fim da busca (YYYY-MM-DD) |
| `contaBancariaId` | `number` | ❌ | - | ID da conta bancária |

**Exemplos:**

```typescript
await executeMcpTool('buscar_lancamentos_candidatos', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `valor` é obrigatório
- **400 Bad Request:** `dataInicio` é obrigatório
- **400 Bad Request:** `dataFim` é obrigatório

---

#### `desconciliar`

Desfaz conciliação de transação

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `transacaoId` | `number` | ✅ | - | ID da transação bancária |

**Exemplos:**

```typescript
await executeMcpTool('desconciliar', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `transacaoId` é obrigatório

---

### Chat e Comunicação

**Total de tools:** 6

#### `listar_salas`

Lista salas de chat disponíveis para o usuário

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de salas |

**Exemplos:**

```typescript
await executeMcpTool('listar_salas', { limite: 10 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 

---

#### `enviar_mensagem`

Envia mensagem em uma sala de chat

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `salaId` | `number` | ✅ | - | ID da sala de chat |
| `conteudo` | `string (min: 1)` | ✅ | - | Conteúdo da mensagem |

**Exemplos:**

```typescript
await executeMcpTool('enviar_mensagem', { sala_id: 1, conteudo: 'Mensagem de teste' });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `salaId` é obrigatório
- **400 Bad Request:** `conteudo` é obrigatório
- **400 Bad Request:** `conteudo` deve ter no mínimo 1 caracteres

---

#### `buscar_historico`

Busca histórico de mensagens de uma sala

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `salaId` | `number` | ✅ | - | ID da sala de chat |
| `limite` | `number (min: 1, max: 100)` | ✅ | `50` | Número máximo de mensagens |
| `antes` | `string` | ❌ | - | Buscar mensagens antes desta data (ISO) |

**Exemplos:**

```typescript
await executeMcpTool('buscar_historico', { termo: 'importante', limite: 20 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `salaId` é obrigatório
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 

---

#### `criar_grupo`

Cria novo grupo de chat

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `nome` | `string (min: 1)` | ✅ | - | Nome do grupo |
| `descricao` | `string` | ❌ | - | Descrição do grupo |

**Exemplos:**

```typescript
await executeMcpTool('criar_grupo', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `nome` é obrigatório
- **400 Bad Request:** `nome` deve ter no mínimo 1 caracteres

---

#### `iniciar_chamada`

Inicia chamada de vídeo/áudio

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `salaId` | `number` | ✅ | - | ID da sala de chat |

**Exemplos:**

```typescript
await executeMcpTool('iniciar_chamada', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `salaId` é obrigatório

---

#### `buscar_historico_chamadas`

Busca histórico de chamadas

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `salaId` | `number` | ❌ | - | ID da sala de chat (opcional) |
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de chamadas |

**Exemplos:**

```typescript
await executeMcpTool('buscar_historico_chamadas', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 

---

### Documentos

**Total de tools:** 6

#### `listar_documentos`

Lista documentos do sistema com filtros por pasta, tags e busca textual

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de documentos |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `pasta_id` | `number` | ❌ | - | Filtrar por pasta |
| `busca` | `string` | ❌ | - | Busca textual por título ou conteúdo |

**Exemplos:**

```typescript
await executeMcpTool('listar_documentos', { limite: 20 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

#### `buscar_documento_por_tags`

Busca documentos por tags específicas

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de documentos |

**Exemplos:**

```typescript
await executeMcpTool('buscar_documento_por_tags', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 

---

#### `listar_templates`

Lista templates de documentos disponíveis com filtros por categoria e visibilidade

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de templates |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `categoria` | `string` | ❌ | - | Filtrar por categoria |
| `busca` | `string` | ❌ | - | Busca textual por título |

**Exemplos:**

```typescript
await executeMcpTool('listar_templates', { limite: 20 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

#### `usar_template`

Cria novo documento a partir de um template existente

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `template_id` | `number` | ✅ | - | ID do template a usar |
| `titulo` | `string` | ❌ | - | Título do novo documento (opcional) |
| `pasta_id` | `number` | ❌ | - | ID da pasta destino (null para raiz) |

**Exemplos:**

```typescript
await executeMcpTool('usar_template', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `template_id` é obrigatório

---

#### `listar_categorias_templates`

Lista todas as categorias de templates disponíveis

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|

**Exemplos:**

```typescript
await executeMcpTool('listar_categorias_templates', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente

---

#### `listar_templates_mais_usados`

Lista os templates mais utilizados no sistema

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 50)` | ✅ | `10` | Número de templates a retornar |

**Exemplos:**

```typescript
await executeMcpTool('listar_templates_mais_usados', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 50 

---

### Expedientes

**Total de tools:** 7

#### `listar_expedientes`

Lista expedientes do sistema com filtros por responsável, prazo, tipo, processo

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de expedientes |
| `pagina` | `number (min: 1)` | ✅ | `1` | Página para paginação |
| `processoId` | `number` | ❌ | - | Filtrar por processo |
| `busca` | `string` | ❌ | - | Busca textual por descrição |
| `responsavelId` | `number` | ❌ | - | Filtrar por responsável (ID do usuário) |
| `semResponsavel` | `boolean` | ❌ | - | Filtrar expedientes sem responsável atribuído |
| `prazoVencido` | `boolean` | ❌ | - | Filtrar expedientes com prazo vencido |
| `dataPrazoLegalInicio` | `string` | ❌ | - | Data início do período de prazo legal (YYYY-MM-DD) |
| `dataPrazoLegalFim` | `string` | ❌ | - | Data fim do período de prazo legal (YYYY-MM-DD) |
| `semPrazo` | `boolean` | ❌ | - | Filtrar expedientes sem prazo definido |
| `baixado` | `boolean` | ❌ | - | Filtrar por expedientes baixados (true) ou não baixados (false) |

**Exemplos:**

```typescript
await executeMcpTool('listar_expedientes', { limite: 20, status: 'aberto' });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `pagina` é obrigatório
- **400 Bad Request:** `pagina` deve ter no mínimo 1 

---

#### `criar_expediente`

Cria novo expediente no sistema

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `numeroProcesso` | `string (min: 1)` | ✅ | - | Número do processo (formato CNJ) |
| `dataPrazoLegalParte` | `string` | ✅ | - | Data do prazo legal (YYYY-MM-DD) |
| `processoId` | `number` | ❌ | - | ID do processo vinculado |
| `responsavelId` | `number` | ❌ | - | ID do responsável |
| `tipoExpedienteId` | `number` | ❌ | - | ID do tipo de expediente |
| `observacoes` | `string` | ❌ | - | Observações adicionais |

**Exemplos:**

```typescript
await executeMcpTool('criar_expediente', { processo_id: 1, tipo: 'oficio' });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `numeroProcesso` é obrigatório
- **400 Bad Request:** `numeroProcesso` deve ter no mínimo 1 caracteres
- **400 Bad Request:** `dataPrazoLegalParte` é obrigatório

---

#### `baixar_expediente`

Baixa/finaliza expediente

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `id` | `number` | ✅ | - | ID do expediente |
| `protocoloId` | `string` | ❌ | - | ID do protocolo de baixa |
| `justificativaBaixa` | `string` | ❌ | - | Justificativa para baixa sem protocolo |
| `dataBaixa` | `string` | ❌ | - | Data da baixa (YYYY-MM-DD) |

**Exemplos:**

```typescript
await executeMcpTool('baixar_expediente', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `id` é obrigatório

---

#### `reverter_baixa_expediente`

Reverte a baixa/finalização de um expediente, retornando-o ao status pendente

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `id` | `number` | ✅ | - | ID do expediente a reverter |

**Exemplos:**

```typescript
await executeMcpTool('reverter_baixa_expediente', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `id` é obrigatório

---

#### `transferir_responsavel_expediente`

Transfere a responsabilidade de um ou mais expedientes para outro usuário

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `responsavelId` | `number` | ✅ | - | ID do novo responsável (null para remover responsável) |

**Exemplos:**

```typescript
await executeMcpTool('transferir_responsavel_expediente', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `responsavelId` é obrigatório

---

#### `baixar_expedientes_em_massa`

Baixa/finaliza múltiplos expedientes de uma vez com a mesma justificativa

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `justificativaBaixa` | `string (min: 1)` | ✅ | - | Justificativa para a baixa em massa |

**Exemplos:**

```typescript
await executeMcpTool('baixar_expedientes_em_massa', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `justificativaBaixa` é obrigatório
- **400 Bad Request:** `justificativaBaixa` deve ter no mínimo 1 caracteres

---

#### `listar_expedientes_pendentes`

Lista apenas expedientes pendentes

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de expedientes |
| `processoId` | `number` | ❌ | - | Filtrar por processo |

**Exemplos:**

```typescript
await executeMcpTool('listar_expedientes_pendentes', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 

---

### Audiências

**Total de tools:** 6

#### `listar_audiencias`

Lista audiências do sistema com filtros por data, tipo, status, processo

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de audiências |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `dataInicio` | `string` | ❌ | - | Data início do período (YYYY-MM-DD) |
| `dataFim` | `string` | ❌ | - | Data fim do período (YYYY-MM-DD) |
| `tipo` | `string` | ❌ | - | Tipo de audiência |
| `processoId` | `number` | ❌ | - | Filtrar por processo |

**Exemplos:**

```typescript
await executeMcpTool('listar_audiencias', { limite: 10 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

#### `atualizar_status_audiencia`

Atualiza status de uma audiência

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `id` | `number` | ✅ | - | ID da audiência |
| `statusDescricao` | `string` | ❌ | - | Descrição sobre a mudança de status |

**Exemplos:**

```typescript
await executeMcpTool('atualizar_status_audiencia', { audiencia_id: 1, status: 'realizada' });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `id` é obrigatório

---

#### `listar_tipos_audiencia`

Lista tipos de audiências disponíveis no sistema

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|

**Exemplos:**

```typescript
await executeMcpTool('listar_tipos_audiencia', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente

---

#### `buscar_audiencias_por_cpf`

Busca audiências vinculadas a um cliente por CPF

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `cpf` | `string (min: 11)` | ✅ | - | CPF do cliente (apenas números) |
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de audiências |

**Exemplos:**

```typescript
await executeMcpTool('buscar_audiencias_por_cpf', { cpf: '12345678901' });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `cpf` é obrigatório
- **400 Bad Request:** `cpf` deve ter no mínimo 11 caracteres
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 

---

#### `buscar_audiencias_por_cnpj`

Busca audiências vinculadas a um cliente por CNPJ

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `cnpj` | `string (min: 14)` | ✅ | - | CNPJ do cliente (apenas números) |
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de audiências |

**Exemplos:**

```typescript
await executeMcpTool('buscar_audiencias_por_cnpj', { cnpj: '12345678000190' });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `cnpj` é obrigatório
- **400 Bad Request:** `cnpj` deve ter no mínimo 14 caracteres
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 

---

#### `buscar_audiencias_por_numero_processo`

Busca audiências de um processo específico pelo número processual (formato CNJ)

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `numeroProcesso` | `string (min: 1)` | ✅ | - | Número do processo (formato CNJ: 0000000-00.0000.0.00.0000) |

**Exemplos:**

```typescript
await executeMcpTool('buscar_audiencias_por_numero_processo', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `numeroProcesso` é obrigatório
- **400 Bad Request:** `numeroProcesso` deve ter no mínimo 1 caracteres

---

### Obrigações (Acordos e Repasses)

**Total de tools:** 5

#### `listar_acordos`

Lista acordos/condenações do sistema com filtros

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de acordos |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `status` | `string` | ❌ | - | Filtrar por status |
| `processoId` | `number` | ❌ | - | Filtrar por processo |

**Exemplos:**

```typescript
await executeMcpTool('listar_acordos', { limite: 10 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

#### `buscar_acordos_por_cpf`

Busca acordos vinculados a um cliente por CPF

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `cpf` | `string` | ✅ | - | - |

**Exemplos:**

```typescript
await executeMcpTool('buscar_acordos_por_cpf', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `cpf` é obrigatório

---

#### `buscar_acordos_por_cnpj`

Busca acordos vinculados a um cliente por CNPJ

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `cnpj` | `string` | ✅ | - | - |

**Exemplos:**

```typescript
await executeMcpTool('buscar_acordos_por_cnpj', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `cnpj` é obrigatório

---

#### `buscar_acordos_por_processo`

Busca acordos e condenações de um processo específico pelo número processual CNJ

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `numero_processo` | `string (min: 20)` | ✅ | - | Número do processo no formato CNJ (ex: 0001234-56.2023.5.15.0001) |

**Exemplos:**

```typescript
await executeMcpTool('buscar_acordos_por_processo', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `numero_processo` é obrigatório
- **400 Bad Request:** `numero_processo` deve ter no mínimo 20 caracteres

---

#### `listar_repasses_pendentes`

Lista repasses pendentes de pagamento

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de repasses |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |

**Exemplos:**

```typescript
await executeMcpTool('listar_repasses_pendentes', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

### Recursos Humanos

**Total de tools:** 2

#### `listar_salarios`

Lista salários de funcionários

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de resultados |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `funcionarioId` | `number` | ❌ | - | Filtrar por funcionário |

**Exemplos:**

```typescript
await executeMcpTool('listar_salarios', { limite: 10 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

#### `listar_folhas_pagamento`

Lista folhas de pagamento

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de resultados |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `mesAno` | `string` | ❌ | - | Filtrar por mês/ano (YYYY-MM) |

**Exemplos:**

```typescript
await executeMcpTool('listar_folhas_pagamento', { limite: 10 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

### Dashboard e Métricas

**Total de tools:** 2

#### `obter_metricas_escritorio`

Obtém métricas gerais do escritório (processos, receitas, despesas)

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|

**Exemplos:**

```typescript
await executeMcpTool('obter_metricas_escritorio', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente

---

#### `obter_dashboard_usuario`

Obtém dashboard personalizado do usuário autenticado

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|

**Exemplos:**

```typescript
await executeMcpTool('obter_dashboard_usuario', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente

---

### Busca Semântica

**Total de tools:** 1

#### `buscar_semantica`

Realiza busca semântica com IA em documentos, processos e conhecimento do escritório

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `query` | `string (min: 3)` | ✅ | - | Pergunta ou termo de busca |
| `limite` | `number (min: 1, max: 20)` | ✅ | `5` | Número máximo de resultados |

**Exemplos:**

```typescript
await executeMcpTool('buscar_semantica', { consulta: 'processos trabalhistas', limite: 10 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `query` é obrigatório
- **400 Bad Request:** `query` deve ter no mínimo 3 caracteres
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 20 

---

### Captura (CNJ e Timeline)

**Total de tools:** 2

#### `listar_capturas_cnj`

Lista capturas do sistema Comunica CNJ

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de capturas |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `processoId` | `number` | ❌ | - | Filtrar por processo |

**Exemplos:**

```typescript
await executeMcpTool('listar_capturas_cnj', { limite: 10 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

#### `obter_timeline_captura`

Obtém timeline de captura de um processo

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `processoId` | `number` | ✅ | - | ID do processo |

**Exemplos:**

```typescript
await executeMcpTool('obter_timeline_captura', { /* parâmetros
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `processoId` é obrigatório

---

### Usuários

**Total de tools:** 4

#### `listar_usuarios`

Lista usuários do sistema com filtros por busca, status ativo e cargo

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de usuários |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `busca` | `string` | ❌ | - | - |
| `ativo` | `boolean` | ❌ | - | Filtrar por status ativo/inativo |
| `cargoId` | `number` | ❌ | - | Filtrar por cargo |

**Exemplos:**

```typescript
await executeMcpTool('listar_usuarios', { limite: 20 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

#### `buscar_usuario_por_email`

Busca usuário específico por endereço de email corporativo

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `email` | `string` | ✅ | - | Email corporativo do usuário |

**Exemplos:**

```typescript
await executeMcpTool('buscar_usuario_por_email', { email: 'usuario@exemplo.com' });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `email` é obrigatório

---

#### `buscar_usuario_por_cpf`

Busca usuário específico por CPF (apenas números)

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `cpf` | `string` | ✅ | - | - |

**Exemplos:**

```typescript
await executeMcpTool('buscar_usuario_por_cpf', { cpf: '12345678901' });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `cpf` é obrigatório

---

#### `listar_permissoes_usuario`

Lista todas as permissões de um usuário específico (recursos e operações)

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `usuarioId` | `number` | ✅ | - | ID do usuário |

**Exemplos:**

```typescript
await executeMcpTool('listar_permissoes_usuario', { usuario_id: 1 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `usuarioId` é obrigatório

---

### Acervo

**Total de tools:** 1

#### `listar_acervo`

Lista processos do acervo com filtros

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de processos |
| `offset` | `number (min: 0)` | ✅ | `0` | Offset para paginação |
| `status` | `string` | ❌ | - | Filtrar por status |
| `busca` | `string` | ❌ | - | Busca textual |

**Exemplos:**

```typescript
await executeMcpTool('listar_acervo', { limite: 10 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 
- **400 Bad Request:** `offset` é obrigatório
- **400 Bad Request:** `offset` deve ter no mínimo 0 

---

### Assistentes IA

**Total de tools:** 1

#### `listar_assistentes`

Lista assistentes de IA disponíveis no sistema

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de assistentes |
| `busca` | `string` | ❌ | - | Busca textual por nome |

**Exemplos:**

```typescript
await executeMcpTool('listar_assistentes', { limite: 10 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 

---

### Cargos

**Total de tools:** 1

#### `listar_cargos`

Lista cargos disponíveis no sistema

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de cargos |
| `busca` | `string` | ❌ | - | Busca textual por nome do cargo |

**Exemplos:**

```typescript
await executeMcpTool('listar_cargos', {});
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 

---

### assinatura-digital

**Total de tools:** 1

#### `listar_templates_assinatura`

Lista templates de assinatura digital disponíveis

**🔒 Requer autenticação**

**Parâmetros:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|---------|----------|
| `limite` | `number (min: 1, max: 100)` | ✅ | `20` | Número máximo de templates |
| `segmento` | `string` | ❌ | - | Filtrar por segmento |

**Exemplos:**

```typescript
await executeMcpTool('listar_templates_assinatura', { limite: 10 });
```

**Casos de erro:**

- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **400 Bad Request:** `limite` é obrigatório
- **400 Bad Request:** `limite` deve ter no mínimo 1 
- **400 Bad Request:** `limite` deve ter no máximo 100 

---

## Padrões de Uso

### Autenticação

Todas as tools com autenticação obrigatória requerem:

- Header `x-service-api-key` com API key válida, OU
- Cookie de sessão autenticada

### Paginação

Tools de listagem suportam `limite` e `offset`:

```json
{
  "limite": 20,
  "offset": 40
}
```

### Tratamento de Erros

Padrão de resposta:

**Sucesso:**
```json
{ "success": true, "data": {...} }
```

**Erro:**
```json
{ "success": false, "error": "Mensagem descritiva" }
```

### Rate Limiting

- **Anonymous:** 10 req/min
- **Authenticated:** 100 req/min
- **Service:** 1000 req/min

Headers de resposta:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Tabela Comparativa de Tools

| Tool | Módulo | Auth | Uso Comum |
|------|--------|------|-----------|
| `listar_processos` | Processos | 🔒 | Lista processos do sistema com suporte a filtros (status, TRT, grau, advogado, período, busca textual) |
| `buscar_processos_por_cpf` | Processos | 🔒 | Busca todos os processos vinculados a um cliente por CPF |
| `listar_clientes` | Partes (Clientes, Contrárias, Terceiros, Representantes) | 🔒 | Lista clientes/partes do sistema com filtros (nome, CPF/CNPJ, tipo) |
| `buscar_cliente_por_cpf` | Partes (Clientes, Contrárias, Terceiros, Representantes) | 🔒 | Busca cliente por CPF com endereço e processos relacionados |
| `listar_contratos` | Contratos | 🔒 | Lista contratos do sistema com filtros por tipo, status, cliente |
| `criar_contrato` | Contratos | 🔒 | Cria novo contrato no sistema |
| `listar_plano_contas` | Financeiro | 🔒 | Lista plano de contas do sistema com hierarquia |
| `criar_conta` | Financeiro | 🔒 | Cria nova conta no plano de contas |
| `listar_salas` | Chat e Comunicação | 🔒 | Lista salas de chat disponíveis para o usuário |
| `enviar_mensagem` | Chat e Comunicação | 🔒 | Envia mensagem em uma sala de chat |
| `listar_documentos` | Documentos | 🔒 | Lista documentos do sistema com filtros por pasta, tags e busca textual |
| `buscar_documento_por_tags` | Documentos | 🔒 | Busca documentos por tags específicas |
| `listar_expedientes` | Expedientes | 🔒 | Lista expedientes do sistema com filtros por responsável, prazo, tipo, processo |
| `criar_expediente` | Expedientes | 🔒 | Cria novo expediente no sistema |
| `listar_audiencias` | Audiências | 🔒 | Lista audiências do sistema com filtros por data, tipo, status, processo |
| `atualizar_status_audiencia` | Audiências | 🔒 | Atualiza status de uma audiência |
| `listar_acordos` | Obrigações (Acordos e Repasses) | 🔒 | Lista acordos/condenações do sistema com filtros |
| `buscar_acordos_por_cpf` | Obrigações (Acordos e Repasses) | 🔒 | Busca acordos vinculados a um cliente por CPF |
| `listar_salarios` | Recursos Humanos | 🔒 | Lista salários de funcionários |
| `listar_folhas_pagamento` | Recursos Humanos | 🔒 | Lista folhas de pagamento |
| `obter_metricas_escritorio` | Dashboard e Métricas | 🔒 | Obtém métricas gerais do escritório (processos, receitas, despesas) |
| `obter_dashboard_usuario` | Dashboard e Métricas | 🔒 | Obtém dashboard personalizado do usuário autenticado |
| `buscar_semantica` | Busca Semântica | 🔒 | Realiza busca semântica com IA em documentos, processos e conhecimento do escritório |
| `listar_capturas_cnj` | Captura (CNJ e Timeline) | 🔒 | Lista capturas do sistema Comunica CNJ |
| `obter_timeline_captura` | Captura (CNJ e Timeline) | 🔒 | Obtém timeline de captura de um processo |
| `listar_usuarios` | Usuários | 🔒 | Lista usuários do sistema com filtros por busca, status ativo e cargo |
| `buscar_usuario_por_email` | Usuários | 🔒 | Busca usuário específico por endereço de email corporativo |
| `listar_acervo` | Acervo | 🔒 | Lista processos do acervo com filtros |
| `listar_assistentes` | Assistentes IA | 🔒 | Lista assistentes de IA disponíveis no sistema |
| `listar_cargos` | Cargos | 🔒 | Lista cargos disponíveis no sistema |
| `listar_templates_assinatura` | assinatura-digital | 🔒 | Lista templates de assinatura digital disponíveis |

## Workflows Comuns

### 1. Buscar Processos de um Cliente

```typescript
// 1. Buscar cliente por CPF
const cliente = await executeMcpTool('buscar_cliente_por_cpf', {
  cpf: '12345678901'
});

// 2. Buscar processos do cliente
const processos = await executeMcpTool('buscar_processos_por_cpf', {
  cpf: '12345678901',
  limite: 50
});
```

### 2. Criar Lançamento Financeiro

```typescript
// 1. Listar plano de contas
const contas = await executeMcpTool('listar_plano_contas', {});

// 2. Criar lançamento
const lancamento = await executeMcpTool('criar_lancamento', {
  tipo: 'receita',
  valor: 1500.00,
  contaId: 10,
  descricao: 'Honorários - Processo 123'
});

// 3. Confirmar lançamento
await executeMcpTool('confirmar_lancamento', {
  lancamentoId: lancamento.data.id
});
```

## Referências

- **Registry:** `src/lib/mcp/registry.ts`
- **Server:** `src/lib/mcp/server.ts`
- **API Endpoint:** `src/app/api/mcp/route.ts`
- **Testes:** `scripts/mcp/test-tools.ts`
- **Auditoria:** `docs/mcp-audit/`
