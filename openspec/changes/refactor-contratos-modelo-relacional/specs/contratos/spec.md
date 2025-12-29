## MODIFIED Requirements
### Requirement: Visualização de Detalhes do Contrato
O sistema MUST permitir visualizar detalhes completos de um contrato em modal/sheet.

#### Scenario: Abrir visualização de contrato
- **WHEN** o usuário clica no botão de visualizar
- **THEN** o sistema deve abrir sheet com detalhes do contrato
- **AND** mostrar informações básicas: área de direito, tipo, cobrança, status
- **AND** mostrar informações das partes do contrato via relacionamento relacional (múltiplas partes autoras e rés)
- **AND** mostrar histórico de alterações de status (incluindo reversões)
- **AND** mostrar responsável atribuído
- **AND** mostrar observações

## ADDED Requirements
### Requirement: Partes do Contrato (Modelo Relacional)
O sistema MUST persistir as partes do contrato em uma tabela relacional de associação (`contrato_partes`), suportando múltiplas partes por papel/qualificação contratual.

#### Scenario: Contrato com múltiplas partes autoras e rés
- **WHEN** um contrato é criado ou editado com mais de uma parte autora ou mais de uma parte ré
- **THEN** o sistema deve persistir cada parte como um registro em `contrato_partes`
- **AND** cada registro deve indicar o papel/qualificação contratual (autora/re) e a entidade (cliente/parte_contraria)
- **AND** o sistema MUST tratar `papel/qualificação contratual` (autora/re) como conceito distinto de `polo processual` (ativo/passivo), que pode mudar por grau

### Requirement: Histórico de Status do Contrato
O sistema MUST registrar todas as mudanças de status do contrato em histórico, incluindo reversões.

#### Scenario: Registrar mudança de status
- **WHEN** o status do contrato é alterado
- **THEN** o sistema deve registrar um evento em `contrato_status_historico` com status anterior e novo status
- **AND** armazenar data/hora e usuário responsável

#### Scenario: Reverter status
- **WHEN** o usuário reverte um contrato de "distribuído" para "contratado"
- **THEN** o sistema deve manter o status atual consistente
- **AND** registrar um novo evento no histórico descrevendo a reversão

### Requirement: Data de Cadastro do Contrato
O sistema MUST expor a data de cadastro do contrato como `cadastrado_em`.

#### Scenario: Exibir data de cadastro
- **WHEN** o usuário visualiza a listagem ou detalhes do contrato
- **THEN** o sistema deve exibir "Cadastrado em" baseado em `contratos.cadastrado_em`

### Requirement: Segmento padrão para contratos legados
O sistema MUST garantir que contratos migrados possuam `segmento_id` preenchido para o segmento trabalhista.

#### Scenario: Backfill de segmento em contratos existentes
- **WHEN** a migração de remodelagem for aplicada em ambiente com contratos existentes
- **THEN** o sistema deve atualizar `contratos.segmento_id` para o segmento trabalhista (referência por `segmentos.slug='trabalhista'`) em registros legados

### Requirement: Tags no Contrato
O sistema MUST permitir associar tags a contratos usando um sistema unificado de tags.

#### Scenario: Criar nova tag e aplicar ao contrato
- **WHEN** o usuário cria uma nova tag e a aplica em um contrato
- **THEN** o sistema deve persistir a tag no catálogo unificado (`tags`)
- **AND** associar a tag ao contrato via relação (`contrato_tags`)

#### Scenario: Tags do contrato propagam para processos vinculados
- **WHEN** um contrato possui processos vinculados
- **AND** o usuário adiciona uma tag ao contrato
- **THEN** o sistema deve propagar automaticamente a tag para os processos vinculados
- **AND** evitar duplicidades

## REMOVED Requirements
### Requirement: Datas por estágio como colunas no contrato
**Reason**: Datas por estágio (assinatura/distribuição/desistência) não suportam histórico nem reversão de status.
**Migration**: Migrar para `contrato_status_historico` e derivar datas por eventos.

#### Scenario: Migração de datas legadas
- **WHEN** dados legados possuem datas de assinatura/distribuição/desistência
- **THEN** o sistema deve migrar essas informações para eventos no histórico
