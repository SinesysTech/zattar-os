# Management Tables

<cite>
**Referenced Files in This Document**   
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql)
- [18_representantes.sql](file://supabase/schemas/18_representantes.sql)
- [21_capturas.sql](file://supabase/schemas/21_capturas.sql)
- [25_assinatura_digital.sql](file://supabase/schemas/25_assinatura_digital.sql)
- [01_enums.sql](file://supabase/schemas/01_enums.sql)
- [contrato-persistence.service.ts](file://backend/contratos/services/persistence/contrato-persistence.service.ts)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts)
- [captura-persistence.service.ts](file://backend/captura/services/persistence/captura-persistence.service.ts)
- [assinatura-digital.service.ts](file://backend/assinatura-digital/services/signature.service.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Contratos Table](#contratos-table)
3. [Representantes Table](#representantes-table)
4. [Capturas Table](#capturas-table)
5. [Assinatura Digital Table](#assinatura-digital-table)
6. [Relationships and Business Domains](#relationships-and-business-domains)
7. [Constraints, Indexes, and Triggers](#constraints-indexes-and-triggers)
8. [Sample Records](#sample-records)
9. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive documentation for the management-related database tables in the Sinesys system. The focus is on four key tables: `contratos`, `representantes`, `capturas`, and `assinatura_digital`. These tables are central to the system's management of legal contracts, representatives, data capture operations, and digital signatures. The documentation details the structure of each table, including fields, data types, constraints, and relationships. It also covers ENUM definitions, indexes, triggers, and sample records to illustrate typical data usage. The information is derived from the database schema files, TypeScript interfaces, and related code components in the Sinesys repository.

## Contratos Table
The `contratos` table stores legal contracts for the law firm, capturing essential information about the contract type, parties involved, status, and financial details. The table is designed to support various legal areas and contract types, with a flexible structure for multiple parties.

### Field Definitions
The table includes the following fields:

| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key, auto-generated |
| area_direito | public.area_direito | Area of law (ENUM: trabalhista, civil, previdenciario, criminal, empresarial, administrativo) |
| tipo_contrato | public.tipo_contrato | Contract type (ENUM: ajuizamento, defesa, ato_processual, assessoria, consultoria, extrajudicial, parecer) |
| tipo_cobranca | public.tipo_cobranca | Billing type (ENUM: pro_exito, pro_labore) |
| cliente_id | bigint | Foreign key to clientes table |
| polo_cliente | public.polo_processual | Client's legal position (autor or re) |
| parte_contraria_id | bigint | Foreign key to partes_contrarias table (optional) |
| parte_autora | jsonb | Array of plaintiff parties in JSONB format |
| parte_re | jsonb | Array of defendant parties in JSONB format |
| qtde_parte_autora | integer | Number of plaintiff parties |
| qtde_parte_re | integer | Number of defendant parties |
| status | public.status_contrato | Contract status (ENUM: em_contratacao, contratado, distribuido, desistencia) |
| data_contratacao | timestamptz | Contract initiation date |
| data_assinatura | date | Contract signing date |
| data_distribuicao | date | Case distribution date |
| data_desistencia | date | Contract cancellation date |
| responsavel_id | bigint | Foreign key to usuarios table (responsible user) |
| created_by | bigint | Foreign key to usuarios table (user who created the record) |
| observacoes | text | General observations about the contract |
| dados_anteriores | jsonb | Stores previous state of the record before last update |
| created_at | timestamptz | Record creation timestamp |
| updated_at | timestamptz | Record update timestamp |

### ENUM Definitions
The table uses several ENUM types defined in the `01_enums.sql` file:

```sql
create type public.area_direito as enum (
  'trabalhista',
  'civil',
  'previdenciario',
  'criminal',
  'empresarial',
  'administrativo'
);

create type public.tipo_contrato as enum (
  'ajuizamento',
  'defesa',
  'ato_processual',
  'assessoria',
  'consultoria',
  'extrajudicial',
  'parecer'
);

create type public.tipo_cobranca as enum (
  'pro_exito',
  'pro_labore'
);

create type public.status_contrato as enum (
  'em_contratacao',
  'contratado',
  'distribuido',
  'desistencia'
);

create type public.polo_processual as enum ('autor', 're');
```

### JSONB Structure
The `parte_autora` and `parte_re` fields use JSONB to store arrays of parties. Each party is represented as a JSON object with the following structure:

```json
{
  "tipo": "cliente" | "parte_contraria",
  "id": number,
  "nome": string
}
```

This allows for flexible storage of multiple parties in a single contract, with their type, ID, and name.

**Section sources**
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql#L4-L86)
- [contrato-persistence.service.ts](file://backend/contratos/services/persistence/contrato-persistence.service.ts#L35-L91)

## Representantes Table
The `representantes` table stores information about legal representatives, uniquely identified by their CPF. This table is designed to manage representatives' contact information, OAB registrations, and metadata.

### Field Definitions
The table includes the following fields:

| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key, auto-generated |
| cpf | text | Unique CPF of the representative |
| nome | text | Name of the representative |
| sexo | text | Gender of the representative |
| tipo | text | Type of the representative |
| oabs | jsonb | Array of OAB registrations in JSONB format |
| emails | jsonb | Array of email addresses |
| email | text | Primary email address |
| ddd_celular | text | Area code for mobile phone |
| numero_celular | text | Mobile phone number |
| ddd_residencial | text | Area code for residential phone |
| numero_residencial | text | Residential phone number |
| ddd_comercial | text | Area code for commercial phone |
| numero_comercial | text | Commercial phone number |
| endereco_id | bigint | Foreign key to enderecos table |
| dados_anteriores | jsonb | Stores previous state of the record before last update |
| created_at | timestamptz | Record creation timestamp |
| updated_at | timestamptz | Record update timestamp |

### JSONB Structure
The `oabs` field uses JSONB to store an array of OAB registrations. Each registration is represented as a JSON object with the following structure:

```json
{
  "numero": "MG128404",
  "uf": "MG",
  "situacao": "REGULAR"
}
```

This allows a representative to have multiple OAB registrations in different states.

### Migration History
A migration file indicates that the table previously had individual columns for OAB information (`numero_oab`, `uf_oab`, `situacao_oab`), which were removed in favor of the JSONB `oabs` column:

```sql
-- Migration: Remover colunas antigas de OAB
alter table representantes drop column if exists numero_oab;
alter table representantes drop column if exists uf_oab;
alter table representantes drop column if exists situacao_oab;
```

This change provides greater flexibility for managing multiple OAB registrations.

**Section sources**
- [18_representantes.sql](file://supabase/schemas/18_representantes.sql#L7-L37)
- [representantes-persistence.service.ts](file://backend/representantes/services/representantes-persistence.service.ts#L45-L63)

## Capturas Table
The `capturas_log` table records the history of data capture operations performed in the system. It tracks the type of capture, status, and execution details.

### Field Definitions
The table includes the following fields:

| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key, auto-generated |
| tipo_captura | public.tipo_captura | Type of capture (ENUM: acervo_geral, arquivados, audiencias, pendentes, partes) |
| advogado_id | bigint | Foreign key to advogados table |
| credencial_ids | bigint[] | Array of credential IDs used in the capture |
| status | public.status_captura | Status of the capture (ENUM: pending, in_progress, completed, failed) |
| resultado | jsonb | Result of the capture in JSONB format |
| erro | text | Error message if the capture failed |
| mongodb_id | text | ID of the document in MongoDB |
| iniciado_em | timestamp with time zone | Timestamp when the capture was initiated |
| concluido_em | timestamp with time zone | Timestamp when the capture was completed |
| created_at | timestamp with time zone | Record creation timestamp |

### ENUM Definitions
The table uses two ENUM types defined in the `01_enums.sql` file:

```sql
create type public.tipo_captura as enum (
  'acervo_geral',
  'arquivados',
  'audiencias',
  'pendentes',
  'partes'
);

create type public.status_captura as enum (
  'pending',
  'in_progress',
  'completed',
  'failed'
);
```

### JSONB Structure
The `resultado` field uses JSONB to store the result of the capture operation. The exact structure depends on the type of capture, but it typically includes statistics, captured data, and processing details.

### Agendamentos Table
The `agendamentos` table is related to `capturas_log` and stores scheduled capture operations. It includes fields for the type of capture, credentials, periodicity, and execution times.

**Section sources**
- [21_capturas.sql](file://supabase/schemas/21_capturas.sql#L6-L18)
- [captura-persistence.service.ts](file://backend/captura/services/persistence/captura-persistence.service.ts#L38-L53)

## Assinatura Digital Table
The `assinatura_digital_assinaturas` table stores completed digital signatures, including metadata, URLs, and geolocation data.

### Field Definitions
The table includes the following fields:

| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key, auto-generated |
| cliente_id | bigint | Foreign key to clientes table |
| acao_id | bigint | Foreign key to actions table |
| template_uuid | text | UUID of the template used |
| segmento_id | bigint | Foreign key to assinatura_digital_segmentos table |
| formulario_id | bigint | Foreign key to assinatura_digital_formularios table |
| sessao_uuid | uuid | UUID of the signing session |
| assinatura_url | text | URL of the signature |
| foto_url | text | URL of the photo taken during signing |
| pdf_url | text | URL of the signed PDF |
| protocolo | text | Unique protocol number |
| ip_address | text | IP address of the signer |
| user_agent | text | User agent of the signer's device |
| latitude | double precision | Latitude of the signer's location |
| longitude | double precision | Longitude of the signer's location |
| geolocation_accuracy | double precision | Accuracy of the geolocation data |
| geolocation_timestamp | text | Timestamp of the geolocation data |
| data_assinatura | timestamp with time zone | Timestamp when the document was signed |
| status | text | Status of the signature (default: concluida) |
| enviado_sistema_externo | boolean | Indicates if the signature was sent to an external system |
| data_envio_externo | timestamp with time zone | Timestamp when the signature was sent to an external system |
| created_at | timestamp with time zone | Record creation timestamp |
| updated_at | timestamp with time zone | Record update timestamp |

### Related Tables
The `assinatura_digital_assinaturas` table is part of a larger schema that includes:

- `assinatura_digital_segmentos`: Business segments for digital signatures
- `assinatura_digital_templates`: PDF templates used in signature generation
- `assinatura_digital_formularios`: Forms linked to segments and templates
- `assinatura_digital_sessoes_assinatura`: Signing sessions for tracking the signer's journey

### Formulários Table
The `assinatura_digital_formularios` table defines forms for digital signatures, with fields for the form schema, associated templates, and security metadata.

**Section sources**
- [25_assinatura_digital.sql](file://supabase/schemas/25_assinatura_digital.sql#L99-L123)
- [assinatura-digital.service.ts](file://backend/assinatura-digital/services/signature.service.ts#L101-L122)

## Relationships and Business Domains
The management tables in the Sinesys system are interconnected through foreign key relationships and shared business domains.

### Contratos Relationships
The `contratos` table has foreign key relationships with:
- `clientes` table via `cliente_id`
- `partes_contrarias` table via `parte_contraria_id`
- `usuarios` table via `responsavel_id` and `created_by`

These relationships allow the system to track the client, opposing party, and responsible user for each contract.

### Representantes Relationships
The `representantes` table has a foreign key relationship with the `enderecos` table via `endereco_id`. This allows the system to store and manage the representative's address information.

### Capturas Relationships
The `capturas_log` table has a foreign key relationship with the `advogados` table via `advogado_id`. This links each capture operation to the lawyer who performed it.

### Assinatura Digital Relationships
The `assinatura_digital_assinaturas` table has foreign key relationships with:
- `assinatura_digital_segmentos` table via `segmento_id`
- `assinatura_digital_formularios` table via `formulario_id`

These relationships ensure that each digital signature is linked to the appropriate business segment and form.

### Business Domains
Each table serves a specific business domain:
- `contratos`: Legal contract management
- `representantes`: Representative management
- `capturas`: Data capture operations
- `assinatura_digital`: Digital signature workflow

These domains are reflected in the table structures, ENUM definitions, and application logic.

**Section sources**
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql#L13-L31)
- [18_representantes.sql](file://supabase/schemas/18_representantes.sql#L31)
- [21_capturas.sql](file://supabase/schemas/21_capturas.sql#L9)
- [25_assinatura_digital.sql](file://supabase/schemas/25_assinatura_digital.sql#L104-L105)

## Constraints, Indexes, and Triggers
The management tables include various constraints, indexes, and triggers to ensure data consistency and performance.

### Constraints
Each table has primary key constraints and foreign key constraints where applicable. For example:
- `contratos` table has foreign key constraints on `cliente_id`, `parte_contraria_id`, `responsavel_id`, and `created_by`
- `representantes` table has a unique constraint on `cpf`
- `capturas_log` table has a foreign key constraint on `advogado_id`
- `assinatura_digital_assinaturas` table has a unique constraint on `protocolo`

### Indexes
The tables include indexes to improve query performance:
- B-tree indexes on frequently queried columns (e.g., `cliente_id`, `status`, `cpf`)
- GIN indexes on JSONB columns (e.g., `parte_autora`, `parte_re`, `oabs`)
- Partial indexes on nullable columns (e.g., `data_assinatura`, `data_distribuicao`)

For example, the `contratos` table has the following indexes:
```sql
create index idx_contratos_area_direito on public.contratos using btree (area_direito);
create index idx_contratos_tipo_contrato on public.contratos using btree (tipo_contrato);
create index idx_contratos_status on public.contratos using btree (status);
create index idx_contratos_cliente_id on public.contratos using btree (cliente_id);
create index idx_contratos_parte_contraria_id on public.contratos using btree (parte_contraria_id);
create index idx_contratos_responsavel_id on public.contratos using btree (responsavel_id);
create index idx_contratos_created_by on public.contratos using btree (created_by);
create index idx_contratos_data_assinatura on public.contratos using btree (data_assinatura) where data_assinatura is not null;
create index idx_contratos_data_distribuicao on public.contratos using btree (data_distribuicao) where data_distribuicao is not null;
create index idx_contratos_parte_autora on public.contratos using gin (parte_autora);
create index idx_contratos_parte_re on public.contratos using gin (parte_re);
```

### Triggers
The tables include triggers to automate certain operations:
- `update_contratos_updated_at` trigger on the `contratos` table updates the `updated_at` column before each update
- `update_representantes_updated_at` trigger on the `representantes` table updates the `updated_at` column before each update
- `update_capturas_log_updated_at` trigger on the `capturas_log` table updates the `updated_at` column before each update
- `update_assinatura_digital_assinaturas_updated_at` trigger on the `assinatura_digital_assinaturas` table updates the `updated_at` column before each update

These triggers ensure that the `updated_at` timestamp is always current without requiring application-level code.

**Section sources**
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql#L62-L81)
- [18_representantes.sql](file://supabase/schemas/18_representantes.sql#L45-L48)
- [21_capturas.sql](file://supabase/schemas/21_capturas.sql#L31-L36)
- [25_assinatura_digital.sql](file://supabase/schemas/25_assinatura_digital.sql#L94-L96)

## Sample Records
The following sample records illustrate typical data in the management tables.

### Contratos Sample Record
```json
{
  "id": 1,
  "area_direito": "trabalhista",
  "tipo_contrato": "ajuizamento",
  "tipo_cobranca": "pro_exito",
  "cliente_id": 101,
  "polo_cliente": "autor",
  "parte_contraria_id": 201,
  "parte_autora": [
    {
      "tipo": "cliente",
      "id": 101,
      "nome": "John Doe"
    }
  ],
  "parte_re": [
    {
      "tipo": "parte_contraria",
      "id": 201,
      "nome": "Acme Corp"
    }
  ],
  "qtde_parte_autora": 1,
  "qtde_parte_re": 1,
  "status": "contratado",
  "data_contratacao": "2023-01-15T10:00:00Z",
  "data_assinatura": "2023-01-20",
  "data_distribuicao": "2023-01-25",
  "data_desistencia": null,
  "responsavel_id": 301,
  "created_by": 301,
  "observacoes": "Contract for labor dispute",
  "dados_anteriores": null,
  "created_at": "2023-01-15T10:00:00Z",
  "updated_at": "2023-01-20T14:30:00Z"
}
```

### Representantes Sample Record
```json
{
  "id": 1,
  "cpf": "123.456.789-00",
  "nome": "Jane Smith",
  "sexo": "FEMININO",
  "tipo": "advogado",
  "oabs": [
    {
      "numero": "MG128404",
      "uf": "MG",
      "situacao": "REGULAR"
    },
    {
      "numero": "SP234567",
      "uf": "SP",
      "situacao": "REGULAR"
    }
  ],
  "emails": ["jane.smith@email.com", "jane@lawfirm.com"],
  "email": "jane.smith@email.com",
  "ddd_celular": "31",
  "numero_celular": "99999-8888",
  "ddd_residencial": "31",
  "numero_residencial": "3333-4444",
  "ddd_comercial": "31",
  "numero_comercial": "3333-5555",
  "endereco_id": 501,
  "dados_anteriores": null,
  "created_at": "2023-01-10T09:00:00Z",
  "updated_at": "2023-01-10T09:00:00Z"
}
```

### Capturas Sample Record
```json
{
  "id": 1,
  "tipo_captura": "acervo_geral",
  "advogado_id": 401,
  "credencial_ids": [1, 2],
  "status": "completed",
  "resultado": {
    "processos_capturados": 25,
    "audiencias_capturadas": 10,
    "expedientes_capturados": 15
  },
  "erro": null,
  "mongodb_id": "60c72b2f9b1e8a4d8c8b4567",
  "iniciado_em": "2023-01-16T08:00:00Z",
  "concluido_em": "2023-01-16T09:30:00Z",
  "created_at": "2023-01-16T08:00:00Z"
}
```

### Assinatura Digital Sample Record
```json
{
  "id": 1,
  "cliente_id": 101,
  "acao_id": 501,
  "template_uuid": "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
  "segmento_id": 601,
  "formulario_id": 701,
  "sessao_uuid": "o9p8q7r6-s5t4-u3v2-w1x0-y9z8a7b6c5d4",
  "assinatura_url": "https://example.com/signature/1",
  "foto_url": "https://example.com/photo/1",
  "pdf_url": "https://example.com/pdf/1",
  "protocolo": "ABC123XYZ",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "latitude": -19.8157,
  "longitude": -43.9542,
  "geolocation_accuracy": 10.5,
  "geolocation_timestamp": "2023-01-17T11:45:30Z",
  "data_assinatura": "2023-01-17T11:45:30Z",
  "status": "concluida",
  "enviado_sistema_externo": true,
  "data_envio_externo": "2023-01-17T12:00:00Z",
  "created_at": "2023-01-17T11:45:30Z",
  "updated_at": "2023-01-17T12:00:00Z"
}
```

These sample records demonstrate the typical data stored in each table and how the fields are populated in practice.

**Section sources**
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql)
- [18_representantes.sql](file://supabase/schemas/18_representantes.sql)
- [21_capturas.sql](file://supabase/schemas/21_capturas.sql)
- [25_assinatura_digital.sql](file://supabase/schemas/25_assinatura_digital.sql)

## Conclusion
The management tables in the Sinesys system—`contratos`, `representantes`, `capturas`, and `assinatura_digital`—form a robust foundation for managing legal contracts, representatives, data capture operations, and digital signatures. Each table is carefully designed with appropriate data types, constraints, and relationships to ensure data integrity and support the system's business domains. The use of ENUM types provides type safety and consistency, while JSONB fields offer flexibility for complex data structures. Indexes and triggers enhance performance and automate critical operations. The sample records illustrate how these tables are used in practice, providing a clear picture of the data flow and relationships within the system. This comprehensive documentation serves as a valuable resource for developers, database administrators, and stakeholders involved in the Sinesys system.