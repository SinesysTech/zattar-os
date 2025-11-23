# Tasks: add-representantes-backend

## Overview
Implementation tasks for representantes (legal representatives) backend infrastructure.

**Estimated complexity**: Medium-High (8-12 hours)
**Dependencies**: Requires clientes, partes_contrarias, terceiros tables to exist

---

## Phase 1: Database Schema (2-3 hours)

### Task 1.1: Create representantes migration
**File**: `supabase/migrations/[timestamp]_create_representantes.sql`
**Description**: Create representantes table with 45 campos
**Steps**:
1. Generate migration file: `npx supabase migration new create_representantes`
2. Define table structure with all 45 columns as per database-schema spec
3. Add UNIQUE constraint on (id_pessoa_pje, trt, grau, parte_id, parte_tipo, numero_processo)
4. Add CHECK constraints for tipo_pessoa validation (PF requires cpf, PJ requires cnpj)
5. Create 6 performance indexes as specified
6. Add trigger for updated_at auto-refresh
7. Add table and column comments for documentation

**Verification**:
- Run migration locally: `npx supabase db push`
- Verify table structure: `\d representantes` in psql
- Verify indexes: `\di representantes*`
- Verify constraints: `\d+ representantes`

**Acceptance Criteria**:
- ✅ Table created with all 45 columns
- ✅ Uniqueness constraint enforced
- ✅ CHECK constraints prevent invalid PF/PJ data
- ✅ All 6 indexes exist
- ✅ Trigger updates updated_at on row changes

---

### Task 1.2: Verify terceiros table has TRT and grau columns
**File**: Check existing migrations or create new migration
**Description**: Ensure terceiros table includes trt and grau columns for context scoping
**Steps**:
1. Check if terceiros table exists: `SELECT * FROM terceiros LIMIT 0;`
2. Check if trt and grau columns exist
3. If missing, create migration to add columns:
   ```sql
   ALTER TABLE terceiros ADD COLUMN IF NOT EXISTS trt VARCHAR(10);
   ALTER TABLE terceiros ADD COLUMN IF NOT EXISTS grau VARCHAR(1) CHECK (grau IN ('1', '2'));
   ```
4. Add indexes: `CREATE INDEX IF NOT EXISTS idx_terceiros_trt_grau ON terceiros(trt, grau);`

**Verification**:
- Query terceiros with trt and grau filters works

**Acceptance Criteria**:
- ✅ terceiros table has trt column
- ✅ terceiros table has grau column
- ✅ Index exists for performance

---

## Phase 2: TypeScript Types (1-2 hours)

### Task 2.1: Create representantes types module
**File**: `backend/types/representantes/representantes-types.ts`
**Description**: Define all TypeScript types with discriminated unions
**Steps**:
1. Create directory: `backend/types/representantes/`
2. Define TipoPessoa type: `'pf' | 'pj'`
3. Define RepresentanteBase interface with common fields
4. Define RepresentantePessoaFisica interface extending base (cpf required, cnpj null, PF fields)
5. Define RepresentantePessoaJuridica interface extending base (cnpj required, cpf null, PJ fields)
6. Define union type: `export type Representante = RepresentantePessoaFisica | RepresentantePessoaJuridica`
7. Define CriarRepresentanteParams type with required fields
8. Define AtualizarRepresentanteParams type (id required, others optional, excluding immutables)
9. Define ListarRepresentantesParams type with all filter options
10. Define helper types: BuscarRepresentantesPorParteParams, BuscarRepresentantesPorOABParams, BuscarRepresentantesPorProcessoParams, UpsertRepresentantePorIdPessoaParams
11. Define result types: ListarRepresentantesResult, OperacaoRepresentanteResult
12. Define enum types: TipoRepresentante, SituacaoOAB
13. Define type guards: isRepresentantePessoaFisica, isRepresentantePessoaJuridica
14. Export all types

**Verification**:
- TypeScript compilation succeeds: `npx tsc --noEmit`
- Type guards work correctly in TypeScript playground

**Acceptance Criteria**:
- ✅ All types defined as per types spec
- ✅ Discriminated union enables type narrowing
- ✅ Type guards correctly narrow union type
- ✅ No TypeScript errors

---

## Phase 3: Persistence Service (3-4 hours)

### Task 3.1: Create representantes persistence service
**File**: `backend/representantes/services/representantes-persistence.service.ts`
**Description**: Implement all CRUD operations with validation
**Steps**:
1. Create directory: `backend/representantes/services/`
2. Import Supabase client and types
3. Implement validation helpers:
   - `validarCPF(cpf: string): boolean` with checksum validation
   - `validarCNPJ(cnpj: string): boolean` with checksum validation
   - `validarOAB(numero_oab: string): boolean` with format validation
   - `validarEmail(email: string): boolean` with regex validation
4. Implement `converterParaRepresentante(data: Record<string, unknown>): Representante`
   - Parse JSON fields (emails, dados_pje_completo)
   - Convert date strings to Date objects
   - Return typed union based on tipo_pessoa
5. Implement `criarRepresentante(params: CriarRepresentanteParams): Promise<OperacaoRepresentanteResult>`
   - Validate required fields
   - Validate CPF/CNPJ based on tipo_pessoa
   - Validate OAB and email if provided
   - Insert into representantes table
   - Return success result with created representante
6. Implement `atualizarRepresentante(params: AtualizarRepresentanteParams): Promise<OperacaoRepresentanteResult>`
   - Verify representante exists
   - Reject immutable field changes (tipo_pessoa, parte_tipo, parte_id)
   - Validate updated fields
   - Update table
   - Return success result
7. Implement `buscarRepresentantePorId(id: number): Promise<Representante | null>`
8. Implement `buscarRepresentantesPorParte(params: BuscarRepresentantesPorParteParams): Promise<Representante[]>`
9. Implement `buscarRepresentantesPorOAB(params: BuscarRepresentantesPorOABParams): Promise<Representante[]>`
10. Implement `buscarRepresentantesPorProcesso(params: BuscarRepresentantesPorProcessoParams): Promise<Representante[]>`
11. Implement `listarRepresentantes(params: ListarRepresentantesParams): Promise<ListarRepresentantesResult>`
    - Apply all filters
    - Calculate total count
    - Apply ordering and pagination
    - Return paginated result
12. Implement `upsertRepresentantePorIdPessoa(params: UpsertRepresentantePorIdPessoaParams): Promise<OperacaoRepresentanteResult>`
    - Search for existing record by composite key
    - Update if exists, create if not
    - Return result
13. Implement `deletarRepresentante(id: number): Promise<OperacaoRepresentanteResult>`
14. Implement error mapping helper for Supabase errors
15. Export all functions

**Verification**:
- TypeScript compilation succeeds
- Each function has correct return type
- Validation functions correctly identify valid/invalid inputs

**Acceptance Criteria**:
- ✅ All CRUD functions implemented
- ✅ Validation enforced for CPF, CNPJ, OAB, email
- ✅ Type converter correctly handles discriminated union
- ✅ Error handling returns user-friendly messages
- ✅ Upsert provides idempotency for PJE sync

---

## Phase 4: API Routes - Main CRUD (2-3 hours)

### Task 4.1: Create collection endpoint (GET, POST)
**File**: `app/api/representantes/route.ts`
**Description**: List and create representantes
**Steps**:
1. Create directory: `app/api/representantes/`
2. Import persistence service and types
3. Import `authenticateRequest` helper
4. Implement GET handler:
   - Authenticate request
   - Parse query parameters into ListarRepresentantesParams
   - Validate query parameters
   - Call `listarRepresentantes(params)`
   - Return 200 with `{ success: true, data: result }`
   - Handle errors with appropriate status codes
5. Implement POST handler:
   - Authenticate request
   - Parse request body into CriarRepresentanteParams
   - Validate required fields
   - Call `criarRepresentante(params)`
   - Return 201 Created if successful
   - Return 409 Conflict if duplicate
   - Handle errors with appropriate status codes
6. Export GET and POST as named exports

**Verification**:
- GET request with filters returns paginated results
- POST request creates new representante
- Invalid requests return 400
- Unauthenticated requests return 401

**Acceptance Criteria**:
- ✅ GET lists representantes with pagination
- ✅ POST creates new representante
- ✅ Authentication enforced
- ✅ Errors return correct status codes

---

### Task 4.2: Create item endpoint (GET, PATCH, DELETE)
**File**: `app/api/representantes/[id]/route.ts`
**Description**: Get, update, delete single representante
**Steps**:
1. Create directory: `app/api/representantes/[id]/`
2. Import persistence service and types
3. Import `authenticateRequest` helper
4. Implement GET handler:
   - Authenticate request
   - Parse id parameter
   - Validate id is positive integer
   - Call `buscarRepresentantePorId(id)`
   - Return 200 if found, 404 if not
5. Implement PATCH handler:
   - Authenticate request
   - Parse id parameter
   - Parse request body as partial update
   - Reject if immutable fields present (tipo_pessoa, parte_tipo, parte_id)
   - Call `atualizarRepresentante({ id, ...updates })`
   - Return 200 if successful, 404 if not found
6. Implement DELETE handler:
   - Authenticate request
   - Parse id parameter
   - Call `deletarRepresentante(id)`
   - Return 200 if successful, 404 if not found
7. Export GET, PATCH, DELETE as named exports

**Verification**:
- GET returns correct representante
- PATCH updates fields correctly
- PATCH rejects immutable field changes with 400
- DELETE removes representante
- Invalid IDs return 404

**Acceptance Criteria**:
- ✅ GET retrieves single representante
- ✅ PATCH updates allowed fields only
- ✅ DELETE removes representante
- ✅ Immutable fields protected

---

## Phase 5: API Routes - Specialized Queries (1-2 hours)

### Task 5.1: Create buscar por parte endpoint
**File**: `app/api/representantes/parte/[parte_tipo]/[parte_id]/route.ts`
**Description**: Query representantes by party
**Steps**:
1. Create nested directory structure
2. Implement GET handler with parte_tipo and parte_id path params
3. Parse optional trt and grau query params
4. Call `buscarRepresentantesPorParte(params)`
5. Return 200 with array of representantes

**Acceptance Criteria**:
- ✅ Returns all representantes for specified party
- ✅ Filters by trt and grau if provided

---

### Task 5.2: Create buscar por OAB endpoint
**File**: `app/api/representantes/oab/[numero_oab]/route.ts`
**Description**: Query representantes by OAB number
**Steps**:
1. Create directory structure
2. Implement GET handler with numero_oab path param
3. Parse optional trt and grau query params
4. Call `buscarRepresentantesPorOAB(params)`
5. Return 200 with array of representantes

**Acceptance Criteria**:
- ✅ Returns all representantes with specified OAB
- ✅ Filters by trt and grau if provided

---

### Task 5.3: Create buscar por processo endpoint
**File**: `app/api/representantes/processo/route.ts`
**Description**: Query representantes by process
**Steps**:
1. Create file
2. Implement GET handler with required query params: numero_processo, trt, grau
3. Validate required params present
4. Call `buscarRepresentantesPorProcesso(params)`
5. Return 200 with array of representantes

**Acceptance Criteria**:
- ✅ Returns all representantes for specified process
- ✅ Returns 400 if required params missing

---

### Task 5.4: Create upsert endpoint
**File**: `app/api/representantes/upsert/route.ts`
**Description**: Create or update representante idempotently
**Steps**:
1. Create file
2. Implement POST handler
3. Parse request body into UpsertRepresentantePorIdPessoaParams
4. Validate required fields
5. Call `upsertRepresentantePorIdPessoa(params)`
6. Return 200 with success result

**Acceptance Criteria**:
- ✅ Creates new representante if not exists
- ✅ Updates existing representante if found by composite key
- ✅ Idempotent (multiple calls with same data don't duplicate)

---

## Phase 6: Swagger Documentation (1-2 hours)

### Task 6.1: Add JSDoc annotations to collection endpoint
**File**: `app/api/representantes/route.ts`
**Description**: Document GET and POST with OpenAPI annotations
**Steps**:
1. Add JSDoc comment to GET handler with @swagger tags
2. Document all query parameters with types and descriptions
3. Document 200, 400, 401, 500 responses
4. Add JSDoc comment to POST handler
5. Document request body schema with examples (PF and PJ)
6. Document 201, 400, 401, 409, 500 responses

**Acceptance Criteria**:
- ✅ Swagger UI shows representantes endpoints
- ✅ Parameters documented with types
- ✅ Request/response schemas visible

---

### Task 6.2: Add JSDoc annotations to item endpoint
**File**: `app/api/representantes/[id]/route.ts`
**Description**: Document GET, PATCH, DELETE
**Steps**:
1. Add JSDoc to GET handler with path parameter
2. Add JSDoc to PATCH handler with immutable field warning
3. Add JSDoc to DELETE handler
4. Document all response codes

**Acceptance Criteria**:
- ✅ All methods documented in Swagger
- ✅ Path parameters documented

---

### Task 6.3: Add JSDoc annotations to specialized endpoints
**Files**:
- `app/api/representantes/parte/[parte_tipo]/[parte_id]/route.ts`
- `app/api/representantes/oab/[numero_oab]/route.ts`
- `app/api/representantes/processo/route.ts`
- `app/api/representantes/upsert/route.ts`
**Description**: Document all specialized query endpoints
**Steps**:
1. Add JSDoc to each endpoint
2. Document path parameters and query parameters
3. Document response schemas

**Acceptance Criteria**:
- ✅ All specialized endpoints visible in Swagger
- ✅ Use cases explained in descriptions

---

### Task 6.4: Define Swagger schemas
**File**: `app/api/docs/swagger-schemas.ts` (or equivalent)
**Description**: Define OpenAPI schemas for representante types
**Steps**:
1. Add RepresentanteBase schema with all common fields
2. Add RepresentantePessoaFisica schema with allOf extending base
3. Add RepresentantePessoaJuridica schema with allOf extending base
4. Add Representante union schema with discriminator
5. Add CriarRepresentanteParams schema
6. Add AtualizarRepresentanteParams schema
7. Add ListarRepresentantesResult schema
8. Add ErrorResponse schema if not already defined
9. Add "Representantes" tag with description

**Acceptance Criteria**:
- ✅ All schemas defined and referenced in endpoints
- ✅ Discriminated union documented correctly
- ✅ Examples show both PF and PJ variants

---

## Phase 7: Verification & Testing (1-2 hours)

### Task 7.1: Type check entire codebase
**Command**: `npx tsc --noEmit`
**Description**: Verify no TypeScript errors
**Steps**:
1. Run type check
2. Fix any errors found
3. Verify all imports resolve correctly

**Acceptance Criteria**:
- ✅ No TypeScript errors
- ✅ All types correctly imported

---

### Task 7.2: Test database migration
**Steps**:
1. Reset local database: `npx supabase db reset`
2. Verify representantes table created
3. Insert test representante PF
4. Insert test representante PJ
5. Verify unique constraint prevents duplicates
6. Verify CHECK constraints prevent invalid data (PF without cpf, PJ without cnpj)
7. Test all indexes with EXPLAIN queries

**Acceptance Criteria**:
- ✅ Migration runs without errors
- ✅ Constraints enforced correctly
- ✅ Indexes used in queries

---

### Task 7.3: Test persistence service functions
**Steps**:
1. Create test script or use API routes
2. Test criarRepresentante with valid PF data
3. Test criarRepresentante with valid PJ data
4. Test validation errors (invalid CPF, invalid CNPJ, missing required fields)
5. Test buscarRepresentantePorId
6. Test buscarRepresentantesPorParte
7. Test buscarRepresentantesPorOAB
8. Test buscarRepresentantesPorProcesso
9. Test listarRepresentantes with pagination
10. Test atualizarRepresentante (allowed fields)
11. Test atualizarRepresentante rejects immutable field changes
12. Test upsertRepresentantePorIdPessoa (create)
13. Test upsertRepresentantePorIdPessoa (update existing)
14. Test deletarRepresentante

**Acceptance Criteria**:
- ✅ All CRUD operations work correctly
- ✅ Validation catches invalid data
- ✅ Type narrowing works (PF vs PJ)
- ✅ Upsert is idempotent

---

### Task 7.4: Test API endpoints
**Steps**:
1. Start dev server: `npm run dev`
2. Test GET /api/representantes (list with pagination)
3. Test POST /api/representantes (create PF)
4. Test POST /api/representantes (create PJ)
5. Test POST with duplicate data returns 409
6. Test POST with invalid data returns 400
7. Test GET /api/representantes/[id]
8. Test PATCH /api/representantes/[id] (update allowed fields)
9. Test PATCH with immutable field returns 400
10. Test DELETE /api/representantes/[id]
11. Test GET /api/representantes/parte/cliente/123
12. Test GET /api/representantes/oab/SP123456
13. Test GET /api/representantes/processo
14. Test POST /api/representantes/upsert (create)
15. Test POST /api/representantes/upsert (update)
16. Test all endpoints without auth return 401

**Acceptance Criteria**:
- ✅ All endpoints return expected responses
- ✅ Authentication enforced
- ✅ Error codes correct
- ✅ Data persists correctly

---

### Task 7.5: Verify Swagger documentation
**Steps**:
1. Open Swagger UI: http://localhost:3000/api/docs
2. Verify "Representantes" tag exists
3. Verify all endpoints listed
4. Verify schemas defined
5. Try "Try it out" for each endpoint
6. Verify examples show both PF and PJ variants

**Acceptance Criteria**:
- ✅ All endpoints visible and documented
- ✅ Schemas render correctly
- ✅ Examples are clear and accurate
- ✅ Can execute requests from Swagger UI

---

## Phase 8: Update Related Systems (Optional, 0.5-1 hour)

### Task 8.1: Update PJE capture scripts
**Files**: Check `backend/captura/services/` for process capture scripts
**Description**: Ensure PJE capture scripts save representantes data
**Steps**:
1. Identify scripts that fetch process details from PJE
2. Verify they extract representantes from JSON response
3. Ensure they call upsert endpoint to save representantes
4. Test with real PJE data

**Acceptance Criteria**:
- ✅ PJE capture saves representantes automatically
- ✅ Upsert prevents duplicates on re-sync

---

## Summary Checklist

- [ ] Database migration created and tested
- [ ] TypeScript types defined with discriminated unions
- [ ] Persistence service implements all CRUD operations
- [ ] Validation functions work correctly (CPF, CNPJ, OAB, email)
- [ ] Main API routes (collection and item) functional
- [ ] Specialized query endpoints functional
- [ ] Swagger documentation complete for all endpoints
- [ ] Type checking passes with no errors
- [ ] All tests pass
- [ ] Integration with PJE capture (if applicable)

**Total estimated time**: 8-12 hours
**Complexity**: Medium-High (discriminated unions, complex validation, multiple specialized endpoints)
