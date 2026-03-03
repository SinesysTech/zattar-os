## ADDED Requirements

### Requirement: Endpoint para listar pastas
O sistema SHALL expor `GET /api/mail/folders` que retorna a lista de pastas do mailbox com contagem de mensagens.

#### Scenario: Listar pastas com sucesso
- **WHEN** o cliente faz GET /api/mail/folders
- **THEN** o sistema retorna JSON com array de pastas: `{ folders: [{ name, path, total, unread }] }`

#### Scenario: Erro de autenticação IMAP
- **WHEN** as credenciais IMAP são inválidas
- **THEN** o sistema retorna HTTP 401 com mensagem de erro

### Requirement: Endpoint para listar mensagens
O sistema SHALL expor `GET /api/mail/messages` com query params `folder` (obrigatório), `page` (default 1), `limit` (default 50) para listar mensagens de uma pasta.

#### Scenario: Listar mensagens da inbox
- **WHEN** o cliente faz GET /api/mail/messages?folder=INBOX&page=1&limit=50
- **THEN** o sistema retorna JSON: `{ messages: [...], total, page, limit, hasMore }`

#### Scenario: Parâmetro folder ausente
- **WHEN** o cliente faz GET /api/mail/messages sem o parâmetro folder
- **THEN** o sistema retorna HTTP 400 com mensagem indicando que folder é obrigatório

### Requirement: Endpoint para ler mensagem individual
O sistema SHALL expor `GET /api/mail/messages/[uid]` com query param `folder` (obrigatório) para retornar o conteúdo completo de uma mensagem.

#### Scenario: Ler mensagem existente
- **WHEN** o cliente faz GET /api/mail/messages/123?folder=INBOX
- **THEN** o sistema retorna JSON com o conteúdo completo da mensagem incluindo headers, body, flags

#### Scenario: Mensagem não encontrada
- **WHEN** o UID não existe na pasta
- **THEN** o sistema retorna HTTP 404

### Requirement: Endpoint para enviar email
O sistema SHALL expor `POST /api/mail/messages/send` que aceita JSON body com `to`, `cc`, `bcc`, `subject`, `text` e envia via SMTP.

#### Scenario: Enviar email com sucesso
- **WHEN** o cliente faz POST /api/mail/messages/send com body válido
- **THEN** o sistema envia o email via SMTP, salva cópia no Sent, e retorna HTTP 200

#### Scenario: Campos obrigatórios ausentes
- **WHEN** o body não contém `to` ou `subject`
- **THEN** o sistema retorna HTTP 400 com validação dos campos

### Requirement: Endpoint para responder email
O sistema SHALL expor `POST /api/mail/messages/reply` que aceita `uid`, `folder`, `text`, `replyAll` (boolean) e envia a resposta.

#### Scenario: Responder com sucesso
- **WHEN** o cliente faz POST /api/mail/messages/reply com uid, folder e text válidos
- **THEN** o sistema busca o email original, monta a resposta com headers corretos, envia via SMTP e retorna HTTP 200

### Requirement: Endpoint para encaminhar email
O sistema SHALL expor `POST /api/mail/messages/forward` que aceita `uid`, `folder`, `to`, `text` e encaminha o email.

#### Scenario: Encaminhar com sucesso
- **WHEN** o cliente faz POST /api/mail/messages/forward com dados válidos
- **THEN** o sistema busca o email original, monta o encaminhamento e envia via SMTP

### Requirement: Endpoint para gerenciar flags
O sistema SHALL expor `PATCH /api/mail/messages/[uid]/flags` que aceita `folder` e `flags` (objeto com flags a adicionar/remover).

#### Scenario: Marcar como lido
- **WHEN** o cliente faz PATCH /api/mail/messages/123/flags com `{ folder: "INBOX", add: ["\\Seen"] }`
- **THEN** a flag \Seen é adicionada e o sistema retorna HTTP 200

#### Scenario: Marcar como não lido
- **WHEN** o cliente faz PATCH /api/mail/messages/123/flags com `{ folder: "INBOX", remove: ["\\Seen"] }`
- **THEN** a flag \Seen é removida

### Requirement: Endpoint para mover mensagem
O sistema SHALL expor `POST /api/mail/messages/[uid]/move` que aceita `fromFolder` e `toFolder`.

#### Scenario: Mover para archive
- **WHEN** o cliente faz POST /api/mail/messages/123/move com `{ fromFolder: "INBOX", toFolder: "Archive" }`
- **THEN** a mensagem é movida e o sistema retorna HTTP 200

### Requirement: Endpoint para deletar mensagem
O sistema SHALL expor `DELETE /api/mail/messages/[uid]` que aceita `folder` como query param e move a mensagem para Trash.

#### Scenario: Deletar mensagem
- **WHEN** o cliente faz DELETE /api/mail/messages/123?folder=INBOX
- **THEN** a mensagem é movida para Trash e o sistema retorna HTTP 200

### Requirement: Endpoint para buscar mensagens
O sistema SHALL expor `GET /api/mail/messages/search` com query params `q` (termo de busca) e `folder` (opcional, default INBOX).

#### Scenario: Busca com resultados
- **WHEN** o cliente faz GET /api/mail/messages/search?q=reunião&folder=INBOX
- **THEN** o sistema retorna JSON com mensagens que contêm o termo

#### Scenario: Busca global (todas as pastas)
- **WHEN** o cliente faz GET /api/mail/messages/search?q=contrato sem folder
- **THEN** o sistema busca na INBOX por padrão e retorna resultados
