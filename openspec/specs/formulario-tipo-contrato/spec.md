## ADDED Requirements

### Requirement: Campo tipo_formulario no formulário
O sistema SHALL suportar campo `tipo_formulario` na tabela `assinatura_digital_formularios` para distinguir o propósito do formulário.

#### Scenario: Criar formulário com tipo
- **WHEN** admin cria formulário selecionando tipo_formulario = 'contrato'
- **THEN** o sistema persiste `tipo_formulario = 'contrato'` no registro
- **AND** exibe campos de configuração de contrato (tipo_contrato_id, tipo_cobranca_id, papel_cliente, pipeline_id)

#### Scenario: Criar formulário tipo documento
- **WHEN** admin cria formulário selecionando tipo_formulario = 'documento'
- **THEN** o sistema persiste `tipo_formulario = 'documento'`
- **AND** não exibe campos de configuração de contrato

#### Scenario: Criar formulário tipo cadastro
- **WHEN** admin cria formulário selecionando tipo_formulario = 'cadastro'
- **THEN** o sistema persiste `tipo_formulario = 'cadastro'`
- **AND** não exibe campos de configuração de contrato

#### Scenario: Formulários existentes sem tipo
- **WHEN** formulário existente não possui `tipo_formulario` definido
- **THEN** o sistema trata como null e continua funcionando normalmente (backward compat)

### Requirement: Configuração de contrato no formulário
O sistema SHALL armazenar configuração de contrato como JSONB `contrato_config` no formulário, quando `tipo_formulario = 'contrato'`.

#### Scenario: Salvar configuração de contrato
- **WHEN** admin salva formulário do tipo 'contrato' com tipo_contrato_id, tipo_cobranca_id, papel_cliente e pipeline_id
- **THEN** o sistema persiste `contrato_config` como JSONB: `{ "tipo_contrato_id": N, "tipo_cobranca_id": N, "papel_cliente": "autora"|"re", "pipeline_id": N }`

#### Scenario: Validar configuração antes de salvar
- **WHEN** admin submete configuração de contrato
- **THEN** o sistema valida via Zod que tipo_contrato_id, tipo_cobranca_id e pipeline_id existem e estão ativos
- **AND** valida que papel_cliente é 'autora' ou 're'
- **AND** valida que pipeline_id pertence ao mesmo segmento do formulário

#### Scenario: Pipeline incompatível com segmento
- **WHEN** admin seleciona pipeline_id de segmento diferente do formulário
- **THEN** o sistema retorna erro 422 indicando incompatibilidade
- **AND** não salva a configuração

### Requirement: Auto-scaffold de schema para formulário de contrato
O sistema SHALL gerar automaticamente um `form_schema` base quando admin cria formulário do tipo 'contrato' sem schema existente.

#### Scenario: Scaffold gerado na criação
- **WHEN** admin cria formulário com tipo_formulario = 'contrato' e form_schema está vazio/null
- **THEN** o sistema gera form_schema com 3 seções:
  1. "Dados do Cliente" — campos: aplicativo (select de partes contrárias), valor_causa (currency)
  2. "Parte Contrária" — campos derivados do contexto do segmento
  3. "Dados do Contrato" — campos: observacoes (textarea)
- **AND** o schema gerado é editável pelo admin no schema builder

#### Scenario: Scaffold não sobrescreve schema existente
- **WHEN** admin atualiza formulário existente com form_schema já preenchido para tipo_formulario = 'contrato'
- **THEN** o sistema mantém o form_schema existente intacto
- **AND** não regenera o scaffold

### Requirement: UI de configuração de contrato no dialog de formulário
O sistema SHALL exibir campos de configuração de contrato no dialog de criação/edição de formulário quando tipo_formulario = 'contrato'.

#### Scenario: Campos de configuração visíveis
- **WHEN** admin seleciona tipo_formulario = 'contrato' no dialog
- **THEN** o sistema exibe: select de tipo de contrato (busca contrato_tipos ativos), select de tipo de cobrança (busca contrato_tipos_cobranca ativos), select de papel do cliente (autora/ré), select de pipeline (busca pipelines do segmento do formulário)

#### Scenario: Campos de configuração ocultos
- **WHEN** admin seleciona tipo_formulario diferente de 'contrato'
- **THEN** o sistema oculta os campos de configuração de contrato
- **AND** limpa valores previamente selecionados

#### Scenario: Pipeline filtrado por segmento
- **WHEN** admin seleciona segmento e depois tipo_formulario = 'contrato'
- **THEN** o select de pipeline mostra apenas o pipeline vinculado ao segmento selecionado
