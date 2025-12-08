# Opposing Parties API

<cite>
**Referenced Files in This Document**   
- [route.ts](file://app/api/partes-contrarias/route.ts)
- [route.ts](file://app/api/partes-contrarias/[id]/route.ts)
- [por-cpf/[cpf]/route.ts](file://app/api/partes-contrarias/buscar/por-cpf/[cpf]/route.ts)
- [por-cnpj/[cnpj]/route.ts](file://app/api/partes-contrarias/buscar/por-cnpj/[cnpj]/route.ts)
- [por-nome/[nome]/route.ts](file://app/api/partes-contrarias/buscar/por-nome/[nome]/route.ts)
- [criar-parte-contraria.service.ts](file://backend/partes-contrarias/services/partes-contrarias/criar-parte-contraria.service.ts)
- [atualizar-parte-contraria.service.ts](file://backend/partes-contrarias/services/partes-contrarias/atualizar-parte-contraria.service.ts)
- [buscar-parte-contraria.service.ts](file://backend/partes-contrarias/services/partes-contrarias/buscar-parte-contraria.service.ts)
- [buscar-parte-contraria-por-nome.service.ts](file://backend/partes-contrarias/services/partes-contrarias/buscar-parte-contraria-por-nome.service.ts)
- [listar-partes-contrarias.service.ts](file://backend/partes-contrarias/services/partes-contrarias/listar-partes-contrarias.service.ts)
- [parte-contraria-persistence.service.ts](file://backend/partes-contrarias/services/persistence/parte-contraria-persistence.service.ts)
- [10_partes_contrarias.sql](file://supabase/schemas/10_partes_contrarias.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [API Endpoints](#api-endpoints)
3. [Request/Response Schemas](#requestresponse-schemas)
4. [Data Validation Rules](#data-validation-rules)
5. [Search Endpoints](#search-endpoints)
6. [Error Handling](#error-handling)
7. [Frontend Integration](#frontend-integration)
8. [Relationships with Legal Processes](#relationships-with-legal-processes)
9. [Data Consistency and Best Practices](#data-consistency-and-best-practices)

## Introduction

The Opposing Parties Management API in the Sinesys system provides comprehensive CRUD operations for managing opposing parties in legal processes. The API endpoints under `/api/partes-contrarias/` enable the creation, retrieval, updating, and deletion of opposing party records, with specialized search functionality for efficient data access. The system supports both physical (PF) and legal (PJ) entities, with extensive data fields for comprehensive party information.

The API is designed to integrate seamlessly with the frontend components like ParteContrariaCreateDialog and ParteContrariaEditDialog, providing a robust interface for legal professionals to manage party information. The backend enforces strict data validation rules to ensure data integrity and consistency across the system.

**Section sources**
- [route.ts](file://app/api/partes-contrarias/route.ts#L1-L242)
- [10_partes_contrarias.sql](file://supabase/schemas/10_partes_contrarias.sql#L1-L139)

## API Endpoints

The Opposing Parties Management API provides a comprehensive set of endpoints for managing opposing parties in legal processes. These endpoints follow RESTful conventions and support standard HTTP methods for CRUD operations.

### Main Endpoints

#### GET /api/partes-contrarias/
Retrieves a paginated list of opposing parties with optional filtering parameters. This endpoint supports pagination, search, and filtering by party type and status.

**Query Parameters:**
- `pagina` (integer): Page number (default: 1)
- `limite` (integer): Items per page (default: 50)
- `busca` (string): Search term for name, fantasy name, CPF, CNPJ, or email
- `tipoPessoa` (string): Filter by party type (pf for physical, pj for legal)
- `ativo` (boolean): Filter by active/inactive status
- `incluir_endereco` (boolean): Include address data via JOIN (default: false)

#### POST /api/partes-contrarias/
Creates a new opposing party in the system. The request body must include required fields such as party type and name.

#### GET /api/partes-contrarias/{id}
Retrieves detailed information about a specific opposing party by ID.

#### PATCH /api/partes-contrarias/{id}
Updates specific fields of an existing opposing party. This endpoint supports partial updates.

#### DELETE /api/partes-contrarias/{id}
Removes an opposing party from the system. (Note: Implementation details not visible in current codebase)

**Section sources**
- [route.ts](file://app/api/partes-contrarias/route.ts#L1-L242)
- [route.ts](file://app/api/partes-contrarias/[id]/route.ts#L1-L188)

### Search Endpoints

The API provides specialized search endpoints for efficient data retrieval based on specific criteria:

#### GET /api/partes-contrarias/buscar/por-cpf/{cpf}
Retrieves an opposing party by CPF. The CPF can be provided with or without formatting.

#### GET /api/partes-contrarias/buscar/por-cnpj/{cnpj}
Retrieves an opposing party by CNPJ. The CNPJ can be provided with or without formatting.

#### GET /api/partes-contrarias/buscar/por-nome/{nome}
Retrieves a list of opposing parties whose name contains the search term. The search term must be at least 3 characters long.

**Section sources**
- [por-cpf/[cpf]/route.ts](file://app/api/partes-contrarias/buscar/por-cpf/[cpf]/route.ts#L1-L69)
- [por-cnpj/[cnpj]/route.ts](file://app/api/partes-contrarias/buscar/por-cnpj/[cnpj]/route.ts#L1-L69)
- [por-nome/[nome]/route.ts](file://app/api/partes-contrarias/buscar/por-nome/[nome]/route.ts#L1-L77)

## Request/Response Schemas

This section details the request and response schemas for the Opposing Parties Management API endpoints.

### Request Schema for POST /api/partes-contrarias/

```json
{
  "tipoPessoa": "pf|pj",
  "nome": "string",
  "nomeFantasia": "string",
  "cpf": "string",
  "cnpj": "string",
  "rg": "string",
  "dataNascimento": "string (date)",
  "genero": "masculino|feminino|outro|prefiro_nao_informar",
  "estadoCivil": "solteiro|casado|divorciado|viuvo|uniao_estavel|outro",
  "nacionalidade": "string",
  "inscricaoEstadual": "string",
  "email": "string",
  "telefonePrimario": "string",
  "telefoneSecundario": "string",
  "endereco": {
    "logradouro": "string",
    "numero": "string",
    "complemento": "string",
    "bairro": "string",
    "cidade": "string",
    "estado": "string",
    "pais": "string",
    "cep": "string"
  },
  "observacoes": "string",
  "endereco_id": "integer",
  "createdBy": "integer",
  "ativo": "boolean"
}
```

**Required Fields:** `tipoPessoa`, `nome`

### Response Schema for GET Endpoints

```json
{
  "success": "boolean",
  "data": {
    "id": "bigint",
    "tipo_pessoa": "pf|pj",
    "nome": "string",
    "nome_social_fantasia": "string",
    "cpf": "string",
    "cnpj": "string",
    "rg": "string",
    "data_nascimento": "date",
    "genero": "string",
    "estado_civil": "string",
    "nacionalidade": "string",
    "inscricao_estadual": "string",
    "emails": "jsonb[]",
    "status_pje": "string",
    "situacao_pje": "string",
    "login_pje": "string",
    "autoridade": "boolean",
    "ddd_celular": "string",
    "numero_celular": "string",
    "ddd_residencial": "string",
    "numero_residencial": "string",
    "ddd_comercial": "string",
    "numero_comercial": "string",
    "sexo": "string",
    "nome_genitora": "string",
    "naturalidade_id_pje": "integer",
    "naturalidade_municipio": "string",
    "naturalidade_estado_id_pje": "integer",
    "naturalidade_estado_sigla": "string",
    "uf_nascimento_id_pje": "integer",
    "uf_nascimento_sigla": "string",
    "uf_nascimento_descricao": "string",
    "pais_nascimento_id_pje": "integer",
    "pais_nascimento_codigo": "string",
    "pais_nascimento_descricao": "string",
    "escolaridade_codigo": "integer",
    "situacao_cpf_receita_id": "integer",
    "situacao_cpf_receita_descricao": "string",
    "pode_usar_celular_mensagem": "boolean",
    "data_abertura": "date",
    "data_fim_atividade": "date",
    "orgao_publico": "boolean",
    "tipo_pessoa_codigo_pje": "string",
    "tipo_pessoa_label_pje": "string",
    "tipo_pessoa_validacao_receita": "string",
    "ds_tipo_pessoa": "string",
    "situacao_cnpj_receita_id": "integer",
    "situacao_cnpj_receita_descricao": "string",
    "ramo_atividade": "string",
    "cpf_responsavel": "string",
    "oficial": "boolean",
    "ds_prazo_expediente_automatico": "string",
    "porte_codigo": "integer",
    "porte_descricao": "string",
    "ultima_atualizacao_pje": "timestamptz",
    "endereco_id": "bigint",
    "observacoes": "text",
    "created_by": "bigint",
    "dados_anteriores": "jsonb",
    "ativo": "boolean",
    "created_at": "timestamptz",
    "updated_at": "timestamptz"
  }
}
```

**Section sources**
- [route.ts](file://app/api/partes-contrarias/route.ts#L1-L242)
- [10_partes_contrarias.sql](file://supabase/schemas/10_partes_contrarias.sql#L1-L139)

## Data Validation Rules

The Opposing Parties Management API enforces strict data validation rules to ensure data integrity and consistency across the system.

### Required Fields
- `tipo_pessoa`: Must be either "pf" (physical person) or "pj" (legal person)
- `nome`: Required for all parties (full name for PF, company name for PJ)

### Field-Specific Validation
- **CPF**: Required for physical persons (PF), must be unique across the system
- **CNPJ**: Required for legal persons (PJ), must be unique across the system
- **Nome Social/Fantasia**: Unique field that serves as social name for PF or fantasy name for PJ
- **Emails**: Stored as JSONB array, allowing multiple email addresses
- **Address**: Can be linked via `endereco_id` or provided as an embedded object

### Business Rules
- CPF and CNPJ serve as unique keys for deduplication
- Physical persons (PF) require CPF and may have RG
- Legal persons (PJ) require CNPJ and may have state registration
- The system maintains previous data in `dados_anteriores` field for audit purposes
- All records have `created_at` and `updated_at` timestamps with automatic updates

**Section sources**
- [criar-parte-contraria.service.ts](file://backend/partes-contrarias/services/partes-contrarias/criar-parte-contraria.service.ts#L1-L54)
- [atualizar-parte-contraria.service.ts](file://backend/partes-contrarias/services/partes-contrarias/atualizar-parte-contraria.service.ts#L1-L48)
- [10_partes_contrarias.sql](file://supabase/schemas/10_partes_contrarias.sql#L1-L139)

## Search Endpoints

The Opposing Parties Management API provides specialized search endpoints for efficient data retrieval based on specific criteria.

### Search by CPF
The endpoint `GET /api/partes-contrarias/buscar/por-cpf/{cpf}` allows retrieval of an opposing party by their CPF. The CPF can be provided with or without formatting (e.g., "123.456.789-00" or "12345678900"). This endpoint returns the complete party record if found, or a 404 error if no party with the specified CPF exists.

### Search by CNPJ
The endpoint `GET /api/partes-contrarias/buscar/por-cnpj/{cnpj}` allows retrieval of an opposing party by their CNPJ. Similar to the CPF search, the CNPJ can be provided with or without formatting (e.g., "12.345.678/0001-90" or "12345678000190"). This endpoint returns the complete party record if found, or a 404 error if no party with the specified CNPJ exists.

### Search by Name
The endpoint `GET /api/partes-contrarias/buscar/por-nome/{nome}` performs a partial search on party names. The search is case-insensitive and returns all parties whose name contains the search term. The search term must be at least 3 characters long. This endpoint returns an array of matching parties, which may be empty if no matches are found.

These search endpoints are optimized with database indexes on CPF, CNPJ, and name fields to ensure fast response times even with large datasets.

**Section sources**
- [por-cpf/[cpf]/route.ts](file://app/api/partes-contrarias/buscar/por-cpf/[cpf]/route.ts#L1-L69)
- [por-cnpj/[cnpj]/route.ts](file://app/api/partes-contrarias/buscar/por-cnpj/[cnpj]/route.ts#L1-L69)
- [por-nome/[nome]/route.ts](file://app/api/partes-contrarias/buscar/por-nome/[nome]/route.ts#L1-L77)
- [buscar-parte-contraria-por-nome.service.ts](file://backend/partes-contrarias/services/partes-contrarias/buscar-parte-contraria-por-nome.service.ts#L1-L28)

## Error Handling

The Opposing Parties Management API implements comprehensive error handling to provide clear feedback for various error conditions.

### HTTP Status Codes
- **200 OK**: Successful GET requests
- **201 Created**: Successful POST requests
- **400 Bad Request**: Invalid request data, missing required fields, or validation errors
- **401 Unauthorized**: Authentication failed or missing authentication
- **404 Not Found**: Resource not found (e.g., party by ID, CPF, or CNPJ)
- **500 Internal Server Error**: Unexpected server errors

### Specific Error Scenarios
- **Missing Required Fields**: Returns 400 with message "Missing required fields: tipo_pessoa, nome"
- **Invalid ID**: Returns 400 with message "ID inválido" when the ID parameter is not a valid number
- **Invalid CPF/CNPJ**: Returns 400 with message "CPF é obrigatório" or "CNPJ é obrigatório" when the parameter is missing or empty
- **Name Too Short**: Returns 400 with message "Nome deve ter pelo menos 3 caracteres para busca" when searching by name with fewer than 3 characters
- **Duplicate Entries**: Returns 400 with appropriate error message when attempting to create a party with duplicate CPF or CNPJ
- **Party Not Found**: Returns 404 with message "Parte contrária não encontrada" when no party matches the search criteria

The API logs detailed error information on the server side for debugging purposes while returning user-friendly error messages to the client.

**Section sources**
- [route.ts](file://app/api/partes-contrarias/route.ts#L1-L242)
- [route.ts](file://app/api/partes-contrarias/[id]/route.ts#L1-L188)
- [por-cpf/[cpf]/route.ts](file://app/api/partes-contrarias/buscar/por-cpf/[cpf]/route.ts#L1-L69)
- [por-cnpj/[cnpj]/route.ts](file://app/api/partes-contrarias/buscar/por-cnpj/[cnpj]/route.ts#L1-L69)
- [por-nome/[nome]/route.ts](file://app/api/partes-contrarias/buscar/por-nome/[nome]/route.ts#L1-L77)

## Frontend Integration

The Opposing Parties Management API is designed to integrate seamlessly with frontend components in the Sinesys system, particularly the ParteContrariaCreateDialog and ParteContrariaEditDialog.

### Component Interaction
The frontend components interact with the API endpoints through the following workflow:

1. **Creation (ParteContrariaCreateDialog)**:
   - User fills out the form with party information
   - Form validation occurs on the frontend
   - On submission, a POST request is sent to `/api/partes-contrarias/`
   - On success (201), the dialog closes and the new party is displayed
   - On error (400), validation errors are displayed to the user

2. **Editing (ParteContrariaEditDialog)**:
   - User selects a party to edit
   - A GET request retrieves the party data from `/api/partes-contrarias/{id}`
   - User modifies the fields in the form
   - On submission, a PATCH request updates the party via `/api/partes-contrarias/{id}`
   - On success (200), the dialog closes and updated data is displayed

3. **Search Functionality**:
   - Components use the specialized search endpoints to find parties by CPF, CNPJ, or name
   - Search results are displayed in dropdowns or lists for selection

### Authentication
All API requests require authentication via one of the following methods:
- Bearer token (bearerAuth)
- Session cookie (sessionAuth)
- Service API key (serviceApiKey)

The frontend automatically includes the appropriate authentication method based on the user's session.

**Section sources**
- [route.ts](file://app/api/partes-contrarias/route.ts#L1-L242)
- [route.ts](file://app/api/partes-contrarias/[id]/route.ts#L1-L188)
- [por-cpf/[cpf]/route.ts](file://app/api/partes-contrarias/buscar/por-cpf/[cpf]/route.ts#L1-L69)
- [por-cnpj/[cnpj]/route.ts](file://app/api/partes-contrarias/buscar/por-cnpj/[cnpj]/route.ts#L1-L69)
- [por-nome/[nome]/route.ts](file://app/api/partes-contrarias/buscar/por-nome/[nome]/route.ts#L1-L77)

## Relationships with Legal Processes

The Opposing Parties Management system maintains relationships between opposing parties and legal processes through the `processo_partes` table, which serves as a junction table for many-to-many relationships.

### Database Structure
The `partes_contrarias` table contains the core information about opposing parties, while the `processo_partes` table links parties to specific legal processes. This design allows:
- A single opposing party to be associated with multiple legal processes
- Multiple opposing parties to be associated with a single legal process
- Tracking of the party's role in each process (plaintiff, defendant, etc.)

### Data Consistency
The system ensures data consistency through several mechanisms:
- **Foreign Key Constraints**: The `processo_partes` table has foreign keys to both `partes_contrarias` and `processos` tables
- **Row Level Security (RLS)**: Implemented on the `partes_contrarias` table to control access based on user permissions
- **Audit Trail**: The `dados_anteriores` field in `partes_contrarias` stores the previous state of a record before updates
- **Automatic Timestamps**: `created_at` and `updated_at` fields are automatically managed by database triggers

### Integration with Process Management
When a new legal process is created or updated, the system can:
- Link existing opposing parties from the database
- Create new opposing parties if they don't exist
- Search for parties by CPF, CNPJ, or name to avoid duplicates
- Display all processes associated with a specific opposing party

This relationship structure enables comprehensive tracking of opposing parties across multiple cases while maintaining data integrity and avoiding duplication.

**Section sources**
- [10_partes_contrarias.sql](file://supabase/schemas/10_partes_contrarias.sql#L1-L139)
- [parte-contraria-persistence.service.ts](file://backend/partes-contrarias/services/persistence/parte-contraria-persistence.service.ts)

## Data Consistency and Best Practices

The Opposing Parties Management system implements several strategies to ensure data consistency and provide best practices for maintaining high-quality data.

### Handling Name Variations
To address the challenge of name variations for the same party, the system employs the following approaches:
- **CPF/CNPJ as Primary Keys**: Using government-issued identifiers as unique keys ensures that variations in name spelling don't create duplicate records
- **Search Flexibility**: The search by name endpoint uses partial matching to find parties even with minor spelling differences
- **Data Standardization**: When creating or updating parties, the system can validate and standardize name formatting

### Managing Multiple Process Relationships
The system handles relationships between opposing parties and multiple processes through:
- **Centralized Party Management**: Each party exists as a single record in the `partes_contrarias` table, regardless of how many processes they're involved in
- **Junction Table**: The `processo_partes` table manages the many-to-many relationship between parties and processes
- **Process-Specific Data**: Any process-specific information about a party is stored in the `processo_partes` table rather than duplicating party data

### Ensuring Data Consistency
The system maintains data consistency through several mechanisms:
- **Database Constraints**: Unique constraints on CPF and CNPJ fields prevent duplicate entries
- **Validation Rules**: Server-side validation ensures required fields are present and data is in the correct format
- **Audit Trail**: The `dados_anteriores` field tracks changes to party information for accountability
- **Automatic Updates**: Database triggers ensure `updated_at` timestamps are always current

### Best Practices for Users
To maintain data quality, users should follow these best practices:
- **Search Before Creating**: Always search by CPF, CNPJ, or name before creating a new party to avoid duplicates
- **Use Standardized Names**: Enter names in a consistent format to improve search accuracy
- **Update Existing Records**: When party information changes, update the existing record rather than creating a new one
- **Verify Identifiers**: Double-check CPF and CNPJ numbers for accuracy, as they serve as unique identifiers
- **Maintain Complete Records**: Fill in as much relevant information as possible to support future searches and reporting

These practices ensure that the opposing parties database remains accurate, consistent, and useful for legal professionals managing multiple cases.

**Section sources**
- [10_partes_contrarias.sql](file://supabase/schemas/10_partes_contrarias.sql#L1-L139)
- [parte-contraria-persistence.service.ts](file://backend/partes-contrarias/services/persistence/parte-contraria-persistence.service.ts)
- [criar-parte-contraria.service.ts](file://backend/partes-contrarias/services/partes-contrarias/criar-parte-contraria.service.ts#L1-L54)
- [atualizar-parte-contraria.service.ts](file://backend/partes-contrarias/services/partes-contrarias/atualizar-parte-contraria.service.ts#L1-L48)