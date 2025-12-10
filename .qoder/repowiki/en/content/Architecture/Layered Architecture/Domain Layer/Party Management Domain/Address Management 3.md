# Address Management

<cite>
**Referenced Files in This Document**   
- [enderecos-persistence.service.ts](file://backend/enderecos/services/enderecos-persistence.service.ts)
- [endereco-persistence.service.ts](file://backend/enderecos/services/persistence/endereco-persistence.service.ts)
- [enderecos-types.ts](file://backend/types/partes/enderecos-types.ts)
- [enderecos.ts](file://types/domain/enderecos.ts)
- [enderecos.sql](file://supabase/schemas/15_enderecos.sql)
- [sincronizar-entidades-enderecos.ts](file://scripts/sincronizacao/sincronizar-entidades-enderecos.ts)
- [viacep.ts](file://app/_lib/utils/viacep.ts)
- [enderecos-persistence.service.ts](file://backend/partes/services/enderecos-persistence.service.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Data Model](#data-model)
3. [Address Associations](#address-associations)
4. [Validation Rules](#validation-rules)
5. [Lifecycle Management](#lifecycle-management)
6. [Persistence and Integration](#persistence-and-integration)
7. [Data Consistency and Geolocation](#data-consistency-and-geolocation)
8. [External Service Integration](#external-service-integration)

## Introduction
The Address Management system in Sinesys provides a comprehensive solution for managing physical and mailing addresses for all parties involved in legal processes. This system handles addresses for clients, opposing parties, representatives, and third parties through a unified data model. The Enderecos entity serves as the central component for storing and managing address information with robust validation, lifecycle management, and integration capabilities. The system ensures data consistency across different legal processes while providing seamless integration with external services like ViaCEP for address validation and geolocation services for precise location tracking.

**Section sources**
- [enderecos-persistence.service.ts](file://backend/enderecos/services/enderecos-persistence.service.ts#L1-L517)
- [enderecos.sql](file://supabase/schemas/15_enderecos.sql#L1-L94)

## Data Model
The Enderecos entity represents a physical address associated with various party types in the Sinesys system. The data model is designed to capture comprehensive address information while maintaining flexibility for different use cases and integration requirements.

```mermaid
erDiagram
ENDERECOS {
bigint id PK
bigint id_pje
text entidade_tipo UK
bigint entidade_id UK
text trt
text grau
text numero_processo
text logradouro
text numero
text complemento
text bairro
text cep
integer id_municipio_pje
text municipio
text municipio_ibge
integer estado_id_pje
text estado_sigla
text estado_descricao
text estado
integer pais_id_pje
text pais_codigo
text pais_descricao
text pais
jsonb classificacoes_endereco
boolean correspondencia
text situacao
bigint id_usuario_cadastrador_pje
timestamp data_alteracao_pje
jsonb dados_pje_completo
boolean ativo
timestamp created_at
timestamp updated_at
}
ENDERECOS ||--o{ CLIENTES : "cliente"
ENDERECOS ||--o{ PARTES_CONTRARIAS : "parte_contraria"
ENDERECOS ||--o{ TERCEIROS : "terceiro"
```

**Diagram sources**
- [enderecos.sql](file://supabase/schemas/15_enderecos.sql#L6-L94)
- [enderecos.ts](file://types/domain/enderecos.ts#L30-L63)

**Section sources**
- [enderecos.ts](file://types/domain/enderecos.ts#L30-L63)
- [enderecos.sql](file://supabase/schemas/15_enderecos.sql#L6-L94)

## Address Associations
The Address Management system establishes relationships between addresses and different party types through a polymorphic association pattern. This design allows addresses to be linked to clients, opposing parties, representatives, and third parties while maintaining data integrity and efficient querying capabilities.

```mermaid
graph TD
A[Enderecos Entity] --> B[Clientes]
A --> C[Partes Contrárias]
A --> D[Terceiros]
A --> E[Representantes]
B --> F[Party Management Service]
C --> F
D --> F
E --> F
F --> G[Address Persistence Service]
G --> H[Database]
style A fill:#4CAF50,stroke:#388E3C
style B fill:#2196F3,stroke:#1976D2
style C fill:#2196F3,stroke:#1976D2
style D fill:#2196F3,stroke:#1976D2
style E fill:#2196F3,stroke:#1976D2
style F fill:#FF9800,stroke:#F57C00
style G fill:#9C27B0,stroke:#7B1FA2
style H fill:#607D8B,stroke:#455A64
```

**Diagram sources**
- [enderecos-persistence.service.ts](file://backend/enderecos/services/enderecos-persistence.service.ts#L135-L172)
- [enderecos-persistence.service.ts](file://backend/partes/services/enderecos-persistence.service.ts#L117-L158)

**Section sources**
- [enderecos-persistence.service.ts](file://backend/enderecos/services/enderecos-persistence.service.ts#L135-L172)
- [enderecos-persistence.service.ts](file://backend/partes/services/enderecos-persistence.service.ts#L117-L158)

## Validation Rules
The Address Management system implements comprehensive validation rules to ensure data quality and consistency. These rules cover mandatory field requirements, format validation, and business logic constraints.

### Mandatory Field Requirements
The system requires specific fields to be present for address creation and updates. The validation process checks for the presence of essential information while allowing flexibility for incomplete records with appropriate warnings.

```mermaid
flowchart TD
Start([Address Creation]) --> ValidateEntity["Validate Entity Type and ID"]
ValidateEntity --> EntityValid{"Entity Valid?"}
EntityValid --> |No| ReturnError["Return Error: Entity Required"]
EntityValid --> |Yes| ValidateMinFields["Validate Minimum Fields"]
ValidateMinFields --> MinFields{"At least one of: <br>Logradouro, Municipio, CEP"}
MinFields --> |No| LogWarning["Log Warning: Incomplete Address"]
MinFields --> |Yes| ValidateFormat["Validate Field Formats"]
ValidateFormat --> CepValid{"CEP Format Valid?"}
CepValid --> |No| ReturnError
CepValid --> |Yes| UfValid{"UF Valid?"}
UfValid --> |No| ReturnError
UfValid --> |Yes| ProcessAddress["Process Address"]
ProcessAddress --> End([Address Created])
ReturnError --> End
```

**Diagram sources**
- [enderecos-persistence.service.ts](file://backend/enderecos/services/enderecos-persistence.service.ts#L139-L152)
- [enderecos-persistence.service.ts](file://backend/partes/services/enderecos-persistence.service.ts#L121-L137)

### ZIP Code Format Validation
The system implements strict validation for Brazilian ZIP code (CEP) formats, ensuring that all ZIP codes follow the standard 8-digit pattern without formatting characters.

```mermaid
flowchart TD
Start([CEP Input]) --> RemoveFormat["Remove Non-Numeric Characters"]
RemoveFormat --> CheckLength{"8 Digits?"}
CheckLength --> |No| ReturnInvalid["Return Invalid CEP"]
CheckLength --> |Yes| Normalize["Normalize CEP"]
Normalize --> Store["Store Cleaned CEP"]
Store --> FormatDisplay["Format for Display: XXXXX-XXX"]
FormatDisplay --> End([Valid CEP])
ReturnInvalid --> End
```

**Diagram sources**
- [enderecos-persistence.service.ts](file://backend/enderecos/services/persistence/endereco-persistence.service.ts#L28-L31)
- [viacep.ts](file://app/_lib/utils/viacep.ts#L41-L46)

**Section sources**
- [enderecos-persistence.service.ts](file://backend/enderecos/services/persistence/endereco-persistence.service.ts#L28-L31)
- [enderecos-persistence.service.ts](file://backend/partes/services/enderecos-persistence.service.ts#L26-L32)
- [viacep.ts](file://app/_lib/utils/viacep.ts#L41-L46)

## Lifecycle Management
The Address Management system implements a comprehensive lifecycle management approach for address records, handling creation, updates, and deletion while maintaining data integrity across different legal processes.

```mermaid
stateDiagram-v2
[*] --> Inactive
Inactive --> Active : Create Address
Active --> Active : Update Address
Active --> Inactive : Soft Delete
Inactive --> Active : Reactivate
Active --> Deleted : Hard Delete
Inactive --> Deleted : Hard Delete
note right of Active
Default state for new addresses
Can be updated or soft deleted
end note
note right of Inactive
Soft deleted addresses
Can be reactivated
Not shown in most queries
end note
note right of Deleted
Permanently removed addresses
Cannot be recovered
end note
```

**Diagram sources**
- [enderecos-persistence.service.ts](file://backend/enderecos/services/enderecos-persistence.service.ts#L453-L485)
- [enderecos-persistence.service.ts](file://backend/enderecos/services/enderecos-persistence.service.ts#L489-L515)

**Section sources**
- [enderecos-persistence.service.ts](file://backend/enderecos/services/enderecos-persistence.service.ts#L453-L515)

## Persistence and Integration
The Address Management system integrates with party management services through dedicated persistence services that handle CRUD operations and maintain data consistency across the application.

```mermaid
sequenceDiagram
participant UI as "User Interface"
participant API as "API Layer"
participant Service as "Enderecos Service"
participant DB as "Database"
UI->>API : Create Address Request
API->>Service : criarEndereco(params)
Service->>Service : Validate Input
Service->>DB : INSERT INTO enderecos
DB-->>Service : Return Created Record
Service-->>API : Success Response
API-->>UI : Address Created
UI->>API : Update Address Request
API->>Service : atualizarEndereco(params)
Service->>DB : UPDATE enderecos WHERE id
DB-->>Service : Return Updated Record
Service-->>API : Success Response
API-->>UI : Address Updated
UI->>API : List Addresses Request
API->>Service : listarEnderecos(params)
Service->>DB : SELECT FROM enderecos
DB-->>Service : Return Address List
Service-->>API : List Response
API-->>UI : Display Addresses
```

**Diagram sources**
- [enderecos-persistence.service.ts](file://backend/enderecos/services/enderecos-persistence.service.ts#L135-L172)
- [enderecos-persistence.service.ts](file://backend/enderecos/services/enderecos-persistence.service.ts#L184-L222)

**Section sources**
- [enderecos-persistence.service.ts](file://backend/enderecos/services/enderecos-persistence.service.ts#L135-L222)
- [sincronizar-entidades-enderecos.ts](file://scripts/sincronizacao/sincronizar-entidades-enderecos.ts#L413-L435)

## Data Consistency and Geolocation
The Address Management system ensures data consistency through various mechanisms and provides geolocation capabilities for precise address tracking.

### Data Consistency Mechanisms
The system implements several strategies to maintain data consistency across different components and services:

1. **Unique Index Constraints**: Prevents duplicate addresses by enforcing uniqueness on (id_pje, entidade_tipo, entidade_id) combinations
2. **Soft Delete Pattern**: Uses an 'ativo' boolean flag instead of physical deletion to maintain historical data
3. **Synchronization Scripts**: Regular synchronization processes ensure consistency between MongoDB capture logs and PostgreSQL database
4. **Type Safety**: Comprehensive TypeScript interfaces ensure consistent data structures across frontend and backend

### Geolocation Considerations
The system supports geolocation through browser-based GPS services, allowing for precise location capture during address verification processes. The geolocation data is stored alongside the address information for audit and verification purposes.

```mermaid
flowchart TD
A[Geolocation Request] --> B{Permission Granted?}
B --> |No| C[Show Permission Instructions]
B --> |Yes| D[Get GPS Coordinates]
D --> E{Accuracy > 100m?}
E --> |Yes| F[Show Accuracy Warning]
E --> |No| G[Store Coordinates]
F --> G
G --> H[Display on Map]
H --> I[Save with Address]
I --> J[End]
```

**Diagram sources**
- [capture/geolocation-step.tsx](file://components/assinatura-digital/capture/geolocation-step.tsx#L271-L304)
- [enderecos.sql](file://supabase/schemas/15_enderecos.sql#L49-L52)

**Section sources**
- [capture/geolocation-step.tsx](file://components/assinatura-digital/capture/geolocation-step.tsx#L271-L319)
- [enderecos.sql](file://supabase/schemas/15_enderecos.sql#L49-L52)

## External Service Integration
The Address Management system integrates with external services to enhance functionality and data quality, particularly through the ViaCEP service for address validation and auto-completion.

### ViaCEP Integration
The system integrates with ViaCEP, a free web service for Brazilian ZIP code (CEP) lookup, to provide auto-completion of address fields in forms. This integration improves data entry accuracy and user experience.

```mermaid
sequenceDiagram
participant Form as "Form Component"
participant Utils as "ViaCEP Utils"
participant API as "ViaCEP API"
Form->>Utils : buscarEnderecoPorCep(cep)
Utils->>Utils : validarCep(cep)
Utils->>Utils : limparCep(cep)
Utils->>API : HTTP GET /ws/{cep}/json/
API-->>Utils : Return Address Data
Utils->>Form : Return Formatted Address
Form->>Form : Auto-fill Fields
```

**Diagram sources**
- [viacep.ts](file://app/_lib/utils/viacep.ts#L75-L106)
- [dynamic-form-renderer.tsx](file://components/assinatura-digital/form/dynamic-form-renderer.tsx#L129-L150)

**Section sources**
- [viacep.ts](file://app/_lib/utils/viacep.ts#L75-L106)
- [ajuda/desenvolvimento/integracao-viacep/page.tsx](file://app/ajuda/desenvolvimento/integracao-viacep/page.tsx#L18-L288)
- [dynamic-form-renderer.tsx](file://components/assinatura-digital/form/dynamic-form-renderer.tsx#L129-L150)