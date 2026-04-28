# Legal Process Management System

<cite>
**Referenced Files in This Document**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts)
- [timeline-unificada.ts](file://src/app/(authenticated)/acervo/timeline-unificada.ts)
- [04_acervo.sql](file://supabase/schemas/04_acervo.sql)
- [05_acervo_unificado_view.sql](file://supabase/schemas/05_acervo_unificado_view.sql)
- [17_processo_partes.sql](file://supabase/schemas/17_processo_partes.sql)
- [service.ts](file://src/app/(authenticated)/calendar/service.ts)
- [index.ts](file://scripts/captura/index.ts)
- [index.ts](file://scripts/sincronizacao/index.ts)
- [route.ts](file://src/app/api/captura/tribunais/route.ts)
- [route.ts](file://src/app/api/captura/tribunais/[id]/route.ts)
- [audit-log.service.ts](file://src/lib/domain/audit/services/audit-log.service.ts)
- [14_logs_alteracao.sql](file://supabase/schemas/14_logs_alteracao.sql)
- [design.md](file://openspec/changes/archive/2025-11-24-captura-partes-pje/design.md)
- [tasks.md](file://openspec/changes/archive/2025-11-24-captura-partes-pje/tasks.md)
- [spec.md](file://openspec/specs/audit-atividades/spec.md)
- [expedientes.tsx](file://src/app/(authenticated)/ajuda/content/expedientes.tsx)
- [data.ts](file://src/app/(authenticated)/agenda/mock/data.ts)
- [mock-data.ts](file://src/app/(authenticated)/agenda/components/mock-data.ts)
- [capture-log.service.ts](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts)
- [errors.ts](file://src/app/(authenticated)/captura/services/partes/errors.ts)
- [distributed-lock.ts](file://src/lib/utils/locks/distributed-lock.ts)
- [server-action-error-handler.ts](file://src/lib/server-action-error-handler.ts)
- [errors.ts](file://src/shared/partes/errors.ts)
- [partes-form-actions.ts](file://src/app/(authenticated)/partes/actions/partes-form-actions.ts)
- [MASTER.md](file://design-system/zattaros/MASTER.md)
- [obrigacao-detalhes-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/obrigacao-detalhes-dialog.tsx)
- [nova-obrigacao-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/nova-obrigacao-dialog.tsx)
- [promover-transitoria-dialog.tsx](file://src/app/(authenticated)/partes/components/partes-contrarias/promover-transitoria-dialog.tsx)
- [cliente-form.tsx](file://src/app/(authenticated)/partes/components/clientes/cliente-form.tsx)
- [dialog.tsx](file://src/components/ui/dialog.tsx)
</cite>

## Update Summary
**Changes Made**
- Enhanced dialog components across legal process management modules with improved accessibility and semantic HTML structure
- Updated obrigacoes module with proper dialog patterns including inline editing and status management
- Updated partes module with comprehensive dialog patterns for partie management and promotion workflows
- Implemented standardized dialog shell components with proper focus management and keyboard navigation
- Added semantic labeling and screen reader support throughout dialog interfaces
- Enhanced dialog density and spacing patterns for better visual hierarchy

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Enhanced Dialog Patterns](#enhanced-dialog-patterns)
7. [Enhanced Error Handling System](#enhanced-error-handling-system)
8. [Dependency Analysis](#dependency-analysis)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Conclusion](#conclusion)
12. [Appendices](#appendices)

## Introduction
This document describes the Legal Process Management System with a focus on unified legal case tracking and management. It explains the Processo entity model, the ProcessoUnificado view for multi-instance tracking, and the timeline/movimentations system. It documents automated data capture from PJE-TRT systems, data synchronization workflows, and unified process aggregation. It also covers status management, workflow automation, and audit trails, along with practical examples of process creation, updates, filtering, and reporting. The system now features enhanced dialog components across legal process management modules with improved accessibility and semantic HTML structure, providing better user experience and compliance with accessibility standards.

## Project Structure
The system is organized around:
- Domain models and validation for legal processes
- Database schema with core tables and a unified view
- Timeline aggregation service for multi-instance processes
- Calendar integration for audiências and expedientes
- Automated data capture and synchronization scripts with enhanced error handling
- Audit logging for compliance and traceability
- API routes for tribunal configuration and data capture
- Distributed locking mechanism for concurrent operation protection
- Structured error handling with semantic categorization
- **Enhanced Dialog Components**: Standardized dialog patterns across obrigacoes and partes modules with improved accessibility and semantic structure

```mermaid
graph TB
subgraph "Domain Layer"
D1["Processo Model<br/>domain.ts"]
D2["ProcessoUnificado View<br/>05_acervo_unificado_view.sql"]
D3["Timeline Unificada<br/>timeline-unificada.ts"]
end
subgraph "Database Layer"
DB1["Acervo Table<br/>04_acervo.sql"]
DB2["Processo Partes<br/>17_processo_partes.sql"]
DB3["Audit Logs<br/>14_logs_alteracao.sql"]
DB4["Locks Table<br/>distributed-lock.ts"]
end
subgraph "Enhanced Dialog System"
DI1["Obrigacao Detalhes Dialog<br/>obrigacao-detalhes-dialog.tsx"]
DI2["Nova Obrigacao Dialog<br/>nova-obrigacao-dialog.tsx"]
DI3["Promover Transitoria Dialog<br/>promover-transitoria-dialog.tsx"]
DI4["Cliente Form Dialog<br/>cliente-form.tsx"]
DI5["Dialog Shell Components<br/>dialog.tsx"]
end
subgraph "Enhanced Error Handling"
EH1["Capture Log Service<br/>capture-log.service.ts"]
EH2["Structured Errors<br/>errors.ts"]
EH3["Distributed Locks<br/>distributed-lock.ts"]
EH4["Server Action Handler<br/>server-action-error-handler.ts"]
end
subgraph "Integration Layer"
API1["Captura Scripts<br/>scripts/captura/index.ts"]
API2["Sync Scripts<br/>scripts/sincronizacao/index.ts"]
API3["Tribunal Routes<br/>routes.ts"]
end
subgraph "UI Layer"
UI1["Calendar Service<br/>service.ts"]
UI2["Expedientes Help<br/>expedientes.tsx"]
UI3["Agenda Mock Data<br/>data.ts / mock-data.ts"]
UI4["Design System<br/>MASTER.md"]
end
D1 --> DB1
D2 --> DB1
D3 --> DB1
DB1 --> DB2
DB3 --> D1
DB4 --> EH3
EH1 --> API1
EH2 --> EH1
EH3 --> API1
EH4 --> UI1
API1 --> DB1
API2 --> DB1
API3 --> DB1
UI1 --> DB1
UI2 --> DB1
UI3 --> DB1
UI4 --> UI1
DI1 --> DI5
DI2 --> DI5
DI3 --> DI5
DI4 --> DI5
```

**Diagram sources**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L75-L118)
- [05_acervo_unificado_view.sql:44-151](file://supabase/schemas/05_acervo_unificado_view.sql#L44-L151)
- [timeline-unificada.ts](file://src/app/(authenticated)/acervo/timeline-unificada.ts#L169-L178)
- [04_acervo.sql:4-32](file://supabase/schemas/04_acervo.sql#L4-L32)
- [17_processo_partes.sql:6-69](file://supabase/schemas/17_processo_partes.sql#L6-L69)
- [index.ts:1-177](file://scripts/captura/index.ts#L1-L177)
- [index.ts:1-234](file://scripts/sincronizacao/index.ts#L1-L234)
- [route.ts:130-171](file://src/app/api/captura/tribunais/route.ts#L130-L171)
- [service.ts](file://src/app/(authenticated)/calendar/service.ts#L88-L127)
- [capture-log.service.ts](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L65-L234)
- [errors.ts](file://src/app/(authenticated)/captura/services/partes/errors.ts#L9-L109)
- [distributed-lock.ts:25-147](file://src/lib/utils/locks/distributed-lock.ts#L25-L147)
- [server-action-error-handler.ts:21-53](file://src/lib/server-action-error-handler.ts#L21-L53)
- [obrigacao-detalhes-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/obrigacao-detalhes-dialog.tsx#L360-L390)
- [nova-obrigacao-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/nova-obrigacao-dialog.tsx#L97-L106)
- [promover-transitoria-dialog.tsx](file://src/app/(authenticated)/partes/components/partes-contrarias/promover-transitoria-dialog.tsx#L234-L243)
- [cliente-form.tsx](file://src/app/(authenticated)/partes/components/clientes/cliente-form.tsx#L43-L48)
- [dialog.tsx](file://src/components/ui/dialog.tsx)

**Section sources**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L1-L674)
- [04_acervo.sql:1-77](file://supabase/schemas/04_acervo.sql#L1-L77)
- [05_acervo_unificado_view.sql:1-247](file://supabase/schemas/05_acervo_unificado_view.sql#L1-L247)
- [17_processo_partes.sql:1-144](file://supabase/schemas/17_processo_partes.sql#L1-L144)
- [index.ts:1-177](file://scripts/captura/index.ts#L1-L177)
- [index.ts:1-234](file://scripts/sincronizacao/index.ts#L1-L234)
- [route.ts:130-171](file://src/app/api/captura/tribunais/route.ts#L130-L171)

## Core Components
- Processo entity model: Complete mapping of the acervo table with validation schemas, sorting, filtering, and CNJ number validation.
- ProcessoUnificado view: Materialized view that aggregates multi-instance processes (first, second, superior courts) and identifies the current instance.
- Timeline/Movimentations: Timeline unification service that merges events across instances and applies deduplication.
- ProcessoPartes: N:N relationship between processes and parties (clients, adverse parties, third parties), enabling unified party tracking.
- Audit trail: Centralized logs for ownership changes and other business events.
- Calendar integration: Unified calendar events for audiências and expedientes, including scheduling and reminders.
- Data capture and sync: Scripts for capturing PJE-TRT data and synchronizing entities and relationships with enhanced error handling.
- **Enhanced Dialog Components**: Standardized dialog patterns across obrigacoes and partes modules with improved accessibility, semantic HTML structure, and proper focus management.
- **Enhanced Error Handling**: Structured error types with semantic categorization, conflict detection for concurrent operations, and comprehensive logging.
- **Distributed Locking**: Mechanism to prevent concurrent operations on the same resources.
- **Server Action Error Handling**: Automatic detection and recovery from version mismatch errors.

**Section sources**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L75-L118)
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L147-L165)
- [timeline-unificada.ts](file://src/app/(authenticated)/acervo/timeline-unificada.ts#L1-L195)
- [17_processo_partes.sql:6-69](file://supabase/schemas/17_processo_partes.sql#L6-L69)
- [audit-log.service.ts:1-50](file://src/lib/domain/audit/services/audit-log.service.ts#L1-L50)
- [service.ts](file://src/app/(authenticated)/calendar/service.ts#L88-L127)
- [index.ts:1-177](file://scripts/captura/index.ts#L1-L177)
- [index.ts:1-234](file://scripts/sincronizacao/index.ts#L1-L234)
- [capture-log.service.ts](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L65-L234)
- [errors.ts](file://src/app/(authenticated)/captura/services/partes/errors.ts#L9-L109)
- [distributed-lock.ts:25-147](file://src/lib/utils/locks/distributed-lock.ts#L25-L147)
- [server-action-error-handler.ts:21-53](file://src/lib/server-action-error-handler.ts#L21-L53)
- [obrigacao-detalhes-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/obrigacao-detalhes-dialog.tsx#L360-L390)
- [nova-obrigacao-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/nova-obrigacao-dialog.tsx#L97-L106)
- [promover-transitoria-dialog.tsx](file://src/app/(authenticated)/partes/components/partes-contrarias/promover-transitoria-dialog.tsx#L234-L243)
- [cliente-form.tsx](file://src/app/(authenticated)/partes/components/clientes/cliente-form.tsx#L43-L48)

## Architecture Overview
The system follows a layered architecture with enhanced dialog components and error handling:
- Domain layer defines entities, enums, and validation rules for legal processes.
- Database layer persists core entities and exposes a materialized view for unified process display.
- Integration layer orchestrates automated capture and synchronization with PJE-TRT systems using distributed locks and structured error handling.
- UI layer consumes unified views and calendar services to present audiências and expedientes with improved visual hierarchy and accessibility.
- Dialog layer provides standardized dialog patterns with semantic HTML structure and proper accessibility features.
- Audit layer ensures compliance and traceability of ownership and process changes.
- Error handling layer provides comprehensive error categorization, conflict detection, and recovery mechanisms.

```mermaid
graph TB
FE["Frontend UI<br/>Calendar + Process Views"] --> API["API Routes<br/>Captura + Tribunal Config"]
API --> CAP["Capture Scripts<br/>PJE-TRT Integration"]
API --> SYNC["Sync Scripts<br/>Entity Correlation"]
CAP --> LOCK["Distributed Locks<br/>Prevent Concurrency Issues"]
CAP --> LOGS["Capture Log Service<br/>Structured Logging"]
CAP --> DB["PostgreSQL/Supabase<br/>Tables + MV"]
SYNC --> DB
DB --> MV["Materialized View<br/>Acervo Unificado"]
FE --> MV
FE --> LOGS
FE --> ERR["Error Handling<br/>Structured Errors + Recovery"]
FE --> DIALOG["Dialog System<br/>Accessibility + Patterns"]
ERR --> HANDLER["Server Action Handler<br/>Version Mismatch Detection"]
DIALOG --> UI["Enhanced Dialog Components<br/>Obrigacoes + Partes"]
```

**Diagram sources**
- [route.ts:130-171](file://src/app/api/captura/tribunais/route.ts#L130-L171)
- [route.ts:20-62](file://src/app/api/captura/tribunais/[id]/route.ts#L20-L62)
- [index.ts:1-177](file://scripts/captura/index.ts#L1-L177)
- [index.ts:1-234](file://scripts/sincronizacao/index.ts#L1-L234)
- [05_acervo_unificado_view.sql:44-151](file://supabase/schemas/05_acervo_unificado_view.sql#L44-L151)
- [14_logs_alteracao.sql:6-16](file://supabase/schemas/14_logs_alteracao.sql#L6-L16)
- [capture-log.service.ts](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L65-L234)
- [errors.ts](file://src/app/(authenticated)/captura/services/partes/errors.ts#L9-L109)
- [distributed-lock.ts:25-147](file://src/lib/utils/locks/distributed-lock.ts#L25-L147)
- [server-action-error-handler.ts:21-53](file://src/lib/server-action-error-handler.ts#L21-L53)
- [obrigacao-detalhes-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/obrigacao-detalhes-dialog.tsx#L360-L390)
- [nova-obrigacao-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/nova-obrigacao-dialog.tsx#L97-L106)
- [promover-transitoria-dialog.tsx](file://src/app/(authenticated)/partes/components/partes-contrarias/promover-transitoria-dialog.tsx#L234-L243)

## Detailed Component Analysis

### Processo Entity Model
The Processo entity mirrors the acervo table with derived status mapping from PJE codes. It includes:
- Required fields: PJE ID, attorney, origin, TRT, degree, CNJ number, court description, classes, parties, dates, digital court flag, associations, and timestamps.
- Validation schemas for creation, updates, and manual creation without PJE data.
- Sorting, filtering, pagination parameters, and CNJ format validation.
- Column selection helpers to optimize disk I/O for listing vs. detail views.

```mermaid
classDiagram
class Processo {
+number id
+number idPje
+number advogadoId
+string origem
+string trt
+string grau
+string numeroProcesso
+number numero
+string descricaoOrgaoJulgador
+string classeJudicial
+boolean segredoJustica
+string codigoStatusProcesso
+number prioridadeProcessual
+string nomeParteAutora
+number qtdeParteAutora
+string nomeParteRe
+number qtdeParteRe
+string dataAutuacao
+boolean juizoDigital
+string dataArquivamento
+string dataProximaAudiencia
+boolean temAssociacao
+number responsavelId
+string createdAt
+string updatedAt
+StatusProcesso status
}
class ProcessoUnificado {
+number id
+number idPje
+number advogadoId
+string origem
+string trt
+string numeroProcesso
+number numero
+string descricaoOrgaoJulgador
+string classeJudicial
+boolean segredoJustica
+string codigoStatusProcesso
+number prioridadeProcessual
+string nomeParteAutora
+number qtdeParteAutora
+string nomeParteRe
+number qtdeParteRe
+string dataAutuacao
+boolean juizoDigital
+string dataArquivamento
+string dataProximaAudiencia
+boolean temAssociacao
+number responsavelId
+string createdAt
+string updatedAt
+string grau
+GrauProcesso grauAtual
+GrauProcesso[] grausAtivos
+string statusGeral
+ProcessoInstancia[] instances
+string trtOrigem
+string nomeParteAutoraOrigem
+string nomeParteReOrigem
+string dataAutuacaoOrigem
+string orgaoJulgadorOrigem
+GrauProcesso grauOrigem
}
ProcessoUnificado --> Processo : "extends"
```

**Diagram sources**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L90-L118)
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L147-L165)

**Section sources**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L75-L118)
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L147-L165)
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L210-L283)
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L360-L393)
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L404-L460)
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L568-L570)

### ProcessoUnificado View (Multi-Instance Aggregation)
The materialized view aggregates instances of the same process across degrees (first, second, superior) and identifies the current instance by latest autuation date and updated timestamp. It exposes:
- Current instance fields (grau_atual)
- Active degrees array
- Instances JSONB with per-degree metadata and a flag indicating the current instance
- Indexes optimized for performance and refresh strategies

```mermaid
flowchart TD
Start(["Refresh Trigger"]) --> CheckUnique["Ensure Unique Index Exists"]
CheckUnique --> TryConcurrent{"CONCURRENT refresh possible?"}
TryConcurrent --> |Yes| Concurrent["Refresh Materialized View Concurrently"]
TryConcurrent --> |No| Normal["Refresh Materialized View"]
Concurrent --> Done(["Ready"])
Normal --> Done
```

**Diagram sources**
- [05_acervo_unificado_view.sql:173-194](file://supabase/schemas/05_acervo_unificado_view.sql#L173-L194)

**Section sources**
- [05_acervo_unificado_view.sql:44-151](file://supabase/schemas/05_acervo_unificado_view.sql#L44-L151)
- [05_acervo_unificado_view.sql:171-196](file://supabase/schemas/05_acervo_unificado_view.sql#L171-L196)

### Timeline/Movimentations System
The timeline unification service:
- Retrieves all instances of a process by CNJ
- Fetches timeline JSONB from each instance
- Builds enriched items with source degree, TRT, and instance ID
- Applies deduplication using a hash built from event attributes
- Returns a unified timeline ordered chronologically

```mermaid
sequenceDiagram
participant Client as "Client"
participant Service as "Timeline Service"
participant DB as "Database"
Client->>Service : "obterTimelineUnificada(CNJ)"
Service->>DB : "buscarInstanciasProcesso(CNJ)"
DB-->>Service : "Instâncias"
loop For each instância
Service->>DB : "ler timeline_jsonb"
DB-->>Service : "Timeline JSONB"
Service->>Service : "enriquecer e deduplicar"
end
Service-->>Client : "Timeline Unificada"
```

**Diagram sources**
- [timeline-unificada.ts](file://src/app/(authenticated)/acervo/timeline-unificada.ts#L169-L178)
- [timeline-unificada.ts](file://src/app/(authenticated)/acervo/timeline-unificada.ts#L180-L195)

**Section sources**
- [timeline-unificada.ts](file://src/app/(authenticated)/acervo/timeline-unificada.ts#L1-L195)

### ProcessoPartes Relationship
The processo_partes table establishes N:N relationships between processes and parties:
- Polymorphic foreign keys for clients, adverse parties, and third parties
- PJE identifiers and participation type mapping
- Polo (party side) and order within the side
- Constraints to prevent duplicates per process-degree combination
- Indexes for performance and RLS policies

```mermaid
erDiagram
ACERVO {
bigint id PK
bigint id_pje
text numero_processo
text trt
text grau
}
PROCESSO_PARTES {
bigint id PK
bigint processo_id FK
text tipo_entidade
bigint entidade_id
bigint id_pje
bigint id_pessoa_pje
bigint id_tipo_parte
text tipo_parte
text polo
text trt
text grau
text numero_processo
boolean principal
integer ordem
}
ACERVO ||--o{ PROCESSO_PARTES : "has"
```

**Diagram sources**
- [17_processo_partes.sql:6-69](file://supabase/schemas/17_processo_partes.sql#L6-L69)
- [04_acervo.sql:4-32](file://supabase/schemas/04_acervo.sql#L4-L32)

**Section sources**
- [17_processo_partes.sql:6-69](file://supabase/schemas/17_processo_partes.sql#L6-L69)
- [17_processo_partes.sql:98-107](file://supabase/schemas/17_processo_partes.sql#L98-L107)

### Calendar Integration: Audiências and Expedientes
The calendar service converts audiências and expedientes into unified calendar events:
- Audiências: Title, start/end, source, metadata (process ID, CNJ, TRT, degree, status, modalities, venue/virtual link)
- Expedientes: Title, all-day events, metadata (process ID, CNJ, TRT, class, deadline status)
- Unified event IDs and color coding for UI presentation

```mermaid
flowchart TD
A["Audiência Entity"] --> B["Unified Calendar Event"]
C["Expediente Entity"] --> D["Unified Calendar Event"]
B --> E["Calendar UI"]
D --> E
```

**Diagram sources**
- [service.ts](file://src/app/(authenticated)/calendar/service.ts#L88-L127)

**Section sources**
- [service.ts](file://src/app/(authenticated)/calendar/service.ts#L88-L127)
- [expedientes.tsx](file://src/app/(authenticated)/ajuda/content/expedientes.tsx#L146-L207)
- [data.ts](file://src/app/(authenticated)/agenda/mock/data.ts#L294-L352)
- [mock-data.ts](file://src/app/(authenticated)/agenda/components/mock-data.ts#L277-L354)

### Automated Data Capture from PJE-TRT Systems
The capture and synchronization scripts orchestrate:
- Development/test scripts for PJE/TRT data capture (acervo, audiências, partes, pendentes, timeline)
- Synchronization scripts for users, entities, and process-party correlation
- API routes for tribunal configuration and access parameters
- **Enhanced Error Handling**: Structured error types with semantic categorization, conflict detection, and comprehensive logging
- **Distributed Locking**: Prevents concurrent operations on the same resources during capture
- Performance considerations: parallel tasks, rate limiting, and batch processing

```mermaid
flowchart TD
Dev["Development Scripts<br/>scripts/captura/index.ts"] --> API["API Routes<br/>Tribunal Config"]
Sync["Sync Scripts<br/>scripts/sincronizacao/index.ts"] --> DB["PostgreSQL/Supabase"]
API --> DB
Dev --> DB
Dev --> LOCK["Distributed Locks<br/>Prevent Concurrency"]
Dev --> LOGS["Capture Log Service<br/>Structured Logging"]
```

**Diagram sources**
- [index.ts:1-177](file://scripts/captura/index.ts#L1-L177)
- [index.ts:1-234](file://scripts/sincronizacao/index.ts#L1-L234)
- [route.ts:130-171](file://src/app/api/captura/tribunais/route.ts#L130-L171)
- [distributed-lock.ts:25-147](file://src/lib/utils/locks/distributed-lock.ts#L25-L147)
- [capture-log.service.ts](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L65-L234)

**Section sources**
- [index.ts:1-177](file://scripts/captura/index.ts#L1-L177)
- [index.ts:1-234](file://scripts/sincronizacao/index.ts#L1-L234)
- [route.ts:130-171](file://src/app/api/captura/tribunais/route.ts#L130-L171)
- [route.ts:20-62](file://src/app/api/captura/tribunais/[id]/route.ts#L20-L62)
- [design.md:235-250](file://openspec/changes/archive/2025-11-24-captura-partes-pje/design.md#L235-L250)
- [tasks.md:602-615](file://openspec/changes/archive/2025-11-24-captura-partes-pje/tasks.md#L602-L615)

### Audit Trails and Compliance
The audit log system tracks ownership changes and other business events:
- Centralized logs with entity type, entity ID, event type, actor, previous/new responsible, and flexible JSONB payload
- Repository service to fetch logs with user joins for display
- Policies and indices for performance and security

```mermaid
erDiagram
LOGS_ALTERACAO {
bigint id PK
text tipo_entidade
bigint entidade_id
text tipo_evento
bigint usuario_que_executou_id FK
bigint responsavel_anterior_id FK
bigint responsavel_novo_id FK
jsonb dados_evento
timestamptz created_at
}
```

**Diagram sources**
- [14_logs_alteracao.sql:6-16](file://supabase/schemas/14_logs_alteracao.sql#L6-L16)
- [audit-log.service.ts:1-50](file://src/lib/domain/audit/services/audit-log.service.ts#L1-L50)

**Section sources**
- [14_logs_alteracao.sql:6-16](file://supabase/schemas/14_logs_alteracao.sql#L6-L16)
- [audit-log.service.ts:1-50](file://src/lib/domain/audit/services/audit-log.service.ts#L1-L50)
- [spec.md:1-28](file://openspec/specs/audit-atividades/spec.md#L1-L28)

## Enhanced Dialog Patterns

### Standardized Dialog Architecture
The system now features enhanced dialog components across legal process management modules with improved accessibility and semantic HTML structure:

```mermaid
classDiagram
class DialogShell {
+boolean open
+function onOpenChange
+string className
+boolean showCloseButton
+string dataDensity
+render()
}
class ObrigacaoDetalhesDialog {
+ObrigacaoComDetalhes obrigacao
+function onSincronizar
+function onVerLancamento
+editingValor : boolean
+editingVencimento : boolean
+efetivando : boolean
+render()
}
class NovaObrigacaoDialog {
+boolean open
+function onOpenChange
+function onSuccess
+object dadosIniciais
+trt : string
+grau : string
+processoId : string[]
+buscaProcesso : string
+render()
}
class PromoverTransitoriaDialog {
+boolean open
+function onOpenChange
+number transitoriaId
+function onSuccess
+ParteContrariaTransitoria transitoria
+Mode mode
+SugestaoMerge sugestaoSelecionada
+render()
}
class ClienteFormDialog {
+boolean open
+function onOpenChange
+function onSuccess
+Cliente cliente
+string mode
+number currentStep
+object formData
+render()
}
DialogShell <|-- ObrigacaoDetalhesDialog
DialogShell <|-- NovaObrigacaoDialog
DialogShell <|-- PromoverTransitoriaDialog
DialogShell <|-- ClienteFormDialog
```

**Diagram sources**
- [obrigacao-detalhes-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/obrigacao-detalhes-dialog.tsx#L64-L70)
- [nova-obrigacao-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/nova-obrigacao-dialog.tsx#L23-L33)
- [promover-transitoria-dialog.tsx](file://src/app/(authenticated)/partes/components/partes-contrarias/promover-transitoria-dialog.tsx#L49-L54)
- [cliente-form.tsx](file://src/app/(authenticated)/partes/components/clientes/cliente-form.tsx#L55-L61)

### Accessibility and Semantic HTML Improvements
Enhanced dialog components now feature:
- Proper semantic labeling with DialogTitle and DialogDescription components
- Screen reader support with sr-only descriptions for complex dialogs
- Keyboard navigation and focus management
- Accessible form controls with proper labeling
- Semantic section headers using Text variant="overline"
- Proper ARIA attributes for enhanced accessibility

```mermaid
sequenceDiagram
participant User as "User"
participant Dialog as "Dialog Component"
participant Focus as "Focus Manager"
participant ScreenReader as "Screen Reader"
User->>Dialog : "Open Dialog"
Dialog->>Focus : "Set initial focus"
Focus->>Dialog : "Focus trap active"
Dialog->>ScreenReader : "Announce dialog title"
ScreenReader->>User : "Title announced"
User->>Dialog : "Keyboard navigation"
Dialog->>Focus : "Manage focus movement"
Focus->>Dialog : "Maintain focus within dialog"
User->>Dialog : "Close dialog"
Dialog->>Focus : "Restore focus to trigger"
Dialog->>ScreenReader : "Announce close"
```

**Diagram sources**
- [obrigacao-detalhes-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/obrigacao-detalhes-dialog.tsx#L360-L390)
- [nova-obrigacao-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/nova-obrigacao-dialog.tsx#L97-L106)
- [promover-transitoria-dialog.tsx](file://src/app/(authenticated)/partes/components/partes-contrarias/promover-transitoria-dialog.tsx#L234-L243)
- [cliente-form.tsx](file://src/app/(authenticated)/partes/components/clientes/cliente-form.tsx#L43-L48)

### Inline Editing Patterns
The obrigacoes module implements sophisticated inline editing patterns:
- Value editing with draft state management
- Date editing with proper date formatting
- Status management with visual indicators
- Real-time validation and feedback
- Undo/redo capabilities through draft state

```mermaid
stateDiagram-v2
[*] --> Idle
Idle --> EditingValor : Start edit
EditingValor --> SavingValor : Save
SavingValor --> Idle : Success
SavingValor --> EditingValor : Error
Idle --> EditingVencimento : Start edit
EditingVencimento --> SavingVencimento : Save
SavingVencimento --> Idle : Success
SavingVencimento --> EditingVencimento : Error
Idle --> Efetivando : Mark received
Efetivando --> SavingEfetivacao : Confirm
SavingEfetivacao --> Idle : Success
SavingEfetivacao --> Efetivando : Error
```

**Diagram sources**
- [obrigacao-detalhes-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/obrigacao-detalhes-dialog.tsx#L204-L224)

### Dialog Density and Spacing Patterns
Standardized dialog density and spacing patterns ensure consistent user experience:
- Comfortable density for complex forms
- Appropriate spacing for different content types
- Responsive design patterns
- Scrollable content areas with proper overflow handling
- Consistent header/footer layouts

**Section sources**
- [obrigacao-detalhes-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/obrigacao-detalhes-dialog.tsx#L360-L390)
- [nova-obrigacao-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/nova-obrigacao-dialog.tsx#L97-L106)
- [promover-transitoria-dialog.tsx](file://src/app/(authenticated)/partes/components/partes-contrarias/promover-transitoria-dialog.tsx#L234-L243)
- [cliente-form.tsx](file://src/app/(authenticated)/partes/components/clientes/cliente-form.tsx#L43-L48)

## Enhanced Error Handling System

### Structured Error Types
The system now uses structured error types with semantic categorization for better error handling and user experience:

```mermaid
classDiagram
class CapturaPartesError {
<<base>>
+string code
+string message
+Record~string, unknown~ context
+toJSON()
}
class ValidationError {
+string code = "VALIDATION_ERROR"
}
class PersistenceError {
+string code = "PERSISTENCE_ERROR"
+operation : "insert" | "update" | "delete" | "upsert"
+entity : string
}
class PJEAPIError {
+string code = "PJE_API_ERROR"
+statusCode? : number
}
class LockError {
+string code = "LOCK_ERROR"
+lockKey : string
}
class TimeoutError {
+string code = "TIMEOUT_ERROR"
+timeoutMs : number
}
class ConfigurationError {
+string code = "CONFIGURATION_ERROR"
}
CapturaPartesError <|-- ValidationError
CapturaPartesError <|-- PersistenceError
CapturaPartesError <|-- PJEAPIError
CapturaPartesError <|-- LockError
CapturaPartesError <|-- TimeoutError
CapturaPartesError <|-- ConfigurationError
```

**Diagram sources**
- [errors.ts](file://src/app/(authenticated)/captura/services/partes/errors.ts#L9-L109)

### Conflict Detection and Distributed Locking
The system implements distributed locking to prevent concurrent operations on the same resources:

```mermaid
sequenceDiagram
participant Client as "Client Request"
participant Lock as "DistributedLock"
participant DB as "Database"
participant Service as "Capture Service"
Client->>Lock : "withDistributedLock(key, fn)"
Lock->>DB : "tryAcquire()"
DB-->>Lock : "Lock acquired or failed"
alt Lock acquired
Lock->>Service : "execute fn()"
Service->>DB : "perform operation"
Service->>Lock : "release()"
Lock->>DB : "delete lock record"
DB-->>Service : "success"
Service-->>Client : "result"
else Lock failed
Lock->>Client : "throw LockError"
end
```

**Diagram sources**
- [distributed-lock.ts:133-147](file://src/lib/utils/locks/distributed-lock.ts#L133-L147)

### Comprehensive Logging System
The capture log service provides structured logging for all operations with conflict detection:

```mermaid
classDiagram
class CaptureLogService {
-LogEntry[] logs
+logNaoAtualizado()
+logAtualizado()
+logInserido()
+logConflito()
+logErro()
+getLogs()
+consumirLogs()
+getEstatisticas()
+limpar()
+imprimirResumo()
}
class LogEntry {
<<interface>>
+tipo : string
}
class LogRegistroNaoAtualizado {
+tipo : "nao_atualizado"
+entidade : string
+id_pje : number
+trt : string
+grau : string
+numero_processo : string
+motivo : "registro_identico"
}
class LogRegistroConflito {
+tipo : "conflito"
+entidade : string
+id_pje : number
+trt : string
+grau : string
+numero_processo : string
+motivo : "occ_stale_updated_at"
}
class LogErro {
+tipo : "erro"
+entidade : string
+erro : string
+contexto? : Record~string, unknown~
}
CaptureLogService --> LogEntry
LogEntry <|-- LogRegistroNaoAtualizado
LogEntry <|-- LogRegistroConflito
LogEntry <|-- LogErro
```

**Diagram sources**
- [capture-log.service.ts](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L65-L234)

### Server Action Error Handling
The system includes automatic error handling for server action version mismatches:

```mermaid
flowchart TD
A["Server Action Error"] --> B{"isServerActionVersionMismatch?"}
B --> |Yes| C["Show toast notification"]
C --> D{"autoReload?"}
D --> |Yes| E["setTimeout reload"]
D --> |No| F["Show reload button"]
B --> |No| G["Return false"]
E --> H["Return handled"]
F --> H
G --> I["Throw error"]
```

**Diagram sources**
- [server-action-error-handler.ts:21-53](file://src/lib/server-action-error-handler.ts#L21-L53)

**Section sources**
- [capture-log.service.ts](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L65-L234)
- [errors.ts](file://src/app/(authenticated)/captura/services/partes/errors.ts#L9-L109)
- [distributed-lock.ts:25-147](file://src/lib/utils/locks/distributed-lock.ts#L25-L147)
- [server-action-error-handler.ts:21-53](file://src/lib/server-action-error-handler.ts#L21-L53)
- [errors.ts:190-251](file://src/shared/partes/errors.ts#L190-L251)
- [partes-form-actions.ts](file://src/app/(authenticated)/partes/actions/partes-form-actions.ts#L57-L75)

## Dependency Analysis
Key dependencies and relationships:
- ProcessoUnificado depends on acervo instances and window functions to determine the current degree.
- TimelineUnificada depends on acervo timeline JSONB fields and deduplication logic.
- ProcessoPartes depends on acervo and supports polymorphic party relationships.
- Calendar service depends on audiências and expedientes entities.
- Audit logs depend on users and are indexed for fast retrieval.
- **Enhanced Dialog Components**: Dialog shell components provide standardized patterns across obrigacoes and partes modules.
- **Enhanced Error Handling**: Capture log service depends on structured error types and distributed locks.
- **Distributed Locking**: Used by capture services to prevent concurrent operations.
- **Server Action Error Handling**: Provides automatic recovery from version mismatch errors.

```mermaid
graph LR
A["Acervo"] --> B["ProcessoUnificado MV"]
A --> C["TimelineUnificada"]
A --> D["ProcessoPartes"]
E["Audiências"] --> F["Calendar Service"]
G["Expedientes"] --> F
H["Logs Alteração"] --> I["Audit Log Service"]
J["Capture Log Service"] --> K["Structured Errors"]
L["Distributed Locks"] --> J
M["Server Action Handler"] --> N["Version Mismatch Detection"]
O["Dialog Shell Components"] --> P["Obrigacoes Dialogs"]
O --> Q["Partes Dialogs"]
```

**Diagram sources**
- [05_acervo_unificado_view.sql:44-151](file://supabase/schemas/05_acervo_unificado_view.sql#L44-L151)
- [timeline-unificada.ts](file://src/app/(authenticated)/acervo/timeline-unificada.ts#L169-L178)
- [17_processo_partes.sql:6-69](file://supabase/schemas/17_processo_partes.sql#L6-L69)
- [service.ts](file://src/app/(authenticated)/calendar/service.ts#L88-L127)
- [audit-log.service.ts:1-50](file://src/lib/domain/audit/services/audit-log.service.ts#L1-L50)
- [capture-log.service.ts](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L65-L234)
- [errors.ts](file://src/app/(authenticated)/captura/services/partes/errors.ts#L9-L109)
- [distributed-lock.ts:25-147](file://src/lib/utils/locks/distributed-lock.ts#L25-L147)
- [server-action-error-handler.ts:21-53](file://src/lib/server-action-error-handler.ts#L21-L53)
- [dialog.tsx](file://src/components/ui/dialog.tsx)

**Section sources**
- [05_acervo_unificado_view.sql:44-151](file://supabase/schemas/05_acervo_unificado_view.sql#L44-L151)
- [timeline-unificada.ts](file://src/app/(authenticated)/acervo/timeline-unificada.ts#L169-L178)
- [17_processo_partes.sql:6-69](file://supabase/schemas/17_processo_partes.sql#L6-L69)
- [service.ts](file://src/app/(authenticated)/calendar/service.ts#L88-L127)
- [audit-log.service.ts:1-50](file://src/lib/domain/audit/services/audit-log.service.ts#L1-L50)
- [capture-log.service.ts](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L65-L234)
- [errors.ts](file://src/app/(authenticated)/captura/services/partes/errors.ts#L9-L109)
- [distributed-lock.ts:25-147](file://src/lib/utils/locks/distributed-lock.ts#L25-L147)
- [server-action-error-handler.ts:21-53](file://src/lib/server-action-error-handler.ts#L21-L53)
- [dialog.tsx](file://src/components/ui/dialog.tsx)

## Performance Considerations
- Materialized view refresh: Prefer concurrent refresh when possible; fall back to normal refresh if needed.
- Index coverage: Unique index on materialized view enables concurrent refresh; additional indexes support filtering and joins.
- Column selection: Use basic/full/unified column sets to minimize I/O during listing and detail operations.
- Parallelization: Capture and sync scripts leverage parallel tasks to improve throughput.
- Rate limiting: Apply delays between document captures and handle rate limits gracefully.
- Disk I/O optimization: Use column selection helpers and avoid unnecessary JSONB parsing.
- **Enhanced Dialog Components**: Standardized dialog patterns reduce rendering overhead and improve user experience.
- **Enhanced Error Handling**: Structured logging minimizes performance impact while providing comprehensive debugging information.
- **Distributed Locking**: Prevents wasted CPU cycles from concurrent operations on the same resources.
- **Server Action Error Handling**: Automatic recovery reduces user frustration and improves system reliability.

## Troubleshooting Guide
Common issues and resolutions:
- SERVICE_API_KEY not configured: Set the service API key in environment variables for development scripts.
- Authentication failure: Verify PJE credentials in the credentials table and ensure proper service role keys.
- Timeout errors: Increase timeouts or retry with backoff; verify network connectivity and Redis/Supabase availability.
- Duplicate key violations: Use upsert semantics or deduplicate before insertion; verify constraints and foreign keys.
- Foreign key constraint violations: Ensure referenced entities exist before linking; run dependency synchronization first.
- Materialized view refresh failures: Ensure unique index exists; use concurrent refresh when possible.
- **Enhanced Dialog Components**: Use proper dialog patterns and accessibility features for better user experience.
- **Capture Conflicts**: Use distributed locks to prevent concurrent operations on the same resources.
- **Structured Errors**: Leverage semantic error codes for precise error handling and user feedback.
- **Version Mismatch**: Server action handler automatically detects and recovers from deployment version conflicts.

**Section sources**
- [index.ts:142-153](file://scripts/captura/index.ts#L142-L153)
- [index.ts:208-221](file://scripts/sincronizacao/index.ts#L208-L221)
- [route.ts:135-148](file://src/app/api/captura/tribunais/route.ts#L135-L148)
- [distributed-lock.ts:133-147](file://src/lib/utils/locks/distributed-lock.ts#L133-L147)
- [server-action-error-handler.ts:21-53](file://src/lib/server-action-error-handler.ts#L21-L53)

## Conclusion
The Legal Process Management System provides a robust foundation for unified legal case tracking across multiple instances and degrees. Its domain models, materialized view, timeline unification, and calendar integration deliver a comprehensive solution for managing legal processes, audiências, and expedientes. The enhanced dialog components across obrigacoes and partes modules significantly improve accessibility and user experience with standardized patterns, semantic HTML structure, and proper focus management. The enhanced error handling system with conflict detection, structured error types, distributed locking, and comprehensive logging ensures reliable operation under concurrent loads. The improved visual hierarchy and professional UI standards in the design system provide an excellent user experience. Together, these features ensure data integrity, compliance, operational efficiency, and a superior user experience within the Brazilian legal system.

## Appendices

### Practical Examples

- Creating a Processo manually (without PJE data):
  - Use the manual creation schema to supply CNJ, TRT, degree, parties, and optional fields.
  - Defaults are applied for origin, secret justice, digital court, associations, and priorities.

- Updating a Processo:
  - Use the update schema to partially modify fields while preserving others.
  - Ensure CNJ format validation passes.

- Filtering and Listing:
  - Apply filters by origin, TRT, degree, CNJ, class, status, parties, and date ranges.
  - Choose unified view for aggregated multi-instance display.

- Timeline Unification:
  - Call the timeline unification service with a CNJ to receive a deduplicated chronological timeline across instances.

- Calendar Integration:
  - Convert audiências and expedientes into unified calendar events with metadata for scheduling and reminders.

- Audit Trail:
  - Retrieve activity logs for any entity to track ownership changes and other events.

- **Enhanced Dialog Components**:
  - Use standardized dialog patterns with proper accessibility features and semantic HTML structure.
  - Implement inline editing patterns for real-time data modification.
  - Apply consistent dialog density and spacing for optimal user experience.

- **Enhanced Error Handling**:
  - Use structured error types with semantic codes for precise error handling.
  - Implement distributed locks to prevent concurrent operations on the same resources.
  - Leverage comprehensive logging for debugging and monitoring.
  - Utilize server action error handler for automatic version mismatch recovery.

**Section sources**
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L360-L393)
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L289-L345)
- [domain.ts](file://src/app/(authenticated)/processos/domain.ts#L404-L460)
- [timeline-unificada.ts](file://src/app/(authenticated)/acervo/timeline-unificada.ts#L169-L178)
- [service.ts](file://src/app/(authenticated)/calendar/service.ts#L88-L127)
- [audit-log.service.ts:28-47](file://src/lib/domain/audit/services/audit-log.service.ts#L28-L47)
- [capture-log.service.ts](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L65-L234)
- [errors.ts](file://src/app/(authenticated)/captura/services/partes/errors.ts#L9-L109)
- [distributed-lock.ts:25-147](file://src/lib/utils/locks/distributed-lock.ts#L25-L147)
- [server-action-error-handler.ts:21-53](file://src/lib/server-action-error-handler.ts#L21-L53)
- [obrigacao-detalhes-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/obrigacao-detalhes-dialog.tsx#L360-L390)
- [nova-obrigacao-dialog.tsx](file://src/app/(authenticated)/obrigacoes/components/dialogs/nova-obrigacao-dialog.tsx#L97-L106)
- [promover-transitoria-dialog.tsx](file://src/app/(authenticated)/partes/components/partes-contrarias/promover-transitoria-dialog.tsx#L234-L243)
- [cliente-form.tsx](file://src/app/(authenticated)/partes/components/clientes/cliente-form.tsx#L43-L48)