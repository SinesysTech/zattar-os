# Arquitetura Técnica - Módulo de Assinatura Digital

## Índice
1. Visão Geral
2. Arquitetura de Alto Nível
3. Estrutura de Diretórios
4. Fluxo de Dados
5. Componentes Principais
6. APIs Backend
7. Banco de Dados
8. Segurança
9. Performance
10. Dependências

## 1. Visão Geral

O módulo de Assinatura Digital (Formsign) é uma feature completa integrada ao Sinesys que permite:
- Criação visual de templates PDF com campos variáveis
- Construção de formulários dinâmicos com schema JSON
- Fluxo público de preenchimento e assinatura
- Geração de PDFs assinados digitalmente

**Stack Tecnológico:**
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Backend:** Next.js API Routes, Supabase (PostgreSQL)
- **State Management:** Zustand
- **Validação:** Zod + react-hook-form
- **PDF:** react-pdf + pdfjs-dist
- **Drag-and-Drop:** @dnd-kit
- **Rich Text:** Tiptap

## 2. Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                     SINESYS (Next.js 14)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │   Admin Pages    │         │   Public Pages   │        │
│  │  (Dashboard)     │         │   (Formulário)   │        │
│  │                  │         │                  │        │
│  │ • Templates      │         │ • Verificar CPF  │        │
│  │ • Formulários    │         │ • Dados Pessoais │        │
│  │ • Segmentos      │         │ • Form Dinâmico  │        │
│  │                  │         │ • Captura Foto   │        │
│  │ • Editor Visual  │         │ • Geolocalização │        │
│  │ • Schema Builder │         │ • Preview PDF    │        │
│  └────────┬─────────┘         │ • Assinatura     │        │
│           │                   └────────┬─────────┘        │
│           │                            │                  │
│           └────────────┬───────────────┘                  │
│                        │                                  │
│           ┌────────────▼─────────────┐                   │
│           │   Formsign Components    │                   │
│           │                          │                   │
│           │ • Editor (FieldMapping)  │                   │
│           │ • Schema Builder         │                   │
│           │ • Form Renderer          │                   │
│           │ • Signature Canvas       │                   │
│           │ • Photo Capture          │                   │
│           └────────────┬─────────────┘                   │
│                        │                                  │
│           ┌────────────▼─────────────┐                   │
│           │    Zustand Stores        │                   │
│           │  (formulario-store)      │                   │
│           └────────────┬─────────────┘                   │
│                        │                                  │
│           ┌────────────▼─────────────┐                   │
│           │      API Routes          │                   │
│           │                          │                   │
│           │ • /admin/templates       │                   │
│           │ • /admin/formularios     │                   │
│           │ • /admin/segmentos       │                   │
│           │ • /forms/*               │                   │
│           │ • /signature/*           │                   │
│           └────────────┬─────────────┘                   │
│                        │                                  │
└────────────────────────┼──────────────────────────────────┘
                         │
            ┌────────────▼─────────────┐
            │   Supabase (PostgreSQL)  │
            │                          │
            │ • formsign_templates     │
            │ • formsign_formularios   │
            │ • formsign_segmentos     │
            │ • formsign_sessoes       │
            │ • clientes               │
            │ • Storage (PDFs)         │
            └──────────────────────────┘
```

## 3. Estrutura de Diretórios

```
sinesys/
├── app/
│   ├── (dashboard)/
│   │   └── assinatura-digital/
│   │       └── admin/
│   │           ├── templates/
│   │           │   ├── page.tsx                    # Lista de templates
│   │           │   ├── [id]/
│   │           │   │   └── edit/
│   │           │   │       └── page.tsx            # Editor de template
│   │           │   ├── new/
│   │           │   │   └── edit/
│   │           │   │       └── page.tsx            # Criar template
│   │           │   └── components/
│   │           │       ├── template-create-dialog.tsx
│   │           │       ├── template-duplicate-dialog.tsx
│   │           │       └── template-delete-dialog.tsx
│   │           ├── formularios/
│   │           │   ├── page.tsx                    # Lista de formulários
│   │           │   ├── [id]/
│   │           │   │   └── schema/
│   │           │   │       └── page.tsx            # Editor de schema
│   │           │   └── components/
│   │           │       ├── formulario-create-dialog.tsx
│   │           │       ├── formulario-duplicate-dialog.tsx
│   │           │       └── formulario-delete-dialog.tsx
│   │           └── segmentos/
│   │               ├── page.tsx                    # Lista de segmentos
│   │               └── components/
│   │                   ├── segmento-create-dialog.tsx
│   │                   ├── segmento-edit-dialog.tsx
│   │                   ├── segmento-duplicate-dialog.tsx
│   │                   └── segmento-delete-dialog.tsx
│   ├── formulario/
│   │   └── [segmento]/
│   │       └── [formulario]/
│   │           ├── page.tsx                        # Página pública
│   │           └── not-found.tsx                   # 404 customizado
│   └── api/
│       └── assinatura-digital/
│           ├── admin/
│           │   ├── templates/
│           │   │   ├── route.ts                    # GET, POST
│           │   │   └── [id]/
│           │   │       ├── route.ts                # GET, PUT, DELETE
│           │   │       └── preview-test/
│           │   │           └── route.ts            # POST
│           │   ├── formularios/
│           │   │   ├── route.ts                    # GET, POST
│           │   │   └── [id]/
│           │   │       ├── route.ts                # GET, PUT, DELETE
│           │   │       └── schema/
│           │   │           └── route.ts            # GET, PUT
│           │   └── segmentos/
│           │       ├── route.ts                    # GET, POST
│           │       └── [id]/
│           │           └── route.ts                # GET, PUT, DELETE
│           ├── forms/
│           │   ├── verificar-cpf/
│           │   │   └── route.ts                    # POST
│           │   └── save-client/
│           │       └── route.ts                    # POST
│           ├── signature/
│           │   ├── preview/
│           │   │   └── route.ts                    # POST
│           │   └── finalizar/
│           │       └── route.ts                    # POST
│           └── utils/
│               └── get-client-ip/
│                   └── route.ts                    # GET
├── components/
│   └── formsign/
│       ├── editor/                                 # Editor de templates
│       │   ├── FieldMappingEditor.tsx             # Componente principal (2177 linhas)
│       │   ├── ToolbarButtons.tsx                 # Toolbar desktop
│       │   ├── ToolbarButtonsMobile.tsx           # Toolbar mobile
│       │   ├── PdfCanvasArea.tsx                  # Canvas de edição
│       │   ├── PropertiesPopover.tsx              # Painel de propriedades
│       │   ├── TemplateInfoPopover.tsx            # Metadados do template
│       │   ├── ReplacePdfDialog.tsx               # Substituir PDF
│       │   ├── CreateTemplateForm.tsx             # Form de criação
│       │   ├── RichTextEditor.tsx                 # Editor Tiptap
│       │   ├── RichTextEditorPopover.tsx          # Popover do editor
│       │   ├── MarkdownRichTextEditor.tsx         # Editor Markdown
│       │   ├── MarkdownRichTextEditorDialog.tsx   # Dialog do editor
│       │   └── extensions/
│       │       └── Variable.ts                    # Extensão Tiptap para variáveis
│       ├── schema-builder/                        # Construtor de schemas
│       │   ├── FormSchemaBuilder.tsx              # Componente principal (736 linhas)
│       │   ├── FieldPalette.tsx                   # Paleta de campos
│       │   ├── SchemaCanvas.tsx                   # Canvas drag-and-drop
│       │   └── FieldPropertiesPanel.tsx           # Painel de propriedades (817 linhas)
│       ├── form/                                   # Fluxo público
│       │   ├── formulario-page.tsx                # Wrapper principal
│       │   ├── formulario-container.tsx           # Gerenciador de steps
│       │   ├── verificar-cpf.tsx                  # Step 1: CPF
│       │   ├── dados-pessoais.tsx                 # Step 2: Dados pessoais
│       │   ├── dynamic-form-step.tsx              # Step 3: Form dinâmico
│       │   ├── dynamic-form-renderer.tsx          # Renderizador de forms
│       │   ├── visualizacao-pdf-step.tsx          # Step: Preview PDF
│       │   ├── visualizacao-markdown-step.tsx     # Step: Preview Markdown
│       │   ├── assinatura-manuscrita-step.tsx     # Step: Assinatura
│       │   ├── sucesso.tsx                        # Step: Sucesso
│       │   └── form-step-layout.tsx               # Layout de steps
│       ├── signature/                             # Assinatura
│       │   ├── canvas-assinatura.tsx              # Canvas de assinatura
│       │   └── preview-assinatura.tsx             # Preview de assinatura
│       ├── capture/                               # Captura
│       │   ├── captura-foto.tsx                   # Captura de foto
│       │   ├── captura-foto-step.tsx              # Step de foto
│       │   └── geolocation-step.tsx               # Step de geolocalização
│       ├── inputs/                                # Inputs formatados
│       │   ├── input-cpf.tsx
│       │   ├── input-cpf-cnpj.tsx
│       │   ├── input-telefone.tsx
│       │   ├── input-cep.tsx
│       │   └── input-data.tsx
│       └── pdf/                                    # Preview de PDF
│           ├── PdfPreview.tsx
│           └── PdfPreviewDynamic.tsx
├── lib/
│   └── formsign/
│       ├── validators/                            # Validadores
│       │   ├── cpf.validator.ts
│       │   ├── cnpj.validator.ts
│       │   └── telefone.validator.ts
│       ├── formatters/                            # Formatadores
│       │   ├── cpf.formatter.ts
│       │   ├── cnpj.formatter.ts
│       │   ├── telefone.formatter.ts
│       │   ├── cep.formatter.ts
│       │   └── date.formatter.ts
│       ├── validations/                           # Validações de negócio
│       │   ├── business.validations.ts
│       │   ├── verificarCPF.schema.ts
│       │   └── dadosPessoais.schema.ts
│       ├── form-schema/                           # Schema de formulários
│       │   ├── validator-registry.ts
│       │   ├── schema-validator.ts
│       │   └── zod-generator.ts
│       ├── utils/                                 # Utilitários
│       │   ├── format-template.ts
│       │   ├── formulario-utils.ts
│       │   ├── segmento-utils.ts
│       │   ├── markdown-converter.ts
│       │   ├── markdown-renderer.ts
│       │   ├── variable-filter.ts
│       │   ├── rich-text-parser.ts
│       │   └── mock-data-generator.ts
│       ├── constants/                             # Constantes
│       │   ├── apiRoutes.ts
│       │   ├── estadosCivis.ts
│       │   └── nacionalidades.ts
│       └── validation/
│           └── markdown.ts
├── types/
│   └── formsign/
│       ├── form-schema.types.ts                   # Tipos de schemas
│       ├── template.types.ts                      # Tipos de templates
│       ├── formulario-entity.types.ts             # Tipos de formulários
│       ├── formulario.types.ts                    # Tipos de fluxo
│       ├── segmento.types.ts                      # Tipos de segmentos
│       ├── cliente-adapter.types.ts               # Adapter de cliente
│       └── acao-adapter.types.ts                  # Adapter de ação
├── backend/
│   ├── types/
│   │   ├── formsign-admin/
│   │   │   └── types.ts                           # Tipos backend admin
│   │   └── formsign-signature/
│   │       └── types.ts                           # Tipos backend signature
│   └── formsign-admin/
│       └── services/
│           ├── templates.service.ts               # CRUD templates
│           ├── formularios.service.ts             # CRUD formulários
│           └── segmentos.service.ts               # CRUD segmentos
└── docs/
    └── formsign/
        ├── README.md                              # Visão geral
        ├── PERMISSIONS.md                         # Permissões
        ├── GUIA_ADMINISTRADOR.md                  # Guia admin
        ├── GUIA_USUARIO.md                        # Guia usuário
        ├── ARQUITETURA.md                         # Este arquivo
        └── TROUBLESHOOTING.md                     # Troubleshooting
```

## 4. Fluxo de Dados

### Fluxo Admin: Criação de Template

```
1. Admin acessa /assinatura-digital/admin/templates
2. Clica em "Novo Template"
3. TemplateCreateDialog abre
4. Admin faz upload de PDF
5. Preenche metadados (nome, descrição)
6. POST /api/assinatura-digital/admin/templates
   ├─ Valida permissões (requirePermission)
   ├─ Upload PDF para Supabase Storage
   ├─ Cria registro em formsign_templates
   └─ Retorna template_uuid
7. Redireciona para /templates/[uuid]/edit
8. FieldMappingEditor carrega
   ├─ GET /api/assinatura-digital/admin/templates/[id]
   ├─ Renderiza PDF com PdfPreview
   └─ Inicializa canvas vazio
9. Admin adiciona campos (drag, resize, properties)
10. Autosave a cada 5s
    └─ PUT /api/assinatura-digital/admin/templates/[id]
11. Admin testa preview
    └─ POST /api/assinatura-digital/admin/templates/[id]/preview-test
        ├─ Gera dados mock
        ├─ Chama backend PDF service
        └─ Retorna PDF base64
12. Admin ativa template (status: ativo)
```

### Fluxo Admin: Criação de Formulário

```
1. Admin acessa /assinatura-digital/admin/formularios
2. Clica em "Novo Formulário"
3. FormularioCreateDialog abre
4. Admin preenche:
   ├─ Nome, slug (auto-gerado)
   ├─ Segmento (select)
   ├─ Templates (multi-select)
   ├─ Foto necessária (toggle)
   └─ Geolocalização necessária (toggle)
5. POST /api/assinatura-digital/admin/formularios
   ├─ Valida permissões
   ├─ Valida slug único
   ├─ Cria registro em formsign_formularios
   └─ Retorna formulario_id
6. Admin clica em "Editar Schema"
7. Redireciona para /formularios/[id]/schema
8. FormSchemaBuilder carrega
   ├─ GET /api/assinatura-digital/admin/formularios/[id]
   └─ Inicializa com schema vazio ou existente
9. Admin constrói schema:
   ├─ Adiciona seções
   ├─ Arrasta campos da paleta
   ├─ Configura propriedades (label, validação, condicional)
   └─ Testa preview com DynamicFormRenderer
10. Admin salva schema
    └─ PUT /api/assinatura-digital/admin/formularios/[id]/schema
        ├─ Valida schema com validateFormSchema
        ├─ Incrementa versão (1.0.0 → 1.1.0)
        └─ Atualiza form_schema
```

### Fluxo Público: Preenchimento de Formulário

```
1. Usuário acessa /formulario/[segmento]/[formulario]
2. Server Component:
   ├─ Valida slugs (kebab-case)
   ├─ getSegmentoBySlug()
   ├─ getFormularioBySlugAndSegmentoId()
   ├─ Parseia form_schema e metadados_seguranca
   └─ Renderiza FormularioPage com props
3. FormularioPage inicializa formulario-store
4. FormularioContainer gerencia steps:

   Step 1: VerificarCPF
   ├─ Usuário digita CPF
   ├─ POST /api/assinatura-digital/forms/verificar-cpf
   │   ├─ Valida CPF
   │   ├─ Busca cliente em clientes table
   │   └─ Retorna { existe, cliente? }
   └─ Store: setDadosPessoais({ cpf, cliente_id? })

   Step 2: DadosPessoais
   ├─ Se cliente existe: preenche campos
   ├─ Usuário preenche/edita dados
   ├─ CEP: busca endereço via ViaCEP
   ├─ POST /api/assinatura-digital/forms/save-client
   │   ├─ Upsert em clientes table
   │   └─ Retorna cliente_id
   └─ Store: setDadosPessoais(dados completos)

   Step 3: DynamicFormStep
   ├─ Carrega schema do formulário (cache no store)
   ├─ DynamicFormRenderer renderiza campos
   ├─ Usuário preenche campos dinâmicos
   ├─ Validação com Zod (gerado do schema)
   ├─ Enriquecimento de dados:
   │   ├─ Calcula TRT baseado em UF
   │   ├─ Converte booleans para V/F
   │   └─ Adiciona nomes de reclamada/modalidade
   └─ Store: setDadosFormulario(dados)

   Step 4: CapturaFotoStep (se foto_necessaria)
   ├─ Solicita permissão de câmera
   ├─ CapturaFoto renderiza webcam
   ├─ Usuário captura foto (500x500px, JPEG 0.8)
   ├─ Valida tamanho (< 5MB)
   └─ Store: setFotoBase64(base64)

   Step 5: GeolocationStep (se geolocation_necessaria)
   ├─ Solicita permissão de localização
   ├─ Navigator.geolocation.getCurrentPosition()
   ├─ Captura lat, lng, accuracy, timestamp
   ├─ Valida precisão (< 100m)
   └─ Store: setGeolocation(coords)

   Step 6: VisualizacaoPdfStep
   ├─ POST /api/assinatura-digital/signature/preview
   │   ├─ Monta PdfDataContext com dados do store
   │   ├─ Para cada template_id:
   │   │   ├─ Busca template
   │   │   ├─ Substitui variáveis nos campos
   │   │   ├─ Gera PDF com backend service
   │   │   └─ Retorna base64
   │   └─ Retorna array de PDFs
   ├─ PdfPreviewDynamic renderiza PDFs
   ├─ Usuário revisa
   └─ Store: setVisualizacaoPdf(pdfs)

   Step 7: AssinaturaManuscritaStep
   ├─ CanvasAssinatura renderiza
   ├─ Usuário assina (captura pontos, traços, tempo)
   ├─ Valida assinatura não vazia
   ├─ GET /api/assinatura-digital/utils/get-client-ip
   ├─ POST /api/assinatura-digital/signature/finalizar
   │   ├─ Valida todos os dados (cliente, formulário, assinatura)
   │   ├─ Cria sessão em formsign_sessoes
   │   ├─ Para cada template:
   │   │   ├─ Monta PdfDataContext completo
   │   │   ├─ Gera PDF final com assinatura
   │   │   ├─ Upload para Supabase Storage
   │   │   └─ Salva URL em sessão
   │   ├─ Registra IP, user-agent, geolocalização
   │   └─ Retorna { sessao_uuid, pdfs: [{ nome, url }] }
   └─ Store: setSucesso(pdfs)

   Step 8: Sucesso
   ├─ Exibe lista de PDFs
   ├─ Botões de download individual
   ├─ Botão de download ZIP (jszip)
   └─ Opção de preencher novo formulário
```

## 5. Componentes Principais

### FieldMappingEditor (2177 linhas)

**Responsabilidades:**
- Renderizar PDF como fundo
- Gerenciar campos (adicionar, mover, redimensionar, deletar)
- Controles de zoom e navegação de páginas
- Autosave a cada 5 segundos
- Preview de teste com dados mock
- Modo criação vs edição

**Estado interno:**
```typescript
interface EditorState {
  template: Template;
  fields: TemplateCampo[];
  selectedFieldId: string | null;
  mode: 'select' | 'add-text' | 'add-image' | 'add-rich-text';
  zoom: number;
  currentPage: number;
  isDragging: boolean;
  isResizing: boolean;
  hasUnsavedChanges: boolean;
  previewPdfUrl: string | null;
  showPreview: boolean;
}
```

**Hooks principais:**
- `useFieldManagement()` - CRUD de campos
- `useDragAndResize()` - Drag-and-drop e resize
- `useAutosave()` - Autosave com debounce
- `useNavigationGuard()` - Alerta de mudanças não salvas

### FormSchemaBuilder (736 linhas)

**Responsabilidades:**
- Gerenciar seções e campos do schema
- Drag-and-drop da paleta para canvas
- Reordenação de campos dentro de seções
- Painel de propriedades para edição
- Preview do formulário renderizado
- Validação de schema
- Import/export JSON

**Estado interno:**
```typescript
interface BuilderState {
  schema: DynamicFormSchema;
  selectedFieldId: string | null;
  selectedSectionId: string | null;
  mode: 'edit' | 'preview';
  hasUnsavedChanges: boolean;
}
```

**Integração com @dnd-kit:**
- `DndContext` - Contexto global de drag-and-drop
- `useDraggable` - Campos da paleta
- `useDroppable` - Seções do canvas
- `useSortable` - Campos dentro de seções

### DynamicFormRenderer

**Responsabilidades:**
- Renderizar formulário a partir de schema JSON
- Validação com Zod (gerado dinamicamente)
- Campos condicionais (mostrar/ocultar)
- Auto-preenchimento (CEP → endereço)
- Enriquecimento de dados (TRT, conversões)
- Integração com react-hook-form

**Tipos de campo suportados:**
```typescript
type FormFieldType =
  | 'text' | 'email' | 'textarea'
  | 'number' | 'date'
  | 'cpf' | 'cnpj' | 'phone' | 'cep'
  | 'select' | 'radio' | 'checkbox';
```

**Lógica condicional:**
```typescript
interface ConditionalRule {
  field: string;                    // ID do campo a verificar
  operator: '=' | '!=' | '>' | '<' | 'contains' | 'empty' | 'notEmpty';
  value: string | number | boolean;
}
```

### formulario-store (Zustand)

**Responsabilidades:**
- Gerenciar estado global do fluxo público
- Navegação entre steps
- Persistência de dados entre steps
- Cache de templates e schemas

**Estado:**
```typescript
interface FormularioStore {
  // Identificadores
  sessionUuid: string;
  segmentoId: number | null;
  formularioId: number | null;
  templateIds: string[];

  // Dados do usuário
  dadosPessoais: DadosPessoais | null;
  dadosFormulario: DynamicFormData | null;
  fotoBase64: string | null;
  latitude: number | null;
  longitude: number | null;
  geolocationAccuracy: number | null;
  assinaturaBase64: string | null;
  assinaturaMetrics: AssinaturaMetrics | null;

  // Navegação
  currentStep: number;
  totalSteps: number;

  // Cache
  cachedTemplates: Map<string, Template>;
  cachedFormSchema: DynamicFormSchema | null;

  // Ações
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  setDadosPessoais: (dados: DadosPessoais) => void;
  setDadosFormulario: (dados: DynamicFormData) => void;
  // ... outras ações
}
```

## 6. APIs Backend

### Autenticação e Autorização

Todas as rotas admin usam `requirePermission()`:

```typescript
// Exemplo: GET /api/assinatura-digital/admin/templates
export async function GET(request: NextRequest) {
  const user = await requirePermission('formsign_admin', 'listar');
  // ... lógica
}
```

**Permissões:**
- `formsign_admin.listar` - Listar recursos
- `formsign_admin.visualizar` - Ver detalhes
- `formsign_admin.criar` - Criar novos
- `formsign_admin.editar` - Modificar existentes
- `formsign_admin.deletar` - Remover

### Rotas Admin

#### Templates

**GET /api/assinatura-digital/admin/templates**
- Query params: `pagina`, `limite`, `search`, `ativo`, `status`
- Retorna: `{ data: Template[], total: number }`
- Permissão: `listar`

**POST /api/assinatura-digital/admin/templates**
- Body: `{ nome, descricao?, arquivo_original, arquivo_nome, arquivo_tamanho, conteudo_markdown? }`
- Retorna: `{ data: Template }`
- Permissão: `criar`

**GET /api/assinatura-digital/admin/templates/[id]**
- Retorna: `{ data: Template }`
- Permissão: `visualizar`

**PUT /api/assinatura-digital/admin/templates/[id]**
- Body: Partial<Template>
- Retorna: `{ data: Template }`
- Permissão: `editar`

**DELETE /api/assinatura-digital/admin/templates/[id]**
- Retorna: `{ success: true }`
- Permissão: `deletar`

**POST /api/assinatura-digital/admin/templates/[id]/preview-test**
- Body: `{ campos?: TemplateCampo[] }` (opcional, usa campos salvos se omitido)
- Retorna: `{ pdfBase64: string }`
- Permissão: `visualizar`
- Lógica:
  1. Busca template
  2. Merge campos do body com campos salvos
  3. Gera dados mock com `generateMockDataForPreview()`
  4. Chama `generatePdfFromTemplate()` do backend service
  5. Retorna PDF em base64

#### Formulários

**GET /api/assinatura-digital/admin/formularios**
- Query params: `pagina`, `limite`, `search`, `segmento_id[]`, `ativo`, `foto_necessaria`, `geolocation_necessaria`
- Retorna: `{ data: FormsignFormulario[], total: number }`
- Permissão: `listar`

**POST /api/assinatura-digital/admin/formularios**
- Body: `{ nome, slug, segmento_id, template_ids?, descricao?, foto_necessaria, geolocation_necessaria, ativo }`
- Retorna: `{ data: FormsignFormulario }`
- Permissão: `criar`

**GET /api/assinatura-digital/admin/formularios/[id]**
- Retorna: `{ data: FormsignFormulario }`
- Permissão: `visualizar`

**PUT /api/assinatura-digital/admin/formularios/[id]**
- Body: Partial<FormsignFormulario>
- Retorna: `{ data: FormsignFormulario }`
- Permissão: `editar`

**DELETE /api/assinatura-digital/admin/formularios/[id]**
- Retorna: `{ success: true }`
- Permissão: `deletar`

**GET /api/assinatura-digital/admin/formularios/[id]/schema**
- Retorna: `{ data: { form_schema: DynamicFormSchema } }`
- Permissão: `visualizar`

**PUT /api/assinatura-digital/admin/formularios/[id]/schema**
- Body: `{ form_schema: DynamicFormSchema }`
- Retorna: `{ data: FormsignFormulario }`
- Permissão: `editar`
- Lógica:
  1. Valida schema com `validateFormSchema()`
  2. Incrementa versão (1.0.0 → 1.1.0)
  3. Atualiza `form_schema` e `versao`

#### Segmentos

**GET /api/assinatura-digital/admin/segmentos**
- Query params: `pagina`, `limite`, `search`, `ativo`
- Retorna: `{ data: FormsignSegmento[], total: number }`
- Permissão: `listar`
- Inclui `formularios_count` via agregação

**POST /api/assinatura-digital/admin/segmentos**
- Body: `{ nome, slug, descricao?, ativo }`
- Retorna: `{ data: FormsignSegmento }`
- Permissão: `criar`

**GET /api/assinatura-digital/admin/segmentos/[id]**
- Retorna: `{ data: FormsignSegmento }`
- Permissão: `visualizar`

**PUT /api/assinatura-digital/admin/segmentos/[id]**
- Body: Partial<FormsignSegmento>
- Retorna: `{ data: FormsignSegmento }`
- Permissão: `editar`

**DELETE /api/assinatura-digital/admin/segmentos/[id]**
- Retorna: `{ success: true }`
- Permissão: `deletar`
- Valida se não há formulários vinculados (retorna 409 se houver)

### Rotas Públicas

#### Forms

**POST /api/assinatura-digital/forms/verificar-cpf**
- Body: `{ cpf: string }`
- Retorna: `{ existe: boolean, cliente?: ClienteBasico }`
- Sem autenticação
- Lógica:
  1. Valida CPF
  2. Busca em `clientes` table
  3. Se encontrar, retorna dados básicos

**POST /api/assinatura-digital/forms/save-client**
- Body: `DadosPessoais`
- Retorna: `{ cliente_id: number }`
- Sem autenticação
- Lógica:
  1. Valida dados com Zod
  2. Upsert em `clientes` table (por CPF)
  3. Retorna `cliente_id`

#### Signature

**POST /api/assinatura-digital/signature/preview**
- Body: `{ templateIds: string[], context: PdfDataContext }`
- Retorna: `{ pdfs: Array<{ templateId, nome, pdfBase64 }> }`
- Sem autenticação
- Lógica:
  1. Para cada `templateId`:
     - Busca template
     - Substitui variáveis nos campos
     - Chama `generatePdfFromTemplate()`
     - Retorna base64

**POST /api/assinatura-digital/signature/finalizar**
- Body: `FinalizarAssinaturaRequest`
- Retorna: `{ sessao_uuid: string, pdfs: Array<{ nome, url }> }`
- Sem autenticação (removido em FORMSIGN-015)
- Lógica:
  1. Valida todos os dados (cliente, formulário, assinatura)
  2. Cria sessão em `formsign_sessoes`
  3. Para cada template:
     - Monta `PdfDataContext` completo
     - Gera PDF final com assinatura
     - Upload para Supabase Storage (`formsign-pdfs/`)
     - Salva URL em `sessao.pdfs_gerados`
  4. Registra metadados (IP, user-agent, geolocalização, métricas)
  5. Retorna `sessao_uuid` e URLs dos PDFs

#### Utils

**GET /api/assinatura-digital/utils/get-client-ip**
- Retorna: `{ ip: string }`
- Sem autenticação
- Lógica:
  1. Extrai IP de headers (`x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`)
  2. Fallback para `request.ip`

## 7. Banco de Dados

### Schema Supabase

#### formsign_templates

```sql
CREATE TABLE formsign_templates (
  id SERIAL PRIMARY KEY,
  template_uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  arquivo_original TEXT NOT NULL,        -- URL do PDF no Storage
  arquivo_nome VARCHAR(255) NOT NULL,
  arquivo_tamanho INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'rascunho',  -- 'ativo', 'inativo', 'rascunho'
  versao INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT true,
  campos JSONB NOT NULL DEFAULT '[]',    -- Array de TemplateCampo
  conteudo_markdown TEXT,
  criado_por INTEGER REFERENCES usuarios(id),
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_uuid ON formsign_templates(template_uuid);
CREATE INDEX idx_templates_status ON formsign_templates(status);
CREATE INDEX idx_templates_ativo ON formsign_templates(ativo);
```

**Tipo `TemplateCampo` (JSONB):**
```typescript
interface TemplateCampo {
  id: string;                           // UUID
  nome: string;                         // Nome do campo
  tipo: 'texto' | 'assinatura' | 'foto' | 'texto_composto';
  variavel: string;                     // Ex: '{{cliente.nome}}'
  x: number;                            // Coordenada X (px)
  y: number;                            // Coordenada Y (px)
  width: number;                        // Largura (px)
  height: number;                       // Altura (px)
  pagina: number;                       // Número da página (1-indexed)
  tamanho_fonte?: number;               // Tamanho da fonte (pt)
  fonte?: 'Helvetica' | 'Times' | 'Courier';
  conteudo_composto?: ConteudoComposto; // Para texto_composto
}

interface ConteudoComposto {
  type: 'doc';
  content: Array<{
    type: 'paragraph' | 'heading';
    content?: Array<{
      type: 'text' | 'variable';
      text?: string;
      attrs?: { variable: string };
    }>;
  }>;
}
```

#### formsign_formularios

```sql
CREATE TABLE formsign_formularios (
  id SERIAL PRIMARY KEY,
  formulario_uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  segmento_id INTEGER NOT NULL REFERENCES formsign_segmentos(id),
  template_ids TEXT[] NOT NULL DEFAULT '{}',  -- Array de template_uuids
  descricao TEXT,
  form_schema JSONB NOT NULL DEFAULT '{"sections":[]}',  -- DynamicFormSchema
  versao VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  foto_necessaria BOOLEAN NOT NULL DEFAULT false,
  geolocation_necessaria BOOLEAN NOT NULL DEFAULT false,
  metadados_seguranca JSONB NOT NULL DEFAULT '[]',  -- Array de MetadadoSeguranca
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por INTEGER REFERENCES usuarios(id),
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(segmento_id, slug)
);

CREATE INDEX idx_formularios_uuid ON formsign_formularios(formulario_uuid);
CREATE INDEX idx_formularios_segmento ON formsign_formularios(segmento_id);
CREATE INDEX idx_formularios_slug ON formsign_formularios(slug);
CREATE INDEX idx_formularios_ativo ON formsign_formularios(ativo);
```

**Tipo `DynamicFormSchema` (JSONB):**
```typescript
interface DynamicFormSchema {
  sections: Array<{
    id: string;
    title: string;
    description?: string;
    fields: Array<{
      id: string;
      type: FormFieldType;
      label: string;
      placeholder?: string;
      description?: string;
      required: boolean;
      width: 33 | 50 | 100;              // Porcentagem
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        message?: string;
      };
      options?: Array<{                  // Para select, radio, checkbox
        value: string;
        label: string;
      }>;
      conditional?: ConditionalRule;
    }>;
  }>;
}
```

**Tipo `MetadadoSeguranca` (JSONB):**
```typescript
interface MetadadoSeguranca {
  tipo: 'ip' | 'geolocation' | 'user_agent' | 'timestamp' | 'assinatura_metrics';
  obrigatorio: boolean;
}
```

#### formsign_segmentos

```sql
CREATE TABLE formsign_segmentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_segmentos_slug ON formsign_segmentos(slug);
CREATE INDEX idx_segmentos_ativo ON formsign_segmentos(ativo);
```

#### formsign_sessoes

```sql
CREATE TABLE formsign_sessoes (
  id SERIAL PRIMARY KEY,
  sessao_uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  formulario_id INTEGER NOT NULL REFERENCES formsign_formularios(id),
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  dados_formulario JSONB NOT NULL,       -- DynamicFormData
  assinatura_base64 TEXT NOT NULL,
  assinatura_metrics JSONB,              -- AssinaturaMetrics
  foto_base64 TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  geolocation_accuracy NUMERIC(10, 2),
  geolocation_timestamp TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  pdfs_gerados JSONB NOT NULL,           -- Array<{ nome, url }>
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessoes_uuid ON formsign_sessoes(sessao_uuid);
CREATE INDEX idx_sessoes_formulario ON formsign_sessoes(formulario_id);
CREATE INDEX idx_sessoes_cliente ON formsign_sessoes(cliente_id);
CREATE INDEX idx_sessoes_criado_em ON formsign_sessoes(criado_em);
```

**Tipo `AssinaturaMetrics` (JSONB):**
```typescript
interface AssinaturaMetrics {
  pontos: number;                        // Número de pontos capturados
  tracos: number;                        // Número de traços
  tempo_assinatura: number;              // Tempo em ms
  largura: number;                       // Largura da assinatura (px)
  altura: number;                        // Altura da assinatura (px)
}
```

#### clientes

```sql
-- Tabela já existente no Sinesys, usada pelo Formsign
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  rg VARCHAR(20),
  data_nascimento DATE,
  nacionalidade VARCHAR(100),
  estado_civil VARCHAR(50),
  profissao VARCHAR(100),
  endereco_logradouro VARCHAR(255),
  endereco_numero VARCHAR(20),
  endereco_complemento VARCHAR(100),
  endereco_bairro VARCHAR(100),
  endereco_cidade VARCHAR(100),
  endereco_uf VARCHAR(2),
  endereco_cep VARCHAR(9),
  telefone VARCHAR(20),
  email VARCHAR(255),
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clientes_cpf ON clientes(cpf);
```

### Supabase Storage

**Bucket: `formsign-pdfs`**
- Armazena PDFs originais (templates) e PDFs gerados (assinados)
- Estrutura:
  ```
  formsign-pdfs/
  ├── templates/
  │   └── [template_uuid].pdf
  └── sessoes/
      └── [sessao_uuid]/
          ├── [template_nome]_[cliente_nome]_[data].pdf
          └── ...
  ```
- Políticas RLS:
  - Templates: leitura pública, escrita apenas admin
  - Sessões: leitura apenas com `sessao_uuid`, escrita apenas backend

## 8. Segurança

### Autenticação

**Rotas Admin:**
- Requerem autenticação via Supabase Auth
- Middleware `requirePermission()` valida JWT e permissões
- Cache de permissões por 5 minutos

**Rotas Públicas:**
- Sem autenticação (formulários são públicos)
- Validação de dados via Zod
- Rate limiting (TODO: implementar)

### Autorização

**Matriz de Permissões:**
```typescript
const FORMSIGN_PERMISSIONS = {
  recurso: 'formsign_admin',
  operacoes: ['listar', 'visualizar', 'criar', 'editar', 'deletar']
};
```

**Verificação:**
```typescript
// Backend
const user = await requirePermission('formsign_admin', 'editar');

// Frontend
const { temPermissao } = useMinhasPermissoes('formsign_admin');
const canEdit = temPermissao('formsign_admin', 'editar');
```

### Validação de Dados

**Backend:**
- Todas as rotas validam input com Zod
- Sanitização de strings (trim, escape)
- Validação de tipos (CPF, e-mail, telefone)

**Frontend:**
- Validação em tempo real com react-hook-form + Zod
- Máscaras de input (CPF, telefone, CEP)
- Validação de arquivos (tipo, tamanho)

### XSS e Injection

**Markdown:**
- Sanitização com `rehype-sanitize`
- Whitelist de tags HTML permitidas
- Escape de variáveis

**SQL:**
- Uso de Supabase client (prepared statements)
- Sem concatenação de strings em queries

**PDF:**
- Validação de campos antes de renderizar
- Escape de caracteres especiais

### CSRF

- Next.js protege automaticamente rotas API
- Tokens CSRF em formulários (via Supabase Auth)

### Rate Limiting

**TODO:** Implementar rate limiting nas rotas públicas:
- `/forms/verificar-cpf`: 10 req/min por IP
- `/forms/save-client`: 5 req/min por IP
- `/signature/finalizar`: 3 req/min por IP

## 9. Performance

### Frontend

**Code Splitting:**
- Componentes pesados carregados dinamicamente:
  ```typescript
  const FieldMappingEditor = dynamic(() => import('@/components/formsign/editor/FieldMappingEditor'));
  const PdfPreviewDynamic = dynamic(() => import('@/components/formsign/pdf/PdfPreviewDynamic'));
  ```

**Memoização:**
- `useMemo` para cálculos pesados (ex: geração de Zod schema)
- `useCallback` para handlers de eventos
- `React.memo` para componentes puros

**Debouncing:**
- Busca: 500ms
- Autosave: 5s
- CEP lookup: 1s

**Lazy Loading:**
- PDFs carregados sob demanda
- Imagens com `loading="lazy"`

### Backend

**Caching:**
- Permissões: 5 minutos (Redis ou in-memory)
- Templates: cache no store do frontend
- Schemas: cache no store do frontend

**Paginação:**
- Todas as listagens paginadas (padrão: 50 itens)
- Cursor-based pagination para grandes volumes (TODO)

**Índices:**
- Todos os campos de busca indexados
- Índices compostos para queries frequentes

**N+1 Queries:**
- Uso de `select` com joins no Supabase
- Agregações em queries separadas (ex: `formularios_count`)

### PDF Generation

**Otimizações:**
- Geração assíncrona (não bloqueia UI)
- Compressão de imagens (JPEG quality 0.8)
- Reutilização de fontes
- Cache de templates PDF

**Limites:**
- PDF máximo: 10MB
- Timeout: 30s

## 10. Dependências

### Produção

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "typescript": "^5.0.0",
    "zustand": "^4.4.0",
    "zod": "^3.22.4",
    "react-hook-form": "^7.53.2",
    "@hookform/resolvers": "^3.9.1",
    "react-pdf": "^9.1.0",
    "pdfjs-dist": "^4.10.38",
    "react-markdown": "^10.1.0",
    "rehype-raw": "^7.0.0",
    "rehype-sanitize": "^7.0.0",
    "react-dropzone": "^14.3.8",
    "react-signature-canvas": "^1.0.6",
    "react-webcam": "^7.2.0",
    "react-imask": "^7.6.1",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@tiptap/react": "^3.6.6",
    "@tiptap/starter-kit": "^3.6.6",
    "@tiptap/extension-placeholder": "^3.6.6",
    "@tiptap/extension-text-align": "^3.6.6",
    "@tiptap/extension-link": "^3.6.6",
    "jszip": "^3.10.1",
    "uuid": "^13.0.0",
    "sonner": "^1.0.0",
    "lucide-react": "^0.400.0"
  }
}
```

### Desenvolvimento

```json
{
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/uuid": "^10.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

**Última atualização:** 2024-01-15
**Versão:** 1.0.0
**Autor:** Equipe Sinesys