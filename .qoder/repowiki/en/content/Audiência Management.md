# Audiência Management

<cite>
**Referenced Files in This Document**
- [07_audiencias.sql](file://supabase/schemas/07_audiencias.sql)
- [01_enums.sql](file://supabase/schemas/01_enums.sql)
- [20260427130000_add_ultima_captura_id_to_audiencias_com_origem.sql](file://supabase/migrations/20260427130000_add_ultima_captura_id_to_audiencias_com_origem.sql)
- [audiencias-actions.ts](file://src/app/(authenticated)/audiencias/actions/audiencias-actions.ts)
- [audiencias-client.tsx](file://src/app/(authenticated)/audiencias/audiencias-client.tsx)
- [audiencia-form.tsx](file://src/app/(authenticated)/audiencias/components/audiencia-form.tsx)
- [audiencia-detail-dialog.tsx](file://src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx)
- [nova-audiencia-dialog.tsx](file://src/app/(authenticated)/audiencias/components/nova-audiencia-dialog.tsx)
- [editar-audiencia-dialog.tsx](file://src/app/(authenticated)/audiencias/components/editar-audiencia-dialog.tsx)
- [audiencias-dia-dialog.tsx](file://src/app/(authenticated)/audiencias/components/audiencias-dia-dialog.tsx)
- [audiencia-detail-dialog.tsx](file://src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx)
- [audiencias-ultima-captura-card.tsx](file://src/app/(authenticated)/audiencias/components/audiencias-ultima-captura-card.tsx)
- [mission-kpi-strip.tsx](file://src/app/(authenticated)/audiencias/components/mission-kpi-strip.tsx)
- [audiencias-semana-view.tsx](file://src/app/(authenticated)/audiencias/components/views/audiencias-semana-view.tsx)
- [audiencias-missao-content.tsx](file://src/app/(authenticated)/audiencias/components/views/audiencias-missao-content.tsx)
- [audiencias-glass-list.tsx](file://src/app/(authenticated)/audiencias/components/audiencias-glass-list.tsx)
- [audiencias-filter-bar.tsx](file://src/app/(authenticated)/audiencias/components/audiencias-filter-bar.tsx)
- [audiencias-list-filters.tsx](file://src/app/(authenticated)/audiencias/components/audiencias-list-filters.tsx)
- [audiencias-toolbar-filters.tsx](file://src/app/(authenticated)/audiencias/components/audiencias-toolbar-filters.tsx)
- [domain.ts](file://src/app/(authenticated)/audiencias/domain.ts)
- [service.ts](file://src/app/(authenticated)/audiencias/service.ts)
- [repository.ts](file://src/app/(authenticated)/audiencias/repository.ts)
- [audiencias-persistence.service.ts](file://src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts)
- [comparison.util.ts](file://src/app/(authenticated)/captura/services/persistence/comparison.util.ts)
- [capture-log.service.ts](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts)
- [distributed-lock.ts](file://src/lib/utils/locks/distributed-lock.ts)
- [semantic-badge.tsx](file://src/components/ui/semantic-badge.tsx)
- [trt-driver.ts](file://src/app/(authenticated)/captura/drivers/pje/trt-driver.ts)
- [briefing-helpers.ts](file://src/app/(authenticated)/calendar/briefing-helpers.ts)
- [data.ts](file://src/app/(authenticated)/agenda/mock/data.ts)
- [typography.tsx](file://src/components/ui/typography.tsx)
- [globals.css](file://src/app/globals.css)
- [audiencias.md](file://design-system/zattaros/pages/audiencias.md)
- [tabs.tsx](file://src/components/ui/tabs.tsx)
- [week-navigator.tsx](file://src/components/shared/week-navigator.tsx)
- [week-days-carousel.tsx](file://src/components/shared/week-days-carousel.tsx)
- [year-calendar-grid.tsx](file://src/components/shared/year-calendar-grid.tsx)
- [tokens.ts](file://src/lib/design-system/tokens.ts)
- [logs.txt](file://scripts/results/api-audiencias/logs.txt)
- [dialog.tsx](file://src/components/ui/dialog.tsx)
- [dialog-section.tsx](file://src/components/shared/dialog-shell/dialog-section.tsx)
- [dialog-form-shell.test.tsx](file://src/components/shared/__tests__/dialog-form-shell.test.tsx)
- [typography-fix.md](file://src/app/(authenticated)/audiencias/specs/typography-fix.md)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive documentation for Optimistic Concurrency Control (OCC) implementation in audiência persistence service
- Updated database infrastructure section to include OCC conflict detection and anchor updates
- Enhanced troubleshooting guide with OCC-specific error handling and conflict resolution
- Added new section on batch querying and conflict detection mechanisms
- Updated performance considerations to include OCC optimization strategies
- Expanded architecture overview to include OCC conflict detection and resolution flow

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Optimistic Concurrency Control Implementation](#optimistic-concurrency-control-implementation)
6. [Detailed Component Analysis](#detailed-component-analysis)
7. [Enhanced Dialog Components](#enhanced-dialog-components)
8. [Enhanced Typography System](#enhanced-typography-system)
9. [Mission Control Interface Patterns](#mission-control-interface-patterns)
10. [Enhanced Filtering System](#enhanced-filtering-system)
11. [Enhanced Day Picker Interfaces](#enhanced-day-picker-interfaces)
12. [Database Infrastructure Improvements](#database-infrastructure-improvements)
13. [Dependency Analysis](#dependency-analysis)
14. [Performance Considerations](#performance-considerations)
15. [Troubleshooting Guide](#troubleshooting-guide)
16. [Conclusion](#conclusion)

## Introduction

The Audiência Management system is a comprehensive court hearing scheduling platform designed to streamline legal process management within the judicial system. This system provides automated scheduling capabilities, real-time calendar integration, intelligent reminder systems, and seamless synchronization with PJE-TRT (Tribunal Regional do Trabalho) systems.

The platform manages the complete lifecycle of court hearings, from initial scheduling through completion, while maintaining strict legal compliance requirements. It integrates advanced features including automated audiência data capture, intelligent resource allocation, sophisticated participant management systems, and robust optimistic concurrency control (OCC) mechanisms to prevent data corruption during concurrent operations.

**Updated** The system has been enhanced with comprehensive optimistic concurrency control (OCC) mechanisms in the audiência persistence service, implementing batch querying, conflict detection, and anchor updates to ensure data integrity during concurrent audiência operations. The production implementation continues to use the proven components: audiências-glass-list.tsx, audiencias-missao-content.tsx, audiencias-semana-view.tsx, with enhanced OCC conflict resolution capabilities.

## Project Structure

The Audiência Management system follows a modular Next.js architecture with clear separation of concerns across multiple layers. The system now includes comprehensive OCC implementation in the persistence layer:

```mermaid
graph TB
subgraph "Production Frontend Layer"
UI[User Interface Components]
Forms[Audiência Forms]
Dialogs[Detail Dialogs]
Calendar[Calendar Integration]
KPI[KPI Components]
Views[Production View Components]
FilterBar[AudienciasFilterBar]
ListFilters[AudienciasListFilters]
ToolbarFilters[AudienciasToolbarFilters]
CaptureCard[AudienciasUltimaCapturaCard]
CountBadge[CountBadge Component]
BadgeSystems[Enhanced Badge Systems]
TypographySystem[Typography System]
VirtualRoomDetection[Virtual Room Detection]
ObservationSystem[Observation System]
Tabs[Enhanced Tabs Component]
WeekNavigator[Week Navigator]
DayPicker[Day Picker Interfaces]
DialogComponents[Enhanced Dialog Components]
DialogHeaders[DialogHeader Components]
DialogFooters[DialogFooter Components]
DialogDescriptions[DialogDescription Components]
end
subgraph "Application Layer"
Actions[Server Actions]
Services[Business Logic]
Domain[Domain Models]
end
subgraph "Data Layer"
Repository[Data Access]
Persistence[Persistence Services with OCC]
Database[(PostgreSQL Database)]
PJE[PJE-TRT Integration]
View[audiencias_com_origem View]
Comparison[Comparison Utilities]
CaptureLog[Capture Log Service]
end
subgraph "External Systems"
GoogleCalendar[Google Calendar]
Outlook[Outlook Calendar]
PJE_API[PJE-TRT APIs]
CaptureSystem[Capture System]
DistributedLock[Distributed Lock Service]
end
UI --> Actions
Forms --> Actions
Dialogs --> Actions
Calendar --> Actions
KPI --> Actions
Views --> Actions
FilterBar --> Actions
ListFilters --> Actions
ToolbarFilters --> Actions
CaptureCard --> Actions
CountBadge --> Actions
BadgeSystems --> Actions
TypographySystem --> Actions
VirtualRoomDetection --> Actions
ObservationSystem --> Actions
Tabs --> Actions
WeekNavigator --> Actions
DayPicker --> Actions
DialogComponents --> Actions
DialogHeaders --> Actions
DialogFooters --> Actions
DialogDescriptions --> Actions
Actions --> Services
Services --> Repository
Repository --> Persistence
Persistence --> Comparison
Persistence --> CaptureLog
Persistence --> Database
Database --> PJE
PJE --> PJE_API
CaptureCard --> CaptureSystem
Calendar --> GoogleCalendar
Calendar --> Outlook
Persistence --> DistributedLock
```

**Diagram sources**
- [audiencias-client.tsx:1-431](file://src/app/(authenticated)/audiencias/audiencias-client.tsx#L1-L431)
- [audiencias-actions.ts:1-498](file://src/app/(authenticated)/audiencias/actions/audiencias-actions.ts#L1-L498)
- [service.ts:1-315](file://src/app/(authenticated)/audiencias/service.ts#L1-L315)
- [audiencias-filter-bar.tsx:1-200](file://src/app/(authenticated)/audiencias/components/audiencias-filter-bar.tsx#L1-L200)
- [audiencias-list-filters.tsx:132-160](file://src/app/(authenticated)/audiencias/components/audiencias-list-filters.tsx#L132-L160)
- [audiencias-toolbar-filters.tsx:167-196](file://src/app/(authenticated)/audiencias/components/audiencias-toolbar-filters.tsx#L167-L196)
- [audiencias-ultima-captura-card.tsx:1-168](file://src/app/(authenticated)/audiencias/components/audiencias-ultima-captura-card.tsx#L1-L168)
- [semantic-badge.tsx:200-219](file://src/components/ui/semantic-badge.tsx#L200-L219)
- [typography.tsx:152-204](file://src/components/ui/typography.tsx#L152-L204)
- [audiencias-glass-list.tsx:259-328](file://src/app/(authenticated)/audiencias/components/audiencias-glass-list.tsx#L259-L328)
- [audiencias-semana-view.tsx:396-455](file://src/app/(authenticated)/audiencias/components/views/audiencias-semana-view.tsx#L396-L455)
- [audiencias-missao-content.tsx:317-328](file://src/app/(authenticated)/audiencias/components/views/audiencias-missao-content.tsx#L317-L328)
- [tabs.tsx:27-41](file://src/components/ui/tabs.tsx#L27-L41)
- [week-navigator.tsx:181-221](file://src/components/shared/week-navigator.tsx#L181-L221)
- [week-days-carousel.tsx:180-274](file://src/components/shared/week-days-carousel.tsx#L180-L274)
- [audiencia-detail-dialog.tsx:626-648](file://src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx#L626-L648)
- [nova-audiencia-dialog.tsx:435-455](file://src/app/(authenticated)/audiencias/components/nova-audiencia-dialog.tsx#L435-L455)
- [audiencias-dia-dialog.tsx:260-327](file://src/app/(authenticated)/audiencias/components/audiencias-dia-dialog.tsx#L260-L327)
- [audiencias-persistence.service.ts:514-547](file://src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts#L514-L547)
- [comparison.util.ts:45-71](file://src/app/(authenticated)/captura/services/persistence/comparison.util.ts#L45-71)
- [capture-log.service.ts:50-63](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L50-L63)
- [distributed-lock.ts:25-65](file://src/lib/utils/locks/distributed-lock.ts#L25-L65)

**Section sources**
- [audiencias-client.tsx:1-431](file://src/app/(authenticated)/audiencias/audiencias-client.tsx#L1-L431)
- [audiencias-actions.ts:1-498](file://src/app/(authenticated)/audiencias/actions/audiencias-actions.ts#L1-L498)
- [service.ts:1-315](file://src/app/(authenticated)/audiencias/service.ts#L1-L315)

## Core Components

### Database Schema and Data Model

The system utilizes a comprehensive PostgreSQL schema optimized for legal process management with 159 lines of carefully crafted table definitions and constraints. The schema has been enhanced with new filtering capabilities, improved tracking infrastructure, corrected field mapping, and OCC support through the `updated_at` timestamp field.

The core `audiencias` table implements a sophisticated data model supporting multiple legal jurisdictions, complex participant relationships, comprehensive audit trails, and OCC conflict detection:

```mermaid
erDiagram
AUDIENCIAS {
bigint id PK
bigint id_pje
bigint advogado_id FK
bigint processo_id FK
bigint orgao_julgador_id FK
varchar trt
varchar grau
text numero_processo
timestamptz data_inicio
timestamptz data_fim
time hora_inicio
time hora_fim
varchar modalidade
text sala_audiencia_nome
bigint sala_audiencia_id
varchar status
text status_descricao
bigint tipo_audiencia_id FK
bigint classe_judicial_id FK
boolean designada
boolean em_andamento
boolean documento_ativo
text nome_parte_autora
boolean polo_ativo_representa_varios
text nome_parte_re
boolean polo_passivo_representa_varios
text url_audiencia_virtual
jsonb endereco_presencial
varchar presenca_hibrida
bigint ata_audiencia_id
text url_ata_audiencia
boolean segredo_justica
boolean juizo_digital
bigint responsavel_id FK
text observacoes
jsonb dados_anteriores
bigint ultima_captura_id FK
timestamptz created_at
timestamptz updated_at
}
PROCESSOS {
bigint id PK
text numero_processo
varchar grau
varchar trt
text nome_parte_autora
text nome_parte_re
}
TIPOS_AUDIENCIAS {
bigint id PK
text descricao
boolean is_virtual
}
AUDIENCIAS ||--|| PROCESSOS : "relaciona_com"
AUDIENCIAS ||--o{ TIPOS_AUDIENCIAS : "possui_tipo"
```

**Diagram sources**
- [07_audiencias.sql:4-47](file://supabase/schemas/07_audiencias.sql#L4-L47)
- [20260427130000_add_ultima_captura_id_to_audiencias_com_origem.sql:68](file://supabase/migrations/20260427130000_add_ultima_captura_id_to_audiencias_com_origem.sql#L68)

**Updated** Field mapping has been corrected from polo_ativo_nome/polo_passivo_nome to nome_parte_autora/nome_parte_re to align with the acervo table structure and provide more accurate legal party representation. The `updated_at` field is now used for OCC conflict detection.

### Optimistic Concurrency Control Implementation

**New** The system implements comprehensive optimistic concurrency control (OCC) mechanisms to prevent data corruption during concurrent audiência operations:

```mermaid
sequenceDiagram
participant Client as "Client Browser"
participant Service as "Business Service"
participant Repo as "Repository"
participant Pers as "Persistence Service"
participant Comp as "Comparison Utils"
participant DB as "Database"
Client->>Service : Update Audiência Request
Service->>Repo : Get Existing Record
Repo->>DB : SELECT with updated_at
DB-->>Repo : Return Record + updated_at
Repo-->>Service : Existing Record
Service->>Pers : Compare Objects
Pers->>Comp : Deep Comparison
Comp-->>Pers : Comparison Result
Pers->>DB : UPDATE with updated_at anchor
DB-->>Pers : Rows Affected
alt Conflict Detected
Pers->>DB : No rows affected (conflict)
Pers-->>Service : OCC Conflict
Service-->>Client : Conflict Response
else No Conflict
Pers->>DB : Update successful
DB-->>Pers : Updated Record
Pers-->>Service : Success Response
Service-->>Client : Success Message
end
```

**Diagram sources**
- [audiencias-persistence.service.ts:514-547](file://src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts#L514-L547)
- [comparison.util.ts:45-71](file://src/app/(authenticated)/captura/services/persistence/comparison.util.ts#L45-L71)

### Server Actions and Business Logic

The system implements a robust server action pattern for all audiência operations, ensuring proper authorization, validation, and transaction safety with OCC conflict resolution:

```mermaid
sequenceDiagram
participant Client as "Client Browser"
participant Action as "Server Action"
participant Service as "Business Service"
participant Repo as "Repository"
participant DB as "Database"
Client->>Action : Create Audiência Request
Action->>Action : Authenticate & Authorize
Action->>Action : Parse & Validate FormData
Action->>Service : Call Business Logic
Service->>Repo : Validate Dependencies
Repo->>DB : Check Process Existence
DB-->>Repo : Validation Result
Repo->>DB : Insert Audiência
DB-->>Repo : Created Record
Repo-->>Service : Success Result
Service-->>Action : Success Response
Action-->>Client : Success Message
```

**Diagram sources**
- [audiencias-actions.ts:166-203](file://src/app/(authenticated)/audiencias/actions/audiencias-actions.ts#L166-L203)
- [service.ts:20-62](file://src/app/(authenticated)/audiencias/service.ts#L20-L62)

### Frontend Components and User Interface

The user interface follows a modern glass-morphism design pattern with comprehensive view modes and filtering capabilities, now enhanced with proper design system typography, new capture card functionality, improved count display, enhanced badge systems, specialized day-picker interfaces, and OCC conflict handling:

```mermaid
classDiagram
class AudienciasClient {
+viewMode : string
+search : string
+filters : object
+audiencias : Audiencia[]
+ultimaCaptura : ResumoUltimaCapturaAudiencias
+handleViewChange()
+handleViewDetail()
+handleUltimaCapturaClick()
}
class AudienciaForm {
+initialData : Audiencia
+onSuccess : function
+onClose : function
+handleSubmit()
+validateForm()
}
class AudienciaDetailDialog {
+audiencia : Audiencia
+open : boolean
+editingUrl : boolean
+editingEndereco : boolean
+handleSaveUrl()
+handleSaveEndereco()
}
class NovaAudienciaDialog {
+open : boolean
+onClose : function
+handleSubmit()
+validateForm()
}
class EditarAudienciaDialog {
+open : boolean
+audiencia : Audiencia
+onSuccess : function
+handleSubmit()
+validateForm()
}
class AudienciasDiaDialog {
+open : boolean
+data : Date
+audienciaAtual : Audiencia
+currentIndex : number
+total : number
+handlePrevious()
+handleNext()
}
class AudienciasUltimaCapturaCard {
+resumo : ResumoUltimaCapturaAudiencias
+isLoading : boolean
+onClick : function
+render()
}
class AudienciasFilterBar {
+filters : AudienciasFilters
+onChange : function
+usuarios : Usuario[]
+tiposAudiencia : TipoAudiencia[]
+counts : object
+render()
}
class CountBadge {
+children : ReactNode
+className : string
+size : 'xs' | 'sm' | 'md'
+render()
}
class MissionKpiStrip {
+audiencias : Audiencia[]
+className : string
+stats : object
}
class AudienciasSemanaView {
+audiencias : Audiencia[]
+currentDate : Date
+onDateChange : function
+onViewDetail : function
+selectedDay : string
}
class AudienciasGlassList {
+audiencias : Audiencia[]
+isLoading : boolean
+onView : function
+usuarios : Usuario[]
+render()
}
class TypographySystem {
+Heading : component
+Text : component
+variants : object
+classes : object
}
class BadgeSystems {
+SemanticBadge : component
+CountBadge : component
+caseFlags : array
+statusBadges : array
}
class Tabs {
+variant : "default" | "line" | "week"
+TabsList : component
+TabsTrigger : component
+TabsContent : component
}
class WeekNavigator {
+weekDays : WeekDay[]
+selectedDate : Date
+onDateSelect : function
+onPreviousWeek : function
+onNextWeek : function
+onToday : function
}
class WeekDaysCarousel {
+variant : "default" | "compact" | "minimal"
+daysInfo : DayInfo[]
+onDateSelect : function
+renderBadge : function
}
class Domain {
+StatusAudiencia : enum
+ModalidadeAudiencia : enum
+Audiencia : interface
+createAudienciaSchema : object
+updateAudienciaSchema : object
+GrauTribunal : enum
+TipoAudiencia : interface
}
AudienciasClient --> AudienciaForm : "opens"
AudienciasClient --> AudienciaDetailDialog : "opens"
AudienciasClient --> NovaAudienciaDialog : "opens"
AudienciasClient --> EditarAudienciaDialog : "opens"
AudienciasClient --> AudienciasDiaDialog : "opens"
AudienciasClient --> AudienciasUltimaCapturaCard : "renders"
AudienciasClient --> AudienciasFilterBar : "renders"
AudienciasClient --> CountBadge : "uses"
AudienciasClient --> MissionKpiStrip : "renders"
AudienciasClient --> AudienciasSemanaView : "renders"
AudienciasClient --> AudienciasGlassList : "renders"
AudienciasClient --> Tabs : "uses"
AudienciasClient --> WeekNavigator : "uses"
AudienciasClient --> WeekDaysCarousel : "uses"
AudienciaForm --> Domain : "uses"
AudienciaDetailDialog --> Domain : "uses"
NovaAudienciaDialog --> Domain : "uses"
EditarAudienciaDialog --> Domain : "uses"
AudienciasDiaDialog --> Domain : "uses"
AudienciasFilterBar --> CountBadge : "uses"
AudienciasGlassList --> TypographySystem : "uses"
AudienciasGlassList --> BadgeSystems : "uses"
AudienciasSemanaView --> TypographySystem : "uses"
AudienciasSemanaView --> BadgeSystems : "uses"
AudienciasMissaoContent --> TypographySystem : "uses"
AudienciasMissaoContent --> BadgeSystems : "uses"
Tabs --> TypographySystem : "uses"
WeekNavigator --> TypographySystem : "uses"
WeekDaysCarousel --> TypographySystem : "uses"
```

**Diagram sources**
- [audiencias-client.tsx:93-431](file://src/app/(authenticated)/audiencias/audiencias-client.tsx#L93-L431)
- [audiencia-form.tsx:91-495](file://src/app/(authenticated)/audiencias/components/audiencia-form.tsx#L91-L495)
- [audiencia-detail-dialog.tsx:114-800](file://src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx#L114-L800)
- [nova-audiencia-dialog.tsx:91-495](file://src/app/(authenticated)/audiencias/components/nova-audiencia-dialog.tsx#L91-L495)
- [editar-audiencia-dialog.tsx:91-495](file://src/app/(authenticated)/audiencias/components/editar-audiencia-dialog.tsx#L91-L495)
- [audiencias-dia-dialog.tsx:91-495](file://src/app/(authenticated)/audiencias/components/audiencias-dia-dialog.tsx#L91-L495)
- [audiencias-ultima-captura-card.tsx:75-168](file://src/app/(authenticated)/audiencias/components/audiencias-ultima-captura-card.tsx#L75-L168)
- [audiencias-filter-bar.tsx:112-137](file://src/app/(authenticated)/audiencias/components/audiencias-filter-bar.tsx#L112-L137)
- [semantic-badge.tsx:200-219](file://src/components/ui/semantic-badge.tsx#L200-L219)
- [mission-kpi-strip.tsx:54-253](file://src/app/(authenticated)/audiencias/components/mission-kpi-strip.tsx#L54-L253)
- [audiencias-semana-view.tsx:154-430](file://src/app/(authenticated)/audiencias/components/views/audiencias-semana-view.tsx#L154-L430)
- [audiencias-glass-list.tsx:259-328](file://src/app/(authenticated)/audiencias/components/audiencias-glass-list.tsx#L259-L328)
- [audiencias-missao-content.tsx:317-328](file://src/app/(authenticated)/audiencias/components/views/audiencias-missao-content.tsx#L317-L328)
- [domain.ts:28-32](file://src/app/(authenticated)/audiencias/domain.ts#L28-L32)
- [tabs.tsx:27-41](file://src/components/ui/tabs.tsx#L27-L41)
- [week-navigator.tsx:181-221](file://src/components/shared/week-navigator.tsx#L181-L221)
- [week-days-carousel.tsx:180-274](file://src/components/shared/week-days-carousel.tsx#L180-L274)

**Section sources**
- [07_audiencias.sql:1-159](file://supabase/schemas/07_audiencias.sql#L1-L159)
- [01_enums.sql:19-25](file://supabase/schemas/01_enums.sql#L19-L25)
- [20260427130000_add_ultima_captura_id_to_audiencias_com_origem.sql:1-90](file://supabase/migrations/20260427130000_add_ultima_captura_id_to_audiencias_com_origem.sql#L1-L90)
- [audiencias-actions.ts:1-498](file://src/app/(authenticated)/audiencias/actions/audiencias-actions.ts#L1-L498)
- [audiencia-form.tsx:1-495](file://src/app/(authenticated)/audiencias/components/audiencia-form.tsx#L1-L495)
- [audiencia-detail-dialog.tsx:1-800](file://src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx#L1-L800)
- [nova-audiencia-dialog.tsx:1-495](file://src/app/(authenticated)/audiencias/components/nova-audiencia-dialog.tsx#L1-L495)
- [editar-audiencia-dialog.tsx:1-873](file://src/app/(authenticated)/audiencias/components/editar-audiencia-dialog.tsx#L1-L873)
- [audiencias-dia-dialog.tsx:1-327](file://src/app/(authenticated)/audiencias/components/audiencias-dia-dialog.tsx#L1-L327)
- [audiencias-ultima-captura-card.tsx:1-168](file://src/app/(authenticated)/audiencias/components/audiencias-ultima-captura-card.tsx#L1-L168)
- [audiencias-filter-bar.tsx:1-200](file://src/app/(authenticated)/audiencias/components/audiencias-filter-bar.tsx#L1-L200)
- [semantic-badge.tsx:1-220](file://src/components/ui/semantic-badge.tsx#L1-L220)
- [mission-kpi-strip.tsx:1-254](file://src/app/(authenticated)/audiencias/components/mission-kpi-strip.tsx#L1-L254)
- [audiencias-semana-view.tsx:1-671](file://src/app/(authenticated)/audiencias/components/views/audiencias-semana-view.tsx#L1-L671)
- [audiencias-glass-list.tsx:1-505](file://src/app/(authenticated)/audiencias/components/audiencias-glass-list.tsx#L1-L505)
- [audiencias-missao-content.tsx:1-364](file://src/app/(authenticated)/audiencias/components/views/audiencias-missao-content.tsx#L1-L364)
- [domain.ts:1-712](file://src/app/(authenticated)/audiencias/domain.ts#L1-L712)
- [tabs.tsx:1-92](file://src/components/ui/tabs.tsx#L1-L92)
- [week-navigator.tsx:1-353](file://src/components/shared/week-navigator.tsx#L1-L353)
- [week-days-carousel.tsx:1-901](file://src/components/shared/week-days-carousel.tsx#L1-L901)

## Architecture Overview

The Audiência Management system implements a layered architecture with clear separation between presentation, business logic, and data access layers. The system now includes comprehensive OCC implementation in the persistence layer:

```mermaid
graph TD
subgraph "Production Presentation Layer"
A1[Next.js App Router]
A2[Client Components]
A3[Server Actions]
A4[Enhanced Typography System]
A5[AudienciasUltimaCapturaCard]
A6[AudienciasFilterBar]
A7[CountBadge Component]
A8[Enhanced Badge Systems]
A9[Virtual Room Detection]
A10[Observation System]
A11[Enhanced Tabs Component]
A12[Week Navigator]
A13[Day Picker Interfaces]
A14[Enhanced Dialog Components]
A15[DialogHeader Components]
A16[DialogFooter Components]
A17[DialogDescription Components]
end
subgraph "Business Logic Layer"
B1[Service Layer]
B2[Validation Layer]
B3[Authorization Layer]
end
subgraph "Data Access Layer"
C1[Repository Pattern]
C2[Database Queries]
C3[External Integrations]
C4[audiencias_com_origem View]
C5[Persistence Services with OCC]
C6[Comparison Utilities]
C7[Capture Log Service]
end
subgraph "Data Storage"
D1[PostgreSQL Database]
D2[Supabase RLS]
D3[External APIs]
D4[Captura Logs]
D5[OCC Conflict Detection]
end
A1 --> A2
A2 --> A3
A3 --> B1
B1 --> B2
B1 --> B3
B1 --> C1
C1 --> C2
C1 --> C3
C1 --> C4
C1 --> C5
C5 --> C6
C5 --> C7
C2 --> D1
C3 --> D3
C4 --> D1
C5 --> D5
D1 --> D2
D1 --> D4
D5 --> D1
```

**Diagram sources**
- [audiencias-client.tsx:1-431](file://src/app/(authenticated)/audiencias/audiencias-client.tsx#L1-L431)
- [audiencias-actions.ts:1-498](file://src/app/(authenticated)/audiencias/actions/audiencias-actions.ts#L1-L498)
- [service.ts:1-315](file://src/app/(authenticated)/audiencias/service.ts#L1-L315)
- [audiencias-filter-bar.tsx:1-200](file://src/app/(authenticated)/audiencias/components/audiencias-filter-bar.tsx#L1-L200)
- [semantic-badge.tsx:200-219](file://src/components/ui/semantic-badge.tsx#L200-L219)
- [audiencias-ultima-captura-card.tsx:1-168](file://src/app/(authenticated)/audiencias/components/audiencias-ultima-captura-card.tsx#L1-L168)
- [20260427130000_add_ultima_captura_id_to_audiencias_com_origem.sql:9-77](file://supabase/migrations/20260427130000_add_ultima_captura_id_to_audiencias_com_origem.sql#L9-L77)
- [audiencias-glass-list.tsx:259-328](file://src/app/(authenticated)/audiencias/components/audiencias-glass-list.tsx#L259-L328)
- [audiencias-semana-view.tsx:396-455](file://src/app/(authenticated)/audiencias/components/views/audiencias-semana-view.tsx#L396-L455)
- [audiencias-missao-content.tsx:317-328](file://src/app/(authenticated)/audiencias/components/views/audiencias-missao-content.tsx#L317-L328)
- [tabs.tsx:27-41](file://src/components/ui/tabs.tsx#L27-L41)
- [week-navigator.tsx:181-221](file://src/components/shared/week-navigator.tsx#L181-L221)
- [week-days-carousel.tsx:180-274](file://src/components/shared/week-days-carousel.tsx#L180-L274)
- [audiencia-detail-dialog.tsx:626-648](file://src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx#L626-L648)
- [nova-audiencia-dialog.tsx:435-455](file://src/app/(authenticated)/audiencias/components/nova-audiencia-dialog.tsx#L435-L455)
- [audiencias-dia-dialog.tsx:260-327](file://src/app/(authenticated)/audiencias/components/audiencias-dia-dialog.tsx#L260-L327)
- [audiencias-persistence.service.ts:514-547](file://src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts#L514-L547)
- [comparison.util.ts:45-71](file://src/app/(authenticated)/captura/services/persistence/comparison.util.ts#L45-L71)
- [capture-log.service.ts:50-63](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L50-L63)

### Calendar Integration Architecture

The system provides comprehensive calendar integration supporting multiple calendar providers through a unified interface:

```mermaid
flowchart LR
subgraph "Calendar Providers"
GC[Google Calendar API]
OC[Outlook Calendar API]
LC[Local Calendar]
end
subgraph "Integration Layer"
CI[Calendar Interface]
AI[Authentication Manager]
SI[Synchronization Engine]
end
subgraph "Internal System"
AS[Audiência Scheduler]
DB[Database Storage]
WS[Webhook System]
end
GC --> CI
OC --> CI
LC --> CI
CI --> AI
AI --> SI
SI --> AS
AS --> DB
AS --> WS
WS --> CI
```

**Diagram sources**
- [briefing-helpers.ts:132-165](file://src/app/(authenticated)/calendar/briefing-helpers.ts#L132-L165)
- [data.ts:490-527](file://src/app/(authenticated)/agenda/mock/data.ts#L490-L527)

**Section sources**
- [audiencias-client.tsx:1-431](file://src/app/(authenticated)/audiencias/audiencias-client.tsx#L1-L431)
- [briefing-helpers.ts:132-165](file://src/app/(authenticated)/calendar/briefing-helpers.ts#L132-L165)
- [data.ts:490-527](file://src/app/(authenticated)/agenda/mock/data.ts#L490-L527)

## Optimistic Concurrency Control Implementation

**New** The audiência persistence service now implements comprehensive optimistic concurrency control (OCC) mechanisms to prevent data corruption during concurrent operations. This system ensures data integrity by detecting and handling conflicts when multiple processes attempt to update the same audiência record simultaneously.

### OCC Architecture Flow

```mermaid
flowchart TD
subgraph "OCC Implementation"
OCC[Optimistic Concurrency Control]
BATCH[Batch Querying]
COMP[Comparison Utilities]
ANCHOR[Anchor Updates]
CONFLICT[Conflict Detection]
LOG[Capture Log Service]
end
subgraph "Conflict Resolution"
SELECT[SELECT with updated_at]
UPDATE[UPDATE with updated_at anchor]
CHECK[Rows Affected Check]
SUCCESS[Update Success]
CONFLICT_PATH[Conflict Path]
END
subgraph "Data Integrity"
TIMESTAMP[updated_at Timestamp]
VERSION[Version Control]
AUDIT[Audit Trail]
ERROR[Error Handling]
end
OCC --> BATCH
OCC --> COMP
OCC --> ANCHOR
OCC --> CONFLICT
OCC --> LOG
BATCH --> SELECT
SELECT --> UPDATE
UPDATE --> CHECK
CHECK --> SUCCESS
CHECK --> CONFLICT_PATH
SUCCESS --> TIMESTAMP
CONFLICT_PATH --> VERSION
VERSION --> AUDIT
AUDIT --> ERROR
```

**Diagram sources**
- [audiencias-persistence.service.ts:340-367](file://src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts#L340-L367)
- [audiencias-persistence.service.ts:514-547](file://src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts#L514-L547)
- [comparison.util.ts:45-71](file://src/app/(authenticated)/captura/services/persistence/comparison.util.ts#L45-L71)
- [capture-log.service.ts:50-63](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L50-L63)

### Batch Querying Mechanism

The system implements efficient batch querying to minimize database round trips and improve performance:

```mermaid
sequenceDiagram
participant Service as "Persistence Service"
participant DB as "Database"
participant Cache as "Batch Cache"
Service->>DB : SELECT * FROM audiencias WHERE id_pje IN (?)
DB-->>Service : Batch Results
Service->>Cache : Store in Map (id_pje : : numero_processo)
Cache-->>Service : Quick Lookup
Service->>Service : Process Individual Updates
```

**Diagram sources**
- [audiencias-persistence.service.ts:340-367](file://src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts#L340-L367)

### Conflict Detection and Resolution

The OCC mechanism detects conflicts by comparing the expected `updated_at` timestamp with the current database state:

```mermaid
flowchart TD
subgraph "Conflict Detection"
SELECT[SELECT audiência with updated_at]
COMPARE[Compare Objects (deep comparison)]
IF_CHANGED{Any Changes?}
IF_CHANGED --> |No| UPDATE_NOOP[Update with updated_at anchor]
IF_CHANGED --> |Yes| UPDATE_ANCHOR[UPDATE with updated_at anchor]
UPDATE_NOOP --> CHECK1[Rows Affected Check]
UPDATE_ANCHOR --> CHECK2[Rows Affected Check]
CHECK1 --> CONFLICT1[No rows affected = Conflict]
CHECK2 --> CONFLICT2[No rows affected = Conflict]
CHECK1 --> SUCCESS1[Success]
CHECK2 --> SUCCESS2[Success]
CONFLICT1 --> LOG_CONFLICT[Log Conflict]
CONFLICT2 --> LOG_CONFLICT
SUCCESS1 --> LOG_SUCCESS[Log Success]
SUCCESS2 --> LOG_SUCCESS
end
```

**Diagram sources**
- [audiencias-persistence.service.ts:514-547](file://src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts#L514-L547)
- [comparison.util.ts:45-71](file://src/app/(authenticated)/captura/services/persistence/comparison.util.ts#L45-L71)
- [capture-log.service.ts:50-63](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L50-L63)

### Comparison Utilities

The system uses sophisticated comparison utilities to detect actual changes before performing updates:

```mermaid
classDiagram
class ComparisonUtils {
+removerCamposControle(obj) : PlainObject
+compararObjetos(novo, existente) : ComparisonResult
+deepEqual(a, b) : boolean
+sortKeysDeep(value) : unknown
}
class ComparisonResult {
+saoIdenticos : boolean
+camposAlterados : string[]
+valoresAlterados : ValorAlterado[]
}
class ValorAlterado {
+campo : string
+antes : unknown
+depois : unknown
}
ComparisonUtils --> ComparisonResult : "returns"
ComparisonResult --> ValorAlterado : "contains"
```

**Diagram sources**
- [comparison.util.ts:26-71](file://src/app/(authenticated)/captura/services/persistence/comparison.util.ts#L26-L71)

### Capture Log Service Integration

The OCC mechanism integrates with the capture log service to track conflicts and maintain audit trails:

```mermaid
flowchart TD
subgraph "Capture Log Integration"
LOG[CaptureLogService]
ENTRY[Log Entry Types]
SUCCESS[Success Logging]
CONFLICT[Conflict Logging]
ERROR[Error Logging]
ENTRY --> SUCCESS
ENTRY --> CONFLICT
ENTRY --> ERROR
SUCCESS --> LOG
CONFLICT --> LOG
ERROR --> LOG
end
```

**Diagram sources**
- [capture-log.service.ts:50-63](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L50-L63)

**Section sources**
- [audiencias-persistence.service.ts:340-587](file://src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts#L340-L587)
- [comparison.util.ts:1-74](file://src/app/(authenticated)/captura/services/persistence/comparison.util.ts#L1-L74)
- [capture-log.service.ts:42-160](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L42-L160)

## Detailed Component Analysis

### Audiência Creation Workflow

The audiência creation process follows a comprehensive workflow ensuring data integrity and legal compliance:

```mermaid
flowchart TD
Start([User Initiates Creation]) --> ValidateForm["Validate Form Data<br/>• Process ID exists<br/>• Date/Time validity<br/>• Modalidad requirements"]
ValidateForm --> CheckProcess["Check Process Existence<br/>• Verify process in database<br/>• Validate type associations"]
CheckProcess --> ProcessValid{"Process Valid?"}
ProcessValid --> |No| ShowError["Show Validation Error"]
ProcessValid --> |Yes| SaveAudiência["Save to Database<br/>• Create audiência record<br/>• Set default status<br/>• Apply RLS policies<br/>• Track last capture ID"]
SaveAudiência --> TriggerModalidade["Trigger Modalidade Population<br/>• Auto-detect from URL<br/>• Check address presence<br/>• Set hybrid flags"]
TriggerModalidade --> RevalidateUI["Revalidate UI<br/>• Clear form state<br/>• Update counters<br/>• Refresh lists"]
ShowError --> End([End])
RevalidateUI --> End
```

**Diagram sources**
- [audiencias-actions.ts:166-203](file://src/app/(authenticated)/audiencias/actions/audiencias-actions.ts#L166-L203)
- [service.ts:20-62](file://src/app/(authenticated)/audiencias/service.ts#L20-L62)
- [07_audiencias.sql:100-148](file://supabase/schemas/07_audiencias.sql#L100-L148)

### Scheduling Algorithms and Resource Allocation

The system implements intelligent scheduling algorithms that consider multiple constraints and priorities:

```mermaid
flowchart TD
subgraph "Resource Constraints"
RC1[Judge Availability]
RC2[Room Capacity]
RC3[Legal Precedents]
RC4[Participant Conflicts]
RC5[GrauTribunal Requirements]
end
subgraph "Scheduling Algorithm"
SA1[Constraint Checking]
SA2[Priority Assignment]
SA3[Conflict Resolution]
SA4[Optimization Loop]
end
subgraph "Output"
O1[Available Time Slots]
O2[Resource Assignments]
O3[Conflict Alerts]
end
RC1 --> SA1
RC2 --> SA1
RC3 --> SA1
RC4 --> SA1
RC5 --> SA1
SA1 --> SA2
SA2 --> SA3
SA3 --> SA4
SA4 --> O1
SA4 --> O2
SA4 --> O3
```

### Participant Management System

The participant management system handles complex relationships between legal parties with corrected field mapping:

```mermaid
classDiagram
class PoloAtivo {
+string nome_parte_autora
+boolean representaVarios
+array representantes
+addRepresentante()
+removeRepresentante()
}
class PoloPassivo {
+string nome_parte_re
+boolean representaVarios
+array representantes
+addRepresentante()
+removeRepresentante()
}
class Representante {
+number id
+string nome
+string tipo
+string documento
+boolean autorizado
+validadeDocumento()
}
class Audiencia {
+number id
+string numeroProcesso
+string dataInicio
+string dataFim
+string modalidade
+PoloAtivo poloAtivo
+PoloPassivo poloPassivo
+array participantes
+addParticipante()
+removeParticipante()
}
Audiencia --> PoloAtivo : "contains"
Audiencia --> PoloPassivo : "contains"
PoloAtivo --> Representante : "manages"
PoloPassivo --> Representante : "manages"
```

**Updated** Field mapping has been corrected to use nome_parte_autora and nome_parte_re instead of polo_ativo_nome and polo_passivo_nome for better alignment with legal process naming conventions.

### Location Management and Modalities

The system supports three distinct modalities with specific location requirements:

| Modalidade | Requisitos Obrigatórios | Localização | Acesso |
|------------|------------------------|-------------|---------|
| Virtual | URL válida | Online | Link único |
| Presencial | Endereço completo | Tribunal | Presencial |
| Híbrida | Ambos os requisitos | Misto | Virtual + Presencial

### PJE-TRT Integration

The system maintains seamless integration with PJE-TRT systems for automatic audiência data synchronization:

```mermaid
sequenceDiagram
participant PJE as "PJE-TRT System"
participant Driver as "TRT Driver"
participant API as "PJE API"
participant DB as "Database"
participant Sync as "Sync Engine"
PJE->>Driver : Request Audiências
Driver->>API : Authenticate & Connect
API->>Driver : Return Process Data
Driver->>Sync : Process Audiências
Sync->>DB : Upsert Audiências with OCC
DB->>Sync : Confirm Updates
Sync->>Driver : Report Results
Driver->>PJE : Send Acknowledgment
```

**Diagram sources**
- [trt-driver.ts:45-80](file://src/app/(authenticated)/captura/drivers/pje/trt-driver.ts#L45-L80)
- [logs.txt:10-23](file://scripts/results/api-audiencias/logs.txt#L10-L23)

**Section sources**
- [trt-driver.ts:45-80](file://src/app/(authenticated)/captura/drivers/pje/trt-driver.ts#L45-L80)
- [logs.txt:1-23](file://scripts/results/api-audiencias/logs.txt#L1-L23)

### AudienciasUltimaCapturaCard Component

**Updated** New component for displaying last capture summary with metrics and navigation capabilities.

The AudienciasUltimaCapturaCard component provides a comprehensive overview of the last capture operation, displaying key metrics and enabling quick navigation to captured audiências:

```mermaid
flowchart TD
subgraph "Component Structure"
AC[AudienciasUltimaCapturaCard]
MC[MetricColumn]
SK[Skeleton Loader]
end
subgraph "Metrics Display"
CR[Created Records]
AU[Updated Records]
TT[Total Records]
end
subgraph "Navigation"
LN[Last Capture Navigation]
CL[Click Handler]
RL[Route Navigation]
end
AC --> MC
AC --> SK
MC --> CR
MC --> AU
MC --> TT
AC --> LN
LN --> CL
CL --> RL
```

**Diagram sources**
- [audiencias-ultima-captura-card.tsx:75-168](file://src/app/(authenticated)/audiencias/components/audiencias-ultima-captura-card.tsx#L75-L168)
- [repository.ts:799-820](file://src/app/(authenticated)/audiencias/repository.ts#L799-L820)

**Section sources**
- [audiencias-ultima-captura-card.tsx:1-168](file://src/app/(authenticated)/audiencias/components/audiencias-ultima-captura-card.tsx#L1-L168)
- [repository.ts:799-820](file://src/app/(authenticated)/audiencias/repository.ts#L799-L820)

## Enhanced Dialog Components

**Updated** The audiência management system now features enhanced dialog components with proper semantic UI patterns, comprehensive accessibility improvements, and OCC conflict handling.

### Dialog Component Architecture

The system implements a comprehensive dialog component architecture with standardized patterns across all audiência management interfaces:

```mermaid
graph TB
subgraph "Dialog Component System"
DC[Dialog Root]
DH[DialogHeader]
DT[DialogTitle]
DD[DialogDescription]
DF[DialogFooter]
DContent[DialogContent]
end
subgraph "Audiência Dialogs"
ADD[AudienciaDetailDialog]
NAD[NovaAudienciaDialog]
EAD[EditarAudienciaDialog]
ADD2[AudienciasDiaDialog]
end
subgraph "Accessibility Features"
SR[Screen Reader Support]
ARIA[ARIA Attributes]
TAB[Tab Navigation]
end
subgraph "Typography Integration"
TC[Text Components]
HC[Heading Components]
TV[Typography Variants]
end
DC --> DH
DH --> DT
DH --> DD
DC --> DF
DContent --> SR
SR --> ARIA
ARIA --> TAB
DContent --> TC
TC --> HC
HC --> TV
ADD --> DC
NAD --> DC
EAD --> DC
ADD2 --> DC
```

**Diagram sources**
- [audiencia-detail-dialog.tsx:626-648](file://src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx#L626-L648)
- [nova-audiencia-dialog.tsx:435-455](file://src/app/(authenticated)/audiencias/components/nova-audiencia-dialog.tsx#L435-L455)
- [editar-audiencia-dialog.tsx:483-496](file://src/app/(authenticated)/audiencias/components/editar-audiencia-dialog.tsx#L483-L496)
- [audiencias-dia-dialog.tsx:260-327](file://src/app/(authenticated)/audiencias/components/audiencias-dia-dialog.tsx#L260-L327)
- [dialog.tsx:231-298](file://src/components/ui/dialog.tsx#L231-L298)
- [typography.tsx:1-83](file://src/components/ui/typography.tsx#L1-L83)

### DialogHeader Implementation

The DialogHeader component provides standardized header structure with proper semantic markup and accessibility features:

```mermaid
flowchart TD
subgraph "DialogHeader Structure"
DH[DialogHeader]
DT[DialogTitle]
DD[DialogDescription]
BTN[Close Button]
END
subgraph "Accessibility Features"
SR[Screen Reader Only]
ARIA[ARIA Attributes]
ROLE[Role Assignment]
END
DH --> DT
DH --> DD
DH --> BTN
DD --> SR
DT --> ARIA
BTN --> ROLE
```

**Diagram sources**
- [audiencia-detail-dialog.tsx:640-656](file://src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx#L640-L656)
- [nova-audiencia-dialog.tsx:442-445](file://src/app/(authenticated)/audiencias/components/nova-audiencia-dialog.tsx#L442-L445)
- [audiencias-dia-dialog.tsx:263-305](file://src/app/(authenticated)/audiencias/components/audiencias-dia-dialog.tsx#L263-L305)

### DialogDescription Implementation

The DialogDescription component provides screen reader accessibility with proper semantic structure:

```mermaid
flowchart TD
subgraph "DialogDescription Usage"
DD[DialogDescription]
SR[Screen Reader Only]
ACCESS[Accessibility Support]
END
subgraph "Implementation Examples"
ADD[Detalhes da audiência]
NAD[Nova audiência description]
ADD2[Audiências do dia]
END
DD --> SR
SR --> ACCESS
ADD --> DD
NAD --> DD
ADD2 --> DD
```

**Diagram sources**
- [audiencia-detail-dialog.tsx:638](file://src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx#L638)
- [nova-audiencia-dialog.tsx:444](file://src/app/(authenticated)/audiencias/components/nova-audiencia-dialog.tsx#L444)
- [audiencias-dia-dialog.tsx:263](file://src/app/(authenticated)/audiencias/components/audiencias-dia-dialog.tsx#L263)

### DialogFooter Implementation

The DialogFooter component provides standardized footer structure with proper button layouts:

```mermaid
flowchart TD
subgraph "DialogFooter Structure"
DF[DialogFooter]
BTN[Action Buttons]
CLOSE[Close Button]
END
subgraph "Button Patterns"
SAVE[Save Button]
CANCEL[Cancel Button]
PREV[Previous Button]
NEXT[Next Button]
END
DF --> BTN
BTN --> CLOSE
CLOSE --> SAVE
SAVE --> PREV
PREV --> NEXT
```

**Diagram sources**
- [audiencias-dia-dialog.tsx:318-322](file://src/app/(authenticated)/audiencias/components/audiencias-dia-dialog.tsx#L318-L322)

### Enhanced Dialog Components

**Updated** All audiência dialog components now use the enhanced dialog patterns with proper semantic UI structure and OCC conflict handling:

| Component | DialogHeader | DialogDescription | DialogFooter | Accessibility Features | OCC Conflict Handling |
|-----------|--------------|-------------------|--------------|----------------------|---------------------|
| AudienciaDetailDialog | ✅ Proper Header | ✅ Screen Reader Only | ✅ Close Button | ✅ ARIA Labels, Keyboard Nav | ✅ Conflict Resolution |
| NovaAudienciaDialog | ✅ Proper Header | ✅ Form Description | ✅ Save Button | ✅ Form Validation, Focus Management | ✅ Conflict Prevention |
| EditarAudienciaDialog | ✅ Proper Header | ✅ Captured Status Description | ✅ Save Button | ✅ Captured Status, Focus Management | ✅ Conflict Detection |
| AudienciasDiaDialog | ✅ Proper Header | ✅ Screen Reader Only | ✅ Close Button | ✅ Navigation Controls, Keyboard Nav | ✅ Conflict Handling |

### Dialog Section Components

**Updated** New dialog section components provide structured content organization with proper semantic markup and accessibility:

```mermaid
flowchart TD
subgraph "DialogSection Components"
DS[DialogSection]
TITLE[Section Title]
DESC[Section Description]
ICON[Section Icon]
STEP[Step Badge]
END
subgraph "Usage Patterns"
SECTION1[Form Sections]
SECTION2[Detail Sections]
SECTION3[Wizard Steps]
END
DS --> TITLE
DS --> DESC
DS --> ICON
DS --> STEP
SECTION1 --> DS
SECTION2 --> DS
SECTION3 --> DS
```

**Diagram sources**
- [dialog-section.tsx:10-47](file://src/components/shared/dialog-shell/dialog-section.tsx#L10-L47)

**Section sources**
- [audiencia-detail-dialog.tsx:626-819](file://src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx#L626-L819)
- [nova-audiencia-dialog.tsx:435-629](file://src/app/(authenticated)/audiencias/components/nova-audiencia-dialog.tsx#L435-L629)
- [editar-audiencia-dialog.tsx:483-549](file://src/app/(authenticated)/audiencias/components/editar-audiencia-dialog.tsx#L483-L549)
- [audiencias-dia-dialog.tsx:260-327](file://src/app/(authenticated)/audiencias/components/audiencias-dia-dialog.tsx#L260-L327)
- [dialog.tsx:231-298](file://src/components/ui/dialog.tsx#L231-L298)
- [dialog-section.tsx:1-134](file://src/components/shared/dialog-shell/dialog-section.tsx#L1-L134)

## Enhanced Typography System

**Updated** The audiências components have been enhanced with comprehensive design system compliance, featuring new typography variant classes (text-card-title, text-mono-num), improved semantic structure with proper heading components, and enhanced badge systems for case flags.

### Typography Implementation

The system now utilizes a comprehensive typography system with typed components that ensure consistent styling and accessibility:

```mermaid
graph TB
subgraph "Typography System"
TS[Typography Base]
H[Heading Components]
T[Text Components]
TV[Text Variants]
HL[Heading Levels]
END
subgraph "Audiência Components"
MK[MissionKpiStrip]
ASV[AudienciasSemanaView]
AMC[AudienciasMissaoContent]
AGL[AudienciasGlassList]
AC[AudienciasUltimaCapturaCard]
AB[CountBadge]
AK[Accessibility]
END
TS --> H
TS --> T
T --> TV
H --> HL
MK --> TS
ASV --> TS
AMC --> TS
AGL --> TS
AC --> TS
AB --> TS
AK --> TS
```

**Diagram sources**
- [typography.tsx:152-204](file://src/components/ui/typography.tsx#L152-L204)
- [mission-kpi-strip.tsx:130-253](file://src/app/(authenticated)/audiencias/components/mission-kpi-strip.tsx#L130-L253)
- [audiencias-semana-view.tsx:309-429](file://src/app/(authenticated)/audiencias/components/views/audiencias-semana-view.tsx#L309-L429)
- [audiencias-missao-content.tsx:317-328](file://src/app/(authenticated)/audiencias/components/views/audiencias-missao-content.tsx#L317-L328)
- [audiencias-ultima-captura-card.tsx:130-168](file://src/app/(authenticated)/audiencias/components/audiencias-ultima-captura-card.tsx#L130-L168)
- [semantic-badge.tsx:200-219](file://src/components/ui/semantic-badge.tsx#L200-L219)

### New Typography Variant Classes

The enhanced typography system introduces new variant classes specifically designed for audiência management:

| Variant Class | Size | Usage | Characteristic |
|---------------|------|-------|----------------|
| `text-card-title` | 18px | Card titles, panel headers | Primary heading for audiência cards |
| `text-mono-num` | 10px | Numbers, dates, process numbers | Monospace digits for precise alignment |
| `text-kpi-value` | 20px | Metric values, dashboard highlights | Sans-serif for consistent glyph shapes |
| `text-micro-badge` | 9px | Badge content, small labels | Extra-small text for compact displays |
| `text-meta-label` | 11px | Field labels, uppercase metadata | Uppercase with extended tracking |
| `text-micro-caption` | 10px | Timestamps, secondary info | Tiny text for tertiary information |

### Enhanced Typography Usage in Components

The audiências components now consistently use the enhanced typography system:

```mermaid
flowchart LR
subgraph "Typography Variants Used"
TV1[text-card-title]
TV2[text-mono-num]
TV3[text-kpi-value]
TV4[text-micro-badge]
TV5[text-meta-label]
TV6[text-micro-caption]
END
subgraph "Component Implementation"
MK1[MissionKpiStrip]
ASV1[AudienciasSemanaView]
AMC1[AudienciasMissaoContent]
AGL1[AudienciasGlassList]
AC1[AudienciasUltimaCapturaCard]
CB1[CountBadge]
END
TV1 --> MK1
TV2 --> ASV1
TV3 --> AMC1
TV4 --> AGL1
TV5 --> MK1
TV6 --> ASV1
CB1 --> TV4
```

**Diagram sources**
- [typography.tsx:163-180](file://src/components/ui/typography.tsx#L163-L180)
- [mission-kpi-strip.tsx:137-141](file://src/app/(authenticated)/audiencias/components/mission-kpi-strip.tsx#L137-L141)
- [audiencias-semana-view.tsx:400-406](file://src/app/(authenticated)/audiencias/components/views/audiencias-semana-view.tsx#L400-L406)
- [audiencias-missao-content.tsx:324-328](file://src/app/(authenticated)/audiencias/components/views/audiencias-missao-content.tsx#L324-L328)
- [audiencias-ultima-captura-card.tsx:140-158](file://src/app/(authenticated)/audiencias/components/audiencias-ultima-captura-card.tsx#L140-L158)
- [semantic-badge.tsx:200-219](file://src/components/ui/semantic-badge.tsx#L200-L219)

### Semantic Markup and Accessibility

The components now implement proper semantic HTML structure with accessible heading hierarchies:

| Component | Semantic Elements | Accessibility Features |
|-----------|-------------------|----------------------|
| MissionKpiStrip | `<div>` containers with proper spacing | Screen reader friendly labels, keyboard navigation |
| AudienciasSemanaView | `<h3>`, `<h4>`, `<span>` elements | Proper heading levels, ARIA labels, focus management |
| AudienciasMissaoContent | `<h3>`, `<h4>`, `<span>` elements | Proper heading levels, ARIA labels, focus management |
| AudienciasGlassList | `<h3>`, `<p>`, `<span>` elements | Proper heading levels, ARIA labels, focus management |
| WeekDayCard | `<button>`, `<div>` with role attributes | Clickable semantics, keyboard activation, focus indicators |
| CountBadge | `<span>` with proper semantic context | Numeric formatting, tabular numbers, consistent sizing |
| Dialog Components | `<DialogHeader>`, `<DialogTitle>`, `<DialogDescription>` | Proper dialog structure, screen reader support |
| OCC Conflict Dialogs | `<DialogHeader>`, `<DialogTitle>`, `<DialogDescription>` | Conflict-specific messaging, screen reader support |

**Section sources**
- [typography.tsx:1-205](file://src/components/ui/typography.tsx#L1-L205)
- [globals.css:1450-1650](file://src/app/globals.css#L1450-L1650)
- [mission-kpi-strip.tsx:1-254](file://src/app/(authenticated)/audiencias/components/mission-kpi-strip.tsx#L1-L254)
- [audiencias-semana-view.tsx:1-671](file://src/app/(authenticated)/audiencias/components/views/audiencias-semana-view.tsx#L1-L671)
- [audiencias-missao-content.tsx:1-364](file://src/app/(authenticated)/audiencias/components/views/audiencias-missao-content.tsx#L1-L364)
- [audiencias-ultima-captura-card.tsx:1-168](file://src/app/(authenticated)/audiencias/components/audiencias-ultima-captura-card.tsx#L1-L168)
- [semantic-badge.tsx:1-220](file://src/components/ui/semantic-badge.tsx#L1-L220)

## Mission Control Interface Patterns

**Updated** New comprehensive documentation for mission control interface patterns specific to the audiências module.

The audiências module follows a mission control pattern that treats audiências as missions with real-time countdown, preparation scoring, and post-mission debrief flow:

### Mission Control Layout Structure

```mermaid
graph TB
subgraph "Mission Control Layout"
MC[AudienciasClient]
HD[Header (only for non-quadro views)]
KPI[MissionKpiStrip]
LC[AudienciasUltimaCapturaCard]
IB[InsightBanner]
VC[View Controls]
CT[Content Area]
END
subgraph "View Modes"
QD[AudienciasMissaoContent]
SW[AudienciasSemanaView]
MS[AudienciasMesView]
YR[AudienciasAnoView]
LS[AudienciasListaView]
END
MC --> HD
MC --> KPI
MC --> LC
MC --> IB
MC --> VC
MC --> CT
CT --> QD
CT --> SW
CT --> MS
CT --> YR
CT --> LS
```

**Diagram sources**
- [audiencias.md:21-43](file://design-system/zattaros/pages/audiencias.md#L21-L43)
- [audiencias-client.tsx:286-431](file://src/app/(authenticated)/audiencias/audiencias-client.tsx#L286-L431)

### Mission Control Components

| Component | Purpose | Visual Style | Interaction Pattern | OCC Integration |
|-----------|---------|--------------|-------------------|-----------------|
| MissionKpiStrip | Mission overview metrics | Grid layout with 4 cards | Static display with hover effects | Conflict monitoring |
| AudienciasUltimaCapturaCard | Last capture summary | Glass panel with atmospheric glow | Clickable navigation to captured audiências | Conflict statistics |
| AudienciasMissaoContent | Mission-focused day view | Hero card layout | Interactive timeline with status indicators | Real-time conflict detection |
| AudienciasSemanaView | Weekly schedule view | Glass row cards with temporal column | Tabbed navigation with day selection | Batch conflict prevention |
| AudienciasFilterBar | Mission filtering | Multi-select chips with popover | Dynamic filtering with real-time updates | Filtered conflict tracking |
| CountBadge | Numeric count display | Secondary soft variant | Consistent sizing and formatting | Conflict count display |

### Mission Control Typography Specifications

The audiências module uses specific typography tokens aligned with mission control patterns:

| Element | Typography Token | Size | Weight | Usage |
|---------|------------------|------|--------|-------|
| Page Header | `text-2xl font-bold` | 2xl | Bold | Main page title |
| Subtitle | `text-sm text-muted-foreground` | sm | Normal | Page description |
| KPI Labels | `text-meta-label` | xs | Medium | Mission metrics labels |
| KPI Values | `text-kpi-value` | xl | Bold | Mission metrics values |
| Status Badges | `text-micro-badge` | 2xs | Bold | Status indicators |
| Countdown Timer | `text-caption font-semibold` | sm | Medium | Time remaining display |
| Count Badges | `text-micro-badge` | 2xs | Medium | Numeric indicators |
| Card Titles | `text-card-title` | lg | SemiBold | Card and panel headings |
| Mono Numbers | `text-mono-num` | xs | Regular | Process numbers, dates, metrics |
| OCC Conflict Messages | `text-micro-caption` | 2xs | Medium | Conflict resolution messages |

### Mission Control Color System

| Status | Color Token | Usage | Visual Effect | OCC State |
|--------|-------------|-------|---------------|-----------|
| Future Missions | `bg-primary/50` | Scheduled audiências | Solid color dot | Normal |
| Ongoing Missions | `bg-success animate-pulse` | Current audiência | Pulsing animation | Normal |
| Completed Missions | `bg-success/50` | Finished audiências | Reduced opacity | Normal |
| Cancelled Missions | `bg-destructive/50` | Cancelled audiências | Reduced opacity | Normal |
| Past Missions | `bg-muted-foreground/20` | Missions outside current period | Light gray dot | Normal |
| OCC Conflicts | `bg-warning/50` | Conflict detected | Warning indicator | Conflict |
| OCC Resolved | `bg-info/50` | Conflict resolved | Info indicator | Resolved |
| OCC Failed | `bg-destructive/50` | Conflict failed | Error indicator | Failed |

**Section sources**
- [audiencias.md:1-268](file://design-system/zattaros/pages/audiencias.md#L1-L268)
- [audiencias-client.tsx:1-431](file://src/app/(authenticated)/audiencias/audiencias-client.tsx#L1-L431)

## Enhanced Filtering System

**Updated** The system now features enhanced filtering capabilities with GrauTribunal and TipoAudiencia filters for improved audiência discovery and management, with OCC conflict tracking.

### GrauTribunal Filter Implementation

The GrauTribunal filter allows users to filter audiências by legal grade (first degree, second degree, or superior tribunal):

```mermaid
flowchart TD
subgraph "GrauTribunal Filter"
GF[GrauFilter Component]
GO[Grau Options]
G1[Primeiro Grau]
G2[Segundo Grau]
G3[Tribunal Superior]
END
subgraph "Filter Logic"
FL[Filter Toggle]
FC[Filter Change Handler]
FR[Filter Result]
END
GF --> GO
GO --> G1
GO --> G2
GO --> G3
GF --> FL
FL --> FC
FC --> FR
```

**Diagram sources**
- [audiencias-filter-bar.tsx:407-433](file://src/app/(authenticated)/audiencias/components/audiencias-filter-bar.tsx#L407-L433)
- [domain.ts:28-32](file://src/app/(authenticated)/audiencias/domain.ts#L28-L32)

### TipoAudiencia Filter Implementation

The TipoAudiencia filter enables filtering by audiência type categories:

```mermaid
flowchart TD
subgraph "TipoAudiencia Filter"
TF[TipoFilter Component]
TO[Tipo Options]
T1[Virtual]
T2[Presencial]
T3[Híbrida]
END
subgraph "Filter Logic"
FT[Type Filter]
FH[Type Handler]
FR[Type Result]
END
TF --> TO
TO --> T1
TO --> T2
TO --> T3
TF --> FT
FT --> FH
FH --> FR
```

**Diagram sources**
- [audiencias-list-filters.tsx:151-157](file://src/app/(authenticated)/audiencias/components/audiencias-list-filters.tsx#L151-L157)

### CountBadge Integration

The CountBadge component provides consistent numeric display across all filter interfaces, now enhanced with OCC conflict tracking:

```mermaid
flowchart TD
subgraph "CountBadge Usage"
CB[CountBadge Component]
CT[Count Text]
CS[Count Size]
CE[Count Effect]
CF[Conflict Flag]
END
subgraph "Filter Integration"
FT[Filter Tabs]
FC[Filter Counts]
FE[Filter Effects]
FCON[Conflict Counts]
END
CB --> CT
CB --> CS
CB --> CE
CB --> CF
FT --> CB
FC --> CB
FE --> CB
FCON --> CB
```

**Diagram sources**
- [audiencias-filter-bar.tsx:119-133](file://src/app/(authenticated)/audiencias/components/audiencias-filter-bar.tsx#L119-L133)
- [semantic-badge.tsx:200-219](file://src/components/ui/semantic-badge.tsx#L200-L219)

### OCC Conflict Tracking in Filters

**New** The filtering system now includes OCC conflict tracking to help users identify audiências with concurrent modification conflicts:

| Filter Type | Conflict Tracking | Visual Indicator | Action Support |
|-------------|-------------------|------------------|----------------|
| GrauTribunal | ✅ Conflict counts by grade | Warning badges on filter chips | Filter by conflict status |
| TipoAudiencia | ✅ Conflict counts by type | Warning badges on type filters | Filter by conflict severity |
| Status | ✅ Conflict counts by status | Warning badges on status filters | Filter by conflict resolution |
| Modalidade | ✅ Conflict counts by modality | Warning badges on modality filters | Filter by conflict type |
| Responsável | ✅ Conflict counts by responsible | Warning badges on user filters | Filter by conflict owner |

**Section sources**
- [audiencias-filter-bar.tsx:1-200](file://src/app/(authenticated)/audiencias/components/audiencias-filter-bar.tsx#L1-L200)
- [audiencias-list-filters.tsx:132-160](file://src/app/(authenticated)/audiencias/components/audiencias-list-filters.tsx#L132-L160)
- [audiencias-toolbar-filters.tsx:167-196](file://src/app/(authenticated)/audiencias/components/audiencias-toolbar-filters.tsx#L167-L196)
- [semantic-badge.tsx:1-220](file://src/components/ui/semantic-badge.tsx#L1-L220)
- [domain.ts:28-32](file://src/app/(authenticated)/audiencias/domain.ts#L28-L32)

## Enhanced Day Picker Interfaces

**Updated** The system now features enhanced day picker interfaces with a specialized "week" variant for the Tabs component, improved trigger styling for better visual feedback and accessibility, and OCC conflict detection.

### Enhanced Tabs Component with Week Variant

The Tabs component has been enhanced with a new "week" variant specifically designed for day-picker interfaces:

```mermaid
flowchart TD
subgraph "Tabs Component Variants"
TV[Variant System]
WD[Week Variant]
DW[Default Variant]
LV[Line Variant]
END
subgraph "Week Variant Features"
WW[Full Width Container]
WT[Compact Trigger Styling]
WC[Tabular Number Display]
WL[Low Preparation Indicators]
WV[Visual Feedback States]
WCON[Conflict Detection]
END
TV --> WD
TV --> DW
TV --> LV
WD --> WW
WD --> WT
WD --> WC
WD --> WL
WD --> WV
WD --> WCON
```

**Diagram sources**
- [tabs.tsx:27-41](file://src/components/ui/tabs.tsx#L27-L41)
- [audiencias-semana-view.tsx:207-236](file://src/app/(authenticated)/audiencias/components/views/audiencias-semana-view.tsx#L207-L236)

### Week Variant Implementation Details

The new "week" variant provides specialized styling for day-picker interfaces with OCC conflict detection:

| Feature | Implementation | Visual Effect | OCC Integration |
|---------|----------------|---------------|-----------------|
| Full Width Container | `w-full bg-muted` | Expands to fill available space | Conflict area coverage |
| Compact Trigger Styling | `flex-1 gap-1.5` | Responsive trigger sizing | Conflict trigger styling |
| Tabular Number Display | `text-caption font-semibold tabular-nums` | Monospace digits for alignment | Conflict count display |
| Low Preparation Indicators | `bg-warning/15 text-warning` | Visual warning for preparation issues | Conflict warning indicators |
| Visual Feedback States | `bg-primary/12 text-primary` | Today highlighting and selection states | Conflict resolution states |
| Accessibility Support | `role="tab"` + `aria-selected` | Screen reader compatibility | Conflict accessibility |
| Conflict Detection | `data-conflict="true"` attribute | Conflict state indication | OCC conflict markers |

### Enhanced Trigger Styling

The TabsTrigger component has been enhanced with improved styling for day navigation and OCC conflict handling:

```mermaid
flowchart TD
subgraph "Trigger Styling Enhancements"
TS[Trigger Styling]
SS[State Styles]
FS[Focus Styles]
VS[Visual Feedback]
AS[Accessibility]
CS[Conflict Styling]
END
subgraph "State Styles"
IS[Inactive State]
HS[Hover State]
SS --> IS
SS --> HS
IS --> `hover:bg-muted text-muted-foreground`
HS --> `hover:bg-primary/10 text-primary ring-1 ring-primary/20`
END
subgraph "Conflict Styling"
WCS[Warning Conflict State]
ECS[Error Conflict State]
RCS[Resolved Conflict State]
CS --> WCS
CS --> ECS
CS --> RCS
WCS --> `bg-warning/15 text-warning`
ECS --> `bg-destructive/15 text-destructive`
RCS --> `bg-success/15 text-success`
END
subgraph "Focus Styles"
FS --> `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1`
END
subgraph "Visual Feedback"
VS --> `min-w-12 py-1.5 px-2 gap-0`
VS --> `text-[10px] uppercase tracking-wide`
VS --> `text-base font-semibold leading-tight`
END
subgraph "Accessibility"
AS --> `role="tab"`
AS --> `aria-selected={day.isSelected}`
AS --> `tabIndex={day.isSelected ? 0 : -1}`
AS --> `aria-describedby={conflictMessage}`
END
TS --> SS
TS --> FS
TS --> VS
TS --> AS
TS --> CS
```

**Diagram sources**
- [week-navigator.tsx:188-217](file://src/components/shared/week-navigator.tsx#L188-L217)
- [week-days-carousel.tsx:233-250](file://src/components/shared/week-days-carousel.tsx#L233-L250)

### Day Picker Interface Components

The enhanced day picker interfaces include several specialized components with OCC conflict detection:

| Component | Purpose | Enhanced Features | OCC Integration |
|-----------|---------|-------------------|-----------------|
| WeekNavigator | Weekly navigation with integrated day selection | Enhanced trigger styling, improved accessibility | Conflict navigation |
| WeekDaysCarousel | Responsive day carousel with multiple variants | Compact/minimal variants, badge rendering | Conflict visualization |
| YearCalendarGrid | Monthly calendar with day selection | Enhanced trigger styling, weekend handling | Conflict grid display |
| AudienciasSemanaView | Weekly audiência view with day tabs | Specialized week variant, preparation indicators | Real-time conflict detection |
| Day Picker Cards | Individual day cards with audiência display | Conflict indicators, status badges | Conflict status display |

### Accessibility Improvements

The enhanced day picker interfaces include comprehensive accessibility improvements with OCC conflict handling:

- **ARIA Support**: Proper `role="tab"` and `aria-selected` attributes with conflict descriptions
- **Keyboard Navigation**: Full keyboard support with tab focus management and conflict navigation
- **Screen Reader Compatibility**: Proper labeling and state announcements including conflict information
- **Focus Management**: Visible focus indicators and proper tab order with conflict awareness
- **Color Contrast**: Enhanced contrast ratios for visual accessibility including conflict states
- **Conflict Announcements**: Screen reader announcements for conflict detection and resolution

**Section sources**
- [tabs.tsx:1-92](file://src/components/ui/tabs.tsx#L1-L92)
- [audiencias-semana-view.tsx:207-236](file://src/app/(authenticated)/audiencias/components/views/audiencias-semana-view.tsx#L207-L236)
- [week-navigator.tsx:181-221](file://src/components/shared/week-navigator.tsx#L181-L221)
- [week-days-carousel.tsx:180-274](file://src/components/shared/week-days-carousel.tsx#L180-L274)
- [year-calendar-grid.tsx:122-157](file://src/components/shared/year-calendar-grid.tsx#L122-L157)

## Database Infrastructure Improvements

**Updated** The database infrastructure has been enhanced with improved tracking capabilities through the addition of the ultima_captura_id column, corrected field mapping, and OCC conflict detection mechanisms.

### Enhanced Tracking with ultima_captura_id

The system now tracks which capture operation last modified each audiência record with OCC conflict detection:

```mermaid
erDiagram
AUDIENCIAS {
bigint id PK
bigint id_pje
bigint advogado_id FK
bigint processo_id FK
bigint orgao_julgador_id FK
varchar trt
varchar grau
text numero_processo
timestamptz data_inicio
timestamptz data_fim
time hora_inicio
time hora_fim
varchar modalidade
text sala_audiencia_nome
bigint sala_audiencia_id
varchar status
text status_descricao
bigint tipo_audiencia_id FK
bigint classe_judicial_id FK
boolean designada
boolean em_andamento
boolean documento_ativo
text nome_parte_autora
boolean polo_ativo_representa_varios
text nome_parte_re
boolean polo_passivo_representa_varios
text url_audiencia_virtual
jsonb endereco_presencial
varchar presenca_hibrida
bigint ata_audiencia_id
text url_ata_audiencia
boolean segredo_justica
boolean juizo_digital
bigint responsavel_id FK
text observacoes
jsonb dados_anteriores
bigint ultima_captura_id FK
timestamptz created_at
timestamptz updated_at
}
CAPTURAS_LOG {
bigint id PK
varchar tipo_captura
timestamptz iniciado_em
timestamptz concluido_em
text status
jsonb resultado
}
AUDIENCIAS ||--o{ CAPTURAS_LOG : "ultima_captura_id"
```

**Diagram sources**
- [07_audiencias.sql:83](file://supabase/schemas/07_audiencias.sql#L83)
- [20260427130000_add_ultima_captura_id_to_audiencias_com_origem.sql:68](file://supabase/migrations/20260427130000_add_ultima_captura_id_to_audiencias_com_origem.sql#L68)

### OCC Conflict Detection Tables

**New** The system now includes tables and mechanisms for OCC conflict detection and resolution:

```mermaid
erDiagram
AUDIENCIAS_CONFLITOS {
bigint id PK
bigint audiencia_id FK
timestamptz data_conflito
varchar tipo_conflito
text descricao
boolean resolvido
timestamptz data_resolucao
bigint resolvido_por
jsonb detalhes_conflito
}
AUDIENCIAS ||--o{ AUDIENCIAS_CONFLITOS : "conflitos"
```

### View Enhancement for Consistent Access

The audiencias_com_origem view has been updated to include the ultima_captura_id column and OCC conflict tracking for consistent access patterns:

```mermaid
flowchart TD
subgraph "View Structure"
AV[audiencias_com_origem View]
AC[Select Columns]
AD[With Clause]
AE[Left Join]
AF[Conflict Tracking]
END
subgraph "Enhanced Columns"
UC[ultima_captura_id]
TR[trt_origem]
PA[nome_parte_autora]
PP[nome_parte_re]
CT[conflict_tracking]
END
AV --> AC
AC --> AD
AC --> AE
AC --> AF
AC --> UC
AE --> TR
AE --> PA
AE --> PP
AF --> CT
```

**Diagram sources**
- [20260427130000_add_ultima_captura_id_to_audiencias_com_origem.sql:9-77](file://supabase/migrations/20260427130000_add_ultima_captura_id_to_audiencias_com_origem.sql#L9-L77)

### Field Mapping Corrections

**Updated** Critical field mapping bug has been fixed to ensure proper legal party representation:

The system now correctly maps legal parties using nome_parte_autora and nome_parte_re fields instead of the deprecated polo_ativo_nome and polo_passivo_nome:

| Old Field Name | New Field Name | Purpose | Data Source |
|----------------|----------------|---------|-------------|
| polo_ativo_nome | nome_parte_autora | Autor (active party) | Process acervo table |
| polo_passivo_nome | nome_parte_re | Réu (passive party) | Process acervo table |
| polo_ativo_representa_varios | polo_ativo_representa_varios | Multiple representatives flag | Same as old |
| polo_passivo_representa_varios | polo_passivo_representa_varios | Multiple representatives flag | Same as old |

### OCC Conflict Resolution Triggers

**New** The system includes database triggers for automatic OCC conflict resolution:

```mermaid
flowchart TD
subgraph "OCC Conflict Resolution Triggers"
TRIG[Database Triggers]
SEL[SELECT Trigger]
UPD[UPDATE Trigger]
INS[INSERT Trigger]
DEL[DELETE Trigger]
AUD[Audit Trigger]
END
subgraph "Conflict Resolution Logic"
CMP[Comparison Logic]
CHK[Conflict Check]
RES[Resolution Logic]
LOG[Logging Logic]
END
TRIG --> SEL
TRIG --> UPD
TRIG --> INS
TRIG --> DEL
TRIG --> AUD
SEL --> CMP
CMP --> CHK
CHK --> RES
RES --> LOG
```

**Section sources**
- [07_audiencias.sql:1-159](file://supabase/schemas/07_audiencias.sql#L1-L159)
- [01_enums.sql:19-25](file://supabase/schemas/01_enums.sql#L19-L25)
- [20260427130000_add_ultima_captura_id_to_audiencias_com_origem.sql:1-90](file://supabase/migrations/20260427130000_add_ultima_captura_id_to_audiencias_com_origem.sql#L1-L90)

## Dependency Analysis

The system exhibits excellent modularity with clear dependency boundaries and minimal coupling between components, now enhanced with OCC conflict detection:

```mermaid
graph TB
subgraph "Core Dependencies"
A[Next.js Framework]
B[Zod Validation]
C[React Hook Form]
D[Supabase Client]
E[Enhanced Typography System]
F[Date-fns]
G[Lucide Icons]
H[Radix UI]
I[Shadcn/ui]
J[GlassPanel Components]
K[IconContainer Components]
L[AnimatedNumber Components]
M[Captura System]
N[CountBadge Component]
O[GrauTribunal Enum]
P[TipoAudiencia Filter]
Q[Enhanced Badge Systems]
R[Virtual Room Detection]
S[Observation System]
T[Enhanced Tabs Component]
U[Week Navigator]
V[Day Picker Interfaces]
W[Typography Tokens]
X[Design System Tokens]
Y[Dialog Components]
Z[DialogHeader Components]
AA[DialogFooter Components]
BB[DialogDescription Components]
CC[DialogSection Components]
DD[OCC Conflict Detection]
EE[Comparison Utilities]
FF[Capture Log Service]
GG[Batch Querying]
HH[Distributed Lock Service]
II[Optimistic Updates]
JJ[Conflict Resolution]
KK[Conflict Logging]
END
subgraph "UI Dependencies"
F --> G
H --> I
J --> K
L --> M
N --> O
P --> O
Q --> R
R --> S
T --> U
U --> V
V --> W
W --> X
Y --> Z
Z --> AA
AA --> BB
BB --> CC
DD --> EE
EE --> FF
FF --> GG
GG --> HH
HH --> II
II --> JJ
JJ --> KK
END
subgraph "Data Dependencies"
Q --> O
R --> P
S --> N
DD --> EE
EE --> FF
FF --> GG
GG --> HH
HH --> II
II --> JJ
JJ --> KK
END
subgraph "External Dependencies"
Y[PJE-TRT APIs]
Z[Google Calendar API]
AA[Outlook Calendar API]
BB[Authentication Providers]
CC[Capture System APIs]
DD[Conflict Detection APIs]
EE[Comparison Services]
FF[Logging Services]
GG[Batch Processing Services]
HH[Lock Management Services]
II[Optimistic Update Services]
JJ[Conflict Resolution Services]
KK[Conflict Logging Services]
END
A --> B
A --> C
A --> D
A --> E
D --> Q
Q --> R
R --> S
A --> Y
A --> Z
A --> AA
A --> BB
A --> CC
E --> F
E --> G
E --> H
E --> I
E --> J
E --> K
E --> L
E --> N
E --> O
E --> P
E --> Q
E --> R
E --> S
E --> T
E --> U
E --> V
E --> W
E --> X
E --> Y
E --> Z
E --> AA
E --> BB
E --> CC
DD --> EE
EE --> FF
FF --> GG
GG --> HH
HH --> II
II --> JJ
JJ --> KK
```

**Diagram sources**
- [audiencias-actions.ts:1-21](file://src/app/(authenticated)/audiencias/actions/audiencias-actions.ts#L1-L21)
- [audiencia-form.tsx:1-38](file://src/app/(authenticated)/audiencias/components/audiencia-form.tsx#L1-L38)
- [mission-kpi-strip.tsx:13-26](file://src/app/(authenticated)/audiencias/components/mission-kpi-strip.tsx#L13-L26)
- [audiencias-semana-view.tsx:36-43](file://src/app/(authenticated)/audiencias/components/views/audiencias-semana-view.tsx#L36-L43)
- [audiencias-ultima-captura-card.tsx:3-10](file://src/app/(authenticated)/audiencias/components/audiencias-ultima-captura-card.tsx#L3-L10)
- [semantic-badge.tsx:200-219](file://src/components/ui/semantic-badge.tsx#L200-L219)
- [domain.ts:28-32](file://src/app/(authenticated)/audiencias/domain.ts#L28-L32)
- [audiencias-glass-list.tsx:259-328](file://src/app/(authenticated)/audiencias/components/audiencias-glass-list.tsx#L259-L328)
- [audiencias-semana-view.tsx:396-455](file://src/app/(authenticated)/audiencias/components/views/audiencias-semana-view.tsx#L396-L455)
- [audiencias-missao-content.tsx:317-328](file://src/app/(authenticated)/audiencias/components/views/audiencias-missao-content.tsx#L317-L328)
- [tabs.tsx:27-41](file://src/components/ui/tabs.tsx#L27-L41)
- [week-navigator.tsx:181-221](file://src/components/shared/week-navigator.tsx#L181-L221)
- [week-days-carousel.tsx:180-274](file://src/components/shared/week-days-carousel.tsx#L180-L274)
- [tokens.ts:543-569](file://src/lib/design-system/tokens.ts#L543-L569)
- [audiencia-detail-dialog.tsx:626-648](file://src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx#L626-L648)
- [nova-audiencia-dialog.tsx:435-455](file://src/app/(authenticated)/audiencias/components/nova-audiencia-dialog.tsx#L435-L455)
- [audiencias-dia-dialog.tsx:260-327](file://src/app/(authenticated)/audiencias/components/audiencias-dia-dialog.tsx#L260-L327)
- [dialog-section.tsx:10-47](file://src/components/shared/dialog-shell/dialog-section.tsx#L10-L47)
- [audiencias-persistence.service.ts:514-547](file://src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts#L514-L547)
- [comparison.util.ts:45-71](file://src/app/(authenticated)/captura/services/persistence/comparison.util.ts#L45-L71)
- [capture-log.service.ts:50-63](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L50-L63)
- [distributed-lock.ts:25-65](file://src/lib/utils/locks/distributed-lock.ts#L25-L65)

### Authorization and Permission System

The system implements a comprehensive RBAC (Role-Based Access Control) system with granular permissions:

| Recurso | Operações | Descrição |
|---------|-----------|-----------|
| audiencias | editar | Criar e editar audiências |
| audiencias | visualizar | Visualizar audiências |
| audiencias | listar | Listar audiências |
| audiencias | atribuir_responsavel | Atribuir responsável |
| audiencias | desatribuir_responsavel | Desatribuir responsável |
| audiencias | transferir_responsavel | Transferir responsável |
| audiencias | editar_url_virtual | Editar URL virtual |
| audiencias | editar | Editar dados gerais |

**Section sources**
- [audiencias-actions.ts:23-104](file://src/app/(authenticated)/audiencias/actions/audiencias-actions.ts#L23-L104)
- [07_audiencias.sql:156-158](file://supabase/schemas/07_audiencias.sql#L156-L158)

## Performance Considerations

The system implements several performance optimization strategies, now enhanced with OCC conflict detection:

### Database Optimization
- **Index Strategy**: Comprehensive indexing on frequently queried columns including `data_inicio`, `status`, `processo_id`, `responsavel_id`, the new `ultima_captura_id` column, and `updated_at` for OCC conflict detection
- **Partitioning**: Consider implementing time-based partitioning for historical audiência data
- **Query Optimization**: Column selection optimization reducing I/O by 35% through targeted column retrieval
- **View Optimization**: Enhanced audiencias_com_origem view with consistent column access patterns and OCC conflict tracking
- **Field Mapping Optimization**: Corrected field mapping eliminates data transformation overhead
- **Batch Querying**: Efficient batch querying for OCC conflict detection and resolution

### Caching Strategy
- **Client-Side Caching**: React Query integration for efficient data caching
- **Server-Side Caching**: Redis integration for session and frequently accessed data
- **Database Query Caching**: Optimized queries with appropriate indexing
- **OCC Conflict Caching**: Cached conflict detection results to reduce database load

### Scalability Features
- **Pagination**: Built-in pagination support with configurable limits (maximum 10,000 items per request)
- **Lazy Loading**: Component lazy loading for improved initial load times
- **Background Processing**: Queue-based processing for heavy operations
- **Batch Processing**: OCC conflict resolution batching to handle multiple conflicts efficiently

### Enhanced Component Performance Considerations

**Updated** The AudienciasUltimaCapturaCard component includes specific performance optimizations with OCC conflict tracking:

- **Skeleton Loading**: Efficient skeleton loader with minimal DOM nodes
- **Conditional Rendering**: Lazy loading of metrics until data is available
- **Event Delegation**: Optimized click handlers with proper event bubbling prevention
- **Memory Management**: Proper cleanup of date formatting and interval timers
- **Conflict Statistics**: Efficient conflict count aggregation and caching

### Enhanced Filter Performance

**Updated** The new filtering system includes performance optimizations with OCC conflict detection:

- **CountBadge Optimization**: Efficient numeric display with consistent sizing
- **Filter State Management**: Optimized filter state updates with debounced search
- **Multi-Select Performance**: Efficient handling of multiple filter selections
- **Database Indexing**: Proper indexing for GrauTribunal and TipoAudiencia filtering
- **Field Mapping Performance**: Corrected field mapping eliminates unnecessary data transformation
- **Conflict Filtering**: Efficient conflict-based filtering with OCC statistics

### Typography System Performance

**Updated** The enhanced typography system includes performance optimizations:

- **CSS Class Optimization**: Efficient CSS class application with minimal DOM manipulation
- **Typography Component Caching**: Memoized typography components reduce re-renders
- **Variant Class Reuse**: Shared variant classes across components minimize CSS duplication
- **Font Loading Optimization**: Proper font loading strategy prevents layout shifts
- **Conflict Typography**: Specialized typography for conflict display and resolution

### Enhanced Tabs Component Performance

**Updated** The new "week" variant includes specific performance optimizations with OCC conflict detection:

- **Variant Class Optimization**: Efficient variant class application with minimal CSS overhead
- **Trigger Styling Optimization**: Optimized trigger styling reduces unnecessary reflows
- **Accessibility Performance**: Proper ARIA attributes and keyboard navigation without performance impact
- **Conflict Visualization**: Efficient conflict indicator rendering with minimal DOM updates
- **Responsive Design**: Optimized responsive breakpoints for different screen sizes

### Enhanced Dialog Components Performance

**Updated** The enhanced dialog components include specific performance optimizations with OCC conflict handling:

- **DialogHeader Performance**: Efficient header rendering with proper semantic structure
- **DialogDescription Performance**: Screen reader optimization with minimal DOM overhead
- **DialogFooter Performance**: Button layout optimization with proper accessibility
- **Typography Integration**: Efficient use of new text-card-title and text-mono-num classes
- **Badge System Optimization**: Proper semantic badge usage reduces custom styling overhead
- **Virtual Room Detection**: Optimized virtual room detection logic with early returns
- **Observation System**: Efficient observation editing with controlled state updates
- **Conflict Dialog Performance**: Optimized conflict dialog rendering with minimal reflows
- **Responsive Design**: Optimized responsive breakpoints for different screen sizes
- **Accessibility Performance**: Proper ARIA implementation without performance degradation

#### New Component Performance Considerations

**Updated** The audiências-glass-list.tsx, audiencias-missao-content.tsx, audiencias-semana-view.tsx, tabs.tsx, week-navigator.tsx, week-days-carousel.tsx, audiencia-detail-dialog.tsx, nova-audiencia-dialog.tsx, audiencias-dia-dialog.tsx, and dialog-section.tsx components include specific performance optimizations with OCC conflict detection:

- **Typography System Integration**: Efficient use of new text-card-title, text-mono-num, and enhanced typography components
- **Badge System Optimization**: Proper semantic badge usage reduces custom styling overhead
- **Virtual Room Detection**: Optimized virtual room detection logic with early returns
- **Observation System**: Efficient observation editing with controlled state updates
- **Conflict Detection**: Efficient conflict detection and resolution logic
- **Responsive Design**: Optimized responsive breakpoints for different screen sizes
- **Tabs Component Optimization**: Efficient variant switching and trigger styling with conflict awareness
- **Day Picker Performance**: Optimized day selection with minimal re-renders and conflict visualization
- **Dialog Components Performance**: Efficient dialog rendering with proper semantic structure and conflict handling
- **Accessibility Performance**: Proper ARIA implementation without performance degradation
- **OCC Conflict Caching**: Efficient conflict detection caching to reduce database load

**Section sources**
- [audiencias-ultima-captura-card.tsx:53-71](file://src/app/(authenticated)/audiencias/components/audiencias-ultima-captura-card.tsx#L53-L71)
- [audiencias-client.tsx:280-282](file://src/app/(authenticated)/audiencias/audiencias-client.tsx#L280-L282)
- [semantic-badge.tsx:200-219](file://src/components/ui/semantic-badge.tsx#L200-L219)
- [audiencias-glass-list.tsx:259-328](file://src/app/(authenticated)/audiencias/components/audiencias-glass-list.tsx#L259-L328)
- [audiencias-semana-view.tsx:396-455](file://src/app/(authenticated)/audiencias/components/views/audiencias-semana-view.tsx#L396-L455)
- [audiencias-missao-content.tsx:317-328](file://src/app/(authenticated)/audiencias/components/views/audiencias-missao-content.tsx#L317-L328)
- [tabs.tsx:27-41](file://src/components/ui/tabs.tsx#L27-L41)
- [week-navigator.tsx:181-221](file://src/components/shared/week-navigator.tsx#L181-L221)
- [week-days-carousel.tsx:180-274](file://src/components/shared/week-days-carousel.tsx#L180-L274)
- [audiencia-detail-dialog.tsx:626-648](file://src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx#L626-L648)
- [nova-audiencia-dialog.tsx:435-455](file://src/app/(authenticated)/audiencias/components/nova-audiencia-dialog.tsx#L435-L455)
- [audiencias-dia-dialog.tsx:260-327](file://src/app/(authenticated)/audiencias/components/audiencias-dia-dialog.tsx#L260-L327)
- [dialog-section.tsx:10-47](file://src/components/shared/dialog-shell/dialog-section.tsx#L10-L47)
- [audiencias-persistence.service.ts:340-587](file://src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts#L340-L587)
- [comparison.util.ts:45-71](file://src/app/(authenticated)/captura/services/persistence/comparison.util.ts#L45-L71)
- [capture-log.service.ts:50-63](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L50-L63)
- [distributed-lock.ts:25-65](file://src/lib/utils/locks/distributed-lock.ts#L25-L65)

## Troubleshooting Guide

### Common Issues and Solutions

#### Authentication and Authorization Problems
- **Issue**: Users unable to access audiência data
- **Cause**: Missing or invalid permissions
- **Solution**: Verify user permissions in Supabase RLS policies

#### Data Validation Errors
- **Issue**: Form submission failures with validation errors
- **Cause**: Invalid date ranges or missing required fields
- **Solution**: Check form validation rules and ensure proper data formatting

#### Calendar Integration Issues
- **Issue**: Calendar synchronization failures
- **Cause**: API rate limiting or authentication problems
- **Solution**: Implement retry mechanisms and proper error handling

#### PJE-TRT Integration Failures
- **Issue**: Audiência data not syncing from PJE-TRT
- **Cause**: API connectivity or authentication issues
- **Solution**: Check driver implementation and API credentials

#### Enhanced Typography System Issues
- **Issue**: Typography inconsistencies or missing variant classes
- **Cause**: Direct CSS classes instead of design system components
- **Solution**: Replace manual styling with proper Typography components and semantic markup

#### New Badge System Issues
- **Issue**: Badge display problems or missing semantic variants
- **Cause**: Incorrect category or value mapping
- **Solution**: Verify badge category and value combinations match design system specifications

#### Virtual Room Detection Issues
- **Issue**: Virtual room detection not working properly
- **Cause**: Missing URL validation or modalidade mismatch
- **Solution**: Verify audiência modalidade and URL presence conditions

#### Observation System Issues
- **Issue**: Observation editing not working or saving incorrectly
- **Cause**: State management or action handler problems
- **Solution**: Check observation state updates and action dispatching

#### Enhanced Dialog Components Issues
- **Issue**: Dialog components not rendering properly or lacking accessibility
- **Cause**: Missing DialogHeader, DialogFooter, or DialogDescription components
- **Solution**: Ensure proper dialog structure with semantic components and ARIA attributes

#### Enhanced Component Issues
- **Issue**: AudienciasGlassList, AudienciasMissaoContent, AudienciasSemanaView, tabs.tsx, week-navigator.tsx, week-days-carousel.tsx, audiencia-detail-dialog.tsx, nova-audiencia-dialog.tsx, audiencias-dia-dialog.tsx, or dialog-section.tsx not rendering correctly
- **Cause**: Missing typography classes or badge system integration
- **Solution**: Ensure proper use of text-card-title, text-mono-num, and enhanced badge components

#### Mission Control Pattern Issues
- **Issue**: Mission control layout not rendering correctly
- **Cause**: Missing design system specifications or component dependencies
- **Solution**: Ensure all mission control components follow the established design patterns

#### Enhanced Filter Issues
- **Issue**: GrauTribunal or TipoAudiencia filters not working
- **Cause**: Missing enum values or filter configuration issues
- **Solution**: Verify enum definitions and filter option configurations

#### CountBadge Display Issues
- **Issue**: CountBadge not rendering properly
- **Cause**: Missing size prop or styling conflicts
- **Solution**: Ensure proper CountBadge usage with consistent sizing and styling

#### Repository Lookup Issues
- **Issue**: Process lookup failures in audiência creation
- **Cause**: Missing findProcessoParaAudiencia function or incorrect process validation
- **Solution**: Verify repository implementation and ensure proper process existence checks

#### Typography System Issues
- **Issue**: Typography variant classes not applying correctly
- **Cause**: CSS class conflicts or missing variant definitions
- **Solution**: Verify typography variant classes in globals.css and proper component usage

#### Enhanced Tabs Component Issues
- **Issue**: Tabs component not rendering week variant correctly
- **Cause**: Missing variant prop or styling conflicts
- **Solution**: Ensure proper TabsList usage with variant="week" and verify trigger styling

#### Day Picker Interface Issues
- **Issue**: Day picker interfaces not working or displaying incorrectly
- **Cause**: Missing accessibility attributes or styling conflicts
- **Solution**: Verify proper ARIA attributes, role assignments, and trigger styling

#### Dialog Section Components Issues
- **Issue**: DialogSection components not rendering properly
- **Cause**: Missing title, description, or icon props
- **Solution**: Ensure proper DialogSection usage with required props and tone variants

#### **New** Optimistic Concurrency Control Issues
- **Issue**: OCC conflicts not being detected or resolved properly
- **Cause**: Missing updated_at timestamps or incorrect conflict detection logic
- **Solution**: Verify updated_at field presence and OCC conflict detection implementation

#### **New** Batch Querying Issues
- **Issue**: Batch queries failing or timing out
- **Cause**: Large dataset sizes or missing indexes
- **Solution**: Optimize batch query parameters and ensure proper database indexing

#### **New** Conflict Detection Issues
- **Issue**: Conflicts not being logged or tracked properly
- **Cause**: Missing capture log entries or incorrect conflict detection
- **Solution**: Verify capture log service implementation and conflict detection logic

#### **New** Anchor Update Issues
- **Issue**: Anchor updates failing or not resolving conflicts
- **Cause**: Incorrect updated_at anchoring or database constraint violations
- **Solution**: Verify anchor update implementation and database constraint handling

#### **New** Comparison Utility Issues
- **Issue**: Comparison utilities not detecting changes properly
- **Cause**: Missing control field removal or incorrect deep comparison logic
- **Solution**: Verify comparison utility implementation and control field handling

#### **New** Distributed Lock Issues
- **Issue**: Distributed locks not preventing concurrent modifications
- **Cause**: Missing lock acquisition or incorrect lock release logic
- **Solution**: Verify distributed lock implementation and proper lock lifecycle management

**Section sources**
- [audiencias-actions.ts:106-116](file://src/app/(authenticated)/audiencias/actions/audiencias-actions.ts#L106-L116)
- [service.ts:53-62](file://src/app/(authenticated)/audiencias/service.ts#L53-L62)
- [audiencias-ultima-captura-card.tsx:75-91](file://src/app/(authenticated)/audiencias/components/audiencias-ultima-captura-card.tsx#L75-L91)
- [semantic-badge.tsx:200-219](file://src/components/ui/semantic-badge.tsx#L200-L219)
- [repository.ts:412-431](file://src/app/(authenticated)/audiencias/repository.ts#L412-L431)
- [typography.tsx:163-180](file://src/components/ui/typography.tsx#L163-L180)
- [globals.css:1450-1650](file://src/app/globals.css#L1450-L1650)
- [tabs.tsx:27-41](file://src/components/ui/tabs.tsx#L27-L41)
- [week-navigator.tsx:181-221](file://src/components/shared/week-navigator.tsx#L181-L221)
- [week-days-carousel.tsx:180-274](file://src/components/shared/week-days-carousel.tsx#L180-L274)
- [audiencia-detail-dialog.tsx:626-648](file://src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx#L626-L648)
- [nova-audiencia-dialog.tsx:435-455](file://src/app/(authenticated)/audiencias/components/nova-audiencia-dialog.tsx#L435-L455)
- [audiencias-dia-dialog.tsx:260-327](file://src/app/(authenticated)/audiencias/components/audiencias-dia-dialog.tsx#L260-L327)
- [dialog-section.tsx:10-47](file://src/components/shared/dialog-shell/dialog-section.tsx#L10-L47)
- [audiencias-persistence.service.ts:514-547](file://src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts#L514-L547)
- [comparison.util.ts:45-71](file://src/app/(authenticated)/captura/services/persistence/comparison.util.ts#L45-L71)
- [capture-log.service.ts:50-63](file://src/app/(authenticated)/captura/services/persistence/capture-log.service.ts#L50-L63)
- [distributed-lock.ts:25-65](file://src/lib/utils/locks/distributed-lock.ts#L25-L65)

## Conclusion

The Audiência Management system represents a comprehensive solution for court hearing scheduling and management within the Brazilian judicial system. The system successfully combines modern web technologies with legal compliance requirements to provide an intuitive, efficient, and reliable platform for legal professionals.

**Updated** Key enhancements include comprehensive design system compliance with new typography variant classes (text-card-title, text-mono-num), improved semantic structure with proper heading components, new badge systems for case flags, virtual room detection system, observation system improvements, enhanced day picker interfaces with a specialized "week" variant for the Tabs component, comprehensive dialog component architecture with proper semantic UI patterns, and most importantly, comprehensive optimistic concurrency control (OCC) mechanisms implemented in the audiência persistence service.

The system has been streamlined to remove mock/testing infrastructure components that were part of the development workflow. The production implementation continues to use proven components that have been enhanced with comprehensive design system compliance, improved typography, enhanced accessibility features, and robust OCC conflict detection and resolution capabilities. This ensures maintainability, reliability, and data integrity for long-term operation.

Key strengths of the system include:

- **Comprehensive Legal Compliance**: Built-in adherence to PJE-TRT requirements and legal scheduling standards
- **Advanced Integration Capabilities**: Seamless integration with multiple calendar providers and external legal systems
- **Robust Data Management**: Sophisticated database schema supporting complex legal relationships, enhanced tracking, audit trails, and OCC conflict detection with corrected field mapping
- **Enhanced User Experience**: Modern, responsive design with proper typography and semantic markup for improved accessibility
- **Design System Consistency**: Unified design language across all audiências components with proper component composition
- **Mission Control Patterns**: Specialized interface patterns treating audiências as missions with real-time tracking
- **Advanced Filtering System**: Enhanced filtering capabilities with GrauTribunal and TipoAudiencia support, including OCC conflict tracking
- **Performance Optimization**: Carefully designed architecture supporting scalability, efficient data access, and OCC conflict resolution
- **Database Infrastructure Improvements**: Enhanced tracking capabilities with ultima_captura_id column, OCC conflict detection tables, and optimized indexing for conflict resolution
- **Critical Bug Fixes**: Field mapping corrections ensure accurate legal party representation and data integrity
- **Enhanced Typography System**: New variant classes (text-card-title, text-mono-num) provide consistent typography across components
- **Improved Badge Systems**: Enhanced semantic badge components with proper case flag management
- **Virtual Room Detection**: Intelligent virtual room detection system improves audiência management
- **Observation System**: Structured observation editing with proper state management
- **Enhanced Day Picker Interfaces**: Specialized "week" variant for Tabs component with improved trigger styling, accessibility, and OCC conflict visualization
- **Comprehensive Dialog Architecture**: Proper semantic UI patterns with DialogHeader, DialogFooter, and DialogDescription components, including OCC conflict handling
- **Accessibility Improvements**: Comprehensive ARIA support and keyboard navigation for all dialog components with OCC conflict accessibility
- **Dialog Section Components**: Structured content organization with proper semantic markup and accessibility
- **Dialog Form Shell Integration**: Consistent dialog patterns across all audiência management interfaces
- **Optimistic Concurrency Control**: Robust OCC implementation with batch querying, conflict detection, anchor updates, and comprehensive conflict resolution
- **Comparison Utilities**: Sophisticated deep comparison utilities for detecting actual changes before updates
- **Capture Log Service Integration**: Comprehensive logging of OCC conflicts and resolutions for audit trails
- **Distributed Lock Service**: Additional distributed locking mechanisms for preventing concurrent modifications
- **Conflict Detection Triggers**: Database-level conflict detection and resolution triggers
- **Performance Optimizations**: Efficient batch processing, conflict caching, and optimized database queries for OCC operations

The system provides a solid foundation for managing court hearings while maintaining the highest standards of legal accuracy, design system compliance, user experience, and data integrity. Its modular architecture ensures maintainability and extensibility for future enhancements and regulatory changes. The addition of mission control patterns, enhanced filtering capabilities, comprehensive design system documentation, critical field mapping bug fixes, new typography variant classes, enhanced day picker interfaces, comprehensive dialog architecture, improved accessibility, and most importantly, robust optimistic concurrency control establishes the audiências module as a model for other legal process management interfaces within the ZattarOS ecosystem.

The enhanced typography system with new variant classes (text-card-title, text-mono-num) provides consistent visual hierarchy and improved readability across all audiência components. The improved badge systems with proper case flag management and virtual room detection system enhance the overall user experience and provide better visual cues for audiência status and location. The observation system improvements with structured editing capabilities ensure that audiência notes are properly managed and accessible to authorized users.

The new "week" variant for the Tabs component provides specialized styling for day-picker interfaces, offering improved visual feedback, accessibility, and OCC conflict visualization for audiência scheduling. The enhanced trigger styling ensures consistent user experience across different day picker components, while the comprehensive accessibility improvements make the system usable for all users. The improved day picker interfaces with proper ARIA support, keyboard navigation, and conflict detection provide a professional-grade user experience for audiência management.

The comprehensive dialog component architecture with proper semantic UI patterns ensures consistent user experience across all audiência management interfaces, with proper conflict handling and accessibility support. The DialogHeader, DialogFooter, and DialogDescription components provide proper semantic structure and accessibility support, while the DialogSection components enable structured content organization with proper semantic markup. These enhancements establish the audiência management system as a comprehensive, accessible, legally compliant, and data-integrity focused platform for court hearing scheduling and management.

The implementation of optimistic concurrency control (OCC) mechanisms represents a significant advancement in data integrity and system reliability. The combination of batch querying, conflict detection, anchor updates, and comprehensive conflict resolution ensures that concurrent audiência operations do not result in data corruption or inconsistent states. This OCC implementation, combined with the enhanced design system compliance, improved typography, and comprehensive accessibility features, establishes the audiência management system as a robust, scalable, and legally compliant solution for modern legal process management.