# Formsign Input Components

Brazilian-specific masked input components using `react-imask`.

## Components

### InputCPF
Masked input for Brazilian CPF (Cadastro de Pessoas Físicas).
- **Mask:** `000.000.000-00`
- **Example:** `123.456.789-00`

### InputCPFCNPJ
Dynamic input that switches between CPF and CNPJ masks based on input length.
- **CPF (≤11 digits):** `000.000.000-00`
- **CNPJ (>11 digits):** `00.000.000/0000-00`
- **Use case:** Forms where user type (PF/PJ) is unknown

### InputTelefone
Brazilian phone number with 3 modes:
- **auto** (default): Switches between landline/cell based on length
- **cell**: Fixed cell phone mask `(00) 00000-0000`
- **landline**: Fixed landline mask `(00) 0000-0000`

### InputData
Brazilian date format (DD/MM/YYYY).
- **Mask:** `00/00/0000`
- **Note:** Display only - validation must be handled separately

### InputCEP
Brazilian postal code with auto-fetch address from ViaCEP.
- **Mask:** `00000-000`
- **Auto-fetch:** Triggers on 8 digits (onAccept + onBlur)
- **Callback:** `onAddressFound({ logradouro, bairro, localidade, uf })`
- **Loading state:** Shows spinner during API call

## Usage

```typescript
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

## Styling

All components use shadcn/ui styling conventions:
- Consistent with `components/ui/input.tsx`
- Support for label, error messages, aria-invalid
- Dark mode compatible
- Focus/hover states

## Integration

- **DynamicFormRenderer:** Used in `components/formulario/DynamicFormRenderer.tsx` (FORMSIGN-006)
- **Form libraries:** Compatible with react-hook-form, Formik (forward ref support)
- **Validators:** Use with `lib/formsign/validators/` (FORMSIGN-002)