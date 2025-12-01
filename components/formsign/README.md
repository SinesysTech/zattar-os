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