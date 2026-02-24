## ADDED Requirements

### Requirement: Consulta de atividades por usuário
O sistema SHALL fornecer consulta paginada de logs de atividades de negócio filtrada por usuário executor, ordenada por data decrescente.

#### Scenario: Buscar atividades recentes de um usuário
- **WHEN** o sistema recebe uma solicitação de atividades para um `usuario_id` válido
- **THEN** o sistema MUST retornar os registros da tabela `logs_alteracao` onde `usuario_que_executou_id` corresponde ao `usuario_id`
- **AND** os resultados MUST ser ordenados por `created_at` decrescente
- **AND** os resultados MUST ser limitados ao número de registros solicitado (padrão: 20)

#### Scenario: Incluir nomes de responsáveis nos resultados
- **WHEN** um registro de atividade possui `responsavel_anterior_id` ou `responsavel_novo_id`
- **THEN** o sistema MUST incluir o `nomeExibicao` correspondente via join com a tabela `usuarios`
- **AND** se o usuário referenciado não existir, MUST retornar `null` (LEFT JOIN)

#### Scenario: Carregar mais atividades
- **WHEN** o frontend solicita mais registros com um `offset` maior que zero
- **THEN** o sistema MUST retornar os próximos registros a partir do offset informado
- **AND** MUST informar se existem mais registros além dos retornados

#### Scenario: Usuário sem atividades
- **WHEN** não existem registros em `logs_alteracao` para o `usuario_id` informado
- **THEN** o sistema MUST retornar uma lista vazia sem erro

### Requirement: Proteção de acesso às atividades
O sistema SHALL restringir o acesso às atividades de um usuário baseado na permissão `usuarios:visualizar`.

#### Scenario: Usuário com permissão acessa atividades
- **WHEN** um usuário autenticado com permissão `usuarios:visualizar` solicita atividades de outro usuário
- **THEN** o sistema MUST retornar os dados normalmente

#### Scenario: Usuário sem permissão tenta acessar atividades
- **WHEN** um usuário sem permissão `usuarios:visualizar` solicita atividades
- **THEN** o sistema MUST retornar erro de permissão negada
- **AND** MUST não retornar nenhum dado de atividade

### Requirement: Mapeamento de tipos de evento para exibição
O sistema SHALL mapear cada `tipo_evento` da tabela `logs_alteracao` para label, ícone e cor adequados à exibição na timeline.

#### Scenario: Evento de atribuição de responsável
- **WHEN** o `tipo_evento` é `atribuicao_responsavel`
- **THEN** o sistema MUST exibir label "Atribuiu responsável", ícone de atribuição, e cor verde

#### Scenario: Evento de transferência de responsável
- **WHEN** o `tipo_evento` é `transferencia_responsavel`
- **THEN** o sistema MUST exibir label "Transferiu responsável", ícone de transferência, e cor azul

#### Scenario: Evento de desatribuição de responsável
- **WHEN** o `tipo_evento` é `desatribuicao_responsavel`
- **THEN** o sistema MUST exibir label "Removeu responsável", ícone de remoção, e cor laranja

#### Scenario: Evento de mudança de status
- **WHEN** o `tipo_evento` é `mudanca_status`
- **THEN** o sistema MUST exibir label "Alterou status", ícone de status, e cor violeta

#### Scenario: Evento desconhecido
- **WHEN** o `tipo_evento` não corresponde a nenhum mapeamento conhecido
- **THEN** o sistema MUST exibir label genérica "Atividade registrada", ícone padrão, e cor neutra

### Requirement: Descrição humanizada do evento
O sistema SHALL gerar uma descrição legível para cada evento, incluindo a entidade afetada e os nomes dos responsáveis envolvidos.

#### Scenario: Descrição de atribuição com nomes
- **WHEN** o evento é `atribuicao_responsavel` com `responsavel_novo_id` presente
- **THEN** a descrição MUST incluir o tipo da entidade (processo, audiência, etc.), o ID/número da entidade, e o nome do novo responsável

#### Scenario: Descrição de transferência com nomes
- **WHEN** o evento é `transferencia_responsavel` com `responsavel_anterior_id` e `responsavel_novo_id` presentes
- **THEN** a descrição MUST incluir o nome do responsável anterior e do novo responsável

#### Scenario: Responsável removido do sistema
- **WHEN** o nome de um responsável referenciado não está disponível (usuário deletado)
- **THEN** a descrição MUST usar "Usuário removido" como fallback
