## ADDED Requirements

### Requirement: Notificações de eventos de projetos
O sistema SHALL notificar usuários sobre eventos relevantes no módulo de gestão de projetos.

#### Scenario: Notificação de tarefa atribuída
- **WHEN** uma tarefa em `pm_tarefas` é atribuída a um usuário (campo `responsavel_id` definido ou alterado)
- **THEN** uma notificação do tipo `pm_tarefa_atribuida` é criada para o usuário responsável
- **AND** a notificação contém título da tarefa, nome do projeto e link para a tarefa

#### Scenario: Notificação de mudança de status do projeto
- **WHEN** o status de um projeto em `pm_projetos` é alterado
- **THEN** uma notificação do tipo `pm_projeto_status_alterado` é criada para todos os membros do projeto
- **AND** a notificação contém o nome do projeto, status anterior e novo status

#### Scenario: Notificação de prazo de tarefa próximo
- **WHEN** uma tarefa em `pm_tarefas` tem `data_prazo` nos próximos 3 dias e status diferente de `concluido`/`cancelado`
- **THEN** uma notificação do tipo `pm_tarefa_prazo_proximo` é criada para o responsável da tarefa
- **AND** a notificação contém título da tarefa, prazo e link para o projeto

#### Scenario: Notificação de novo membro adicionado
- **WHEN** um novo membro é adicionado a um projeto via `pm_membros_projeto`
- **THEN** uma notificação do tipo `pm_membro_adicionado` é criada para o novo membro
- **AND** a notificação contém nome do projeto, papel atribuído e link para o projeto

#### Scenario: Notificação de comentário em tarefa
- **WHEN** um comentário é adicionado em `pm_comentarios` vinculado a uma tarefa
- **THEN** uma notificação é criada para o responsável da tarefa (se diferente do autor do comentário)
- **AND** a notificação contém preview do comentário e link para a tarefa
