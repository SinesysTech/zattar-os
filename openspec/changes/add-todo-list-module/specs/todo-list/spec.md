## ADDED Requirements

### Requirement: Persistência do Todo List por usuário
O sistema SHALL persistir itens de to-do no banco de dados, vinculados ao usuário autenticado, garantindo isolamento por RLS.

#### Scenario: Usuário lista seus to-dos
- **WHEN** um usuário autenticado acessa a página do módulo
- **THEN** o sistema retorna apenas itens pertencentes ao usuário

#### Scenario: Usuário não autenticado não acessa dados
- **WHEN** um usuário não autenticado tenta carregar a página
- **THEN** o sistema não expõe dados de to-do

### Requirement: CRUD de itens de to-do
O sistema SHALL permitir criar, editar e excluir itens de to-do.

#### Scenario: Criar um to-do
- **WHEN** o usuário envia um formulário válido de criação
- **THEN** o sistema cria o item e o item aparece na listagem

#### Scenario: Editar um to-do
- **WHEN** o usuário salva alterações em um item existente
- **THEN** o sistema persiste as mudanças e reflete na UI

#### Scenario: Excluir um to-do
- **WHEN** o usuário solicita a exclusão de um item
- **THEN** o sistema remove o item e ele não aparece mais na listagem

### Requirement: Campos do template suportados
O sistema SHALL suportar os campos do template de to-do list: título, descrição, atribuídos (assigned to), status, prioridade, due date, reminder date, favoritos (starred) e ordenação (position).

#### Scenario: Atualizar status/prioridade
- **WHEN** o usuário altera status ou prioridade
- **THEN** o sistema persiste a alteração e mantém consistência na UI

#### Scenario: Atribuir usuários ao to-do
- **WHEN** o usuário atribui um ou mais usuários ao item
- **THEN** o sistema persiste as atribuições e a UI consegue filtrar por atribuídos

#### Scenario: Alternar favorito (starred)
- **WHEN** o usuário marca/desmarca um item como favorito
- **THEN** o sistema persiste e o filtro “starred only” funciona

### Requirement: Reordenação persistida
O sistema SHALL persistir a ordenação dos itens após reordenação via drag-and-drop.

#### Scenario: Reordenar itens
- **WHEN** o usuário reordena itens na listagem
- **THEN** o sistema persiste a nova ordem e ela é mantida após recarregar a página

### Requirement: Subtarefas e comentários
O sistema SHALL permitir adicionar/remover/atualizar subtarefas e criar/remover comentários em um item.

#### Scenario: Adicionar e concluir subtarefa
- **WHEN** o usuário adiciona uma subtarefa e marca como concluída
- **THEN** o sistema persiste o estado e a contagem de progresso é atualizada

#### Scenario: Criar e remover comentário
- **WHEN** o usuário adiciona um comentário e depois remove
- **THEN** o sistema persiste ambas as operações

### Requirement: Anexos (metadados)
O sistema SHALL permitir associar anexos a um item de to-do, persistindo metadados (nome, tipo, tamanho, referência/URL).

#### Scenario: Anexar arquivo ao to-do
- **WHEN** o usuário adiciona um anexo
- **THEN** o sistema persiste o metadado e o item exibe o anexo


