## 1. Implementacao
- [x] 1.1 Integrar storage Backblaze B2 para PDFs/assinaturas/fotos
- [x] 1.2 Implementar servico de sessoes/assinaturas (Supabase) com validações de payload
- [x] 1.3 Implementar preview de PDF (gera e retorna URL) usando storage
- [x] 1.4 Implementar finalizacao de assinatura (gera PDF final, persiste)
- [x] 1.5 Expor rotas protegidas (preview, finalizar, listar sessoes/assinaturas)
- [ ] 1.6 Testar fluxos principais (preview, finalizar, listagens) e ajustes

## Notas de Implementacao
- Storage: backend/assinatura-digital/services/storage.service.ts (Backblaze B2)
- Signature: backend/assinatura-digital/services/signature.service.ts
- PDF: backend/assinatura-digital/services/template-pdf.service.ts
- APIs: /api/assinatura-digital/signature/{preview,finalizar,sessoes}
- Upload de templates: /api/assinatura-digital/templates/upload (Backblaze B2)
