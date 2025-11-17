# Fluxo de Autenticação Múltipla

<cite>
**Arquivos Referenciados neste Documento**  
- [api-auth.ts](file://backend/utils/auth/api-auth.ts)
- [08_usuarios.sql](file://supabase/schemas/08_usuarios.sql)
- [service-client.ts](file://backend/utils/supabase/service-client.ts)
- [server.ts](file://backend/utils/supabase/server.ts)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts)
- [criar-usuario.service.ts](file://backend/usuarios/services/usuarios/criar-usuario.service.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Arquitetura de Autenticação Dual](#arquitetura-de-autenticação-dual)
3. [Fluxo de Autenticação por API Key](#fluxo-de-autenticação-por-api-key)
4. [Fluxo de Autenticação por Bearer Token](#fluxo-de-autenticação-por-bearer-token)
5. [Fluxo de Autenticação por Sessão](#fluxo-de-autenticação-por-sessão)
6. [Integração com a Tabela Usuários](#integração-com-a-tabela-usuários)
7. [Criação de Usuários e Atribuição de Perfis](#criação-de-usuários-e-atribuição-de-perfis)
8. [Exemplos de Requisições](#exemplos-de-requisições)
9. [Mensagens de Erro Padrão](#mensagens-de-erro-padrão)
10. [Estratégias de Logging](#estratégias-de-logging)
11. [Boas Práticas de Segurança](#boas-práticas-de-segurança)
12. [Diagrama de Sequência](#diagrama-de-sequência)

## Introdução
O sistema sinesys implementa um fluxo de autenticação múltipla que combina três métodos distintos para atender diferentes cenários de uso: autenticação via API Key para integrações automatizadas, autenticação via Bearer Token (JWT do Supabase) para interfaces web e APIs externas, e autenticação via sessão do Supabase para aplicações front-end. Esta arquitetura dual permite uma flexibilidade significativa no acesso ao sistema, permitindo que tanto usuários humanos quanto sistemas externos possam interagir com a plataforma de maneira segura e eficiente. O fluxo de autenticação é implementado no arquivo `api-auth.ts` e integra-se com a tabela `usuarios` no banco de dados para gerenciar identidades e permissões.

**Seção fontes**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L1-L136)
- [08_usuarios.sql](file://supabase/schemas/08_usuarios.sql#L1-L74)

## Arquitetura de Autenticação Dual
A arquitetura dual de autenticação no sistema sinesys é implementada no arquivo `api-auth.ts`, que exporta a função `authenticateRequest` responsável por validar as credenciais de acesso. O sistema prioriza os métodos de autenticação em uma ordem específica: primeiro verifica a API Key de serviço, depois o Bearer Token e, finalmente, a sessão do Supabase. Esta hierarquia garante que operações automatizadas do sistema tenham prioridade sobre requisições de usuários. A autenticação é baseada em três componentes principais: o cliente de serviço do Supabase (`createServiceClient`) para operações administrativas, o cliente de servidor do Supabase (`createClient`) para autenticação baseada em cookies, e a validação direta da API Key através do cabeçalho HTTP `x-service-api-key`. A função retorna um objeto `AuthResult` que contém o status de autenticação, o ID do usuário no Supabase Auth, o ID do usuário na tabela `usuarios` e a fonte da autenticação.

```mermaid
graph TD
A[Requisição HTTP] --> B{Verificar API Key?}
B --> |Sim| C[Validar x-service-api-key]
C --> D{API Key Válida?}
D --> |Sim| E[Autenticação de Serviço]
D --> |Não| F{Verificar Bearer Token?}
B --> |Não| F
F --> |Sim| G[Validar Authorization: Bearer]
G --> H{Token Válido?}
H --> |Sim| I[Autenticação por Token]
H --> |Não| J{Verificar Sessão?}
F --> |Não| J
J --> |Sim| K[Validar Cookies de Sessão]
K --> L{Sessão Válida?}
L --> |Sim| M[Autenticação por Sessão]
L --> |Não| N[Falha na Autenticação]
E --> O[Retornar AuthResult]
I --> O
M --> O
N --> O
```

**Fontes do diagrama**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L49-L133)

**Seção fontes**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L1-L136)

## Fluxo de Autenticação por API Key
O fluxo de autenticação por API Key é projetado para integrações automatizadas e jobs do sistema, permitindo que serviços internos acessem a API sem a necessidade de autenticação de usuário. Este método utiliza o cabeçalho HTTP `x-service-api-key` para transmitir a chave de API, que é comparada com o valor esperado armazenado na variável de ambiente `SERVICE_API_KEY`. A comparação é feita de forma segura, utilizando uma comparação timing-safe para prevenir ataques de timing. Quando a API Key é válida, o sistema retorna um objeto `AuthResult` com `userId` definido como 'system' e `usuarioId` como `undefined`, indicando que a requisição foi feita por um serviço do sistema. Este método tem a prioridade mais alta no fluxo de autenticação, garantindo que operações críticas do sistema não sejam bloqueadas por falhas na autenticação de usuário.

```mermaid
sequenceDiagram
participant Cliente as "Sistema Externo"
participant API as "api-auth.ts"
participant Supabase as "Supabase Service Client"
Cliente->>API : Requisição com x-service-api-key
API->>API : Verificar existência da API Key
API->>API : Comparar com SERVICE_API_KEY
alt API Key Válida
API-->>API : Retornar AuthResult autenticado
API-->>Cliente : 200 OK
else API Key Inválida
API-->>Cliente : 401 Unauthorized
end
```

**Fontes do diagrama**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L53-L68)

**Seção fontes**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L53-L71)

## Fluxo de Autenticação por Bearer Token
O fluxo de autenticação por Bearer Token é utilizado para interfaces web e APIs externas, permitindo que aplicações front-end e clientes API acessem o sistema utilizando tokens JWT emitidos pelo Supabase Auth. Este método verifica o cabeçalho HTTP `Authorization` para um token no formato `Bearer <token>`, onde `<token>` é o JWT do Supabase. O token é validado utilizando o cliente de serviço do Supabase (`createServiceClient`), que verifica sua validade e extrai as informações do usuário. Após a validação do token, o sistema busca o ID correspondente na tabela `usuarios` utilizando a função `buscarUsuarioIdPorAuthUserId`, que consulta o campo `auth_user_id` para encontrar o registro do usuário. Este fluxo é essencial para aplicações que não utilizam cookies ou sessões tradicionais, como APIs RESTful e aplicações móveis.

```mermaid
sequenceDiagram
participant Cliente as "Aplicação Front-end"
participant API as "api-auth.ts"
participant Supabase as "Supabase Service Client"
Cliente->>API : Requisição com Authorization : Bearer <token>
API->>Supabase : getUser(token)
Supabase-->>API : Dados do usuário ou erro
alt Token Válido
API->>Supabase : Buscar usuarioId por auth_user_id
Supabase-->>API : ID do usuário
API-->>Cliente : 200 OK com AuthResult
else Token Inválido
API-->>Cliente : 401 Unauthorized
end
```

**Fontes do diagrama**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L74-L98)

**Seção fontes**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L74-L105)
- [service-client.ts](file://backend/utils/supabase/service-client.ts#L36-L49)

## Fluxo de Autenticação por Sessão
O fluxo de autenticação por sessão é utilizado para aplicações front-end tradicionais que dependem de cookies para manter o estado de autenticação. Este método verifica a presença de cookies de sessão do Supabase e utiliza o cliente de servidor (`createClient`) para validar a sessão atual. O cliente de servidor é configurado para acessar os cookies da requisição e comunicar-se com o Supabase Auth para verificar a validade da sessão. Após a validação bem-sucedida da sessão, o sistema extrai o ID do usuário do Supabase Auth e busca o ID correspondente na tabela `usuarios`, semelhante ao fluxo de Bearer Token. Este método é ideal para aplicações web completas que utilizam a autenticação tradicional baseada em sessão, proporcionando uma experiência de usuário contínua sem a necessidade de gerenciar tokens manualmente.

```mermaid
sequenceDiagram
participant Cliente as "Navegador Web"
participant API as "api-auth.ts"
participant Supabase as "Supabase Client"
Cliente->>API : Requisição com cookies de sessão
API->>Supabase : getUser() com cookies
Supabase-->>API : Dados do usuário ou erro
alt Sessão Válida
API->>Supabase : Buscar usuarioId por auth_user_id
Supabase-->>API : ID do usuário
API-->>Cliente : 200 OK com AuthResult
else Sessão Inválida
API-->>Cliente : 401 Unauthorized
end
```

**Fontes do diagrama**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L108-L126)

**Seção fontes**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L108-L133)
- [server.ts](file://backend/utils/supabase/server.ts#L3-L28)

## Integração com a Tabela Usuários
A integração com a tabela `usuarios` é fundamental para o funcionamento do sistema de autenticação múltipla, pois permite mapear a identidade do Supabase Auth (UUID) para um registro de usuário no sistema com um ID numérico. A tabela `usuarios` é definida no arquivo `08_usuarios.sql` e contém campos essenciais como `id`, `auth_user_id`, `nome_completo`, `cpf`, `email_corporativo` e `ativo`. O campo `auth_user_id` é uma chave estrangeira que referencia a tabela `auth.users` do Supabase, permitindo a ligação entre a autenticação e os dados do usuário. A função `buscarUsuarioIdPorAuthUserId` realiza esta consulta, retornando o ID do usuário na tabela `usuarios` quando encontrado. Esta integração permite que o sistema mantenha dados de perfil e permissões separados da autenticação, facilitando a gestão de usuários e a implementação de políticas de acesso.

```mermaid
erDiagram
auth.users {
uuid id PK
string email
string phone
jsonb raw_user_meta_data
timestamptz created_at
timestamptz updated_at
}
public.usuarios {
bigint id PK
uuid auth_user_id FK
text nome_completo
text cpf UK
text email_corporativo UK
boolean ativo
timestamptz created_at
timestamptz updated_at
}
auth.users ||--o{ public.usuarios : "auth_user_id"
```

**Fontes do diagrama**
- [08_usuarios.sql](file://supabase/schemas/08_usuarios.sql#L4-L33)
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L20-L38)

**Seção fontes**
- [08_usuarios.sql](file://supabase/schemas/08_usuarios.sql#L4-L74)
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L20-L38)

## Criação de Usuários e Atribuição de Perfis
O processo de criação de usuários é gerenciado pelo serviço `criar-usuario.service.ts`, que implementa a lógica de negócio para cadastrar novos usuários no sistema. Quando um novo usuário é criado, o sistema realiza validações rigorosas nos dados de entrada, incluindo validação de CPF, e-mails e campos obrigatórios. Após a validação, o registro é inserido na tabela `usuarios` com o campo `auth_user_id` opcional, que pode ser preenchido posteriormente quando o usuário se autenticar pela primeira vez. Os perfis são atribuídos no momento do cadastro através dos dados fornecidos, como `oab` e `uf_oab` para advogados, permitindo que o sistema determine as permissões e funcionalidades disponíveis para cada usuário. Este processo garante que todos os usuários sejam corretamente registrados no sistema antes de receberem acesso completo.

```mermaid
sequenceDiagram
participant Frontend as "Interface de Cadastro"
participant Service as "criar-usuario.service.ts"
participant Persistence as "usuario-persistence.service.ts"
participant Database as "Tabela usuarios"
Frontend->>Service : cadastrarUsuario(dados)
Service->>Service : Validar dados de entrada
Service->>Persistence : criarUsuario(dados)
Persistence->>Database : Inserir registro
Database-->>Persistence : Confirmação
Persistence-->>Service : Resultado da operação
Service-->>Frontend : Confirmação ou erro
```

**Fontes do diagrama**
- [criar-usuario.service.ts](file://backend/usuarios/services/usuarios/criar-usuario.service.ts#L19-L52)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts#L208-L311)

**Seção fontes**
- [criar-usuario.service.ts](file://backend/usuarios/services/usuarios/criar-usuario.service.ts#L1-L52)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts#L208-L311)

## Exemplos de Requisições
### Requisição HTTP Válida com API Key
```
POST /api/endpoint HTTP/1.1
Host: sinesys.example.com
x-service-api-key: chave-api-secreta-do-sistema
Content-Type: application/json

{"dados": "exemplo"}
```

### Requisição HTTP Válida com Bearer Token
```
GET /api/endpoint HTTP/1.1
Host: sinesys.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Requisição HTTP Válida com Sessão
```
GET /api/endpoint HTTP/1.1
Host: sinesys.example.com
Cookie: sb-access-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Requisição HTTP Inválida (API Key Incorreta)
```
POST /api/endpoint HTTP/1.1
Host: sinesys.example.com
x-service-api-key: chave-errada
Content-Type: application/json

{"dados": "exemplo"}
```

### Requisição HTTP Inválida (Token Expirado)
```
GET /api/endpoint HTTP/1.1
Host: sinesys.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...token-expirado
Content-Type: application/json
```

**Seção fontes**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L54-L67)
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L75-L85)

## Mensagens de Erro Padrão
O sistema implementa mensagens de erro padronizadas para diferentes cenários de falha na autenticação. Quando a API Key é inválida, o sistema retorna um objeto `AuthResult` com `authenticated: false` sem fornecer detalhes específicos sobre a falha, prevenindo ataques de enumeração. Para falhas no Bearer Token, o sistema registra o erro no console com detalhes técnicos, mas retorna apenas um status de falha ao cliente, mantendo a segurança. Erros na verificação da sessão também seguem este padrão, garantindo que informações sensíveis sobre a causa da falha não sejam expostas. Esta abordagem de segurança mínima de divulgação protege o sistema contra ataques que exploram mensagens de erro para obter informações sobre sua estrutura interna.

**Seção fontes**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L68-L70)
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L86-L88)
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L114-L116)

## Estratégias de Logging
O sistema implementa estratégias de logging detalhadas para monitorar o fluxo de autenticação e detectar atividades suspeitas. A função `cadastrarUsuario` no serviço de criação de usuários registra eventos de cadastro com informações mascaradas, como o CPF, para proteger dados sensíveis. Erros de autenticação são registrados no console com mensagens detalhadas, incluindo o tipo de erro e o contexto da requisição, mas sem expor informações que possam comprometer a segurança. O logging é essencial para auditoria e troubleshooting, permitindo que a equipe de operações identifique padrões de falha e potenciais tentativas de ataque. Os logs são estruturados para facilitar a análise e a correlação de eventos, contribuindo para a segurança geral do sistema.

**Seção fontes**
- [criar-usuario.service.ts](file://backend/usuarios/services/usuarios/criar-usuario.service.ts#L22-L26)
- [criar-usuario.service.ts](file://backend/usuarios/services/usuarios/criar-usuario.service.ts#L32-L36)
- [criar-usuario.service.ts](file://backend/usuarios/services/usuarios/criar-usuario.service.ts#L38-L39)

## Boas Práticas de Segurança
O sistema implementa várias boas práticas de segurança para proteger o fluxo de autenticação. A rotação de API Keys é facilitada pela configuração em variáveis de ambiente, permitindo atualizações rápidas sem alterações no código. A expiração de sessões é gerenciada pelo Supabase Auth, que implementa políticas de tempo de vida de token e renovação automática. O sistema protege contra ataques de força bruta através da validação rigorosa de credenciais e do registro de tentativas de autenticação falhas. A comparação de API Keys utiliza algoritmos timing-safe para prevenir ataques de timing, e os dados sensíveis são mascarados nos logs. Estas práticas combinadas criam uma camada robusta de segurança que protege tanto os usuários quanto o sistema contra ameaças comuns.

**Seção fontes**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L58-L59)
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L100-L104)
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L129-L132)

## Diagrama de Sequência
O diagrama de sequência a seguir mostra o fluxo completo de autenticação desde a requisição até a autorização, integrando todos os componentes do sistema.

```mermaid
sequenceDiagram
participant Cliente as "Cliente"
participant API as "api-auth.ts"
participant ServiceClient as "createServiceClient"
participant ServerClient as "createClient"
participant Database as "Tabela usuarios"
Cliente->>API : Requisição HTTP
API->>API : Verificar x-service-api-key
alt API Key Presente
API->>API : Validar com SERVICE_API_KEY
alt API Key Válida
API-->>Cliente : Autenticação de Serviço
else API Key Inválida
API->>API : Verificar Bearer Token
end
else
API->>API : Verificar Bearer Token
end
alt Bearer Token Presente
API->>ServiceClient : getUser(token)
ServiceClient-->>API : Dados do usuário
alt Token Válido
API->>Database : buscarUsuarioIdPorAuthUserId
Database-->>API : usuarioId
API-->>Cliente : Autenticação por Token
else Token Inválido
API->>API : Verificar Sessão
end
else
API->>API : Verificar Sessão
end
alt Sessão Presente
API->>ServerClient : getUser()
ServerClient-->>API : Dados do usuário
alt Sessão Válida
API->>Database : buscarUsuarioIdPorAuthUserId
Database-->>API : usuarioId
API-->>Cliente : Autenticação por Sessão
else Sessão Inválida
API-->>Cliente : Falha na Autenticação
end
else
API-->>Cliente : Falha na Autenticação
end
```

**Fontes do diagrama**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L49-L133)
- [service-client.ts](file://backend/utils/supabase/service-client.ts#L36-L49)
- [server.ts](file://backend/utils/supabase/server.ts#L3-L28)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts#L20-L38)

**Seção fontes**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L49-L133)
- [service-client.ts](file://backend/utils/supabase/service-client.ts#L36-L49)
- [server.ts](file://backend/utils/supabase/server.ts#L3-L28)
- [usuario-persistence.service.ts](file://backend/usuarios/services/persistence/usuario-persistence.service.ts#L20-L38)