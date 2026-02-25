# assinatura-digital-admin Specification

## Purpose
Gestão administrativa da plataforma de assinatura digital: dashboard de métricas, CRUD de templates/formulários/segmentos, administração de pipelines e tipos de contrato.
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
- **THEN** a operacao persiste os campos (nome, slug, descricao, segmento_id, ativo, ordem, tipo_formulario, contrato_config) e retorna o segmento relacionado

#### Scenario: Criar formulario tipo contrato
- **WHEN** um admin cria formulario com tipo_formulario = 'contrato' informando contrato_config
- **THEN** o sistema valida contrato_config via Zod (tipo_contrato_id, tipo_cobranca_id, papel_cliente, pipeline_id existem e são válidos)
- **AND** persiste tipo_formulario e contrato_config
- **AND** se form_schema está vazio, gera auto-scaffold com seções padrão de contrato

#### Scenario: Atualizar formulario alterando tipo
- **WHEN** um admin altera tipo_formulario de 'contrato' para outro tipo
- **THEN** o sistema limpa contrato_config (set null)
- **AND** mantém form_schema existente

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

### Requirement: UI de admin para pipelines de contrato
O sistema SHALL fornecer interface administrativa para gerenciar pipelines e seus estágios.

#### Scenario: Página de admin de pipelines
- **WHEN** admin acessa a seção de pipelines
- **THEN** o sistema exibe lista de pipelines com segmento, nome, quantidade de estágios e status
- **AND** permite criar novo pipeline selecionando segmento

#### Scenario: Editar estágios do pipeline
- **WHEN** admin abre um pipeline para edição
- **THEN** o sistema exibe lista de estágios com nome, cor, ordem e flag default
- **AND** permite adicionar, editar, remover e reordenar estágios via drag-and-drop
- **AND** exibe color picker para selecionar cor do estágio

### Requirement: UI de admin para tipos de contrato e cobrança
O sistema SHALL fornecer interface administrativa para gerenciar tipos de contrato e tipos de cobrança.

#### Scenario: Página de admin de tipos de contrato
- **WHEN** admin acessa a seção de tipos de contrato
- **THEN** o sistema exibe tabela com nome, slug, descrição, status e ações (editar, desativar)
- **AND** permite criar novo tipo de contrato

#### Scenario: Página de admin de tipos de cobrança
- **WHEN** admin acessa a seção de tipos de cobrança
- **THEN** o sistema exibe tabela com nome, slug, descrição, status e ações (editar, desativar)
- **AND** permite criar novo tipo de cobrança

