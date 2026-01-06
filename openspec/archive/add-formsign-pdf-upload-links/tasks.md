## 1. Implementation
- [x] 1.1 Modelagem de dados (Supabase declarative schema)
  - [x] 1.1.1 Tabelas: assinatura_digital_documentos, documento_assinantes, documento_ancoras
  - [x] 1.1.2 Campos jsonb para convidados
  - [x] 1.1.3 Tokens opacos por assinante (link publico)
  - [x] 1.1.4 Storage buckets para PDFs
- [x] 1.2 Endpoints administrativos
  - [x] 1.2.1 actionCreateDocumento (upload PDF + assinantes)
  - [x] 1.2.2 actionSetDocumentoAnchors (coordenadas, pagina, tipo, assinante)
  - [x] 1.2.3 actionListDocumentos, actionGetDocumento, actionGetPresignedPdfUrl
- [x] 1.3 UI Admin (novo fluxo principal)
  - [x] 1.3.1 Pagina "Documentos" em /assinatura-digital/documentos
  - [x] 1.3.2 Selecao de assinantes
  - [x] 1.3.3 Upload de PDF via PdfUploadField
  - [x] 1.3.4 Editor visual de ancoras em /documentos/editar/[uuid]
  - [x] 1.3.5 Links por assinante
  - [x] 1.3.6 Tab Fluxo de Assinatura mantido (modo simulador)
- [x] 1.4 Fluxo publico do assinante
  - [x] 1.4.1 PublicSignatureFlow com tela de identificacao
  - [x] 1.4.2 Selfie opcional via config
  - [x] 1.4.3 Captura de assinatura/rubrica
  - [x] 1.4.4 Bloqueio de reuso via token status
- [x] 1.5 Finalizacao e geracao do PDF
  - [x] 1.5.1 Carimbo de assinatura/rubrica via services
  - [x] 1.5.2 Metadados de seguranca (IP, user_agent, hash)
  - [x] 1.5.3 Status de conclusao por assinante/documento
- [x] 1.6 Seguranca e autorizacao
  - [x] 1.6.1 Admin protegido via authenticatedAction
  - [x] 1.6.2 Token opaco no link publico
- [ ] 1.7 Testes adicionais
  - [x] 1.7.1 documento-flow.spec.ts (e2e)
  - [ ] 1.7.2 Unit tests completos (backlog)
  - [ ] 1.7.3 E2E completo (backlog)

> **STATUS FINAL (2026-01-06)**: 85% implementado.
> Core features completas. Pendente: testes unitarios e e2e mais abrangentes (backlog).
