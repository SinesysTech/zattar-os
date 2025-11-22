# Spec: Cargos

## ADDED Requirements

### Requirement: Criação de Cargos
O sistema SHALL permitir criar novos cargos para organização interna de usuários.

#### Scenario: Criar cargo com sucesso
- **WHEN** usuário autenticado envia requisição POST para `/api/cargos` com nome "Advogado Sênior"
- **THEN** sistema cria cargo e retorna ID, nome, descrição, ativo, created_by, created_at, updated_at

#### Scenario: Criar cargo com nome duplicado
- **WHEN** usuário tenta criar cargo com nome já existente
- **THEN** sistema retorna erro 400 "Cargo com este nome já existe"

#### Scenario: Criar cargo sem nome
- **WHEN** usuário tenta criar cargo sem fornecer nome
- **THEN** sistema retorna erro 400 "Nome é obrigatório"

### Requirement: Listagem de Cargos
O sistema SHALL permitir listar cargos com suporte a paginação, busca e filtros.

#### Scenario: Listar todos os cargos
- **WHEN** usuário autenticado envia requisição GET para `/api/cargos`
- **THEN** sistema retorna lista de cargos com paginação (pagina, limite, total, totalPaginas)

#### Scenario: Buscar cargos por nome
- **WHEN** usuário envia GET para `/api/cargos?busca=Advogado`
- **THEN** sistema retorna apenas cargos cujo nome contém "Advogado" (case-insensitive)

#### Scenario: Filtrar cargos ativos
- **WHEN** usuário envia GET para `/api/cargos?ativo=true`
- **THEN** sistema retorna apenas cargos com campo `ativo = true`

### Requirement: Busca de Cargo por ID
O sistema SHALL permitir buscar um cargo específico por ID.

#### Scenario: Buscar cargo existente
- **WHEN** usuário autenticado envia GET para `/api/cargos/1`
- **THEN** sistema retorna dados completos do cargo (id, nome, descrição, ativo, created_by, created_at, updated_at)

#### Scenario: Buscar cargo inexistente
- **WHEN** usuário envia GET para `/api/cargos/999` e cargo não existe
- **THEN** sistema retorna erro 404 "Cargo não encontrado"

### Requirement: Atualização de Cargos
O sistema SHALL permitir atualizar informações de um cargo, incluindo o nome, sem restrições.

#### Scenario: Atualizar nome do cargo
- **WHEN** usuário autenticado envia PUT para `/api/cargos/1` com `{ "nome": "Advogado Pleno" }`
- **THEN** sistema atualiza nome do cargo e retorna cargo atualizado

#### Scenario: Atualizar descrição do cargo
- **WHEN** usuário envia PUT para `/api/cargos/1` com `{ "descricao": "Advogado com experiência intermediária" }`
- **THEN** sistema atualiza descrição e retorna cargo atualizado

#### Scenario: Desativar cargo
- **WHEN** usuário envia PUT para `/api/cargos/1` com `{ "ativo": false }`
- **THEN** sistema atualiza campo `ativo` para `false` e retorna cargo atualizado

#### Scenario: Atualizar cargo inexistente
- **WHEN** usuário tenta atualizar cargo com ID 999 que não existe
- **THEN** sistema retorna erro 404 "Cargo não encontrado"

### Requirement: Deleção de Cargos com Validação de Associações
O sistema SHALL impedir a deleção de cargos associados a usuários e retornar erro com lista de usuários.

#### Scenario: Deletar cargo sem usuários associados
- **WHEN** usuário autenticado envia DELETE para `/api/cargos/1` e cargo não está associado a nenhum usuário
- **THEN** sistema deleta cargo e retorna sucesso

#### Scenario: Deletar cargo com usuários associados
- **WHEN** usuário tenta deletar cargo com ID 1 que está associado a 3 usuários
- **THEN** sistema retorna erro 400 com mensagem "Não é possível deletar o cargo. 3 usuário(s) associado(s): João Silva, Maria Santos, Pedro Oliveira"

#### Scenario: Deletar cargo inexistente
- **WHEN** usuário tenta deletar cargo com ID 999 que não existe
- **THEN** sistema retorna erro 404 "Cargo não encontrado"

### Requirement: Listagem de Usuários por Cargo
O sistema SHALL permitir listar todos os usuários associados a um cargo específico.

#### Scenario: Listar usuários de um cargo
- **WHEN** usuário autenticado envia GET para `/api/cargos/1/usuarios`
- **THEN** sistema retorna lista de usuários que possuem `cargo_id = 1`

#### Scenario: Listar usuários de cargo sem associações
- **WHEN** usuário envia GET para `/api/cargos/2/usuarios` e cargo não possui usuários
- **THEN** sistema retorna lista vazia `[]`

### Requirement: Campos Obrigatórios e Opcionais
O sistema SHALL validar campos obrigatórios e opcionais ao criar ou atualizar cargos.

#### Scenario: Campos obrigatórios
- **WHEN** criando cargo
- **THEN** campo `nome` é obrigatório, campos `descricao` e `ativo` são opcionais

#### Scenario: Valores padrão
- **WHEN** criando cargo sem especificar `ativo`
- **THEN** sistema define `ativo = true` por padrão

### Requirement: Auditoria de Criação
O sistema SHALL registrar quem criou cada cargo.

#### Scenario: Registrar criador do cargo
- **WHEN** usuário com ID 5 cria cargo "Estagiário"
- **THEN** sistema armazena `created_by = 5` no registro do cargo

### Requirement: Timestamps Automáticos
O sistema SHALL registrar automaticamente `created_at` e `updated_at` para cargos.

#### Scenario: Timestamps na criação
- **WHEN** cargo é criado
- **THEN** sistema preenche `created_at` e `updated_at` com timestamp atual

#### Scenario: Atualizar `updated_at` ao editar
- **WHEN** cargo é atualizado
- **THEN** sistema atualiza campo `updated_at` com timestamp atual

### Requirement: Unicidade de Nome
O sistema SHALL garantir que nomes de cargos sejam únicos (case-insensitive).

#### Scenario: Nome único ao criar
- **WHEN** criando cargo com nome "Advogado Sênior" e já existe cargo com esse nome
- **THEN** sistema retorna erro 400 "Cargo com este nome já existe"

#### Scenario: Nome único ao atualizar
- **WHEN** atualizando cargo ID 1 para nome "Estagiário" e já existe outro cargo com esse nome
- **THEN** sistema retorna erro 400 "Cargo com este nome já existe"

### Requirement: Row Level Security (RLS)
O sistema SHALL habilitar RLS na tabela `cargos` com políticas de segurança.

#### Scenario: Usuários autenticados podem ler cargos
- **WHEN** usuário autenticado consulta tabela `cargos`
- **THEN** RLS permite leitura

#### Scenario: Usuários autenticados podem criar/editar/deletar cargos
- **WHEN** usuário autenticado tenta criar/editar/deletar cargo
- **THEN** RLS permite operação (verificação adicional no backend para permissões específicas)
