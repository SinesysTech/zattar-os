# Contract Management API

<cite>
**Referenced Files in This Document**   
- [route.ts](file://app/api/contratos/route.ts)
- [route.ts](file://app/api/contratos/[id]/route.ts)
- [route.ts](file://app/api/contratos/[id]/processos/route.ts)
- [route.ts](file://app/api/contratos/[id]/processos/[processoId]/route.ts)
- [criar-contrato.service.ts](file://backend/contratos/services/contratos/criar-contrato.service.ts)
- [atualizar-contrato.service.ts](file://backend/contratos/services/contratos/atualizar-contrato.service.ts)
- [listar-contratos.service.ts](file://backend/contratos/services/contratos/listar-contratos.service.ts)
- [buscar-contrato.service.ts](file://backend/contratos/services/contratos/buscar-contrato.service.ts)
- [gerenciar-processos.service.ts](file://backend/contratos/services/contratos/gerenciar-processos.service.ts)
- [contrato-persistence.service.ts](file://backend/contratos/services/persistence/contrato-persistence.service.ts)
- [contrato-processo-persistence.service.ts](file://backend/contratos/services/persistence/contrato-processo-persistence.service.ts)
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql)
- [12_contrato_processos.sql](file://supabase/schemas/12_contrato_processos.sql)
- [contrato-create-sheet.tsx](file://app/(dashboard)/contratos/components/contrato-create-sheet.tsx)
- [contrato-edit-sheet.tsx](file://app/(dashboard)/contratos/components/contrato-edit-sheet.tsx)
- [contrato-view-sheet.tsx](file://app/(dashboard)/contratos/components/contrato-view-sheet.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [API Endpoints](#api-endpoints)
3. [Request/Response Schemas](#requestresponse-schemas)
4. [Process Association Endpoints](#process-association-endpoints)
5. [Error Handling](#error-handling)
6. [Frontend Integration](#frontend-integration)
7. [Business Rules](#business-rules)
8. [Common Issues and Solutions](#common-issues-and-solutions)

## Introduction
The Contract Management API in the Sinesys system provides comprehensive CRUD operations for managing legal contracts within a law firm environment. This API enables the creation, retrieval, updating, and deletion of contracts, along with the ability to associate contracts with legal processes. The system supports various contract types across different areas of law, with robust validation and business rules enforcement. The API is designed to maintain data integrity while providing flexible querying capabilities for contract management.

**Section sources**
- [route.ts](file://app/api/contratos/route.ts)
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql)

## API Endpoints
The Contract Management API provides RESTful endpoints for managing contracts through standard HTTP methods. All endpoints require authentication via bearer token, session cookie, or service API key.

### GET /api/contratos
Retrieves a paginated list of contracts with optional filtering parameters. The response includes metadata about pagination and total count.

**Query Parameters:**
- `pagina` (integer): Page number (default: 1)
- `limite` (integer): Items per page (default: 50)
- `busca` (string): Search in observations field
- `areaDireito` (string): Filter by legal area (trabalhista, civil, previdenciario, criminal, empresarial, administrativo)
- `tipoContrato` (string): Filter by contract type (ajuizamento, defesa, ato_processual, assessoria, consultoria, extrajudicial, parecer)
- `tipoCobranca` (string): Filter by billing type (pro_exito, pro_labore)
- `status` (string): Filter by contract status (em_contratacao, contratado, distribuido, desistencia)
- `clienteId` (integer): Filter by client ID
- `parteContrariaId` (integer): Filter by opposing party ID
- `responsavelId` (integer): Filter by responsible user ID

### POST /api/contratos
Creates a new contract in the system. The request body must contain required fields for contract creation.

### GET /api/contratos/{id}
Retrieves detailed information about a specific contract by its ID.

### PATCH /api/contratos/{id}
Updates specific fields of an existing contract. This endpoint supports partial updates.

### DELETE /api/contratos/{id}
Removes a contract from the system. (Note: This endpoint is not explicitly shown in the code but would follow REST conventions)

**Section sources**
- [route.ts](file://app/api/contratos/route.ts)
- [route.ts](file://app/api/contratos/[id]/route.ts)

## Request/Response Schemas
The Contract Management API uses standardized request and response schemas for data exchange.

### Request Schema (ContratoDados)
The request body for creating or updating contracts follows this structure:

```json
{
  "areaDireito": "trabalhista",
  "tipoContrato": "ajuizamento",
  "tipoCobranca": "pro_exito",
  "clienteId": 123,
  "poloCliente": "autor",
  "parteContrariaId": 456,
  "parteAutora": [
    {
      "tipo": "cliente",
      "id": 123,
      "nome": "John Doe"
    }
  ],
  "parteRe": [
    {
      "tipo": "parte_contraria",
      "id": 456,
      "nome": "Jane Smith"
    }
  ],
  "qtdeParteAutora": 1,
  "qtdeParteRe": 1,
  "status": "em_contratacao",
  "dataContratacao": "2025-01-15",
  "dataAssinatura": "2025-01-20",
  "dataDistribuicao": "2025-01-25",
  "dataDesistencia": null,
  "responsavelId": 789,
  "observacoes": "Contract notes and observations"
}
```

**Required Fields:**
- `areaDireito`: Legal area of the contract
- `tipoContrato`: Type of legal contract
- `tipoCobranca`: Billing type (success fee or labor fee)
- `clienteId`: Client identifier
- `poloCliente`: Client's legal position (plaintiff or defendant)

### Response Schema
The API returns a standardized response format for all successful operations:

```json
{
  "success": true,
  "data": {
    // Contract data or operation result
  }
}
```

For contract retrieval operations, the `data` field contains the complete contract information with all properties.

**Section sources**
- [contrato-persistence.service.ts](file://backend/contratos/services/persistence/contrato-persistence.service.ts)
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql)

## Process Association Endpoints
The system provides dedicated endpoints for managing the association between contracts and legal processes.

### GET /api/contratos/{id}/processos
Retrieves all processes associated with a specific contract. Supports pagination with `pagina` and `limite` query parameters.

### POST /api/contratos/{id}/processos
Associates an existing process with a contract. The request body must include the `processoId` field.

**Request Body:**
```json
{
  "processoId": 987654321
}
```

### DELETE /api/contratos/{id}/processos/{processoId}
Removes the association between a contract and a specific process.

These endpoints ensure that contracts can be linked to one or more legal processes in the system, maintaining the relationship between contractual agreements and their corresponding legal proceedings.

**Section sources**
- [route.ts](file://app/api/contratos/[id]/processos/route.ts)
- [route.ts](file://app/api/contratos/[id]/processos/[processoId]/route.ts)
- [gerenciar-processos.service.ts](file://backend/contratos/services/contratos/gerenciar-processos.service.ts)

## Error Handling
The API implements comprehensive error handling with appropriate HTTP status codes and descriptive error messages.

### Common Error Responses
- **400 Bad Request**: Invalid or missing data in the request
  - Missing required fields
  - Invalid data types
  - Validation failures
- **401 Unauthorized**: Authentication failure
  - Missing or invalid authentication credentials
- **404 Not Found**: Resource not found
  - Contract ID does not exist
  - Process ID does not exist
  - Association not found
- **500 Internal Server Error**: Unexpected server error
  - Database connection issues
  - Unhandled exceptions

### Validation Rules
The backend enforces several validation rules:
- Required fields must be present
- Client and opposing party IDs must reference existing records
- Date fields must be valid ISO date strings
- Enumerated fields must contain valid values
- JSONB arrays for parties must have valid structure

The system returns specific error messages to help clients understand and correct issues with their requests.

**Section sources**
- [contrato-persistence.service.ts](file://backend/contratos/services/persistence/contrato-persistence.service.ts)
- [criar-contrato.service.ts](file://backend/contratos/services/contratos/criar-contrato.service.ts)
- [atualizar-contrato.service.ts](file://backend/contratos/services/contratos/atualizar-contrato.service.ts)

## Frontend Integration
The frontend components interact with the Contract Management API through the defined endpoints, providing a user-friendly interface for contract management.

### ContratoCreateSheet
This component handles the creation of new contracts. It collects all required contract information and submits it to the POST /api/contratos endpoint. The form validates required fields before submission and handles success and error responses appropriately.

### ContratoEditSheet
Used for updating existing contracts, this component retrieves contract data via GET /api/contratos/{id} and submits updates through PATCH /api/contratos/{id}. It supports partial updates, sending only modified fields to the server.

### ContratoViewSheet
Provides a read-only view of contract details, retrieving data from GET /api/contratos/{id}. It also displays associated processes by calling GET /api/contratos/{id}/processos.

These components follow a consistent pattern of API interaction, handling authentication, request formatting, response processing, and error display to provide a seamless user experience.

**Section sources**
- [contrato-create-sheet.tsx](file://app/(dashboard)/contratos/components/contrato-create-sheet.tsx)
- [contrato-edit-sheet.tsx](file://app/(dashboard)/contratos/components/contrato-edit-sheet.tsx)
- [contrato-view-sheet.tsx](file://app/(dashboard)/contratos/components/contrato-view-sheet.tsx)

## Business Rules
The Contract Management system enforces several business rules to maintain data integrity and consistency.

### Data Validation
- **Required Fields**: Area of law, contract type, billing type, client ID, and client's legal position are mandatory
- **Reference Integrity**: Client and opposing party IDs must reference existing records in their respective tables
- **Date Validation**: Date fields are validated as proper ISO date strings
- **Enum Validation**: Fields with predefined options accept only valid values

### Automatic Calculations
- **Party Quantities**: The system automatically calculates the number of plaintiff and defendant parties based on the JSONB arrays, unless explicitly overridden
- **Timestamps**: Creation and update timestamps are automatically managed by the database
- **Status Management**: Contract status follows a defined workflow with appropriate validation

### Data Consistency
- **Cache Invalidation**: After create, update, or delete operations, the system invalidates relevant caches to ensure data consistency
- **Audit Trail**: The database maintains a record of previous data states for audit purposes
- **Referential Integrity**: Database constraints ensure that related records maintain consistency

These business rules ensure that contract data remains accurate, consistent, and reliable throughout its lifecycle in the system.

**Section sources**
- [contrato-persistence.service.ts](file://backend/contratos/services/persistence/contrato-persistence.service.ts)
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql)

## Common Issues and Solutions
This section addresses common challenges encountered when working with the Contract Management API.

### Maintaining Contract-Process Consistency
When associating processes with contracts, ensure that:
- The process ID exists in the acervo table
- The contract ID exists in the contratos table
- Handle the response appropriately when associations already exist or when removal attempts fail

### Handling Contract Renewals
For contract renewals, consider:
- Creating a new contract record rather than modifying the original
- Preserving the history of previous contracts
- Linking renewal contracts to the same processes when appropriate
- Updating client and opposing party information if changed

### Managing Contract-Related Financial Obligations
When dealing with financial aspects:
- Ensure the billing type (pro_exito or pro_labore) is correctly set
- Verify that responsible users are properly assigned for accountability
- Maintain accurate dates for billing and payment schedules
- Use observations field to document special financial terms

### Performance Considerations
For optimal performance:
- Use filtering parameters to limit result sets
- Implement client-side caching for frequently accessed contracts
- Paginate large result sets to avoid performance degradation
- Use specific field queries when only certain data is needed

These guidelines help ensure smooth operation and data integrity when working with the Contract Management API.

**Section sources**
- [contrato-persistence.service.ts](file://backend/contratos/services/persistence/contrato-persistence.service.ts)
- [gerenciar-processos.service.ts](file://backend/contratos/services/contratos/gerenciar-processos.service.ts)
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql)
- [12_contrato_processos.sql](file://supabase/schemas/12_contrato_processos.sql)