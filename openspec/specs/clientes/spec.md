# Capability: Gestão de Clientes

## Purpose
API REST para gerenciamento de clientes do escritório de advocacia. Suporta cadastro de pessoas físicas (PF) e jurídicas (PJ), operações CRUD completas, busca por CPF/CNPJ, listagem com filtros e paginação. Clientes são vinculados a contratos e processos jurídicos.
## Requirements
### Requirement: Criação de Cliente
O sistema MUST permitir criar clientes pessoa física ou jurídica com validação de dados.

#### Scenario: POST /api/clientes com pessoa física
- **WHEN** uma requisição POST é enviada com tipo=pf, nome e CPF
- **THEN** o sistema deve criar cliente pessoa física
- **AND** validar formato e dígitos do CPF
- **AND** retornar cliente criado com status 201

#### Scenario: POST /api/clientes com pessoa jurídica
- **WHEN** uma requisição POST é enviada com tipo=pj, razao_social e CNPJ
- **THEN** o sistema deve criar cliente pessoa jurídica
- **AND** validar formato e dígitos do CNPJ
- **AND** retornar cliente criado com status 201

#### Scenario: CPF já cadastrado
- **WHEN** tentativa de criar PF com CPF existente
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** incluir mensagem "CPF já cadastrado"

#### Scenario: CNPJ já cadastrado
- **WHEN** tentativa de criar PJ com CNPJ existente
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** incluir mensagem "CNPJ já cadastrado"

#### Scenario: Tipo de cliente inválido
- **WHEN** campo tipo não é 'pf' ou 'pj'
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** listar valores válidos

#### Scenario: Campos obrigatórios ausentes
- **WHEN** campos obrigatórios não são fornecidos
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** listar campos faltantes conforme tipo (PF: nome, cpf; PJ: razao_social, cnpj)

### Requirement: Listagem de Clientes
O sistema MUST fornecer endpoint para listar clientes com suporte a paginação, ordenação e filtros.

#### Scenario: GET /api/clientes com paginação
- **WHEN** uma requisição GET é enviada com parâmetros page e limit
- **THEN** o sistema deve retornar página de clientes solicitada
- **AND** incluir total de registros e total de páginas
- **AND** limitar resultados ao valor de limit

#### Scenario: Ordenação por nome/razão social
- **WHEN** parâmetros orderBy e orderDirection são fornecidos
- **THEN** o sistema deve ordenar clientes pela coluna especificada
- **AND** aplicar direção ascendente ou descendente

#### Scenario: Listagem padrão
- **WHEN** nenhum parâmetro é fornecido
- **THEN** o sistema deve retornar primeira página com 10 registros
- **AND** ordenar por nome/razao_social ascendente

### Requirement: Filtros por Tipo
O sistema MUST permitir filtragem por tipo de cliente (PF ou PJ).

#### Scenario: Filtro por pessoa física
- **WHEN** parâmetro tipo=pf é fornecido
- **THEN** o sistema deve retornar apenas clientes pessoa física
- **AND** excluir pessoas jurídicas

#### Scenario: Filtro por pessoa jurídica
- **WHEN** parâmetro tipo=pj é fornecido
- **THEN** o sistema deve retornar apenas clientes pessoa jurídica
- **AND** excluir pessoas físicas

#### Scenario: Todos os tipos
- **WHEN** parâmetro tipo não é fornecido
- **THEN** o sistema deve retornar clientes de ambos os tipos

### Requirement: Filtro por Status
O sistema MUST permitir filtragem por status ativo/inativo.

#### Scenario: Filtro por clientes ativos
- **WHEN** parâmetro ativo=true é fornecido
- **THEN** o sistema deve retornar apenas clientes ativos

#### Scenario: Filtro por clientes inativos
- **WHEN** parâmetro ativo=false é fornecido
- **THEN** o sistema deve retornar apenas clientes desativados

#### Scenario: Todos os clientes
- **WHEN** parâmetro ativo não é fornecido
- **THEN** o sistema deve retornar clientes independente do status

### Requirement: Busca Textual
O sistema MUST permitir busca textual em campos relevantes.

#### Scenario: Busca em pessoa física
- **WHEN** parâmetro search é fornecido
- **THEN** o sistema deve buscar em: nome, email, cpf
- **AND** aplicar lógica OR entre os campos

#### Scenario: Busca em pessoa jurídica
- **WHEN** parâmetro search é fornecido
- **THEN** o sistema deve buscar em: razao_social, nome_fantasia, email, cnpj
- **AND** aplicar lógica OR entre os campos

#### Scenario: Busca case-insensitive
- **WHEN** busca textual é realizada
- **THEN** comparação deve ser case-insensitive
- **AND** ignorar acentuação se possível

### Requirement: Busca por CPF
O sistema MUST permitir buscar cliente pessoa física específico por CPF.

#### Scenario: GET /api/clientes/buscar/por-cpf/[cpf] com CPF válido
- **WHEN** uma requisição GET é enviada com CPF existente
- **THEN** o sistema deve retornar dados completos do cliente
- **AND** incluir todos os campos relevantes

#### Scenario: CPF não encontrado
- **WHEN** CPF fornecido não existe
- **THEN** o sistema deve retornar erro 404 Not Found
- **AND** incluir mensagem "Cliente não encontrado"

#### Scenario: CPF em formato inválido
- **WHEN** CPF fornecido é inválido
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** incluir mensagem "CPF inválido"

#### Scenario: Busca com formatação
- **WHEN** CPF é fornecido com pontuação (123.456.789-00)
- **THEN** sistema deve normalizar e buscar corretamente

### Requirement: Busca por CNPJ
O sistema MUST permitir buscar cliente pessoa jurídica específico por CNPJ.

#### Scenario: GET /api/clientes/buscar/por-cnpj/[cnpj] com CNPJ válido
- **WHEN** uma requisição GET é enviada com CNPJ existente
- **THEN** o sistema deve retornar dados completos do cliente

#### Scenario: CNPJ não encontrado
- **WHEN** CNPJ fornecido não existe
- **THEN** o sistema deve retornar erro 404 Not Found

#### Scenario: CNPJ em formato inválido
- **WHEN** CNPJ fornecido é inválido
- **THEN** o sistema deve retornar erro 400 Bad Request

#### Scenario: Busca com formatação
- **WHEN** CNPJ é fornecido com pontuação
- **THEN** sistema deve normalizar e buscar corretamente

### Requirement: Visualização de Cliente Individual
O sistema MUST fornecer endpoint para buscar detalhes de cliente específico por ID.

#### Scenario: GET /api/clientes/[id] com ID válido
- **WHEN** uma requisição GET é enviada com UUID de cliente existente
- **THEN** o sistema deve retornar todos os dados do cliente
- **AND** incluir campos conforme tipo (PF ou PJ)
- **AND** incluir metadados (created_at, updated_at, ativo)

#### Scenario: Cliente não encontrado
- **WHEN** ID fornecido não existe
- **THEN** o sistema deve retornar erro 404 Not Found

### Requirement: Atualização de Cliente
O sistema MUST permitir atualizar dados de cliente existente.

#### Scenario: PUT /api/clientes/[id] com dados válidos
- **WHEN** uma requisição PUT é enviada com dados a atualizar
- **THEN** o sistema deve atualizar campos fornecidos
- **AND** manter campos não fornecidos inalterados
- **AND** atualizar campo updated_at automaticamente
- **AND** retornar cliente atualizado

#### Scenario: Alteração de CPF para CPF existente
- **WHEN** tentativa de alterar CPF para um já cadastrado
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** não permitir a alteração

#### Scenario: Alteração de CNPJ para CNPJ existente
- **WHEN** tentativa de alterar CNPJ para um já cadastrado
- **THEN** o sistema deve retornar erro 400 Bad Request

#### Scenario: Alteração de tipo de cliente
- **WHEN** tentativa de alterar tipo (pf para pj ou vice-versa)
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** incluir mensagem "Não é possível alterar tipo de cliente"

#### Scenario: Desativação de cliente
- **WHEN** campo ativo é alterado para false
- **THEN** o sistema deve desativar o cliente
- **AND** manter todos os dados históricos
- **AND** verificar se cliente não possui contratos ativos

#### Scenario: Reativação de cliente
- **WHEN** campo ativo é alterado para true
- **THEN** o sistema deve reativar o cliente

### Requirement: Validação de Dados
O sistema MUST validar todos os dados de entrada antes de persistir.

#### Scenario: Validação de CPF
- **WHEN** CPF é fornecido
- **THEN** sistema deve validar formato e dígitos verificadores
- **AND** aceitar formato com ou sem pontuação
- **AND** rejeitar CPFs inválidos

#### Scenario: Validação de CNPJ
- **WHEN** CNPJ é fornecido
- **THEN** sistema deve validar formato e dígitos verificadores
- **AND** aceitar formato com ou sem pontuação
- **AND** rejeitar CNPJs inválidos

#### Scenario: Validação de email
- **WHEN** email é fornecido
- **THEN** sistema deve validar formato RFC 5322
- **AND** rejeitar emails inválidos

#### Scenario: Validação de telefone
- **WHEN** telefone é fornecido
- **THEN** sistema deve aceitar formatos brasileiros válidos

#### Scenario: Normalização de CPF/CNPJ
- **WHEN** CPF ou CNPJ é fornecido com pontuação
- **THEN** sistema deve remover formatação antes de salvar
- **AND** armazenar apenas dígitos

### Requirement: Campos Específicos por Tipo
O sistema MUST exigir e permitir campos conforme tipo de cliente.

#### Scenario: Pessoa física - campos obrigatórios
- **WHEN** cliente tipo PF é criado/atualizado
- **THEN** campos obrigatórios são: tipo, nome, cpf
- **AND** campos opcionais: email, telefone, endereco, ativo

#### Scenario: Pessoa jurídica - campos obrigatórios
- **WHEN** cliente tipo PJ é criado/atualizado
- **THEN** campos obrigatórios são: tipo, razao_social, cnpj
- **AND** campos opcionais: nome_fantasia, email, telefone, endereco, ativo

#### Scenario: Campo nome_fantasia apenas para PJ
- **WHEN** cliente tipo PF tenta incluir nome_fantasia
- **THEN** campo deve ser ignorado ou retornar warning

### Requirement: Autenticação Obrigatória
Todos os endpoints MUST exigir autenticação válida via Supabase Auth.

#### Scenario: Requisição sem autenticação
- **WHEN** uma requisição é feita sem token
- **THEN** o sistema deve retornar erro 401 Unauthorized

### Requirement: Resposta Padronizada
Todos os endpoints MUST retornar respostas no formato JSON padronizado.

#### Scenario: Operação bem-sucedida
- **WHEN** operação é concluída com sucesso
- **THEN** resposta deve conter: { success: true, data: {...} }
- **AND** código HTTP apropriado (200, 201)

#### Scenario: Erro de validação
- **WHEN** dados inválidos são fornecidos
- **THEN** resposta deve conter: { success: false, error: "mensagem descritiva" }
- **AND** código HTTP 400 Bad Request

#### Scenario: Lista paginada
- **WHEN** endpoint retorna lista
- **THEN** resposta deve incluir: data, total, totalPages, currentPage

### Requirement: Proteção de Dados LGPD
O sistema MUST proteger dados pessoais conforme LGPD.

#### Scenario: Logs de auditoria
- **WHEN** operações em clientes são logadas
- **THEN** não incluir dados sensíveis completos nos logs
- **AND** mascarar CPF/CNPJ parcialmente

#### Scenario: Exclusão de dados (direito ao esquecimento)
- **WHEN** cliente solicita exclusão de dados
- **THEN** sistema deve permitir anonimização
- **AND** manter vínculo com contratos/processos anonimizados

### Requirement: Vinculação com Contratos
O sistema MUST manter integridade referencial com contratos.

#### Scenario: Cliente com contratos ativos
- **WHEN** tentativa de desativar cliente com contratos ativos
- **THEN** sistema deve alertar sobre contratos vinculados
- **OR** permitir apenas se forçado explicitamente

#### Scenario: Consulta de contratos do cliente
- **WHEN** cliente é visualizado
- **THEN** sistema pode incluir contagem de contratos
- **AND** listar contratos ativos opcionalmente

### Requirement: Documentação OpenAPI
A API MUST ser documentada usando padrão OpenAPI/Swagger com anotações JSDoc.

#### Scenario: Documentação completa
- **WHEN** endpoints são acessados via /api/docs
- **THEN** documentação deve descrever todos os parâmetros
- **AND** incluir exemplos para PF e PJ separadamente
- **AND** descrever validações e erros possíveis

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

