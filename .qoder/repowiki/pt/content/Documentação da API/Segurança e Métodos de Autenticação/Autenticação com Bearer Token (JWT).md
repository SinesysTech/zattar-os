# Autenticação com Bearer Token (JWT)

<cite>
**Arquivos Referenciados neste Documento**   
- [api-auth.ts](file://backend/utils/auth/api-auth.ts)
- [acervo/route.ts](file://app/api/acervo/route.ts)
- [acervo-geral/route.ts](file://app/api/captura/trt/acervo-geral/route.ts)
- [clientes/route.ts](file://app/api/clientes/route.ts)
- [contratos/route.ts](file://app/api/contratos/route.ts)
- [audiencias/[id]/responsavel/route.ts](file://app/api/audiencias/[id]/responsavel/route.ts)
- [acervo/[id]/route.ts](file://app/api/acervo/[id]/route.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Fluxo de Autenticação com Bearer Token](#fluxo-de-autenticação-com-bearer-token)
3. [Estrutura do Token JWT](#estrutura-do-token-jwt)
4. [Validação do Token no Backend](#validação-do-token-no-backend)
5. [Uso do Header Authorization](#uso-do-header-authorization)
6. [Integração com Supabase Auth](#integração-com-supabase-auth)
7. [Boas Práticas de Segurança](#boas-práticas-de-segurança)
8. [Tratamento de Erros 401](#tratamento-de-erros-401)
9. [Renovação de Tokens](#renovação-de-tokens)
10. [Fluxos de Autenticação para Usuários Finais](#fluxos-de-autenticação-para-usuários-finais)

## Introdução
Este documento detalha o sistema de autenticação baseado em Bearer Token utilizando JWT (JSON Web Token) no contexto do sistema Sinesys. O sistema implementa uma abordagem dual de autenticação que suporta tanto o front-end quanto APIs externas, utilizando o Supabase Auth como provedor de identidade. A autenticação é realizada através do header `Authorization: Bearer <token>`, onde o token JWT é validado no backend para garantir acesso seguro aos recursos do sistema.

## Fluxo de Autenticação com Bearer Token
O fluxo de autenticação com Bearer Token no sistema Sinesys segue um processo bem definido que começa com a geração do token no Supabase Auth e termina com sua validação no backend. Quando um usuário realiza login no sistema, o Supabase Auth gera um JWT que contém informações sobre o usuário autenticado. Este token é então enviado nas requisições subsequentes através do header `Authorization` no formato `Bearer <token>`. O backend recebe a requisição e valida o token utilizando o serviço de autenticação do Supabase, garantindo que apenas usuários autenticados possam acessar os endpoints protegidos.

O sistema implementa uma ordem de prioridade para diferentes métodos de autenticação, onde a chave de API de serviço tem a prioridade mais alta, seguida pelo Bearer Token e, finalmente, pela sessão do Supabase. Essa abordagem permite que diferentes tipos de clientes (front-end, APIs externas e jobs do sistema) se autentiquem de maneira apropriada, mantendo um alto nível de segurança e flexibilidade.

**Fontes da Seção**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L42-L133)

## Estrutura do Token JWT
O token JWT utilizado no sistema Sinesys segue o padrão estabelecido pelo Supabase Auth e contém um payload com informações essenciais sobre o usuário autenticado. O payload inclui o UUID do usuário no sistema de autenticação do Supabase (armazenado no campo `userId`), além de informações adicionais que podem ser utilizadas para personalizar a experiência do usuário. O token também contém metadados importantes como a data de emissão (`iat`), a data de expiração (`exp`) e o emissor (`iss`), que são cruciais para a validação de segurança.

A estrutura do token é projetada para ser autocontida, o que significa que todas as informações necessárias para a autenticação estão embutidas no próprio token, eliminando a necessidade de consultas adicionais ao banco de dados para verificar a identidade do usuário. No entanto, o sistema realiza uma consulta adicional para buscar o ID do usuário na tabela `usuarios`, vinculando a identidade do Supabase Auth ao registro do usuário no banco de dados da aplicação.

**Fontes da Seção**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L83-L98)

## Validação do Token no Backend
A validação do token no backend é realizada pela função `authenticateRequest` localizada no arquivo `api-auth.ts`. Este processo começa com a extração do token do header `Authorization` da requisição HTTP. O token é então validado utilizando o cliente de serviço do Supabase, que verifica sua assinatura, data de expiração e outros parâmetros de segurança. Se o token for válido, o sistema obtém as informações do usuário autenticado e realiza uma consulta adicional para buscar o ID correspondente na tabela `usuarios`.

O processo de validação é robusto e inclui tratamento de erros abrangente para lidar com situações como tokens inválidos, expirados ou ausentes. Em caso de falha na validação, a função retorna um objeto com `authenticated: false`, resultando em uma resposta HTTP 401 (Unauthorized). A validação também considera o estado de ativação do usuário, garantindo que apenas usuários ativos no sistema possam acessar os recursos protegidos.

```mermaid
flowchart TD
A[Requisição HTTP] --> B{Header Authorization?}
B --> |Sim| C[Extrair Token Bearer]
B --> |Não| D[Verificar Sessão]
C --> E[Validar Token JWT]
E --> F{Token Válido?}
F --> |Sim| G[Obter Informações do Usuário]
G --> H[Buscar ID na Tabela usuarios]
H --> I[Retornar Resultado Autenticado]
F --> |Não| J[Retornar Não Autenticado]
D --> K{Sessão Válida?}
K --> |Sim| L[Obter Informações do Usuário]
L --> M[Buscar ID na Tabela usuarios]
M --> N[Retornar Resultado Autenticado]
K --> |Não| J
```

**Fontes do Diagrama**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L74-L104)

**Fontes da Seção**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L74-L104)

## Uso do Header Authorization
O header `Authorization: Bearer <token>` é o mecanismo padrão para autenticação nas requisições ao backend do sistema Sinesys. Este header deve ser incluído em todas as requisições que acessam endpoints protegidos, com o token JWT obtido após o login bem-sucedido no Supabase Auth. O uso correto deste header é essencial para garantir que o usuário esteja devidamente autenticado e autorizado a acessar os recursos solicitados.

### Exemplos de Requisições

**Exemplo com cURL:**
```bash
curl -X GET https://api.sinesys.com/acervo \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxx"
```

**Exemplo com Fetch API:**
```javascript
fetch('https://api.sinesys.com/acervo', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})
.then(response => response.json())
.then(data => console.log(data));
```

Esses exemplos demonstram como incluir o token JWT no header de autorização para acessar um endpoint protegido. É importante notar que o token deve ser incluído exatamente como recebido do Supabase Auth, sem modificações, e que o prefixo "Bearer" deve ser seguido por um espaço antes do token.

**Fontes da Seção**
- [acervo/route.ts](file://app/api/acervo/route.ts#L314-L316)
- [acervo-geral/route.ts](file://app/api/captura/trt/acervo-geral/route.ts#L82-L84)

## Integração com Supabase Auth
A integração com o Supabase Auth é central para o sistema de autenticação do Sinesys. O backend utiliza o cliente de serviço do Supabase para validar os tokens JWT, o que permite verificar a autenticidade e validade dos tokens sem precisar gerenciar diretamente a lógica de autenticação. A função `createServiceClient()` é utilizada para criar uma instância do cliente Supabase com permissões elevadas, permitindo a validação de tokens e acesso a dados protegidos.

O processo de integração envolve a chamada ao método `supabase.auth.getUser(token)` para validar o token e obter as informações do usuário autenticado. Após a validação bem-sucedida, o sistema realiza uma consulta adicional para buscar o ID do usuário na tabela `usuarios`, estabelecendo a ligação entre a identidade do Supabase Auth e o registro do usuário no banco de dados da aplicação. Essa abordagem permite que o sistema utilize os recursos robustos de autenticação do Supabase enquanto mantém seu próprio modelo de dados de usuários.

```mermaid
sequenceDiagram
participant Cliente as Cliente
participant Frontend as Frontend
participant Backend as Backend
participant Supabase as Supabase Auth
Cliente->>Frontend : Login (email/senha)
Frontend->>Supabase : Autenticar usuário
Supabase-->>Frontend : JWT Token
Frontend-->>Cliente : Login bem-sucedido
Cliente->>Frontend : Requisição protegida
Frontend->>Backend : GET /acervo<br/>Authorization : Bearer <token>
Backend->>Supabase : Validar token
Supabase-->>Backend : Informações do usuário
Backend->>Backend : Buscar ID na tabela usuarios
Backend-->>Frontend : Dados protegidos
Frontend-->>Cliente : Resposta
```

**Fontes do Diagrama**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L83-L84)
- [acervo/route.ts](file://app/api/acervo/route.ts#L314-L315)

**Fontes da Seção**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L80-L84)

## Boas Práticas de Segurança
O sistema Sinesys implementa várias boas práticas de segurança para proteger os tokens de autenticação e garantir a integridade do sistema. A prática mais importante é o armazenamento seguro dos tokens no cliente, onde os tokens devem ser mantidos na memória do aplicativo e nunca armazenados em localStorage, que é vulnerável a ataques XSS (Cross-Site Scripting). Isso previne que tokens sejam acessados por scripts maliciosos que possam ser injetados na página.

Além disso, o sistema utiliza tokens com prazo de expiração limitado, geralmente de 24 horas, o que reduz o risco de uso não autorizado em caso de vazamento. O backend também implementa validação rigorosa dos tokens, verificando não apenas sua assinatura, mas também sua data de expiração e outros parâmetros de segurança. A comunicação entre cliente e servidor deve sempre ocorrer sobre HTTPS para proteger os tokens durante a transmissão.

Outra prática importante é a validação do estado de ativação do usuário, onde o sistema verifica se o usuário está ativo na tabela `usuarios` antes de conceder acesso. Isso permite que administradores desativem contas de usuário sem precisar invalidar todos os tokens emitidos, proporcionando um controle mais granular sobre o acesso ao sistema.

**Fontes da Seção**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L27-L29)
- [08_usuarios.sql](file://supabase/schemas/08_usuarios.sql#L30)

## Tratamento de Erros 401
O tratamento de erros 401 (Unauthorized) é um componente crítico do sistema de autenticação, indicando que a requisição não foi autenticada com sucesso. O sistema retorna um erro 401 em várias situações, incluindo a ausência de token, token inválido, token expirado ou usuário inativo. Quando um erro 401 é retornado, o cliente deve tratar essa situação adequadamente, geralmente redirecionando o usuário para a página de login ou solicitando uma nova autenticação.

O processo de tratamento de erro 401 é consistente em todos os endpoints protegidos, onde a ausência de autenticação resulta em uma resposta JSON padronizada com a mensagem "Unauthorized" e status 401. Essa abordagem uniforme facilita o tratamento de erros no cliente e proporciona uma experiência de usuário mais previsível. Em alguns casos específicos, como quando o usuário é encontrado no Supabase Auth mas não na tabela `usuarios`, o sistema retorna um erro 401 adicional para indicar que a conta não está completamente configurada no sistema.

```mermaid
flowchart TD
A[Requisição Recebida] --> B{Token Presente?}
B --> |Não| C[Retornar 401]
B --> |Sim| D[Validar Token]
D --> E{Token Válido?}
E --> |Não| C
E --> |Sim| F[Verificar Usuário Ativo]
F --> G{Usuário Ativo?}
G --> |Não| C
G --> |Sim| H[Processar Requisição]
C --> I[Resposta: 401 Unauthorized]
H --> J[Resposta: 200 OK]
```

**Fontes do Diagrama**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L85-L88)
- [acervo/route.ts](file://app/api/acervo/route.ts#L316-L320)

**Fontes da Seção**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L85-L88)
- [acervo/route.ts](file://app/api/acervo/route.ts#L316-L320)
- [audiencias/[id]/responsavel/route.ts](file://app/api/audiencias/[id]/responsavel/route.ts#L152-L155)

## Renovação de Tokens
O sistema Sinesys implementa um mecanismo de renovação de tokens para manter os usuários autenticados sem a necessidade de login frequente. Quando um token JWT está próximo de expirar, o cliente pode solicitar um novo token ao Supabase Auth utilizando a sessão atual. Esse processo de renovação ocorre de forma transparente para o usuário, mantendo a experiência contínua sem interrupções.

A renovação de tokens é especialmente importante em aplicações onde os usuários passam longos períodos interagindo com o sistema. O Supabase Auth gerencia automaticamente o ciclo de vida dos tokens, emitindo novos tokens quando necessário e invalidando os antigos. O backend do Sinesys não precisa implementar lógica adicional para lidar com a renovação, pois valida cada token individualmente em cada requisição, independentemente de quando foi emitido.

É importante que o cliente monitore o tempo de expiração do token e inicie o processo de renovação antes que o token expire completamente. Isso evita interrupções no fluxo de trabalho do usuário e garante acesso contínuo aos recursos protegidos. A renovação deve ser realizada de forma segura, garantindo que as credenciais de renovação não sejam expostas ou armazenadas de maneira insegura.

**Fontes da Seção**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L109-L128)

## Fluxos de Autenticação para Usuários Finais
Os fluxos de autenticação para usuários finais no sistema Sinesys são projetados para serem simples e seguros, proporcionando uma experiência de login suave. O fluxo típico começa com a tela de login, onde o usuário insere suas credenciais (email e senha). Essas credenciais são enviadas ao Supabase Auth para verificação, e em caso de sucesso, um JWT é retornado ao cliente.

Após a autenticação bem-sucedida, o token JWT é armazenado na memória do aplicativo e utilizado em todas as requisições subsequentes aos endpoints protegidos. O sistema verifica a presença do token em cada requisição e valida sua autenticidade antes de processar a solicitação. Se o token expirar ou se tornar inválido, o usuário é redirecionado para a tela de login para autenticar novamente.

Para integração com a biblioteca Supabase no frontend, os desenvolvedores devem inicializar o cliente Supabase com a URL e a chave de API do projeto, e utilizar os métodos de autenticação fornecidos pela biblioteca. A integração é simplificada pela abordagem modular do Supabase, que fornece métodos prontos para login, logout, recuperação de senha e gerenciamento de sessão.

```mermaid
sequenceDiagram
participant Usuario as Usuário
participant Frontend as Frontend
participant Supabase as Supabase Auth
participant Backend as Backend Sinesys
Usuario->>Frontend : Acessar sistema
Frontend->>Usuario : Exibir tela de login
Usuario->>Frontend : Inserir email e senha
Frontend->>Supabase : signIn({ email, password })
Supabase-->>Frontend : JWT Token e dados do usuário
Frontend->>Frontend : Armazenar token na memória
Frontend->>Usuario : Redirecionar para dashboard
Usuario->>Frontend : Navegar por recursos
Frontend->>Backend : GET /clientes<br/>Authorization : Bearer <token>
Backend->>Supabase : validar token
Supabase-->>Backend : Informações do usuário
Backend-->>Frontend : Dados dos clientes
Frontend-->>Usuario : Exibir dados
```

**Fontes do Diagrama**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L109-L128)
- [clientes/route.ts](file://app/api/clientes/route.ts#L166-L168)

**Fontes da Seção**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L109-L128)
- [clientes/route.ts](file://app/api/clientes/route.ts#L166-L168)
- [contratos/route.ts](file://app/api/contratos/route.ts#L103-L105)
- [acervo/[id]/route.ts](file://app/api/acervo/[id]/route.ts#L102-L104)