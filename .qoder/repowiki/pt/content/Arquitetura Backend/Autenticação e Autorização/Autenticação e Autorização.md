# Autenticação e Autorização

<cite>
**Arquivos Referenciados neste Documento**   
- [swagger.config.ts](file://swagger.config.ts)
- [backend/utils/auth/api-auth.ts](file://backend/utils/auth/api-auth.ts)
- [backend/utils/api/twofauth.service.ts](file://backend/utils/api/twofauth.service.ts)
- [backend/captura/services/trt/trt-auth.service.ts](file://backend/captura/services/trt/trt-auth.service.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Sistema de Autenticação Dual](#sistema-de-autenticação-dual)
3. [Fluxo de Autenticação](#fluxo-de-autenticação)
4. [Autenticação via Supabase Auth](#autenticação-via-supabase-auth)
5. [Autenticação via API Key](#autenticação-via-api-key)
6. [Autenticação 2FA com 2FAuth](#autenticação-2fa-com-2fauth)
7. [Exemplos de Requisições](#exemplos-de-requisições)
8. [Códigos de Erro Comuns](#códigos-de-erro-comuns)
9. [Estratégias de Segurança](#estratégias-de-segurança)
10. [Integração com Novos Endpoints](#integração-com-novos-endpoints)
11. [Considerações Finais](#considerações-finais)

## Introdução

O sistema de autenticação e autorização do Sinesys implementa um modelo dual robusto que combina múltiplos métodos de autenticação para garantir segurança e flexibilidade. O sistema suporta três métodos principais: autenticação via cookie 'sb-access-token' do Supabase Auth para interfaces front-end, autenticação via header 'x-service-api-key' para serviços e jobs do sistema, e autenticação via Bearer Token para APIs externas. Além disso, o sistema integra autenticação de dois fatores (2FA) através do serviço 2FAuth para proteger acessos críticos ao PJE/TRT. Esta documentação detalha a implementação, fluxos, exemplos e melhores práticas para utilização e extensão do sistema de autenticação.

**Fontes da seção**
- [swagger.config.ts](file://swagger.config.ts#L1-L212)
- [backend/utils/auth/api-auth.ts](file://backend/utils/auth/api-auth.ts#L1-L136)

## Sistema de Autenticação Dual

O sistema de autenticação dual do Sinesys foi projetado para atender diferentes cenários de uso, desde interfaces front-end até serviços automatizados. A autenticação é implementada em camadas, com prioridade definida para cada método. O sistema verifica primeiro a API Key de serviço, seguida pelo Bearer Token JWT do Supabase, e finalmente a sessão de cookie do Supabase. Esta ordem de prioridade garante que jobs automatizados e serviços internos tenham precedência sobre requisições de usuário.

A implementação está centralizada na função `authenticateRequest()` localizada em `backend/utils/auth/api-auth.ts`, que processa a requisição HTTP e determina o método de autenticação apropriado. O resultado da autenticação é encapsulado na interface `AuthResult`, que inclui indicadores de autenticação bem-sucedida, IDs de usuário e a fonte da autenticação. O sistema também realiza o mapeamento entre o UUID do usuário no Supabase Auth e o ID correspondente na tabela de usuários do banco de dados, permitindo integração transparente com os serviços internos.

```mermaid
flowchart TD
A[Requisição HTTP] --> B{Verificar API Key de Serviço}
B --> |Presente| C{Validar Chave}
C --> |Válida| D[Autenticado como Sistema]
C --> |Inválida| E[Não Autenticado]
B --> |Ausente| F{Verificar Bearer Token}
F --> |Presente| G{Validar Token JWT}
G --> |Válido| H[Autenticado via Token]
G --> |Inválido| E
F --> |Ausente| I{Verificar Sessão Supabase}
I --> |Presente| J{Validar Sessão}
J --> |Válida| K[Autenticado via Sessão]
J --> |Inválida| E
D --> L[Processar Requisição]
H --> L
K --> L
E --> M[Retornar Erro 401]
```

**Fontes do diagrama**
- [backend/utils/auth/api-auth.ts](file://backend/utils/auth/api-auth.ts#L49-L133)

**Fontes da seção**
- [backend/utils/auth/api-auth.ts](file://backend/utils/auth/api-auth.ts#L1-L136)

## Fluxo de Autenticação

O fluxo de autenticação no Sinesys segue uma sequência hierárquica bem definida para determinar o método de autenticação apropriado. Quando uma requisição é recebida, o sistema primeiro verifica a presença do header 'x-service-api-key', que é utilizado por jobs automatizados e processos do sistema. Se este header estiver presente e a chave corresponder ao valor esperado nas variáveis de ambiente, a requisição é autenticada como uma requisição de serviço com prioridade máxima.

Caso a API Key de serviço não esteja presente ou seja inválida, o sistema verifica o header de autorização para um Bearer Token JWT do Supabase. Este método é utilizado principalmente por APIs externas e requisições programáticas. O token é validado contra o serviço Supabase, e se válido, o usuário é autenticado e seu ID é mapeado para o sistema interno.

Se nenhum dos métodos anteriores for bem-sucedido, o sistema verifica a presença de um cookie de sessão do Supabase ('sb-access-token'). Este método é utilizado pelas interfaces front-end onde a autenticação é gerenciada pelo Supabase Auth. A sessão é validada, e se válida, o usuário é autenticado com base na sessão ativa.

```mermaid
sequenceDiagram
participant Cliente as Cliente
participant API as API Sinesys
participant Supabase as Supabase Auth
participant BancoDados as Banco de Dados
Cliente->>API : Requisição HTTP
API->>API : Verificar x-service-api-key
alt API Key presente
API->>API : Validar chave com variável de ambiente
alt Chave válida
API-->>Cliente : Autenticado como sistema
else Chave inválida
API->>API : Continuar verificação
end
end
API->>API : Verificar Authorization Bearer
alt Token presente
API->>Supabase : Validar token JWT
Supabase-->>API : Usuário autenticado
API->>BancoDados : Buscar usuarioId por authUserId
BancoDados-->>API : ID do usuário
API-->>Cliente : Autenticado via token
else Token ausente
API->>API : Continuar verificação
end
API->>API : Verificar cookie sb-access-token
alt Cookie presente
API->>Supabase : Validar sessão
Supabase-->>API : Usuário autenticado
API->>BancoDados : Buscar usuarioId por authUserId
BancoDados-->>API : ID do usuário
API-->>Cliente : Autenticado via sessão
else Cookie ausente
API-->>Cliente : Não autenticado (401)
end
```

**Fontes do diagrama**
- [backend/utils/auth/api-auth.ts](file://backend/utils/auth/api-auth.ts#L49-L133)

**Fontes da seção**
- [backend/utils/auth/api-auth.ts](file://backend/utils/auth/api-auth.ts#L49-L133)

## Autenticação via Supabase Auth

A autenticação via Supabase Auth é implementada utilizando cookies de sessão, especificamente o cookie 'sb-access-token', que é gerenciado pelo sistema de autenticação do Supabase. Este método é primariamente utilizado pelas interfaces front-end do Sinesys, onde os usuários realizam login através da interface de autenticação do Supabase. Quando um usuário está autenticado, o cookie de sessão é incluído automaticamente nas requisições subsequentes ao backend.

A validação da sessão é realizada pela função `authenticateRequest()` que utiliza o cliente Supabase configurado para operar com cookies. O cliente obtém a sessão atual do usuário e valida sua autenticidade junto ao serviço Supabase. Após a validação bem-sucedida da sessão, o sistema realiza uma consulta ao banco de dados para mapear o UUID do usuário no Supabase Auth (armazenado em auth.users.id) para o ID correspondente na tabela usuarios (usuarios.id). Este mapeamento é essencial para integrar a autenticação do Supabase com os serviços internos do Sinesys que utilizam o ID do usuário no sistema interno.

A configuração da autenticação via sessão está definida no arquivo `swagger.config.ts`, onde o esquema de segurança 'sessionAuth' é configurado como um apiKey no cookie com o nome 'sb-access-token'. Este esquema é incluído na lista de segurança global da API, permitindo que endpoints específicos exijam autenticação de sessão.

**Fontes da seção**
- [swagger.config.ts](file://swagger.config.ts#L26-L38)
- [backend/utils/auth/api-auth.ts](file://backend/utils/auth/api-auth.ts#L108-L133)

## Autenticação via API Key

A autenticação via API Key é projetada para uso por jobs automatizados, processos agendados e serviços internos do sistema. Este método utiliza o header HTTP 'x-service-api-key' para transmitir a chave de autenticação. A chave de serviço tem a prioridade mais alta no sistema de autenticação, garantindo que requisições críticas do sistema sejam processadas mesmo quando outros métodos de autenticação estão indisponíveis.

A implementação verifica a presença do header 'x-service-api-key' na requisição e compara seu valor com o valor esperado armazenado na variável de ambiente SERVICE_API_KEY. A comparação é realizada de forma segura, embora não seja especificamente uma comparação timing-safe no código atual. Se a chave fornecida corresponder à chave esperada, a requisição é autenticada como uma requisição de serviço, com o userId definido como 'system' e sem um usuarioId associado, já que esta autenticação representa o sistema em si, não um usuário específico.

A configuração deste método de autenticação está definida no arquivo `swagger.config.ts`, onde o esquema de segurança 'serviceApiKey' é configurado como um apiKey no header com o nome 'x-service-api-key'. A descrição do esquema especifica claramente seu propósito: "API Key para autenticação de jobs do sistema. Usado por scripts automatizados e processos agendados."

```mermaid
flowchart LR
A[Requisição com Header] --> B{Header x-service-api-key Presente?}
B --> |Sim| C{Chave Corresponde à Variável de Ambiente?}
C --> |Sim| D[Autenticado como Sistema]
C --> |Não| E[Não Autenticado]
B --> |Não| F[Verificar Outros Métodos]
D --> G[Processar Requisição]
E --> H[Retornar 401 Não Autorizado]
```

**Fontes do diagrama**
- [backend/utils/auth/api-auth.ts](file://backend/utils/auth/api-auth.ts#L53-L72)

**Fontes da seção**
- [swagger.config.ts](file://swagger.config.ts#L39-L44)
- [backend/utils/auth/api-auth.ts](file://backend/utils/auth/api-auth.ts#L53-L72)

## Autenticação 2FA com 2FAuth

O sistema de autenticação 2FA do Sinesys é implementado através da integração com o serviço 2FAuth, que fornece códigos OTP (One-Time Password) para autenticação de dois fatores. Esta funcionalidade é essencial para acessar sistemas jurídicos como o PJE/TRT, que exigem autenticação adicional além de credenciais tradicionais. O serviço 2FAuth é utilizado principalmente durante o processo de autenticação no PJE, onde um código OTP é necessário após a inserção de CPF e senha.

A implementação está centralizada na função `getOTP()` localizada em `backend/utils/api/twofauth.service.ts`, que realiza uma chamada HTTP ao serviço 2FAuth para obter o código OTP atual e, quando disponível, o próximo código. A função aceita uma configuração opcional que pode especificar a URL da API, token de autenticação e ID da conta, mas por padrão utiliza variáveis de ambiente (TWOFAUTH_API_URL, TWOFAUTH_API_TOKEN, TWOFAUTH_ACCOUNT_ID). Antes de realizar a chamada, a função valida se todas as credenciais necessárias estão disponíveis, lançando um erro `TwoFAuthError` caso contrário.

A função `getOTP()` implementa tratamento robusto de erros, distinguindo entre erros de rede, erros de resposta da API e erros de validação. A resposta da API 2FAuth é validada para garantir que contenha o campo 'password' e que o comprimento do código OTP esteja entre 6 e 10 caracteres, conforme especificado na documentação do serviço. Em caso de falha na validação do primeiro código OTP durante o login no PJE, o sistema pode tentar automaticamente com o próximo código OTP, aumentando a confiabilidade do processo de autenticação automatizado.

```mermaid
sequenceDiagram
participant Serviço as Serviço Sinesys
participant 2FAuth as Serviço 2FAuth
participant PJE as PJE/TRT
Serviço->>Serviço : Iniciar autenticação no PJE
Serviço->>PJE : Navegar para página de login
Serviço->>PJE : Inserir CPF e senha
Serviço->>PJE : Submeter credenciais
PJE-->>Serviço : Solicitar código OTP
Serviço->>2FAuth : GET /api/v1/twofaccounts/{id}/otp
alt Requisição bem-sucedida
2FAuth-->>Serviço : {password : "123456", next_password : "789012"}
Serviço->>PJE : Inserir código OTP
alt Código aceito
PJE-->>Serviço : Autenticação bem-sucedida
else Código rejeitado
Serviço->>PJE : Inserir próximo código OTP
PJE-->>Serviço : Autenticação bem-sucedida
end
else Requisição falhou
2FAuth-->>Serviço : Erro HTTP 401/403
Serviço-->>Erro : TwoFAuthError
end
```

**Fontes do diagrama**
- [backend/utils/api/twofauth.service.ts](file://backend/utils/api/twofauth.service.ts#L76-L193)
- [backend/captura/services/trt/trt-auth.service.ts](file://backend/captura/services/trt/trt-auth.service.ts#L88-L216)

**Fontes da seção**
- [backend/utils/api/twofauth.service.ts](file://backend/utils/api/twofauth.service.ts#L1-L196)
- [backend/captura/services/trt/trt-auth.service.ts](file://backend/captura/services/trt/trt-auth.service.ts#L88-L216)

## Exemplos de Requisições

Esta seção fornece exemplos práticos de requisições utilizando os diferentes métodos de autenticação suportados pelo sistema Sinesys. Os exemplos demonstram como estruturar as requisições corretamente para cada cenário de uso.

### Requisição com API Key de Serviço
Para autenticar como um serviço ou job do sistema, utilize o header 'x-service-api-key' com a chave configurada nas variáveis de ambiente:

```http
GET /api/acervo HTTP/1.1
Host: api.sinesys.com.br
x-service-api-key: sua-chave-api-secreta-aqui
```

### Requisição com Bearer Token
Para autenticar via token JWT do Supabase (usado por APIs externas), utilize o header de autorização com o esquema Bearer:

```http
GET /api/clientes HTTP/1.1
Host: api.sinesys.com.br
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Requisição com Sessão do Supabase
Para autenticar via sessão (usado por interfaces front-end), o cookie 'sb-access-token' deve estar presente na requisição. O navegador gerencia isso automaticamente após o login:

```http
GET /api/usuarios HTTP/1.1
Host: api.sinesys.com.br
Cookie: sb-access-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Requisição sem Autenticação
Uma requisição sem autenticação adequada receberá uma resposta de não autorizado:

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Não autenticado"
}
```

**Fontes da seção**
- [swagger.config.ts](file://swagger.config.ts#L26-L44)
- [backend/utils/auth/api-auth.ts](file://backend/utils/auth/api-auth.ts#L49-L133)

## Códigos de Erro Comuns

O sistema de autenticação do Sinesys implementa um tratamento robusto de erros, fornecendo mensagens claras para diferentes cenários de falha. Entender esses códigos de erro é essencial para depurar problemas de autenticação e implementar estratégias de recuperação adequadas.

### Erros de Autenticação
- **401 Unauthorized**: Retornado quando nenhuma forma de autenticação válida é fornecida ou quando as credenciais fornecidas são inválidas. Este é o código de erro padrão para falhas de autenticação.
- **403 Forbidden**: Pode ser retornado em casos específicos onde a autenticação é bem-sucedida, mas o usuário ou serviço não tem permissão para acessar o recurso solicitado.
- **500 Internal Server Error**: Pode ocorrer durante a validação de tokens ou sessões quando há problemas de conexão com o serviço Supabase ou com o banco de dados.

### Erros Específicos do 2FAuth
- **TwoFAuthError (500)**: Lançado quando o serviço 2FAuth não está configurado corretamente, geralmente devido à ausência de variáveis de ambiente necessárias (TWOFAUTH_API_URL, TWOFAUTH_API_TOKEN, TWOFAUTH_ACCOUNT_ID).
- **TwoFAuthError (401/403)**: Retornado quando as credenciais fornecidas para o serviço 2FAuth são inválidas ou quando a conta não tem permissão para acessar o recurso.
- **TwoFAuthError (500)**: Pode ocorrer quando a resposta do serviço 2FAuth não está no formato JSON esperado ou quando o campo 'password' está ausente na resposta.

### Erros de Validação
- **TwoFAuthError (500)**: Lançado quando o código OTP retornado pelo serviço 2FAuth tem um comprimento inválido (menos de 6 ou mais de 10 caracteres).
- **Erro de Rede**: Pode ocorrer durante chamadas ao serviço 2FAuth devido a problemas de conectividade, timeout ou outros erros de rede.

**Fontes da seção**
- [backend/utils/api/twofauth.service.ts](file://backend/utils/api/twofauth.service.ts#L47-L193)
- [backend/utils/auth/api-auth.ts](file://backend/utils/auth/api-auth.ts#L100-L104)

## Estratégias de Segurança

O sistema de autenticação do Sinesys implementa várias estratégias de segurança para proteger os dados e serviços contra acessos não autorizados. Estas estratégias abrangem desde a proteção de credenciais até a implementação de práticas de segurança recomendadas para autenticação em sistemas distribuídos.

### Proteção de Credenciais
As credenciais sensíveis, como a SERVICE_API_KEY e as credenciais do 2FAuth, devem ser armazenadas exclusivamente em variáveis de ambiente e nunca em código fonte. O sistema valida a presença dessas variáveis antes de tentar utilizar os serviços correspondentes, garantindo que a execução falhe de forma segura quando as credenciais estão ausentes.

### Prioridade de Autenticação
O sistema implementa uma hierarquia de autenticação onde a API Key de serviço tem prioridade máxima. Esta abordagem garante que serviços críticos do sistema possam operar mesmo quando outros métodos de autenticação estão indisponíveis, enquanto ainda permite autenticação de usuário através de sessões ou tokens.

### Validação de Tokens
A validação de tokens JWT é realizada diretamente com o serviço Supabase, garantindo que apenas tokens válidos e não revogados sejam aceitos. O sistema também implementa validação adicional dos códigos OTP recebidos do serviço 2FAuth, verificando seu comprimento e presença de campos obrigatórios.

### Tratamento de Erros Seguro
O tratamento de erros é projetado para não revelar informações sensíveis sobre o sistema. Mensagens de erro genéricas são retornadas para o cliente, enquanto detalhes específicos são registrados nos logs do servidor para fins de depuração. Isso ajuda a prevenir ataques de enumeração e outras técnicas de exploração.

**Fontes da seção**
- [backend/utils/auth/api-auth.ts](file://backend/utils/auth/api-auth.ts#L1-L136)
- [backend/utils/api/twofauth.service.ts](file://backend/utils/api/twofauth.service.ts#L1-L196)

## Integração com Novos Endpoints

Para integrar novos endpoints com o sistema de autenticação existente do Sinesys, siga estas etapas e práticas recomendadas. A integração correta garante que os novos endpoints herdem automaticamente os mecanismos de segurança e autenticação já estabelecidos no sistema.

### Implementação Básica
Para proteger um novo endpoint, importe e utilize a função `authenticateRequest()` do módulo `backend/utils/auth/api-auth.ts`. Esta função deve ser chamada no início do manipulador de requisição para validar a autenticação antes de processar qualquer lógica de negócio.

```typescript
import { authenticateRequest } from '@/backend/utils/auth/api-auth';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  
  if (!authResult.authenticated) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Processar lógica do endpoint com authResult.userId e authResult.usuarioId
}
```

### Documentação com Swagger
Para documentar o novo endpoint com os esquemas de segurança apropriados, adicione anotações ao código ou atualize o arquivo `swagger.config.ts` para incluir os esquemas de segurança relevantes. Os esquemas disponíveis são 'bearerAuth', 'sessionAuth' e 'serviceApiKey', que podem ser aplicados conforme necessário.

### Considerações para Endpoints Públicos
Se o endpoint deve ser acessível publicamente sem autenticação, ainda assim considere implementar limitação de taxa (rate limiting) e validação de entrada para prevenir abusos. Para endpoints que requerem autenticação condicional, implemente lógica personalizada que verifique os requisitos específicos do endpoint.

**Fontes da seção**
- [backend/utils/auth/api-auth.ts](file://backend/utils/auth/api-auth.ts#L49-L133)
- [swagger.config.ts](file://swagger.config.ts#L193-L203)

## Considerações Finais

O sistema de autenticação e autorização do Sinesys representa uma implementação robusta e flexível que combina múltiplos métodos de autenticação para atender diferentes cenários de uso. A arquitetura dual que integra Supabase Auth com API Keys de serviço fornece uma base sólida para segurança, permitindo que interfaces front-end, APIs externas e serviços automatizados operem de forma segura dentro do mesmo ecossistema.

A integração com o serviço 2FAuth demonstra a capacidade do sistema de se adaptar a requisitos de autenticação avançados, como os encontrados em sistemas jurídicos. A implementação cuidadosa de tratamento de erros, validação de dados e estratégias de segurança reflete um compromisso com a confiabilidade e a proteção de dados sensíveis.

Para futuras melhorias, considerações podem incluir a implementação de uma comparação timing-safe para a validação da API Key de serviço, a adição de refresh tokens para sessões de longa duração e a expansão do sistema de logging para monitoramento mais detalhado de tentativas de autenticação. A documentação e os exemplos fornecidos nesta seção devem capacitar desenvolvedores a integrar novos endpoints com segurança e eficiência, mantendo a integridade do sistema de autenticação existente.