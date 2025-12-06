## 1. Implementacao
- [x] 1.1 Mapear padroes de servico/rotas/autorizacao do backend Sinesis para area admin
- [x] 1.2 Adicionar modelos/dados para templates, formularios, segmentos e sessoes de assinatura (schema/migracao) e alinhar storage de templates
- [x] 1.3 Implementar servico Admin com metricas de dashboard e CRUDs no padrao de respostas/validacao do Sinesis
- [x] 1.4 Expor endpoints admin protegidos (roles/permissoes) e ajustar wiring de rotas
- [x] 1.5 Instrumentar logs/metricas no padrao do backend e validar integracao com storage
- [x] 1.6 Testar fluxos principais (metricas e CRUDs) e ajustar

## Notas de Implementacao
- Tabelas: assinatura_digital_templates, _formularios, _segmentos, _sessoes_assinatura, _assinaturas
- Services: backend/assinatura-digital/services/*.ts
- APIs: app/api/assinatura-digital/**
- Autenticacao: requirePermission('assinatura_digital', operacao)
- Frontend: app/(dashboard)/assinatura-digital/**
