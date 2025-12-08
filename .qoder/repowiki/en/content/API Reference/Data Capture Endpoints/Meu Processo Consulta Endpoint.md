# Meu Processo Consulta Endpoint

<cite>
**Referenced Files in This Document**
- [route.ts](file://app/api/meu-processo/consulta/route.ts)
- [README.md](file://app/api/meu-processo/README.md)
- [meu-processo-transformers.ts](file://lib/transformers/meu-processo-transformers.ts)
- [meu-processo-types.ts](file://lib/types/meu-processo-types.ts)
- [sinesys-client.ts](file://lib/services/sinesys-client.ts)
- [api-endpoint.test.ts](file://tests/integration/meu-processo/api-endpoint.test.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document describes the Meu Processo Consulta Endpoint, a server-side API that aggregates client-related data from the Sinesys platform and returns it in a legacy-compatible format for the Meu Processo client app. It focuses on:
- Endpoint behavior and request/response contracts
- Authentication and validation
- Data aggregation and transformation pipeline
- Error handling and caching
- Testing coverage and operational guidance

## Project Structure
The Meu Processo Consulta Endpoint is implemented as a Next.js API Route under the app layer and integrates with shared libraries for typing, transformation, and Sinesys client operations.

```mermaid
graph TB
subgraph "Client App"
MP["Meu Processo App"]
end
subgraph "Server"
API["API Route<br/>POST /api/meu-processo/consulta"]
TR["Transformers<br/>meu-processo-transformers.ts"]
TYPES["Types & Errors<br/>meu-processo-types.ts"]
CLIENT["SinesysClient<br/>sinesys-client.ts"]
end
MP --> |"POST {cpf}"| API
API --> |"Authenticate"| API
API --> |"Validate CPF"| API
API --> |"Fetch data"| CLIENT
CLIENT --> |"Call Sinesys APIs"| API
API --> |"Transform to legacy"| TR
TR --> |"Map fields"| TYPES
API --> |"Return legacy payload"| MP
```

**Diagram sources**
- [route.ts](file://app/api/meu-processo/consulta/route.ts#L1-L182)
- [meu-processo-transformers.ts](file://lib/transformers/meu-processo-transformers.ts#L1-L361)
- [meu-processo-types.ts](file://lib/types/meu-processo-types.ts#L1-L328)
- [sinesys-client.ts](file://lib/services/sinesys-client.ts#L1-L373)

**Section sources**
- [route.ts](file://app/api/meu-processo/consulta/route.ts#L1-L182)
- [README.md](file://app/api/meu-processo/README.md#L1-L254)

## Core Components
- API Route: Validates authentication and request body, orchestrates data fetching, and returns a legacy-compatible response.
- SinesysClient: Encapsulates HTTP requests to Sinesys, retries, timeouts, and error mapping.
- Transformers: Converts Sinesys responses into the legacy format expected by the Meu Processo app.
- Types: Defines request/response shapes for Sinesys and the legacy format, plus error types.

**Section sources**
- [route.ts](file://app/api/meu-processo/consulta/route.ts#L1-L182)
- [sinesys-client.ts](file://lib/services/sinesys-client.ts#L1-L373)
- [meu-processo-transformers.ts](file://lib/transformers/meu-processo-transformers.ts#L1-L361)
- [meu-processo-types.ts](file://lib/types/meu-processo-types.ts#L1-L328)

## Architecture Overview
The endpoint performs the following steps:
1. Authenticate via a service API key header.
2. Validate the CPF in the request body.
3. Fetch client data from Sinesys (processos, audiências, contratos) in parallel.
4. Optionally fetch acordos/condenações per processos if available.
5. Transform aggregated data into the legacy format.
6. Return a cached response with appropriate headers.

```mermaid
sequenceDiagram
participant Client as "Meu Processo App"
participant Route as "API Route"
participant SClient as "SinesysClient"
participant Trans as "Transformers"
participant Types as "Types"
Client->>Route : POST /api/meu-processo/consulta<br/>Headers : x-service-api-key<br/>Body : {cpf}
Route->>Route : Validate API Key
Route->>Route : Validate CPF
Route->>SClient : buscarDadosClientePorCpf(cpf)
SClient->>SClient : Parallel fetch (processos, audiências, contratos)
SClient-->>Route : {processos, audiencias, contratos}
alt Processos success
Route->>SClient : buscarAcordosDoCliente(cpf)
SClient-->>Route : {acordos} (optional)
else No processos
Route-->>Route : Skip acordos
end
Route->>Trans : transformDadosClienteParaLegacy(...)
Trans->>Types : Map fields to legacy types
Trans-->>Route : Legacy payload
Route-->>Client : 200 OK + Cache-Control : private, max-age=300
```

**Diagram sources**
- [route.ts](file://app/api/meu-processo/consulta/route.ts#L50-L148)
- [sinesys-client.ts](file://lib/services/sinesys-client.ts#L274-L356)
- [meu-processo-transformers.ts](file://lib/transformers/meu-processo-transformers.ts#L307-L361)
- [meu-processo-types.ts](file://lib/types/meu-processo-types.ts#L1-L328)

## Detailed Component Analysis

### API Route: POST /api/meu-processo/consulta
Responsibilities:
- Authentication: checks the presence and correctness of the service API key header.
- Validation: ensures the request body is valid JSON and contains a properly formatted CPF.
- Data orchestration: calls SinesysClient to fetch processos, audiências, contratos, and optionally acordos/condenações.
- Transformation: converts the collected data into the legacy format.
- Response: returns a cached response and handles errors gracefully.

Key behaviors:
- Authentication failure returns 401 with an error message.
- Invalid or missing CPF returns 400 with an error message.
- Body parsing failures return 400 with an error message.
- Sinesys API errors propagate with HTTP status mapping.
- Graceful degradation: acordos are fetched only if processos are available; failures are logged and ignored to keep the response.

Caching:
- Response includes Cache-Control: private, max-age=300.

Max execution duration:
- The route enforces a 30-second maximum runtime.

**Section sources**
- [route.ts](file://app/api/meu-processo/consulta/route.ts#L1-L182)
- [README.md](file://app/api/meu-processo/README.md#L173-L207)

### SinesysClient
Responsibilities:
- Provides high-level methods to fetch data from Sinesys by CPF.
- Implements retry with exponential backoff and configurable timeout.
- Wraps HTTP errors into typed SinesysAPIError exceptions.
- Aggregates client data in parallel and returns unified payloads.
- Optionally fetches acordos per processos and aggregates them.

Notable methods:
- buscarDadosClientePorCpf(cpf): parallel fetch of processos, audiências, and contratos.
- buscarAcordosDoCliente(cpf): fetches acordos for each processos’ id.
- buscarContratosPorCpf(cpf): resolves client id from CPF and fetches contracts.

**Section sources**
- [sinesys-client.ts](file://lib/services/sinesys-client.ts#L1-L373)

### Transformers: Legacy Mapping
Responsibilities:
- Convert Sinesys responses into the legacy format used by the Meu Processo app.
- Extract jurisdiction state/municipality from tribunal/vara.
- Flatten acordos into individual parcel rows.
- Aggregate multiple datasets into a single legacy payload.

Key transformations:
- Processos: map tribunal, número, partes, instâncias, and timeline to legacy structure.
- Audiências: combine data + horario into a single datetime string and map local/link.
- Contratos: map client and contract fields to legacy shape.
- Acordos/Condenações: expand parcelas into separate rows with repeated metadata.

**Section sources**
- [meu-processo-transformers.ts](file://lib/transformers/meu-processo-transformers.ts#L1-L361)

### Types and Error Handling
- Sinesys types define request/response shapes for processos, audiências, contratos, acordos, and timelines.
- Legacy types define the output structure expected by the Meu Processo app.
- SinesysAPIError encapsulates HTTP errors with status, code, and details.

**Section sources**
- [meu-processo-types.ts](file://lib/types/meu-processo-types.ts#L1-L328)

### API Flow and Decision Logic
```mermaid
flowchart TD
Start(["Request Received"]) --> CheckAuth["Check x-service-api-key"]
CheckAuth --> AuthOK{"Auth valid?"}
AuthOK --> |No| Return401["Return 401 Unauthorized"]
AuthOK --> |Yes| ParseBody["Parse JSON body"]
ParseBody --> BodyOK{"Body valid and has cpf?"}
BodyOK --> |No| Return400A["Return 400 Bad Request"]
BodyOK --> |Yes| ValidateCPF["Validate CPF length and pattern"]
ValidateCPF --> CPFValid{"CPF valid?"}
CPFValid --> |No| Return400B["Return 400 Bad Request"]
CPFValid --> |Yes| FetchData["Parallel fetch: processos, audiências, contratos"]
FetchData --> GotData["Got Sinesys data"]
GotData --> HasProcessos{"Processos success?"}
HasProcessos --> |Yes| FetchAcordos["Fetch acordos per processo id"]
HasProcessos --> |No| SkipAcordos["Skip acordos"]
FetchAcordos --> Transform["Transform to legacy format"]
SkipAcordos --> Transform
Transform --> Cache["Set Cache-Control: private, max-age=300"]
Cache --> Return200["Return 200 OK"]
Return401 --> End(["Exit"])
Return400A --> End
Return400B --> End
Return200 --> End
```

**Diagram sources**
- [route.ts](file://app/api/meu-processo/consulta/route.ts#L50-L148)
- [sinesys-client.ts](file://lib/services/sinesys-client.ts#L274-L356)
- [meu-processo-transformers.ts](file://lib/transformers/meu-processo-transformers.ts#L307-L361)

## Dependency Analysis
The endpoint depends on:
- SinesysClient for external API calls.
- Transformers for data mapping.
- Types for compile-time safety and runtime validation.
- Tests for integration verification.

```mermaid
graph LR
ROUTE["route.ts"] --> CLIENT["sinesys-client.ts"]
ROUTE --> TRANS["meu-processo-transformers.ts"]
ROUTE --> TYPES["meu-processo-types.ts"]
TESTS["api-endpoint.test.ts"] --> ROUTE
TESTS --> CLIENT
TESTS --> TRANS
```

**Diagram sources**
- [route.ts](file://app/api/meu-processo/consulta/route.ts#L1-L182)
- [sinesys-client.ts](file://lib/services/sinesys-client.ts#L1-L373)
- [meu-processo-transformers.ts](file://lib/transformers/meu-processo-transformers.ts#L1-L361)
- [meu-processo-types.ts](file://lib/types/meu-processo-types.ts#L1-L328)
- [api-endpoint.test.ts](file://tests/integration/meu-processo/api-endpoint.test.ts#L1-L601)

**Section sources**
- [route.ts](file://app/api/meu-processo/consulta/route.ts#L1-L182)
- [sinesys-client.ts](file://lib/services/sinesys-client.ts#L1-L373)
- [meu-processo-transformers.ts](file://lib/transformers/meu-processo-transformers.ts#L1-L361)
- [meu-processo-types.ts](file://lib/types/meu-processo-types.ts#L1-L328)
- [api-endpoint.test.ts](file://tests/integration/meu-processo/api-endpoint.test.ts#L1-L601)

## Performance Considerations
- Parallelization: The client fetches processos, audiências, and contratos concurrently to reduce latency.
- Retries: Automatic retry with exponential backoff reduces transient failures.
- Timeout: Configurable timeout prevents long-running requests.
- Caching: Response includes Cache-Control to enable client-side caching for up to 5 minutes.
- Graceful fallback: Acordos are fetched only when processos are available; failures are handled without blocking the response.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- 401 Unauthorized: Ensure the x-service-api-key header matches the configured SERVICE_API_KEY.
- 400 Bad Request:
  - Missing or invalid JSON body.
  - Missing or invalid CPF (must be 11 digits; repeated sequences are rejected).
- 500 Internal Server Error:
  - Sinesys API errors propagate with status mapping; inspect error, details, and code fields.
  - Unexpected exceptions return a generic error message; check server logs.
- No data returned:
  - If both processos and audiências are unavailable, a message indicates no data was found for the CPF.
  - Contratos may be returned as a string indicating absence when no records are found.

Operational tips:
- Masked logging: CPFs are partially masked in logs for privacy.
- Max execution: The route enforces a 30-second limit; long-running queries may be aborted.

**Section sources**
- [route.ts](file://app/api/meu-processo/consulta/route.ts#L50-L148)
- [README.md](file://app/api/meu-processo/README.md#L106-L129)

## Conclusion
The Meu Processo Consulta Endpoint provides a robust, authenticated, and cache-aware integration with Sinesys, transforming heterogeneous data into a legacy-compatible format for the client app. Its design emphasizes reliability through parallelization, retries, and graceful error handling, while maintaining strong typing and comprehensive testing.