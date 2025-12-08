# Signature Components

<cite>
**Referenced Files in This Document**   
- [captura-foto-step.tsx](file://components/assinatura-digital/capture/captura-foto-step.tsx)
- [geolocation-step.tsx](file://components/assinatura-digital/capture/geolocation-step.tsx)
- [canvas-assinatura.tsx](file://components/assinatura-digital/signature/canvas-assinatura.tsx)
- [FieldMappingEditor.tsx](file://components/assinatura-digital/editor/FieldMappingEditor.tsx)
- [dynamic-form-step.tsx](file://components/assinatura-digital/form/dynamic-form-step.tsx)
- [assinatura-manuscrita-step.tsx](file://components/assinatura-digital/form/assinatura-manuscrita-step.tsx)
- [signature.service.ts](file://backend/assinatura-digital/services/signature.service.ts)
- [templates.service.ts](file://backend/assinatura-digital/services/templates.service.ts)
- [template.types.ts](file://types/assinatura-digital/template.types.ts)
- [form-schema.types.ts](file://types/assinatura-digital/form-schema.types.ts)
- [business.validations.ts](file://app/_lib/assinatura-digital/validations/business.validations.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Components Overview](#core-components-overview)
3. [Signature Capture Workflow](#signature-capture-workflow)
4. [Template Management System](#template-management-system)
5. [Form Building and Data Collection](#form-building-and-data-collection)
6. [Digital Signature Workflow](#digital-signature-workflow)
7. [Domain Models and Data Structures](#domain-models-and-data-structures)
8. [Integration with Document Management](#integration-with-document-management)
9. [Common Issues and Solutions](#common-issues-and-solutions)
10. [Configuration Options and Parameters](#configuration-options-and-parameters)

## Introduction
The Sinesys signature components provide a comprehensive digital signature solution for legal and business workflows. This system enables users to capture signatures, manage templates, build dynamic forms, and process documents through a multi-step workflow. The architecture integrates frontend components with backend services to ensure secure, reliable, and compliant digital signature processes. The components are designed to work seamlessly with the document management system and authentication services, providing a complete solution for digital document processing.

## Core Components Overview
The signature system consists of several key components that work together to provide a complete digital signature solution. These components include signature capture, template management, form building, and digital signature workflow processing. Each component has a specific role in the overall system and interacts with other components to provide a seamless user experience.

### CaptureFotoStep
The CaptureFotoStep component handles the photo capture functionality for identity verification. It uses the browser's camera API to capture a selfie from the user, which is then validated for quality before being stored in the application state. The component provides real-time feedback on photo quality and guides users through the capture process.

```mermaid
flowchart TD
A[Start Photo Capture] --> B{Camera Available?}
B --> |Yes| C[Display Camera Interface]
B --> |No| D[Show Error Message]
C --> E[Capture Photo]
E --> F[Validate Photo Quality]
F --> |Valid| G[Store Photo in State]
F --> |Invalid| H[Show Quality Issues]
G --> I[Proceed to Next Step]
```

**Diagram sources**
- [captura-foto-step.tsx](file://components/assinatura-digital/capture/captura-foto-step.tsx)

**Section sources**
- [captura-foto-step.tsx](file://components/assinatura-digital/capture/captura-foto-step.tsx)

### FieldMappingEditor
The FieldMappingEditor component provides a visual interface for creating and editing document templates. Users can drag and drop fields onto a PDF canvas, configure field properties, and define the layout of signature fields. The editor supports multiple field types including text, rich text, and signature fields.

```mermaid
classDiagram
class FieldMappingEditor {
+template : Template
+mode : 'edit' | 'create'
+fields : EditorField[]
+selectedField : EditorField | null
+editorMode : 'select' | 'add_text' | 'add_image' | 'add_rich_text'
+zoom : number
+currentPage : number
+totalPages : number
+isLoading : boolean
+pdfUrl : string | null
+hasUnsavedChanges : boolean
+showExitConfirmation : boolean
+showProperties : boolean
+showTemplateInfo : boolean
+showReplacePdf : boolean
+showRichTextEditor : boolean
+editingRichTextField : EditorField | null
+isGeneratingPreview : boolean
+showPreviewModal : boolean
+previewPdfUrl : string | null
+uploadedFile : File | null
+uploadedFilePreview : string | null
+createdTemplate : Template | null
+dragState : DragState
+toolbarPosition : {x : number, y : number}
+toolbarDragging : boolean
+toolbarDragOffset : {x : number, y : number}
+canvasRef : RefObject<HTMLDivElement>
+canvasSize : {width : number, height : number}
}
class EditorField {
+id : string
+template_id : string
+nome : string
+variavel : string | undefined
+tipo : TipoCampo
+posicao : PosicaoCampo
+estilo : EstiloCampo
+obrigatorio : boolean
+ordem : number
+conteudo_composto : ConteudoComposto | undefined
+criado_em : Date
+atualizado_em : Date
+isSelected : boolean
+isDragging : boolean
+justAdded : boolean
}
class DragState {
+isDragging : boolean
+fieldId : string | null
+startX : number
+startY : number
+currentX : number
+currentY : number
+offsetX : number
+offsetY : number
+hasMoved : boolean
+mode : 'move' | 'resize'
+resizeHandle : ResizeHandle | null
+startWidth : number
+startHeight : number
}
FieldMappingEditor --> EditorField : "contains"
FieldMappingEditor --> DragState : "uses"
```

**Diagram sources**
- [FieldMappingEditor.tsx](file://components/assinatura-digital/editor/FieldMappingEditor.tsx)

**Section sources**
- [FieldMappingEditor.tsx](file://components/assinatura-digital/editor/FieldMappingEditor.tsx)

### CanvasAssinatura
The CanvasAssinatura component provides a canvas for users to draw their handwritten signature. It captures the signature as a base64-encoded PNG image and collects metrics about the signing process, including drawing time, stroke count, and point density. The component includes validation to ensure the signature meets quality requirements.

```mermaid
sequenceDiagram
participant User as "User"
participant Canvas as "CanvasAssinatura"
participant Store as "FormularioStore"
User->>Canvas : Begin drawing signature
Canvas->>Canvas : Capture stroke data
Canvas->>Canvas : Update drawing metrics
User->>Canvas : Complete signature
Canvas->>Canvas : Generate base64 image
Canvas->>Store : Save signature data
Store->>Store : Update application state
Canvas->>User : Display clear button
User->>Canvas : Click clear button
Canvas->>Canvas : Clear canvas and reset metrics
```

**Diagram sources**
- [canvas-assinatura.tsx](file://components/assinatura-digital/signature/canvas-assinatura.tsx)

**Section sources**
- [canvas-assinatura.tsx](file://components/assinatura-digital/signature/canvas-assinatura.tsx)

## Signature Capture Workflow
The signature capture workflow consists of multiple steps that collect user data and validate identity before allowing document signing. This multi-step process ensures data integrity and compliance with digital signature regulations.

### Geolocation Capture
The geolocation capture step uses the browser's Geolocation API to obtain the user's GPS coordinates. This information is used for document validation and security purposes. The component handles various error conditions and provides guidance to users on enabling location permissions.

```mermaid
flowchart TD
A[Start Geolocation Capture] --> B{Geolocation API Available?}
B --> |Yes| C[Request Location Permission]
B --> |No| D[Show Browser Not Supported]
C --> E{Permission Granted?}
E --> |Yes| F[Get Current Position]
E --> |No| G[Show Permission Instructions]
F --> H[Validate Location Accuracy]
H --> |Valid| I[Store Location Data]
H --> |Invalid| J[Show Accuracy Warning]
I --> K[Proceed to Next Step]
```

**Diagram sources**
- [geolocation-step.tsx](file://components/assinatura-digital/capture/geolocation-step.tsx)

**Section sources**
- [geolocation-step.tsx](file://components/assinatura-digital/capture/geolocation-step.tsx)

### Photo Quality Validation
The photo quality validation process ensures that captured images meet minimum requirements for identity verification. The validation checks include image resolution, lighting conditions, and facial visibility. This process helps prevent fraud and ensures document integrity.

```mermaid
flowchart TD
A[Photo Captured] --> B[Check Image Resolution]
B --> C{Resolution Sufficient?}
C --> |No| D[Show Resolution Error]
C --> |Yes| E[Analyze Lighting Conditions]
E --> F{Lighting Adequate?}
F --> |No| G[Show Lighting Warning]
F --> |Yes| H[Detect Face in Image]
H --> I{Face Detected?}
I --> |No| J[Show Face Detection Error]
I --> |Yes| K[Validate Face Position]
K --> L{Face Centered?}
L --> |No| M[Show Position Guidance]
L --> |Yes| N[Approve Photo Quality]
```

**Section sources**
- [business.validations.ts](file://app/_lib/assinatura-digital/validations/business.validations.ts)

## Template Management System
The template management system allows administrators to create, edit, and manage document templates for digital signatures. Templates define the structure and content of documents, including signature fields, text fields, and other interactive elements.

### Template Creation
The template creation process involves uploading a PDF document and mapping interactive fields onto it. Administrators can define various field types, set validation rules, and configure field properties. The system supports both visual editing and programmatic template creation.

```mermaid
classDiagram
class Template {
+id : number
+template_uuid : string
+nome : string
+descricao : string | null
+arquivo_original : string
+arquivo_nome : string
+arquivo_tamanho : number
+status : StatusTemplate
+versao : number
+ativo : boolean
+campos : TemplateCampo[]
+conteudo_markdown : string | null
+criado_por : string | null
+created_at : string
+updated_at : string
}
class TemplateCampo {
+id : string
+template_id : string
+nome : string
+variavel : string | undefined
+tipo : TipoCampo
+posicao : PosicaoCampo
+estilo : EstiloCampo
+obrigatorio : boolean
+ordem : number
+conteudo_composto : ConteudoComposto | undefined
+criado_em : Date
+atualizado_em : Date
}
class PosicaoCampo {
+x : number
+y : number
+width : number
+height : number
+pagina : number
}
class EstiloCampo {
+fonte : string
+tamanho_fonte : number
+cor : string
+alinhamento : string
}
Template --> TemplateCampo : "contains"
TemplateCampo --> PosicaoCampo : "has"
TemplateCampo --> EstiloCampo : "has"
```

**Diagram sources**
- [template.types.ts](file://types/assinatura-digital/template.types.ts)

**Section sources**
- [templates.service.ts](file://backend/assinatura-digital/services/templates.service.ts)
- [template.types.ts](file://types/assinatura-digital/template.types.ts)

### Template Services
The backend template services provide CRUD operations for managing templates. These services interact with the database to store and retrieve template data, validate inputs, and enforce business rules. The services are exposed through API endpoints for frontend consumption.

```mermaid
sequenceDiagram
participant Frontend as "Frontend"
participant API as "API Endpoint"
participant Service as "TemplatesService"
participant Database as "Supabase"
Frontend->>API : Create Template Request
API->>Service : Call createTemplate()
Service->>Database : Insert Template Record
Database-->>Service : Return Created Template
Service-->>API : Return Template Data
API-->>Frontend : Return Success Response
Frontend->>API : List Templates Request
API->>Service : Call listTemplates()
Service->>Database : Query Templates
Database-->>Service : Return Template List
Service-->>API : Return Template List
API-->>Frontend : Return Template List
```

**Diagram sources**
- [templates.service.ts](file://backend/assinatura-digital/services/templates.service.ts)

**Section sources**
- [templates.service.ts](file://backend/assinatura-digital/services/templates.service.ts)

## Form Building and Data Collection
The form building system enables the creation of dynamic forms for collecting user data. These forms are defined using JSON schemas that specify fields, validation rules, and layout properties. The system supports various field types and conditional logic.

### Dynamic Form Schema
The dynamic form schema defines the structure and behavior of forms. It includes sections, fields, validation rules, and cross-field validations. The schema is used to render forms dynamically and validate user input.

```mermaid
classDiagram
class DynamicFormSchema {
+id : string
+version : string
+sections : FormSectionSchema[]
+globalValidations : CrossFieldValidation[] | undefined
}
class FormSectionSchema {
+id : string
+title : string
+description : string | undefined
+fields : FormFieldSchema[]
+collapsible : boolean | undefined
+defaultCollapsed : boolean | undefined
}
class FormFieldSchema {
+id : string
+name : string
+label : string
+type : FormFieldType
+validation : ValidationRule | undefined
+placeholder : string | undefined
+defaultValue : string | number | boolean | undefined
+options : FormFieldOption[] | undefined
+conditional : ConditionalRule | undefined
+gridColumns : 1 | 2 | 3 | undefined
+helpText : string | undefined
+disabled : boolean | undefined
}
class ValidationRule {
+required : boolean | undefined
+min : number | undefined
+max : number | undefined
+pattern : string | undefined
+email : boolean | undefined
+custom : string | undefined
+message : string | undefined
}
class ConditionalRule {
+field : string
+operator : '=' | '!=' | '>' | '<' | 'contains' | 'empty' | 'notEmpty'
+value : string | number | boolean | undefined
}
DynamicFormSchema --> FormSectionSchema : "contains"
FormSectionSchema --> FormFieldSchema : "contains"
FormFieldSchema --> ValidationRule : "has"
FormFieldSchema --> ConditionalRule : "has"
```

**Diagram sources**
- [form-schema.types.ts](file://types/assinatura-digital/form-schema.types.ts)

**Section sources**
- [form-schema.types.ts](file://types/assinatura-digital/form-schema.types.ts)
- [dynamic-form-step.tsx](file://components/assinatura-digital/form/dynamic-form-step.tsx)

### Form Data Processing
The form data processing workflow collects user input, validates it against defined rules, and prepares it for storage or further processing. The system handles data enrichment, transformation, and ordering to ensure consistency and usability.

```mermaid
flowchart TD
A[User Submits Form] --> B[Collect Form Data]
B --> C[Validate Individual Fields]
C --> D{All Fields Valid?}
D --> |No| E[Show Validation Errors]
D --> |Yes| F[Apply Cross-Field Validations]
F --> G{All Validations Pass?}
G --> |No| H[Show Cross-Field Errors]
G --> |Yes| I[Enrich Form Data]
I --> J[Reorder Data Fields]
J --> K[Store Data in Application State]
K --> L[Proceed to Next Step]
```

**Section sources**
- [dynamic-form-step.tsx](file://components/assinatura-digital/form/dynamic-form-step.tsx)

## Digital Signature Workflow
The digital signature workflow orchestrates the complete process of document signing, from initiation to finalization. This workflow ensures that all required data is collected, validated, and securely stored.

### Signature Finalization
The signature finalization process combines all collected data, generates the final document, and stores it securely. This process includes generating a unique protocol number, creating PDF documents, and recording the signature event in the database.

```mermaid
sequenceDiagram
participant Frontend as "Frontend"
participant API as "API Endpoint"
participant Service as "SignatureService"
participant Storage as "Storage Service"
participant Database as "Supabase"
Frontend->>API : Finalize Signature Request
API->>Service : Call finalizeSignature()
Service->>Service : Validate Input Data
Service->>Service : Build Protocol Number
Service->>Storage : Store Signature Image
Storage-->>Service : Return Signature URL
Service->>Storage : Store Photo Image (if present)
Storage-->>Service : Return Photo URL
Service->>Service : Generate PDF Document
Service->>Storage : Store PDF Document
Storage-->>Service : Return PDF URL
Service->>Database : Insert Signature Record
Database-->>Service : Return Record ID
Service-->>API : Return Success Response
API-->>Frontend : Return Document URL
```

**Diagram sources**
- [signature.service.ts](file://backend/assinatura-digital/services/signature.service.ts)

**Section sources**
- [signature.service.ts](file://backend/assinatura-digital/services/signature.service.ts)
- [assinatura-manuscrita-step.tsx](file://components/assinatura-digital/form/assinatura-manuscrita-step.tsx)

### Data Security and Validation
The system implements multiple layers of data security and validation to ensure the integrity and authenticity of signed documents. This includes client-side validation, server-side validation, and security metadata collection.

```mermaid
flowchart TD
A[User Input] --> B[Client-Side Validation]
B --> C{Valid?}
C --> |No| D[Show Client Errors]
C --> |Yes| E[Collect Security Metadata]
E --> F[IP Address]
E --> G[User Agent]
E --> H[Geolocation]
E --> I[Device Information]
F --> J[Send to Server]
G --> J
H --> J
I --> J
J --> K[Server-Side Validation]
K --> L{Valid?}
L --> |No| M[Reject Request]
L --> |Yes| N[Process Signature]
```

**Section sources**
- [assinatura-manuscrita-step.tsx](file://components/assinatura-digital/form/assinatura-manuscrita-step.tsx)
- [business.validations.ts](file://app/_lib/assinatura-digital/validations/business.validations.ts)

## Domain Models and Data Structures
The signature system uses well-defined domain models and data structures to represent documents, templates, forms, and signatures. These models ensure consistency across the application and facilitate data exchange between components.

### Template Data Model
The template data model defines the structure of document templates, including metadata, file information, and field mappings. This model is used both in the frontend and backend to represent templates consistently.

```mermaid
erDiagram
TEMPLATE {
number id PK
string template_uuid
string nome
string descricao
string arquivo_original
string arquivo_nome
number arquivo_tamanho
string status
number versao
boolean ativo
json campos
string conteudo_markdown
string criado_por
timestamp created_at
timestamp updated_at
}
TEMPLATE_CAMPO {
string id PK
number template_id FK
string nome
string variavel
string tipo
json posicao
json estilo
boolean obrigatorio
number ordem
json conteudo_composto
timestamp criado_em
timestamp atualizado_em
}
TEMPLATE ||--o{ TEMPLATE_CAMPO : "contains"
```

**Section sources**
- [template.types.ts](file://types/assinatura-digital/template.types.ts)
- [templates.service.ts](file://backend/assinatura-digital/services/templates.service.ts)

### Form Data Model
The form data model represents the structure of dynamic forms, including sections, fields, and validation rules. This model enables flexible form creation and consistent data collection.

```mermaid
erDiagram
FORM_SCHEMA {
string id PK
string version
json sections
json globalValidations
}
FORM_SECTION {
string id PK
string title
string description
boolean collapsible
boolean defaultCollapsed
}
FORM_FIELD {
string id PK
string name
string label
string type
json validation
string placeholder
string defaultValue
json options
json conditional
number gridColumns
string helpText
boolean disabled
}
FORM_SCHEMA ||--o{ FORM_SECTION : "contains"
FORM_SECTION ||--o{ FORM_FIELD : "contains"
```

**Section sources**
- [form-schema.types.ts](file://types/assinatura-digital/form-schema.types.ts)

## Integration with Document Management
The signature components integrate seamlessly with the document management system, enabling the creation, storage, and retrieval of signed documents. This integration ensures that all signed documents are properly archived and accessible.

### Document Generation
The document generation process creates PDF documents from templates and user data. This process includes merging template fields with actual values, applying styling, and ensuring document integrity.

```mermaid
flowchart TD
A[Template and Data] --> B[Parse Template Fields]
B --> C[Map Data to Fields]
C --> D[Apply Field Styling]
D --> E[Generate PDF Content]
E --> F[Apply Digital Signature]
F --> G[Add Metadata]
G --> H[Store Document]
H --> I[Return Document URL]
```

**Section sources**
- [signature.service.ts](file://backend/assinatura-digital/services/signature.service.ts)

### Document Storage
Signed documents are stored securely in the document management system with appropriate metadata and access controls. The storage system ensures document integrity and provides reliable access to authorized users.

```mermaid
flowchart TD
A[Generated Document] --> B[Encrypt Document]
B --> C[Add Metadata]
C --> D[Store in Secure Storage]
D --> E[Create Database Record]
E --> F[Set Access Permissions]
F --> G[Return Document Reference]
```

**Section sources**
- [signature.service.ts](file://backend/assinatura-digital/services/signature.service.ts)
- [storage.service.ts](file://backend/assinatura-digital/services/storage.service.ts)

## Common Issues and Solutions
The signature system may encounter various issues during operation. Understanding these common issues and their solutions helps ensure smooth operation and quick resolution of problems.

### Mobile Device Compatibility
Mobile devices present unique challenges for signature capture, including smaller screens, touch input limitations, and varying camera quality. The system addresses these issues through responsive design and adaptive interfaces.

**Solutions:**
- Implement responsive layouts that adapt to screen size
- Optimize touch targets for finger input
- Provide clear instructions for camera positioning
- Support both portrait and landscape orientations
- Implement gesture recognition for canvas navigation

**Section sources**
- [canvas-assinatura.tsx](file://components/assinatura-digital/signature/canvas-assinatura.tsx)
- [captura-foto-step.tsx](file://components/assinatura-digital/capture/captura-foto-step.tsx)

### Signature Quality Issues
Poor signature quality can result from various factors, including rushed signing, small canvas size, or device limitations. The system includes validation to detect and address these issues.

**Solutions:**
- Implement signature quality validation based on stroke count and density
- Provide real-time feedback during signing
- Allow users to clear and retry signatures
- Adjust canvas size based on device capabilities
- Implement minimum signature size requirements

**Section sources**
- [canvas-assinatura.tsx](file://components/assinatura-digital/signature/canvas-assinatura.tsx)
- [business.validations.ts](file://app/_lib/assinatura-digital/validations/business.validations.ts)

## Configuration Options and Parameters
The signature components offer various configuration options and parameters to customize behavior and appearance. These options allow administrators to tailor the system to specific use cases and requirements.

### Template Configuration
Templates can be configured with various parameters that control their behavior and appearance. These parameters include field properties, validation rules, and layout options.

**Configuration Parameters:**
- **Field Position**: X, Y coordinates and dimensions for field placement
- **Field Type**: Text, signature, checkbox, or other input types
- **Validation Rules**: Required, minimum/maximum values, pattern matching
- **Styling Options**: Font, size, color, and alignment
- **Conditional Logic**: Rules for showing/hiding fields based on other values

**Section sources**
- [FieldMappingEditor.tsx](file://components/assinatura-digital/editor/FieldMappingEditor.tsx)
- [template.types.ts](file://types/assinatura-digital/template.types.ts)

### Workflow Configuration
The signature workflow can be configured to include or exclude specific steps based on requirements. This flexibility allows for different signature processes for different document types.

**Configuration Parameters:**
- **Required Steps**: Photo capture, geolocation, signature, etc.
- **Validation Level**: Strictness of data validation
- **Security Metadata**: IP address, user agent, geolocation
- **Document Generation**: Number and type of documents to generate
- **Notification Settings**: Email alerts and status updates

**Section sources**
- [dynamic-form-step.tsx](file://components/assinatura-digital/form/dynamic-form-step.tsx)
- [assinatura-manuscrita-step.tsx](file://components/assinatura-digital/form/assinatura-manuscrita-step.tsx)