# Contract Management System

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [supabase/schemas/11_contratos.sql](file://supabase/schemas/11_contratos.sql)
- [supabase/schemas/42_contrato_partes.sql](file://supabase/schemas/42_contrato_partes.sql)
- [supabase/schemas/43_contrato_status_historico.sql](file://supabase/schemas/43_contrato_status_historico.sql)
- [supabase/schemas/44_contrato_tags.sql](file://supabase/schemas/44_contrato_tags.sql)
- [supabase/migrations/20251125000000_create_locks_table.sql](file://supabase/migrations/20251125000000_create_locks_table.sql)
- [src/lib/utils/locks/distributed-lock.ts](file://src/lib/utils/locks/distributed-lock.ts)
- [src/shared/contratos/repository.ts](file://src/shared/contratos/repository.ts)
- [src/shared/contratos/service.ts](file://src/shared/contratos/service.ts)
- [src/app/(authenticated)/contratos/actions/contratos-actions.ts](file://src/app/(authenticated)/contratos/actions/contratos-actions.ts)
- [src/app/(authenticated)/contratos/__tests__/integration/contratos-flow.test.ts](file://src/app/(authenticated)/contratos/__tests__/integration/contratos-flow.test.ts)
- [src/app/(authenticated)/captura/services/persistence/capture-log.service.ts](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts)
- [src/app/(authenticated)/captura/services/persistence/comparison.util.ts](file://src/app/(authenticated)/captura/services/persistence/comparison.util.ts)
- [supabase/migrations/20260225000001_create_contrato_tipos.sql](file://supabase/migrations/20260225000001_create_contrato_tipos.sql)
- [supabase/migrations/20260225000002_create_contrato_pipelines.sql](file://supabase/migrations/20260225000002_create_contrato_pipelines.sql)
- [supabase/migrations/20260225000003_add_contratos_new_fk_columns.sql](file://supabase/migrations/20260225000003_add_contratos_new_fk_columns.sql)
- [supabase/migrations/20260225000004_add_formularios_tipo_contrato_config.sql](file://supabase/migrations/20260225000004_add_formularios_tipo_contrato_config.sql)
- [src/app/api/contratos/tipos/route.ts](file://src/app/api/contratos/tipos/route.ts)
- [src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts](file://src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts)
- [src/app/(authenticated)/contratos/kanban/page.tsx](file://src/app/(authenticated)/contratos/kanban/page.tsx)
- [openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contratos/spec.md](file://openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contratos/spec.md)
- [openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contrato-kanban/spec.md](file://openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contrato-kanban/spec.md)
- [openspec/specs/contrato-kanban/spec.md](file://openspec/specs/contrato-kanban/spec.md)
- [docs/superpowers/specs/2026-04-16-gerar-pdfs-contrato-trabalhista-design.md](file://docs/superpowers/specs/2026-04-16-gerar-pdfs-contrato-trabalhista-design.md)
- [docs/superpowers/plans/2026-04-16-gerar-pdfs-contrato-trabalhista.md](file://docs/superpowers/plans/2026-04-16-gerar-pdfs-contrato-trabalhista.md)
- [src/lib/mcp/registries/expedientes-tools.ts](file://src/lib/mcp/registries/expedientes-tools.ts)
- [openspec/archive/refactor-contratos-modelo-relacional/specs/acervo/spec.md](file://openspec/archive/refactor-contratos-modelo-relacional/specs/acervo/spec.md)
</cite>

## Update Summary
**Changes Made**
- Enhanced persistence layer documentation with optimistic concurrency control mechanisms
- Added distributed locking implementation details for conflict resolution
- Updated contract repository with improved conflict detection and handling
- Expanded audit trail documentation with OCC conflict logging
- Added comprehensive conflict resolution strategies and best practices

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Enhanced Persistence Layer](#enhanced-persistence-layer)
6. [Optimistic Concurrency Control](#optimistic-concurrency-control)
7. [Conflict Resolution Mechanisms](#conflict-resolution-mechanisms)
8. [Detailed Component Analysis](#detailed-component-analysis)
9. [Dependency Analysis](#dependency-analysis)
10. [Performance Considerations](#performance-considerations)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Conclusion](#conclusion)
13. [Appendices](#appendices)

## Introduction
This document describes the Contract Management System implemented in the project. It covers contract types, creation workflows, lifecycle management, the contract pipeline system, kanban boards, tagging and labeling, template management, approval workflows, execution tracking, renewal management, integration with legal processes and document management, practical examples, status tracking, compliance monitoring, validation rules, version control, and audit trails.

**Updated** Enhanced with comprehensive optimistic concurrency control mechanisms and distributed locking for conflict resolution in the persistence layer.

## Project Structure
The system is built with a Next.js application, Supabase-backed PostgreSQL schema, and a set of OpenSpec-driven requirements and migration scripts that define the contract domain model and configurable workflows.

Key areas:
- Database schema and migrations define contract entities, parts, statuses, tags, and pipeline stages.
- API routes expose contract type management for admin operations.
- Frontend hooks and pages implement kanban views and contract creation flows.
- OpenSpec documents specify requirements for pipelines, kanban, and contract creation.
- Documentation outlines PDF generation from templates and integration with legal processes.
- **Enhanced** Distributed locking and optimistic concurrency control mechanisms prevent data conflicts.

```mermaid
graph TB
subgraph "Frontend"
FE_API["API Routes<br/>/api/contratos/tipos"]
FE_KANBAN["Kanban Page<br/>/app/contratos/kanban"]
FE_HOOKS["useKanbanContratos Hook"]
end
subgraph "Backend"
SUPABASE["Supabase Schema & Migrations"]
LOCKING["Distributed Locking<br/>/locks table"]
OCC["Optimistic Concurrency<br/>Control"]
end
subgraph "Persistence Layer"
REPO["Contract Repository<br/>save/update operations"]
SERVICE["Contract Service<br/>validation & business logic"]
ACTIONS["Server Actions<br/>indexation & caching"]
end
subgraph "Documentation & Specs"
OPSPEC["OpenSpec Requirements"]
DOCS["PDF Templates Docs"]
end
FE_API --> SUPABASE
FE_KANBAN --> FE_HOOKS
FE_HOOKS --> SUPABASE
SUPABASE --> LOCKING
LOCKING --> OCC
OCC --> REPO
REPO --> SERVICE
SERVICE --> ACTIONS
OPSPEC --> FE_API
OPSPEC --> FE_KANBAN
DOCS --> FE_API
```

**Diagram sources**
- [src/app/api/contratos/tipos/route.ts:1-88](file://src/app/api/contratos/tipos/route.ts#L1-L88)
- [src/app/(authenticated)/contratos/kanban/page.tsx](file://src/app/(authenticated)/contratos/kanban/page.tsx#L1-L19)
- [src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts](file://src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts#L37-L115)
- [supabase/schemas/11_contratos.sql:1-61](file://supabase/schemas/11_contratos.sql#L1-L61)
- [supabase/migrations/20260225000001_create_contrato_tipos.sql:1-74](file://supabase/migrations/20260225000001_create_contrato_tipos.sql#L1-L74)
- [supabase/migrations/20260225000002_create_contrato_pipelines.sql:1-74](file://supabase/migrations/20260225000002_create_contrato_pipelines.sql#L1-L74)
- [supabase/migrations/20251125000000_create_locks_table.sql:1-77](file://supabase/migrations/20251125000000_create_locks_table.sql#L1-L77)
- [src/lib/utils/locks/distributed-lock.ts:1-164](file://src/lib/utils/locks/distributed-lock.ts#L1-L164)
- [src/shared/contratos/repository.ts:743-831](file://src/shared/contratos/repository.ts#L743-L831)

**Section sources**
- [README.md](file://README.md)
- [src/app/api/contratos/tipos/route.ts:1-88](file://src/app/api/contratos/tipos/route.ts#L1-L88)
- [src/app/(authenticated)/contratos/kanban/page.tsx](file://src/app/(authenticated)/contratos/kanban/page.tsx#L1-L19)
- [src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts](file://src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts#L37-L115)
- [supabase/schemas/11_contratos.sql:1-61](file://supabase/schemas/11_contratos.sql#L1-L61)
- [supabase/migrations/20260225000001_create_contrato_tipos.sql:1-74](file://supabase/migrations/20260225000001_create_contrato_tipos.sql#L1-L74)
- [supabase/migrations/20260225000002_create_contrato_pipelines.sql:1-74](file://supabase/migrations/20260225000002_create_contrato_pipelines.sql#L1-L74)
- [supabase/migrations/20251125000000_create_locks_table.sql:1-77](file://supabase/migrations/20251125000000_create_locks_table.sql#L1-L77)
- [src/lib/utils/locks/distributed-lock.ts:1-164](file://src/lib/utils/locks/distributed-lock.ts#L1-L164)
- [src/shared/contratos/repository.ts:743-831](file://src/shared/contratos/repository.ts#L743-L831)

## Core Components
- Contract entity with configurable type, billing type, stage, parties, and timestamps.
- Configurable contract types and billing types tables.
- Pipeline and stage definitions per segment.
- Contract parts linking clients, opposing parties, and roles.
- Status change history for compliance and audit.
- Contract-tag relations enabling cross-entity propagation.
- API route for contract type lookup and creation.
- Kanban board rendering and drag-and-drop movement of contracts across stages.
- PDF template generation integrated with contract data.
- **Enhanced** Distributed locking system preventing concurrent modifications.
- **Enhanced** Optimistic concurrency control with conflict detection and resolution.
- **Enhanced** Comprehensive audit trail with OCC conflict logging.

**Section sources**
- [supabase/schemas/11_contratos.sql:1-61](file://supabase/schemas/11_contratos.sql#L1-L61)
- [supabase/schemas/42_contrato_partes.sql:1-21](file://supabase/schemas/42_contrato_partes.sql#L1-L21)
- [supabase/schemas/43_contrato_status_historico.sql:1-19](file://supabase/schemas/43_contrato_status_historico.sql#L1-L19)
- [supabase/schemas/44_contrato_tags.sql:1-15](file://supabase/schemas/44_contrato_tags.sql#L1-L15)
- [supabase/migrations/20260225000001_create_contrato_tipos.sql:1-74](file://supabase/migrations/20260225000001_create_contrato_tipos.sql#L1-L74)
- [supabase/migrations/20260225000002_create_contrato_pipelines.sql:1-74](file://supabase/migrations/20260225000002_create_contrato_pipelines.sql#L1-L74)
- [supabase/migrations/20260225000003_add_contratos_new_fk_columns.sql:1-16](file://supabase/migrations/20260225000003_add_contratos_new_fk_columns.sql#L1-L16)
- [supabase/migrations/20260225000004_add_formularios_tipo_contrato_config.sql:1-12](file://supabase/migrations/20260225000004_add_formularios_tipo_contrato_config.sql#L1-L12)
- [src/app/api/contratos/tipos/route.ts:1-88](file://src/app/api/contratos/tipos/route.ts#L1-L88)
- [src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts](file://src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts#L37-L115)
- [src/app/(authenticated)/contratos/kanban/page.tsx](file://src/app/(authenticated)/contratos/kanban/page.tsx#L1-L19)
- [docs/superpowers/specs/2026-04-16-gerar-pdfs-contrato-trabalhista-design.md:20-28](file://docs/superpowers/specs/2026-04-16-gerar-pdfs-contrato-trabalhista-design.md#L20-L28)
- [src/lib/utils/locks/distributed-lock.ts:1-164](file://src/lib/utils/locks/distributed-lock.ts#L1-L164)
- [src/shared/contratos/repository.ts:743-831](file://src/shared/contratos/repository.ts#L743-L831)

## Architecture Overview
The system separates concerns across schema, API, hooks, and pages. Contracts are represented by configurable entities and managed through pipelines. Parties and tags connect contracts to broader legal and administrative contexts. PDF templates are generated from contract data and stored artifacts.

**Enhanced** The architecture now includes robust conflict prevention through distributed locking and optimistic concurrency control mechanisms.

```mermaid
graph TB
A["Client Browser"] --> B["Next.js App Router"]
B --> C["API Route: /api/contratos/tipos"]
B --> D["Kanban Page"]
D --> E["useKanbanContratos Hook"]
C --> F["Supabase: contrato_tipos"]
D --> G["Supabase: contratos + partes + status_historico + tags"]
E --> G
H["PDF Templates Docs"] --> C
I["Distributed Locking"] --> J["Optimistic Concurrency Control"]
G --> I
J --> K["Conflict Detection & Resolution"]
```

**Diagram sources**
- [src/app/api/contratos/tipos/route.ts:1-88](file://src/app/api/contratos/tipos/route.ts#L1-L88)
- [src/app/(authenticated)/contratos/kanban/page.tsx](file://src/app/(authenticated)/contratos/kanban/page.tsx#L1-L19)
- [src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts](file://src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts#L37-L115)
- [supabase/schemas/11_contratos.sql:1-61](file://supabase/schemas/11_contratos.sql#L1-L61)
- [supabase/schemas/42_contrato_partes.sql:1-21](file://supabase/schemas/42_contrato_partes.sql#L1-L21)
- [supabase/schemas/43_contrato_status_historico.sql:1-19](file://supabase/schemas/43_contrato_status_historico.sql#L1-L19)
- [supabase/schemas/44_contrato_tags.sql:1-15](file://supabase/schemas/44_contrato_tags.sql#L1-L15)
- [supabase/migrations/20251125000000_create_locks_table.sql:1-77](file://supabase/migrations/20251125000000_create_locks_table.sql#L1-L77)
- [src/lib/utils/locks/distributed-lock.ts:1-164](file://src/lib/utils/locks/distributed-lock.ts#L1-L164)
- [src/shared/contratos/repository.ts:743-831](file://src/shared/contratos/repository.ts#L743-L831)

## Enhanced Persistence Layer

### Distributed Locking System
The system implements a distributed locking mechanism using PostgreSQL advisory locks to prevent concurrent modifications to the same contract records.

```mermaid
sequenceDiagram
participant Client as "Client Request"
participant LockService as "DistributedLock"
participant DB as "PostgreSQL Locks Table"
participant ContractRepo as "Contract Repository"
Client->>LockService : acquire()
LockService->>DB : INSERT INTO locks (key, lock_id, expires_at)
DB-->>LockService : Success/Failure
alt Lock Acquired
LockService-->>Client : true
Client->>ContractRepo : save/update operation
ContractRepo->>DB : UPDATE contratos
DB-->>ContractRepo : Success
ContractRepo-->>Client : Operation Result
Client->>LockService : release()
LockService->>DB : DELETE FROM locks
else Lock Failed
LockService-->>Client : false (LockError)
Client->>Client : Retry Logic or Error Handling
end
```

**Diagram sources**
- [src/lib/utils/locks/distributed-lock.ts:39-60](file://src/lib/utils/locks/distributed-lock.ts#L39-L60)
- [src/lib/utils/locks/distributed-lock.ts:65-97](file://src/lib/utils/locks/distributed-lock.ts#L65-L97)
- [supabase/migrations/20251125000000_create_locks_table.sql:6-12](file://supabase/migrations/20251125000000_create_locks_table.sql#L6-L12)

### Optimistic Concurrency Control Implementation
The contract repository implements optimistic concurrency control to detect and handle conflicts during concurrent updates.

```mermaid
sequenceDiagram
participant Service as "Contract Service"
participant Repo as "Contract Repository"
participant DB as "PostgreSQL"
participant Audit as "Audit Trail"
Service->>Repo : updateContrato(id, input, existing)
Repo->>Repo : Prepare update data with audit snapshot
Repo->>DB : UPDATE contratos SET ... WHERE id = ? AND updated_at = ?
DB-->>Repo : Rows matched : 0/1
alt No rows matched (Conflict detected)
Repo->>Audit : Log OCC conflict
Audit->>Audit : Store conflict details
Repo-->>Service : Return conflict error
Service->>Service : Implement retry or rollback strategy
else Rows matched (Success)
Repo->>DB : INSERT INTO contrato_status_historico
DB-->>Repo : Success
Repo->>Audit : Log successful update
Audit->>Audit : Store audit trail
Repo-->>Service : Return updated contract
end
```

**Diagram sources**
- [src/shared/contratos/repository.ts:743-831](file://src/shared/contratos/repository.ts#L743-L831)
- [src/shared/contratos/repository.ts:787-798](file://src/shared/contratos/repository.ts#L787-L798)
- [src/app/(authenticated)/captura/services/persistence/capture-log.service.ts:55-63](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L55-L63)

**Section sources**
- [src/lib/utils/locks/distributed-lock.ts:1-164](file://src/lib/utils/locks/distributed-lock.ts#L1-L164)
- [supabase/migrations/20251125000000_create_locks_table.sql:1-77](file://supabase/migrations/20251125000000_create_locks_table.sql#L1-L77)
- [src/shared/contratos/repository.ts:743-831](file://src/shared/contratos/repository.ts#L743-L831)
- [src/app/(authenticated)/captura/services/persistence/capture-log.service.ts:55-63](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L55-L63)

## Optimistic Concurrency Control

### Conflict Detection Mechanism
The system detects conflicts when concurrent processes attempt to update the same contract record simultaneously. The repository compares the expected `updated_at` timestamp with the current database value.

### Audit Trail Enhancement
The contract repository automatically preserves critical data in the `dados_anteriores` field to maintain audit trails and enable conflict resolution.

```mermaid
erDiagram
CONTRATOS {
bigint id PK
bigint segmento_id FK
bigint tipo_contrato_id FK
bigint tipo_cobranca_id FK
bigint estagio_id FK
bigint cliente_id FK
text papel_cliente_no_contrato
timestamptz cadastrado_em
bigint responsavel_id FK
bigint created_by FK
text observacoes
jsonb dados_anteriores
timestamptz created_at
timestamptz updated_at
}
CONTRATO_STATUS_HISTORICO {
bigint id PK
bigint contrato_id FK
text from_status
text to_status
timestamptz changed_at
bigint changed_by FK
text reason
jsonb metadata
timestamptz created_at
}
```

**Diagram sources**
- [supabase/schemas/11_contratos.sql:1-61](file://supabase/schemas/11_contratos.sql#L1-L61)
- [supabase/schemas/43_contrato_status_historico.sql:1-19](file://supabase/schemas/43_contrato_status_historico.sql#L1-L19)

**Section sources**
- [src/shared/contratos/repository.ts:787-798](file://src/shared/contratos/repository.ts#L787-L798)
- [supabase/schemas/11_contratos.sql:42-42](file://supabase/schemas/11_contratos.sql#L42-L42)
- [supabase/schemas/43_contrato_status_historico.sql:1-19](file://supabase/schemas/43_contrato_status_historico.sql#L1-L19)

## Conflict Resolution Mechanisms

### OCC Conflict Logging
The system maintains detailed logs of OCC conflicts for debugging and monitoring purposes, including entity type, process identifiers, and conflict reasons.

### Distributed Locking Strategy
For high-contention scenarios, the system can use distributed locks to serialize access to critical contract operations.

### Retry and Backoff Strategies
The contract service implements intelligent retry mechanisms with exponential backoff to handle transient conflicts gracefully.

**Section sources**
- [src/app/(authenticated)/captura/services/persistence/capture-log.service.ts:55-63](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L55-L63)
- [src/lib/utils/locks/distributed-lock.ts:133-147](file://src/lib/utils/locks/distributed-lock.ts#L133-L147)
- [src/shared/contratos/service.ts:133-169](file://src/shared/contratos/service.ts#L133-L169)

## Detailed Component Analysis

### Contract Entity and Lifecycle
Contracts are stored with foreign keys to configurable types and stages, enabling flexible status management. Parties capture client and opposing party roles, while status history supports auditability. Tags enable cross-entity propagation to linked processes.

**Enhanced** The persistence layer now includes comprehensive conflict detection and resolution mechanisms to ensure data consistency in concurrent environments.

```mermaid
erDiagram
CONTRATOS {
bigint id PK
bigint segmento_id FK
bigint tipo_contrato_id FK
bigint tipo_cobranca_id FK
bigint estagio_id FK
bigint cliente_id FK
text papel_cliente_no_contrato
timestamptz cadastrado_em
bigint responsavel_id FK
bigint created_by FK
text observacoes
jsonb dados_anteriores
timestamptz created_at
timestamptz updated_at
}
CONTRATO_PARTES {
bigint id PK
bigint contrato_id FK
text tipo_entidade
bigint entidade_id
text papel_contratual
integer ordem
text nome_snapshot
text cpf_cnpj_snapshot
timestamptz created_at
}
CONTRATO_STATUS_HISTORICO {
bigint id PK
bigint contrato_id FK
text from_status
text to_status
timestamptz changed_at
bigint changed_by FK
text reason
jsonb metadata
timestamptz created_at
}
CONTRATO_TAGS {
bigint id PK
bigint contrato_id FK
bigint tag_id FK
timestamptz created_at
}
CONTRATO_TIPOS {
bigint id PK
text nome
text slug
text descricao
boolean ativo
integer ordem
timestamptz created_at
timestamptz updated_at
}
CONTRATO_TIPOS_COBRANCA {
bigint id PK
text nome
text slug
text descricao
boolean ativo
integer ordem
timestamptz created_at
timestamptz updated_at
}
CONTRATO_PIPELINES {
bigint id PK
bigint segmento_id FK
text nome
text descricao
boolean ativo
timestamptz created_at
timestamptz updated_at
}
CONTRATO_PIPELINE_ESTAGIOS {
bigint id PK
bigint pipeline_id FK
text nome
text slug
text cor
integer ordem
boolean is_default
timestamptz created_at
timestamptz updated_at
}
CONTRATOS ||--o{ CONTRATO_PARTES : "has"
CONTRATOS ||--o{ CONTRATO_STATUS_HISTORICO : "has history"
CONTRATOS ||--o{ CONTRATO_TAGS : "has tags"
CONTRATOS }o--|| CONTRATO_TIPOS : "type"
CONTRATOS }o--|| CONTRATO_TIPOS_COBRANCA : "billing type"
CONTRATOS }o--|| CONTRATO_PIPELINE_ESTAGIOS : "stage"
CONTRATO_PIPELINES ||--o{ CONTRATO_PIPELINE_ESTAGIOS : "contains"
```

**Diagram sources**
- [supabase/schemas/11_contratos.sql:1-61](file://supabase/schemas/11_contratos.sql#L1-L61)
- [supabase/schemas/42_contrato_partes.sql:1-21](file://supabase/schemas/42_contrato_partes.sql#L1-L21)
- [supabase/schemas/43_contrato_status_historico.sql:1-19](file://supabase/schemas/43_contrato_status_historico.sql#L1-L19)
- [supabase/schemas/44_contrato_tags.sql:1-15](file://supabase/schemas/44_contrato_tags.sql#L1-L15)
- [supabase/migrations/20260225000001_create_contrato_tipos.sql:1-74](file://supabase/migrations/20260225000001_create_contrato_tipos.sql#L1-L74)
- [supabase/migrations/20260225000002_create_contrato_pipelines.sql:1-74](file://supabase/migrations/20260225000002_create_contrato_pipelines.sql#L1-L74)
- [supabase/migrations/20260225000003_add_contratos_new_fk_columns.sql:1-16](file://supabase/migrations/20260225000003_add_contratos_new_fk_columns.sql#L1-L16)

**Section sources**
- [supabase/schemas/11_contratos.sql:1-61](file://supabase/schemas/11_contratos.sql#L1-L61)
- [supabase/schemas/42_contrato_partes.sql:1-21](file://supabase/schemas/42_contrato_partes.sql#L1-L21)
- [supabase/schemas/43_contrato_status_historico.sql:1-19](file://supabase/schemas/43_contrato_status_historico.sql#L1-L19)
- [supabase/schemas/44_contrato_tags.sql:1-15](file://supabase/schemas/44_contrato_tags.sql#L1-L15)
- [supabase/migrations/20260225000001_create_contrato_tipos.sql:1-74](file://supabase/migrations/20260225000001_create_contrato_tipos.sql#L1-L74)
- [supabase/migrations/20260225000002_create_contrato_pipelines.sql:1-74](file://supabase/migrations/20260225000002_create_contrato_pipelines.sql#L1-L74)
- [supabase/migrations/20260225000003_add_contratos_new_fk_columns.sql:1-16](file://supabase/migrations/20260225000003_add_contratos_new_fk_columns.sql#L1-L16)

### Contract Types and Billing Types
Contract types and billing types are now configurable via dedicated tables. The API route exposes listing and creation for admin use.

```mermaid
sequenceDiagram
participant Admin as "Admin UI"
participant API as "API Route /api/contratos/tipos"
participant Repo as "Repository"
participant DB as "Supabase"
Admin->>API : GET /api/contratos/tipos?ativo=true&search=...
API->>Repo : findAll({ativo, search})
Repo->>DB : SELECT ... FROM contrato_tipos
DB-->>Repo : rows
Repo-->>API : {data, total}
API-->>Admin : JSON response
Admin->>API : POST /api/contratos/tipos (payload)
API->>API : parse + validate payload
API->>Repo : save(payload)
Repo->>DB : INSERT INTO contrato_tipos
DB-->>Repo : new row
Repo-->>API : {data}
API-->>Admin : 201 Created
```

**Diagram sources**
- [src/app/api/contratos/tipos/route.ts:1-88](file://src/app/api/contratos/tipos/route.ts#L1-L88)
- [supabase/migrations/20260225000001_create_contrato_tipos.sql:1-74](file://supabase/migrations/20260225000001_create_contrato_tipos.sql#L1-L74)

**Section sources**
- [src/app/api/contratos/tipos/route.ts:1-88](file://src/app/api/contratos/tipos/route.ts#L1-L88)
- [supabase/migrations/20260225000001_create_contrato_tipos.sql:1-74](file://supabase/migrations/20260225000001_create_contrato_tipos.sql#L1-L74)

### Pipelines and Kanban Board
Pipelines define stages per segment with ordering and default stage selection. The kanban board renders columns for stages and allows moving contracts between stages.

```mermaid
sequenceDiagram
participant User as "User"
participant Page as "Kanban Page"
participant Hook as "useKanbanContratos"
participant API as "Backend"
participant DB as "Supabase"
User->>Page : Open /app/contratos/kanban
Page->>Hook : useKanbanContratos(segmentoId)
Hook->>API : fetch pipeline + contracts
API->>DB : SELECT pipeline + estagios + contratos
DB-->>API : rows
API-->>Hook : pipeline + grouped contracts
Hook-->>Page : columns, isLoading, error
Page-->>User : Render Kanban board
User->>Page : Drag contract to another stage
Page->>Hook : moveContrato(contratoId, newEstagioId)
Hook->>API : update estagio_id
API->>DB : UPDATE contratos SET estagio_id = ...
DB-->>API : OK
API-->>Hook : success
Hook-->>Page : refetch columns
Page-->>User : Updated board
```

**Diagram sources**
- [src/app/(authenticated)/contratos/kanban/page.tsx](file://src/app/(authenticated)/contratos/kanban/page.tsx#L1-L19)
- [src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts](file://src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts#L37-L115)
- [supabase/migrations/20260225000002_create_contrato_pipelines.sql:1-74](file://supabase/migrations/20260225000002_create_contrato_pipelines.sql#L1-L74)
- [openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contrato-kanban/spec.md:1-35](file://openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contrato-kanban/spec.md#L1-L35)
- [openspec/specs/contrato-kanban/spec.md:1-35](file://openspec/specs/contrato-kanban/spec.md#L1-L35)

**Section sources**
- [src/app/(authenticated)/contratos/kanban/page.tsx](file://src/app/(authenticated)/contratos/kanban/page.tsx#L1-L19)
- [src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts](file://src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts#L37-L115)
- [supabase/migrations/20260225000002_create_contrato_pipelines.sql:1-74](file://supabase/migrations/20260225000002_create_contrato_pipelines.sql#L1-L74)
- [openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contrato-kanban/spec.md:1-35](file://openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contrato-kanban/spec.md#L1-L35)
- [openspec/specs/contrato-kanban/spec.md:1-35](file://openspec/specs/contrato-kanban/spec.md#L1-L35)

### Contract Creation Workflow
The creation workflow captures required fields and persists them with defaults derived from the configured pipeline. Validation ensures required fields are present before submission.

**Enhanced** The creation process now includes optimistic concurrency control to prevent conflicts during concurrent contract creation.

```mermaid
flowchart TD
Start(["Open New Contract Sheet"]) --> Fields["Select: area, contract type, billing type, client, client role"]
Fields --> Validate{"Required fields present?"}
Validate --> |No| ShowErrors["Show validation errors<br/>Highlight invalid fields"]
ShowErrors --> Fields
Validate --> |Yes| CheckLock["Check for existing lock"]
CheckLock --> |Lock Exists| WaitRetry["Wait and retry later"]
CheckLock --> |No Lock| Save["Save contract with OCC snapshot"]
Save --> Persist["Persist contract with tipo_contrato_id, tipo_cobranca_id, estagio_id"]
Persist --> Success["Close sheet, refresh list, show success"]
Persist --> Conflict{"OCC Conflict Detected?"}
Conflict --> |Yes| HandleConflict["Handle conflict with retry/backoff"]
Conflict --> |No| Success
Conflict --> HandleConflict
HandleConflict --> Save
Persist --> Error["Show error, keep sheet open for correction"]
Error --> Submit
```

**Diagram sources**
- [openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contratos/spec.md:74-101](file://openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contratos/spec.md#L74-L101)
- [supabase/migrations/20260225000003_add_contratos_new_fk_columns.sql:1-16](file://supabase/migrations/20260225000003_add_contratos_new_fk_columns.sql#L1-L16)
- [src/shared/contratos/repository.ts:787-798](file://src/shared/contratos/repository.ts#L787-L798)

**Section sources**
- [openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contratos/spec.md:74-101](file://openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contratos/spec.md#L74-L101)
- [supabase/migrations/20260225000003_add_contratos_new_fk_columns.sql:1-16](file://supabase/migrations/20260225000003_add_contratos_new_fk_columns.sql#L1-L16)
- [src/shared/contratos/repository.ts:787-798](file://src/shared/contratos/repository.ts#L787-L798)

### Approval Workflows and Execution Tracking
Approval workflows are modeled by pipeline stages and status transitions. Execution tracking is supported by status history entries and timestamps.

**Enhanced** The approval process now includes conflict detection to prevent simultaneous status changes from multiple users.

```mermaid
sequenceDiagram
participant User as "User"
participant System as "Contract System"
participant History as "Status History"
participant DB as "Supabase"
User->>System : Move contract to next stage
System->>DB : UPDATE contratos SET estagio_id = next
DB-->>System : OK
System->>History : INSERT INTO contrato_status_historico
History->>DB : INSERT rows
DB-->>History : OK
System-->>User : Updated contract + history recorded
```

**Diagram sources**
- [supabase/schemas/43_contrato_status_historico.sql:1-19](file://supabase/schemas/43_contrato_status_historico.sql#L1-L19)
- [supabase/schemas/11_contratos.sql:1-61](file://supabase/schemas/11_contratos.sql#L1-L61)

**Section sources**
- [supabase/schemas/43_contrato_status_historico.sql:1-19](file://supabase/schemas/43_contrato_status_historico.sql#L1-L19)
- [supabase/schemas/11_contratos.sql:1-61](file://supabase/schemas/11_contratos.sql#L1-L61)

### Renewal Management
Renewal management is not explicitly defined in the current schema and migrations. It would typically involve:
- Linking renewed contracts to original contracts.
- Copying relevant terms and parties.
- Creating new pipeline stages for renewal workflows.
- Maintaining status history for renewals.

### Template Management and PDF Generation
Templates are associated with forms and can be generated into PDFs using mapped contract data. The design document confirms template availability and mapping coverage.

```mermaid
sequenceDiagram
participant User as "User"
participant System as "Contract System"
participant Templates as "PDF Templates"
participant Storage as "Storage"
User->>System : Request template generation
System->>Templates : Map contract data to template placeholders
Templates->>Storage : Load template + assets
Storage-->>Templates : Template + fields
Templates-->>System : Generated PDF buffer(s)
System-->>User : Download ZIP/PDF
```

**Diagram sources**
- [docs/superpowers/specs/2026-04-16-gerar-pdfs-contrato-trabalhista-design.md:20-28](file://docs/superpowers/specs/2026-04-16-gerar-pdfs-contrato-trabalhista-design.md#L20-L28)
- [docs/superpowers/plans/2026-04-16-gerar-pdfs-contrato-trabalhista.md:893-969](file://docs/superpowers/plans/2026-04-16-gerar-pdfs-contrato-trabalhista.md#L893-L969)

**Section sources**
- [docs/superpowers/specs/2026-04-16-gerar-pdfs-contrato-trabalhista-design.md:20-28](file://docs/superpowers/specs/2026-04-16-gerar-pdfs-contrato-trabalhista-design.md#L20-L28)
- [docs/superpowers/plans/2026-04-16-gerar-pdfs-contrato-trabalhista.md:893-969](file://docs/superpowers/plans/2026-04-16-gerar-pdfs-contrato-trabalhista.md#L893-L969)

### Integration with Legal Processes and Expedientes
Contracts can be linked to legal processes (expedientes). Tools exist to manage expedientes, including finalization and reversal, which can be integrated with contract lifecycle events.

```mermaid
sequenceDiagram
participant User as "User"
participant MCP as "MCP Tools"
participant Exp as "Expedientes System"
User->>MCP : Finalize/Revert expediente
MCP->>Exp : actionFinalizarBaixa / actionReverterBaixa
Exp-->>MCP : ActionResult
MCP-->>User : Tool result
```

**Diagram sources**
- [src/lib/mcp/registries/expedientes-tools.ts:129-156](file://src/lib/mcp/registries/expedientes-tools.ts#L129-L156)

**Section sources**
- [src/lib/mcp/registries/expedientes-tools.ts:129-156](file://src/lib/mcp/registries/expedientes-tools.ts#L129-L156)

### Tagging and Labeling Mechanisms
Tags are associated with contracts and can propagate to linked processes. This enables cross-entity filtering and reporting.

```mermaid
erDiagram
TAGS {
bigint id PK
text nome
text slug
text descricao
boolean ativo
timestamptz created_at
}
CONTRATO_TAGS {
bigint id PK
bigint contrato_id FK
bigint tag_id FK
timestamptz created_at
}
TAGS ||--o{ CONTRATO_TAGS : "relates to"
```

**Diagram sources**
- [supabase/schemas/44_contrato_tags.sql:1-15](file://supabase/schemas/44_contrato_tags.sql#L1-L15)

**Section sources**
- [supabase/schemas/44_contrato_tags.sql:1-15](file://supabase/schemas/44_contrato_tags.sql#L1-L15)
- [openspec/archive/refactor-contratos-modelo-relacional/specs/acervo/spec.md:1-21](file://openspec/archive/refactor-contratos-modelo-relacional/specs/acervo/spec.md#L1-L21)

### Practical Examples
- Creating a contract: Select area, type, billing type, client, and client role; submit to create with default stage from pipeline.
- Modifying a contract: Update parties, terms, and status; each change is audited in status history.
- Terminating a contract: Move to a terminal stage and record reasons in status history.

**Enhanced** All operations now include conflict detection and resolution mechanisms to ensure data consistency.

**Section sources**
- [openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contratos/spec.md:74-101](file://openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contratos/spec.md#L74-L101)
- [supabase/schemas/43_contrato_status_historico.sql:1-19](file://supabase/schemas/43_contrato_status_historico.sql#L1-L19)
- [src/shared/contratos/repository.ts:787-798](file://src/shared/contratos/repository.ts#L787-L798)

### Compliance Monitoring and Audit Trails
- Status history records transitions with timestamps and actors.
- Data snapshot field preserves previous state for audits.
- Row-level security policies protect data access.
- **Enhanced** OCC conflict logs provide detailed audit trail for concurrent access attempts.

**Section sources**
- [supabase/schemas/43_contrato_status_historico.sql:1-19](file://supabase/schemas/43_contrato_status_historico.sql#L1-L19)
- [supabase/schemas/11_contratos.sql:1-61](file://supabase/schemas/11_contratos.sql#L1-L61)
- [src/app/(authenticated)/captura/services/persistence/capture-log.service.ts:55-63](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L55-L63)

## Dependency Analysis
The system exhibits low coupling between frontend and backend through explicit API boundaries. Supabase schema defines strong referential integrity among contracts, parts, tags, and pipelines.

**Enhanced** The dependency graph now includes distributed locking and optimistic concurrency control components.

```mermaid
graph LR
API["/api/contratos/tipos"] --> TBL1["contrato_tipos"]
API --> TBL2["contrato_tipos_cobranca"]
KANBAN["Kanban Page"] --> PIPE["contrato_pipelines"]
KANBAN --> STAGE["contrato_pipeline_estagios"]
KANBAN --> CONTR["contratos"]
CONTR --> PART["contrato_partes"]
CONTR --> STAT["contrato_status_historico"]
CONTR --> TAGR["contrato_tags"]
LOCK["Distributed Locks"] --> CONTR
OCC["Optimistic Concurrency"] --> CONTR
```

**Diagram sources**
- [src/app/api/contratos/tipos/route.ts:1-88](file://src/app/api/contratos/tipos/route.ts#L1-L88)
- [src/app/(authenticated)/contratos/kanban/page.tsx](file://src/app/(authenticated)/contratos/kanban/page.tsx#L1-L19)
- [supabase/migrations/20260225000001_create_contrato_tipos.sql:1-74](file://supabase/migrations/20260225000001_create_contrato_tipos.sql#L1-L74)
- [supabase/migrations/20260225000002_create_contrato_pipelines.sql:1-74](file://supabase/migrations/20260225000002_create_contrato_pipelines.sql#L1-L74)
- [supabase/schemas/11_contratos.sql:1-61](file://supabase/schemas/11_contratos.sql#L1-L61)
- [supabase/schemas/42_contrato_partes.sql:1-21](file://supabase/schemas/42_contrato_partes.sql#L1-L21)
- [supabase/schemas/43_contrato_status_historico.sql:1-19](file://supabase/schemas/43_contrato_status_historico.sql#L1-L19)
- [supabase/schemas/44_contrato_tags.sql:1-15](file://supabase/schemas/44_contrato_tags.sql#L1-L15)
- [supabase/migrations/20251125000000_create_locks_table.sql:1-77](file://supabase/migrations/20251125000000_create_locks_table.sql#L1-L77)

**Section sources**
- [src/app/api/contratos/tipos/route.ts:1-88](file://src/app/api/contratos/tipos/route.ts#L1-L88)
- [src/app/(authenticated)/contratos/kanban/page.tsx](file://src/app/(authenticated)/contratos/kanban/page.tsx#L1-L19)
- [supabase/migrations/20260225000001_create_contrato_tipos.sql:1-74](file://supabase/migrations/20260225000001_create_contrato_tipos.sql#L1-L74)
- [supabase/migrations/20260225000002_create_contrato_pipelines.sql:1-74](file://supabase/migrations/20260225000002_create_contrato_pipelines.sql#L1-L74)
- [supabase/schemas/11_contratos.sql:1-61](file://supabase/schemas/11_contratos.sql#L1-L61)
- [supabase/schemas/42_contrato_partes.sql:1-21](file://supabase/schemas/42_contrato_partes.sql#L1-L21)
- [supabase/schemas/43_contrato_status_historico.sql:1-19](file://supabase/schemas/43_contrato_status_historico.sql#L1-L19)
- [supabase/schemas/44_contrato_tags.sql:1-15](file://supabase/schemas/44_contrato_tags.sql#L1-L15)
- [supabase/migrations/20251125000000_create_locks_table.sql:1-77](file://supabase/migrations/20251125000000_create_locks_table.sql#L1-L77)

## Performance Considerations
- Indexes on foreign keys and frequently filtered columns improve query performance.
- Denormalized snapshots and JSONB fields support auditability but should be used judiciously.
- Kanban queries should leverage pipeline and stage ordering to minimize sorting overhead.
- **Enhanced** Distributed locks use efficient PostgreSQL advisory locking mechanisms with TTL-based expiration.
- **Enhanced** OCC conflict detection minimizes performance impact through targeted conflict checks.

## Troubleshooting Guide
- API permission errors: Ensure proper permissions for contract type creation and listing.
- Validation failures: Confirm required fields are present before submission.
- Kanban rendering issues: Verify pipeline existence for the selected segment and stage ordering.
- PDF generation errors: Check template mapping completeness and storage availability.
- **Enhanced** OCC conflict errors: Implement retry logic with exponential backoff for transient conflicts.
- **Enhanced** Lock acquisition failures: Check distributed lock table for expired locks and cleanup procedures.
- **Enhanced** Audit trail discrepancies: Review OCC conflict logs for detected concurrent access attempts.

**Section sources**
- [src/app/api/contratos/tipos/route.ts:55-88](file://src/app/api/contratos/tipos/route.ts#L55-L88)
- [openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contratos/spec.md:86-96](file://openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contratos/spec.md#L86-L96)
- [src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts](file://src/app/(authenticated)/contratos/hooks/use-kanban-contratos.ts#L109-L115)
- [docs/superpowers/specs/2026-04-16-gerar-pdfs-contrato-trabalhista-design.md:20-28](file://docs/superpowers/specs/2026-04-16-gerar-pdfs-contrato-trabalhista-design.md#L20-L28)
- [src/app/(authenticated)/captura/services/persistence/capture-log.service.ts:55-63](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L55-L63)
- [src/lib/utils/locks/distributed-lock.ts:133-147](file://src/lib/utils/locks/distributed-lock.ts#L133-L147)

## Conclusion
The Contract Management System leverages configurable contract types, billing types, and pipeline stages to support flexible workflows. The kanban board provides visual tracking, while tagging and status history enable compliance and auditability. Integration with legal processes and document management rounds out the solution for a complete legal operations platform.

**Enhanced** The system now includes robust optimistic concurrency control mechanisms and distributed locking to prevent data conflicts in concurrent environments, ensuring data consistency and reliability for high-traffic contract management scenarios.

## Appendices
- OpenSpec requirements for contract creation and kanban board.
- Migration scripts defining the contract domain model and pipeline configuration.
- PDF template generation documentation and plans.
- **Enhanced** Distributed locking implementation details and configuration options.
- **Enhanced** Optimistic concurrency control mechanisms and conflict resolution strategies.

**Section sources**
- [openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contratos/spec.md:74-101](file://openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contratos/spec.md#L74-L101)
- [openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contrato-kanban/spec.md:1-35](file://openspec/changes/archive/2026-02-25-flexibilizar-contratos-pipeline-kanban/specs/contrato-kanban/spec.md#L1-L35)
- [openspec/specs/contrato-kanban/spec.md:1-35](file://openspec/specs/contrato-kanban/spec.md#L1-L35)
- [supabase/migrations/20260225000001_create_contrato_tipos.sql:1-74](file://supabase/migrations/20260225000001_create_contrato_tipos.sql#L1-L74)
- [supabase/migrations/20260225000002_create_contrato_pipelines.sql:1-74](file://supabase/migrations/20260225000002_create_contrato_pipelines.sql#L1-L74)
- [docs/superpowers/specs/2026-04-16-gerar-pdfs-contrato-trabalhista-design.md:20-28](file://docs/superpowers/specs/2026-04-16-gerar-pdfs-contrato-trabalhista-design.md#L20-L28)
- [docs/superpowers/plans/2026-04-16-gerar-pdfs-contrato-trabalhista.md:893-969](file://docs/superpowers/plans/2026-04-16-gerar-pdfs-contrato-trabalhista.md#L893-L969)
- [supabase/migrations/20251125000000_create_locks_table.sql:1-77](file://supabase/migrations/20251125000000_create_locks_table.sql#L1-L77)
- [src/lib/utils/locks/distributed-lock.ts:1-164](file://src/lib/utils/locks/distributed-lock.ts#L1-L164)
- [src/shared/contratos/repository.ts:743-831](file://src/shared/contratos/repository.ts#L743-L831)