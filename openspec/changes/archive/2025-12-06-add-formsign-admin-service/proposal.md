# Change: Integrar AdminService da Assinatura Digital ao backend Sinesis

## Why

Integrar a gestao administrativa da Assinatura Digital (dash de assinaturas, CRUD de formularios/templates/segmentos) ao app principal para centralizar a plataforma de assinatura digital.

## What Changes

- Adicionar servico Admin de assinaturas no backend Sinesis com metricas de dashboard (templates ativos, sessoes/assinaturas do dia, taxa de sucesso)
- Expor CRUD de templates, formularios e segmentos com filtros de busca/status e busca por ID/UUID
- Mapear e provisionar modelos de dados (templates, formularios, segmentos, sessoes de assinatura) e paths de armazenamento de templates
- Aplicar autorizacao/validacao/logs no padrao do backend Sinesis

## Impact

- Affected specs: assinatura-digital-admin
- Affected code: backend admin/dashboard services, rotas/provedores de armazenamento, modelos de dados de assinatura digital
