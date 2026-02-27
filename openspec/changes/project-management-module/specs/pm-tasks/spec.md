## ADDED Requirements

### Requirement: CRUD de tarefas vinculadas a projetos
O sistema SHALL permitir criar, listar, visualizar, editar e excluir tarefas dentro de um projeto.

#### Scenario: Criar tarefa
- **WHEN** um membro do projeto cria uma nova tarefa com título (obrigatório)
- **THEN** a tarefa é criada com status `a_fazer`, `ordem_kanban` como o próximo valor na coluna, e `criado_por` preenchido automaticamente

#### Scenario: Editar tarefa
- **WHEN** um membro do projeto edita campos de uma tarefa (título, descrição, status, prioridade, responsável, prazo, estimativa)
- **THEN** os campos são atualizados e `atualizado_em` é definido automaticamente

#### Scenario: Excluir tarefa
- **WHEN** um membro do projeto com papel `gerente` exclui uma tarefa
- **THEN** a tarefa e suas subtarefas são removidas via CASCADE

#### Scenario: Atribuir responsável
- **WHEN** um membro do projeto atribui um responsável a uma tarefa
- **THEN** o `responsavel_id` é atualizado
- **AND** apenas membros do projeto podem ser atribuídos como responsáveis

### Requirement: Board Kanban de tarefas
O sistema SHALL exibir tarefas de um projeto em formato Kanban com colunas por status e suporte a drag & drop.

#### Scenario: Exibir board Kanban
- **WHEN** um usuário acessa a aba de tarefas de um projeto na visualização Kanban
- **THEN** as tarefas são exibidas em colunas: "A Fazer", "Em Progresso", "Em Revisão", "Concluído"
- **AND** cada coluna exibe a contagem de tarefas
- **AND** tarefas canceladas não aparecem no board (apenas em filtro especial)

#### Scenario: Mover tarefa via drag & drop
- **WHEN** um usuário arrasta uma tarefa de uma coluna para outra
- **THEN** o `status` da tarefa é atualizado para o status da coluna de destino
- **AND** a `ordem_kanban` é atualizada para refletir a posição na nova coluna
- **AND** a atualização é otimista (UI atualiza antes da confirmação do servidor)

#### Scenario: Reordenar tarefa dentro da mesma coluna
- **WHEN** um usuário arrasta uma tarefa para uma posição diferente na mesma coluna
- **THEN** a `ordem_kanban` de todas as tarefas afetadas na coluna é recalculada
- **AND** a atualização é otimista com rollback em caso de erro

#### Scenario: Fallback sem drag & drop
- **WHEN** o drag & drop não está disponível (acessibilidade ou mobile)
- **THEN** o usuário pode alterar o status da tarefa via dropdown no card da tarefa

### Requirement: Vista lista de tarefas
O sistema SHALL exibir tarefas em formato de tabela com filtros e sorting.

#### Scenario: Exibir lista de tarefas
- **WHEN** um usuário acessa tarefas na visualização lista
- **THEN** as tarefas são exibidas em DataTable com colunas: título, status, prioridade, responsável, prazo, estimativa, progresso
- **AND** suporta sorting por qualquer coluna e filtros por status, prioridade, responsável

### Requirement: Subtarefas
O sistema SHALL suportar hierarquia de tarefas (subtarefas) com um nível de profundidade.

#### Scenario: Criar subtarefa
- **WHEN** um membro do projeto cria uma tarefa com `tarefa_pai_id` definido
- **THEN** a tarefa é criada como subtarefa vinculada à tarefa pai

#### Scenario: Exibir subtarefas
- **WHEN** um usuário visualiza uma tarefa que possui subtarefas
- **THEN** as subtarefas são listadas dentro do detalhe/card da tarefa pai com seus status individuais

#### Scenario: Progresso da tarefa pai baseado em subtarefas
- **WHEN** uma tarefa pai possui subtarefas
- **THEN** o card da tarefa pai exibe indicador de progresso baseado em subtarefas concluídas

### Requirement: Visão global de tarefas
O sistema SHALL oferecer uma visão cross-projeto de todas as tarefas acessíveis pelo usuário.

#### Scenario: Listar todas as tarefas
- **WHEN** um usuário acessa `/app/project-management/tasks`
- **THEN** todas as tarefas de todos os projetos acessíveis são listadas
- **AND** filtros incluem: projeto, status, prioridade, responsável, prazo

#### Scenario: Filtrar "Minhas Tarefas"
- **WHEN** um usuário aplica o filtro "Minhas Tarefas"
- **THEN** apenas tarefas onde `responsavel_id` é o usuário atual são exibidas
