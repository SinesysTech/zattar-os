## 1. Setup e Dependências

- [x] 1.1 Instalar dependências: `imapflow` e `nodemailer` com tipos TypeScript
- [x] 1.2 Adicionar variáveis de ambiente ao `.env.local`: `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- [x] 1.3 Criar módulo de configuração de email (`src/lib/mail/config.ts`) que lê e valida env vars

## 2. Cliente IMAP

- [x] 2.1 Criar helper de conexão IMAP (`src/lib/mail/imap-client.ts`) com função `withImapConnection` que abre, executa operação, e fecha conexão
- [x] 2.2 Implementar função `listFolders()` que retorna pastas com contagem de mensagens
- [x] 2.3 Implementar função `listMessages(folder, page, limit)` com paginação e metadados do envelope
- [x] 2.4 Implementar função `getMessage(folder, uid)` que retorna conteúdo completo da mensagem
- [x] 2.5 Implementar função `updateFlags(folder, uid, add[], remove[])` para gerenciar flags
- [x] 2.6 Implementar função `moveMessage(folder, uid, toFolder)` para mover mensagens
- [x] 2.7 Implementar função `searchMessages(folder, query)` usando IMAP SEARCH

## 3. Cliente SMTP

- [x] 3.1 Criar helper de envio SMTP (`src/lib/mail/smtp-client.ts`) usando nodemailer
- [x] 3.2 Implementar função `sendEmail(to, cc, bcc, subject, text)` com validação
- [x] 3.3 Implementar função `replyToEmail(originalMessage, text, replyAll)` com headers In-Reply-To/References
- [x] 3.4 Implementar função `forwardEmail(originalMessage, to, text)` com corpo original citado
- [x] 3.5 Integrar salvamento de cópia no Sent via IMAP APPEND após envio

## 4. API Routes

- [x] 4.1 Criar `src/app/api/mail/folders/route.ts` — GET para listar pastas
- [x] 4.2 Criar `src/app/api/mail/messages/route.ts` — GET para listar mensagens com query params
- [x] 4.3 Criar `src/app/api/mail/messages/[uid]/route.ts` — GET para ler mensagem individual
- [x] 4.4 Criar `src/app/api/mail/messages/send/route.ts` — POST para enviar email
- [x] 4.5 Criar `src/app/api/mail/messages/reply/route.ts` — POST para responder email
- [x] 4.6 Criar `src/app/api/mail/messages/forward/route.ts` — POST para encaminhar email
- [x] 4.7 Criar `src/app/api/mail/messages/[uid]/flags/route.ts` — PATCH para gerenciar flags
- [x] 4.8 Criar `src/app/api/mail/messages/[uid]/move/route.ts` — POST para mover mensagem
- [x] 4.9 Criar `src/app/api/mail/messages/[uid]/route.ts` — DELETE para deletar mensagem
- [x] 4.10 Criar `src/app/api/mail/messages/search/route.ts` — GET para buscar mensagens

## 5. Tipos TypeScript

- [x] 5.1 Criar tipos compartilhados (`src/lib/mail/types.ts`): `MailMessage`, `MailFolder`, `MailAddress`, `SendEmailRequest`, `ReplyRequest`, `ForwardRequest`
- [x] 5.2 Substituir o tipo `Mail` de `data.tsx` por `MailMessage` no frontend

## 6. Integração Frontend

- [x] 6.1 Corrigir imports quebrados em `mail.tsx` (paths `@/app/dashboard/(auth)/apps/mail/...` → `./...`)
- [x] 6.2 Expandir Zustand store (`use-mail.ts`) com: selectedFolder, messages, folders, loading states, error states
- [x] 6.3 Criar hooks de data fetching (`src/app/app/mail/hooks/use-mail-api.ts`) para chamadas às API Routes
- [x] 6.4 Atualizar `page.tsx` para buscar dados reais via API em vez de importar mock
- [x] 6.5 Atualizar `mail.tsx` para usar dados do store/hooks em vez de props estáticas
- [x] 6.6 Atualizar `mail-list.tsx` para renderizar dados reais com loading/error states
- [x] 6.7 Atualizar `mail-display.tsx` e `mail-display-mobile.tsx` para funcionalidade real (reply, forward, delete, archive)
- [x] 6.8 Atualizar `nav-desktop.tsx` e `nav-mobile.tsx` para usar pastas reais com contagem dinâmica
- [x] 6.9 Implementar busca funcional no campo de search existente
- [x] 6.10 Remover `data.tsx` (dados mock) após integração completa

## 7. Tratamento de Erros e UX

- [x] 7.1 Adicionar loading skeletons durante fetch de emails
- [x] 7.2 Adicionar estados de erro com opção de retry
- [x] 7.3 Adicionar toast notifications para ações (email enviado, movido, erro)
- [x] 7.4 Tratar estado de serviço não configurado (env vars ausentes) com mensagem amigável
