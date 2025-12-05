## 1. Implementacao
- [x] 1.1.1 Integrar storage Backblaze B2 para PDFs/assinaturas/fotos
- [ ] 1.1.2 Integrar n8n para envio de assinatura concluida ao sistema externo
- [x] 1.2 Implementar servico de sessoes/assinaturas (Supabase) com validações de payload
- [x] 1.3 Implementar preview de PDF (gera e retorna URL) usando storage
- [x] 1.4.1 Implementar finalizacao de assinatura (gera PDF final, persiste)
- [ ] 1.4.2 Enviar assinatura concluida ao sistema externo (n8n/webhook)
- [x] 1.5 Expor rotas protegidas (preview, finalizar, listar sessoes/assinaturas)
- [ ] 1.6 Testar fluxos principais (preview, finalizar, listagens) e ajustes

## Notas de Implementacao
- Storage: backend/assinatura-digital/services/storage.service.ts (Backblaze B2)
- Signature: backend/assinatura-digital/services/signature.service.ts
- PDF: backend/assinatura-digital/services/template-pdf.service.ts
- APIs: /api/assinatura-digital/signature/{preview,finalizar,sessoes}
- Flag enviado_sistema_externo existe mas webhook n8n nao implementado
