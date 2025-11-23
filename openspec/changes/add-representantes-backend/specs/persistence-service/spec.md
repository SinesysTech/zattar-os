# Spec Delta: persistence-service (representantes)

## ADDED Requirements

### Requirement: Persistence Service Module

The system SHALL provide a persistence service module for representantes CRUD operations located at `backend/representantes/services/representantes-persistence.service.ts`.

#### Scenario: Service exports all required functions

**Given** the representantes persistence service module
**When** imported by API routes or other services
**Then** the following functions SHALL be exported:
- `criarRepresentante`
- `atualizarRepresentante`
- `buscarRepresentantePorId`
- `buscarRepresentantesPorParte`
- `buscarRepresentantesPorOAB`
- `buscarRepresentantesPorProcesso`
- `listarRepresentantes`
- `upsertRepresentantePorIdPessoa`
- `deletarRepresentante`
- `converterParaRepresentante`
- `validarCPF`
- `validarCNPJ`
- `validarOAB`
- `validarEmail`

### Requirement: Create Operation

The system SHALL provide a function to create a new representante.

#### Scenario: criarRepresentante creates a new record

**Given** valid representante data
**When** `criarRepresentante(params: CriarRepresentanteParams)` is called
**Then** the function SHALL:
1. Validate required fields (id_pessoa_pje, trt, grau, parte_tipo, parte_id, numero_processo, tipo_pessoa, nome)
2. Validate cpf if tipo_pessoa = 'pf' (not null, valid format)
3. Validate cnpj if tipo_pessoa = 'pj' (not null, valid format)
4. Validate numero_oab if provided
5. Validate email addresses if provided
6. Insert record into representantes table
7. Return `OperacaoRepresentanteResult` with sucesso=true and the created representante
8. Return `OperacaoRepresentanteResult` with sucesso=false and error message if validation fails

**Validation rules**:
- `id_pessoa_pje`: positive integer
- `trt`: non-empty string matching pattern 'TRT\d{1,2}'
- `grau`: must be '1' or '2'
- `parte_tipo`: must be 'cliente' | 'parte_contraria' | 'terceiro'
- `parte_id`: positive integer
- `numero_processo`: non-empty string
- `tipo_pessoa`: must be 'pf' or 'pj'
- `nome`: non-empty string
- `cpf`: 11 digits, valid checksum (if tipo_pessoa='pf')
- `cnpj`: 14 digits, valid checksum (if tipo_pessoa='pj')
- `emails`: array of valid email strings
- `numero_oab`: format 'XX123456' where XX is UF code

**Error handling**:
- Unique constraint violation: "Representante já cadastrado para esta parte neste processo"
- Foreign key violation: "Parte não encontrada"
- Validation error: Specific field error message

### Requirement: Update Operation

The system SHALL provide a function to update an existing representante.

#### Scenario: atualizarRepresentante updates allowed fields

**Given** an existing representante with id
**When** `atualizarRepresentante(params: AtualizarRepresentanteParams)` is called
**Then** the function SHALL:
1. Validate that representante with params.id exists
2. Reject changes to immutable fields (tipo_pessoa, parte_tipo, parte_id)
3. Validate updated field values using same rules as criar
4. Update record in representantes table
5. Return `OperacaoRepresentanteResult` with sucesso=true and updated representante
6. Return `OperacaoRepresentanteResult` with sucesso=false if validation fails

**Immutable fields** (cannot be changed after creation):
- `tipo_pessoa` (cannot convert PF to PJ or vice versa)
- `parte_tipo` (cannot reassign to different party type)
- `parte_id` (cannot reassign to different party)

**Updatable fields**:
- Common fields: nome, situacao, status, principal, endereco_desconhecido, polo
- Contact fields: emails, ddd_celular, numero_celular, ddd_telefone, numero_telefone, email
- Lawyer fields: tipo, numero_oab, situacao_oab
- PF fields (if tipo_pessoa='pf'): sexo, data_nascimento, nome_mae, nome_pai, nacionalidade, estado_civil, uf_nascimento, municipio_nascimento, pais_nascimento
- PJ fields (if tipo_pessoa='pj'): razao_social, nome_fantasia, inscricao_estadual, tipo_empresa
- Metadata: dados_pje_completo, ordem, data_habilitacao

### Requirement: Read Operations

The system SHALL provide functions to query representantes by various criteria.

#### Scenario: buscarRepresentantePorId retrieves single record

**Given** a representante id
**When** `buscarRepresentantePorId(id: number)` is called
**Then** the function SHALL:
1. Query representantes table by id
2. Return typed Representante object (PessoaFisica or PessoaJuridica) if found
3. Return null if not found

#### Scenario: buscarRepresentantesPorParte retrieves all reps for a party

**Given** valid BuscarRepresentantesPorParteParams
**When** `buscarRepresentantesPorParte(params)` is called
**Then** the function SHALL:
1. Query representantes WHERE parte_tipo = params.parte_tipo AND parte_id = params.parte_id
2. Filter by trt if provided
3. Filter by grau if provided
4. Return array of Representante objects ordered by ordem ASC, nome ASC

#### Scenario: buscarRepresentantesPorOAB retrieves reps by OAB number

**Given** valid BuscarRepresentantesPorOABParams
**When** `buscarRepresentantesPorOAB(params)` is called
**Then** the function SHALL:
1. Query representantes WHERE numero_oab = params.numero_oab
2. Filter by trt if provided
3. Filter by grau if provided
4. Return array of Representante objects

#### Scenario: buscarRepresentantesPorProcesso retrieves reps for a process

**Given** valid BuscarRepresentantesPorProcessoParams
**When** `buscarRepresentantesPorProcesso(params)` is called
**Then** the function SHALL:
1. Query representantes WHERE numero_processo = params.numero_processo AND trt = params.trt AND grau = params.grau
2. Return array of Representante objects grouped by parte_tipo, ordered by ordem ASC

### Requirement: List Operation with Pagination

The system SHALL provide a paginated list function with filtering and sorting.

#### Scenario: listarRepresentantes returns paginated results

**Given** valid ListarRepresentantesParams
**When** `listarRepresentantes(params)` is called
**Then** the function SHALL:
1. Apply filters:
   - `parte_tipo` if provided
   - `parte_id` if provided
   - `trt` if provided
   - `grau` if provided
   - `numero_processo` if provided
   - `numero_oab` if provided (exact match)
   - `situacao_oab` if provided
   - `tipo_pessoa` if provided
   - `busca` if provided (ILIKE on nome, cpf, cnpj, email)
2. Calculate total count
3. Apply ordering (default: nome ASC)
4. Apply pagination (default: page 1, limit 50)
5. Return `ListarRepresentantesResult` with representantes array, total, pagina, limite, totalPaginas

**Default values**:
- `pagina`: 1
- `limite`: 50
- `ordenar_por`: 'nome'
- `ordem`: 'asc'

**Allowed ordenar_por values**:
- 'nome'
- 'numero_oab'
- 'situacao_oab'
- 'created_at'
- 'data_habilitacao'

### Requirement: Upsert Operation

The system SHALL provide an upsert function for idempotent PJE sync operations.

#### Scenario: upsertRepresentantePorIdPessoa creates or updates by context

**Given** valid UpsertRepresentantePorIdPessoaParams
**When** `upsertRepresentantePorIdPessoa(params)` is called
**Then** the function SHALL:
1. Search for existing record matching (id_pessoa_pje, trt, grau, parte_id, parte_tipo, numero_processo)
2. If found: update record with new data (preserving id and created_at)
3. If not found: create new record
4. Return `OperacaoRepresentanteResult` with sucesso=true and the representante
5. Return `OperacaoRepresentanteResult` with sucesso=false if validation fails

**Rationale**: PJE sync may fetch same representante multiple times. Upsert ensures idempotency.

### Requirement: Delete Operation

The system SHALL provide a function to delete a representante.

#### Scenario: deletarRepresentante removes record

**Given** a representante id
**When** `deletarRepresentante(id: number)` is called
**Then** the function SHALL:
1. Verify representante exists
2. Delete record from representantes table
3. Return `OperacaoRepresentanteResult` with sucesso=true
4. Return `OperacaoRepresentanteResult` with sucesso=false and error if not found

**Note**: Soft delete is NOT required. Hard delete is acceptable as representantes are re-synced from PJE.

### Requirement: Type Conversion

The system SHALL provide a converter from raw database row to typed Representante.

#### Scenario: converterParaRepresentante narrows discriminated union

**Given** a raw database row object
**When** `converterParaRepresentante(data: Record<string, unknown>)` is called
**Then** the function SHALL:
1. Validate tipo_pessoa field exists
2. If tipo_pessoa = 'pf': return RepresentantePessoaFisica with cpf as string, cnpj as null
3. If tipo_pessoa = 'pj': return RepresentantePessoaJuridica with cnpj as string, cpf as null
4. Parse JSON fields: emails array, dados_pje_completo object
5. Convert date strings to Date objects: data_nascimento, data_habilitacao, created_at, updated_at
6. Throw error if tipo_pessoa is invalid

**Type safety**: Return type uses TypeScript discriminated union to enable type narrowing.

### Requirement: Validation Functions

The system SHALL provide validation helper functions for representante fields.

#### Scenario: validarCPF validates CPF checksum

**Given** a CPF string
**When** `validarCPF(cpf: string): boolean` is called
**Then** the function SHALL:
1. Remove non-numeric characters
2. Verify length is 11 digits
3. Reject known invalid CPFs (all same digit)
4. Calculate and verify checksum digits
5. Return true if valid, false otherwise

#### Scenario: validarCNPJ validates CNPJ checksum

**Given** a CNPJ string
**When** `validarCNPJ(cnpj: string): boolean` is called
**Then** the function SHALL:
1. Remove non-numeric characters
2. Verify length is 14 digits
3. Reject known invalid CNPJs (all same digit)
4. Calculate and verify checksum digits
5. Return true if valid, false otherwise

#### Scenario: validarOAB validates OAB format

**Given** an OAB registration string
**When** `validarOAB(numero_oab: string): boolean` is called
**Then** the function SHALL:
1. Verify format matches pattern: 2 letters (UF) + 3-6 digits
2. Verify UF code is valid Brazilian state (AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO)
3. Return true if valid, false otherwise

**Example valid OABs**: 'SP123456', 'RJ12345', 'MG654321'

#### Scenario: validarEmail validates email format

**Given** an email string
**When** `validarEmail(email: string): boolean` is called
**Then** the function SHALL:
1. Verify format matches RFC 5322 simplified pattern
2. Return true if valid, false otherwise

**Pattern**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Requirement: Error Handling

The system SHALL handle errors consistently across all operations.

#### Scenario: Database errors return descriptive messages

**Given** a database operation fails
**When** any persistence function encounters an error
**Then** the function SHALL:
1. Log error with stack trace to console
2. Return `OperacaoRepresentanteResult` with sucesso=false
3. Return user-friendly error message (no SQL exposure)
4. Map common errors:
   - Unique violation → "Representante já cadastrado"
   - Foreign key violation → "Parte não encontrada"
   - Not null violation → "Campo obrigatório não informado"
   - Check constraint violation → "Valor inválido para campo"

### Requirement: Supabase Client Usage

The system SHALL use Supabase server client for all database operations.

#### Scenario: Service uses authenticated Supabase client

**Given** the persistence service
**When** any database operation is performed
**Then** the function SHALL:
1. Import `createClient` from `@/app/_lib/supabase/server`
2. Create client instance for the operation
3. Use client to query/insert/update/delete from `representantes` table
4. Handle Supabase errors and convert to OperacaoRepresentanteResult

**Example**:
```typescript
import { createClient } from '@/app/_lib/supabase/server';

export const criarRepresentante = async (
  params: CriarRepresentanteParams
): Promise<OperacaoRepresentanteResult> => {
  const supabase = await createClient();

  // Validation...

  const { data, error } = await supabase
    .from('representantes')
    .insert(params)
    .select()
    .single();

  if (error) {
    return { sucesso: false, erro: mapSupabaseError(error) };
  }

  return { sucesso: true, representante: converterParaRepresentante(data) };
};
```

## MODIFIED Requirements

None - new service.

## REMOVED Requirements

None.
