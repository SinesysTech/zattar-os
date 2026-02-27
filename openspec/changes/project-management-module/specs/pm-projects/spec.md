## ADDED Requirements

### Requirement: CRUD de projetos
O sistema SHALL permitir criar, listar, visualizar, editar e excluir projetos de gestão.

#### Scenario: Criar novo projeto
- **WHEN** um usuário com permissão `projetos.criar` submete o formulário de novo projeto com dados válidos (nome, status, prioridade, responsável e data de início obrigatórios)
- **THEN** o projeto é criado no banco de dados com `criado_por` preenchido automaticamente
- **AND** o usuário criador é adicionado como membro com papel `gerente`
- **AND** o responsável (se diferente do criador) é adicionado como membro com papel `gerente`

#### Scenario: Validação de campos obrigatórios
- **WHEN** um usuário tenta criar um projeto sem preencher nome ou responsável
- **THEN** o sistema retorna erro de validação indicando os campos obrigatórios

#### Scenario: Listar projetos
- **WHEN** um usuário com permissão `projetos.listar` acessa a lista de projetos
- **THEN** o sistema retorna projetos acessíveis pelo usuário (via RLS) com paginação
- **AND** cada projeto inclui: nome, status, prioridade, responsável, progresso, datas e contagem de tarefas

#### Scenario: Filtrar projetos
- **WHEN** um usuário aplica filtros na lista de projetos (status, responsável, cliente, prioridade, período)
- **THEN** apenas projetos que atendem aos critérios são retornados
- **AND** a busca por texto pesquisa em nome e descrição

#### Scenario: Visualizar detalhe do projeto
- **WHEN** um usuário acessa o detalhe de um projeto pelo ID
- **THEN** o sistema exibe todas as informações do projeto incluindo métricas (total de tarefas, tarefas concluídas, horas estimadas vs registradas)

#### Scenario: Editar projeto
- **WHEN** um usuário com permissão `projetos.editar` e papel de `gerente` no projeto submete alterações
- **THEN** os campos editados são atualizados no banco
- **AND** o `atualizado_em` é atualizado automaticamente

#### Scenario: Excluir projeto
- **WHEN** um usuário com permissão `projetos.excluir` e papel de `gerente` no projeto confirma a exclusão
- **THEN** o projeto e todos os dados relacionados (tarefas, membros, lembretes, comentários, anexos) são removidos via CASCADE

### Requirement: Visualizações de lista de projetos
O sistema SHALL oferecer duas visualizações para a lista de projetos: tabela e cards.

#### Scenario: Visualização em tabela
- **WHEN** o usuário seleciona a visualização em tabela
- **THEN** os projetos são exibidos em uma DataTable com colunas: nome, cliente, status, responsável, progresso, data início, prazo, orçamento
- **AND** a tabela suporta sorting, filtros por coluna e export CSV/JSON

#### Scenario: Visualização em cards
- **WHEN** o usuário seleciona a visualização em cards
- **THEN** os projetos são exibidos em grid de cards com: nome, descrição curta, progresso (barra), status (badge), avatars da equipe e prazo restante

### Requirement: Vinculação com entidades existentes
O sistema SHALL permitir vincular projetos a clientes, processos e contratos existentes de forma opcional.

#### Scenario: Vincular projeto a cliente
- **WHEN** um usuário seleciona um cliente ao criar ou editar um projeto
- **THEN** o `cliente_id` é salvo na tabela `pm_projetos`
- **AND** o nome do cliente é exibido na lista e detalhe do projeto

#### Scenario: Vincular projeto a processo
- **WHEN** um usuário seleciona um processo ao criar ou editar um projeto
- **THEN** o `processo_id` é salvo e o projeto exibe link para o processo vinculado

#### Scenario: Vincular projeto a contrato
- **WHEN** um usuário seleciona um contrato ao criar ou editar um projeto
- **THEN** o `contrato_id` é salvo e o projeto exibe link para o contrato vinculado

### Requirement: Cálculo automático de progresso
O sistema SHALL calcular o progresso do projeto automaticamente com base nas tarefas, com possibilidade de override manual.

#### Scenario: Progresso automático
- **WHEN** uma tarefa do projeto muda de status para `concluido` ou `cancelado`
- **THEN** o `progresso` do projeto é recalculado como: (tarefas concluídas / total de tarefas) * 100
- **AND** tarefas canceladas não são contadas no total

#### Scenario: Progresso manual sobrescreve automático
- **WHEN** o gerente do projeto define um valor em `progresso_manual`
- **THEN** o valor de `progresso_manual` é usado no lugar do cálculo automático em todas as visualizações

### Requirement: Permissões de projetos
O sistema SHALL controlar acesso ao módulo de projetos via sistema de permissões existente.

#### Scenario: Verificação de permissão
- **WHEN** um usuário tenta acessar funcionalidades do módulo de projetos
- **THEN** o sistema verifica as permissões: `projetos.listar`, `projetos.criar`, `projetos.editar`, `projetos.excluir`
- **AND** usuários sem `projetos.listar` não veem o módulo na navegação
