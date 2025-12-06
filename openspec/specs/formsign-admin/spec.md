# formsign-admin Specification

## Purpose
TBD - created by archiving change add-formsign-admin-service. Update Purpose after archive.
## Requirements
### Requirement: Dashboard de assinaturas (admin)
O sistema SHALL expor metricas administrativas de assinatura digital agregadas por dia corrente, incluindo contagem de templates ativos, sessoes/assinaturas concluidas no dia e taxa de sucesso.

#### Scenario: Consulta de metricas do dia
- **WHEN** um admin requisita as metricas do dashboard
- **THEN** o sistema retorna templatesAtivos, assinaturasHoje, totalAssinaturasHoje, pdfsGeradosHoje e taxaSucesso calculada (assinaturasHoje/totalAssinaturasHoje ou 100% se nenhuma sessao)
- **AND** inclui ultimaAtualizacao como timestamp ISO 8601

### Requirement: CRUD de Templates de assinatura
O sistema SHALL permitir listar, criar, obter, atualizar e deletar templates de assinatura por UUID ou ID, com filtros opcionais de busca e status.

#### Scenario: Listar templates com filtros
- **WHEN** um admin lista templates informando opcionalmente search e ativo
- **THEN** o sistema retorna os templates ordenados por nome e o total correspondente

#### Scenario: Gerenciar template por UUID ou ID
- **WHEN** um admin cria, atualiza, obtém ou deleta um template informando UUID ou ID numerico
- **THEN** a operacao e executada e os metadados de arquivo (arquivo_original, arquivo_nome, arquivo_tamanho, status, ativo, campos) sao preservados na resposta

### Requirement: CRUD de Formularios de assinatura
O sistema SHALL permitir listar, criar, atualizar e deletar formularios com associacao a segmentos e ordenacao, suportando busca por nome/slug/descricao.

#### Scenario: Listar formularios com filtros
- **WHEN** um admin lista formularios informando opcionalmente segmento_id, ativo e search
- **THEN** o sistema retorna formularios com segmento incluso, ordenados por ordem e nome, e o total correspondente

#### Scenario: Gerenciar formulario
- **WHEN** um admin cria, atualiza ou deleta um formulario com slug unico e vinculacao a um segmento
- **THEN** a operacao persiste os campos (nome, slug, descricao, segmento_id, ativo, ordem) e retorna o segmento relacionado

### Requirement: CRUD de Segmentos de assinatura
O sistema SHALL permitir listar, criar e atualizar segmentos de assinatura com filtros de status e busca.

#### Scenario: Listar segmentos com filtros
- **WHEN** um admin lista segmentos informando opcionalmente ativo e search
- **THEN** o sistema retorna segmentos ordenados por nome e o total correspondente

#### Scenario: Gerenciar segmento
- **WHEN** um admin cria ou atualiza um segmento definindo nome, slug, descricao e ativo
- **THEN** a operacao e realizada e o segmento atualizado e retornado

### Requirement: Protecao por autorizacao administrativa
O sistema SHALL restringir o acesso aos endpoints administrativos de assinatura digital a usuarios com papel/permissao administrativa.

#### Scenario: Acesso autorizado
- **WHEN** um usuario autenticado com papel admin acessa as rotas administrativas
- **THEN** o sistema permite a execucao das operacoes de dashboard e CRUDs

#### Scenario: Acesso negado
- **WHEN** um usuario sem permissao admin tenta acessar as rotas administrativas
- **THEN** o sistema responde com erro de autorizacao sem executar a operacao

