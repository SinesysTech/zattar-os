## ADDED Requirements

### Requirement: Preview de PDF de assinatura

O sistema SHALL gerar um PDF de preview para um formulário/template informando cliente e ação, sem persistir assinatura definitiva.

#### Scenario: Gerar preview

- **WHEN** um cliente requisita preview informando clienteId, acaoId e templateId (e opcional fotoBase64)
- **THEN** o sistema obtém os dados externos necessários, gera o PDF com flag de preview e retorna uma URL temporária

### Requirement: Finalizar assinatura digital

O sistema SHALL finalizar uma assinatura gerando o PDF definitivo, salvando artefatos (assinatura e foto) e registrando os metadados de segurança.

#### Scenario: Assinatura concluída

- **WHEN** o payload contém cliente_id, acao_id, template_id, segmento_id, formulario_id, assinatura_base64 e metadados (IP, user_agent, geo)
- **THEN** o sistema gera o PDF final, salva assinatura/foto em storage, grava registro na tabela de assinaturas digitais e retorna protocolo e pdf_url
- **AND** envia os dados completos ao sistema externo (n8n) após persistir

#### Scenario: Dados inválidos

- **WHEN** o payload não atende validações (assinatura_base64 ausente, campos obrigatórios faltando, geo mal formatada)
- **THEN** o sistema responde 400 sem gerar/registrar assinatura

### Requirement: Gestão de sessões de assinatura

O sistema SHALL registrar e consultar sessões de assinatura para acompanhar status e expiração.

#### Scenario: Listar sessões

- **WHEN** um admin lista sessões informando filtros opcionais (segmento_id, formulario_id, status, data_inicio/fim, search)
- **THEN** o sistema retorna as sessões de assinatura digital com paginação e total

### Requirement: Proteção por autorização administrativa

O sistema SHALL restringir acesso aos endpoints de assinatura/preview e listagem de sessões/assinaturas a usuários com permissão assinatura_digital_admin.

#### Scenario: Acesso autorizado

- **WHEN** um usuário autenticado com permissão assinatura_digital_admin acessa as rotas
- **THEN** o sistema permite executar preview, finalizar e listar sessões/assinaturas

#### Scenario: Acesso negado

- **WHEN** um usuário sem permissão tenta acessar
- **THEN** o sistema responde erro de autorização
