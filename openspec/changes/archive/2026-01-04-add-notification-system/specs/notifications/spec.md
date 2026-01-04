# Notificações - Especificação

## ADDED Requirements

### Requirement: Sistema de Notificações para Usuários
O sistema SHALL notificar usuários sobre eventos importantes relacionados a entidades atribuídas a eles, incluindo processos, audiências, expedientes e outras entidades do sistema.

#### Scenario: Notificação de processo atribuído
- **WHEN** um processo é atribuído a um usuário (campo `acervo.responsavel_id` é definido ou alterado)
- **THEN** uma notificação do tipo `processo_atribuido` é criada para o usuário responsável
- **AND** a notificação contém título, descrição e link para o processo

#### Scenario: Notificação de movimentação em processo
- **WHEN** ocorre uma movimentação significativa em um processo atribuído a um usuário
- **THEN** uma notificação do tipo `processo_movimentacao` é criada para o usuário responsável
- **AND** a notificação contém detalhes da movimentação

#### Scenario: Notificação de audiência atribuída
- **WHEN** uma audiência é atribuída a um usuário (campo `audiencias.responsavel_id` é definido ou alterado)
- **THEN** uma notificação do tipo `audiencia_atribuida` é criada para o usuário responsável
- **AND** a notificação contém título, descrição e link para a audiência

#### Scenario: Notificação de alteração em audiência
- **WHEN** uma audiência atribuída a um usuário tem sua data, status ou modalidade alterados
- **THEN** uma notificação do tipo `audiencia_alterada` é criada para o usuário responsável
- **AND** a notificação contém detalhes da alteração

#### Scenario: Notificação de expediente atribuído
- **WHEN** um expediente é atribuído a um usuário (campo `expedientes.responsavel_id` é definido ou alterado)
- **THEN** uma notificação do tipo `expediente_atribuido` é criada para o usuário responsável
- **AND** a notificação contém título, descrição e link para o expediente

#### Scenario: Notificação de alteração em expediente
- **WHEN** um expediente atribuído a um usuário tem seu status, prazo ou dados alterados
- **THEN** uma notificação do tipo `expediente_alterado` é criada para o usuário responsável
- **AND** a notificação contém detalhes da alteração

#### Scenario: Notificação de prazo vencendo
- **WHEN** um expediente ou audiência atribuído a um usuário tem prazo próximo ao vencimento (ex: 3 dias)
- **THEN** uma notificação do tipo `prazo_vencendo` é criada para o usuário responsável
- **AND** a notificação contém informações sobre o prazo

#### Scenario: Notificação de prazo vencido
- **WHEN** um expediente ou audiência atribuído a um usuário tem prazo vencido
- **THEN** uma notificação do tipo `prazo_vencido` é criada para o usuário responsável
- **AND** a notificação contém informações sobre o prazo vencido

### Requirement: Gerenciamento de Notificações
O sistema SHALL permitir que usuários visualizem, marquem como lidas e gerenciem suas notificações.

#### Scenario: Listar notificações do usuário
- **WHEN** um usuário autenticado acessa suas notificações
- **THEN** o sistema retorna lista de notificações ordenadas por data (mais recentes primeiro)
- **AND** apenas notificações do usuário são retornadas (RLS)

#### Scenario: Marcar notificação como lida
- **WHEN** um usuário marca uma notificação como lida
- **THEN** o campo `lida` é atualizado para `true`
- **AND** o campo `lida_em` é preenchido com timestamp atual
- **AND** a notificação não aparece mais no contador de não lidas

#### Scenario: Contador de notificações não lidas
- **WHEN** um usuário visualiza o componente de notificações
- **THEN** o sistema exibe contador de notificações não lidas
- **AND** o contador é atualizado em tempo real via Realtime

### Requirement: Notificações em Tempo Real
O sistema SHALL notificar usuários em tempo real quando novas notificações são criadas.

#### Scenario: Notificação em tempo real
- **WHEN** uma nova notificação é criada para um usuário
- **THEN** o sistema envia evento via Supabase Realtime
- **AND** o componente de notificações do usuário recebe a atualização automaticamente
- **AND** o contador de não lidas é atualizado sem necessidade de refresh

