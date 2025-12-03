lib/assinatura-digital/
├── constants/           # Constants (API routes, nationalities, marital statuses)
├── validation/          # Markdown validation utilities
├── validations/         # Zod schemas for form validation
├── utils/               # General utilities (parsers, converters, formatters)
├── index.ts             # Main exports
└── README.md            # This file
```

## Constants

### API Routes (`constants/apiRoutes.ts`)

Centralized API route definitions for the Assinatura Digital module.

**Location:** `lib/assinatura-digital/constants/apiRoutes.ts`

**Exports:**
- `API_ROUTES` - Object with all API endpoints
- `getApiUrl(path: string)` - Helper to build full API URLs

**Example:**
```typescript
import { API_ROUTES } from '@/lib/assinatura-digital/constants/apiRoutes';

const templatesUrl = API_ROUTES.templates.list; // '/api/assinatura-digital/templates'
```

### Nationalities (`constants/nacionalidades.ts`)

Brazilian nationalities list.

**Location:** `lib/assinatura-digital/constants/nacionalidades.ts`

**Exports:**
- `NACIONALIDADES` - Array of nationality objects with `value` and `label`

### Marital Statuses (`constants/estadosCivis.ts`)

Brazilian marital statuses.

**Location:** `lib/assinatura-digital/constants/estadosCivis.ts`

**Exports:**
- `ESTADOS_CIVIS` - Array of marital status objects with `value` and `label`

## Validation

### Markdown Validation (`validation/markdown.ts`)

Validates Markdown content for template usage.

**Location:** `lib/assinatura-digital/validation/markdown.ts`

**Functions:**
- `validateMarkdown(markdown: string): ValidationResult` - Validates Markdown syntax and variables

## Validations

### CPF Validation Schema (`validations/verificarCPF.schema.ts`)

Zod schema for CPF verification form.

**Location:** `lib/assinatura-digital/validations/verificarCPF.schema.ts`

### Personal Data Schema (`validations/dadosPessoais.schema.ts`)

Zod schema for personal data form.

**Location:** `lib/assinatura-digital/validations/dadosPessoais.schema.ts`

## Utils

### Variable Filter (`utils/variable-filter.ts`)

Filters and provides available variables for template editing.

**Location:** `lib/assinatura-digital/utils/variable-filter.ts`

**Functions:**
- `getAvailableVariables(categories?: string[]): Variable[]` - Returns filtered variables

**Example:**
```typescript
import { getAvailableVariables } from '@/lib/assinatura-digital/utils/variable-filter';

const variables = getAvailableVariables(['apps', 'trabalhista']);
// Returns: comum + apps + trabalhista variables, sorted by category and label

variables.forEach(v => {
  console.log(`${v.category}: ${v.label} (${v.value})`);
});
```

**Integration:** Used by `RichTextEditor` and `MarkdownRichTextEditor` to populate variable insertion combobox.

### Markdown Converter (`utils/markdown-converter.ts`)

Bidirectional conversion between Markdown and Tiptap JSON.

**Location:** `lib/assinatura-digital/utils/markdown-converter.ts`

**Functions:**
- `markdownToTiptapJSON(markdown: string): TiptapDocument` - Converts Markdown to Tiptap JSON
- `tiptapJSONToMarkdown(json: TiptapDocument): string` - Converts Tiptap JSON to Markdown

**Supported syntax:**
- **Blocks:** Headings (h1-h3), paragraphs, bullet/ordered lists, blockquotes, horizontal rules
- **Inline:** Bold (`**`), italic (`*`), code (`` ` ``), strikethrough (`~~`), links (`[text](url)`)
- **Variables:** `{{variable.key}}` ↔ `{ type: 'variable', attrs: { key: 'variable.key' } }`
- **Hard breaks:** `\n` within paragraphs

**Usage:**
```typescript
import { markdownToTiptapJSON, tiptapJSONToMarkdown } from '@/lib/assinatura-digital/utils/markdown-converter';

// Markdown → Tiptap JSON (for editor initialization)
const markdown = '# Título\n\nTexto com **negrito** e {{cliente.nome}}';
const json = markdownToTiptapJSON(markdown);
// { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [...] }, ...] }

// Tiptap JSON → Markdown (for storage)
const markdownOutput = tiptapJSONToMarkdown(json);
// '# Título\n\nTexto com **negrito** e {{cliente.nome}}'
```

## Utilities

### Mock Data Generator

Generates realistic mock data for template preview during editing (no real client/action data needed).

**Location:** `lib/assinatura-digital/utils/mock-data-generator.ts`

**Functions:**

#### `generateDummyBase64Image(width, height, text): string`

Generates a minimal valid PNG data URI for use in preview images.

**Parameters:**
- `width` (number) - Ignored (always returns 1x1 PNG)
- `height` (number) - Ignored (always returns 1x1 PNG)
- `text` (string) - Ignored (always returns 1x1 PNG)

**Returns:** Data URI string (`data:image/png;base64,...`)

**Example:**
```typescript
import { generateDummyBase64Image } from '@/lib/assinatura-digital/utils';

const signatureImage = generateDummyBase64Image(200, 100, 'ASSINATURA');
const photoImage = generateDummyBase64Image(150, 200, 'FOTO');
```

---

#### `generateMockDataForPreview(template, options): MockPreviewData`

Generates complete mock data for PDF preview generation.

**Parameters:**
- `template` (Template) - Template to generate data for
- `options` (optional):
  - `segmentoId?: number` - Custom segment ID (default: 1)
  - `segmentoNome?: string` - Custom segment name (default: 'Segmento de Teste')
  - `includeFoto?: boolean` - Include photo image (default: true)
  - `includeGeolocation?: boolean` - Include geolocation (default: false, not used in Sinesys)

**Returns:** `MockPreviewData` object:
```typescript
interface MockPreviewData {
  cliente: ClienteBasico; // { id: 999, nome: 'João da Silva Santos', cpf: '12345678901', cnpj: null }
  segmento: SegmentoBasico; // { id, nome, slug, ativo }
  formulario: FormularioBasico; // { id: 0, formulario_uuid: 'preview', nome: 'Preview', ... }
  protocolo: string; // 'PREVIEW-{timestamp}'
  ip: string; // '192.168.1.100'
  user_agent: string; // 'Mozilla/5.0 (Preview Generator)'
  extras: Record<string, unknown>; // Empty object (extensible)
  images: {
    assinaturaBase64?: string; // Always included
    fotoBase64?: string; // Included if includeFoto=true
  };
}
```

**Example:**
```typescript
import { generateMockDataForPreview } from '@/lib/assinatura-digital/utils';
import { generatePdfFromTemplate } from '@/backend/formsign-signature/services/template-pdf.service';

const template = await getTemplate('123');
const mockData = generateMockDataForPreview(template, {
  segmentoId: 5,
  segmentoNome: 'Jurídico SP',
  includeFoto: true,
});

const pdfBuffer = await generatePdfFromTemplate(
  template,
  {
    cliente: mockData.cliente,
    segmento: mockData.segmento,
    formulario: mockData.formulario,
    protocolo: mockData.protocolo,
    ip: mockData.ip,
    user_agent: mockData.user_agent,
  },
  mockData.extras,
  mockData.images
);