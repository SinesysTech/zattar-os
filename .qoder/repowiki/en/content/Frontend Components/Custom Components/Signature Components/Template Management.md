# Template Management

<cite>
**Referenced Files in This Document**   
- [FormSchemaBuilder.tsx](file://components/assinatura-digital/schema-builder/FormSchemaBuilder.tsx)
- [FieldMappingEditor.tsx](file://components/assinatura-digital/editor/FieldMappingEditor.tsx)
- [MarkdownRichTextEditor.tsx](file://components/assinatura-digital/editor/MarkdownRichTextEditor.tsx)
- [CreateTemplateForm.tsx](file://components/assinatura-digital/editor/CreateTemplateForm.tsx)
- [templates.service.ts](file://backend/assinatura-digital/services/templates.service.ts)
- [template-pdf.service.ts](file://backend/assinatura-digital/services/template-pdf.service.ts)
- [template.types.ts](file://types/assinatura-digital/template.types.ts)
- [pdf-preview.types.ts](file://types/assinatura-digital/pdf-preview.types.ts)
- [format-template.ts](file://lib/assinatura-digital/utils/format-template.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Form Schema Builder](#form-schema-builder)
3. [Field Mapping Editor](#field-mapping-editor)
4. [Markdown Rich Text Editor](#markdown-rich-text-editor)
5. [Template Creation Workflow](#template-creation-workflow)
6. [Template Data Model](#template-data-model)
7. [Template Storage and Retrieval](#template-storage-and-retrieval)
8. [Template Versioning and Change Propagation](#template-versioning-and-change-propagation)
9. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
10. [Conclusion](#conclusion)

## Introduction
The template management system in Sinesys provides a comprehensive solution for creating, configuring, and managing form templates for digital signature workflows. This system enables users to design dynamic forms, map fields to PDF templates, and integrate rich text content with variable substitution. The core components include the FormSchemaBuilder for creating form structures, the FieldMappingEditor for positioning fields on PDFs, and the MarkdownRichTextEditor for creating responsive content. Templates are associated with segments and used in form generation, with a robust data model supporting versioning and change propagation.

## Form Schema Builder
The FormSchemaBuilder component enables users to create and configure dynamic form templates through a drag-and-drop interface. It allows users to add various field types, organize them into sections, and define validation rules. The builder provides real-time preview functionality and JSON export/import capabilities for schema management.

The component uses a state-based approach to manage the form schema, with features for adding, editing, and deleting sections and fields. Each field has properties such as name, label, type, validation rules, and grid positioning. The schema is validated before saving to ensure structural integrity.

```mermaid
classDiagram
class FormSchemaBuilder {
+initialSchema DynamicFormSchema
+formularioNome string
+onSave function
+onCancel function
-schema DynamicFormSchema
-selectedFieldId string
-selectedSectionId string
-mode 'edit' | 'preview'
-isDirty boolean
+handleDragEnd(event DragEndEvent)
+handleFieldUpdate(updatedField FormFieldSchema)
+handleSectionAdd()
+handleSave()
+handleCancel()
}
class DynamicFormSchema {
+id string
+version string
+sections FormSectionSchema[]
+globalValidations ValidationRule[]
}
class FormSectionSchema {
+id string
+title string
+description string
+fields FormFieldSchema[]
}
class FormFieldSchema {
+id string
+name string
+label string
+type FormFieldType
+validation ValidationRule
+gridColumns number
}
FormSchemaBuilder --> DynamicFormSchema : "manages"
DynamicFormSchema --> FormSectionSchema : "contains"
FormSectionSchema --> FormFieldSchema : "contains"
```

**Diagram sources**
- [FormSchemaBuilder.tsx](file://components/assinatura-digital/schema-builder/FormSchemaBuilder.tsx#L22-L733)

**Section sources**
- [FormSchemaBuilder.tsx](file://components/assinatura-digital/schema-builder/FormSchemaBuilder.tsx#L1-L733)

## Field Mapping Editor
The FieldMappingEditor component allows users to position and configure fields on a PDF template. It provides a canvas interface where users can drag and drop fields, resize them, and set their properties. The editor supports different field types including text, signature, and composite text fields.

The component handles PDF rendering, field positioning, and interaction events. It maintains state for selected fields, zoom level, and page navigation. Field properties such as font, size, color, and alignment can be configured through a properties panel.

```mermaid
classDiagram
class FieldMappingEditor {
+template Template
+onCancel function
+mode 'edit' | 'create'
-fields EditorField[]
-selectedField EditorField
-editorMode EditorMode
-zoom number
-currentPage number
-hasUnsavedChanges boolean
+handleCanvasClick(event MouseEvent)
+handleFieldClick(field EditorField, event MouseEvent)
+handleMouseDown(field EditorField, event MouseEvent)
+handleResizeMouseDown(field EditorField, handle string, event MouseEvent)
+handleMouseMove(event MouseEvent)
}
class EditorField {
+id string
+template_id string
+nome string
+variavel string
+tipo TipoCampo
+posicao PosicaoCampo
+estilo EstiloCampo
+obrigatorio boolean
+isSelected boolean
+isDragging boolean
}
class PosicaoCampo {
+x number
+y number
+width number
+height number
+pagina number
}
class EstiloCampo {
+fonte string
+tamanho_fonte number
+cor string
+alinhamento 'left' | 'center' | 'right'
}
FieldMappingEditor --> EditorField : "manages"
EditorField --> PosicaoCampo : "has"
EditorField --> EstiloCampo : "has"
```

**Diagram sources**
- [FieldMappingEditor.tsx](file://components/assinatura-digital/editor/FieldMappingEditor.tsx#L31-L2209)

**Section sources**
- [FieldMappingEditor.tsx](file://components/assinatura-digital/editor/FieldMappingEditor.tsx#L1-L2209)

## Markdown Rich Text Editor
The MarkdownRichTextEditor component provides a WYSIWYG interface for creating rich text content that can be integrated with PDF templates. It supports Markdown formatting, variable substitution, and link insertion. The editor uses the Tiptap library for rich text editing capabilities.

The component allows users to insert variables from different categories (client, system, signature) that will be substituted with actual values during form generation. It provides toolbar buttons for formatting options and a combobox for variable selection.

```mermaid
classDiagram
class MarkdownRichTextEditor {
+value string
+onChange function
+formularios string[]
-linkDialogOpen boolean
-linkUrl string
-linkText string
-isInternalUpdate boolean
-editor Editor
+insertVariable(variable VariableOption)
+openLinkDialog()
+insertLink()
}
class VariableOption {
+value string
+label string
+category string
}
class DadosGeracao {
+cliente ClienteDadosGeracao
+acao AcaoDadosGeracao
+sistema SistemaDadosGeracao
+segmento SegmentoBasico
+escritorio EscritorioDadosGeracao
+assinatura AssinaturaDados
}
MarkdownRichTextEditor --> VariableOption : "uses"
MarkdownRichTextEditor --> DadosGeracao : "generates"
```

**Diagram sources**
- [MarkdownRichTextEditor.tsx](file://components/assinatura-digital/editor/MarkdownRichTextEditor.tsx#L37-L273)

**Section sources**
- [MarkdownRichTextEditor.tsx](file://components/assinatura-digital/editor/MarkdownRichTextEditor.tsx#L1-L273)

## Template Creation Workflow
The template creation workflow begins with the CreateTemplateForm component, which guides users through the process of creating a new template. Users upload a PDF file and provide basic information such as name and description. The workflow then transitions to the FieldMappingEditor where users can position fields on the PDF.

The process involves several steps:
1. Upload a PDF template file
2. Provide template metadata (name, description)
3. Position fields on the PDF using drag-and-drop
4. Configure field properties and variable mappings
5. Add optional Markdown content
6. Save the template to the database

```mermaid
sequenceDiagram
participant User as "User"
participant CreateTemplateForm as "CreateTemplateForm"
participant FieldMappingEditor as "FieldMappingEditor"
participant TemplatesService as "TemplatesService"
User->>CreateTemplateForm : Upload PDF file
CreateTemplateForm->>CreateTemplateForm : Validate file
CreateTemplateForm->>CreateTemplateForm : Display form fields
User->>CreateTemplateForm : Enter template name and description
User->>CreateTemplateForm : Submit form
CreateTemplateForm->>FieldMappingEditor : Initialize with PDF
User->>FieldMappingEditor : Add fields to PDF
User->>FieldMappingEditor : Configure field properties
User->>FieldMappingEditor : Save template
FieldMappingEditor->>TemplatesService : Create template
TemplatesService->>Database : Insert template record
Database-->>TemplatesService : Return template ID
TemplatesService-->>FieldMappingEditor : Template created
FieldMappingEditor-->>User : Confirmation
```

**Diagram sources**
- [CreateTemplateForm.tsx](file://components/assinatura-digital/editor/CreateTemplateForm.tsx#L19-L267)
- [FieldMappingEditor.tsx](file://components/assinatura-digital/editor/FieldMappingEditor.tsx#L31-L2209)
- [templates.service.ts](file://backend/assinatura-digital/services/templates.service.ts#L1-L194)

**Section sources**
- [CreateTemplateForm.tsx](file://components/assinatura-digital/editor/CreateTemplateForm.tsx#L1-L267)

## Template Data Model
The template data model in Sinesys defines the structure of templates, fields, and their relationships. Templates are associated with segments and used in form generation. The model supports versioning and change propagation to ensure consistency across related forms.

The core entities include Template, TemplateCampo (template field), and Segmento (segment). Templates can have multiple fields, each with specific properties and variable mappings. Segments define categories or types of templates, allowing for organized template management.

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
string template_id FK
string nome
string variavel
string tipo
json posicao
json estilo
boolean obrigatorio
string formato
string valor_padrao
number ordem
json condicional
json conteudo_composto
timestamp criado_em
timestamp atualizado_em
}
SEGMENTO {
string id PK
string nome
string slug
string descricao
timestamp created_at
timestamp updated_at
}
FORM_SCHEMA {
string id PK
string version
json sections
json globalValidations
timestamp created_at
timestamp updated_at
}
TEMPLATE ||--o{ TEMPLATE_CAMPO : "contains"
SEGMENTO ||--o{ TEMPLATE : "has"
TEMPLATE ||--o{ FORM_SCHEMA : "uses"
```

**Diagram sources**
- [template.types.ts](file://types/assinatura-digital/template.types.ts#L35-L170)
- [template.types.ts](file://backend/types/template.types.ts#L6-L64)

**Section sources**
- [template.types.ts](file://types/assinatura-digital/template.types.ts#L1-L170)

## Template Storage and Retrieval
Templates are stored in a PostgreSQL database using Supabase as the backend service. The templates.service.ts file contains functions for creating, reading, updating, and deleting templates. Templates are stored with their metadata, field configurations, and associated PDF file references.

The storage system uses a service client pattern to interact with the database, providing functions for listing templates, retrieving specific templates, creating new templates, updating existing templates, and deleting templates. Each operation includes logging for monitoring and debugging purposes.

```mermaid
sequenceDiagram
participant Client as "Frontend"
participant TemplatesService as "TemplatesService"
participant Supabase as "Supabase"
Client->>TemplatesService : listTemplates(params)
TemplatesService->>Supabase : SELECT * FROM templates
Supabase-->>TemplatesService : Return templates
TemplatesService-->>Client : Template list
Client->>TemplatesService : getTemplate(id)
TemplatesService->>Supabase : SELECT * FROM templates WHERE id = ?
Supabase-->>TemplatesService : Return template
TemplatesService-->>Client : Template data
Client->>TemplatesService : createTemplate(input)
TemplatesService->>Supabase : INSERT INTO templates
Supabase-->>TemplatesService : Return created template
TemplatesService-->>Client : Created template
Client->>TemplatesService : updateTemplate(id, input)
TemplatesService->>Supabase : UPDATE templates SET ... WHERE id = ?
Supabase-->>TemplatesService : Return updated template
TemplatesService-->>Client : Updated template
```

**Diagram sources**
- [templates.service.ts](file://backend/assinatura-digital/services/templates.service.ts#L1-L194)

**Section sources**
- [templates.service.ts](file://backend/assinatura-digital/services/templates.service.ts#L1-L194)

## Template Versioning and Change Propagation
The template system supports versioning through the 'versao' field in the template entity. Each time a template is updated, its version number is incremented. This allows for tracking changes and maintaining historical versions of templates.

When template changes are made, they propagate to existing forms through a versioning system. Forms are associated with a specific template version, ensuring that changes to the template do not affect already completed forms. New forms use the latest version of the template.

The system handles change propagation by:
1. Maintaining version history for templates
2. Associating forms with specific template versions
3. Providing migration paths for updating forms to new template versions
4. Preserving data integrity during version transitions

```mermaid
flowchart TD
A[Template Created] --> B[Version 1.0]
B --> C[Form Created with Version 1.0]
B --> D[Template Updated]
D --> E[Version 2.0]
E --> F[New Form Created with Version 2.0]
C --> G[Form Completed - Locked to Version 1.0]
F --> H[Form Completed - Locked to Version 2.0]
E --> I[Migration Option for Existing Forms]
I --> J[Update Form to Version 2.0]
I --> K[Keep Form on Version 1.0]
```

**Section sources**
- [templates.service.ts](file://backend/assinatura-digital/services/templates.service.ts#L1-L194)
- [template.types.ts](file://types/assinatura-digital/template.types.ts#L35-L170)

## Common Issues and Troubleshooting
The template management system may encounter several common issues that require troubleshooting. These include template versioning conflicts, field mapping conflicts, and rendering performance issues with complex templates.

**Template Versioning Issues:**
- Ensure version numbers are incremented correctly when updating templates
- Verify that forms are associated with the correct template version
- Implement proper migration paths for updating forms to new template versions

**Field Mapping Conflicts:**
- Check for overlapping field positions on the PDF
- Validate that variable names are unique and correctly formatted
- Ensure field types match the expected data types

**Rendering Performance:**
- Optimize PDF file size to improve loading times
- Limit the number of fields on complex templates
- Use efficient variable substitution methods

```mermaid
flowchart TD
A[Issue Reported] --> B{Issue Type}
B --> C[Versioning]
B --> D[Field Mapping]
B --> E[Performance]
C --> F[Check version numbers]
C --> G[Verify form-template association]
C --> H[Review migration paths]
D --> I[Check field positions]
D --> J[Validate variable names]
D --> K[Verify field types]
E --> L[Optimize PDF size]
E --> M[Reduce field count]
E --> N[Improve variable substitution]
F --> O[Resolution]
G --> O
H --> O
I --> O
J --> O
K --> O
L --> O
M --> O
N --> O
```

**Section sources**
- [templates.service.ts](file://backend/assinatura-digital/services/templates.service.ts#L1-L194)
- [template-pdf.service.ts](file://backend/assinatura-digital/services/template-pdf.service.ts#L1-L215)
- [format-template.ts](file://lib/assinatura-digital/utils/format-template.ts#L1-L109)

## Conclusion
The template management system in Sinesys provides a comprehensive solution for creating, configuring, and managing form templates for digital signature workflows. The system's modular architecture, with components like FormSchemaBuilder, FieldMappingEditor, and MarkdownRichTextEditor, enables flexible template creation and configuration. The robust data model supports versioning and change propagation, ensuring consistency across related forms. By addressing common issues such as template versioning, field mapping conflicts, and rendering performance, the system provides a reliable foundation for template management in digital signature workflows.