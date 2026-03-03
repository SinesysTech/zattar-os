## ADDED Requirements

### Requirement: Conexão SMTP com servidor Cloudron
O sistema SHALL estabelecer conexões SMTP seguras com o servidor Cloudron via STARTTLS na porta 587 para envio de emails.

#### Scenario: Conexão SMTP bem-sucedida
- **WHEN** o sistema precisa enviar um email
- **THEN** uma conexão SMTP é estabelecida com `my.zattaradvogados.com:587` usando STARTTLS e autenticação por credenciais configuradas

#### Scenario: Falha de conexão SMTP
- **WHEN** o servidor SMTP está indisponível
- **THEN** o sistema retorna erro descritivo ao cliente

### Requirement: Enviar novo email
O sistema SHALL permitir compor e enviar emails com campos: to (obrigatório), cc (opcional), bcc (opcional), subject (obrigatório), body em texto plain (obrigatório).

#### Scenario: Envio bem-sucedido
- **WHEN** o usuário envia um email com destinatário, assunto e corpo válidos
- **THEN** o email é enviado via SMTP e uma cópia é salva na pasta Sent via IMAP APPEND

#### Scenario: Envio com CC e BCC
- **WHEN** o usuário envia um email com CC e BCC preenchidos
- **THEN** o email é enviado a todos os destinatários e CC/BCC são tratados corretamente

#### Scenario: Destinatário inválido
- **WHEN** o endereço de email do destinatário é inválido
- **THEN** o sistema retorna erro de validação antes de tentar o envio

### Requirement: Responder email
O sistema SHALL permitir responder a um email existente, incluindo automaticamente o header In-Reply-To, References, e o prefixo "Re:" no subject.

#### Scenario: Responder email
- **WHEN** o usuário responde a um email
- **THEN** o sistema envia a resposta com In-Reply-To apontando para o Message-ID original, o subject com prefixo "Re:", e o corpo com citação do email original

#### Scenario: Responder a todos
- **WHEN** o usuário usa "Reply All"
- **THEN** o sistema inclui o remetente original e todos os destinatários CC como destinatários da resposta

### Requirement: Encaminhar email
O sistema SHALL permitir encaminhar um email existente para novos destinatários, incluindo o prefixo "Fwd:" no subject e o conteúdo original citado.

#### Scenario: Encaminhar email
- **WHEN** o usuário encaminha um email para um novo destinatário
- **THEN** o sistema envia o email com prefixo "Fwd:" no subject e o conteúdo original citado no corpo
