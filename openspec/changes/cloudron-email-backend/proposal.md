## Why

O sistema já possui um frontend completo de e-mail em `src/app/app/mail/` (layout 3 painéis, lista de emails, visualização, navegação por pastas, account switcher, ações de archive/delete/reply), mas funciona inteiramente com dados mock. Os advogados precisam acessar e gerenciar seus e-mails diretamente dentro do sistema, sem alternar para o Roundcube em outra aba. O servidor Cloudron já fornece IMAP/SMTP — falta apenas a camada de backend que conecta o frontend existente ao servidor de e-mail.

## What Changes

- Adicionar API Routes no Next.js para comunicação IMAP (leitura) e SMTP (envio) com o servidor Cloudron
- Criar endpoints para: listar emails por pasta, ler email individual, enviar email, responder/encaminhar, mover entre pastas, marcar como lido/não lido, deletar, buscar emails
- Substituir os dados mock de `data.tsx` por chamadas reais às API Routes
- Adaptar o frontend para consumir dados reais (tipos, loading states, error handling)
- Gerenciar credenciais IMAP/SMTP do usuário logado de forma segura (credenciais Cloudron)
- Adicionar dependências: `imapflow` (cliente IMAP moderno) e `nodemailer` (envio SMTP)

## Capabilities

### New Capabilities
- `email-imap-client`: Conexão IMAP com o servidor Cloudron para leitura de emails, listagem de pastas, gerenciamento de flags (lido/não lido), movimentação entre pastas e busca
- `email-smtp-client`: Envio de emails via SMTP (compor, responder, encaminhar) através do servidor Cloudron
- `email-api-routes`: API Routes do Next.js que expõem as operações de email como endpoints REST para o frontend consumir
- `email-credentials`: Gerenciamento seguro das credenciais IMAP/SMTP do usuário, vinculadas à autenticação existente do sistema

### Modified Capabilities
_(nenhuma capability existente é modificada)_

## Impact

- **Código**: `src/app/app/mail/` (frontend existente adaptado), `src/app/api/mail/` (novos endpoints)
- **APIs**: Novos endpoints REST em `/api/mail/*` (folders, messages, send, move, search)
- **Dependências**: `imapflow`, `nodemailer` (novas)
- **Infraestrutura**: Conexão de rede com `my.zattaradvogados.com` nas portas 993 (IMAP/TLS) e 587 (SMTP/STARTTLS)
- **Segurança**: Credenciais de email do usuário precisam ser armazenadas/transmitidas de forma segura; considerar criptografia em repouso
