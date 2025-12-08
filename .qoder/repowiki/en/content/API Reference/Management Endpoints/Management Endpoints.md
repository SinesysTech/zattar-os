# Management Endpoints

<cite>
**Referenced Files in This Document**   
- [clientes/route.ts](file://app/api/clientes/route.ts)
- [contratos/route.ts](file://app/api/contratos/route.ts)
- [audiencias/route.ts](file://app/api/audiencias/route.ts)
- [usuarios/route.ts](file://app/api/usuarios/route.ts)
- [partes-contrarias/route.ts](file://app/api/partes-contrarias/route.ts)
- [representantes/route.ts](file://app/api/representantes/route.ts)
- [terceiros/route.ts](file://app/api/terceiros/route.ts)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts)
- [terceiro-persistence.service.ts](file://backend/terceiros/services/persistence/terceiro-persistence.service.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Client Management](#client-management)
3. [Contract Management](#contract-management)
4. [Hearing Management](#hearing-management)
5. [User Administration](#user-administration)
6. [Opposing Parties Management](#opposing-parties-management)
7. [Legal Representatives Management](#legal-representatives-management)
8. [Third Parties Management](#third-parties-management)
9. [Common Features](#common-features)
10. [Implementation Details](#implementation-details)
11. [Frontend Integration Examples](#frontend-integration-examples)
12. [Common Issues and Solutions](#common-issues-and-solutions)

## Introduction
The Sinesys system provides a comprehensive API for managing core legal entities through RESTful endpoints. This documentation covers the management endpoints for clients, contracts, hearings, users, opposing parties, legal representatives, and third parties. Each endpoint group supports CRUD operations with comprehensive filtering, search capabilities, and proper authentication. The API follows REST principles with clear HTTP method usage, standardized response formats, and detailed error handling.

**Section sources**
- [clientes/route.ts](file://app/api/clientes/route.ts)
- [contratos/route.ts](file://app/api/contratos/route.ts)
- [audiencias/route.ts](file://app/api/audiencias/route.ts)
- [usuarios/route.ts](file://app/api/usuarios/route.ts)
- [partes-contrarias/route.ts](file://app/api/partes-contrarias/route.ts)
- [representantes/route.ts](file://app/api/representantes/route.ts)
- [terceiros/route.ts](file://app/api/terceiros/route.ts)

## Client Management
The client management endpoints provide comprehensive CRUD operations for managing client entities in the Sinesys system. Clients can be individuals (PF) or legal entities (PJ) and are central to the legal case management workflow.

### GET /api/clientes
Retrieves a paginated list of clients with optional filtering and search capabilities.

**HTTP Method**: GET

**URL Pattern**: `/api/clientes`

**Query Parameters**:
- `pagina` (integer, default: 1): Page number for pagination
- `limite` (integer, default: 50): Number of items per page
- `busca` (string): Text search across name, fantasy name, CPF, CNPJ, or email
- `tipoPessoa` (string, enum: pf, pj): Filter by person type (individual or legal entity)
- `ativo` (boolean): Filter by active/inactive status
- `incluir_endereco` (boolean, default: false): Include address data via JOIN
- `incluir_processos` (boolean, default: false): Include related processes

**Authentication Methods**: Bearer token, session authentication, or service API key

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "clientes": [
      {
        "id": 123,
        "tipo_pessoa": "pf",
        "nome": "John Doe",
        "nome_fantasia": "John",
        "cpf": "12345678900",
        "rg": "1234567",
        "data_nascimento": "1980-01-01",
        "genero": "masculino",
        "estado_civil": "casado",
        "nacionalidade": "brasileira",
        "naturalidade": "São Paulo/SP",
        "inscricao_estadual": null,
        "email": "john@example.com",
        "telefonePrimario": "+5511999999999",
        "telefoneSecundario": null,
        "endereco_id": 456,
        "observacoes": "Client since 2020",
        "createdBy": 789,
        "ativo": true,
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
      }
    ],
    "paginacao": {
      "pagina": 1,
      "limite": 50,
      "total": 1,
      "totalPaginas": 1
    }
  }
}
```

**Error Codes**:
- 401: Unauthorized - Authentication required
- 500: Internal Server Error - Unexpected server error

### POST /api/clientes
Creates a new client in the system.

**HTTP Method**: POST

**URL Pattern**: `/api/clientes`

**Request Body**:
```json
{
  "tipoPessoa": "pf",
  "nome": "John Doe",
  "nomeFantasia": "John",
  "cpf": "12345678900",
  "rg": "1234567",
  "dataNascimento": "1980-01-01",
  "genero": "masculino",
  "estadoCivil": "casado",
  "nacionalidade": "brasileira",
  "naturalidade": "São Paulo/SP",
  "inscricaoEstadual": null,
  "email": "john@example.com",
  "telefonePrimario": "+5511999999999",
  "telefoneSecundario": null,
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
  "observacoes": "Client since 2020",
  "endereco_id": null,
  "createdBy": 789,
  "ativo": true
}
```

**Authentication Methods**: Bearer token, session authentication, or service API key

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "tipo_pessoa": "pf",
    "nome": "John Doe",
    "nome_fantasia": "John",
    "cpf": "12345678900",
    "rg": "1234567",
    "data_nascimento": "1980-01-01",
    "genero": "masculino",
    "estado_civil": "casado",
    "nacionalidade": "brasileira",
    "naturalidade": "São Paulo/SP",
    "inscricao_estadual": null,
    "email": "john@example.com",
    "telefonePrimario": "+5511999999999",
    "telefoneSecundario": null,
    "endereco_id": 456,
    "observacoes": "Client since 2020",
    "createdBy": 789,
    "ativo": true,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

**Error Codes**:
- 400: Bad Request - Missing required fields or invalid data
- 401: Unauthorized - Authentication required
- 500: Internal Server Error - Unexpected server error

**Implementation Details**:
- Data validation enforces required fields (tipo_pessoa, nome)
- CPF/CNPJ validation ensures proper format
- Email validation follows RFC 5322 standards
- Audit logging tracks creation with createdBy field
- Address data is handled through foreign key relationship

**Section sources**
- [clientes/route.ts](file://app/api/clientes/route.ts)

## Contract Management
The contract management endpoints handle the lifecycle of legal contracts within the Sinesys system, from creation to tracking and reporting.

### GET /api/contratos
Retrieves a paginated list of contracts with comprehensive filtering options.

**HTTP Method**: GET

**URL Pattern**: `/api/contratos`

**Query Parameters**:
- `pagina` (integer, default: 1): Page number for pagination
- `limite` (integer, default: 50): Number of items per page
- `busca` (string): Search in observations field
- `areaDireito` (string, enum: trabalhista, civil, previdenciario, criminal, empresarial, administrativo): Filter by legal area
- `tipoContrato` (string, enum: ajuizamento, defesa, ato_processual, assessoria, consultoria, extrajudicial, parecer): Filter by contract type
- `status` (string, enum: em_contratacao, contratado, distribuido, desistencia): Filter by contract status
- `clienteId` (integer): Filter by client ID
- `parteContrariaId` (integer): Filter by opposing party ID
- `responsavelId` (integer): Filter by responsible user ID

**Authentication Methods**: Bearer token, session authentication, or service API key

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "contratos": [
      {
        "id": 123,
        "areaDireito": "trabalhista",
        "tipoContrato": "ajuizamento",
        "tipoCobranca": "hora",
        "clienteId": 456,
        "parteContrariaId": 789,
        "responsavelId": 101,
        "poloCliente": "ATIVO",
        "observacoes": "Initial consultation completed",
        "status": "contratado",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
      }
    ],
    "paginacao": {
      "pagina": 1,
      "limite": 50,
      "total": 1,
      "totalPaginas": 1
    }
  }
}
```

**Error Codes**:
- 401: Unauthorized - Authentication required
- 500: Internal Server Error - Unexpected server error

### POST /api/contratos
Creates a new contract in the system.

**HTTP Method**: POST

**URL Pattern**: `/api/contratos`

**Request Body**:
```json
{
  "areaDireito": "trabalhista",
  "tipoContrato": "ajuizamento",
  "tipoCobranca": "hora",
  "clienteId": 456,
  "parteContrariaId": 789,
  "responsavelId": 101,
  "poloCliente": "ATIVO",
  "observacoes": "Initial consultation completed",
  "status": "contratado"
}
```

**Authentication Methods**: Bearer token, session authentication, or service API key

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "areaDireito": "trabalhista",
    "tipoContrato": "ajuizamento",
    "tipoCobranca": "hora",
    "clienteId": 456,
    "parteContrariaId": 789,
    "responsavelId": 101,
    "poloCliente": "ATIVO",
    "observacoes": "Initial consultation completed",
    "status": "contratado",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

**Error Codes**:
- 400: Bad Request - Missing required fields or invalid data
- 401: Unauthorized - Authentication required
- 500: Internal Server Error - Unexpected server error

**Implementation Details**:
- Business rule enforcement validates required fields (areaDireito, tipoContrato, tipoCobranca, clienteId, poloCliente)
- Referential integrity ensures valid client, opposing party, and responsible user IDs
- Status transitions follow defined workflow (em_contratacao → contratado → distribuido)
- Audit logging tracks contract creation and modifications

**Section sources**
- [contratos/route.ts](file://app/api/contratos/route.ts)

## Hearing Management
The hearing management endpoints provide comprehensive functionality for scheduling, tracking, and managing court hearings in the Sinesys system.

### GET /api/audiencias
Retrieves a paginated list of hearings with advanced filtering, search, and sorting capabilities.

**HTTP Method**: GET

**URL Pattern**: `/api/audiencias`

**Query Parameters**:
- `pagina` (integer, default: 1): Page number for pagination
- `limite` (integer, default: 50, max: 1000): Number of items per page
- `trt` (string): Filter by TRT code (e.g., TRT3, TRT1)
- `grau` (string, enum: primeiro_grau, segundo_grau): Filter by court instance
- `responsavel_id` (string): Filter by responsible user ID or 'null' for unassigned
- `sem_responsavel` (boolean): Filter for hearings without responsible user
- `busca` (string): Text search across process number, plaintiff name, defendant name
- `numero_processo` (string): Filter by process number (partial match)
- `polo_ativo_nome` (string): Filter by plaintiff name (partial match)
- `polo_passivo_nome` (string): Filter by defendant name (partial match)
- `status` (string, enum: M, R, C): Filter by status (M=Scheduled, R=Completed, C=Cancelled)
- `modalidade` (string, enum: virtual, presencial, hibrida): Filter by hearing modality
- `data_inicio_inicio` (string, format: date): Start date filter for hearing start
- `data_inicio_fim` (string, format: date): End date filter for hearing start
- `ordenar_por` (string, default: data_inicio): Field to sort by
- `ordem` (string, enum: asc, desc, default: asc): Sort direction

**Authentication Methods**: Bearer token, session authentication, or service API key

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "audiencias": [
      {
        "id": 123,
        "processo_id": 456,
        "advogado_id": 789,
        "data_inicio": "2023-01-01T09:00:00Z",
        "data_fim": "2023-01-01T10:00:00Z",
        "tipo_audiencia_id": 101,
        "tipo_descricao": "Instrução",
        "sala_audiencia_id": 202,
        "sala_audiencia_nome": "Sala 101",
        "url_audiencia_virtual": "https://meet.example.com/123",
        "endereco_presencial": "Fórum Central, Sala 101",
        "observacoes": "Witness testimony scheduled",
        "responsavel_id": 303,
        "status": "M",
        "modalidade": "presencial",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
      }
    ],
    "paginacao": {
      "pagina": 1,
      "limite": 50,
      "total": 1,
      "totalPaginas": 1
    }
  }
}
```

**Error Codes**:
- 400: Bad Request - Invalid parameters (e.g., pagina < 1, limite > 1000)
- 401: Unauthorized - Authentication required
- 500: Internal Server Error - Unexpected server error

### POST /api/audiencias
Creates a new hearing manually in the system.

**HTTP Method**: POST

**URL Pattern**: `/api/audiencias`

**Request Body**:
```json
{
  "processo_id": 456,
  "advogado_id": 789,
  "data_inicio": "2023-01-01T09:00:00Z",
  "data_fim": "2023-01-01T10:00:00Z",
  "tipo_descricao": "Instrução",
  "sala_audiencia_nome": "Sala 101",
  "url_audiencia_virtual": "https://meet.example.com/123",
  "observacoes": "Witness testimony scheduled",
  "responsavel_id": 303
}
```

**Authentication Methods**: Bearer token, session authentication, or service API key

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "id": 123
  }
}
```

**Error Codes**:
- 400: Bad Request - Missing required fields or invalid data
- 401: Unauthorized - Authentication required
- 500: Internal Server Error - Unexpected server error

**Implementation Details**:
- Comprehensive validation ensures required fields (processo_id, advogado_id, data_inicio, data_fim)
- Date validation confirms proper ISO 8601 format and logical sequence (data_fim > data_inicio)
- Manual hearings are distinguished from PJE-captured hearings by id_pje = 0
- Search optimization uses database indexing on frequently queried fields
- Audit logging tracks hearing creation with responsible user

**Section sources**
- [audiencias/route.ts](file://app/api/audiencias/route.ts)

## User Administration
The user administration endpoints manage user accounts within the Sinesys system, including creation, listing, and permission management.

### GET /api/usuarios
Retrieves a paginated list of users with filtering capabilities.

**HTTP Method**: GET

**URL Pattern**: `/api/usuarios`

**Query Parameters**:
- `pagina` (integer, default: 1): Page number for pagination
- `limite` (integer, default: 50): Number of items per page
- `busca` (string): Text search across full name, display name, CPF, or corporate email
- `ativo` (boolean): Filter by active/inactive status
- `oab` (string): Filter by OAB number
- `ufOab` (string): Filter by OAB state

**Authentication Methods**: Bearer token, session authentication, or service API key

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "usuarios": [
      {
        "id": 123,
        "nomeCompleto": "John Doe",
        "nomeExibicao": "John",
        "cpf": "12345678900",
        "rg": "1234567",
        "dataNascimento": "1980-01-01",
        "genero": "masculino",
        "oab": "MG123456",
        "ufOab": "MG",
        "emailPessoal": "john.personal@example.com",
        "emailCorporativo": "john@lawfirm.com",
        "telefone": "+5511999999999",
        "ramal": "1234",
        "endereco_id": 456,
        "authUserId": "uuid-123",
        "ativo": true,
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
      }
    ],
    "paginacao": {
      "pagina": 1,
      "limite": 50,
      "total": 1,
      "totalPaginas": 1
    }
  }
}
```

**Error Codes**:
- 401: Unauthorized - Authentication required
- 500: Internal Server Error - Unexpected server error

### POST /api/usuarios
Creates a new user in the system.

**HTTP Method**: POST

**URL Pattern**: `/api/usuarios`

**Request Body**:
```json
{
  "nomeCompleto": "John Doe",
  "nomeExibicao": "John",
  "cpf": "12345678900",
  "rg": "1234567",
  "dataNascimento": "1980-01-01",
  "genero": "masculino",
  "oab": "MG123456",
  "ufOab": "MG",
  "emailPessoal": "john.personal@example.com",
  "emailCorporativo": "john@lawfirm.com",
  "telefone": "+5511999999999",
  "ramal": "1234",
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
  "authUserId": "uuid-123",
  "ativo": true,
  "senha": "securepassword123"
}
```

**Authentication Methods**: Bearer token, session authentication, or service API key

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "nomeCompleto": "John Doe",
    "nomeExibicao": "John",
    "cpf": "12345678900",
    "rg": "1234567",
    "dataNascimento": "1980-01-01",
    "genero": "masculino",
    "oab": "MG123456",
    "ufOab": "MG",
    "emailPessoal": "john.personal@example.com",
    "emailCorporativo": "john@lawfirm.com",
    "telefone": "+5511999999999",
    "ramal": "1234",
    "endereco_id": 456,
    "authUserId": "uuid-123",
    "ativo": true,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

**Error Codes**:
- 400: Bad Request - Missing required fields or invalid data
- 401: Unauthorized - Authentication required
- 500: Internal Server Error - Unexpected server error

**Implementation Details**:
- Password validation requires minimum 6 characters
- CPF validation ensures proper format and checksum
- Email validation follows RFC 5322 standards
- User creation involves both authentication system (auth.users) and application database (public.usuarios)
- Audit logging tracks user creation with creation timestamp

**Section sources**
- [usuarios/route.ts](file://app/api/usuarios/route.ts)

## Opposing Parties Management
The opposing parties management endpoints handle entities that are adverse to clients in legal proceedings.

### GET /api/partes-contrarias
Retrieves a paginated list of opposing parties with filtering and search capabilities.

**HTTP Method**: GET

**URL Pattern**: `/api/partes-contrarias`

**Query Parameters**:
- `pagina` (integer, default: 1): Page number for pagination
- `limite` (integer, default: 50): Number of items per page
- `busca` (string): Text search across name, fantasy name, CPF, CNPJ, or email
- `tipoPessoa` (string, enum: pf, pj): Filter by person type (individual or legal entity)
- `ativo` (boolean): Filter by active/inactive status
- `incluir_endereco` (boolean, default: false): Include address data via JOIN
- `incluir_processos` (boolean, default: false): Include related processes

**Authentication Methods**: Bearer token, session authentication, or service API key

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "partesContrarias": [
      {
        "id": 123,
        "tipo_pessoa": "pj",
        "nome": "Acme Corporation",
        "nome_fantasia": "Acme",
        "cnpj": "12345678000199",
        "inscricao_estadual": "123456789",
        "email": "contact@acme.com",
        "telefonePrimario": "+5511999999999",
        "telefoneSecundario": null,
        "endereco_id": 456,
        "observacoes": "Corporate defendant",
        "createdBy": 789,
        "ativo": true,
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
      }
    ],
    "paginacao": {
      "pagina": 1,
      "limite": 50,
      "total": 1,
      "totalPaginas": 1
    }
  }
}
```

**Error Codes**:
- 401: Unauthorized - Authentication required
- 500: Internal Server Error - Unexpected server error

### POST /api/partes-contrarias
Creates a new opposing party in the system.

**HTTP Method**: POST

**URL Pattern**: `/api/partes-contrarias`

**Request Body**:
```json
{
  "tipoPessoa": "pj",
  "nome": "Acme Corporation",
  "nomeFantasia": "Acme",
  "cnpj": "12345678000199",
  "inscricaoEstadual": "123456789",
  "email": "contact@acme.com",
  "telefonePrimario": "+5511999999999",
  "telefoneSecundario": null,
  "endereco": {
    "logradouro": "Avenida Exemplo",
    "numero": "456",
    "complemento": "Andar 10",
    "bairro": "Business Center",
    "cidade": "São Paulo",
    "estado": "SP",
    "pais": "Brasil",
    "cep": "01000-000"
  },
  "observacoes": "Corporate defendant",
  "endereco_id": null,
  "createdBy": 789,
  "ativo": true
}
```

**Authentication Methods**: Bearer token, session authentication, or service API key

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "tipo_pessoa": "pj",
    "nome": "Acme Corporation",
    "nome_fantasia": "Acme",
    "cnpj": "12345678000199",
    "inscricao_estadual": "123456789",
    "email": "contact@acme.com",
    "telefonePrimario": "+5511999999999",
    "telefoneSecundario": null,
    "endereco_id": 456,
    "observacoes": "Corporate defendant",
    "createdBy": 789,
    "ativo": true,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

**Error Codes**:
- 400: Bad Request - Missing required fields or invalid data
- 401: Unauthorized - Authentication required
- 500: Internal Server Error - Unexpected server error

**Implementation Details**:
- Data validation enforces required fields (tipo_pessoa, nome)
- CNPJ validation ensures proper format and checksum
- Address data is handled through foreign key relationship
- Audit logging tracks creation with createdBy field
- Search optimization uses database indexing on frequently queried fields

**Section sources**
- [partes-contrarias/route.ts](file://app/api/partes-contrarias/route.ts)

## Legal Representatives Management
The legal representatives management endpoints handle attorneys and other legal professionals who represent parties in legal proceedings.

### GET /api/representantes
Retrieves a paginated list of legal representatives with comprehensive filtering options.

**HTTP Method**: GET

**URL Pattern**: `/api/representantes`

**Query Parameters**:
- `pagina` (integer, default: 1): Page number for pagination
- `limite` (integer, default: 50, max: 100): Number of items per page
- `nome` (string): Filter by name (partial match)
- `cpf` (string): Filter by CPF (exact match)
- `oab` (string): Filter by OAB number (search in JSONB array)
- `uf_oab` (string): Filter by OAB state
- `busca` (string): Text search across name, CPF, email, and OABs
- `ordenar_por` (string): Field to sort by
- `ordem` (string, enum: asc, desc, default: asc): Sort direction
- `incluir_endereco` (boolean, default: false): Include address data via JOIN
- `incluir_processos` (boolean, default: false): Include related processes (implies incluir_endereco)

**Authentication Methods**: Bearer token

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "representantes": [
      {
        "id": 123,
        "cpf": "12345678900",
        "nome": "John Attorney",
        "sexo": "masculino",
        "tipo": "ADVOGADO",
        "oabs": [
          {
            "numero": "MG123456",
            "uf": "MG",
            "inscricao_seccional": "123456",
            "situacao": "ATIVA",
            "data_inscricao": "2010-01-01",
            "data_inscricao_definitiva": "2011-01-01"
          }
        ],
        "emails": ["john@lawfirm.com"],
        "email": "john@lawfirm.com",
        "ddd_celular": "11",
        "numero_celular": "999999999",
        "ddd_residencial": null,
        "numero_residencial": null,
        "ddd_comercial": "11",
        "numero_comercial": "33333333",
        "endereco_id": 456,
        "dados_anteriores": null,
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "pagina": 1,
    "limite": 50,
    "totalPaginas": 1
  }
}
```

**Error Codes**:
- 401: Unauthorized - Authentication required
- 500: Internal Server Error - Unexpected server error

### POST /api/representantes
Creates a new legal representative in the system.

**HTTP Method**: POST

**URL Pattern**: `/api/representantes`

**Request Body**:
```json
{
  "id_pessoa_pje": 12345,
  "parte_tipo": "cliente",
  "parte_id": 67890,
  "tipo_pessoa": "pf",
  "nome": "John Attorney",
  "cpf": "12345678900",
  "numero_oab": "MG123456",
  "uf_oab": "MG",
  "endereco_id": 456
}
```

**Authentication Methods**: Bearer token

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "cpf": "12345678900",
    "nome": "John Attorney",
    "sexo": "masculino",
    "tipo": "ADVOGADO",
    "oabs": [
      {
        "numero": "MG123456",
        "uf": "MG",
        "inscricao_seccional": "123456",
        "situacao": "ATIVA",
        "data_inscricao": "2010-01-01",
        "data_inscricao_definitiva": "2011-01-01"
      }
    ],
    "emails": ["john@lawfirm.com"],
    "email": "john@lawfirm.com",
    "ddd_celular": "11",
    "numero_celular": "999999999",
    "ddd_residencial": null,
    "numero_residencial": null,
    "ddd_comercial": "11",
    "numero_comercial": "33333333",
    "endereco_id": 456,
    "dados_anteriores": null,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

**Error Codes**:
- 400: Bad Request - Missing required fields or invalid data
- 401: Unauthorized - Authentication required
- 409: Conflict - Representative already registered with this CPF
- 500: Internal Server Error - Unexpected server error

**Implementation Details**:
- Representatives are uniquely identified by CPF (not by process)
- OAB validation ensures proper format and valid Brazilian state codes
- Email validation follows RFC 5322 standards
- JSONB field stores multiple OAB registrations
- Audit logging tracks creation and modifications
- Unique constraint prevents duplicate CPF registration

**Section sources**
- [representantes/route.ts](file://app/api/representantes/route.ts)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts)

## Third Parties Management
The third parties management endpoints handle various entities involved in legal proceedings who are neither clients nor opposing parties.

### GET /api/terceiros
Retrieves a paginated list of third parties with filtering capabilities.

**HTTP Method**: GET

**URL Pattern**: `/api/terceiros`

**Query Parameters**:
- `pagina` (integer): Page number for pagination
- `limite` (integer): Number of items per page
- `tipo_pessoa` (string, enum: pf, pj): Filter by person type
- `tipo_parte` (string, enum: PERITO, MINISTERIO_PUBLICO, ASSISTENTE, TESTEMUNHA, CUSTOS_LEGIS, AMICUS_CURIAE, OUTRO): Filter by party type
- `processo_id` (integer): Filter by process ID
- `incluir_endereco` (boolean, default: false): Include address data via JOIN
- `incluir_processos` (boolean, default: false): Include related processes

**Authentication Methods**: Bearer token

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "terceiros": [
      {
        "id": 123,
        "id_tipo_parte": 456,
        "tipo_parte": "PERITO",
        "polo": "NEUTRO",
        "tipo_pessoa": "pf",
        "nome": "Dr. Expert",
        "nome_fantasia": null,
        "cpf": "12345678900",
        "cnpj": null,
        "emails": ["expert@university.edu"],
        "ddd_celular": "11",
        "numero_celular": "999999999",
        "ddd_residencial": null,
        "numero_residencial": null,
        "ddd_comercial": "11",
        "numero_comercial": "33333333",
        "principal": null,
        "autoridade": null,
        "endereco_desconhecido": null,
        "status_pje": null,
        "situacao_pje": null,
        "login_pje": null,
        "ordem": null,
        "observacoes": "Forensic expert in criminal case",
        "dados_anteriores": null,
        "ativo": true,
        "endereco_id": 789,
        "ultima_atualizacao_pje": null,
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
      }
    ],
    "paginacao": {
      "pagina": 1,
      "limite": 50,
      "total": 1,
      "totalPaginas": 1
    }
  }
}
```

**Error Codes**:
- 401: Unauthorized - Authentication required
- 500: Internal Server Error - Unexpected server error

### POST /api/terceiros
Creates a new third party in the system.

**HTTP Method**: POST

**URL Pattern**: `/api/terceiros`

**Request Body**:
```json
{
  "tipo_pessoa": "pf",
  "nome": "Dr. Expert",
  "cpf": "12345678900",
  "tipo_parte": "PERITO",
  "polo": "NEUTRO",
  "processo_id": 456,
  "endereco_id": 789
}
```

**Authentication Methods**: Bearer token

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "id_tipo_parte": 456,
    "tipo_parte": "PERITO",
    "polo": "NEUTRO",
    "tipo_pessoa": "pf",
    "nome": "Dr. Expert",
    "nome_fantasia": null,
    "cpf": "12345678900",
    "cnpj": null,
    "emails": ["expert@university.edu"],
    "ddd_celular": "11",
    "numero_celular": "999999999",
    "ddd_residencial": null,
    "numero_residencial": null,
    "ddd_comercial": "11",
    "numero_comercial": "33333333",
    "principal": null,
    "autoridade": null,
    "endereco_desconhecido": null,
    "status_pje": null,
    "situacao_pje": null,
    "login_pje": null,
    "ordem": null,
    "observacoes": "Forensic expert in criminal case",
    "dados_anteriores": null,
    "ativo": true,
    "endereco_id": 789,
    "ultima_atualizacao_pje": null,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

**Error Codes**:
- 400: Bad Request - Missing required fields or invalid data
- 401: Unauthorized - Authentication required
- 500: Internal Server Error - Unexpected server error

**Implementation Details**:
- Third parties are stored in a global table (not process-specific)
- Relationship to processes is managed through processo_partes table
- CPF/CNPJ validation ensures proper format
- Type safety enforces valid party types and polos
- Audit logging tracks creation and modifications
- Search optimization uses database indexing on frequently queried fields

**Section sources**
- [terceiros/route.ts](file://app/api/terceiros/route.ts)
- [terceiro-persistence.service.ts](file://backend/terceiros/services/persistence/terceiro-persistence.service.ts)

## Common Features
The management endpoints share several common features and patterns across different entity types.

### Authentication and Authorization
All management endpoints require authentication through one of three methods:
- Bearer token (JWT)
- Session authentication
- Service API key

The authentication is implemented in the `authenticateRequest` function imported from `@/backend/auth/api-auth`. This centralized authentication ensures consistent security across all endpoints.

### Error Handling
Standardized error responses follow the pattern:
```json
{
  "error": "Error message describing the issue"
}
```

HTTP status codes are used appropriately:
- 400: Bad Request - Client error due to invalid input
- 401: Unauthorized - Authentication required or failed
- 500: Internal Server Error - Unexpected server error

### Response Format
All successful responses follow a consistent format:
```json
{
  "success": true,
  "data": { /* entity data or list */ }
}
```

### Pagination
All list endpoints support pagination with:
- `pagina`: Current page number (1-based)
- `limite`: Number of items per page
- Response includes pagination metadata (total, totalPaginas)

### Search and Filtering
Endpoints support various filtering options:
- Text search across multiple fields
- Field-specific filtering
- Date range filtering
- Status-based filtering
- Relationship-based filtering

Database queries are optimized with proper indexing on frequently searched fields.

**Section sources**
- [clientes/route.ts](file://app/api/clientes/route.ts)
- [contratos/route.ts](file://app/api/contratos/route.ts)
- [audiencias/route.ts](file://app/api/audiencias/route.ts)
- [usuarios/route.ts](file://app/api/usuarios/route.ts)
- [partes-contrarias/route.ts](file://app/api/partes-contrarias/route.ts)
- [representantes/route.ts](file://app/api/representantes/route.ts)
- [terceiros/route.ts](file://app/api/terceiros/route.ts)

## Implementation Details
The management endpoints are implemented with a clean separation of concerns between API routes, service layers, and persistence layers.

### Architecture Pattern
The system follows a layered architecture:
1. **API Layer**: Route handlers in `app/api/` directory
2. **Service Layer**: Business logic in `backend/*/services/` directory
3. **Persistence Layer**: Database operations in `backend/*/services/persistence/` directory

This separation ensures that business rules are encapsulated in service layers, while API routes handle HTTP-specific concerns like authentication and request/response formatting.

### Data Validation
Comprehensive validation is implemented at multiple levels:
- **Request Validation**: API routes validate required fields and basic data types
- **Business Validation**: Service layers validate business rules and constraints
- **Database Constraints**: PostgreSQL enforces referential integrity and data consistency

For example, the client creation endpoint validates:
- Required fields (tipo_pessoa, nome)
- CPF/CNPJ format and checksum
- Email format
- Address relationship integrity

### Audit Logging
All entity modifications are tracked through:
- `created_at` and `updated_at` timestamps
- `createdBy` field tracking the creating user
- `dados_anteriores` field storing previous state for updates

This provides a complete audit trail for compliance and debugging purposes.

### Performance Optimization
Several techniques are used to optimize performance:
- **Database Indexing**: Critical fields are indexed for fast searching
- **Query Optimization**: JOINs are used judiciously with proper filtering
- **Pagination**: Large result sets are paginated to prevent memory issues
- **Caching**: Some endpoints could benefit from Redis caching (not currently implemented)

### Referential Integrity
The system maintains referential integrity through:
- Foreign key constraints in the database
- Validation in service layers
- Transactional operations when needed

For example, when creating a contract, the system verifies that the referenced client, opposing party, and responsible user exist.

**Section sources**
- [clientes/route.ts](file://app/api/clientes/route.ts)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts)
- [terceiro-persistence.service.ts](file://backend/terceiros/services/persistence/terceiro-persistence.service.ts)

## Frontend Integration Examples
The management endpoints are designed to integrate seamlessly with frontend components.

### Client Creation Dialog
The `ClientCreateDialog` component calls the clientes API to create new clients:

```typescript
async function createClient(clientData: ClientFormData) {
  const response = await fetch('/api/clientes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(clientData)
  });
  
  if (response.ok) {
    const result = await response.json();
    // Handle successful creation
    showSuccessToast('Client created successfully');
    closeDialog();
    refreshClientList();
  } else {
    const error = await response.json();
    // Handle error
    showErrorToast(error.error);
  }
}
```

### Search and Filtering
Frontend components use query parameters to filter results:

```typescript
async function searchClients(searchTerm: string, page: number = 1) {
  const params = new URLSearchParams({
    busca: searchTerm,
    pagina: page.toString(),
    limite: '50'
  });
  
  const response = await fetch(`/api/clientes?${params}`);
  return response.json();
}
```

### Real-time Updates
The system could be extended with real-time updates using WebSockets or Server-Sent Events to notify frontend components of changes.

**Section sources**
- [clientes/route.ts](file://app/api/clientes/route.ts)

## Common Issues and Solutions
Several common issues may arise when using the management endpoints, along with their solutions.

### Data Consistency
**Issue**: Inconsistent data between related entities.
**Solution**: Use transactions for operations affecting multiple entities and leverage database constraints to enforce consistency.

### Referential Integrity
**Issue**: References to non-existent entities.
**Solution**: Validate foreign keys in service layers and use database foreign key constraints with appropriate ON DELETE/ON UPDATE actions.

### Permission Validation
**Issue**: Users accessing data they shouldn't have access to.
**Solution**: Implement row-level security (RLS) in PostgreSQL and validate permissions in the authorization layer.

### Search Performance
**Issue**: Slow search queries on large datasets.
**Solution**: Create appropriate database indexes on frequently searched fields and consider implementing full-text search.

### Concurrency Issues
**Issue**: Race conditions when multiple users modify the same entity.
**Solution**: Implement optimistic locking with version numbers or use database row locking for critical operations.

### Data Validation
**Issue**: Invalid data being stored.
**Solution**: Implement comprehensive validation at multiple levels (request, service, database) and provide clear error messages.

### Error Handling
**Issue**: Generic error messages that don't help debugging.
**Solution**: Provide specific error messages while avoiding exposure of sensitive information.

**Section sources**
- [clientes/route.ts](file://app/api/clientes/route.ts)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts)
- [terceiro-persistence.service.ts](file://backend/terceiros/services/persistence/terceiro-persistence.service.ts)