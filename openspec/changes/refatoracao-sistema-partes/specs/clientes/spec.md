# Spec: Clientes (Backend) - Modificações para estrutura PJE

## MODIFIED Requirements

### Requirement: Cliente com 60 campos alinhados ao PJE
The entity SHALL Cliente foi expandida para incluir todos os campos retornados pelo PJE.

#### Scenario: Criar cliente PF com dados completos do PJE
**Given** dados de pessoa física do PJE com campos: `id_pessoa_pje`, `sexo`, `nome_genitora`, `uf_nascimento`, `naturalidade`, `pais_nascimento`, `escolaridade_codigo`, `situacao_cpf_receita`
**When** serviço `clientesService.create()` é chamado
**Then** cliente é salvo com todos os campos PF
**And** campo `tipo_pessoa='pf'` identifica pessoa física
**And** campo `id_pessoa_pje` é único no banco (constraint)

#### Scenario: Atualizar cliente preservando campos PJE
**Given** um cliente existente com `id_pessoa_pje=123456`
**When** atualização é feita mudando apenas `nome` e `ddd_celular`
**Then** apenas esses campos são atualizados
**And** outros campos PJE permanecem inalterados
**And** `updated_at` é atualizado automaticamente

---

### Requirement: Múltiplos emails em array JSONB
The field SHALL `emails` armazena array de emails, substituindo campo único `email`.

#### Scenario: Salvar cliente com múltiplos emails
**Given** dados com `emails=['email1@test.com', 'email2@test.com', 'email3@test.com']`
**When** cliente é criado
**Then** array é salvo em JSONB
**And** query pode buscar por email específico: `WHERE emails @> '["email1@test.com"]'`

#### Scenario: Buscar clientes por email
**Given** clientes com diferentes emails
**When** busca é feita por `email='email1@test.com'`
**Then** query usa operador JSONB: `WHERE emails @> '["email1@test.com"]'::jsonb`
**And** retorna clientes que possuem esse email

---

### Requirement: Deduplicação por id_pessoa_pje
The field SHALL `id_pessoa_pje` garante que mesma pessoa do PJE não seja duplicada.

#### Scenario: Tentar criar cliente duplicado
**Given** cliente com `id_pessoa_pje=123456` já existe
**When** tentativa de criar novo cliente com mesmo `id_pessoa_pje`
**Then** erro de constraint UNIQUE é retornado
**And** serviço trata erro e retorna mensagem amigável

#### Scenario: Upsert baseado em id_pessoa_pje
**Given** captura de partes do PJE retorna pessoa com `id_pessoa_pje=123456`
**When** serviço `upsertByIdPessoa()` é chamado
**Then** se cliente existe, faz UPDATE
**And** se não existe, faz INSERT
**And** operação é idempotente

---

## ADDED Requirements

### Requirement: Tipos TypeScript com discriminated union para PF/PJ
Types SHALL garantem type-safety para campos específicos de PF ou PJ.

#### Scenario: Tipo Cliente PF com campos específicos
**Given** tipo TypeScript `Cliente` com discriminator `tipo_pessoa`
**When** `tipo_pessoa='pf'`
**Then** TypeScript permite acessar campos PF: `sexo`, `nome_genitora`, `uf_nascimento`
**And** TypeScript não permite acessar campos PJ: `data_abertura`, `porte_codigo`

#### Scenario: Tipo Cliente PJ com campos específicos
**Given** tipo TypeScript `Cliente` com discriminator `tipo_pessoa`
**When** `tipo_pessoa='pj'`
**Then** TypeScript permite acessar campos PJ: `data_abertura`, `ramo_atividade`, `porte_codigo`
**And** TypeScript não permite acessar campos PF: `nome_genitora`, `sexo`

---

### Requirement: API REST com validação de entrada
The API SHALL provide endpoints de clientes validam entrada usando Zod ou similar.

#### Scenario: POST /api/clientes com validação
**Given** request com dados de cliente
**When** campo obrigatório `nome` está ausente
**Then** resposta HTTP 400 com `{ success: false, error: "Campo 'nome' é obrigatório" }`

#### Scenario: PUT /api/clientes/[id] com validação de CPF
**Given** request para atualizar cliente
**When** CPF fornecido é inválido (dígitos verificadores incorretos)
**Then** resposta HTTP 400 com `{ success: false, error: "CPF inválido" }`

---

### Requirement: Serviço de persistência com métodos específicos PJE
The service SHALL inclui métodos para operações específicas de integração PJE.

#### Scenario: Buscar cliente por id_pessoa_pje
**Given** cliente com `id_pessoa_pje=123456` existe
**When** `clientesService.getByIdPessoaPje(123456)` é chamado
**Then** cliente é retornado
**And** busca usa índice UNIQUE

#### Scenario: Listar clientes por tipo_pessoa
**Given** existem 10 clientes PF e 5 clientes PJ
**When** `clientesService.list({ tipo_pessoa: 'pf' })` é chamado
**Then** retorna apenas os 10 clientes PF
**And** query usa índice apropriado

---

## REMOVED Requirements

### Requirement: Campo email único (REMOVIDO)
The field SHALL `email` text foi substituído por `emails` JSONB array.

**Rationale**: PJE retorna array de emails, estrutura deve refletir isso.

---

### Requirement: Campo endereco JSONB único (REMOVIDO)
The field SHALL `endereco` JSONB foi removido. Endereços agora em tabela `enderecos`.

**Rationale**: Normalização permite múltiplos endereços e queries diretas.

---

### Requirement: Campos telefone_primario e telefone_secundario (REMOVIDOS)
Campos `telefone_primario` e `telefone_secundario` foram removidos.

**Rationale**: PJE retorna telefones separados por tipo (celular, residencial, comercial) com DDD e número separados.

**Replacement**: Campos `ddd_celular`, `numero_celular`, `ddd_residencial`, `numero_residencial`, `ddd_comercial`, `numero_comercial`.

---

## Cross-References

- **Depends on**: `database-partes` (migrations de `clientes` aplicadas)
- **Related**: `partes-contrarias` (estrutura idêntica)
- **Related**: `enderecos` (relacionamento polimórfico)
- **Blocks**: `frontend-partes` (frontend depende de API pronta)
