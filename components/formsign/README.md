import { InputCPF, InputTelefone, InputCEP } from '@/components/formsign/inputs';

function MyForm() {
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState({});

  return (
    <>
      <InputCPF
        label="CPF"
        value={cpf}
        onChange={(e) => setCpf(e.target.value)}
        error={errors.cpf}
      />
      <InputCEP
        label="CEP"
        onAddressFound={(addr) => setAddress(addr)}
      />
    </>
  );
}
```

### Styling

All components use shadcn/ui styling conventions:
- Consistent with `components/ui/input.tsx`
- Support for label, error messages, aria-invalid
- Dark mode compatible
- Focus/hover states

### Integration

- **DynamicFormRenderer:** Used in `components/formulario/DynamicFormRenderer.tsx` (FORMSIGN-006)
- **Form libraries:** Compatible with react-hook-form, Formik (forward ref support)
- **Validators:** Use with `lib/formsign/validators/` (FORMSIGN-002)

## Signature Components (`signature/`)

Components for capturing and previewing handwritten signatures.

### CanvasAssinatura
Signature canvas component for capturing handwritten signatures with metrics tracking.
- **Purpose:** Capture handwritten signatures with metrics tracking
- **Dependencies:** `react-signature-canvas`
- **Ref API:** `getSignatureBase64()`, `isEmpty()`, `clear()`, `getMetrics()`
- **Metrics tracked:** points, strokes, drawing time, bounding box (width, height)
- **Responsive sizing:** max 600px width, 200-250px height

**Usage example with ref:**
```typescript
import { CanvasAssinatura } from '@/components/formsign/signature';

const canvasRef = useRef<CanvasAssinaturaRef>(null);

const handleSave = () => {
  if (!canvasRef.current?.isEmpty()) {
    const signature = canvasRef.current.getSignatureBase64();
    const metrics = canvasRef.current.getMetrics();
    // Save signature and metrics
  }
};

return <CanvasAssinatura ref={canvasRef} />;
```

### PreviewAssinatura
Signature and photo preview component for displaying captured signature and photo side-by-side for review.
- **Purpose:** Display captured signature and photo side-by-side for review
- **Props:** `assinaturaBase64`, `fotoBase64`, `onEdit`, `onConfirm`, `isLoading`
- **Features:** responsive grid, confirmation dialog, edit/confirm actions

**Usage example:**
```typescript
import { PreviewAssinatura } from '@/components/formsign/signature';

return (
  <PreviewAssinatura
    assinaturaBase64={signatureData}
    fotoBase64={photoData}
    onEdit={() => setStep('capture')}
    onConfirm={() => submitForm()}
    isLoading={isSubmitting}
  />
);
```

## Capture Components (`capture/`)

Components for capturing photos and geolocation data.

### CapturaFoto
Webcam photo capture component for capturing photos using device camera.
- **Purpose:** Capture photos using device camera
- **Dependencies:** `react-webcam`
- **Ref API:** `getPhotoBase64()`, `hasPhoto()`
- **Props:** `initialPhoto`, `onWebcamErrorChange`, `onPhotoCaptured`
- **Features:** webcam preview, retake, error handling, size validation (max 5MB)
- **Camera settings:** 500x500px, JPEG quality 0.8, user-facing camera

**Usage example with ref:**
```typescript
import { CapturaFoto } from '@/components/formsign/capture';

const photoRef = useRef<CapturaFotoRef>(null);

const handleCapture = () => {
  if (photoRef.current?.hasPhoto()) {
    const photo = photoRef.current.getPhotoBase64();
    // Process photo
  }
};

return <CapturaFoto ref={photoRef} onPhotoCaptured={handleCapture} />;
```

### CapturaFotoStep
Photo capture step wrapper for integrating photo capture into multi-step form flow.
- **Purpose:** Integrate photo capture into multi-step form flow
- **Dependencies:** `CapturaFoto`, `formulario-store`, `FormStepLayout` (FORMSIGN-006)
- **Store integration:** reads/writes `fotoBase64`, navigation methods
- **Validation:** uses `validatePhotoQuality()` from business.validations

**Usage example with store:**
```typescript
import { CapturaFotoStep } from '@/components/formsign/capture';

return <CapturaFotoStep />;
```

### GeolocationStep
Geolocation capture step for capturing GPS coordinates in multi-step form flow.
- **Purpose:** Capture GPS coordinates in multi-step form flow
- **Dependencies:** Browser Geolocation API, `formulario-store`, `FormStepLayout` (FORMSIGN-006)
- **Store integration:** reads/writes `latitude`, `longitude`, `geolocationAccuracy`, `geolocationTimestamp`
- **Features:** auto-capture on mount, retry on error, detailed error messages, privacy notice
- **Validation:** uses `validateGeolocation()` from business.validations
- **GPS settings:** high accuracy, 10s timeout, no cache

**Usage example with store:**
```typescript
import { GeolocationStep } from '@/components/formsign/capture';

return <GeolocationStep />;
```

## Form Components

Dynamic form rendering system with JSON-schema-driven validation, conditional logic, and multi-step workflows.

### DynamicFormRenderer

Core form renderer using react-hook-form + Zod for schema-based validation.

**Features:**
- Supports 11 field types: text, email, textarea, number, date, CPF, CNPJ, phone, CEP, select, radio, checkbox
- Conditional field rendering (operators: =, !=, >, <, contains, empty, notEmpty)
- CEP auto-fill (populates logradouro, bairro, cidade, estado)
- Responsive grid layout (1-3 columns)
- Section-based organization with separators

**Usage:**
```tsx
import { DynamicFormRenderer } from '@/components/formsign/form';
import type { DynamicFormSchema, DynamicFormData } from '@/types/formsign';

const schema: DynamicFormSchema = {
  sections: [
    {
      id: 'personal',
      title: 'Dados Pessoais',
      fields: [
        { id: 'nome', type: 'text', label: 'Nome Completo', required: true },
        { id: 'cpf', type: 'cpf', label: 'CPF', required: true },
        { id: 'email', type: 'email', label: 'E-mail', required: true },
      ],
    },
  ],
};

function MyForm() {
  const handleSubmit = (data: DynamicFormData) => {
    console.log('Form data:', data);
  };

  return (
    <DynamicFormRenderer
      schema={schema}
      onSubmit={handleSubmit}
      formId="my-form"
    />
  );
}
```

**Props:**
- `schema: DynamicFormSchema` - JSON schema defining form structure
- `onSubmit: (data: DynamicFormData) => void | Promise<void>` - Submit handler
- `defaultValues?: DynamicFormData` - Initial field values
- `isSubmitting?: boolean` - Disable form during submission
- `formId?: string` - HTML form ID for external submit button

### DynamicFormStep

Wrapper component managing schema loading, data enrichment, and API submission for multi-step workflows.

**Features:**
- Loads form schema from API with store caching
- Enriches form data (adds reclamada_nome, modalidade_nome, converts booleans to V/F)
- Calculates TRT based on UF (24 regions)
- Pre-submission validation (checks dadosPessoais, segmentoId, formularioId)
- Integrates with formulario store for state management

**Usage:**
```tsx
import { DynamicFormStep } from '@/components/formsign/form';

function FormularioFlow() {
  return <DynamicFormStep />;
}
```

**Store Integration:**
Requires `useFormularioStore` to be initialized with:
- `segmentoId: number`
- `formularioId: number`
- `dadosPessoais: { cliente_id, nome_completo, cpf, endereco_uf }`

**API Dependencies:**
- `GET /api/assinatura-digital/admin/formularios/:id` - Fetch form schema
- `POST /api/salvar-acao` - Submit form data (TODO: not yet migrated)

### FormStepLayout

Reusable layout component for multi-step forms with progress bar and navigation.

**Features:**
- Progress bar (1-based step counting)
- Previous/Next navigation with icons
- Loading states
- Form submission support via formId prop
- Responsive card-based layout

**Usage:**
```tsx
import { FormStepLayout } from '@/components/formsign/form';

function MyStep() {
  return (
    <FormStepLayout
      title="Dados Pessoais"
      description="Informe seus dados"
      currentStep={1}
      totalSteps={5}
      onPrevious={() => console.log('Previous')}
      onNext={() => console.log('Next')}
      formId="my-form" // Optional: for form submission
    >
      {/* Step content */}
    </FormStepLayout>
  );
}
```

**Props:**
- `title: string` - Step title
- `description?: string` - Step description
- `currentStep: number` - Current step (1-based)
- `totalSteps: number` - Total steps
- `onPrevious?: () => void` - Previous button handler
- `onNext?: () => void` - Next button handler (ignored if formId provided)
- `formId?: string` - HTML form ID for submit button
- `isLoading?: boolean` - Show loading state
- `isNextDisabled?: boolean` - Disable next button
- `isPreviousDisabled?: boolean` - Disable previous button
- `hidePrevious?: boolean` - Hide previous button
- `hideNext?: boolean` - Hide next button

## Editor de Templates (`editor/`)

Componentes base para o editor visual de templates PDF.

### CreateTemplateForm

Formulário para criar novos templates com informações básicas.

**Props:**
- `pdfFile: File` - Arquivo PDF a ser usado como template
- `onSubmit: (data) => Promise<void>` - Callback ao criar template
- `onCancel?: () => void` - Callback ao cancelar

**Features:**
- Campos: nome (obrigatório), descrição, conteúdo markdown
- Validação de markdown (máximo 100KB, deve conter variáveis)
- Preview de markdown com ReactMarkdown
- Documentação inline de variáveis disponíveis
- Integração com MarkdownRichTextEditorDialog

### PdfCanvasArea

Área principal do editor onde o PDF é exibido e os campos são posicionados.

**Props:**
- `canvasRef`, `canvasSize`, `zoom` - Controle do canvas
- `pdfUrl`, `currentPage`, `totalPages` - Controle do PDF
- `fields` - Array de campos a renderizar
- `onFieldClick`, `onFieldMouseDown`, `onResizeMouseDown` - Handlers de interação
- `onOpenProperties`, `onDuplicateField`, `onDeleteField` - Ações de campo
- `onAddTextField`, `onAddImageField`, `onAddRichTextField` - Adicionar campos

**Features:**
- Renderização de PDF como fundo usando PdfPreview
- Overlay de campos com drag-and-drop
- 8 resize handles por campo (4 cantos + 4 bordas)
- Context menu com ações (editar, duplicar, deletar, zoom)
- Suporte a 3 tipos de campo: texto, imagem, texto composto
- Avisos visuais para campos com altura insuficiente
- Filtro automático de campos por página

### PropertiesPopover

Popover lateral para editar propriedades de campos selecionados.

**Props:**
- `trigger: React.ReactNode` - Elemento que abre o popover
- `open`, `onOpenChange` - Controle de estado
- `selectedField` - Campo selecionado
- `onUpdateField`, `onDeleteField` - Callbacks de ação

**Features:**
- Seletor de variável com autocomplete (Command component)
- Variáveis agrupadas por categoria (Cliente, Ação, Sistema, Assinatura)
- Seções colapsáveis: Informações gerais, Posicionamento, Estilo
- Campos de posição (X, Y, width, height)
- Campos de estilo (tamanho_fonte, fonte) para texto
- Atualização automática do nome ao selecionar variável

### TemplateInfoPopover

Popover lateral para editar metadados do template.

**Props:**
- `trigger: React.ReactNode` - Elemento que abre o popover
- `open`, `onOpenChange` - Controle de estado
- `template?: Template` - Template a editar (opcional para criação)
- `onUpdate: (updates) => Promise<void>` - Callback de atualização
- `isCreating?: boolean` - Modo criação
- `pdfFile?: File` - Arquivo PDF (modo criação)

**Features:**
- Campos: nome, descrição, status, conteúdo markdown
- Suporte a dois modos: criação e edição
- Preview de markdown em dialog separado
- Salvamento direto de markdown no backend
- Validação de markdown
- Integração com API `/api/assinatura-digital/admin/templates`

### ReplacePdfDialog

Dialog para substituir o arquivo PDF de um template.

**Props:**
- `open`, `onOpenChange` - Controle de estado
- `templateId: string | number` - ID do template
- `onSuccess: () => void` - Callback após sucesso

**Features:**
- Drag-and-drop usando react-dropzone
- Validação de arquivo (tipo PDF, 10KB-10MB)
- Preview do novo PDF antes de confirmar
- Upload via FormData
- Cleanup automático de blob URLs
- Integração com API `/api/assinatura-digital/admin/templates/:id/replace-pdf`

## Preview de PDF (`pdf/`)

Componentes para renderizar PDFs no editor.

### PdfPreview

Componente base para renderizar PDFs usando react-pdf.

**Props:** Ver `PdfPreviewProps` em `@/types/formsign/pdf-preview.types`

**Features:**
- Dois modos: `default` (com controles) e `background` (apenas PDF)
- Controles de zoom (0.5x a 3.0x)
- Navegação de páginas
- Estados de loading e erro
- Suporte a dimensões fixas
- Renderização opcional de text layer e annotation layer

### PdfPreviewDynamic

Wrapper dinâmico do PdfPreview para evitar problemas de SSR.

**Props:** Mesmas do PdfPreview

**Uso:** Sempre use este componente ao invés do PdfPreview diretamente.

## Validação (`lib/formsign/validation/`)

### markdown.ts

Utilitários para validar conteúdo Markdown de templates.

**Funções:**
- `validateMarkdownContent(content)` - Validação completa com XSS
- `normalizeMarkdownContent(content)` - Normalização (CRLF→LF)
- `validateMarkdownForForm(content)` - Validação simplificada

**Constantes:**
- `MAX_MARKDOWN_CHARS = 100000` - Limite de 100KB

## Template Editor Components

### FieldMappingEditor

Main visual PDF template editor with drag-and-drop field placement, zoom controls, autosave, and test preview generation.

**Location:** `components/formsign/editor/FieldMappingEditor.tsx`

**Features:**
- Visual PDF template editing with overlay canvas
- Drag-and-drop field placement (text, image, signature, rich text)
- Field resize with 8 handles (corners + edges)
- Zoom controls (50%-200%, responsive defaults)
- Multi-page PDF navigation
- Autosave every 5 seconds
- Test preview generation with mock data
- Toggle between original template and filled preview
- Navigation guards for unsaved changes
- Create mode with PDF upload dropzone
- Keyboard shortcuts (Delete, Escape, Arrow keys)
- Floating draggable toolbar (desktop) and horizontal toolbar (mobile)

**Props:**
```typescript
interface FieldMappingEditorProps {
  template: Template; // Template to edit (from API or new)
  onCancel?: () => void; // Callback when user cancels editing
  mode?: 'edit' | 'create'; // Edit existing or create new template
}
```

**Usage Example:**
```typescript
import { FieldMappingEditor } from '@/components/formsign/editor';
import { useRouter } from 'next/navigation';

function TemplateEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  
  useEffect(() => {
    // Fetch template from API
    fetch(`/api/assinatura-digital/admin/templates/${params.id}`)
      .then(res => res.json())
      .then(data => setTemplate(data.data));
  }, [params.id]);
  
  if (!template) return <div>Carregando...</div>;
  
  return (
    <FieldMappingEditor
      template={template}
      mode="edit"
      onCancel={() => router.push('/assinatura-digital/admin/templates')}
    />
  );
}
```

**Create Mode Example:**
```typescript
// For new template creation
const emptyTemplate: Template = {
  id: '',
  template_uuid: '',
  nome: '',
  descricao: null,
  arquivo_original: '',
  arquivo_nome: '',
  arquivo_tamanho: 0,
  status: 'rascunho',
  versao: 1,
  ativo: true,
  campos: [],
  conteudo_markdown: null,
  criado_por: null,
  criado_em: new Date().toISOString(),
  atualizado_em: new Date().toISOString(),
};

return (
  <FieldMappingEditor
    template={emptyTemplate}
    mode="create"
    onCancel={() => router.back()}
  />
);
```

**API Integration:**
- **GET** `/api/assinatura-digital/admin/templates/[id]` - Load template
- **PUT** `/api/assinatura-digital/admin/templates/[id]` - Save changes (autosave)
- **POST** `/api/assinatura-digital/admin/templates/[id]/preview-test` - Generate test PDF
- **POST** `/api/assinatura-digital/admin/templates` - Create new template (create mode)

**Keyboard Shortcuts:**
- `Delete` - Delete selected field
- `Escape` - Deselect field / cancel drag
- `Arrow Keys` - Move selected field (1px increments)
- `Shift + Arrow Keys` - Move selected field (10px increments)

**Field Types Supported:**
- `texto` - Single-line text field
- `assinatura` - Signature image field
- `foto` - Photo image field
- `texto_composto` - Rich text field with variables

**Dependencies:**
- `react-dropzone` (v14.3.8) - PDF upload in create mode
- `react-pdf` (v9.2.1) - PDF rendering
- `pdfjs-dist` (v4.9.155) - PDF.js worker
- All editor subcomponents from FORMSIGN-007/008

---

### ToolbarButtons & ToolbarButtonsMobile

Toolbar components for FieldMappingEditor (desktop vertical and mobile horizontal layouts).

**Location:** 
- `components/formsign/editor/ToolbarButtons.tsx` (desktop)
- `components/formsign/editor/ToolbarButtonsMobile.tsx` (mobile)

**Features:**
- Editor mode selection (select, add text, add image, add rich text)
- Zoom controls with percentage display
- Page navigation for multi-page PDFs
- Properties/template info/PDF replacement dialogs
- Save/cancel actions
- Test preview generation
- Preview toggle (original vs filled)

**Props:** Both components share identical props interface (23 props total) - see FieldMappingEditor source for full list.

**Usage:** Automatically used by FieldMappingEditor - not intended for standalone use.

---

## Dependencies

**Novas dependências adicionadas:**
- `react-pdf@^9.1.0` - Renderização de PDFs
- `pdfjs-dist@^4.10.38` - Worker do PDF.js
- `react-markdown@^10.1.0` - Renderização de Markdown
- `rehype-raw@^7.0.0` - Processamento de HTML em Markdown
- `rehype-sanitize@^7.0.0` - Sanitização de HTML

**Dependências já existentes:**
- `react-hook-form` ^7.53.2 - Form state management
- `@hookform/resolvers` ^3.9.1 - Zod schema resolver
- `zod` ^3.22.4 - Schema validation (already in Sinesys)
- `sonner` - Toast notifications (already in Sinesys)
- `react-dropzone` - Upload de arquivos
- `lucide-react` - Ícones

## Notas de Implementação

### Stub Temporário

O componente `MarkdownRichTextEditorDialog` está implementado como stub temporário em `MarkdownRichTextEditorDialog.stub.tsx`. Ele será substituído pelo editor completo em **FORMSIGN-008**.

### Rotas de API

Os componentes esperam as seguintes rotas de API:
- `POST /api/assinatura-digital/admin/templates` - Criar template
- `PUT /api/assinatura-digital/admin/templates/:id` - Atualizar template
- `PUT /api/assinatura-digital/admin/templates/:id/replace-pdf` - Substituir PDF
- `POST /api/assinatura-digital/admin/templates/[id]/preview-test` - Generate test PDF

Estas rotas já existem no Sinesys.

### Coordenadas do Canvas

O editor usa dimensões fixas de **540×765px** (`PDF_CANVAS_SIZE`) para o canvas. Durante a geração do PDF, as coordenadas são convertidas proporcionalmente para as dimensões reais do PDF (ex: A4 = 595×842pt). **Não altere estas dimensões** sem revisar as funções de conversão em `lib/pdf/generator.ts`.

### CSS Module

O componente `FieldMappingEditor` utiliza o arquivo CSS module `FieldMappingEditor.module.css` para estilos da toolbar flutuante e elementos dinâmicos.