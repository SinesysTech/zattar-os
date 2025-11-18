## ADDED Requirements

### Requirement: Gerenciamento de Tipos de Expedientes
O sistema SHALL permitir criar, listar, buscar, atualizar e deletar tipos de expedientes. Cada tipo de expediente SHALL ter um nome único e um usuário criador associado.

#### Scenario: Criar novo tipo de expediente
- **WHEN** um usuário autenticado cria um novo tipo de expediente com nome único
- **THEN** o tipo é criado com sucesso e retornado com `id`, `tipo_expediente`, `created_by`, `created_at` e `updated_at`

#### Scenario: Tentar criar tipo com nome duplicado
- **WHEN** um usuário tenta criar um tipo de expediente com nome que já existe
- **THEN** o sistema retorna erro de validação indicando que o nome já está em uso

#### Scenario: Listar tipos de expedientes
- **WHEN** um usuário autenticado lista tipos de expedientes
- **THEN** o sistema retorna lista paginada de tipos com possibilidade de busca e filtros

#### Scenario: Buscar tipo por ID
- **WHEN** um usuário autenticado busca um tipo de expediente por ID
- **THEN** o sistema retorna os dados completos do tipo ou erro se não encontrado

#### Scenario: Atualizar tipo de expediente
- **WHEN** um usuário autenticado atualiza um tipo de expediente existente
- **THEN** o tipo é atualizado e retornado com `updated_at` atualizado

#### Scenario: Deletar tipo de expediente não utilizado
- **WHEN** um usuário autenticado deleta um tipo de expediente que não está sendo usado em nenhum expediente
- **THEN** o tipo é deletado com sucesso

#### Scenario: Tentar deletar tipo em uso
- **WHEN** um usuário tenta deletar um tipo de expediente que está sendo usado em pelo menos um expediente
- **THEN** o sistema retorna erro indicando que o tipo não pode ser deletado pois está em uso

### Requirement: Associação de Tipo e Descrição em Expedientes
O sistema SHALL permitir associar um tipo de expediente e uma descrição/arquivos a cada expediente pendente de manifestação. Ambos os campos SHALL ser opcionais para manter compatibilidade com dados existentes.

#### Scenario: Atribuir tipo e descrição a expediente
- **WHEN** um usuário atribui um tipo de expediente e descrição a um expediente pendente
- **THEN** os campos `tipo_expediente_id` e `descricao_arquivos` são atualizados no expediente

#### Scenario: Expediente sem tipo e descrição
- **WHEN** um expediente não possui tipo ou descrição atribuídos
- **THEN** o sistema exibe valores padrão (ex: "Sem tipo" e campo vazio) sem erro

#### Scenario: Filtrar expedientes por tipo
- **WHEN** um usuário filtra expedientes por tipo de expediente
- **THEN** o sistema retorna apenas expedientes com o tipo especificado

### Requirement: Exibição de Tipo e Descrição no Frontend
O sistema SHALL exibir tipo de expediente e descrição/arquivos em uma coluna composta na página de expedientes.

#### Scenario: Exibir coluna composta Tipo/Descrição
- **WHEN** um usuário visualiza a página de expedientes
- **THEN** o sistema exibe uma coluna composta mostrando o nome do tipo de expediente e a descrição/arquivos na mesma célula

#### Scenario: Exibir expediente sem tipo
- **WHEN** um expediente não possui tipo atribuído
- **THEN** o sistema exibe indicador visual (ex: "Sem tipo") na coluna composta

