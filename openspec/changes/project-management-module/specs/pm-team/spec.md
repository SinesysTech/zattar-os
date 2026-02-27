## ADDED Requirements

### Requirement: Gestão de membros do projeto
O sistema SHALL permitir adicionar, remover e alterar papéis de membros em um projeto.

#### Scenario: Adicionar membro ao projeto
- **WHEN** um gerente do projeto adiciona um usuário do sistema como membro
- **THEN** o registro é criado em `pm_membros_projeto` com o papel selecionado (gerente, membro ou observador)
- **AND** o membro passa a ver o projeto nas suas listas e dashboards

#### Scenario: Impedir membro duplicado
- **WHEN** um gerente tenta adicionar um usuário que já é membro do projeto
- **THEN** o sistema retorna erro indicando que o usuário já é membro

#### Scenario: Alterar papel de membro
- **WHEN** um gerente do projeto altera o papel de um membro
- **THEN** o campo `papel` em `pm_membros_projeto` é atualizado

#### Scenario: Remover membro do projeto
- **WHEN** um gerente do projeto remove um membro
- **THEN** o registro é removido de `pm_membros_projeto`
- **AND** tarefas atribuídas ao membro removido mantêm o `responsavel_id` mas o gerente é notificado para reatribuir

#### Scenario: Impedir remover último gerente
- **WHEN** um gerente tenta remover o único gerente restante do projeto
- **THEN** o sistema retorna erro indicando que o projeto precisa de pelo menos um gerente

### Requirement: Exibição de equipe do projeto
O sistema SHALL exibir a equipe do projeto com avatars, nomes e papéis.

#### Scenario: Listar membros na aba Equipe
- **WHEN** um usuário acessa a aba "Equipe" de um projeto
- **THEN** todos os membros são listados com avatar, nome, papel e data de adição
- **AND** membros são agrupados por papel (gerentes primeiro, depois membros, depois observadores)

#### Scenario: Avatar group em cards e listas
- **WHEN** projetos são exibidos em cards ou tabela
- **THEN** um grupo de avatars dos membros é exibido (máximo 5 visíveis + indicador "+N")
