# Status Management and Workflow Automation

<cite>
**Referenced Files in This Document**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts)
- [domain.ts](file://src/app/(authenticated)/acervo/domain.ts)
- [service.ts](file://src/app/(authenticated)/processos/service.ts)
- [repository.ts](file://src/app/(authenticated)/processos/repository.ts)
- [audit-log.service.ts](file://src/lib/domain/audit/services/audit-log.service.ts)
- [logs_alteracao.sql](file://supabase/schemas/14_logs_alteracao.sql)
- [43_contrato_status_historico.sql](file://supabase/schemas/43_contrato_status_historico.sql)
- [pje-documento-types.ts](file://src/app/(authenticated)/captura/types/pje-documento-types.ts)
- [processo-status-badge.tsx](file://src/app/(authenticated)/processos/components/processo-status-badge.tsx)
- [processos-table-wrapper.tsx](file://src/app/(authenticated)/processos/components/processos-table-wrapper.tsx)
- [use-audit-logs.ts](file://src/lib/domain/audit/hooks/use-audit-logs.ts)
- [audiencia-timeline.tsx](file://src/app/(authenticated)/audiencias/components/audiencia-timeline.tsx)
- [route.ts](file://src/app/api/cron/alertas-disk-io/route.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document describes the legal process status management and workflow automation system. It covers the StatusProcesso enumeration, status mapping from PJE-TRT codes, normalization rules, automated status updates, workflow triggers, audit trails, status history tracking, and downstream impacts such as notifications and reporting. Practical examples illustrate status change workflows, manual overrides, and integration points with external systems.

## Project Structure
The status management system spans three layers:
- Domain layer: Defines StatusProcesso, normalization functions, and status mapping logic
- Service layer: Implements business rules for creation, updates, and validations
- Persistence layer: Handles database operations and maintains audit trails

```mermaid
graph TB
subgraph "Domain Layer"
DP["processos/domain.ts<br/>StatusProcesso enum<br/>mapCodigoStatusToEnum()"]
DA["acervo/domain.ts<br/>mapearStatusProcesso()"]
end
subgraph "Service Layer"
SP["processos/service.ts<br/>criarProcesso()<br/>atualizarProcesso()"]
end
subgraph "Persistence Layer"
RP["processos/repository.ts<br/>findProcessoById()<br/>findAllProcessos()<br/>findTimelineByProcessoId()"]
end
subgraph "Audit & Notifications"
AL["audit-log.service.ts<br/>AuditLogService"]
LA["logs_alteracao.sql<br/>audit table schema"]
CH["43_contrato_status_historico.sql<br/>status history table"]
end
DP --> SP
DA --> SP
SP --> RP
RP --> AL
AL --> LA
SP --> CH
```

**Diagram sources**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L60-L69)
- [domain.ts](file://src/app/(authenticated)/acervo/domain.ts#L419-L433)
- [service.ts](file://src/app/(authenticated)/processos/service.ts#L56-L124)
- [repository.ts](file://src/app/(authenticated)/processos/repository.ts#L181-L220)
- [audit-log.service.ts:25-47](file://src/lib/domain/audit/services/audit-log.service.ts#L25-L47)
- [logs_alteracao.sql:18-32](file://supabase/schemas/14_logs_alteracao.sql#L18-L32)
- [43_contrato_status_historico.sql:3-13](file://supabase/schemas/43_contrato_status_historico.sql#L3-L13)

**Section sources**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L57-L69)
- [domain.ts](file://src/app/(authenticated)/acervo/domain.ts#L419-L433)
- [service.ts](file://src/app/(authenticated)/processos/service.ts#L47-L124)
- [repository.ts](file://src/app/(authenticated)/processos/repository.ts#L181-L220)
- [audit-log.service.ts:25-47](file://src/lib/domain/audit/services/audit-log.service.ts#L25-L47)
- [logs_alteracao.sql:18-32](file://supabase/schemas/14_logs_alteracao.sql#L18-L32)
- [43_contrato_status_historico.sql:3-13](file://supabase/schemas/43_contrato_status_historico.sql#L3-L13)

## Core Components
- StatusProcesso enum: Canonical set of legal process statuses used across the system
- PJE-TRT status mapping: Functions that normalize external status codes into StatusProcesso
- Validation and normalization: Zod schemas and helper functions ensure data integrity
- Audit and notifications: Centralized audit logging and notification triggers for downstream systems

Key responsibilities:
- Normalize PJE-TRT status codes to internal StatusProcesso values
- Enforce validation rules during creation and updates
- Track status changes and maintain audit trails
- Trigger notifications and downstream effects on status transitions

**Section sources**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L60-L69)
- [domain.ts](file://src/app/(authenticated)/acervo/domain.ts#L419-L433)
- [service.ts](file://src/app/(authenticated)/processos/service.ts#L250-L356)
- [repository.ts](file://src/app/(authenticated)/processos/repository.ts#L90-L123)

## Architecture Overview
The system follows a layered architecture with clear separation of concerns:
- Domain: Enumerations, mapping functions, and validation rules
- Service: Business logic for process lifecycle operations
- Repository: Database access and caching
- Audit: Centralized logging for all changes
- Notifications: Cron-triggered alerts and real-time channels

```mermaid
sequenceDiagram
participant Client as "Client"
participant Service as "processos/service.ts"
participant Repo as "processos/repository.ts"
participant DB as "Database"
participant Audit as "AuditLogService"
Client->>Service : criarProcesso(input)
Service->>Service : validate input (Zod)
Service->>Service : advogadoExists()
Service->>Repo : saveProcesso()
Repo->>DB : INSERT acervo
DB-->>Repo : success
Repo-->>Service : Processo
Service-->>Client : Result<Processo>
Note over Service,DB : On successful creation, audit log is generated
Service->>Audit : log changes (via downstream triggers)
Audit-->>Service : audit records
```

**Diagram sources**
- [service.ts](file://src/app/(authenticated)/processos/service.ts#L56-L124)
- [repository.ts](file://src/app/(authenticated)/processos/repository.ts#L181-L220)
- [audit-log.service.ts:25-47](file://src/lib/domain/audit/services/audit-log.service.ts#L25-L47)

## Detailed Component Analysis

### StatusProcesso Enumeration and Mapping
The StatusProcesso enum defines canonical statuses for legal processes. Two mapping functions normalize external PJE-TRT status codes into this enum:
- mapCodigoStatusToEnum in the process domain
- mapearStatusProcesso in the acervo domain

```mermaid
flowchart TD
Start(["External Status Code"]) --> CheckEmpty{"Is empty/null?"}
CheckEmpty --> |Yes| Outro["Set OUTRO"]
CheckEmpty --> |No| Upper["Uppercase Code"]
Upper --> Numeric{"Is numeric?"}
Numeric --> |Yes| Ativo["Set ATIVO"]
Numeric --> |No| Contains["Check substrings"]
Contains --> Ativo2["Contains 'ATIVO'/'DISTRIBUIDO'? -> ATIVO"]
Contains --> Suspenso["Contains 'SUSPENSO'/'SUSPENSAO'? -> SUSPENSO"]
Contains --> Arquivado["Contains 'ARQUIVADO'/'ARQUIVO'? -> ARQUIVADO"]
Contains --> Extinto["Contains 'EXTINTO'/'EXTINCAO'? -> EXTINTO"]
Contains --> Baixado["Contains 'BAIXADO'/'BAIXA'? -> BAIXADO"]
Contains --> Pendente["Contains 'PENDENTE'? -> PENDENTE"]
Contains --> Recurso["Contains 'RECURSO'/'RECURSAL'? -> EM_RECURSO"]
Contains --> Other["Else -> OUTRO"]
```

**Diagram sources**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L531-L563)
- [domain.ts](file://src/app/(authenticated)/acervo/domain.ts#L419-L433)

**Section sources**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L60-L69)
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L531-L563)
- [domain.ts](file://src/app/(authenticated)/acervo/domain.ts#L419-L433)

### Status Normalization and Validation
Normalization ensures external codes are consistently mapped to internal statuses. Validation enforces:
- CNJ number format compliance
- Existence checks for related entities (advogado, usuário)
- Preventing updates without changes

```mermaid
flowchart TD
A["Input Update"] --> B["Zod Validation"]
B --> C{"Has fields to update?"}
C --> |No| Err["Return VALIDATION_ERROR"]
C --> |Yes| D["Load Existing Processo"]
D --> E{"Validate advogadoId change?"}
E --> |Yes| F["advogadoExists()"]
F --> |No| Err
E --> |No| G{"Validate responsavelId change?"}
G --> |Yes| H["usuarioExists()"]
H --> |No| Err
G --> |No| I["Persist via repository"]
I --> J["Return Result<Processo>"]
```

**Diagram sources**
- [service.ts](file://src/app/(authenticated)/processos/service.ts#L250-L356)
- [repository.ts](file://src/app/(authenticated)/processos/repository.ts#L1017-L1067)

**Section sources**
- [service.ts](file://src/app/(authenticated)/processos/service.ts#L250-L356)
- [repository.ts](file://src/app/(authenticated)/processos/repository.ts#L1017-L1067)

### Audit Trail Generation and Status History Tracking
All changes are captured in centralized audit logs. The system maintains:
- logs_alteracao: Generic audit table for any entity/event type
- contrato_status_historico: Dedicated table for contract status history (conceptually analogous for processes)

```mermaid
erDiagram
LOGS_ALTERACAO {
int id PK
text tipo_entidade
int entidade_id
text tipo_evento
int usuario_que_executou_id
int responsavel_anterior_id
int responsavel_novo_id
jsonb dados_evento
timestamptz created_at
}
CONTRATO_STATUS_HISTORICO {
bigint id PK
bigint contrato_id FK
enum from_status
enum to_status
timestamptz changed_at
int changed_by
text reason
jsonb metadata
timestamptz created_at
}
LOGS_ALTERACAO ||--o{ CONTRATO_STATUS_HISTORICO : "tracks"
```

**Diagram sources**
- [logs_alteracao.sql:18-32](file://supabase/schemas/14_logs_alteracao.sql#L18-L32)
- [43_contrato_status_historico.sql:3-13](file://supabase/schemas/43_contrato_status_historico.sql#L3-L13)

**Section sources**
- [audit-log.service.ts:25-47](file://src/lib/domain/audit/services/audit-log.service.ts#L25-L47)
- [logs_alteracao.sql:18-32](file://supabase/schemas/14_logs_alteracao.sql#L18-L32)
- [43_contrato_status_historico.sql:3-13](file://supabase/schemas/43_contrato_status_historico.sql#L3-L13)

### Downstream System Impacts
Status changes trigger notifications and reporting:
- Real-time notifications for events like "processo_atribuido"
- Cron-based alerts for system metrics impacting process data availability
- Timeline enrichment for process visibility

```mermaid
sequenceDiagram
participant Repo as "Repository"
participant DB as "Database"
participant Notif as "Notifications"
participant Cron as "Cron Jobs"
Repo->>DB : INSERT/UPDATE acervo
DB-->>Repo : success
Repo->>Notif : create notification (e.g., processo_atribuido)
Notif-->>Repo : queued
Cron->>DB : RPC metrics (e.g., obter_metricas_disk_io)
DB-->>Cron : metrics
Cron->>Notif : create admin alert (e.g., disk_io_alert)
Notif-->>Cron : queued
```

**Diagram sources**
- [repository.ts](file://src/app/(authenticated)/processos/repository.ts#L181-L220)
- [route.ts:61-87](file://src/app/api/cron/alertas-disk-io/route.ts#L61-L87)

**Section sources**
- [route.ts:61-87](file://src/app/api/cron/alertas-disk-io/route.ts#L61-L87)
- [audiencia-timeline.tsx](file://src/app/(authenticated)/audiencias/components/audiencia-timeline.tsx#L103-L135)

### UI Integration and Display
Status badges and tables reflect current status values and support manual overrides:
- ProcessoStatusBadge renders semantic status badges
- ProcessosTableWrapper displays status columns and supports inline edits

**Section sources**
- [processo-status-badge.tsx](file://src/app/(authenticated)/processos/components/processo-status-badge.tsx#L16-L22)
- [processos-table-wrapper.tsx](file://src/app/(authenticated)/processos/components/processos-table-wrapper.tsx#L376-L379)

## Dependency Analysis
The system exhibits low coupling and high cohesion:
- Domain functions are pure and reusable across services
- Services depend on repositories for persistence
- Audit logging is decoupled via service calls and database triggers
- Notifications are triggered by explicit actions or cron jobs

```mermaid
graph LR
DP["processos/domain.ts"] --> SV["processos/service.ts"]
DA["acervo/domain.ts"] --> SV
SV --> RP["processos/repository.ts"]
RP --> DB["Database"]
SV --> AL["audit-log.service.ts"]
AL --> LA["logs_alteracao.sql"]
SV --> CH["43_contrato_status_historico.sql"]
```

**Diagram sources**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L531-L563)
- [domain.ts](file://src/app/(authenticated)/acervo/domain.ts#L419-L433)
- [service.ts](file://src/app/(authenticated)/processos/service.ts#L56-L124)
- [repository.ts](file://src/app/(authenticated)/processos/repository.ts#L181-L220)
- [audit-log.service.ts:25-47](file://src/lib/domain/audit/services/audit-log.service.ts#L25-L47)
- [logs_alteracao.sql:18-32](file://supabase/schemas/14_logs_alteracao.sql#L18-L32)
- [43_contrato_status_historico.sql:3-13](file://supabase/schemas/43_contrato_status_historico.sql#L3-L13)

**Section sources**
- [service.ts](file://src/app/(authenticated)/processos/service.ts#L56-L124)
- [repository.ts](file://src/app/(authenticated)/processos/repository.ts#L181-L220)
- [audit-log.service.ts:25-47](file://src/lib/domain/audit/services/audit-log.service.ts#L25-L47)

## Performance Considerations
- Column selection optimization: Basic/full/unified views reduce I/O and improve query performance
- Caching: Redis caching for frequently accessed lists and unified views
- Indexes: Strategic indexes on frequently filtered columns (trt, grau, numero_processo, responsavel_id)
- Pagination: Controlled limits prevent heavy result sets

Recommendations:
- Prefer basic column sets for list views
- Leverage unified views for cross-grau aggregations
- Monitor slow queries and add missing indexes as needed

**Section sources**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L580-L631)
- [repository.ts](file://src/app/(authenticated)/processos/repository.ts#L336-L664)

## Troubleshooting Guide
Common issues and resolutions:
- Validation errors: Ensure CNJ format compliance and that related entities exist before updates
- Empty or null status codes: Mapped to OUTRO; verify upstream data quality
- Missing audit logs: Confirm audit triggers and service role permissions
- Notification delivery failures: Review cron job logs and notification queue status

Operational checks:
- Verify status mapping accuracy against PJE-TRT codes
- Confirm audit-log service connectivity and query performance
- Validate notification channel subscriptions and polling fallbacks

**Section sources**
- [service.ts](file://src/app/(authenticated)/processos/service.ts#L250-L356)
- [audit-log.service.ts:25-47](file://src/lib/domain/audit/services/audit-log.service.ts#L25-L47)
- [use-audit-logs.ts:1-15](file://src/lib/domain/audit/hooks/use-audit-logs.ts#L1-L15)

## Conclusion
The system provides robust status management with clear normalization rules, comprehensive audit trails, and integrated notifications. Status changes are validated, audited, and propagated to downstream systems. The architecture supports both automated updates from external sources and manual overrides, ensuring flexibility while maintaining data integrity and traceability.