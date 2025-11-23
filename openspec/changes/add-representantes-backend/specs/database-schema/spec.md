# Spec Delta: database-schema (representantes)

## ADDED Requirements

### Requirement: Representantes Table Structure

The system SHALL create a `representantes` table to store legal representatives (lawyers) who act on behalf of parties in legal processes.

#### Scenario: Create representantes table with 45 campos aligned to PJE-TRT API

**Given** the system database
**When** the migration is applied
**Then** the `representantes` table SHALL exist with the following structure:

**Identification columns**:
- `id` SERIAL PRIMARY KEY
- `id_pje` INTEGER (PJE internal ID for this representante record)
- `id_pessoa_pje` INTEGER NOT NULL (PJE pessoa ID - deduplication key)
- `trt` VARCHAR NOT NULL (tribunal regional do trabalho, ex: "3", "15")
- `grau` VARCHAR NOT NULL ('1' for primeiro grau, '2' for segundo grau)

**Context columns**:
- `parte_tipo` VARCHAR NOT NULL CHECK (parte_tipo IN ('cliente', 'parte_contraria', 'terceiro'))
- `parte_id` INTEGER NOT NULL (foreign key to specific party table based on parte_tipo)
- `numero_processo` VARCHAR NOT NULL (process number this representation applies to)
- `polo` VARCHAR CHECK (polo IN ('ativo', 'passivo', 'outros'))

**Common columns**:
- `tipo_pessoa` VARCHAR NOT NULL CHECK (tipo_pessoa IN ('pf', 'pj'))
- `nome` VARCHAR NOT NULL
- `situacao` VARCHAR CHECK (situacao IN ('A', 'I', 'E', 'H'))
- `status` VARCHAR
- `principal` BOOLEAN
- `endereco_desconhecido` BOOLEAN

**Lawyer-specific columns**:
- `tipo` VARCHAR (ex: "ADVOGADO", "PROCURADOR", "DEFENSOR_PUBLICO")
- `id_tipo_parte` INTEGER (PJE tipo parte ID)
- `numero_oab` VARCHAR (ex: "MG128404", "BA79812")
- `situacao_oab` VARCHAR (ex: "REGULAR", "SUSPENSO", "CANCELADO")

**Contact columns**:
- `emails` TEXT[] (array of email addresses)
- `ddd_celular` VARCHAR
- `numero_celular` VARCHAR
- `ddd_telefone` VARCHAR
- `numero_telefone` VARCHAR
- `email` VARCHAR (primary email)

**PF-specific columns** (NULL if tipo_pessoa = 'pj'):
- `cpf` VARCHAR
- `sexo` VARCHAR
- `data_nascimento` DATE
- `nome_mae` VARCHAR
- `nome_pai` VARCHAR
- `nacionalidade` VARCHAR
- `estado_civil` VARCHAR
- `uf_nascimento` VARCHAR
- `municipio_nascimento` VARCHAR
- `pais_nascimento` VARCHAR

**PJ-specific columns** (NULL if tipo_pessoa = 'pf'):
- `cnpj` VARCHAR
- `razao_social` VARCHAR
- `nome_fantasia` VARCHAR
- `inscricao_estadual` VARCHAR
- `tipo_empresa` VARCHAR

**Metadata columns**:
- `dados_pje_completo` JSONB (full PJE API response)
- `ordem` INTEGER (display order within party)
- `data_habilitacao` TIMESTAMP WITH TIME ZONE (when registered in PJE)
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### Requirement: Uniqueness Constraints

The system SHALL prevent duplicate representantes using composite uniqueness.

#### Scenario: Unique constraint prevents duplicate lawyer for same party in same process/context

**Given** a representante with `id_pessoa_pje=123, trt="3", grau="1", parte_id=456, parte_tipo="cliente", numero_processo="0010000-11.2025.5.03.0001"`
**When** attempting to insert another representante with the same combination
**Then** the database SHALL reject the insert with a unique constraint violation

**Constraint**: `UNIQUE (id_pessoa_pje, trt, grau, parte_id, parte_tipo, numero_processo)`

### Requirement: Performance Indexes

The system SHALL create indexes on frequently queried columns for optimal performance.

#### Scenario: Indexes enable fast queries on representantes

**Given** the `representantes` table
**When** the migration is applied
**Then** the following indexes SHALL be created:

- `idx_representantes_id_pessoa_pje` ON `id_pessoa_pje`
- `idx_representantes_trt_grau` ON `(trt, grau)`
- `idx_representantes_parte` ON `(parte_tipo, parte_id)`
- `idx_representantes_numero_oab` ON `numero_oab` WHERE `numero_oab IS NOT NULL`
- `idx_representantes_numero_processo` ON `numero_processo`
- `idx_representantes_situacao_oab` ON `situacao_oab` WHERE `situacao_oab IS NOT NULL`

### Requirement: Data Validation Constraints

The system SHALL enforce data integrity rules at the database level.

#### Scenario: PF representante has cpf, not cnpj

**Given** a representante with `tipo_pessoa='pf'`
**When** the record is inserted or updated
**Then** the database SHALL enforce:
- `cpf` MUST be NOT NULL
- `cnpj` MUST be NULL

#### Scenario: PJ representante has cnpj, not cpf

**Given** a representante with `tipo_pessoa='pj'`
**When** the record is inserted or updated
**Then** the database SHALL enforce:
- `cnpj` MUST be NOT NULL
- `cpf` MUST be NULL

**Implementation**: CHECK constraints or trigger-based validation

### Requirement: Audit Triggers

The system SHALL automatically update the `updated_at` timestamp on changes.

#### Scenario: updated_at refreshed on record modification

**Given** an existing representante
**When** any column is updated
**Then** the `updated_at` column SHALL be automatically set to CURRENT_TIMESTAMP

### Requirement: Table Comments

The system SHALL document the table structure with descriptive comments.

#### Scenario: Table and column comments provide documentation

**Given** the `representantes` table
**When** the migration is applied
**Then** the table SHALL have a COMMENT describing its purpose
**And** critical columns (id_pessoa_pje, parte_tipo, parte_id, numero_oab) SHALL have COMMENTs explaining their usage

## MODIFIED Requirements

None - this is a new table.

## REMOVED Requirements

None.
