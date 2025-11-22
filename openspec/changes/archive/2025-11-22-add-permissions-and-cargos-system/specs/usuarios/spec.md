# Spec Delta: Usuários

## MODIFIED Requirements

### Requirement: Criação de Usuário Completo
O sistema MUST permitir criar usuário com dados pessoais, cadastro no Supabase Auth, cargo e permissão de super admin.

#### Scenario: POST /api/usuarios com dados válidos
- **WHEN** uma requisição POST é enviada com nome, email, cpf, senha
- **THEN** o sistema deve criar usuário no Supabase Auth
- **AND** criar registro na tabela usuarios com UUID retornado
- **AND** retornar dados do usuário criado com status 201

#### Scenario: Email já cadastrado
- **WHEN** tentativa de criar usuário com email existente
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** incluir mensagem "Email já está cadastrado"

#### Scenario: CPF já cadastrado
- **WHEN** tentativa de criar usuário com CPF existente
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** incluir mensagem "CPF já está cadastrado"

#### Scenario: Dados obrigatórios ausentes
- **WHEN** campos obrigatórios (nome, email, cpf) não são fornecidos
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** listar campos faltantes

#### Scenario: Senha fraca
- **WHEN** senha não atende requisitos mínimos
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** descrever requisitos de senha (mínimo 6 caracteres)

#### Scenario: Criar usuário com cargo
- **WHEN** campo `cargo_id` é fornecido ao criar usuário
- **THEN** sistema valida se cargo existe na tabela `cargos`
- **AND** se cargo existe, associa usuário ao cargo
- **AND** se cargo não existe, retorna erro 400 "Cargo não encontrado"

#### Scenario: Criar usuário sem cargo
- **WHEN** campo `cargo_id` não é fornecido
- **THEN** sistema cria usuário com `cargo_id = null`

#### Scenario: Criar usuário como super admin
- **WHEN** campo `is_super_admin = true` é fornecido ao criar usuário
- **THEN** sistema cria usuário com permissões ilimitadas
- **AND** campo `is_super_admin = true` é armazenado no banco

#### Scenario: Criar usuário normal
- **WHEN** campo `is_super_admin` não é fornecido
- **THEN** sistema cria usuário com `is_super_admin = false` (padrão)

### Requirement: Listagem de Usuários
O sistema MUST fornecer endpoint para listar usuários com suporte a paginação, ordenação, filtros e inclusão de dados de cargo.

#### Scenario: GET /api/usuarios com paginação
- **WHEN** uma requisição GET é enviada com parâmetros page e limit
- **THEN** o sistema deve retornar página de usuários solicitada
- **AND** incluir total de registros e total de páginas
- **AND** limitar resultados ao valor de limit

#### Scenario: Ordenação por nome
- **WHEN** parâmetros orderBy=nome e orderDirection são fornecidos
- **THEN** o sistema deve ordenar usuários alfabeticamente
- **AND** aplicar direção ascendente ou descendente

#### Scenario: Listagem padrão
- **WHEN** nenhum parâmetro é fornecido
- **THEN** o sistema deve retornar primeira página com 10 registros
- **AND** ordenar por nome ascendente

#### Scenario: Listar usuários com dados de cargo
- **WHEN** usuários são listados
- **THEN** resposta inclui campos `cargo_id` e `is_super_admin`
- **AND** opcionalmente inclui dados completos do cargo (JOIN) se solicitado

#### Scenario: Filtrar por cargo
- **WHEN** parâmetro `cargo_id=1` é fornecido
- **THEN** sistema retorna apenas usuários com `cargo_id = 1`

#### Scenario: Filtrar por super admin
- **WHEN** parâmetro `is_super_admin=true` é fornecido
- **THEN** sistema retorna apenas usuários com `is_super_admin = true`

### Requirement: Visualização de Usuário Individual
O sistema MUST fornecer endpoint para buscar detalhes de usuário específico por ID, incluindo informações de cargo.

#### Scenario: GET /api/usuarios/[id] com ID válido
- **WHEN** uma requisição GET é enviada com UUID de usuário existente
- **THEN** o sistema deve retornar todos os dados do usuário
- **AND** incluir: id, nome, email, cpf, telefone, ativo, cargo_id, is_super_admin, created_at, updated_at
- **AND** popular dados do cargo (nome, descrição) via JOIN
- **AND** excluir dados sensíveis como senha

#### Scenario: Usuário não encontrado
- **WHEN** ID fornecido não existe
- **THEN** o sistema deve retornar erro 404 Not Found

### Requirement: Atualização de Usuário
O sistema MUST permitir atualizar dados de usuário existente, incluindo cargo e status de super admin.

#### Scenario: PUT /api/usuarios/[id] com dados válidos
- **WHEN** uma requisição PUT é enviada com dados a atualizar
- **THEN** o sistema deve atualizar campos fornecidos
- **AND** manter campos não fornecidos inalterados
- **AND** atualizar campo updated_at automaticamente
- **AND** retornar usuário atualizado

#### Scenario: Atualização de email para email existente
- **WHEN** tentativa de alterar email para um já cadastrado
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** não permitir a alteração

#### Scenario: Atualização de CPF
- **WHEN** tentativa de alterar CPF
- **THEN** o sistema deve validar se novo CPF já está em uso
- **AND** retornar erro se CPF já cadastrado

#### Scenario: Desativação de usuário
- **WHEN** campo ativo é alterado para false
- **THEN** o sistema deve desativar o usuário
- **AND** manter todos os dados históricos
- **AND** não permitir atribuições futuras como responsável

#### Scenario: Reativação de usuário
- **WHEN** campo ativo é alterado para true em usuário inativo
- **THEN** o sistema deve reativar o usuário
- **AND** permitir novas atribuições

#### Scenario: Atualizar cargo do usuário
- **WHEN** campo `cargo_id` é atualizado para novo valor
- **THEN** sistema valida se novo cargo existe
- **AND** se existe, atualiza associação
- **AND** se não existe, retorna erro 400 "Cargo não encontrado"

#### Scenario: Remover cargo do usuário
- **WHEN** campo `cargo_id` é atualizado para `null`
- **THEN** sistema remove associação do usuário com cargo

#### Scenario: Promover usuário a super admin
- **WHEN** campo `is_super_admin` é atualizado para `true`
- **THEN** sistema atualiza campo e usuário passa a ter todas as permissões

#### Scenario: Remover status de super admin
- **WHEN** campo `is_super_admin` é atualizado para `false`
- **THEN** sistema atualiza campo e usuário perde permissões ilimitadas
- **AND** passa a depender de permissões explícitas na tabela `permissoes`

### Requirement: Resposta Padronizada
Todos os endpoints MUST retornar respostas no formato JSON padronizado, incluindo campos de cargo e super admin.

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

#### Scenario: Estrutura de resposta de usuário
- **WHEN** usuário é retornado
- **THEN** resposta inclui campos: id, nome_completo, nome_exibicao, email_corporativo, cpf, telefone, ativo, cargo_id, is_super_admin, created_at, updated_at
- **AND** opcionalmente inclui objeto `cargo` com dados do cargo associado

## ADDED Requirements

### Requirement: Associação com Cargos
O sistema SHALL permitir associar usuários a cargos para organização interna.

#### Scenario: Relacionamento 1:1 com cargos
- **WHEN** usuário possui `cargo_id` preenchido
- **THEN** sistema mantém referência (FK) para tabela `cargos`
- **AND** permite consultar dados do cargo via JOIN

#### Scenario: Cargo é opcional
- **WHEN** usuário é criado ou atualizado sem `cargo_id`
- **THEN** sistema aceita `cargo_id = null`

#### Scenario: Deletar cargo em uso
- **WHEN** cargo associado a usuários é deletado
- **THEN** sistema define `cargo_id = null` automaticamente para usuários afetados via `ON DELETE SET NULL`

### Requirement: Super Admin
O sistema SHALL permitir marcar usuários como super admins que bypassam verificações de permissão.

#### Scenario: Verificação de super admin
- **WHEN** sistema verifica se usuário tem permissão para executar operação
- **THEN** se `is_super_admin = true`, retorna `true` sem consultar tabela `permissoes`

#### Scenario: Listar permissões de super admin
- **WHEN** consultando permissões de usuário com `is_super_admin = true`
- **THEN** sistema retorna matriz completa de todas as permissões disponíveis

#### Scenario: Super admin padrão
- **WHEN** criando usuário sem especificar `is_super_admin`
- **THEN** sistema define `is_super_admin = false` por padrão

### Requirement: Validação de Cargo
O sistema SHALL validar que cargos associados a usuários existem na tabela `cargos`.

#### Scenario: Cargo existe
- **WHEN** usuário é criado/atualizado com `cargo_id = 1`
- **THEN** sistema verifica se cargo com ID 1 existe
- **AND** se existe, permite operação

#### Scenario: Cargo não existe
- **WHEN** usuário é criado/atualizado com `cargo_id = 999` inexistente
- **THEN** sistema retorna erro 400 "Cargo não encontrado"

### Requirement: Índices de Performance
O sistema SHALL criar índices para otimizar consultas relacionadas a cargos e super admins.

#### Scenario: Índice em cargo_id
- **WHEN** consultando usuários por cargo
- **THEN** banco usa índice `idx_usuarios_cargo_id` para performance

#### Scenario: Índice em is_super_admin
- **WHEN** filtrando super admins
- **THEN** banco usa índice `idx_usuarios_is_super_admin` para performance

### Requirement: Integração com Sistema de Permissões
O sistema SHALL integrar usuários com sistema de permissões granulares.

#### Scenario: Usuário normal depende de permissões explícitas
- **WHEN** usuário com `is_super_admin = false` tenta acessar recurso
- **THEN** sistema consulta tabela `permissoes` para verificar acesso

#### Scenario: Super admin bypassa permissões
- **WHEN** usuário com `is_super_admin = true` tenta acessar qualquer recurso
- **THEN** sistema concede acesso sem consultar tabela `permissoes`

### Requirement: Auditoria de Mudanças de Status de Super Admin
O sistema SHALL registrar em log todas as alterações de status de super admin.

#### Scenario: Promover usuário a super admin
- **WHEN** `is_super_admin` é alterado de `false` para `true`
- **THEN** sistema registra evento em `logs_alteracao` com tipo_evento="promovido_super_admin"

#### Scenario: Remover status de super admin
- **WHEN** `is_super_admin` é alterado de `true` para `false`
- **THEN** sistema registra evento em `logs_alteracao` com tipo_evento="removido_super_admin"

### Requirement: Cascade Delete de Permissões
O sistema SHALL deletar automaticamente todas as permissões ao deletar usuário.

#### Scenario: Deletar usuário com permissões
- **WHEN** usuário é deletado
- **THEN** sistema remove automaticamente todos os registros de `permissoes` via `ON DELETE CASCADE`
