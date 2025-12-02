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

## Dependencies

- `react-hook-form` ^7.53.2 - Form state management
- `@hookform/resolvers` ^3.9.1 - Zod schema resolver
- `zod` ^3.22.4 - Schema validation (already in Sinesys)
- `sonner` - Toast notifications (already in Sinesys)
