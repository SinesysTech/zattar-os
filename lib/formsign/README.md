import { getAvailableVariables } from '@/lib/formsign/utils/variable-filter';

const variables = getAvailableVariables(['apps', 'trabalhista']);
// Returns: comum + apps + trabalhista variables, sorted by category and label

variables.forEach(v => {
  console.log(`${v.category}: ${v.label} (${v.value})`);
});
```

**Integration:** Used by `RichTextEditor` and `MarkdownRichTextEditor` to populate variable insertion combobox.

### Markdown Converter (`utils/markdown-converter.ts`)

Bidirectional conversion between Markdown and Tiptap JSON.

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
import { markdownToTiptapJSON, tiptapJSONToMarkdown } from '@/lib/formsign/utils/markdown-converter';

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

**Location:** `lib/formsign/utils/mock-data-generator.ts`

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
import { generateDummyBase64Image } from '@/lib/formsign/utils';

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
import { generateMockDataForPreview } from '@/lib/formsign/utils';
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
```

**Usage in API Routes:**
See `/api/assinatura-digital/admin/templates/[id]/preview-test/route.ts` for full integration example.

**Mock Values Generated:**
- Cliente: João da Silva Santos (CPF: 123.456.789-01)
- Protocolo: PREVIEW-{timestamp}
- IP: 192.168.1.100
- User Agent: Mozilla/5.0 (Preview Generator)
- Signature: 1x1 transparent PNG
- Photo: 1x1 transparent PNG (if enabled)

**Note:** All data is fictional and should NOT be persisted to database.
