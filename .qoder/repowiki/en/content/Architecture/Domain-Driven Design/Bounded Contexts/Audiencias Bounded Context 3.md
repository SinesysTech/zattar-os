# Audiencias Bounded Context

<cite>
**Referenced Files in This Document**   
- [audiencias-visualizacao-semana.tsx](file://app/(dashboard)/audiencias/components/audiencias-visualizacao-semana.tsx)
- [criar-audiencia.service.ts](file://backend/audiencias/services/criar-audiencia.service.ts)
- [atualizar-url-virtual.service.ts](file://backend/audiencias/services/atualizar-url-virtual.service.ts)
- [atribuir-responsavel.service.ts](file://backend/audiencias/services/atribuir-responsavel.service.ts)
- [audiencias.ts](file://types/domain/audiencias.ts)
- [07_audiencias.sql](file://supabase/schemas/07_audiencias.sql)
- [route.ts](file://app/api/audiencias/route.ts)
- [audiencias-content.tsx](file://app/(dashboard)/audiencias/components/audiencias-content.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Domain Model](#domain-model)
3. [Business Rules](#business-rules)
4. [Implementation Details](#implementation-details)
5. [Integration with Acervo Context](#integration-with-acervo-context)
6. [Unique Aspects of the Audiencias Context](#unique-aspects-of-the-audiencias-context)
7. [Conclusion](#conclusion)

## Introduction
The Audiencias (hearings) bounded context is a specialized domain within the Sinesys application that manages court hearings for legal processes. This context provides comprehensive functionality for scheduling, tracking, and managing hearings, with support for both presential and virtual formats. The system is designed to maintain its own terminology and model separate from other domains, ensuring clear boundaries and responsibilities. The Audiencias context integrates closely with the Acervo context to link hearings to specific legal processes, while providing rich user interfaces for visualizing hearings across different time periods (week, month, year, list).

## Domain Model
The domain model for the Audiencias context is centered around three main entities: Audiencia (hearing), SalaAudiencia (hearing room), and TipoAudiencia (hearing type). The core entity is Audiencia, which represents a court hearing with all its relevant information including date, time, location, participants, and status.

```mermaid
classDiagram
class Audiencia {
+id : number
+id_pje : number
+advogado_id : number
+processo_id : number
+orgao_julgador_id : number | null
+orgao_julgador_descricao : string | null
+trt : string
+grau : GrauProcesso
+numero_processo : string
+classe_judicial : string | null
+classe_judicial_id : number | null
+data_inicio : string
+data_fim : string
+hora_inicio : string | null
+hora_fim : string | null
+modalidade : ModalidadeAudiencia | null
+presenca_hibrida : PresencaHibrida | null
+sala_audiencia_nome : string | null
+sala_audiencia_id : number | null
+status : string
+status_descricao : string | null
+tipo_audiencia_id : number | null
+tipo_descricao : string | null
+tipo_codigo : string | null
+tipo_is_virtual : boolean
+designada : boolean
+em_andamento : boolean
+documento_ativo : boolean
+nome_parte_autora : string | null
+nome_parte_re : string | null
+polo_ativo_nome : string | null
+polo_passivo_nome : string | null
+url_audiencia_virtual : string | null
+url_ata_audiencia : string | null
+ata_audiencia_id : number | null
+endereco_presencial : object | null
+responsavel_id : number | null
+observacoes : string | null
+dados_anteriores : Record<string, unknown> | null
+created_at : string
+updated_at : string
}
class SalaAudiencia {
+id : number
+id_pje : number
+nome : string
+trt : string
+created_at : string
+updated_at : string
}
class TipoAudiencia {
+id : number
+descricao : string
+codigo : string
+is_virtual : boolean
+created_at : string
+updated_at : string
}
Audiencia --> SalaAudiencia : "has"
Audiencia --> TipoAudiencia : "has"
```

**Diagram sources**
- [audiencias.ts](file://types/domain/audiencias.ts#L25-L76)
- [07_audiencias.sql](file://supabase/schemas/07_audiencias.sql#L4-L46)

**Section sources**
- [audiencias.ts](file://types/domain/audiencias.ts#L1-L77)
- [07_audiencias.sql](file://supabase/schemas/07_audiencias.sql#L1-L159)

## Business Rules
The Audiencias context implements several business rules to ensure data integrity and proper workflow management. These rules govern hearing scheduling, responsible assignment, and virtual hearing URL generation.

### Scheduling Conflicts
The system prevents scheduling conflicts through a unique constraint on the combination of `id_pje`, `trt`, `grau`, and `numero_processo` in the database. This ensures that each hearing is uniquely identified within the system, preventing duplicate entries for the same hearing across different processes.

### Responsible Assignment
The responsible assignment business rule allows users to assign a responsible person to a hearing. This is implemented through the `responsavel_id` field in the Audiencia entity, which references the usuarios (users) table. The assignment is validated to ensure that both the hearing and the responsible user exist in the system.

```mermaid
sequenceDiagram
participant User as "User"
participant Frontend as "Frontend"
participant Backend as "Backend"
participant Database as "Database"
User->>Frontend : Select responsible for hearing
Frontend->>Backend : PATCH /api/audiencias/{id}/responsavel
Backend->>Database : Validate audiencia exists
Database-->>Backend : Confirmation
Backend->>Database : Validate responsavel exists
Database-->>Backend : Confirmation
Backend->>Database : Update responsavel_id
Database-->>Backend : Success
Backend-->>Frontend : 200 OK
Frontend-->>User : Update successful
```

**Diagram sources**
- [atribuir-responsavel.service.ts](file://backend/audiencias/services/atribuir-responsavel.service.ts#L1-L156)
- [route.ts](file://app/api/audiencias/[id]/responsavel/route.ts)

**Section sources**
- [atribuir-responsavel.service.ts](file://backend/audiencias/services/atribuir-responsavel.service.ts#L1-L156)

### Virtual Hearing URL Generation
The system automatically determines the hearing modality (virtual, presential, or hybrid) based on specific conditions. When a URL for a virtual hearing is provided, the system automatically sets the modality to "virtual". This is implemented through a database trigger that populates the modalidade field based on the presence of a URL or address.

```mermaid
flowchart TD
Start([Start]) --> CheckURL["Check if url_audiencia_virtual is provided"]
CheckURL --> |Yes| SetVirtual["Set modalidade = 'virtual'"]
CheckURL --> |No| CheckTipo["Check if tipo contains 'videoconfer'"]
CheckTipo --> |Yes| SetVirtual
CheckTipo --> |No| CheckEndereco["Check if endereco_presencial is provided"]
CheckEndereco --> |Yes| SetPresencial["Set modalidade = 'presencial'"]
CheckEndereco --> |No| KeepCurrent["Keep current modalidade"]
SetVirtual --> End([End])
SetPresencial --> End
KeepCurrent --> End
```

**Diagram sources**
- [07_audiencias.sql](file://supabase/schemas/07_audiencias.sql#L100-L140)
- [atualizar-url-virtual.service.ts](file://backend/audiencias/services/atualizar-url-virtual.service.ts#L1-L65)

**Section sources**
- [07_audiencias.sql](file://supabase/schemas/07_audiencias.sql#L100-L140)

## Implementation Details
The implementation of the Audiencias context includes both frontend and backend components that work together to provide a seamless user experience. The system is designed to handle hearing creation, updates, and visualization across different time periods.

### audiencias-visualizacao-semana.tsx Component
The `audiencias-visualizacao-semana.tsx` component provides a week-based calendar view for hearings, allowing users to see their schedule organized by day of the week. This component uses tabs to navigate between days and displays hearings in a table format with relevant information.

```mermaid
classDiagram
class AudienciasVisualizacaoSemana {
+audiencias : Audiencia[]
+isLoading : boolean
+semanaAtual : Date
+usuarios : Usuario[]
+onRefresh : () => void
}
class HoraCell {
+audiencia : Audiencia
}
class DetalhesCell {
+audiencia : Audiencia
+onSuccess : () => void
}
class ObservacoesCell {
+audiencia : Audiencia
+onSuccess : () => void
}
class ResponsavelCell {
+audiencia : Audiencia
+onSuccess : () => void
+usuarios : Usuario[]
}
AudienciasVisualizacaoSemana --> HoraCell : "uses"
AudienciasVisualizacaoSemana --> DetalhesCell : "uses"
AudienciasVisualizacaoSemana --> ObservacoesCell : "uses"
AudienciasVisualizacaoSemana --> ResponsavelCell : "uses"
```

**Diagram sources**
- [audiencias-visualizacao-semana.tsx](file://app/(dashboard)/audiencias/components/audiencias-visualizacao-semana.tsx#L637-L808)
- [audiencias.ts](file://types/domain/audiencias.ts#L25-L76)

**Section sources**
- [audiencias-visualizacao-semana.tsx](file://app/(dashboard)/audiencias/components/audiencias-visualizacao-semana.tsx#L1-L808)

### Backend Services
The backend services for the Audiencias context handle the core business logic for creating, updating, and listing hearings. These services are implemented in TypeScript and use Supabase for database operations.

#### Hearing Creation
The `criar-audiencia.service.ts` service handles the creation of new hearings. It validates the input parameters, retrieves necessary data from related entities, and inserts the new hearing into the database.

```mermaid
sequenceDiagram
participant Frontend as "Frontend"
participant Backend as "Backend"
participant Database as "Database"
Frontend->>Backend : POST /api/audiencias
Backend->>Database : Validate processo exists
Database-->>Backend : Processo data
Backend->>Database : Validate tipo_audiencia exists (if provided)
Database-->>Backend : Confirmation
Backend->>Database : Validate sala_audiencia exists (if provided)
Database-->>Backend : Sala data
Backend->>Database : Insert audiencia
Database-->>Backend : New audiencia ID
Backend-->>Frontend : 201 Created with ID
```

**Diagram sources**
- [criar-audiencia.service.ts](file://backend/audiencias/services/criar-audiencia.service.ts#L1-L110)
- [route.ts](file://app/api/audiencias/route.ts#L315-L499)

**Section sources**
- [criar-audiencia.service.ts](file://backend/audiencias/services/criar-audiencia.service.ts#L1-L110)

## Integration with Acervo Context
The Audiencias context integrates with the Acervo context to link hearings to specific legal processes. This integration is achieved through the `processo_id` field in the Audiencia entity, which references the acervo table.

When a new hearing is created, the system retrieves the necessary process information from the Acervo context to populate fields such as `numero_processo`, `trt`, `grau`, and party names. This ensures that the hearing is properly linked to its corresponding legal process and that all relevant information is available in the Audiencias context.

```mermaid
erDiagram
ACERVO {
bigint id PK
text numero_processo
text trt
text grau
text polo_ativo_nome
text polo_passivo_nome
bigint orgao_julgador_id FK
}
AUDIENCIAS {
bigint id PK
bigint processo_id FK
bigint advogado_id FK
timestamptz data_inicio
timestamptz data_fim
text modalidade
text status
bigint tipo_audiencia_id FK
bigint sala_audiencia_id FK
bigint responsavel_id FK
}
TIPO_AUDIENCIA {
bigint id PK
text descricao
text codigo
boolean is_virtual
}
SALA_AUDIENCIA {
bigint id PK
text nome
text trt
}
USUARIOS {
bigint id PK
text nomeExibicao
boolean ativo
}
ACERVO ||--o{ AUDIENCIAS : "has"
TIPO_AUDIENCIA ||--o{ AUDIENCIAS : "has"
SALA_AUDIENCIA ||--o{ AUDIENCIAS : "has"
USUARIOS ||--o{ AUDIENCIAS : "responsible for"
```

**Diagram sources**
- [07_audiencias.sql](file://supabase/schemas/07_audiencias.sql#L4-L46)
- [04_acervo.sql](file://supabase/schemas/04_acervo.sql#L1-L20)

**Section sources**
- [criar-audiencia.service.ts](file://backend/audiencias/services/criar-audiencia.service.ts#L13-L17)

## Unique Aspects of the Audiencias Context
The Audiencias context has several unique aspects that distinguish it from other domains in the application. These include its handling of both presential and virtual hearings, its own terminology and model, and its specialized user interface components.

### Handling Both Presential and Virtual Hearings
One of the key features of the Audiencias context is its ability to handle both presential and virtual hearings. The system uses the `modalidade` field to distinguish between these types, with values of "presencial", "virtual", or "hibrida" (hybrid). For virtual hearings, the system stores the URL in the `url_audiencia_virtual` field, while presential hearings have their address stored in the `endereco_presencial` JSON field.

The system automatically determines the hearing modality based on the presence of a URL or address, ensuring consistency and reducing the chance of errors. This automatic determination is implemented through a database trigger that runs before insert or update operations.

### Maintaining Its Own Terminology and Model
The Audiencias context maintains its own terminology and model separate from other domains. This is evident in the use of specific terms like "audiencia", "sala_audiencia", and "tipo_audiencia" that are specific to this context. The model is designed to capture all the relevant information about a hearing without depending on other contexts for core functionality.

This separation of concerns allows the Audiencias context to evolve independently of other domains, making it easier to add new features or modify existing ones without affecting other parts of the system.

## Conclusion
The Audiencias bounded context provides a comprehensive solution for managing court hearings within the Sinesys application. By implementing a robust domain model, clear business rules, and seamless integration with the Acervo context, the system enables users to effectively schedule, track, and manage hearings. The context's ability to handle both presential and virtual hearings, along with its specialized user interface components, makes it a powerful tool for legal professionals. The separation of concerns and maintenance of its own terminology ensure that the Audiencias context can evolve independently, providing a solid foundation for future enhancements.