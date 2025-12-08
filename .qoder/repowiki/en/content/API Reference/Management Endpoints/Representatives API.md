# Representatives API

<cite>
**Referenced Files in This Document**   
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts)
- [route.ts](file://app/api/representantes/route.ts)
- [route.ts](file://app/api/representantes/[id]/route.ts)
- [route.ts](file://app/api/representantes/buscar/por-cpf/[cpf]/route.ts)
- [route.ts](file://app/api/representantes/buscar/por-cnpj/[cnpj]/route.ts)
- [route.ts](file://app/api/representantes/buscar/por-nome/[nome]/route.ts)
- [route.ts](file://app/api/representantes/oab/[numero_oab]/route.ts)
- [route.ts](file://app/api/representantes/processo/route.ts)
- [route.ts](file://app/api/representantes/upsert/route.ts)
- [representantes.ts](file://types/domain/representantes.ts)
- [representantes-types.ts](file://backend/types/representantes/representantes-types.ts)
- [representantes.service.ts](file://backend/representantes/services/representantes/representantes.service.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Endpoints](#core-endpoints)
3. [Specialized Search Endpoints](#specialized-search-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Frontend Integration](#frontend-integration)
7. [Business Rules](#business-rules)
8. [Common Issues and Solutions](#common-issues-and-solutions)

## Introduction

The Representatives Management API in the Sinesys system provides comprehensive CRUD operations for managing legal representatives (advogados) who act on behalf of parties in judicial processes. The API endpoints are designed to handle the creation, retrieval, updating, and deletion of representative records, with specialized functionality for searching by various criteria including CPF, OAB number, and process association.

The API follows a RESTful architecture with clear separation of concerns. Representatives are modeled as unique entities identified by CPF, with a one-to-one relationship between a person and their representative record. This design ensures data consistency and prevents duplication of representative information across different processes.

The system implements robust validation rules for critical fields such as CPF, CNPJ, email, and OAB numbers, ensuring data integrity at the API level. Authentication is required for all endpoints, with appropriate error responses for unauthorized access attempts.

**Section sources**
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L1-L843)
- [route.ts](file://app/api/representantes/route.ts#L1-L294)

## Core Endpoints

### POST /api/representantes - Create Representative

Creates a new representative record in the system. This endpoint requires authentication and validates all input data before creation.

**Request**
- Method: POST
- URL: `/api/representantes`
- Authentication: Required (Bearer token, session, or service API key)
- Content-Type: application/json

**Request Body**
```json
{
  "cpf": "string",
  "nome": "string",
  "sexo": "string",
  "tipo": "string",
  "oabs": [
    {
      "numero": "string",
      "uf": "string",
      "situacao": "string"
    }
  ],
  "emails": ["string"],
  "email": "string",
  "ddd_celular": "string",
  "numero_celular": "string",
  "ddd_residencial": "string",
  "numero_residencial": "string",
  "ddd_comercial": "string",
  "numero_comercial": "string",
  "endereco_id": "number"
}
```

**Response Codes**
- 201 Created: Representative created successfully
- 400 Bad Request: Invalid data provided
- 401 Unauthorized: Authentication required
- 409 Conflict: Representative already exists with this CPF
- 500 Internal Server Error: Server error occurred

**Response Example (201)**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "cpf": "12345678901",
    "nome": "João Silva",
    "sexo": "M",
    "tipo": "ADVOGADO",
    "oabs": [
      {
        "numero": "SP123456",
        "uf": "SP",
        "situacao": "REGULAR"
      }
    ],
    "emails": ["joao.silva@email.com"],
    "email": "joao.silva@email.com",
    "ddd_celular": "11",
    "numero_celular": "987654321",
    "ddd_residencial": "11",
    "numero_residencial": "32165498",
    "ddd_comercial": "11",
    "numero_comercial": "32165499",
    "endereco_id": 456,
    "dados_anteriores": null,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

**Section sources**
- [route.ts](file://app/api/representantes/route.ts#L166-L293)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L209-L257)

### GET /api/representantes - List Representatives

Retrieves a paginated list of representatives with optional filtering and sorting.

**Request**
- Method: GET
- URL: `/api/representantes`
- Authentication: Required
- Query Parameters:
  - `pagina`: Page number (default: 1)
  - `limite`: Items per page (default: 50, max: 100)
  - `nome`: Filter by name (partial match)
  - `cpf`: Filter by CPF (exact match)
  - `oab`: Filter by OAB number
  - `uf_oab`: Filter by OAB state
  - `busca`: Text search across name, CPF, email, and OABs
  - `ordenar_por`: Field to sort by (nome, cpf, created_at)
  - `ordem`: Sort order (asc, desc)
  - `incluir_endereco`: Include address data (boolean)
  - `incluir_processos`: Include related processes (boolean)

**Response Codes**
- 200 OK: Successfully retrieved list
- 401 Unauthorized: Authentication required
- 500 Internal Server Error: Server error occurred

**Response Example (200)**
```json
{
  "success": true,
  "data": {
    "representantes": [
      {
        "id": 123,
        "cpf": "12345678901",
        "nome": "João Silva",
        "sexo": "M",
        "tipo": "ADVOGADO",
        "oabs": [
          {
            "numero": "SP123456",
            "uf": "SP",
            "situacao": "REGULAR"
          }
        ],
        "emails": ["joao.silva@email.com"],
        "email": "joao.silva@email.com",
        "ddd_celular": "11",
        "numero_celular": "987654321",
        "ddd_residencial": "11",
        "numero_residencial": "32165498",
        "ddd_comercial": "11",
        "numero_comercial": "32165499",
        "endereco_id": 456,
        "dados_anteriores": null,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "pagina": 1,
    "limite": 50,
    "totalPaginas": 1
  }
}
```

**Section sources**
- [route.ts](file://app/api/representantes/route.ts#L122-L163)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L457-L531)

### GET /api/representantes/{id} - Get Representative by ID

Retrieves a specific representative by their unique ID.

**Request**
- Method: GET
- URL: `/api/representantes/{id}`
- Authentication: Required
- Path Parameter:
  - `id`: Representative ID (integer)

**Response Codes**
- 200 OK: Representative found
- 400 Bad Request: Invalid ID
- 401 Unauthorized: Authentication required
- 404 Not Found: Representative not found
- 500 Internal Server Error: Server error occurred

**Response Example (200)**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "cpf": "12345678901",
    "nome": "João Silva",
    "sexo": "M",
    "tipo": "ADVOGADO",
    "oabs": [
      {
        "numero": "SP123456",
        "uf": "SP",
        "situacao": "REGULAR"
      }
    ],
    "emails": ["joao.silva@email.com"],
    "email": "joao.silva@email.com",
    "ddd_celular": "11",
    "numero_celular": "987654321",
    "ddd_residencial": "11",
    "numero_residencial": "32165498",
    "ddd_comercial": "11",
    "numero_comercial": "32165499",
    "endereco_id": 456,
    "dados_anteriores": null,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

**Section sources**
- [route.ts](file://app/api/representantes/[id]/route.ts#L58-L97)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L332-L348)

### PATCH /api/representantes/{id} - Update Representative

Updates an existing representative record.

**Request**
- Method: PATCH
- URL: `/api/representantes/{id}`
- Authentication: Required
- Content-Type: application/json
- Path Parameter:
  - `id`: Representative ID (integer)

**Request Body**
```json
{
  "nome": "string",
  "sexo": "string",
  "tipo": "string",
  "oabs": [
    {
      "numero": "string",
      "uf": "string",
      "situacao": "string"
    }
  ],
  "emails": ["string"],
  "email": "string",
  "ddd_celular": "string",
  "numero_celular": "string",
  "ddd_residencial": "string",
  "numero_residencial": "string",
  "ddd_comercial": "string",
  "numero_comercial": "string",
  "endereco_id": "number"
}
```

**Response Codes**
- 200 OK: Representative updated successfully
- 400 Bad Request: Invalid data or attempt to modify immutable fields
- 401 Unauthorized: Authentication required
- 404 Not Found: Representative not found
- 500 Internal Server Error: Server error occurred

**Response Example (200)**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "cpf": "12345678901",
    "nome": "João Silva",
    "sexo": "M",
    "tipo": "ADVOGADO",
    "oabs": [
      {
        "numero": "SP123456",
        "uf": "SP",
        "situacao": "REGULAR"
      }
    ],
    "emails": ["joao.silva@email.com"],
    "email": "joao.silva@email.com",
    "ddd_celular": "11",
    "numero_celular": "987654321",
    "ddd_residencial": "11",
    "numero_residencial": "32165498",
    "ddd_comercial": "11",
    "numero_comercial": "32165499",
    "endereco_id": 456,
    "dados_anteriores": { /* previous data */ },
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-02T00:00:00Z"
  }
}
```

**Section sources**
- [route.ts](file://app/api/representantes/[id]/route.ts#L163-L225)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L262-L319)

### DELETE /api/representantes/{id} - Delete Representative

Removes a representative record from the system.

**Request**
- Method: DELETE
- URL: `/api/representantes/{id}`
- Authentication: Required
- Path Parameter:
  - `id`: Representative ID (integer)

**Response Codes**
- 200 OK: Representative removed successfully
- 400 Bad Request: Invalid ID
- 401 Unauthorized: Authentication required
- 404 Not Found: Representative not found
- 500 Internal Server Error: Server error occurred

**Response Example (200)**
```json
{
  "success": true
}
```

**Section sources**
- [route.ts](file://app/api/representantes/[id]/route.ts#L263-L310)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L588-L614)

### POST /api/representantes/upsert - Idempotent Create/Update

Creates a new representative or updates an existing one based on CPF, ensuring idempotency.

**Request**
- Method: POST
- URL: `/api/representantes/upsert`
- Authentication: Required
- Content-Type: application/json

**Request Body**
```json
{
  "cpf": "string",
  "nome": "string",
  "sexo": "string",
  "tipo": "string",
  "oabs": [
    {
      "numero": "string",
      "uf": "string",
      "situacao": "string"
    }
  ],
  "email": "string"
}
```

**Response Codes**
- 200 OK: Operation completed successfully
- 400 Bad Request: Invalid data provided
- 401 Unauthorized: Authentication required
- 500 Internal Server Error: Server error occurred

**Response Example (200)**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "cpf": "12345678901",
    "nome": "João Silva",
    "sexo": "M",
    "tipo": "ADVOGADO",
    "oabs": [
      {
        "numero": "SP123456",
        "uf": "SP",
        "situacao": "REGULAR"
      }
    ],
    "emails": ["joao.silva@email.com"],
    "email": "joao.silva@email.com",
    "ddd_celular": "11",
    "numero_celular": "987654321",
    "ddd_residencial": "11",
    "numero_residencial": "32165498",
    "ddd_comercial": "11",
    "numero_comercial": "32165499",
    "endereco_id": 456,
    "dados_anteriores": null,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-02T00:00:00Z"
  },
  "criado": false
}
```

**Section sources**
- [route.ts](file://app/api/representantes/upsert/route.ts#L77-L121)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L536-L583)

## Specialized Search Endpoints

### GET /api/representantes/buscar/por-cpf/{cpf} - Search by CPF

Retrieves a representative by their CPF number.

**Request**
- Method: GET
- URL: `/api/representantes/buscar/por-cpf/{cpf}`
- Authentication: Required
- Path Parameter:
  - `cpf`: CPF number (with or without formatting)

**Response Codes**
- 200 OK: Representative found
- 400 Bad Request: CPF not provided
- 401 Unauthorized: Authentication required
- 404 Not Found: Representative not found
- 500 Internal Server Error: Server error occurred

**Response Example (200)**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "cpf": "12345678901",
    "nome": "João Silva",
    "sexo": "M",
    "tipo": "ADVOGADO",
    "oabs": [
      {
        "numero": "SP123456",
        "uf": "SP",
        "situacao": "REGULAR"
      }
    ],
    "emails": ["joao.silva@email.com"],
    "email": "joao.silva@email.com",
    "ddd_celular": "11",
    "numero_celular": "987654321",
    "ddd_residencial": "11",
    "numero_residencial": "32165498",
    "ddd_comercial": "11",
    "numero_comercial": "32165499",
    "endereco_id": 456,
    "dados_anteriores": null,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

**Section sources**
- [route.ts](file://app/api/representantes/buscar/por-cpf/[cpf]/route.ts#L37-L83)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L354-L367)

### GET /api/representantes/buscar/por-cnpj/{cnpj} - Search by CNPJ

This endpoint always returns 404 as representatives are always individuals (physical persons) and do not have CNPJs.

**Request**
- Method: GET
- URL: `/api/representantes/buscar/por-cnpj/{cnpj}`
- Authentication: Required
- Path Parameter:
  - `cnpj`: CNPJ number (ignored)

**Response Codes**
- 404 Not Found: Representatives do not have CNPJs
- 401 Unauthorized: Authentication required
- 500 Internal Server Error: Server error occurred

**Response Example (404)**
```json
{
  "error": "Representantes são sempre pessoas físicas e não possuem CNPJ. Use a busca por CPF."
}
```

**Section sources**
- [route.ts](file://app/api/representantes/buscar/por-cnpj/[cnpj]/route.ts#L33-L60)

### GET /api/representantes/buscar/por-nome/{nome} - Search by Name

Retrieves representatives whose names contain the specified search term.

**Request**
- Method: GET
- URL: `/api/representantes/buscar/por-nome/{nome}`
- Authentication: Required
- Path Parameter:
  - `nome`: Name or partial name to search for

**Response Codes**
- 200 OK: List of matching representatives
- 400 Bad Request: Name not provided
- 401 Unauthorized: Authentication required
- 500 Internal Server Error: Server error occurred

**Response Example (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "cpf": "12345678901",
      "nome": "João Silva",
      "sexo": "M",
      "tipo": "ADVOGADO",
      "oabs": [
        {
          "numero": "SP123456",
          "uf": "SP",
          "situacao": "REGULAR"
        }
      ],
      "emails": ["joao.silva@email.com"],
      "email": "joao.silva@email.com",
      "ddd_celular": "11",
      "numero_celular": "987654321",
      "ddd_residencial": "11",
      "numero_residencial": "32165498",
      "ddd_comercial": "11",
      "numero_comercial": "32165499",
      "endereco_id": 456,
      "dados_anteriores": null,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

**Section sources**
- [route.ts](file://app/api/representantes/buscar/por-nome/[nome]/route.ts#L37-L77)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L388-L413)

### GET /api/representantes/oab/{numero_oab} - Search by OAB Number

Retrieves all representatives with a specific OAB number.

**Request**
- Method: GET
- URL: `/api/representantes/oab/{numero_oab}`
- Authentication: Required
- Path Parameter:
  - `numero_oab`: OAB number (with or without state code)
- Query Parameters:
  - `uf`: Filter by state code

**Response Codes**
- 200 OK: List of representatives with the OAB number
- 400 Bad Request: OAB number not provided
- 401 Unauthorized: Authentication required
- 500 Internal Server Error: Server error occurred

**Response Example (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "cpf": "12345678901",
      "nome": "João Silva",
      "sexo": "M",
      "tipo": "ADVOGADO",
      "oabs": [
        {
          "numero": "SP123456",
          "uf": "SP",
          "situacao": "REGULAR"
        }
      ],
      "emails": ["joao.silva@email.com"],
      "email": "joao.silva@email.com",
      "ddd_celular": "11",
      "numero_celular": "987654321",
      "ddd_residencial": "11",
      "numero_residencial": "32165498",
      "ddd_comercial": "11",
      "numero_comercial": "32165499",
      "endereco_id": 456,
      "dados_anteriores": null,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Section sources**
- [route.ts](file://app/api/representantes/oab/[numero_oab]/route.ts#L65-L104)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L420-L452)

### GET /api/representantes/processo - Search by Process

This endpoint is currently disabled as it requires refactoring to work with the new data model where representatives are no longer directly linked to processes.

**Request**
- Method: GET
- URL: `/api/representantes/processo`
- Authentication: Required
- Query Parameters:
  - `numero_processo`: Process number
  - `trt`: Regional Labor Court
  - `grau`: Process degree (1 or 2)

**Response Codes**
- 501 Not Implemented: Endpoint temporarily disabled
- 401 Unauthorized: Authentication required
- 500 Internal Server Error: Server error occurred

**Response Example (501)**
```json
{
  "success": false,
  "error": "Endpoint temporariamente desabilitado - necessita refatoração"
}
```

**Section sources**
- [route.ts](file://app/api/representantes/processo/route.ts#L62-L87)

## Data Models

### Representante Interface

The core data model for representatives in the Sinesys system.

```typescript
interface Representante {
  id: number;
  cpf: string;
  nome: string;
  sexo: string | null;
  tipo: string | null;
  oabs: InscricaoOAB[];
  emails: string[] | null;
  email: string | null;
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_residencial: string | null;
  numero_residencial: string | null;
  ddd_comercial: string | null;
  numero_comercial: string | null;
  endereco_id: number | null;
  dados_anteriores: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}
```

**Properties**
- `id`: Unique identifier for the representative
- `cpf`: CPF number (Brazilian individual taxpayer registry)
- `nome`: Full name of the representative
- `sexo`: Gender (M/F or null)
- `tipo`: Type of representative (ADVOGADO, PROCURADOR, etc.)
- `oabs`: Array of OAB (Brazilian Bar Association) registrations
- `emails`: Array of email addresses
- `email`: Primary email address
- `ddd_celular`: Area code for mobile phone
- `numero_celular`: Mobile phone number
- `ddd_residencial`: Area code for residential phone
- `numero_residencial`: Residential phone number
- `ddd_comercial`: Area code for commercial phone
- `numero_comercial`: Commercial phone number
- `endereco_id`: Foreign key to address record
- `dados_anteriores`: Historical data from previous versions
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Section sources**
- [representantes.ts](file://types/domain/representantes.ts#L45-L65)
- [representantes-types.ts](file://backend/types/representantes/representantes-types.ts#L67-L96)

### InscricaoOAB Interface

Represents an OAB (Brazilian Bar Association) registration for a representative.

```typescript
interface InscricaoOAB {
  numero: string;
  uf: string;
  situacao: SituacaoOAB | string;
}
```

**Properties**
- `numero`: OAB registration number (includes state code, e.g., "SP123456")
- `uf`: Brazilian state code (AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO)
- `situacao`: Registration status (REGULAR, SUSPENSO, CANCELADO, LICENCIADO, FALECIDO)

**Section sources**
- [representantes.ts](file://types/domain/representantes.ts#L35-L39)
- [representantes-types.ts](file://backend/types/representantes/representantes-types.ts#L44-L48)

### CriarRepresentanteParams Interface

Parameters for creating a new representative.

```typescript
interface CriarRepresentanteParams {
  cpf: string;
  nome: string;
  sexo?: string | null;
  tipo?: string | null;
  oabs?: InscricaoOAB[];
  emails?: string[] | null;
  email?: string | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  endereco_id?: number | null;
  dados_anteriores?: Record<string, unknown> | null;
}
```

**Section sources**
- [representantes.ts](file://types/contracts/representantes.ts#L23-L40)
- [representantes-types.ts](file://backend/types/representantes/representantes-types.ts#L115-L135)

### AtualizarRepresentanteParams Interface

Parameters for updating an existing representative.

```typescript
interface AtualizarRepresentanteParams {
  id: number;
  cpf?: string;
  nome?: string;
  sexo?: string | null;
  tipo?: string | null;
  oabs?: InscricaoOAB[];
  emails?: string[] | null;
  email?: string | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  endereco_id?: number | null;
  dados_anteriores?: Record<string, unknown> | null;
}
```

**Section sources**
- [representantes.ts](file://types/contracts/representantes.ts#L45-L63)
- [representantes-types.ts](file://backend/types/representantes/representantes-types.ts#L140-L160)

## Error Handling

The Representatives API implements comprehensive error handling with specific error codes and messages for different scenarios.

### Validation Errors

The API validates all input data and returns appropriate error responses:

- **CPF validation**: Returns "CPF inválido" for malformed CPF numbers
- **Email validation**: Returns "Email inválido" for malformed email addresses
- **OAB validation**: Returns "OAB inválido" for malformed OAB numbers
- **Required fields**: Returns "Campos obrigatórios não informados" when required fields are missing

### Conflict Errors

- **Duplicate CPF**: Returns "Representante já cadastrado com este CPF" when attempting to create a representative with an existing CPF
- **Unique constraint violation**: Handled at the database level with appropriate error mapping

### Not Found Errors

- **Representative not found**: Returns "Representante não encontrado" when attempting to retrieve, update, or delete a non-existent representative
- **ID validation**: Returns "ID inválido" for malformed or invalid IDs

### Authentication Errors

- **Unauthorized access**: Returns "Não autorizado" when authentication is required but not provided or invalid

### Server Errors

- **Internal server errors**: Returns "Erro ao processar operação" or similar messages for unexpected server-side issues

The error handling system uses a consistent response format across all endpoints:

```json
{
  "success": false,
  "error": "Error message"
}
```

**Section sources**
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L182-L199)
- [route.ts](file://app/api/representantes/route.ts#L269-L274)
- [route.ts](file://app/api/representantes/[id]/route.ts#L205-L210)

## Frontend Integration

### RepresentanteCreateDialog Component

The frontend `RepresentanteCreateDialog` component interacts with the Representatives API to create new representative records.

**Workflow**
1. User opens the dialog and enters representative information
2. Component validates input data locally
3. On submission, component calls POST `/api/representantes` endpoint
4. On success, dialog closes and new representative is displayed
5. On error, appropriate error messages are displayed to the user

**Integration Points**
- Uses the `CriarRepresentanteParams` interface for data validation
- Handles 409 Conflict errors by suggesting the user search for existing representatives
- Displays validation errors from the API in real-time

### RepresentanteEditDialog Component

The frontend `RepresentanteEditDialog` component allows users to update existing representative records.

**Workflow**
1. User selects a representative to edit
2. Component retrieves representative data via GET `/api/representantes/{id}`
3. User makes changes to the representative information
4. On submission, component calls PATCH `/api/representantes/{id}` endpoint
5. On success, dialog closes and updated representative is displayed
6. On error, appropriate error messages are displayed to the user

**Integration Points**
- Prevents modification of immutable fields (CPF, ID)
- Uses the `AtualizarRepresentanteParams` interface for data validation
- Handles 404 Not Found errors when the representative has been deleted
- Displays the `dados_anteriores` field to show historical data changes

### Search Components

The frontend implements several search components that utilize the specialized search endpoints:

- **CPF Search**: Uses GET `/api/representantes/buscar/por-cpf/{cpf}` for exact CPF lookups
- **Name Search**: Uses GET `/api/representantes/buscar/por-nome/{nome}` for partial name matching
- **OAB Search**: Uses GET `/api/representantes/oab/{numero_oab}` for OAB-based lookups

These components provide real-time search capabilities with debounced input to optimize API usage.

**Section sources**
- [route.ts](file://app/api/representantes/route.ts)
- [route.ts](file://app/api/representantes/[id]/route.ts)
- [route.ts](file://app/api/representantes/buscar/por-cpf/[cpf]/route.ts)
- [route.ts](file://app/api/representantes/buscar/por-nome/[nome]/route.ts)
- [route.ts](file://app/api/representantes/oab/[numero_oab]/route.ts)

## Business Rules

### OAB Number Validation

The system implements strict validation for OAB numbers:

- Format: Two letters (state code) followed by 3-6 digits (e.g., "SP123456")
- Valid state codes: AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO
- Validation is performed both on the frontend and backend

### Representative Uniqueness

Representatives are uniquely identified by CPF, ensuring data consistency:

- Each CPF can have only one representative record
- Attempts to create duplicates result in a 409 Conflict error
- The upsert endpoint allows idempotent creation/update operations

### Data Consistency

The system maintains data consistency through several mechanisms:

- **Historical tracking**: The `dados_anteriores` field stores previous versions of representative data
- **Address relationships**: The `endereco_id` field maintains a foreign key relationship with the addresses table
- **Process relationships**: Although not currently implemented, the design supports linking representatives to processes through the processo_partes table

### Immutable Fields

Certain fields cannot be modified after creation:

- **CPF**: Cannot be changed to prevent identity confusion
- **ID**: System-generated identifier that remains constant
- **Creation timestamp**: Historical record of when the representative was created

**Section sources**
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L104-L117)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L36-L65)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L270-L273)

## Common Issues and Solutions

### Handling Multiple OAB Numbers

**Issue**: A single representative may have OAB registrations in multiple states.

**Solution**: The system supports multiple OAB registrations through the `oabs` array field. Each registration includes the state code (UF), number, and status. The search functionality allows filtering by specific states.

**Best Practice**: When creating or updating a representative, provide all active OAB registrations to ensure complete representation.

### Managing Representative Conflicts of Interest

**Issue**: The system needs to prevent representatives from acting on both sides of the same legal process.

**Current Status**: This functionality is not fully implemented as the process association endpoint is currently disabled.

**Future Implementation**: Once the processo_partes integration is complete, the system will validate representative assignments to prevent conflicts of interest by checking the polo (active/passive) of all parties in a process.

### Ensuring Data Consistency with Legal Processes

**Issue**: Representative data must remain consistent across all processes they are involved in.

**Solution**: The deduplicated data model ensures that changes to a representative's information (name, contact details, OAB status) are automatically reflected in all processes they are associated with.

**Benefit**: This eliminates the risk of inconsistent data that could occur if each process maintained its own copy of representative information.

### Addressing the Disabled Process Endpoint

**Issue**: The `/api/representantes/processo` endpoint is currently disabled due to the need for refactoring.

**Workaround**: Applications requiring process-based representative lookups should use alternative approaches:
1. Query processes first, then retrieve associated representatives by ID
2. Use the general search endpoint with process-related filters
3. Implement client-side filtering of representatives based on process criteria

**Future Resolution**: The endpoint will be re-enabled once the integration with the processo_partes table is complete, allowing direct querying of representatives by process number, TRT, and degree.

**Section sources**
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L739-L790)
- [route.ts](file://app/api/representantes/processo/route.ts#L73-L78)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L1-L843)