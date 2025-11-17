# Segurança e Métodos de Autenticação

<cite>
**Arquivos Referenciados neste Documento**   
- [swagger.config.ts](file://swagger.config.ts)
- [api-auth.ts](file://backend/utils/auth/api-auth.ts)
</cite>

## Tabela de Conteúdo
1. [Introdução](#introdução)
2. [Métodos de Autenticação Suportados](#métodos-de-autenticação-suportados)
3. [Configuração no Swagger](#configuração-no-swagger)
4. [Boas Práticas de Segurança](#boas-práticas-de-segurança)
5. [Fluxos de Autenticação](#fluxos-de-autenticação)
6. [Tratamento de Tokens Expirados](#tratamento-de-tokens-expirados)

## Introdução
Este documento detalha os métodos de autenticação implementados na API Sinesys, um sistema de captura de dados do PJE/TRT. A API suporta três métodos principais de autenticação: Bearer Token (JWT), Session Cookie (sb-access-token) e API Key (x-service-api-key). Cada método atende a diferentes cenários de uso, desde interfaces de usuário até processos automatizados. A documentação abrange o funcionamento, uso apropriado, configuração e boas práticas de segurança para cada método.

## Métodos de Autenticação Suportados

A API Sinesys implementa um sistema de autenticação multifacetado que prioriza diferentes métodos com base no contexto da requisição. O processo de autenticação é executado em ordem de prioridade, começando com a API Key de serviço, seguido pelo Bearer Token e finalmente pela sessão via cookie.

### Bearer Token (JWT)
O método Bearer Token utiliza tokens JWT (JSON Web Token) emitidos pelo Supabase Auth para autenticar requisições. Este método é ideal para aplicações front-end e APIs externas que precisam se integrar com o sistema.

**Funcionamento:**
- O token JWT é enviado no cabeçalho `Authorization` com o prefixo "Bearer"
- O servidor valida o token utilizando o cliente de serviço do Supabase
- Após validação bem-sucedida, o sistema busca o ID correspondente na tabela de usuários

**Quando usar:**
- Aplicações front-end que não utilizam cookies
- Integrações com APIs externas
- Clientes móveis ou desktop
- Qualquer cenário onde o armazenamento de cookies não seja viável

**Exemplo de requisição cURL:**
```bash
curl -X GET "http://localhost:3000/api/acervo" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Section sources**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L74-L105)

### Session Cookie (sb-access-token)
O método de autenticação por sessão utiliza cookies gerenciados pelo Supabase para manter o estado de autenticação. Este método é adequado para aplicações web tradicionais que seguem o modelo de sessão.

**Funcionamento:**
- O Supabase define um cookie chamado `sb-access-token` após o login bem-sucedido
- O cookie contém um token JWT que é automaticamente enviado em requisições subsequentes
- O servidor valida a sessão verificando o token no cookie

**Quando usar:**
- Aplicações web tradicionais (Next.js App Router)
- Interfaces administrativas
- Qualquer aplicação que utilize autenticação baseada em sessão
- Quando se deseja aproveitar a gestão automática de sessão do Supabase

**Exemplo de requisição cURL:**
```bash
curl -X GET "http://localhost:3000/api/acervo" \
  -H "Cookie: sb-access-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Section sources**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L108-L133)

### API Key (x-service-api-key)
O método de autenticação por API Key é projetado especificamente para jobs do sistema e processos automatizados. Este método tem a prioridade mais alta no fluxo de autenticação.

**Funcionamento:**
- A chave de API é enviada no cabeçalho `x-service-api-key`
- O valor é comparado com a variável de ambiente `SERVICE_API_KEY`
- Utiliza comparação segura (timing-safe) para prevenir ataques de timing

**Quando usar:**
- Scripts automatizados e processos agendados
- Jobs do sistema que operam em segundo plano
- Integrações entre serviços internos
- Qualquer cenário de autenticação máquina-a-máquina

**Exemplo de requisição cURL:**
```bash
curl -X POST "http://localhost:3000/api/captura/trt/acervo-geral" \
  -H "x-service-api-key: seu-chave-api-secreta-aqui"
```

**Section sources**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L53-L72)

## Configuração no Swagger

A configuração da documentação OpenAPI no arquivo `swagger.config.ts` define claramente os esquemas de segurança disponíveis para a API, permitindo que clientes e desenvolvedores entendam como se autenticar corretamente.

```mermaid
flowchart TD
A["securitySchemes"] --> B["bearerAuth"]
A --> C["sessionAuth"]
A --> D["serviceApiKey"]
B --> E["type: http"]
B --> F["scheme: bearer"]
B --> G["bearerFormat: JWT"]
C --> H["type: apiKey"]
C --> I["in: cookie"]
C --> J["name: sb-access-token"]
D --> K["type: apiKey"]
D --> L["in: header"]
D --> M["name: x-service-api-key"]
N["security"] --> O["bearerAuth: []"]
N --> P["sessionAuth: []"]
N --> Q["serviceApiKey: []"]
```

**Diagram sources**
- [swagger.config.ts](file://swagger.config.ts#L26-L44)
- [swagger.config.ts](file://swagger.config.ts#L193-L202)

**Section sources**
- [swagger.config.ts](file://swagger.config.ts#L26-L44)
- [swagger.config.ts](file://swagger.config.ts#L193-L202)

## Boas Práticas de Segurança

### Armazenamento Seguro de Tokens
Para métodos que utilizam tokens (Bearer e Session), é essencial seguir práticas recomendadas de armazenamento:

- **Front-end Web**: Utilize HttpOnly e Secure cookies para proteger contra XSS
- **Aplicativos Móveis**: Armazene tokens em cofres de segurança do sistema operacional
- **Aplicativos Desktop**: Utilize os gerenciadores de credenciais do sistema
- **Evite armazenar tokens em localStorage** devido à vulnerabilidade a ataques XSS

### Rotação de API Keys
A segurança das API Keys depende fortemente de práticas de rotação adequadas:

- **Rotação Regular**: Altere as chaves periodicamente (recomendado: a cada 90 dias)
- **Revogação Imediata**: Revogue chaves comprometidas imediatamente
- **Ambientes Separados**: Utilize chaves diferentes para desenvolvimento, homologação e produção
- **Monitoramento de Uso**: Implemente logs para detectar uso anômalo de chaves

### Validação no Backend
A validação robusta no backend é crucial para a segurança do sistema:

- **Validação de Formato**: Verifique o formato dos tokens JWT
- **Verificação de Assinatura**: Sempre valide a assinatura dos tokens
- **Verificação de Expiração**: Confirme que os tokens não estão expirados
- **Listas de Revogação**: Implemente mecanismos para revogar tokens antes da expiração
- **Rate Limiting**: Limite o número de requisições de autenticação para prevenir força bruta

**Section sources**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L58-L69)
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L83-L85)
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L111-L113)

## Fluxos de Autenticação

O sistema implementa um fluxo de autenticação em cascata que verifica os métodos na seguinte ordem de prioridade:

```mermaid
flowchart TD
Start([Requisição Recebida]) --> CheckAPIKey["Verificar x-service-api-key"]
CheckAPIKey --> APIKeyValid{"API Key Válida?"}
APIKeyValid --> |Sim| AuthenticatedService["Autenticado como Serviço"]
APIKeyValid --> |Não| CheckBearer["Verificar Bearer Token"]
CheckBearer --> BearerValid{"Bearer Token Válido?"}
BearerValid --> |Sim| AuthenticatedBearer["Autenticado com Bearer"]
BearerValid --> |Não| CheckSession["Verificar Session Cookie"]
CheckSession --> SessionValid{"Sessão Válida?"}
SessionValid --> |Sim| AuthenticatedSession["Autenticado com Sessão"]
SessionValid --> |Não| Unauthenticated["Não Autenticado"]
AuthenticatedService --> End([Acesso Concedido])
AuthenticatedBearer --> End
AuthenticatedSession --> End
Unauthenticated --> End([Acesso Negado])
style AuthenticatedService fill:#d4edda,stroke:#c3e6cb
style AuthenticatedBearer fill:#d4edda,stroke:#c3e6cb
style AuthenticatedSession fill:#d4edda,stroke:#c3e6cb
style Unauthenticated fill:#f8d7da,stroke:#f5c6cb
```

**Diagram sources**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L53-L133)

**Section sources**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L53-L133)

## Tratamento de Tokens Expirados

O sistema implementa tratamento adequado para tokens expirados, garantindo uma experiência de usuário suave:

- **Bearer Tokens**: Quando um token JWT expira, o cliente deve obter um novo token através do processo de autenticação do Supabase
- **Sessões por Cookie**: O Supabase geralmente implementa refresh automático de sessão, mas quando a sessão expira completamente, o usuário precisa fazer login novamente
- **API Keys**: Não possuem expiração natural, mas devem ser rotacionadas periodicamente por segurança

Para aplicações cliente, é recomendado implementar lógica para detectar respostas de autenticação falha (código 401) e iniciar automaticamente o processo de renovação de token ou redirecionamento para login.

**Section sources**
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L83-L85)
- [api-auth.ts](file://backend/utils/auth/api-auth.ts#L111-L113)