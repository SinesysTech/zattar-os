## MODIFIED Requirements

### Requirement: Finalizar assinatura digital

O sistema SHALL finalizar uma assinatura gerando o PDF definitivo, salvando artefatos (assinatura e foto) e registrando os metadados de segurança.

#### Scenario: Assinatura concluída

- **WHEN** o payload contém cliente_id, acao_id, template_id, segmento_id, formulario_id, assinatura_base64 e metadados (IP, user_agent, geo)
- **THEN** o sistema gera o PDF final, salva assinatura/foto em storage, grava registro na tabela de assinaturas digitais e retorna protocolo e pdf_url
- **AND** envia os dados completos ao sistema externo (n8n) após persistir

#### Scenario: Dados inválidos

- **WHEN** o payload não atende validações (assinatura_base64 ausente, campos obrigatórios faltando, geo mal formatada)
- **THEN** o sistema responde 400 sem gerar/registrar assinatura

#### Scenario: Criar contrato com configuração do formulário

- **WHEN** a rota `salvar-acao` é chamada e o formulário possui `contrato_config`
- **THEN** o sistema lê `tipo_contrato_id`, `tipo_cobranca_id`, `papel_cliente` e `pipeline_id` do `contrato_config`
- **AND** busca o estágio default (`is_default = true`) do pipeline referenciado
- **AND** cria o contrato com as FK novas (`tipo_contrato_id`, `tipo_cobranca_id`, `estagio_id`) em vez de valores hard-coded

#### Scenario: Backward compat sem contrato_config

- **WHEN** a rota `salvar-acao` é chamada e o formulário NÃO possui `contrato_config`
- **THEN** o sistema usa valores default: tipo_contrato = 'ajuizamento', tipo_cobranca = 'pro_exito', papel_cliente = 'autora', status = 'em_contratacao'
- **AND** cria o contrato usando colunas enum originais (backward compat)
