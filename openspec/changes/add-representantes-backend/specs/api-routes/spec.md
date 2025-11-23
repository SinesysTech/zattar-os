# Spec Delta: api-routes (representantes)

## ADDED Requirements

### Requirement: API Route Structure

The system SHALL expose REST API endpoints for representantes CRUD operations.

#### Scenario: Collection endpoint handles GET and POST

**Given** the API routes
**When** requests are made to `/api/representantes`
**Then** the endpoint SHALL:
- Accept GET requests to list representantes with filters
- Accept POST requests to create new representante
- Require authentication for all methods
- Return consistent response format: `{ success: boolean, data?: T, error?: string }`
- Handle errors with appropriate HTTP status codes

**File location**: `app/api/representantes/route.ts`

#### Scenario: Item endpoint handles GET, PATCH, DELETE

**Given** the API routes
**When** requests are made to `/api/representantes/[id]`
**Then** the endpoint SHALL:
- Accept GET requests to retrieve single representante by id
- Accept PATCH requests to update representante
- Accept DELETE requests to remove representante
- Require authentication for all methods
- Validate id parameter is positive integer
- Return 404 if representante not found

**File location**: `app/api/representantes/[id]/route.ts`

### Requirement: Authentication

All representantes API endpoints SHALL require valid authentication.

#### Scenario: Unauthenticated requests are rejected

**Given** an API request without valid session
**When** any representantes endpoint is called
**Then** the endpoint SHALL:
1. Call `authenticateRequest()` helper
2. Return 401 Unauthorized if authentication fails
3. Proceed with operation only if authenticated

### Requirement: GET /api/representantes - List Representantes

The system SHALL provide a GET endpoint to list representantes with pagination and filtering.

#### Scenario: GET returns paginated list with filters

**Given** an authenticated user
**When** GET `/api/representantes` is called with query parameters
**Then** the endpoint SHALL:
1. Parse query parameters into ListarRepresentantesParams:
   - `pagina?: number` (default 1)
   - `limite?: number` (default 50, max 100)
   - `parte_tipo?: string`
   - `parte_id?: number`
   - `trt?: string`
   - `grau?: string`
   - `numero_processo?: string`
   - `numero_oab?: string`
   - `situacao_oab?: string`
   - `tipo_pessoa?: string`
   - `busca?: string`
   - `ordenar_por?: string` (default 'nome')
   - `ordem?: string` (default 'asc')
2. Call `listarRepresentantes(params)` from persistence service
3. Return 200 with `{ success: true, data: ListarRepresentantesResult }`
4. Return 400 if query parameters are invalid
5. Return 500 if database error occurs

**Example request**:
```
GET /api/representantes?parte_tipo=cliente&parte_id=123&trt=TRT3&pagina=1&limite=20
```

**Example response**:
```json
{
  "success": true,
  "data": {
    "representantes": [
      {
        "id": 1,
        "tipo_pessoa": "pf",
        "nome": "João Silva Advogado",
        "cpf": "12345678901",
        "cnpj": null,
        "numero_oab": "SP123456",
        // ... other fields
      }
    ],
    "total": 45,
    "pagina": 1,
    "limite": 20,
    "totalPaginas": 3
  }
}
```

### Requirement: POST /api/representantes - Create Representante

The system SHALL provide a POST endpoint to create a new representante.

#### Scenario: POST creates new representante

**Given** an authenticated user with CREATE permission
**When** POST `/api/representantes` is called with JSON body
**Then** the endpoint SHALL:
1. Parse request body into CriarRepresentanteParams
2. Validate required fields are present
3. Call `criarRepresentante(params)` from persistence service
4. Return 201 Created with `{ success: true, data: Representante }` if successful
5. Return 400 Bad Request if validation fails
6. Return 409 Conflict if unique constraint violated
7. Return 500 if database error occurs

**Required fields in body**:
- `id_pessoa_pje: number`
- `trt: string`
- `grau: '1' | '2'`
- `parte_tipo: 'cliente' | 'parte_contraria' | 'terceiro'`
- `parte_id: number`
- `numero_processo: string`
- `tipo_pessoa: 'pf' | 'pj'`
- `nome: string`
- `cpf: string` (if tipo_pessoa='pf')
- `cnpj: string` (if tipo_pessoa='pj')

**Example request**:
```json
POST /api/representantes
{
  "id_pessoa_pje": 12345,
  "trt": "TRT3",
  "grau": "1",
  "parte_tipo": "cliente",
  "parte_id": 789,
  "numero_processo": "0010000-00.2024.5.03.0001",
  "tipo_pessoa": "pf",
  "nome": "João Silva Advogado",
  "cpf": "12345678901",
  "numero_oab": "SP123456",
  "emails": ["joao@example.com"]
}
```

**Example response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tipo_pessoa": "pf",
    "nome": "João Silva Advogado",
    "cpf": "12345678901",
    "cnpj": null,
    // ... all fields
  }
}
```

### Requirement: GET /api/representantes/[id] - Get Representante by ID

The system SHALL provide a GET endpoint to retrieve a single representante by ID.

#### Scenario: GET returns single representante

**Given** an authenticated user
**When** GET `/api/representantes/[id]` is called
**Then** the endpoint SHALL:
1. Parse id from URL parameter
2. Validate id is positive integer
3. Call `buscarRepresentantePorId(id)` from persistence service
4. Return 200 with `{ success: true, data: Representante }` if found
5. Return 404 Not Found if representante does not exist
6. Return 400 if id parameter is invalid
7. Return 500 if database error occurs

**Example request**:
```
GET /api/representantes/123
```

**Example response**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "tipo_pessoa": "pf",
    "nome": "João Silva Advogado",
    "cpf": "12345678901",
    // ... all fields
  }
}
```

### Requirement: PATCH /api/representantes/[id] - Update Representante

The system SHALL provide a PATCH endpoint to update an existing representante.

#### Scenario: PATCH updates existing representante

**Given** an authenticated user with UPDATE permission
**When** PATCH `/api/representantes/[id]` is called with JSON body
**Then** the endpoint SHALL:
1. Parse id from URL parameter
2. Parse request body as partial update object
3. Reject if attempting to change immutable fields (tipo_pessoa, parte_tipo, parte_id)
4. Call `atualizarRepresentante({ id, ...updates })` from persistence service
5. Return 200 with `{ success: true, data: Representante }` if successful
6. Return 400 if validation fails or immutable field change attempted
7. Return 404 if representante not found
8. Return 500 if database error occurs

**Immutable fields** (return 400 if included in body):
- `tipo_pessoa`
- `parte_tipo`
- `parte_id`

**Example request**:
```json
PATCH /api/representantes/123
{
  "numero_oab": "SP654321",
  "situacao_oab": "REGULAR",
  "email": "novo@example.com"
}
```

**Example response**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "tipo_pessoa": "pf",
    "numero_oab": "SP654321",
    "situacao_oab": "REGULAR",
    "email": "novo@example.com",
    // ... all fields
  }
}
```

### Requirement: DELETE /api/representantes/[id] - Delete Representante

The system SHALL provide a DELETE endpoint to remove a representante.

#### Scenario: DELETE removes representante

**Given** an authenticated user with DELETE permission
**When** DELETE `/api/representantes/[id]` is called
**Then** the endpoint SHALL:
1. Parse id from URL parameter
2. Validate id is positive integer
3. Call `deletarRepresentante(id)` from persistence service
4. Return 200 with `{ success: true }` if successful
5. Return 404 if representante not found
6. Return 500 if database error occurs

**Example request**:
```
DELETE /api/representantes/123
```

**Example response**:
```json
{
  "success": true
}
```

### Requirement: Specialized Query Endpoints

The system SHALL provide additional query endpoints for common use cases.

#### Scenario: GET /api/representantes/parte/[parte_tipo]/[parte_id] retrieves reps for party

**Given** an authenticated user
**When** GET `/api/representantes/parte/[parte_tipo]/[parte_id]` is called
**Then** the endpoint SHALL:
1. Parse parte_tipo and parte_id from URL
2. Parse optional query params: trt, grau
3. Call `buscarRepresentantesPorParte({ parte_tipo, parte_id, trt, grau })`
4. Return 200 with `{ success: true, data: Representante[] }`
5. Return 400 if parameters invalid
6. Return 500 if database error occurs

**File location**: `app/api/representantes/parte/[parte_tipo]/[parte_id]/route.ts`

**Example request**:
```
GET /api/representantes/parte/cliente/123?trt=TRT3&grau=1
```

#### Scenario: GET /api/representantes/oab/[numero_oab] retrieves reps by OAB

**Given** an authenticated user
**When** GET `/api/representantes/oab/[numero_oab]` is called
**Then** the endpoint SHALL:
1. Parse numero_oab from URL
2. Parse optional query params: trt, grau
3. Call `buscarRepresentantesPorOAB({ numero_oab, trt, grau })`
4. Return 200 with `{ success: true, data: Representante[] }`
5. Return 400 if parameters invalid
6. Return 500 if database error occurs

**File location**: `app/api/representantes/oab/[numero_oab]/route.ts`

**Example request**:
```
GET /api/representantes/oab/SP123456
```

#### Scenario: GET /api/representantes/processo retrieves reps for process

**Given** an authenticated user
**When** GET `/api/representantes/processo` is called with query params
**Then** the endpoint SHALL:
1. Parse required query params: numero_processo, trt, grau
2. Call `buscarRepresentantesPorProcesso({ numero_processo, trt, grau })`
3. Return 200 with `{ success: true, data: Representante[] }`
4. Return 400 if required params missing
5. Return 500 if database error occurs

**File location**: `app/api/representantes/processo/route.ts`

**Example request**:
```
GET /api/representantes/processo?numero_processo=0010000-00.2024.5.03.0001&trt=TRT3&grau=1
```

### Requirement: POST /api/representantes/upsert - Upsert Representante

The system SHALL provide a POST endpoint to create or update representante idempotently.

#### Scenario: POST upsert creates or updates by context

**Given** an authenticated user with CREATE/UPDATE permission
**When** POST `/api/representantes/upsert` is called with JSON body
**Then** the endpoint SHALL:
1. Parse request body into UpsertRepresentantePorIdPessoaParams
2. Validate required fields (same as create)
3. Call `upsertRepresentantePorIdPessoa(params)` from persistence service
4. Return 200 with `{ success: true, data: Representante }` if successful
5. Return 400 if validation fails
6. Return 500 if database error occurs

**Use case**: PJE sync operations that need idempotency

**File location**: `app/api/representantes/upsert/route.ts`

**Example request**:
```json
POST /api/representantes/upsert
{
  "id_pessoa_pje": 12345,
  "trt": "TRT3",
  "grau": "1",
  "parte_tipo": "cliente",
  "parte_id": 789,
  "numero_processo": "0010000-00.2024.5.03.0001",
  "tipo_pessoa": "pf",
  "nome": "João Silva Advogado",
  "cpf": "12345678901",
  "numero_oab": "SP123456"
}
```

### Requirement: Error Response Format

All error responses SHALL follow a consistent format.

#### Scenario: Errors return standardized JSON

**Given** any API endpoint
**When** an error occurs
**Then** the response SHALL include:
- Appropriate HTTP status code (400, 401, 404, 409, 500)
- JSON body: `{ success: false, error: string }`
- User-friendly error message (no stack traces or SQL)

**Status code mapping**:
- `400 Bad Request`: Validation errors, invalid parameters, immutable field changes
- `401 Unauthorized`: Authentication required or failed
- `404 Not Found`: Representante not found
- `409 Conflict`: Unique constraint violation (duplicate representante)
- `500 Internal Server Error`: Database errors, unexpected errors

**Example error responses**:
```json
// 400 Bad Request
{
  "success": false,
  "error": "Campo obrigatório: cpf é obrigatório para pessoa física"
}

// 401 Unauthorized
{
  "success": false,
  "error": "Autenticação necessária"
}

// 404 Not Found
{
  "success": false,
  "error": "Representante não encontrado"
}

// 409 Conflict
{
  "success": false,
  "error": "Representante já cadastrado para esta parte neste processo"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Erro ao processar requisição"
}
```

### Requirement: Request Validation

All API endpoints SHALL validate request data before processing.

#### Scenario: Invalid request bodies return 400

**Given** any POST or PATCH endpoint
**When** request body is invalid
**Then** the endpoint SHALL:
1. Validate required fields are present
2. Validate field types match expected types
3. Validate enum values are in allowed set
4. Validate referenced IDs exist (parte_id, etc.)
5. Return 400 with descriptive error message if validation fails

**Validation examples**:
- `tipo_pessoa` must be 'pf' or 'pj'
- `grau` must be '1' or '2'
- `parte_tipo` must be 'cliente', 'parte_contraria', or 'terceiro'
- `cpf` required if tipo_pessoa='pf', must be 11 digits
- `cnpj` required if tipo_pessoa='pj', must be 14 digits
- `emails` must be array of valid email strings

### Requirement: CORS and Security Headers

All API endpoints SHALL include appropriate security headers.

#### Scenario: Responses include security headers

**Given** any API endpoint
**When** a response is returned
**Then** the response SHALL include headers:
- `Content-Type: application/json`
- CORS headers (if configured)
- No sensitive data in headers

### Requirement: Rate Limiting

API endpoints SHALL implement rate limiting to prevent abuse.

#### Scenario: Excessive requests are throttled

**Given** a client making many requests
**When** rate limit is exceeded
**Then** the endpoint SHALL:
1. Return 429 Too Many Requests
2. Include Retry-After header with seconds to wait

**Note**: Implementation details (Redis-based, memory-based) are left to the developer.

## MODIFIED Requirements

None - new API routes.

## REMOVED Requirements

None.
