## ADDED Requirements

### Requirement: CRUD de lembretes
O sistema SHALL permitir criar, listar, editar, concluir e excluir lembretes vinculados a projetos e/ou tarefas.

#### Scenario: Criar lembrete
- **WHEN** um membro do projeto cria um lembrete com texto, data/hora e prioridade (obrigatórios)
- **THEN** o lembrete é criado vinculado ao projeto e/ou tarefa selecionado
- **AND** `usuario_id` é preenchido automaticamente com o usuário atual

#### Scenario: Criar lembrete via dialog
- **WHEN** um usuário clica em "Set Reminder" no dashboard ou detalhe do projeto
- **THEN** um dialog é exibido com campos: nota, data/hora (DateTimePicker), prioridade (low/medium/high) e categoria
- **AND** ao confirmar, o lembrete é persistido no banco

#### Scenario: Listar lembretes do usuário
- **WHEN** um usuário consulta seus lembretes
- **THEN** apenas lembretes do próprio usuário são retornados (RLS)
- **AND** ordenados por data/hora (mais próximos primeiro)
- **AND** filtráveis por: concluído/pendente, prioridade, projeto

#### Scenario: Marcar lembrete como concluído
- **WHEN** um usuário marca um lembrete como concluído
- **THEN** o campo `concluido` é atualizado para `true`

#### Scenario: Excluir lembrete
- **WHEN** um usuário exclui um lembrete próprio
- **THEN** o registro é removido do banco

### Requirement: Exibição de lembretes com prioridade visual
O sistema SHALL exibir lembretes com indicadores visuais de prioridade.

#### Scenario: Cores de prioridade
- **WHEN** lembretes são exibidos em cards ou lista
- **THEN** a prioridade é indicada por cor: cinza (baixa), laranja (média), vermelho (alta/urgente)
- **AND** lembretes concluídos exibem ícone de check verde
- **AND** lembretes pendentes exibem ícone de check cinza
