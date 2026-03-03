## Context

O sistema Zattar OS possui um frontend de e-mail completo em `src/app/app/mail/` baseado no template shadcn/ui Mail. O layout usa 3 painéis redimensionáveis (navegação, lista, visualização), Zustand para estado, e dados mock em `data.tsx`. O servidor Cloudron em `my.zattaradvogados.com` expõe IMAP (993/TLS) e SMTP (587/STARTTLS) com autenticação por email+senha da conta Cloudron. O webmail Roundcube bloqueia embedding via `X-Frame-Options: sameorigin`.

O frontend atual importa dados estáticos e não faz nenhuma chamada de API. Os imports de `mail.tsx` referenciam paths incorretos (`@/app/dashboard/(auth)/apps/mail/...`) que precisam ser corrigidos.

## Goals / Non-Goals

**Goals:**
- Conectar o frontend existente ao servidor IMAP da Cloudron para leitura real de emails
- Enviar emails via SMTP da Cloudron (compor, responder, encaminhar)
- Gerenciar pastas (Inbox, Sent, Drafts, Junk, Trash, Archive) via IMAP
- Operações de email: marcar lido/não lido, mover, deletar, buscar
- Gerenciar credenciais IMAP/SMTP de forma segura vinculadas ao usuário logado
- Manter a UX existente do frontend, apenas substituindo dados mock por reais

**Non-Goals:**
- Administração de mailboxes (criar/deletar contas) — isso é feito via Cloudron Dashboard
- Gerenciamento de filtros Sieve (regras de email)
- Suporte a POP3
- Cache local de emails ou sincronização offline
- Renderização de HTML complexo em emails (fase 1 será texto simples)
- Suporte a anexos (será adicionado em fase posterior)

## Decisions

### 1. API Routes no Next.js como camada intermediária (não Server Actions)

**Escolha:** API Routes (`src/app/api/mail/...`) em vez de Server Actions.

**Razão:** IMAP é um protocolo stateful baseado em conexão TCP persistente. API Routes permitem gerenciar o ciclo de vida da conexão IMAP de forma explícita. Server Actions são otimizadas para mutações rápidas, não para conexões de longa duração. Além disso, API Routes podem ser facilmente testadas com ferramentas como curl/Postman.

**Alternativa descartada:** Server Actions — não oferecem controle fino sobre conexão IMAP e misturariam lógica de protocolo com a camada de apresentação.

### 2. imapflow para IMAP + nodemailer para SMTP

**Escolha:** `imapflow` (cliente IMAP moderno, Promise-based, suporta IDLE) + `nodemailer` (padrão de mercado para SMTP em Node.js).

**Razão:** `imapflow` é mantido ativamente, suporta TLS nativo, tem API moderna com async/await, e gerencia codificação MIME automaticamente. `nodemailer` é o padrão da indústria para envio de emails em Node.js.

**Alternativa descartada:** `node-imap` — abandonado, API baseada em callbacks, sem suporte a TypeScript.

### 3. Credenciais do usuário via variáveis de ambiente (fase 1) com plano para per-user (fase 2)

**Escolha:** Fase 1 usa uma conta de serviço configurada via env vars (`IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`). Fase 2 adicionará credenciais per-user armazenadas de forma criptografada.

**Razão:** Permite validar toda a integração rapidamente sem precisar resolver o problema de armazenamento seguro de credenciais por usuário. A maioria dos advogados compartilha uma caixa de e-mail institucional.

**Alternativa descartada:** OAuth2/XOAUTH2 — Cloudron não suporta; exigiria configuração adicional no servidor.

### 4. Conexão IMAP sob demanda (não pool persistente)

**Escolha:** Abrir e fechar conexão IMAP a cada request da API Route.

**Razão:** No modelo serverless do Next.js (Vercel/Node.js), conexões persistentes são problemáticas — funções podem ser recicladas a qualquer momento. Conexão sob demanda é mais simples e confiável. A latência adicional (~200-500ms por conexão TLS) é aceitável para uso interno.

**Alternativa descartada:** Pool de conexões IMAP — complexidade desnecessária para o número esperado de usuários (~10-20 advogados).

### 5. Estrutura de endpoints REST

```
GET    /api/mail/folders              — listar pastas
GET    /api/mail/messages?folder=INBOX&page=1&limit=50  — listar emails de uma pasta
GET    /api/mail/messages/[uid]?folder=INBOX             — ler email individual
POST   /api/mail/messages/send        — enviar email
POST   /api/mail/messages/reply       — responder email
POST   /api/mail/messages/forward     — encaminhar email
PATCH  /api/mail/messages/[uid]/flags — marcar lido/não lido, flag
POST   /api/mail/messages/[uid]/move  — mover para outra pasta
DELETE /api/mail/messages/[uid]       — deletar (mover para Trash)
GET    /api/mail/messages/search?q=termo&folder=INBOX — buscar emails
```

### 6. Tipos TypeScript reais para substituir os mock

O tipo `Mail` atual é derivado do array mock. Será substituído por um tipo baseado na estrutura real do IMAP:

```typescript
type MailMessage = {
  uid: number;
  messageId: string;
  from: { name: string; address: string };
  to: { name: string; address: string }[];
  cc?: { name: string; address: string }[];
  subject: string;
  text: string;
  html?: string;
  date: string;
  flags: string[];  // \Seen, \Flagged, \Answered, etc.
  labels: string[];
  folder: string;
}
```

## Risks / Trade-offs

- **[Latência IMAP]** → Cada request abre nova conexão TLS (~200-500ms overhead). Mitigação: paginação adequada, carregamento lazy do corpo do email.
- **[Credenciais em env vars]** → Fase 1 usa conta única; se vazar, toda a caixa de email é exposta. Mitigação: env vars são acessíveis apenas no servidor; fase 2 adicionará credenciais per-user criptografadas.
- **[Sem cache]** → Cada listagem faz query IMAP. Mitigação: aceitável para ~10-20 usuários; cache pode ser adicionado futuramente com Redis.
- **[HTML rendering]** → Emails HTML podem conter scripts/estilos maliciosos. Mitigação: fase 1 mostra apenas texto; fase 2 usará sanitização (DOMPurify) para HTML.
- **[Sem anexos]** → Fase 1 não suporta download/upload de anexos. Mitigação: será adicionado em fase posterior.
- **[Imports quebrados no frontend]** → `mail.tsx` referencia `@/app/dashboard/(auth)/apps/mail/...` que é path incorreto. Mitigação: corrigir imports como parte das tasks.
