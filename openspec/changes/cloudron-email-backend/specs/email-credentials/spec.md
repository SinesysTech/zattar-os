## ADDED Requirements

### Requirement: Configuração de credenciais via variáveis de ambiente
O sistema SHALL ler credenciais IMAP e SMTP de variáveis de ambiente: `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

#### Scenario: Credenciais configuradas corretamente
- **WHEN** todas as variáveis de ambiente estão definidas
- **THEN** o sistema usa essas credenciais para conexões IMAP e SMTP

#### Scenario: Credenciais ausentes
- **WHEN** uma ou mais variáveis de ambiente obrigatórias não estão definidas
- **THEN** os endpoints de email retornam HTTP 503 com mensagem indicando que o serviço de email não está configurado

### Requirement: Credenciais não expostas ao cliente
As credenciais IMAP/SMTP MUST nunca ser retornadas em responses da API ou logadas em texto plain. Mensagens de erro de autenticação SHALL ser genéricas.

#### Scenario: Erro de autenticação
- **WHEN** as credenciais IMAP são inválidas
- **THEN** a API retorna "Falha na autenticação do serviço de email" sem expor usuário/senha

#### Scenario: Logs de erro
- **WHEN** ocorre um erro de conexão
- **THEN** o log do servidor contém o tipo de erro mas não as credenciais em texto plain

### Requirement: Validação de configuração na inicialização
O sistema SHALL validar a presença das variáveis de ambiente de email durante a inicialização e logar um warning se ausentes.

#### Scenario: Variáveis presentes
- **WHEN** o sistema inicia com todas as env vars de email configuradas
- **THEN** o log indica "Serviço de email configurado com sucesso"

#### Scenario: Variáveis ausentes
- **WHEN** o sistema inicia sem as env vars de email
- **THEN** o log indica warning "Serviço de email não configurado - endpoints de email desabilitados"
