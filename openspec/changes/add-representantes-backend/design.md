# Design: add-representantes-backend

## Architecture Overview

### Entity Relationship

```
┌──────────────┐         ┌─────────────────┐         ┌──────────────────┐
│  clientes    │         │ partes_         │         │    terceiros     │
│              │         │ contrarias      │         │                  │
│ id_pessoa_pje│         │ id_pessoa_pje   │         │ id_pessoa_pje    │
│ trt          │         │ trt             │         │ trt              │
│ grau         │         │ grau            │         │ grau             │
└──────┬───────┘         └────────┬────────┘         └────────┬─────────┘
       │                          │                           │
       │                          │                           │
       │         ┌────────────────┴────────────────┐         │
       │         │                                 │         │
       └─────────┤      representantes             ├─────────┘
                 │                                 │
                 │  parte_tipo: 'cliente' |        │
                 │             'parte_contraria' | │
                 │             'terceiro'          │
                 │  parte_id: foreign key          │
                 │  id_pessoa_pje: PJE ID          │
                 │  trt: context                   │
                 │  grau: context                  │
                 │  numero_oab: lawyer reg         │
                 │  situacao_oab: status           │
                 └─────────────────────────────────┘
```

### Key Design Decisions

#### 1. Polymorphic Relationship

Representantes link to ANY party type (cliente, parte_contraria, terceiro) using:
- `parte_tipo`: Discriminator ('cliente' | 'parte_contraria' | 'terceiro')
- `parte_id`: Foreign key to the specific party table

**Rationale**: Follows established pattern from `enderecos` and `processo_partes` tables.

#### 2. TRT/Grau Context

Every representante record includes `trt` and `grau` because:
- Same lawyer may represent different parties in different tribunals
- Representation data is specific to each tribunal/grau capture context
- Enables filtering: "Show all lawyers in TRT3 primeiro grau"

**Example**: Advogado "João Silva OAB/MG123456" may represent:
- Cliente A in TRT3 primeiro grau
- Cliente B in TRT15 segundo grau
- Parte Contrária C in TRT3 primeiro grau

These are **3 separate representante records** with same `id_pessoa_pje` but different contexts.

#### 3. Deduplication Strategy

Uniqueness constraint: `UNIQUE (id_pessoa_pje, trt, grau, parte_id, parte_tipo, numero_processo)`

**Why numero_processo**: Same lawyer may represent same party in different processes within same TRT/grau.

**Upsert pattern**: `upsertRepresentantePorIdPessoa()` updates if exists, creates if new.

#### 4. Discriminated Union (PF/PJ)

Like clientes/partes_contrarias/terceiros, representantes use TypeScript discriminated unions:
- `tipo_pessoa: 'pf'` → PF-specific fields populated (cpf, sexo, data_nascimento)
- `tipo_pessoa: 'pj'` → PJ-specific fields populated (cnpj, razao_social)

**Rationale**: PJE API shows representantes can be PF (individual lawyers) or PJ (law firms).

#### 5. OAB Data

Fields specific to lawyer registration:
- `numero_oab`: Ex: "MG128404" (UF + number)
- `situacao_oab`: "REGULAR" | "SUSPENSO" | "CANCELADO" | "LICENCIADO"
- `tipo`: "ADVOGADO" | "PROCURADOR" | "DEFENSOR_PUBLICO" (from PJE)

**No validation**: Store as-is from PJE. Frontend can warn if `situacao_oab !== 'REGULAR'`.

#### 6. Data Volume & Performance

**Estimated volume**:
- ~1000 processes
- ~3 parties per process
- ~2 lawyers per party
- = ~6000 representante records

**Indexes**:
```sql
CREATE INDEX idx_representantes_id_pessoa_pje ON representantes(id_pessoa_pje);
CREATE INDEX idx_representantes_trt_grau ON representantes(trt, grau);
CREATE INDEX idx_representantes_parte ON representantes(parte_tipo, parte_id);
CREATE INDEX idx_representantes_numero_oab ON representantes(numero_oab);
CREATE INDEX idx_representantes_numero_processo ON representantes(numero_processo);
```

#### 7. API Design

**REST endpoints**:
```
GET    /api/representantes              # List with filters
POST   /api/representantes              # Create
GET    /api/representantes/[id]         # Get by ID
PATCH  /api/representantes/[id]         # Update
DELETE /api/representantes/[id]         # Delete
GET    /api/representantes/por-parte    # List by party
GET    /api/representantes/por-oab      # Find by OAB number
```

**Filter parameters**:
- `parte_tipo`, `parte_id` (find all lawyers for a party)
- `trt`, `grau` (scope to tribunal/grau)
- `numero_processo` (all lawyers in a process)
- `numero_oab` (find specific lawyer)
- `situacao_oab` (only REGULAR lawyers)

### Database Schema (45 campos)

Based on PJE-TRT API structure from provided JSON:

**Identification** (5 campos):
- `id` (serial primary key)
- `id_pje` (integer, PJE internal ID)
- `id_pessoa_pje` (integer, pessoa ID - dedup key)
- `trt` (varchar, ex: "3")
- `grau` (varchar, "1" or "2")

**Context** (4 campos):
- `parte_tipo` ('cliente' | 'parte_contraria' | 'terceiro')
- `parte_id` (integer, FK to specific party table)
- `numero_processo` (varchar, process number)
- `polo` ('ativo' | 'passivo' | 'outros')

**Common** (6 campos):
- `tipo_pessoa` ('pf' | 'pj')
- `nome` (varchar, full name)
- `situacao` ('A' | 'I' | 'E' | 'H')
- `status` (varchar, ex: "A")
- `principal` (boolean, is main representative?)
- `endereco_desconhecido` (boolean)

**Lawyer-specific** (4 campos):
- `tipo` (varchar, "ADVOGADO" | "PROCURADOR" | "DEFENSOR_PUBLICO")
- `id_tipo_parte` (integer, PJE type ID)
- `numero_oab` (varchar, ex: "MG128404")
- `situacao_oab` (varchar, "REGULAR" | "SUSPENSO" | etc.)

**Contact** (6 campos):
- `emails` (text[] array)
- `ddd_celular` (varchar)
- `numero_celular` (varchar)
- `ddd_telefone` (varchar)
- `numero_telefone` (varchar)
- `email` (varchar, primary email)

**PF-only** (10 campos):
- `cpf` (varchar)
- `sexo` (varchar, "MASCULINO" | "FEMININO")
- `data_nascimento` (date)
- `nome_mae` (varchar)
- `nome_pai` (varchar)
- `nacionalidade` (varchar)
- `estado_civil` (varchar)
- `uf_nascimento` (varchar)
- `municipio_nascimento` (varchar)
- `pais_nascimento` (varchar)

**PJ-only** (5 campos):
- `cnpj` (varchar)
- `razao_social` (varchar)
- `nome_fantasia` (varchar)
- `inscricao_estadual` (varchar)
- `tipo_empresa` (varchar)

**Metadata** (5 campos):
- `dados_pje_completo` (jsonb, full PJE response)
- `ordem` (integer, display order)
- `data_habilitacao` (timestamp, when registered in PJE)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Total**: 45 campos

### Migration Strategy

**Single migration file**: `20251123000002_create_representantes.sql`

**Rollback safe**: Include `DROP TABLE IF EXISTS` in down migration.

**No data migration needed**: New table, populated from future PJE captures.

### Service Layer Pattern

Follow established patterns from clientes/partes_contrarias/terceiros:

```typescript
// backend/representantes/services/persistence/representante-persistence.service.ts

export async function criarRepresentante(params: CriarRepresentanteParams): Promise<OperacaoRepresentanteResult>
export async function atualizarRepresentante(params: AtualizarRepresentanteParams): Promise<OperacaoRepresentanteResult>
export async function buscarRepresentantePorId(id: number): Promise<Representante | null>
export async function buscarRepresentantesPorParte(params: BuscarRepresentantesPorParteParams): Promise<Representante[]>
export async function buscarRepresentantesPorOAB(numeroOab: string, trt?: string, grau?: string): Promise<Representante[]>
export async function listarRepresentantes(params: ListarRepresentantesParams): Promise<ListarRepresentantesResult>
export async function upsertRepresentantePorIdPessoa(params: UpsertRepresentanteParams): Promise<OperacaoRepresentanteResult>
export async function deletarRepresentante(id: number): Promise<OperacaoRepresentanteResult>
```

### Type System

**Discriminated union**:
```typescript
type TipoPessoa = 'pf' | 'pj';

interface RepresentanteBase {
  id: number;
  tipo_pessoa: TipoPessoa;
  nome: string;
  // ... common fields
}

interface RepresentantePessoaFisica extends RepresentanteBase {
  tipo_pessoa: 'pf';
  cpf: string;
  cnpj: null;
  // ... PF fields
  // All PJ fields null
}

interface RepresentantePessoaJuridica extends RepresentanteBase {
  tipo_pessoa: 'pj';
  cnpj: string;
  cpf: null;
  // ... PJ fields
  // All PF fields null
}

export type Representante = RepresentantePessoaFisica | RepresentantePessoaJuridica;
```

### Swagger Documentation

All endpoints documented with JSDoc @swagger annotations:
- Request/response schemas
- Query parameters
- Error responses (400, 401, 404, 500)
- Authentication requirements

### Testing Strategy

**Manual testing** (FASE 7):
- Create representante via POST /api/representantes
- List representantes with filters
- Update representante data
- Delete representante
- Verify uniqueness constraint
- Test upsert behavior

**Future automated tests** (out of scope):
- Unit tests for validation functions
- Integration tests for API endpoints
- E2E tests for PJE capture flow

## Trade-offs

### Chosen: Polymorphic FK (parte_tipo + parte_id)
**Pro**: Flexible, follows existing pattern, easier queries "all lawyers for this party"
**Con**: No native FK constraint enforcement, requires application-level validation

**Alternative**: Separate columns (cliente_id, parte_contraria_id, terceiro_id)
**Why not**: More columns, complex NULL handling, harder to query across party types

### Chosen: Snake_case API
**Pro**: Consistent with database, aligns with PJE-TRT API, easier backend-to-DB mapping
**Con**: Breaking change from old camelCase, frontend needs conversion layer

**Already decided**: This change proposal continues the snake_case convention.

### Chosen: Store OAB as-is, no validation
**Pro**: Simpler, no external API dependency, preserves PJE data exactly
**Con**: May contain invalid/outdated OAB numbers

**Mitigation**: Frontend can show warning badge if `situacao_oab !== 'REGULAR'`.

## Future Enhancements (Out of Scope)

1. **Email notifications**: Send emails to opposing lawyers using `emails` field
2. **OAB validation API**: Integrate with CAB/OAB APIs to verify lawyer status
3. **Representante dashboard**: Dedicated UI page for lawyer management
4. **Conflict checking**: Detect if same lawyer represents opposing parties
5. **Historical tracking**: Audit log of representation changes over time
