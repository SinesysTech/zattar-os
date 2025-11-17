# Capability: Autenticação Frontend

## Purpose
Sistema de autenticação frontend completo integrado com Supabase Auth. Fornece fluxos de login, cadastro, recuperação de senha, atualização de senha e confirmação de email. Todos os textos em português, com tratamento de erros robusto e redirecionamentos apropriados.

## Requirements

### Requirement: Fluxo de Login
O sistema MUST fornecer interface de login com autenticação via Supabase Auth.

#### Scenario: Login com credenciais válidas
- **WHEN** usuário fornece email e senha corretos
- **THEN** o sistema deve autenticar via Supabase Auth
- **AND** criar sessão de usuário
- **AND** redirecionar para /dashboard
- **AND** armazenar token de sessão

#### Scenario: Login com credenciais inválidas
- **WHEN** usuário fornece email ou senha incorretos
- **THEN** o sistema deve exibir mensagem de erro em português
- **AND** mensagem deve ser: "Email ou senha inválidos"
- **AND** não revelar qual campo está incorreto (segurança)

#### Scenario: Login com campos vazios
- **WHEN** usuário tenta fazer login sem preencher campos
- **THEN** o sistema deve validar campos obrigatórios
- **AND** exibir mensagens de erro apropriadas
- **AND** não enviar requisição ao servidor

#### Scenario: Persistência de sessão
- **WHEN** login é bem-sucedido
- **THEN** sessão deve persistir entre recarregamentos da página
- **AND** usuário deve permanecer logado até fazer logout

#### Scenario: Redirecionamento após login
- **WHEN** usuário acessa página protegida sem autenticação
- **THEN** deve ser redirecionado para /auth/login
- **AND** após login bem-sucedido, retornar à página original

### Requirement: Fluxo de Cadastro (Sign Up)
O sistema MUST permitir cadastro de novos usuários.

#### Scenario: Cadastro com dados válidos
- **WHEN** usuário fornece email e senha válidos
- **THEN** o sistema deve criar conta no Supabase Auth
- **AND** enviar email de confirmação
- **AND** exibir mensagem: "Verifique seu email para confirmar o cadastro"
- **AND** não fazer login automático (aguardar confirmação)

#### Scenario: Cadastro com email já existente
- **WHEN** usuário tenta cadastrar com email já registrado
- **THEN** o sistema deve exibir erro: "Email já cadastrado"
- **AND** sugerir login ou recuperação de senha

#### Scenario: Cadastro com senha fraca
- **WHEN** usuário fornece senha que não atende requisitos mínimos
- **THEN** o sistema deve validar senha
- **AND** exibir requisitos: "Senha deve ter no mínimo 6 caracteres"
- **AND** não permitir cadastro

#### Scenario: Validação de email
- **WHEN** usuário fornece email em formato inválido
- **THEN** o sistema deve validar formato
- **AND** exibir erro: "Email inválido"

#### Scenario: Link para login
- **WHEN** usuário já possui conta
- **THEN** interface deve exibir link "Já tem conta? Faça login"
- **AND** redirecionar para página de login

### Requirement: Confirmação de Email
O sistema MUST processar confirmação de email após cadastro.

#### Scenario: Acesso via link de confirmação
- **WHEN** usuário clica no link de confirmação do email
- **THEN** o sistema deve validar token via route handler /auth/confirm
- **AND** ativar conta do usuário
- **AND** redirecionar para /dashboard com mensagem de sucesso

#### Scenario: Token de confirmação inválido
- **WHEN** token de confirmação é inválido ou expirado
- **THEN** o sistema deve exibir erro apropriado
- **AND** oferecer opção de reenviar email

#### Scenario: Conta já confirmada
- **WHEN** usuário tenta confirmar email já confirmado
- **THEN** sistema deve redirecionar para login
- **AND** informar que conta já está ativa

### Requirement: Recuperação de Senha
O sistema MUST permitir recuperação de senha esquecida.

#### Scenario: Solicitação de recuperação com email válido
- **WHEN** usuário fornece email cadastrado
- **THEN** o sistema deve enviar email de recuperação
- **AND** exibir mensagem: "Email de recuperação enviado. Verifique sua caixa de entrada"
- **AND** não revelar se email existe (segurança)

#### Scenario: Email não cadastrado
- **WHEN** usuário fornece email não registrado
- **THEN** sistema deve exibir mesma mensagem de sucesso
- **AND** não revelar que email não existe (evitar enumeração)

#### Scenario: Link para login
- **WHEN** usuário lembra a senha
- **THEN** interface deve exibir link "Lembrou a senha? Faça login"
- **AND** redirecionar para página de login

#### Scenario: Rate limiting
- **WHEN** múltiplas solicitações são feitas em curto período
- **THEN** sistema deve limitar requisições
- **AND** exibir mensagem de aguardo apropriada

### Requirement: Atualização de Senha
O sistema MUST permitir atualização de senha via link de recuperação.

#### Scenario: Acesso via link de recuperação
- **WHEN** usuário clica no link de recuperação do email
- **THEN** sistema deve redirecionar para /auth/update-password
- **AND** validar token de recuperação
- **AND** exibir formulário de nova senha

#### Scenario: Definição de nova senha válida
- **WHEN** usuário fornece nova senha válida
- **THEN** sistema deve atualizar senha no Supabase Auth
- **AND** invalidar token de recuperação
- **AND** redirecionar para login com mensagem de sucesso
- **AND** exibir: "Senha atualizada com sucesso. Faça login com sua nova senha"

#### Scenario: Nova senha fraca
- **WHEN** nova senha não atende requisitos mínimos
- **THEN** sistema deve validar e rejeitar
- **AND** exibir requisitos de senha

#### Scenario: Token de recuperação expirado
- **WHEN** token de recuperação está expirado
- **THEN** sistema deve exibir erro apropriado
- **AND** oferecer nova solicitação de recuperação

#### Scenario: Confirmação de senha
- **WHEN** formulário exige confirmação de senha
- **THEN** sistema deve validar que senhas correspondem
- **AND** exibir erro se não corresponderem: "As senhas não correspondem"

### Requirement: Logout
O sistema MUST permitir logout com encerramento de sessão.

#### Scenario: Logout bem-sucedido
- **WHEN** usuário solicita logout
- **THEN** sistema deve encerrar sessão no Supabase Auth
- **AND** limpar tokens armazenados
- **AND** redirecionar para /auth/login
- **AND** impedir acesso a páginas protegidas

#### Scenario: Logout em múltiplas abas
- **WHEN** logout é realizado em uma aba
- **THEN** outras abas devem detectar perda de sessão
- **AND** redirecionar para login se tentarem acessar recursos protegidos

### Requirement: Interface em Português
Toda interface de autenticação MUST estar em português brasileiro.

#### Scenario: Labels e placeholders
- **WHEN** formulários são exibidos
- **THEN** todos os labels devem estar em português
- **AND** exemplos: "Email", "Senha", "Confirmar senha"

#### Scenario: Botões
- **WHEN** botões são exibidos
- **THEN** textos devem estar em português
- **AND** exemplos: "Entrar", "Cadastrar", "Enviar", "Redefinir senha"

#### Scenario: Mensagens de erro
- **WHEN** erros ocorrem
- **THEN** mensagens devem estar em português claro
- **AND** ser descritivas e úteis

#### Scenario: Mensagens de sucesso
- **WHEN** operações são bem-sucedidas
- **THEN** feedbacks devem estar em português
- **AND** confirmar ação realizada

### Requirement: Tratamento de Erros
O sistema MUST tratar todos os erros de autenticação de forma apropriada.

#### Scenario: Erro de rede
- **WHEN** requisição falha por erro de rede
- **THEN** sistema deve exibir: "Erro de conexão. Verifique sua internet e tente novamente"
- **AND** permitir nova tentativa

#### Scenario: Erro do servidor
- **WHEN** Supabase retorna erro 500
- **THEN** sistema deve exibir: "Erro no servidor. Tente novamente em alguns instantes"
- **AND** não expor detalhes técnicos

#### Scenario: Timeout
- **WHEN** requisição excede tempo limite
- **THEN** sistema deve exibir erro de timeout
- **AND** permitir nova tentativa

#### Scenario: Erro desconhecido
- **WHEN** erro não mapeado ocorre
- **THEN** sistema deve exibir mensagem genérica apropriada
- **AND** logar erro para diagnóstico

### Requirement: Validação Client-Side
O sistema MUST validar dados no cliente antes de enviar ao servidor.

#### Scenario: Validação de email em tempo real
- **WHEN** usuário digita email
- **THEN** sistema deve validar formato em blur
- **AND** exibir erro imediatamente se inválido

#### Scenario: Validação de senha em tempo real
- **WHEN** usuário digita senha
- **THEN** sistema deve verificar requisitos mínimos
- **AND** exibir indicadores de força (opcional)

#### Scenario: Desabilitar botão durante submissão
- **WHEN** formulário é enviado
- **THEN** botão de submit deve ser desabilitado
- **AND** exibir loading indicator
- **AND** prevenir múltiplas submissões

### Requirement: Redirecionamentos
O sistema MUST gerenciar redirecionamentos apropriadamente.

#### Scenario: Usuário autenticado acessa página de login
- **WHEN** usuário logado tenta acessar /auth/login
- **THEN** sistema deve redirecionar para /dashboard

#### Scenario: Usuário não autenticado acessa rota protegida
- **WHEN** usuário sem sessão tenta acessar /dashboard
- **THEN** sistema deve redirecionar para /auth/login
- **AND** preservar URL de destino para retorno após login

#### Scenario: Redirecionamento após ação
- **WHEN** ação de autenticação é concluída
- **THEN** sistema deve redirecionar para rota apropriada
- **AND** usar método de redirecionamento do Next.js (router.push)

### Requirement: Segurança
O sistema MUST implementar práticas de segurança em autenticação.

#### Scenario: Proteção contra CSRF
- **WHEN** requisições de autenticação são feitas
- **THEN** sistema deve usar tokens CSRF do Supabase
- **AND** validar origem das requisições

#### Scenario: HTTPOnly cookies
- **WHEN** sessão é criada
- **THEN** cookies devem ser HTTPOnly
- **AND** não acessíveis via JavaScript

#### Scenario: Senhas nunca expostas
- **WHEN** formulários são manipulados
- **THEN** senhas devem estar em inputs type="password"
- **AND** nunca logadas ou expostas no client

#### Scenario: Rate limiting
- **WHEN** múltiplas tentativas de login falham
- **THEN** sistema deve implementar backoff progressivo
- **OR** confiar em rate limiting do Supabase

### Requirement: Acessibilidade
Os formulários de autenticação MUST ser acessíveis.

#### Scenario: Labels associados
- **WHEN** campos de formulário são renderizados
- **THEN** cada input deve ter label associado via htmlFor
- **AND** ser acessível por leitores de tela

#### Scenario: Mensagens de erro acessíveis
- **WHEN** erros são exibidos
- **THEN** devem ser anunciados por leitores de tela
- **AND** usar aria-live ou similar

#### Scenario: Navegação por teclado
- **WHEN** usuário navega por teclado
- **THEN** foco deve ser visível e lógico
- **AND** permitir submit com Enter

### Requirement: Responsividade
As páginas de autenticação MUST ser responsivas.

#### Scenario: Mobile
- **WHEN** acessado em dispositivos móveis
- **THEN** layout deve adaptar para telas pequenas
- **AND** botões e inputs devem ter tamanho adequado para toque

#### Scenario: Tablet e Desktop
- **WHEN** acessado em telas maiores
- **THEN** formulário deve estar centralizado
- **AND** manter largura máxima confortável para leitura

### Requirement: Integração com Supabase SSR
O sistema MUST usar Supabase SSR para Next.js App Router.

#### Scenario: Client components
- **WHEN** componentes de autenticação são renderizados
- **THEN** devem usar createBrowserClient do @supabase/ssr
- **AND** gerenciar sessão no cliente

#### Scenario: Server components e actions
- **WHEN** autenticação ocorre no servidor
- **THEN** devem usar createServerClient
- **AND** gerenciar cookies via cookieStore

#### Scenario: Middleware
- **WHEN** requisições passam por middleware
- **THEN** deve validar sessão antes de permitir acesso
- **AND** redirecionar conforme necessário

### Requirement: Feedback Visual
O sistema MUST fornecer feedback visual claro para todas as ações.

#### Scenario: Loading states
- **WHEN** operação assíncrona está em andamento
- **THEN** exibir indicador de carregamento
- **AND** desabilitar interações

#### Scenario: Success feedback
- **WHEN** operação é bem-sucedida
- **THEN** exibir mensagem de sucesso temporária
- **OR** redirecionar com feedback

#### Scenario: Error feedback
- **WHEN** erro ocorre
- **THEN** exibir mensagem de erro destacada
- **AND** manter até usuário interagir novamente
