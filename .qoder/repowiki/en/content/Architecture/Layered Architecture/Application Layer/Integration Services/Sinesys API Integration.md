# Sinesys API Integration

<cite>
**Referenced Files in This Document**   
- [sinesys-client.ts](file://lib/services/sinesys-client.ts)
- [meu-processo-types.ts](file://lib/types/meu-processo-types.ts)
- [processos.ts](file://types/sinesys/processos.ts)
- [audiencias.ts](file://types/sinesys/audiencias.ts)
- [common.ts](file://types/sinesys/common.ts)
- [ANALISE-MIGRACAO-MEU-PROCESSO.md](file://ANALISE-MIGRACAO-MEU-PROCESSO.md)
- [DEPLOY.md](file://DEPLOY.md)
- [api-referencia/page.tsx](file://app/ajuda/desenvolvimento/api-referencia/page.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [API Client Overview](#api-client-overview)
3. [Authentication and Configuration](#authentication-and-configuration)
4. [Core API Endpoints](#core-api-endpoints)
5. [Data Models and Response Structure](#data-models-and-response-structure)
6. [Error Handling](#error-handling)
7. [Integration Patterns](#integration-patterns)
8. [N8N Integration](#n8n-integration)
9. [Best Practices](#best-practices)

## Introduction

The Sinesys API integration provides a comprehensive interface for accessing legal case management data from the Sinesys system. This documentation details the integration architecture, client implementation, and usage patterns for external applications to consume Sinesys data securely and efficiently.

The integration is designed to support the "Meu Processo" application and other client-facing services that need to retrieve case information, hearings, contracts, and agreements based on client CPF (Brazilian individual taxpayer registry). The API follows a layered architecture with proper authentication, error handling, and retry mechanisms.

**Section sources**
- [sinesys-client.ts](file://lib/services/sinesys-client.ts)
- [meu-processo-types.ts](file://lib/types/meu-processo-types.ts)

## API Client Overview

The Sinesys API integration is implemented through a dedicated client class that provides a clean, type-safe interface for consuming the API. The client abstracts the underlying HTTP communication and provides high-level methods for common operations.

The `SinesysClient` class serves as the primary interface for API integration, offering methods to retrieve various types of legal data by CPF. The client is designed with robust features including request retry logic, timeout handling, and proper error propagation.

```mermaid
classDiagram
class SinesysClient {
-config : SinesysClientConfig
+constructor(config : SinesysClientConfig)
-request<T>(endpoint : string, options? : RequestInit) : Promise<T>
-requestWithRetry<T>(endpoint : string, options? : RequestInit) : Promise<T>
+buscarProcessosPorCpf(cpf : string) : Promise<SinesysProcessoResponse>
+buscarAudienciasPorCpf(cpf : string) : Promise<SinesysAudienciasResponse>
+buscarClientePorCpf(cpf : string) : Promise<SinesysClienteResponse>
+buscarContratosPorClienteId(clienteId : number, options? : {pagina? : number, limite? : number}) : Promise<SinesysContratosResponse>
+buscarContratosPorCpf(cpf : string, options? : {pagina? : number, limite? : number}) : Promise<SinesysContratosResponse>
+buscarAcordosPorProcessoId(processoId : number, options? : {pagina? : number, limite? : number}) : Promise<SinesysAcordosResponse>
+buscarDadosClientePorCpf(cpf : string) : Promise<any>
+buscarAcordosDoCliente(cpf : string) : Promise<SinesysAcordosResponse>
}
class SinesysClientConfig {
+baseUrl : string
+apiKey : string
+timeout? : number
+retries? : number
}
SinesysClient --> SinesysClientConfig : "uses"
```

**Diagram sources**
- [sinesys-client.ts](file://lib/services/sinesys-client.ts)

**Section sources**
- [sinesys-client.ts](file://lib/services/sinesys-client.ts)

## Authentication and Configuration

The Sinesys API integration uses a service-level API key for authentication. This key must be included in the HTTP headers of all requests to authorize access to the API endpoints.

### Environment Variables

The client is configured using environment variables that should be set in the consuming application:

```env
NEXT_PUBLIC_SINESYS_API_URL=https://api.sinesys.com.br
SINESYS_SERVICE_API_KEY=<chave_secreta>
SINESYS_TIMEOUT=30000
SINESYS_RETRIES=2
```

The API key is sent in the `x-service-api-key` header for each request, providing a secure authentication mechanism that doesn't expose user credentials.

### Configuration Options

The `SinesysClientConfig` interface defines the configuration options for the client:

- `baseUrl`: The base URL of the Sinesys API
- `apiKey`: The service API key for authentication
- `timeout`: Request timeout in milliseconds (default: 30,000ms)
- `retries`: Number of retry attempts for failed requests (default: 2)

The client uses these configuration options to establish a connection with the Sinesys API and handle requests appropriately.

**Section sources**
- [sinesys-client.ts](file://lib/services/sinesys-client.ts)
- [ANALISE-MIGRACAO-MEU-PROCESSO.md](file://ANALISE-MIGRACAO-MEU-PROCESSO.md)

## Core API Endpoints

The Sinesys API provides several endpoints for retrieving legal case information. The client exposes methods that correspond to these endpoints, making it easy to access the required data.

### Process Data Endpoint

The process data endpoint retrieves all legal cases associated with a client's CPF. This information includes case numbers, types, parties involved, court information, and timeline data.

**Endpoint**: `GET /api/acervo/cliente/cpf/{cpf}`

### Hearing Data Endpoint

The hearing data endpoint retrieves all scheduled hearings for a client. This includes hearing types, dates, times, modalities (virtual, in-person, hybrid), and status information.

**Endpoint**: `GET /api/audiencias/cliente/cpf/{cpf}`

### Client Data Endpoint

The client data endpoint retrieves the client's registration information, including name, contact details, and address.

**Endpoint**: `GET /api/clientes/buscar/por-cpf/{cpf}`

### Contract Data Endpoint

The contract data endpoint retrieves all contracts associated with a client. Since this endpoint requires a client ID rather than a CPF, the integration first retrieves the client ID using the CPF before fetching the contracts.

**Endpoint**: `GET /api/contratos?clienteId={id}`

### Agreement Data Endpoint

The agreement data endpoint retrieves all agreements and judgments associated with a specific case. This requires a process ID, which must be obtained from the process data before fetching agreements.

**Endpoint**: `GET /api/acordos-condenacoes?processoId={id}`

```mermaid
sequenceDiagram
participant Client as "Client Application"
participant SinesysClient as "SinesysClient"
participant API as "Sinesys API"
Client->>SinesysClient : buscarDadosClientePorCpf(cpf)
SinesysClient->>API : GET /api/acervo/cliente/cpf/{cpf}
API-->>SinesysClient : ProcessosResponse
SinesysClient->>API : GET /api/audiencias/cliente/cpf/{cpf}
API-->>SinesysClient : AudienciasResponse
SinesysClient->>API : GET /api/clientes/buscar/por-cpf/{cpf}
API-->>SinesysClient : ClienteResponse
SinesysClient->>Client : Return aggregated data
Client->>SinesysClient : buscarAcordosDoCliente(cpf)
SinesysClient->>API : GET /api/acervo/cliente/cpf/{cpf}
API-->>SinesysClient : ProcessosResponse
loop For each process
SinesysClient->>API : GET /api/acordos-condenacoes?processoId={id}
API-->>SinesysClient : AcordosResponse
end
SinesysClient->>Client : Return aggregated agreements
```

**Diagram sources**
- [sinesys-client.ts](file://lib/services/sinesys-client.ts)

**Section sources**
- [sinesys-client.ts](file://lib/services/sinesys-client.ts)

## Data Models and Response Structure

The Sinesys API returns data in a consistent format with a standardized response structure. All responses follow the pattern `{ success: boolean, data?: T, error?: string }`, where `T` is the specific data type for the endpoint.

### Response Structure

All API responses conform to the following interface:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

This consistent structure makes it easy to handle responses across different endpoints and provides clear feedback on the success or failure of API calls.

### Process Data Model

The process data model includes comprehensive information about legal cases, including:

- Case number (CNJ format)
- Case type/nature
- Client's role in the case (plaintiff, defendant, etc.)
- Opposing party
- Court and jurisdiction
- Confidentiality status
- Claim value
- Instance information (first degree, second degree)
- Timeline of case movements
- Synchronization status of the timeline
- Last recorded movement
- Party information

### Hearing Data Model

The hearing data model includes detailed information about scheduled hearings:

- Associated case number
- Hearing type (e.g., Instruction Hearing)
- Date and time
- Modality (virtual, in-person, hybrid)
- Status (scheduled, completed, canceled, postponed)
- Location details (virtual URL, physical address, room)
- Party information
- Client's role
- Opposing party
- Court and division
- Confidentiality status
- Additional observations

### Agreement Data Model

The agreement data model includes information about settlements and judgments:

- Case association
- Type (settlement, judgment)
- Direction (receipt, payment)
- Total value
- Payment method (single payment, installment)
- Payment modality (judicial, extrajudicial)
- Number of installments
- Installment details (value, due date, status, payment date)

```mermaid
erDiagram
PROCESSO ||--o{ TIMELINE_ITEM : "contains"
PROCESSO ||--o{ INSTANCIA : "has"
CLIENTE ||--o{ PROCESSO : "owns"
CLIENTE ||--o{ AUDIENCIA : "has"
CLIENTE ||--o{ CONTRATO : "has"
PROCESSO ||--o{ ACORDO : "has"
ACORDO ||--o{ PARCELA : "contains"
PROCESSO {
string numero PK
string tipo
string papel_cliente
string parte_contraria
string tribunal
boolean sigilo
number valor_causa
string vara
string timeline_status
}
TIMELINE_ITEM {
string data PK
string evento
string descricao
boolean tem_documento
}
INSTANCIA {
string vara
string data_inicio
string proxima_audiencia
}
AUDIENCIA {
string numero_processo PK
string tipo
string data
string horario
string modalidade
string status
string papel_cliente
string parte_contraria
string tribunal
string vara
boolean sigilo
string observacoes
}
LOCAL_AUDIENCIA {
string tipo PK
string url_virtual
string endereco
string sala
string presenca_hibrida
}
CLIENTE {
string cpf PK
string nome
string email
string telefone
}
ENDERECO {
string logradouro
string numero
string complemento
string bairro
string cidade
string estado
string cep
}
CONTRATO {
number id PK
number cliente_id FK
string cliente_nome
string cliente_cpf
string parte_contraria
string processo_numero
string processo_tipo_nome
string data_assinou_contrato
string data_admissao
string data_rescisao
string estagio
string data_estagio
string status
string observacoes
}
ACORDO {
number id PK
number processo_id FK
string tipo
string direcao
number valor_total
number valor_bruto
number valor_liquido
string data_homologacao
string forma_pagamento
string modalidade_pagamento
string parte_autora
string parte_contraria
number quantidade_parcelas
}
PARCELA {
number id PK
number numero
number valor
number valor_liquido
string data_vencimento
string status
string data_pagamento
boolean repassado_cliente
string data_repassado_cliente
}
```

**Diagram sources**
- [processos.ts](file://types/sinesys/processos.ts)
- [audiencias.ts](file://types/sinesys/audiencias.ts)
- [meu-processo-types.ts](file://lib/types/meu-processo-types.ts)

**Section sources**
- [processos.ts](file://types/sinesys/processos.ts)
- [audiencias.ts](file://types/sinesys/audiencias.ts)
- [common.ts](file://types/sinesys/common.ts)
- [meu-processo-types.ts](file://lib/types/meu-processo-types.ts)

## Error Handling

The Sinesys API integration includes comprehensive error handling to ensure robust operation even when issues occur. The client implements several layers of error management to provide meaningful feedback and maintain application stability.

### SinesysAPIError Class

The integration defines a custom `SinesysAPIError` class that extends the base JavaScript Error class. This error class includes additional properties to provide detailed information about API errors:

- `message`: Human-readable error description
- `statusCode`: HTTP status code (when available)
- `details`: Additional error details
- `code`: Error code identifier

### Error Types

The client handles several types of errors:

1. **HTTP Errors**: Errors with status codes (4xx, 5xx) from the API
2. **Network Errors**: Connectivity issues or server unavailability
3. **Timeout Errors**: Requests that exceed the configured timeout
4. **Client Errors**: Issues with request parameters or authentication

### Retry Mechanism

The client implements an automatic retry mechanism for failed requests. By default, it will attempt to retry failed requests up to 2 times with exponential backoff. The retry logic is intelligent and will not retry requests that fail with client errors (4xx status codes), only server errors (5xx status codes) and network issues.

The retry delay follows an exponential backoff pattern, with a maximum delay of 5 seconds between attempts. This prevents overwhelming the server with repeated requests while still providing resilience against transient failures.

**Section sources**
- [sinesys-client.ts](file://lib/services/sinesys-client.ts)
- [meu-processo-types.ts](file://lib/types/meu-processo-types.ts)

## Integration Patterns

The Sinesys API integration supports several common patterns for consuming legal case data. These patterns are designed to optimize performance and provide the data in formats suitable for different use cases.

### Single CPF Lookup Pattern

The most common integration pattern is retrieving all data for a single client using their CPF. The client provides a convenience method `buscarDadosClientePorCpf` that performs this operation efficiently by making multiple requests in parallel:

```typescript
const result = await sinesysClient.buscarDadosClientePorCpf('123.456.789-00');
```

This method concurrently retrieves process data, hearing data, and contract data, aggregating the results into a single response object. This parallel execution significantly reduces the total latency compared to sequential requests.

### Agreement Aggregation Pattern

For clients with multiple cases, retrieving all agreements requires a more complex pattern. The `buscarAcordosDoCliente` method implements this pattern by:

1. First retrieving all processes for the client
2. Then making individual requests for agreements on each process
3. Aggregating all agreement data into a single response

This pattern handles cases where some process agreement requests might fail individually, ensuring that data from successful requests is still returned.

### Data Transformation Pattern

The integration supports data transformation to accommodate different consumer requirements. For example, the legacy N8N webhook format can be generated from the standard API responses, ensuring backward compatibility with existing integrations.

**Section sources**
- [sinesys-client.ts](file://lib/services/sinesys-client.ts)

## N8N Integration

The Sinesys API can be integrated with N8N for workflow automation. This integration allows for automated data processing, notifications, and other business processes.

### Configuration

To configure the N8N integration, the following environment variables should be set:

- `SINESYS_BASE_URL`: Base URL of the Sinesys API
- `SINESYS_API_TOKEN`: Authentication token
- `SINESYS_SERVICE_KEY`: Service API key

### HTTP Request Configuration

The N8N HTTP request node should be configured with the following settings:

```json
{
  "method": "GET",
  "url": "={{$env.SINESYS_BASE_URL}}/api/acervo",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "options": {
    "headerName": "Authorization",
    "headerValue": "Bearer {{$env.SINESYS_API_TOKEN}}"
  }
}
```

Additional headers may be required depending on the specific endpoint, such as the `x-service-api-key` header for service-level authentication.

**Section sources**
- [api-referencia/page.tsx](file://app/ajuda/desenvolvimento/api-referencia/page.tsx)

## Best Practices

When integrating with the Sinesys API, several best practices should be followed to ensure optimal performance, reliability, and security.

### Caching Strategy

Implement client-side caching to reduce the number of API calls and improve response times. The data retrieved from the Sinesys API typically doesn't change frequently, making it well-suited for caching with a reasonable TTL (time-to-live).

### Error Handling

Implement comprehensive error handling to provide a good user experience even when API issues occur. Display meaningful error messages to users and implement retry logic for transient failures.

### Rate Limiting

Respect any rate limits imposed by the API to avoid being blocked. The client's built-in retry mechanism with exponential backoff helps prevent overwhelming the server with repeated requests.

### Security

Never expose the service API key in client-side code. If the integration is used in a browser-based application, consider implementing a proxy server that handles the API requests on behalf of the client, keeping the API key secure on the server side.

### Data Privacy

Handle client data with care, following all applicable data protection regulations. The CPF and other personal information should be stored and transmitted securely, with appropriate access controls.

**Section sources**
- [sinesys-client.ts](file://lib/services/sinesys-client.ts)
- [ANALISE-MIGRACAO-MEU-PROCESSO.md](file://ANALISE-MIGRACAO-MEU-PROCESSO.md)
- [DEPLOY.md](file://DEPLOY.md)