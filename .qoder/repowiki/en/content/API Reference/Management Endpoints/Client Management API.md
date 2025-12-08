# Client Management API

<cite>
**Referenced Files in This Document**   
- [route.ts](file://app/api/clientes/route.ts)
- [route.ts](file://app/api/clientes/[id]/route.ts)
- [route.ts](file://app/api/clientes/buscar/por-cpf/[cpf]/route.ts)
- [route.ts](file://app/api/clientes/buscar/por-cnpj/[cnpj]/route.ts)
- [route.ts](file://app/api/clientes/buscar/por-nome/[nome]/route.ts)
- [route.ts](file://app/api/clientes/buscar/sugestoes/route.ts)
- [criar-cliente.service.ts](file://backend/clientes/services/clientes/criar-cliente.service.ts)
- [atualizar-cliente.service.ts](file://backend/clientes/services/clientes/atualizar-cliente.service.ts)
- [listar-clientes.service.ts](file://backend/clientes/services/clientes/listar-clientes.service.ts)
- [buscar-cliente.service.ts](file://backend/clientes/services/clientes/buscar-cliente.service.ts)
- [buscar-cliente-por-nome.service.ts](file://backend/clientes/services/clientes/buscar-cliente-por-nome.service.ts)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts)
- [clientes-types.ts](file://types/contracts/partes/clientes-types.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [API Endpoints](#api-endpoints)
3. [Request/Response Schemas](#requestresponse-schemas)
4. [Authentication and Permissions](#authentication-and-permissions)
5. [Data Validation Rules](#data-validation-rules)
6. [Error Handling](#error-handling)
7. [Frontend Integration](#frontend-integration)
8. [Audit Logging and Data Consistency](#audit-logging-and-data-consistency)
9. [Common Issues and Solutions](#common-issues-and-solutions)

## Introduction

The Client Management API in the Sinesys system provides comprehensive CRUD operations for managing client data within the legal practice management platform. This API enables the creation, retrieval, updating, and deletion of client records, with specialized endpoints for searching clients by CPF (individual taxpayer registry), CNPJ (corporate taxpayer registry), or name. The system supports both individual (PF) and corporate (PJ) clients with distinct data models and validation rules.

The API follows RESTful principles with clear endpoint patterns and standardized response formats. It integrates with the Supabase backend for data persistence and Redis for caching frequently accessed client data. The architecture separates concerns through service layers that handle business logic, persistence operations, and API routing, ensuring maintainability and scalability.

**Section sources**
- [route.ts](file://app/api/clientes/route.ts#L1-L267)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L1-L1038)

## API Endpoints

The Client Management API provides a comprehensive set of endpoints for all client-related operations. These endpoints follow a consistent pattern and support various HTTP methods for different operations.

### Base Endpoints

#### POST /api/clientes/
Creates a new client in the system. This endpoint accepts a JSON payload with client details and returns the created client object with a 201 status code on success.

#### GET /api/clientes/
Retrieves a paginated list of clients with optional filtering parameters. Supports pagination, search, and filtering by client type (PF/PJ) and status.

#### GET /api/clientes/{id}
Retrieves a specific client by their unique identifier. Returns the complete client record including all personal and contact information.

#### PATCH /api/clientes/{id}
Partially updates an existing client record. Accepts a JSON payload with only the fields to be updated, preserving existing values for unspecified fields.

#### DELETE /api/clientes/{id}
Removes a client from the system by their ID. This operation is permanent and cannot be undone.

### Search Endpoints

#### GET /api/clientes/buscar/por-cpf/{cpf}
Retrieves a client by their CPF number. The CPF can be provided with or without formatting (dots and dashes). Returns a 404 status if no client is found with the specified CPF.

#### GET /api/clientes/buscar/por-cnpj/{cnpj}
Retrieves a client by their CNPJ number. The CNPJ can be provided with or without formatting (dots, slashes, and dashes). Returns a 404 status if no client is found with the specified CNPJ.

#### GET /api/clientes/buscar/por-nome/{nome}
Searches for clients whose names contain the specified search term. Performs a case-insensitive partial match search and returns all matching clients.

#### GET /api/clientes/buscar/sugestoes
Provides autocomplete suggestions for client names. Used in search inputs to provide real-time suggestions as users type. Accepts query parameters for search term and limit.

**Section sources**
- [route.ts](file://app/api/clientes/route.ts#L1-L267)
- [route.ts](file://app/api/clientes/[id]/route.ts#L1-L221)
- [route.ts](file://app/api/clientes/buscar/por-cpf/[cpf]/route.ts#L1-L85)
- [route.ts](file://app/api/clientes/buscar/por-cnpj/[cnpj]/route.ts#L1-L85)
- [route.ts](file://app/api/clientes/buscar/por-nome/[nome]/route.ts#L1-L78)
- [route.ts](file://app/api/clientes/buscar/sugestoes/route.ts#L1-L29)

## Request/Response Schemas

This section details the request and response schemas for all Client Management API endpoints.

### Request Payload Structure

The request payload for creating a client (POST /api/clientes/) requires specific fields based on the client type (PF or PJ).

```json
{
  "tipo_pessoa": "pf",
  "nome": "John Doe",
  "nome_social_fantasia": "Johnny",
  "cpf": "123.456.789-00",
  "rg": "12.345.678-9",
  "data_nascimento": "1980-01-01",
  "genero": "masculino",
  "estado_civil": "solteiro",
  "nacionalidade": "brasileira",
  "naturalidade": "São Paulo/SP",
  "email": "john@example.com",
  "telefonePrimario": "(11) 91234-5678",
  "telefoneSecundario": "(11) 3456-7890",
  "endereco": {
    "logradouro": "Rua Exemplo",
    "numero": "123",
    "complemento": "Apto 101",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "pais": "Brasil",
    "cep": "01000-000"
  },
  "observacoes": "Cliente VIP"
}
```

For corporate clients (PJ), the required fields differ:

```json
{
  "tipo_pessoa": "pj",
  "nome": "Empresa Exemplo Ltda",
  "nome_social_fantasia": "Exemplo Corp",
  "cnpj": "12.345.678/0001-90",
  "inscricao_estadual": "123.456.789.123",
  "email": "contato@empresa.com",
  "telefonePrimario": "(11) 3456-7890",
  "endereco": { /* same structure as above */ },
  "observacoes": "Cliente corporativo"
}
```

### Response Format

All successful API responses follow a consistent format with a success flag and data payload:

```json
{
  "success": true,
  "data": { /* client object */ }
}
```

The client object contains all properties stored in the system, with fields specific to the client type (PF or PJ):

```json
{
  "id": 123,
  "tipo_pessoa": "pf",
  "nome": "John Doe",
  "nome_social_fantasia": "Johnny",
  "cpf": "12345678900",
  "rg": "123456789",
  "data_nascimento": "1980-01-01T00:00:00Z",
  "genero": "masculino",
  "estado_civil": "solteiro",
  "nacionalidade": "brasileira",
  "sexo": null,
  "nome_genitora": null,
  "naturalidade_id_pje": null,
  "naturalidade_municipio": null,
  "naturalidade_estado_id_pje": null,
  "naturalidade_estado_sigla": null,
  "uf_nascimento_id_pje": null,
  "uf_nascimento_sigla": null,
  "uf_nascimento_descricao": null,
  "pais_nascimento_id_pje": null,
  "pais_nascimento_codigo": null,
  "pais_nascimento_descricao": null,
  "escolaridade_codigo": null,
  "situacao_cpf_receita_id": null,
  "situacao_cpf_receita_descricao": null,
  "pode_usar_celular_mensagem": null,
  "emails": ["john@example.com"],
  "ddd_celular": "11",
  "numero_celular": "912345678",
  "ddd_residencial": "11",
  "numero_residencial": "34567890",
  "ddd_comercial": null,
  "numero_comercial": null,
  "tipo_documento": null,
  "status_pje": null,
  "situacao_pje": null,
  "login_pje": null,
  "autoridade": null,
  "observacoes": "Cliente VIP",
  "dados_anteriores": null,
  "endereco_id": 456,
  "ativo": true,
  "created_by": 789,
  "created_at": "2025-01-01T10:00:00Z",
  "updated_at": "2025-01-01T10:00:00Z"
}
```

For corporate clients, the response includes PJ-specific fields:

```json
{
  "id": 123,
  "tipo_pessoa": "pj",
  "nome": "Empresa Exemplo Ltda",
  "nome_social_fantasia": "Exemplo Corp",
  "cnpj": "12345678000190",
  "inscricao_estadual": "123456789123",
  "data_abertura": "2020-01-01T00:00:00Z",
  "data_fim_atividade": null,
  "orgao_publico": null,
  "tipo_pessoa_codigo_pje": null,
  "tipo_pessoa_label_pje": null,
  "tipo_pessoa_validacao_receita": null,
  "ds_tipo_pessoa": null,
  "situacao_cnpj_receita_id": null,
  "situacao_cnpj_receita_descricao": null,
  "ramo_atividade": null,
  "cpf_responsavel": null,
  "oficial": null,
  "ds_prazo_expediente_automatico": null,
  "porte_codigo": null,
  "porte_descricao": null,
  "ultima_atualizacao_pje": null,
  /* common fields */
}
```

**Section sources**
- [route.ts](file://app/api/clientes/route.ts#L73-L163)
- [route.ts](file://app/api/clientes/[id]/route.ts#L55-L98)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L81-L168)

## Authentication and Permissions

The Client Management API requires authentication for all endpoints to ensure data security and privacy. The system supports multiple authentication methods to accommodate different client types and use cases.

### Authentication Methods

The API supports three authentication methods as specified in the Swagger documentation:

- **Bearer Token (bearerAuth)**: Standard JWT token authentication for user sessions
- **Session Cookie (sessionAuth)**: Traditional session-based authentication
- **Service API Key (serviceApiKey)**: For server-to-server communication and integration services

All endpoints require one of these authentication methods to be present in the request. Unauthenticated requests receive a 401 Unauthorized response.

### Authorization Requirements

Access to client data is controlled through a permission system that verifies the authenticated user's rights to perform specific operations. The `authenticateRequest` function handles both authentication and basic authorization checks.

When creating or updating clients, the system records the `created_by` field with the ID of the authenticated user who performed the operation. This enables audit tracking and ensures accountability for data changes.

The API endpoints are designed to prevent unauthorized access to client data. Users can only access client records according to their permission levels, with appropriate role-based access control enforced at the service layer.

**Section sources**
- [route.ts](file://app/api/clientes/route.ts#L18-L22)
- [route.ts](file://app/api/clientes/[id]/route.ts#L18-L22)
- [route.ts](file://app/api/clientes/buscar/por-cpf/[cpf]/route.ts#L16-L20)
- [route.ts](file://app/api/clientes/buscar/por-cnpj/[cnpj]/route.ts#L16-L20)
- [api-auth.ts](file://backend/auth/api-auth.ts)

## Data Validation Rules

The Client Management API enforces strict data validation rules to ensure data integrity and consistency across the system.

### Required Fields

All client records require the following fields:

- **tipo_pessoa**: Must be either "pf" (individual) or "pj" (corporate)
- **nome**: Full name for individuals or company name for corporations

Additional required fields depend on the client type:

For individuals (PF):
- **cpf**: Must be provided and valid (11 digits)

For corporations (PJ):
- **cnpj**: Must be provided and valid (14 digits)

### Field Validation

The system validates various fields according to specific rules:

**CPF Validation**: Must contain exactly 11 digits when normalized (removing formatting characters). The system accepts CPF with or without formatting (dots and dashes) but stores it in normalized form.

**CNPJ Validation**: Must contain exactly 14 digits when normalized (removing formatting characters). The system accepts CNPJ with or without formatting but stores it in normalized form.

**Email Validation**: Must match the standard email format (local@domain.tld). Multiple emails can be provided as an array.

**Name Validation**: Must not be empty and is trimmed of whitespace. The search functionality performs case-insensitive partial matching on the name field.

### Uniqueness Constraints

The system enforces uniqueness constraints on identifying documents:

- Each CPF can only be associated with one active client record
- Each CNPJ can only be associated with one active client record

Attempts to create a client with a duplicate CPF or CNPJ will result in a 400 Bad Request response with an appropriate error message.

The validation occurs at both the application and database levels, with unique constraints defined in the database schema to prevent duplicate entries even if application-level validation is bypassed.

**Section sources**
- [criar-cliente.service.ts](file://backend/clientes/services/clientes/criar-cliente.service.ts#L26-L62)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L173-L334)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L43-L54)

## Error Handling

The Client Management API provides comprehensive error handling with descriptive messages to help clients understand and resolve issues.

### Error Response Format

All error responses follow a consistent format:

```json
{
  "error": "Descriptive error message"
}
```

The HTTP status code indicates the general category of error, while the message provides specific details about the issue.

### Common Error Codes

#### 400 Bad Request
Indicates invalid or incomplete request data. Common causes include:
- Missing required fields (tipo_pessoa, nome)
- Invalid CPF or CNPJ format
- Invalid email format
- Duplicate CPF or CNPJ

#### 401 Unauthorized
Returned when the request lacks valid authentication credentials. This occurs when:
- No authentication token is provided
- The authentication token is expired or invalid
- The session has expired

#### 404 Not Found
Indicates that a requested resource does not exist. This occurs when:
- Attempting to retrieve a client by ID that doesn't exist
- Searching for a client by CPF that is not registered
- Searching for a client by CNPJ that is not registered

#### 500 Internal Server Error
Indicates an unexpected error occurred on the server. This could be due to:
- Database connectivity issues
- Unexpected exceptions in the service layer
- System resource constraints

### Specific Error Messages

The API returns specific error messages to help diagnose issues:

- "Tipo de pessoa é obrigatório" - Missing tipo_pessoa field
- "Nome é obrigatório" - Missing nome field
- "CPF é obrigatório para pessoa física" - CPF missing for individual client
- "CNPJ é obrigatório para pessoa jurídica" - CNPJ missing for corporate client
- "CPF inválido (deve conter 11 dígitos)" - CPF format error
- "CNPJ inválido (deve conter 14 dígitos)" - CNPJ format error
- "Cliente com este CPF já cadastrado" - Duplicate CPF
- "Cliente com este CNPJ já cadastrado" - Duplicate CNPJ
- "Cliente não encontrado" - Client ID, CPF, or CNPJ not found

**Section sources**
- [route.ts](file://app/api/clientes/route.ts#L164-L171)
- [route.ts](file://app/api/clientes/[id]/route.ts#L99-L108)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L297-L307)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L486-L496)

## Frontend Integration

The Client Management API is integrated with frontend components that provide user interfaces for creating and editing client records.

### ClientCreateDialog Component

The `ClientCreateDialog` component in the frontend interacts with the POST /api/clientes/ endpoint to create new clients. It collects all required fields through a form interface and submits the data to the API when the user clicks "Save".

The component handles validation feedback from the API, displaying error messages when validation fails (e.g., duplicate CPF, invalid format). It also manages the authentication state, ensuring users are logged in before attempting to create clients.

### ClienteEditDialog Component

The `ClienteEditDialog` component allows users to update existing client information by interacting with the PATCH /api/clientes/{id} endpoint. It pre-populates the form with the current client data retrieved from the GET /api/clientes/{id} endpoint.

When the user makes changes and clicks "Update", the component sends only the modified fields to minimize data transfer and reduce the risk of overwriting concurrent changes.

### Search Integration

Both components integrate with the search endpoints to provide autocomplete functionality and prevent duplicate client creation. When users begin typing a name, the system calls the /api/clientes/buscar/por-nome/{nome} endpoint to find existing clients with similar names.

For clients identified by CPF or CNPJ, the components use the respective search endpoints to verify if a client already exists before allowing creation of a new record.

**Section sources**
- [route.ts](file://app/api/clientes/route.ts#L73-L163)
- [route.ts](file://app/api/clientes/[id]/route.ts#L55-L98)
- [route.ts](file://app/api/clientes/buscar/por-nome/[nome]/route.ts#L8-L36)

## Audit Logging and Data Consistency

The Client Management API includes mechanisms for audit logging and maintaining data consistency across related entities.

### Audit Logging

The system automatically tracks changes to client records through the `dados_anteriores` field in the clientes table. When a client is updated via the PATCH endpoint, the service layer captures the complete state of the client before the update and stores it in this field.

This provides a simple but effective audit trail that allows administrators to see what changes were made to a client record over time. The `updated_at` timestamp is automatically updated on every modification, providing temporal context for changes.

### Data Consistency

The API maintains data consistency through several mechanisms:

**Caching Strategy**: The system uses Redis to cache frequently accessed client data, with appropriate cache invalidation when records are created, updated, or deleted. The `invalidateClientesCache()` function is called after all write operations to ensure cache coherence.

**Database Constraints**: The PostgreSQL database enforces data integrity through constraints, including unique indexes on CPF and CNPJ fields, foreign key relationships, and data type constraints.

**Transaction Management**: Although not explicitly shown in the code, the Supabase client likely handles operations within transactions to ensure atomicity, especially when updating related entities.

**Soft Deletes**: The `ativo` field (boolean) suggests a soft delete pattern where clients are marked as inactive rather than being permanently removed, preserving historical data and relationships.

**Section sources**
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L368)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L310)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L499)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L104)

## Common Issues and Solutions

This section addresses common issues encountered when working with the Client Management API and provides solutions.

### CPF/CNPJ Validation Issues

**Issue**: Users report that valid CPF or CNPJ numbers are rejected by the API.
**Solution**: The system normalizes CPF and CNPJ by removing formatting characters (dots, dashes, slashes) and validating the remaining digits. Ensure that the input contains exactly 11 digits for CPF or 14 digits for CNPJ after normalization. The API accepts formatted input but validates the normalized version.

### Data Consistency Across Related Entities

**Issue**: Client updates don't reflect in related processes or contracts.
**Solution**: The system maintains separate relationships through the processo_partes table. When a client is updated, related processes continue to reference the same client ID. Any display issues should be addressed in the frontend components that render process details, ensuring they fetch the latest client data from the API.

### Handling Client Relationships

**Issue**: Difficulty managing clients who are also parties in legal processes.
**Solution**: The system uses a flexible relationship model through the processo_partes table, which can associate any client (from the clientes table) with any process. The papel_processual field specifies the role (e.g., "CLIENTE", "REU", "TESTEMUNHA"). This allows the same client to have different roles in different processes.

### Performance Considerations

**Issue**: Slow response times when listing clients with large datasets.
**Solution**: The API implements pagination with default limits to prevent performance degradation. Use the pagina and limite parameters to control the number of results. For large datasets, implement client-side pagination and leverage the caching layer, which stores individual client records for 20 minutes.

### Duplicate Client Prevention

**Issue**: Accidental creation of duplicate client records.
**Solution**: The system enforces uniqueness constraints on CPF and CNPJ at the database level. Before creating a new client, use the search endpoints (/api/clientes/buscar/por-cpf/[cpf] or /api/clientes/buscar/por-cnpj/[cnpj]) to check if a client already exists. The frontend components should implement this check automatically when users enter CPF or CNPJ information.

**Section sources**
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L43-L54)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L297-L307)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L486-L496)
- [cliente-persistence.service.ts](file://backend/clientes/services/persistence/cliente-persistence.service.ts#L524-L556)