# Form Building

<cite>
**Referenced Files in This Document**   
- [formulario-container.tsx](file://components/assinatura-digital/form/formulario-container.tsx)
- [dynamic-form-renderer.tsx](file://components/assinatura-digital/form/dynamic-form-renderer.tsx)
- [form-step-layout.tsx](file://components/assinatura-digital/form/form-step-layout.tsx)
- [formulario-page.tsx](file://components/assinatura-digital/form/formulario-page.tsx)
- [dados-pessoais.tsx](file://components/assinatura-digital/form/dados-pessoais.tsx)
- [verificar-cpf.tsx](file://components/assinatura-digital/form/verificar-cpf.tsx)
- [assinatura-manuscrita-step.tsx](file://components/assinatura-digital/form/assinatura-manuscrita-step.tsx)
- [visualizacao-markdown-step.tsx](file://components/assinatura-digital/form/visualizacao-markdown-step.tsx)
- [visualizacao-pdf-step.tsx](file://components/assinatura-digital/form/visualizacao-pdf-step.tsx)
- [formulario-store.ts](file://app/_lib/stores/assinatura-digital/formulario-store.ts)
- [formulario.types.ts](file://types/assinatura-digital/formulario.types.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Form State Management](#form-state-management)
4. [Step-Based Navigation System](#step-based-navigation-system)
5. [Form Validation and Error Handling](#form-validation-and-error-handling)
6. [Form Data Structure and Processing](#form-data-structure-and-processing)
7. [Integration with Backend Services](#integration-with-backend-services)
8. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
9. [Form Lifecycle and Template Integration](#form-lifecycle-and-template-integration)
10. [Conclusion](#conclusion)

## Introduction
The Sinesys form building system provides a comprehensive solution for creating dynamic, multi-step forms with advanced features including CPF verification, personal data collection, and digital signature capture. The architecture is designed to support complex workflows while maintaining a consistent user experience across different form types and use cases. This document details the implementation of the dynamic form renderer, its state management system, validation mechanisms, and integration with backend services for data persistence.

## Architecture Overview

The form building components in Sinesys follow a modular architecture centered around a state management system that coordinates the multi-step form workflow. The core components work together to provide a seamless experience from form initialization to submission.

```mermaid
graph TD
A[FormularioPage] --> B[FormularioContainer]
B --> C[FormularioStore]
C --> D[Step Configuration]
D --> E[VerificarCPF]
D --> F[DadosPessoais]
D --> G[DynamicFormStep]
D --> H[VisualizacaoStep]
D --> I[AssinaturaManuscritaStep]
D --> J[Sucesso]
C --> K[Form State Management]
K --> L[CPF Data]
K --> M[Personal Data]
K --> N[Action Data]
K --> O[Signature Data]
G --> P[DynamicFormRenderer]
P --> Q[Zod Validation]
H --> R[PDF/Markdown Visualization]
I --> S[Signature Capture]
```

**Diagram sources**
- [formulario-container.tsx](file://components/assinatura-digital/form/formulario-container.tsx)
- [formulario-store.ts](file://app/_lib/stores/assinatura-digital/formulario-store.ts)
- [dynamic-form-renderer.tsx](file://components/assinatura-digital/form/dynamic-form-renderer.tsx)

## Form State Management

The form state is managed through a centralized Zustand store that maintains all data across the multi-step workflow. This approach ensures consistency and enables seamless navigation between steps without data loss.

### State Structure
The `FormularioStore` maintains several key data structures that represent different stages of the form completion process:

- **DadosCPF**: Stores CPF verification results and client existence status
- **DadosPessoaisStore**: Contains personal information including name, contact details, and address
- **DadosAcaoStore**: Holds action-specific data collected through dynamic forms
- **DadosAssinaturaStore**: Manages signature and security metadata
- **StepConfig**: Defines the navigation flow and enabled steps

The store implements a hydration pattern where the `hydrateContext` method resets the state and initializes it with new context data in a single atomic operation, preventing intermediate inconsistent states.

```mermaid
classDiagram
class FormularioStore {
+segmentoId : number | null
+formularioId : number | null
+templateIds : string[] | null
+sessaoId : string | null
+formSchema : DynamicFormSchema | null
+formularioNome : string | null
+segmentoNome : string | null
+formularioFlowConfig : FormularioFlowConfig | null
+cachedTemplates : Map<string, Template>
+etapaAtual : number
+dadosCPF : DadosCPF | null
+dadosPessoais : DadosPessoaisStore | null
+dadosAcao : DadosAcaoStore | null
+dadosVisualizacaoPdf : VisualizacaoPdfData | null
+dadosVisualizacaoMarkdown : VisualizacaoMarkdownData | null
+dadosAssinatura : DadosAssinaturaStore | null
+pdfsGerados : PdfGerado[] | null
+fotoBase64 : string | null
+assinaturaBase64 : string | null
+latitude : number | null
+longitude : number | null
+geolocationAccuracy : number | null
+geolocationTimestamp : string | null
+stepConfigs : StepConfig[] | null
+pdfUrlFinal : string | null
+isLoading : boolean
+isSubmitting : boolean
+hydrateContext(ctx) : void
+setDadosCPF(dados) : void
+setDadosPessoais(dados) : void
+setDadosAcao(dados) : void
+setDadosAssinatura(dados) : void
+proximaEtapa() : void
+etapaAnterior() : void
}
class DadosCPF {
+cpf : string
+clienteExistente : boolean
+clienteId? : number
+dadosCliente? : ClienteAssinaturaDigital
}
class DadosPessoaisStore {
+cliente_id : number
+nome_completo : string
+cpf : string
+rg? : string
+data_nascimento : string
+estado_civil : string
+genero : string
+nacionalidade : string
+email : string
+celular : string
+telefone? : string
+endereco_cep : string
+endereco_logradouro : string
+endereco_numero : string
+endereco_complemento? : string
+endereco_bairro : string
+endereco_cidade : string
+endereco_uf : string
}
class DadosAcaoStore {
+acao_id : number
+[key : string] : unknown
}
class DadosAssinaturaStore {
+assinatura_id : number | null
+assinatura_base64 : string
+foto_base64 : string
+ip_address : string
+user_agent : string
+latitude? : number
+longitude? : number
+geolocation_accuracy? : number
+geolocation_timestamp? : string
+data_assinatura : string
}
class StepConfig {
+id : string
+index : number
+component : string
+required : boolean
+enabled : boolean
}
FormularioStore --> DadosCPF
FormularioStore --> DadosPessoaisStore
FormularioStore --> DadosAcaoStore
FormularioStore --> DadosAssinaturaStore
FormularioStore --> StepConfig
```

**Diagram sources**
- [formulario-store.ts](file://app/_lib/stores/assinatura-digital/formulario-store.ts)
- [formulario.types.ts](file://types/assinatura-digital/formulario.types.ts)

**Section sources**
- [formulario-store.ts](file://app/_lib/stores/assinatura-digital/formulario-store.ts#L9-L213)

## Step-Based Navigation System

The form navigation system implements a dynamic step configuration that adapts to the specific requirements of each form. The `FormularioContainer` component manages the step flow by building a configuration based on the form's requirements.

### Step Configuration
The step configuration is dynamically generated based on the form's flow configuration, which determines which steps are required:

```mermaid
flowchart TD
A[Start] --> B[CPF Verification]
B --> C[Personal Data Collection]
C --> D[Dynamic Form]
D --> E{Visualização}
E --> F[PDF Visualization]
E --> G[Markdown Visualization]
F --> H{Foto Necessária?}
G --> H
H --> |Yes| I[Photo Capture]
H --> |No| J{Geolocation Necessária?}
I --> J
J --> |Yes| K[Geolocation Capture]
J --> |No| L[Signature]
K --> L
L --> M[Success]
```

**Diagram sources**
- [formulario-container.tsx](file://components/assinatura-digital/form/formulario-container.tsx#L39-L87)

The `buildStepConfigs` function in `FormularioContainer` constructs the step configuration array based on the form's requirements for photo capture and geolocation. This allows the system to dynamically include or exclude steps based on the specific form configuration.

Navigation between steps is handled through the `proximaEtapa` and `etapaAnterior` actions in the store, which increment or decrement the `etapaAtual` index. The current step is rendered by matching this index with the corresponding `StepConfig` in the `stepConfigs` array.

### Step Layout Component
The `FormStepLayout` component provides a consistent UI for all form steps, including:
- Step title and description
- Progress indicator showing current step out of total steps
- Navigation buttons for previous and next steps
- Loading states during form submission

The component accepts props to customize behavior, including form ID for submission handling, loading states, and button labels.

**Section sources**
- [formulario-container.tsx](file://components/assinatura-digital/form/formulario-container.tsx#L20-L331)
- [form-step-layout.tsx](file://components/assinatura-digital/form/form-step-layout.tsx#L1-L135)

## Form Validation and Error Handling

The form validation system combines client-side validation with server-side verification to ensure data integrity throughout the form workflow.

### Zod-Based Validation
Dynamic forms use Zod schemas for validation, with the `DynamicFormRenderer` component generating validation rules from the form schema:

```mermaid
sequenceDiagram
participant User as "User"
participant Form as "DynamicFormRenderer"
participant Zod as "Zod Resolver"
participant Store as "FormularioStore"
User->>Form : Enters data
Form->>Zod : Validates on change
Zod-->>Form : Returns validation result
Form->>Form : Updates UI with errors
User->>Form : Submits form
Form->>Zod : Final validation
alt Valid
Zod-->>Form : Success
Form->>Store : Save data
Form->>User : Navigate to next step
else Invalid
Zod-->>Form : Error details
Form->>User : Display validation errors
end
```

**Diagram sources**
- [dynamic-form-renderer.tsx](file://components/assinatura-digital/form/dynamic-form-renderer.tsx#L48-L437)

The validation process includes:
- Real-time validation on field changes (`mode: 'onChange'`)
- Schema generation from dynamic form configuration
- Conditional field rendering based on other field values
- Custom validation functions for business rules

### CPF Verification
The CPF verification step implements a two-phase validation process:
1. Client-side format validation using the `validateCPF` function
2. Server-side existence check via the `verificar-cpf` API endpoint

```mermaid
sequenceDiagram
participant User as "User"
participant Form as "VerificarCPF"
participant API as "verificar-cpf API"
User->>Form : Enters CPF
Form->>Form : Validates format
alt Invalid Format
Form->>User : Display format error
else Valid Format
Form->>API : POST with CPF
API-->>Form : Returns existence status
alt Exists
Form->>Store : Save client data
Form->>User : Show success, proceed
else Does Not Exist
Form->>Store : Mark as new client
Form->>User : Show info, proceed
end
end
```

**Diagram sources**
- [verificar-cpf.tsx](file://components/assinatura-digital/form/verificar-cpf.tsx#L1-L172)

### Personal Data Validation
The personal data collection step implements comprehensive validation for all fields, including:
- CPF format and digit validation
- Date of birth validation (not in future, reasonable age range)
- Email format validation
- Brazilian phone number validation
- CEP (postal code) format validation
- Text length limits for address fields

The validation occurs both on individual field changes and before form submission, with detailed error messages displayed for each invalid field.

**Section sources**
- [dados-pessoais.tsx](file://components/assinatura-digital/form/dados-pessoais.tsx#L1-L760)
- [dynamic-form-renderer.tsx](file://components/assinatura-digital/form/dynamic-form-renderer.tsx#L48-L437)

## Form Data Structure and Processing

The form system processes data through a structured workflow that transforms user input into persisted records.

### Data Flow
The data flows through the system in a sequential manner:

```mermaid
flowchart LR
A[CPF Input] --> B[CPF Verification]
B --> C[Personal Data]
C --> D[Dynamic Form Data]
D --> E[Document Generation]
E --> F[Signature Capture]
F --> G[Final Submission]
```

**Diagram sources**
- [formulario-container.tsx](file://components/assinatura-digital/form/formulario-container.tsx)
- [formulario-store.ts](file://app/_lib/stores/assinatura-digital/formulario-store.ts)

### Data Transformation
When personal data is submitted, the system transforms the form data into a standardized format for storage:

1. CPF is normalized to digits only
2. Phone numbers are normalized to Brazilian format
3. Address data is structured with proper formatting
4. Text fields are validated against length limits

The `mapClienteFormToCliente` function handles this transformation, preparing the data for API submission.

### Document Visualization
The system supports two document visualization methods:

**PDF Visualization:**
- Generates a PDF preview via the `/api/gerar-pdf-preview` endpoint
- Caches the PDF URL with a 5-minute TTL
- Auto-regenerates when underlying data changes

**Markdown Visualization:**
- Processes template Markdown with variable interpolation
- Renders responsive content using ReactMarkdown
- Caches processed content with 5-minute TTL
- Supports multiple templates with selection UI

```mermaid
sequenceDiagram
participant User as "User"
participant Form as "VisualizacaoStep"
participant API as "Backend API"
participant Store as "FormularioStore"
User->>Form : Navigates to visualization
Form->>Store : Check for cached data
alt Has Valid Cache
Store-->>Form : Return cached content
Form->>User : Display document
else No Valid Cache
Form->>API : Fetch template
API-->>Form : Return template
Form->>Form : Process with client data
Form->>Store : Cache processed content
Form->>User : Display document
end
```

**Diagram sources**
- [visualizacao-markdown-step.tsx](file://components/assinatura-digital/form/visualizacao-markdown-step.tsx#L1-L361)
- [visualizacao-pdf-step.tsx](file://components/assinatura-digital/form/visualizacao-pdf-step.tsx#L1-L423)

**Section sources**
- [visualizacao-markdown-step.tsx](file://components/assinatura-digital/form/visualizacao-markdown-step.tsx#L1-L361)
- [visualizacao-pdf-step.tsx](file://components/assinatura-digital/form/visualizacao-pdf-step.tsx#L1-L423)

## Integration with Backend Services

The form system integrates with backend services through a well-defined API contract for data persistence and document generation.

### API Endpoints
Key API endpoints used by the form system:

| Endpoint | Method | Purpose |
|---------|--------|-------|
| `/api/verificar-cpf` | POST | Check if client exists by CPF |
| `/api/salvar-cliente` | POST | Save or update client personal data |
| `/api/gerar-pdf-preview` | POST | Generate document preview |
| `/api/finalizar-assinatura` | POST | Complete signature process and generate final documents |

### Data Persistence
The form data is persisted through a multi-step process:

1. **CPF Verification**: Check client existence
2. **Personal Data**: Save client information
3. **Action Data**: Save form-specific data
4. **Signature**: Finalize and generate documents

Each step makes API calls to persist data, with appropriate error handling and retry mechanisms.

### Security Metadata
The system captures security metadata during the signature process:
- Client IP address
- User agent string
- Geolocation data (if enabled)
- Session ID for grouping related signatures

This metadata is included in the final submission to provide audit trail information.

**Section sources**
- [dados-pessoais.tsx](file://components/assinatura-digital/form/dados-pessoais.tsx#L1-L760)
- [assinatura-manuscrita-step.tsx](file://components/assinatura-digital/form/assinatura-manuscrita-step.tsx#L1-L634)

## Common Issues and Troubleshooting

The form system includes mechanisms to handle common issues that may arise during form completion.

### Form State Management Issues
- **Incomplete Submissions**: The system uses the `sessaoId` to group related actions, allowing recovery from incomplete submissions
- **Data Consistency**: Validation checks ensure that critical data (CPF, email, phone) is consistent across steps
- **Cache Invalidation**: The system automatically invalidates cached document previews when underlying data changes

### Validation Error Display
The system provides clear feedback for validation errors:
- Inline error messages for individual fields
- Toast notifications for form-level issues
- Detailed error descriptions with actionable guidance
- Retry mechanisms for transient errors

### Handling Incomplete Submissions
The form state is preserved in the store, allowing users to:
- Navigate back and forth between steps
- Resume form completion if interrupted
- Maintain data consistency across navigation

The `hydrateContext` method ensures that starting a new form properly resets all state, preventing data leakage between sessions.

**Section sources**
- [formulario-store.ts](file://app/_lib/stores/assinatura-digital/formulario-store.ts#L254-L285)
- [assinatura-manuscrita-step.tsx](file://components/assinatura-digital/form/assinatura-manuscrita-step.tsx#L78-L614)

## Form Lifecycle and Template Integration

The complete form lifecycle spans from initialization to final submission, with integration points for template-based document generation.

### Form Initialization
The form lifecycle begins with the `FormularioPage` component, which:
1. Receives form context (segment, form, templates)
2. Initializes the store with `hydrateContext`
3. Renders the `FormularioContainer`

### Dynamic Form Rendering
The `DynamicFormRenderer` component handles the rendering of dynamic forms based on a schema that defines:
- Form sections and fields
- Field types and validation rules
- Conditional logic for field visibility
- Default values and options

### Template System Integration
The system supports multiple templates per form, allowing users to select different document variants. The template integration includes:
- Template metadata caching to reduce API calls
- Automatic template selection for single-template forms
- UI for template selection when multiple templates are available
- Cache management for template content

### Final Submission Process
The signature step orchestrates the final submission:
1. Validates all required data is present
2. Captures signature and optional photo
3. Collects security metadata (IP, geolocation)
4. Generates documents for all associated templates
5. Handles partial failures gracefully
6. Displays success state with generated documents

The process uses retry mechanisms with exponential backoff to handle transient API failures, ensuring reliable document generation.

**Section sources**
- [formulario-page.tsx](file://components/assinatura-digital/form/formulario-page.tsx#L1-L69)
- [assinatura-manuscrita-step.tsx](file://components/assinatura-digital/form/assinatura-manuscrita-step.tsx#L78-L614)

## Conclusion
The Sinesys form building system provides a robust, flexible solution for creating multi-step forms with advanced features. The architecture centers around a centralized state management system that coordinates the form workflow, with modular components handling specific steps in the process. Key strengths include dynamic step configuration, comprehensive validation, seamless state management, and robust integration with backend services for data persistence and document generation. The system handles common issues through thoughtful error handling and provides a consistent user experience across different form types and use cases.