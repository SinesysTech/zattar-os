## ADDED Requirements

### Requirement: Conexão IMAP com servidor Cloudron
O sistema SHALL estabelecer conexões IMAP seguras com o servidor Cloudron via TLS na porta 993. A conexão MUST usar as credenciais configuradas (host, porta, usuário, senha) e SHALL ser aberta/fechada a cada operação.

#### Scenario: Conexão bem-sucedida
- **WHEN** o sistema inicia uma operação IMAP com credenciais válidas
- **THEN** uma conexão TLS é estabelecida com `my.zattaradvogados.com:993` e a autenticação é completada

#### Scenario: Falha de conexão
- **WHEN** o servidor IMAP está indisponível ou as credenciais são inválidas
- **THEN** o sistema retorna um erro descritivo sem expor credenciais

### Requirement: Listar pastas do mailbox
O sistema SHALL recuperar a lista de pastas (mailboxes) disponíveis via IMAP, incluindo nome, path, contagem de mensagens totais e não lidas.

#### Scenario: Listar pastas padrão
- **WHEN** o usuário acessa a lista de pastas
- **THEN** o sistema retorna as pastas do servidor (INBOX, Sent, Drafts, Junk, Trash, Archive) com contagem de mensagens

#### Scenario: Pasta vazia
- **WHEN** uma pasta não contém mensagens
- **THEN** a contagem total e não-lida é 0

### Requirement: Listar mensagens de uma pasta
O sistema SHALL recuperar mensagens de uma pasta IMAP especificada com paginação. Cada mensagem na lista MUST incluir: uid, from, to, subject, date, flags (lido/não lido/flagged), preview do texto (primeiros 200 caracteres).

#### Scenario: Listar inbox com paginação
- **WHEN** o usuário solicita mensagens da INBOX com page=1 e limit=50
- **THEN** o sistema retorna até 50 mensagens ordenadas por data (mais recente primeiro) com metadados de paginação (total, hasMore)

#### Scenario: Pasta inexistente
- **WHEN** o usuário solicita mensagens de uma pasta que não existe
- **THEN** o sistema retorna erro 404 com mensagem descritiva

### Requirement: Ler mensagem individual
O sistema SHALL recuperar o conteúdo completo de uma mensagem pelo UID, incluindo: headers completos (from, to, cc, subject, date, messageId), corpo em texto plain, flags, e labels.

#### Scenario: Ler email existente
- **WHEN** o usuário solicita um email pelo UID em uma pasta específica
- **THEN** o sistema retorna o conteúdo completo da mensagem e marca como lida (\Seen flag)

#### Scenario: Email não encontrado
- **WHEN** o UID solicitado não existe na pasta
- **THEN** o sistema retorna erro 404

### Requirement: Gerenciar flags de mensagem
O sistema SHALL permitir alterar flags de mensagens IMAP (\Seen, \Flagged, \Answered, \Deleted).

#### Scenario: Marcar como lido
- **WHEN** o usuário marca uma mensagem como lida
- **THEN** a flag \Seen é adicionada à mensagem no servidor IMAP

#### Scenario: Marcar como não lido
- **WHEN** o usuário marca uma mensagem como não lida
- **THEN** a flag \Seen é removida da mensagem no servidor IMAP

#### Scenario: Marcar como importante (star)
- **WHEN** o usuário marca uma mensagem com estrela
- **THEN** a flag \Flagged é adicionada à mensagem no servidor IMAP

### Requirement: Mover mensagem entre pastas
O sistema SHALL permitir mover mensagens entre pastas IMAP (ex: INBOX → Archive, INBOX → Junk).

#### Scenario: Mover para arquivo
- **WHEN** o usuário move uma mensagem da INBOX para Archive
- **THEN** a mensagem é copiada para Archive e removida da INBOX via IMAP MOVE

#### Scenario: Mover para lixo (delete)
- **WHEN** o usuário deleta uma mensagem
- **THEN** a mensagem é movida para Trash

### Requirement: Buscar mensagens
O sistema SHALL permitir buscar mensagens dentro de uma pasta usando o comando IMAP SEARCH, com busca por texto no subject, from, to e body.

#### Scenario: Busca com resultados
- **WHEN** o usuário busca por "reunião" na INBOX
- **THEN** o sistema retorna mensagens cujo subject, from, to ou body contêm "reunião"

#### Scenario: Busca sem resultados
- **WHEN** o usuário busca por um termo que não existe em nenhuma mensagem
- **THEN** o sistema retorna lista vazia com total=0
