# Spec Delta: types (representantes)

## ADDED Requirements

### Requirement: TypeScript Discriminated Union Types

The system SHALL define TypeScript types for representantes using discriminated unions to enforce type safety for PF vs PJ representatives.

#### Scenario: Representante type uses discriminated union based on tipo_pessoa

**Given** a representante entity
**When** TypeScript type checking is performed
**Then** the type system SHALL enforce:
- If `tipo_pessoa === 'pf'`, then `cpf` is `string` and `cnpj` is `null`
- If `tipo_pessoa === 'pj'`, then `cnpj` is `string` and `cpf` is `null`
- PF-specific fields (sexo, data_nascimento, nome_mae, etc.) are typed as `string | null` for PF, always `null` for PJ
- PJ-specific fields (razao_social, nome_fantasia, etc.) are typed as `string | null` for PJ, always `null` for PF

**Type definition**:
```typescript
type TipoPessoa = 'pf' | 'pj';

interface RepresentanteBase {
  id: number;
  id_pje: number | null;
  id_pessoa_pje: number;
  trt: string;
  grau: '1' | '2';
  parte_tipo: 'cliente' | 'parte_contraria' | 'terceiro';
  parte_id: number;
  numero_processo: string;
  tipo_pessoa: TipoPessoa;
  nome: string;
  // ... common fields
}

interface RepresentantePessoaFisica extends RepresentanteBase {
  tipo_pessoa: 'pf';
  cpf: string;
  cnpj: null;
  // PF fields
  sexo: string | null;
  data_nascimento: string | null;
  // ... other PF fields
  // PJ fields all null
  razao_social: null;
  nome_fantasia: null;
  // ... other PJ fields
}

interface RepresentantePessoaJuridica extends RepresentanteBase {
  tipo_pessoa: 'pj';
  cnpj: string;
  cpf: null;
  // PJ fields
  razao_social: string | null;
  nome_fantasia: string | null;
  // ... other PJ fields
  // PF fields all null
  sexo: null;
  data_nascimento: null;
  // ... other PF fields
}

export type Representante = RepresentantePessoaFisica | RepresentantePessoaJuridica;
```

### Requirement: CRUD Parameter Types

The system SHALL define types for create, update, list, and query operations on representantes.

#### Scenario: CriarRepresentanteParams enforces required fields

**Given** the criar representante function
**When** creating a new representante
**Then** the params type SHALL require:
- `id_pessoa_pje: number`
- `trt: string`
- `grau: '1' | '2'`
- `parte_tipo: 'cliente' | 'parte_contraria' | 'terceiro'`
- `parte_id: number`
- `numero_processo: string`
- `tipo_pessoa: 'pf' | 'pj'`
- `nome: string`
- `cpf: string` (if tipo_pessoa = 'pf')
- `cnpj: string` (if tipo_pessoa = 'pj')

**And** SHALL accept optional fields:
- `id_pje`, `polo`, `tipo`, `numero_oab`, `situacao_oab`, `emails`, contact fields, PF/PJ-specific fields, metadata

#### Scenario: AtualizarRepresentanteParams allows partial updates

**Given** the atualizar representante function
**When** updating an existing representante
**Then** the params type SHALL require:
- `id: number` (the representante to update)

**And** SHALL accept ALL other fields as optional Partial<Representante>
**But** SHALL NOT allow changing:
- `tipo_pessoa` (cannot convert PF to PJ or vice versa)
- `parte_tipo` (cannot move representante to different party type)
- `parte_id` (cannot reassign to different party)

#### Scenario: ListarRepresentantesParams supports filtering

**Given** the listar representantes function
**When** querying representantes with filters
**Then** the params type SHALL support:
- `pagina?: number` (default 1)
- `limite?: number` (default 50)
- `parte_tipo?: 'cliente' | 'parte_contraria' | 'terceiro'`
- `parte_id?: number`
- `trt?: string`
- `grau?: '1' | '2'`
- `numero_processo?: string`
- `numero_oab?: string`
- `situacao_oab?: string`
- `tipo_pessoa?: 'pf' | 'pj'`
- `busca?: string` (search in nome, cpf, cnpj, email)
- `ordenar_por?: OrdenarPorRepresentante`
- `ordem?: 'asc' | 'desc'`

#### Scenario: Helper types for specialized queries

**Given** the representante types module
**When** developers need to query representantes by specific criteria
**Then** the following helper types SHALL be defined:

```typescript
export interface BuscarRepresentantesPorParteParams {
  parte_tipo: 'cliente' | 'parte_contraria' | 'terceiro';
  parte_id: number;
  trt?: string;
  grau?: '1' | '2';
}

export interface BuscarRepresentantesPorOABParams {
  numero_oab: string;
  trt?: string;
  grau?: '1' | '2';
}

export interface BuscarRepresentantesPorProcessoParams {
  numero_processo: string;
  trt: string;
  grau: '1' | '2';
}

export interface UpsertRepresentantePorIdPessoaParams extends CriarRepresentanteParams {
  // Upsert: create if not exists, update if exists based on id_pessoa_pje + context
}
```

### Requirement: Result Types

The system SHALL define result types for list and operation responses.

#### Scenario: ListarRepresentantesResult includes pagination metadata

**Given** a list representantes query
**When** the service returns results
**Then** the result type SHALL include:
```typescript
export interface ListarRepresentantesResult {
  representantes: Representante[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}
```

#### Scenario: OperacaoRepresentanteResult indicates success/failure

**Given** a create/update/delete operation
**When** the operation completes
**Then** the result type SHALL include:
```typescript
export interface OperacaoRepresentanteResult {
  sucesso: boolean;
  representante?: Representante;
  erro?: string;
}
```

### Requirement: Enum Types

The system SHALL define enums for representante-specific values.

#### Scenario: TipoRepresentante enum lists valid types

**Given** the representante type field
**When** creating or validating a representante
**Then** the enum SHALL include:
```typescript
export type TipoRepresentante =
  | 'ADVOGADO'
  | 'PROCURADOR'
  | 'DEFENSOR_PUBLICO'
  | 'ADVOGADO_DATIVO'
  | 'OUTRO';
```

#### Scenario: SituacaoOAB enum lists OAB statuses

**Given** the situacao_oab field
**When** validating OAB status
**Then** the enum SHALL include:
```typescript
export type SituacaoOAB =
  | 'REGULAR'
  | 'SUSPENSO'
  | 'CANCELADO'
  | 'LICENCIADO'
  | 'FALECIDO';
```

### Requirement: Type Guards

The system SHALL provide type guard functions for discriminated union narrowing.

#### Scenario: isRepresentantePessoaFisica narrows type

**Given** a Representante union type
**When** checking if representante is PF
**Then** the type guard SHALL narrow the type:
```typescript
export function isRepresentantePessoaFisica(
  representante: Representante
): representante is RepresentantePessoaFisica {
  return representante.tipo_pessoa === 'pf';
}
```

**Usage**:
```typescript
if (isRepresentantePessoaFisica(repr)) {
  // TypeScript knows repr.cpf is string, repr.cnpj is null
  console.log(repr.cpf); // OK
  console.log(repr.cnpj); // Error: Type is null
}
```

## MODIFIED Requirements

None - new types.

## REMOVED Requirements

None.
