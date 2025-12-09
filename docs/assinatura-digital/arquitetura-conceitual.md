# Arquitetura Conceitual - Módulo de Assinatura Digital

## Visão Geral

O módulo de assinatura digital é um sistema completo e robusto para captura, validação e armazenamento de assinaturas eletrônicas com garantias de segurança e auditoria. O sistema permite que usuários externos (não autenticados) assinem documentos digitalmente através de formulários públicos, enquanto administradores internos gerenciam templates, formulários e segmentos de negócio.

### Princípios Fundamentais

1. **Agnóstico de Domínio**: O sistema não é específico para jurídico ou qualquer outro segmento. Utiliza conceitos genéricos como "segmento", "formulário" e "ação" ao invés de termos específicos de domínio.

2. **Segurança por Camadas**: Múltiplas camadas de validação e auditoria garantem integridade e rastreabilidade de cada assinatura.

3. **Flexibilidade**: Formulários dinâmicos baseados em JSON Schema permitem criar diferentes tipos de fluxos sem alterar código.

4. **Rastreabilidade**: Cada assinatura captura metadados de segurança (IP, user-agent, geolocalização) e gera protocolo único.

---

## Arquitetura Lógica

### Fluxo Macro do Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FLUXO ADMINISTRATIVO                            │
│  (Usuários Autenticados - Dashboard)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. Admin cria SEGMENTO (ex: "Jurídico", "RH", "Comercial")             │
│  2. Admin cria TEMPLATE PDF com campos mapeados                          │
│  3. Admin cria FORMULÁRIO vinculado ao segmento                          │
│  4. Admin define SCHEMA JSON do formulário (campos dinâmicos)            │
│  5. Admin vincula templates ao formulário                                │
│  6. Admin ativa formulário para uso público                              │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          FLUXO PÚBLICO                                    │
│  (Usuários Não Autenticados - URL Pública)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. Cliente acessa URL pública do formulário                             │
│  2. Verifica CPF → Sistema valida e busca dados existentes               │
│  3. Preenche dados pessoais → Validação frontend + backend               │
│  4. Preenche formulário dinâmico → Campos baseados no schema JSON        │
│  5. Captura foto (opcional) → Webcam + validação de qualidade            │
│  6. Captura geolocalização (opcional) → GPS + precisão                   │
│  7. Visualiza PDF gerado → Preview antes de assinar                      │
│  8. Assina manuscritamente → Canvas touch/mouse                          │
│  9. Sistema finaliza → Gera PDF, salva artefatos, gera protocolo         │
│  10. Cliente recebe protocolo e PDFs → Download disponível               │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Camadas da Arquitetura

#### 1. Camada de Apresentação (Frontend)

- **Componentes Públicos**: Formulários acessíveis sem autenticação
- **Componentes Administrativos**: Gerenciamento de templates, formulários e segmentos
- **Validação Progressiva**: Feedback imediato ao usuário durante preenchimento
- **Editor Visual**: Interface drag-and-drop para mapear campos em PDFs

#### 2. Camada de API (Backend - Next.js API Routes)

- **Endpoints Públicos**: Sem autenticação (ex: finalizar assinatura)
- **Endpoints Administrativos**: Requerem autenticação e permissões
- **Validação Zod**: Validação rigorosa de payloads com schemas tipados
- **Extração de Metadados**: IP, user-agent capturados no servidor

#### 3. Camada de Serviços (Business Logic)

- **signature.service**: Geração de preview e finalização de assinaturas
- **template-pdf.service**: Geração de PDFs a partir de templates
- **storage.service**: Upload de artefatos para Backblaze B2
- **data.service**: Busca de dados de cliente, template, formulário e segmento
- **formularios.service**: CRUD de formulários e schemas
- **segmentos.service**: CRUD de segmentos de negócio
- **templates.service**: CRUD de templates PDF

#### 4. Camada de Persistência

- **Supabase/PostgreSQL**: Banco de dados principal com RLS
- **Backblaze B2**: Storage de arquivos (PDFs, assinaturas, fotos)

---

## Estrutura de Dados

### Modelo Conceitual

```
┌─────────────────┐
│   SEGMENTO      │  Categoria de negócio (ex: Jurídico, RH)
│  (Negócio)      │
└────────┬────────┘
         │ 1:N
         │
┌────────▼────────┐
│  FORMULÁRIO     │  Tipo de documento/fluxo (ex: Contrato, Procuração)
│  (Tipo Ação)    │
└────────┬────────┘
         │ N:N
         │
┌────────▼────────┐
│   TEMPLATE      │  Arquivo PDF com campos mapeados
│   (PDF Base)    │
└─────────────────┘

┌─────────────────┐
│    SESSÃO       │  Rastreamento da jornada do signatário
│  (Temporário)   │
└────────┬────────┘
         │ 1:1
         │
┌────────▼────────┐
│  ASSINATURA     │  Registro final com todos os artefatos
│  (Permanente)   │
└─────────────────┘
```

### Tabelas do Banco de Dados

#### 1. `assinatura_digital_segmentos`

**Objetivo**: Categorizar formulários por área de negócio

| Campo        | Tipo        | Descrição                |
| ------------ | ----------- | ------------------------ |
| `id`         | bigint      | PK auto-increment        |
| `nome`       | text        | Nome do segmento (único) |
| `slug`       | text        | Slug para URL (único)    |
| `descricao`  | text        | Descrição opcional       |
| `ativo`      | boolean     | Status ativo/inativo     |
| `created_at` | timestamptz | Data de criação          |
| `updated_at` | timestamptz | Data de atualização      |

**Índices**: `ativo`

**Exemplo de dados**:

```json
{
  "id": 1,
  "nome": "Jurídico",
  "slug": "juridico",
  "descricao": "Documentos jurídicos e processuais",
  "ativo": true
}
```

---

#### 2. `assinatura_digital_templates`

**Objetivo**: Armazenar templates PDF base com mapeamento de campos

| Campo               | Tipo        | Descrição                        |
| ------------------- | ----------- | -------------------------------- |
| `id`                | bigint      | PK auto-increment                |
| `template_uuid`     | uuid        | UUID público do template (único) |
| `nome`              | text        | Nome do template                 |
| `descricao`         | text        | Descrição opcional               |
| `arquivo_original`  | text        | URL do PDF no Backblaze B2       |
| `arquivo_nome`      | text        | Nome original do arquivo         |
| `arquivo_tamanho`   | integer     | Tamanho em bytes                 |
| `status`            | text        | 'ativo', 'inativo', 'rascunho'   |
| `versao`            | integer     | Versionamento do template        |
| `ativo`             | boolean     | Status ativo/inativo             |
| `campos`            | text (JSON) | Array de campos mapeados no PDF  |
| `conteudo_markdown` | text        | Conteúdo alternativo em Markdown |
| `criado_por`        | text        | ID do usuário criador            |
| `created_at`        | timestamptz | Data de criação                  |
| `updated_at`        | timestamptz | Data de atualização              |

**Índices**: `ativo`, `nome`

**Estrutura do campo `campos`**:

```typescript
interface TemplateCampo {
  id: string; // ID único do campo
  nome: string; // Nome/label do campo
  tipo: "texto" | "assinatura" | "foto" | "texto_composto";
  variavel?: string; // Variável de dados (ex: 'cliente.nome')
  posicao: {
    x: number; // Posição X em pixels
    y: number; // Posição Y em pixels
    width: number; // Largura em pixels
    height: number; // Altura em pixels
    pagina: number; // Número da página (1-indexed)
  };
  estilo?: {
    tamanho_fonte?: number; // Tamanho da fonte
    fonte?: string; // Nome da fonte
    alinhamento?: "left" | "center" | "right";
    cor?: string; // Cor do texto (hex)
  };
  conteudo_composto?: {
    // Para tipo 'texto_composto'
    partes: Array<{
      tipo: "texto" | "variavel";
      valor: string;
    }>;
  };
}
```

**Exemplo de campo mapeado**:

```json
{
  "id": "campo_nome_cliente",
  "nome": "Nome do Cliente",
  "tipo": "texto",
  "variavel": "cliente.nome_completo",
  "posicao": {
    "x": 100,
    "y": 200,
    "width": 300,
    "height": 20,
    "pagina": 1
  },
  "estilo": {
    "tamanho_fonte": 12,
    "fonte": "Helvetica",
    "alinhamento": "left"
  }
}
```

---

#### 3. `assinatura_digital_formularios`

**Objetivo**: Definir tipos de documentos/ações com campos dinâmicos

| Campo                    | Tipo        | Descrição                              |
| ------------------------ | ----------- | -------------------------------------- |
| `id`                     | bigint      | PK auto-increment                      |
| `formulario_uuid`        | uuid        | UUID público do formulário (único)     |
| `nome`                   | text        | Nome do formulário                     |
| `slug`                   | text        | Slug para URL (único)                  |
| `descricao`              | text        | Descrição opcional                     |
| `segmento_id`            | bigint      | FK para segmento (obrigatório)         |
| `form_schema`            | jsonb       | Schema JSON dos campos dinâmicos       |
| `schema_version`         | text        | Versão do schema (ex: '1.0.0')         |
| `template_ids`           | text[]      | Array de UUIDs de templates vinculados |
| `ativo`                  | boolean     | Status ativo/inativo                   |
| `ordem`                  | integer     | Ordem de exibição                      |
| `foto_necessaria`        | boolean     | Se requer captura de foto              |
| `geolocation_necessaria` | boolean     | Se requer geolocalização               |
| `metadados_seguranca`    | text (JSON) | Lista de metadados obrigatórios        |
| `criado_por`             | text        | ID do usuário criador                  |
| `created_at`             | timestamptz | Data de criação                        |
| `updated_at`             | timestamptz | Data de atualização                    |

**Índices**: `segmento_id`, `ativo`, `(ordem, nome)`

**Estrutura do campo `form_schema`**:

```typescript
interface DynamicFormSchema {
  id: string; // ID único do schema
  version: string; // Versão (ex: '1.0.0')
  sections: Array<{
    // Seções do formulário
    id: string;
    title: string;
    description?: string;
    fields: Array<{
      // Campos da seção
      id: string;
      name: string;
      label: string;
      type:
        | "text"
        | "email"
        | "textarea"
        | "number"
        | "date"
        | "select"
        | "radio"
        | "checkbox"
        | "cpf"
        | "cnpj"
        | "phone"
        | "cep";
      validation?: {
        required?: boolean;
        min?: number;
        max?: number;
        pattern?: string;
        email?: boolean;
        custom?: string;
        message?: string;
      };
      placeholder?: string;
      defaultValue?: any;
      options?: Array<{
        // Para select/radio
        label: string;
        value: string | number;
        disabled?: boolean;
      }>;
      conditional?: {
        // Renderização condicional
        field: string; // Campo que controla visibilidade
        operator: "=" | "!=" | ">" | "<" | "contains" | "empty" | "notEmpty";
        value?: any;
      };
      gridColumns?: 1 | 2 | 3; // Largura no grid (1=full, 2=half, 3=third)
      helpText?: string;
      disabled?: boolean;
    }>;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
  }>;
  globalValidations?: Array<{
    // Validações cross-field
    id: string;
    fields: string[]; // Campos envolvidos
    validator: string; // Nome do validador
    message: string;
    params?: Record<string, any>;
  }>;
}
```

**Exemplo de formulário**:

```json
{
  "id": 1,
  "nome": "Contrato de Aplicativos",
  "slug": "contrato-apps",
  "segmento_id": 1,
  "form_schema": {
    "id": "contrato-apps-v1",
    "version": "1.0.0",
    "sections": [
      {
        "id": "dados_plataforma",
        "title": "Dados da Plataforma",
        "fields": [
          {
            "id": "plataforma_nome",
            "name": "plataforma_nome",
            "label": "Nome da Plataforma",
            "type": "select",
            "options": [
              { "label": "Uber", "value": "uber" },
              { "label": "99", "value": "99" }
            ],
            "validation": { "required": true }
          }
        ]
      }
    ]
  },
  "template_ids": ["uuid-do-template-1"],
  "foto_necessaria": true,
  "geolocation_necessaria": false,
  "ativo": true
}
```

---

#### 4. `assinatura_digital_sessoes_assinatura`

**Objetivo**: Rastrear sessões de assinatura e seu estado

| Campo         | Tipo        | Descrição                                           |
| ------------- | ----------- | --------------------------------------------------- |
| `id`          | bigint      | PK auto-increment                                   |
| `acao_id`     | bigint      | ID da ação vinculada (único, opcional)              |
| `sessao_uuid` | uuid        | UUID da sessão (único)                              |
| `status`      | text        | 'pendente', 'em_andamento', 'concluida', 'expirada' |
| `ip_address`  | text        | IP do cliente                                       |
| `user_agent`  | text        | User-agent do navegador                             |
| `device_info` | jsonb       | Informações do dispositivo                          |
| `geolocation` | jsonb       | Dados de geolocalização                             |
| `created_at`  | timestamptz | Data de criação                                     |
| `updated_at`  | timestamptz | Data de atualização                                 |
| `expires_at`  | timestamptz | Data de expiração                                   |

**Índices**: `status`, `expires_at`, `created_at`

**Propósito**: Permite rastrear abandono de formulários, métricas de conversão e histórico de tentativas.

---

#### 5. `assinatura_digital_assinaturas`

**Objetivo**: Registro permanente de assinaturas concluídas

| Campo                     | Tipo             | Descrição                            |
| ------------------------- | ---------------- | ------------------------------------ |
| `id`                      | bigint           | PK auto-increment                    |
| `cliente_id`              | bigint           | ID do cliente (obrigatório)          |
| `acao_id`                 | bigint           | ID da ação/processo (obrigatório)    |
| `template_uuid`           | text             | UUID do template usado               |
| `segmento_id`             | bigint           | FK para segmento                     |
| `formulario_id`           | bigint           | FK para formulário                   |
| `sessao_uuid`             | uuid             | UUID da sessão                       |
| `assinatura_url`          | text             | URL da imagem da assinatura no B2    |
| `foto_url`                | text             | URL da foto do cliente no B2         |
| `pdf_url`                 | text             | URL do PDF final no B2               |
| `protocolo`               | text             | Protocolo único gerado (único)       |
| `ip_address`              | text             | IP capturado                         |
| `user_agent`              | text             | User-agent capturado                 |
| `latitude`                | double precision | Coordenada GPS (opcional)            |
| `longitude`               | double precision | Coordenada GPS (opcional)            |
| `geolocation_accuracy`    | double precision | Precisão em metros (opcional)        |
| `geolocation_timestamp`   | text             | Timestamp ISO 8601 da captura GPS    |
| `data_assinatura`         | timestamptz      | Data/hora da assinatura              |
| `status`                  | text             | 'concluida', 'cancelada', 'invalida' |
| `enviado_sistema_externo` | boolean          | Se foi enviado para sistema externo  |
| `data_envio_externo`      | timestamptz      | Data de envio externo                |
| `created_at`              | timestamptz      | Data de criação                      |
| `updated_at`              | timestamptz      | Data de atualização                  |

**Índices**: `cliente_id`, `acao_id`, `segmento_id`, `formulario_id`, `status`, `data_assinatura`

**Formato do protocolo**: `FS-{timestamp14digitos}-{random5digitos}`

- Exemplo: `FS-20241209123045-98765`
- Permite ordenação cronológica e unicidade

---

## Tipos TypeScript Principais

### 1. Segmento

```typescript
interface Segmento {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}
```

### 2. Template

```typescript
interface Template {
  id: number;
  template_uuid: string;
  nome: string;
  descricao?: string | null;
  arquivo_original: string; // URL do PDF no B2
  arquivo_nome: string;
  arquivo_tamanho: number;
  status: "ativo" | "inativo" | "rascunho";
  versao: number;
  ativo: boolean;
  campos: TemplateCampo[]; // Array de campos mapeados
  conteudo_markdown?: string | null;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;
}
```

### 3. Formulário

```typescript
interface FormularioEntity {
  id: number;
  formulario_uuid: string;
  nome: string;
  slug: string;
  descricao?: string;
  segmento_id: number;
  form_schema: DynamicFormSchema; // Schema JSON dos campos
  schema_version: string;
  template_ids: string[]; // UUIDs dos templates vinculados
  ativo: boolean;
  ordem?: number;
  foto_necessaria: boolean;
  geolocation_necessaria: boolean;
  metadados_seguranca: MetadadoSeguranca[];
  criado_por?: string;
  created_at?: string;
  updated_at?: string;
}
```

### 4. Payload de Finalização

```typescript
interface FinalizePayload {
  cliente_id: number;
  acao_id: number;
  template_id: string; // UUID do template
  segmento_id: number;
  segmento_nome?: string;
  formulario_id: number;
  assinatura_base64: string; // Data URL da assinatura
  foto_base64?: string | null; // Data URL da foto (opcional)
  latitude?: number | null;
  longitude?: number | null;
  geolocation_accuracy?: number | null;
  geolocation_timestamp?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  sessao_id?: string | null; // UUID da sessão
  request_id?: string | null;
}
```

---

## Segurança e Auditoria

### Metadados de Segurança Capturados

#### 1. **IP Address**

- **Fonte**: Extraído do header `x-forwarded-for` ou `x-real-ip` no servidor
- **Propósito**: Rastreamento geográfico e detecção de fraudes
- **Validação**: Nunca confia no IP enviado pelo cliente; sempre extrai do request
- **Armazenamento**: Tabela `assinatura_digital_assinaturas.ip_address`

#### 2. **User-Agent**

- **Fonte**: Header `user-agent` do navegador
- **Propósito**: Identificar dispositivo, navegador e sistema operacional
- **Armazenamento**: Tabela `assinatura_digital_assinaturas.user_agent`
- **Exemplo**: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0`

#### 3. **Geolocalização GPS**

- **Fonte**: API de Geolocalização do navegador (requer permissão do usuário)
- **Campos capturados**:
  - `latitude`: Coordenada latitude (-90 a 90)
  - `longitude`: Coordenada longitude (-180 a 180)
  - `geolocation_accuracy`: Precisão em metros
  - `geolocation_timestamp`: ISO 8601 da captura
- **Validação**:
  - Latitude/longitude devem estar juntos (ambos ou nenhum)
  - Accuracy deve ser positiva
  - Warnings se accuracy > 10km
  - Warnings se timestamp futuro
- **Configuração GPS**: High accuracy, timeout 10s, sem cache
- **Armazenamento**: Tabela `assinatura_digital_assinaturas` (campos individuais)

#### 4. **Sessão UUID**

- **Fonte**: Gerado no frontend via `crypto.randomUUID()`
- **Propósito**: Agrupar múltiplas assinaturas da mesma jornada
- **Formato**: UUID v4 padrão
- **Rastreamento**: Permite identificar tentativas múltiplas, abandono de formulário

#### 5. **Protocolo Único**

- **Formato**: `FS-{timestamp14}-{random5}`
- **Geração**: No backend via `buildProtocol()`
- **Exemplo**: `FS-20241209153045-78234`
- **Propósito**: Identificador único e legível para a assinatura
- **Características**:
  - Sortável cronologicamente
  - Único garantido (timestamp + random)
  - Curto o suficiente para ser compartilhado

#### 6. **Timestamp de Assinatura**

- **Fonte**: `new Date().toISOString()` no servidor
- **Propósito**: Momento exato da finalização
- **Armazenamento**: `assinatura_digital_assinaturas.data_assinatura`
- **Formato**: ISO 8601 com timezone

### Validações de Segurança

#### 1. **Validação de CPF**

- **Algoritmo**: Validação de dígitos verificadores
- **Máscara**: Aceita com ou sem formatação
- **Normalização**: Remove pontos e traços antes de validar

#### 2. **Validação de Assinatura**

- **Métricas capturadas**:
  - Número de pontos desenhados
  - Número de strokes (traços)
  - Tempo de desenho
  - Bounding box (largura x altura)
- **Validações**:
  - Assinatura não pode estar vazia
  - Deve ter dados base64 válidos
- **Formato**: Data URL (`data:image/png;base64,...`)

#### 3. **Validação de Foto**

- **Formato**: Data URL JPEG ou PNG
- **Tamanho máximo**: 5MB
- **Dimensões**: 500x500px (captura via webcam)
- **Qualidade**: JPEG quality 0.8
- **Validação de qualidade**: Verifica se foto não está vazia/corrompida

#### 4. **Validação de Geolocalização**

- **Opcional**: Pode ser null se não configurada no formulário
- **Validação de range**:
  - Latitude: -90 a 90
  - Longitude: -180 a 180
  - Accuracy: > 0
- **Warnings**:
  - Accuracy > 10000m (10km)
  - Timestamp futuro

### Políticas RLS (Row Level Security)

#### Service Role

- **Acesso**: Full access a todas as tabelas
- **Uso**: Backend API routes via `createServiceClient()`

#### Authenticated Users

- **SELECT**: Permitido em todas as tabelas (leitura básica)
- **INSERT**:
  - `assinatura_digital_sessoes_assinatura`: Permitido
  - `assinatura_digital_assinaturas`: Permitido
- **UPDATE**:
  - `assinatura_digital_sessoes_assinatura`: Permitido
- **DELETE**: Não permitido

#### Anônimos (Public)

- **Acesso**: Bloqueado por padrão
- **Exceções**: Endpoints públicos usam service_role internamente

---

## Armazenamento de Arquivos (Backblaze B2)

### Estrutura de Pastas

```
bucket: zattar-advogados/
├── assinatura-digital/
│   ├── templates/
│   │   └── {uuid}-{nome-original}.pdf
│   ├── assinaturas/
│   │   └── assinatura-{timestamp}-{random}.png
│   ├── fotos/
│   │   └── foto-{timestamp}-{random}.jpg
│   └── pdfs/
│       └── documento-{timestamp}-{random}.pdf
```

### Nomenclatura de Arquivos

#### Templates

- **Padrão**: `{uuid}-{nome-sanitizado}.pdf`
- **Exemplo**: `a1b2c3d4-contrato-apps.pdf`
- **Sanitização**: Remove caracteres especiais, lowercase, substitui espaços por hífen

#### Assinaturas

- **Padrão**: `assinatura-{timestamp}-{random}.png`
- **Exemplo**: `assinatura-20241209153045-abc123.png`
- **Formato**: PNG para preservar transparência

#### Fotos

- **Padrão**: `foto-{timestamp}-{random}.jpg`
- **Exemplo**: `foto-20241209153045-def456.jpg`
- **Formato**: JPEG com qualidade 0.8

#### PDFs Gerados

- **Padrão**: `documento-{timestamp}-{random}.pdf`
- **Exemplo**: `documento-20241209153045-ghi789.pdf`

### Configuração do Storage

#### Acesso

- **Tipo**: S3-Compatible API (AWS SDK v3)
- **Endpoint**: Configurado via `B2_ENDPOINT`
- **Região**: `us-east-1` (padrão para Backblaze)
- **Bucket**: Configurado via `B2_BUCKET`

#### Segurança

- **Credenciais**: Access Key ID + Secret Access Key
- **URLs**: Públicas após upload (bucket configurado como público)
- **Presigned URLs**: Geradas para acesso temporário a buckets privados
- **Expiração**: 1 hora (3600 segundos) por padrão

#### Upload

```typescript
interface BackblazeUploadParams {
  buffer: Buffer; // Conteúdo do arquivo
  key: string; // Caminho completo no bucket
  contentType: string; // MIME type
}

interface BackblazeUploadResult {
  url: string; // URL pública do arquivo
  key: string; // Chave do arquivo
  bucket: string; // Nome do bucket
  uploadedAt: Date; // Timestamp do upload
}
```

---

## Fluxo de Dados Detalhado

### 1. Fluxo de Criação de Template

```
Admin → Upload PDF → API (/templates/upload)
  ↓
Valida arquivo (tipo, tamanho)
  ↓
Upload para B2 (assinatura-digital/templates/)
  ↓
Retorna URL do B2
  ↓
Admin → Preenche metadados (nome, descrição)
  ↓
API (/templates) cria registro
  ↓
Admin → Abre editor visual (/templates/[uuid]/edit)
  ↓
Mapeia campos no PDF (drag-and-drop)
  ↓
Autosave a cada 5 segundos
  ↓
Testa preview com dados mock
  ↓
Ativa template (status: ativo)
```

### 2. Fluxo de Criação de Formulário

```
Admin → Seleciona segmento
  ↓
Preenche metadados (nome, slug, descrição)
  ↓
Define se requer foto/geolocalização
  ↓
Constrói schema JSON (drag-and-drop de campos)
  ↓
Configura validações e condicionais
  ↓
Vincula templates
  ↓
API (/formularios) persiste
  ↓
Ativa formulário (disponível em URL pública)
```

### 3. Fluxo de Assinatura (Cliente Externo)

```
Cliente → Acessa /formulario/{segmento}/{formulario}
  ↓
Step 1: Verificação CPF
  ├─ Valida formato
  ├─ API: POST /api/assinatura-digital/forms/verificar-cpf
  └─ Se existe: carrega dados / Se novo: próximo step
  ↓
Step 2: Dados Pessoais
  ├─ Preenche: nome, RG, email, telefone, endereço
  ├─ Auto-fill CEP via ViaCEP
  ├─ API: POST /api/assinatura-digital/forms/save-client
  └─ Persiste/atualiza cliente
  ↓
Step 3: Formulário Dinâmico
  ├─ Renderiza campos do form_schema
  ├─ Validações progressivas (Zod)
  ├─ Renderização condicional
  ├─ API: POST /api/salvar-acao (cria ação)
  └─ Retorna acao_id
  ↓
Step 4: Captura de Foto (se foto_necessaria)
  ├─ Solicita permissão de câmera
  ├─ Captura via webcam (500x500px)
  ├─ Valida tamanho (<5MB)
  └─ Armazena base64 no store
  ↓
Step 5: Geolocalização (se geolocation_necessaria)
  ├─ Solicita permissão GPS
  ├─ Captura coordenadas (high accuracy)
  ├─ Valida precisão e range
  └─ Armazena no store
  ↓
Step 6: Preview do PDF
  ├─ API: POST /api/assinatura-digital/signature/preview
  ├─ Backend gera PDF com dados preenchidos
  ├─ Upload temporário para B2
  └─ Exibe PDF em viewer (react-pdf)
  ↓
Step 7: Assinatura Manuscrita
  ├─ Canvas de assinatura (react-signature-canvas)
  ├─ Captura métricas (pontos, strokes, tempo)
  ├─ Converte para base64
  └─ Valida não vazio
  ↓
Step 8: Finalização
  ├─ Extrai IP/user-agent no servidor
  ├─ API: POST /api/assinatura-digital/signature/finalizar
  ├─ Backend:
  │   ├─ Upload assinatura → B2
  │   ├─ Upload foto (se presente) → B2
  │   ├─ Gera PDF final com assinatura
  │   ├─ Upload PDF → B2
  │   ├─ Gera protocolo único
  │   └─ Persiste em assinatura_digital_assinaturas
  └─ Retorna: protocolo, pdf_url, assinatura_id
  ↓
Step 9: Sucesso
  ├─ Exibe protocolo
  ├─ Botão download PDF
  └─ Opção download ZIP (PDFs + assinatura + foto)
```

### 4. Fluxo de Geração de PDF

```
Dados de entrada:
  ├─ Template (com campos mapeados)
  ├─ Cliente (dados pessoais)
  ├─ Ação (dados do formulário dinâmico)
  ├─ Segmento
  ├─ Formulário
  ├─ Protocolo
  ├─ Metadados (IP, user-agent, geo)
  └─ Artefatos (assinatura base64, foto base64)
  ↓
template-pdf.service.ts:
  ↓
1. Carrega PDF original do template
  ↓
2. Para cada campo do template:
  ├─ Se tipo = 'texto':
  │   ├─ Resolve variável (ex: cliente.nome → "João Silva")
  │   ├─ Posiciona texto na página
  │   └─ Aplica estilo (fonte, tamanho, cor)
  ├─ Se tipo = 'assinatura':
  │   ├─ Decodifica base64 → Buffer
  │   ├─ Incorpora imagem no PDF
  │   └─ Posiciona na área mapeada
  ├─ Se tipo = 'foto':
  │   ├─ Decodifica base64 → Buffer
  │   ├─ Incorpora imagem no PDF
  │   └─ Posiciona na área mapeada
  └─ Se tipo = 'texto_composto':
      ├─ Mescla textos fixos + variáveis
      └─ Renderiza bloco de texto
  ↓
3. Salva PDF modificado
  ↓
4. Retorna Buffer do PDF
  ↓
storage.service.ts → Upload para B2
  ↓
Retorna URL pública do PDF
```

---

## Validações e Regras de Negócio

### Validações de Frontend

#### 1. **Validação Progressiva**

- **Biblioteca**: Zod + react-hook-form
- **Comportamento**: Valida campo a campo durante preenchimento
- **Feedback**: Mensagens de erro inline em tempo real
- **Debounce**: Validações assíncronas com debounce de 300ms

#### 2. **Validação de CPF**

```typescript
Regras:
  - Formato: 11 dígitos numéricos
  - Aceita: "123.456.789-00" ou "12345678900"
  - Valida dígitos verificadores
  - Rejeita CPFs conhecidos como inválidos (111.111.111-11, etc)
```

#### 3. **Validação de CEP**

```typescript
Regras:
  - Formato: 8 dígitos (12345-678 ou 12345678)
  - Consulta ViaCEP em tempo real
  - Auto-preenche: logradouro, bairro, cidade, estado
  - Tratamento de CEPs não encontrados
```

#### 4. **Validação de Email**

```typescript
Regras:
  - Formato válido (RFC 5322)
  - Não permite espaços
  - Converte para lowercase
```

#### 5. **Validação de Telefone**

```typescript
Regras:
  - DDD + número (11 dígitos com 9, 10 dígitos sem 9)
  - Formatos aceitos: (11) 98765-4321, 11987654321
  - Máscara automática
```

### Validações de Backend

#### 1. **Validação Zod de Payload**

```typescript
Finalizar Assinatura:
  - cliente_id: number (obrigatório)
  - acao_id: number (obrigatório)
  - template_id: string min 1 (obrigatório)
  - segmento_id: number (obrigatório)
  - formulario_id: number (obrigatório)
  - assinatura_base64: string min 1 (obrigatório)
  - foto_base64: string opcional nullable
  - latitude: number opcional nullable
  - longitude: number opcional nullable
  - geolocation_accuracy: number opcional nullable
  - geolocation_timestamp: string opcional nullable
  - ip_address: string opcional nullable
  - user_agent: string opcional nullable
  - sessao_id: uuid opcional nullable
```

#### 2. **Validação de Existência**

```typescript
Antes de finalizar:
  - Cliente deve existir
  - Template deve existir e estar ativo
  - Formulário deve existir e estar ativo
  - Segmento deve existir e estar ativo
```

#### 3. **Validação de Integridade**

```typescript
Consistência de dados:
  - CPF não pode mudar durante sessão
  - Email deve ser único por CPF
  - Telefone deve ser válido
  - Nome completo não pode estar vazio
```

### Regras de Negócio

#### 1. **Geração de Protocolo**

- Único por assinatura
- Formato: `FS-{timestamp14}-{random5}`
- Não pode ser reutilizado
- Salvo em `assinatura_digital_assinaturas.protocolo` (UNIQUE)

#### 2. **Versionamento de Templates**

- Cada alteração incrementa `versao`
- Templates antigos podem ser mantidos inativos
- Formulários vinculam por UUID (não por versão)

#### 3. **Versionamento de Schemas**

- Cada formulário tem `schema_version`
- Permite migração de dados entre versões
- Mantém compatibilidade retroativa

#### 4. **Metadados Obrigatórios**

- Configurável por formulário via `metadados_seguranca`
- Valores: `['ip', 'user_agent', 'geolocation', 'timestamp']`
- Se geolocation obrigatória → bloqueia finalização sem GPS

#### 5. **Expiração de Sessões**

- Sessões podem ter `expires_at`
- Sessões expiradas não podem ser finalizadas
- Limpeza automática de sessões antigas (implementar via cron)

#### 6. **Status de Assinatura**

- `concluida`: Assinatura válida e armazenada
- `cancelada`: Cliente cancelou processo
- `invalida`: Detectada inconsistência ou fraude

---

## Considerações de Performance

### 1. **Geração de PDF**

- **Biblioteca**: `pdf-lib` (manipulação eficiente)
- **Otimização**: Campos mapeados via coordenadas fixas (sem parsing)
- **Cache**: Templates PDF são carregados uma vez por requisição

### 2. **Upload de Arquivos**

- **Paralelização**: Assinatura, foto e PDF enviados em paralelo ao B2
- **Compressão**: JPEGs com qualidade 0.8
- **Chunking**: Não necessário (arquivos pequenos <10MB)

### 3. **Consultas ao Banco**

- **Índices**: Criados em campos de filtro comum (ativo, status, datas)
- **Eager Loading**: Dados de cliente, template, formulário buscados em paralelo
- **Paginação**: Sessões listadas com paginação (20 por página)

### 4. **Cache Frontend**

- **Store Zustand**: Estado global do formulário persiste entre steps
- **LocalStorage**: Não usado (dados sensíveis)
- **Session Storage**: Não usado (dados temporários no store)

---

## Diagrama de Relacionamentos

```
┌─────────────────────────────────────────────────────────────────┐
│                     RELACIONAMENTOS                              │
└─────────────────────────────────────────────────────────────────┘

assinatura_digital_segmentos (1)
  └──> assinatura_digital_formularios (N)
         ├──> template_ids (N:N via array)
         │      └──> assinatura_digital_templates (N)
         └──> assinatura_digital_assinaturas (N)
                └──> assinatura_digital_sessoes_assinatura (1:1 opcional)

Lógica de negócio (não FK no DB):
  - assinatura_digital_assinaturas.template_uuid → templates.template_uuid
  - assinatura_digital_assinaturas.cliente_id → clientes.id
  - assinatura_digital_assinaturas.acao_id → acoes.id (tabela externa)
```

---

## Glossário de Termos

### Termos de Domínio

- **Segmento**: Categoria de negócio que agrupa formulários (ex: Jurídico, RH, Comercial)
- **Formulário**: Tipo de documento/fluxo de assinatura com campos dinâmicos
- **Template**: Arquivo PDF base com campos mapeados para preenchimento
- **Ação**: Registro de dados preenchidos no formulário dinâmico (conceito genérico, pode ser contrato, processo, etc)
- **Sessão**: Rastreamento temporário da jornada do signatário
- **Protocolo**: Identificador único da assinatura concluída
- **Campo Mapeado**: Área no PDF onde um dado será inserido
- **Variável**: Referência a um dado (ex: `cliente.nome`, `sistema.protocolo`)
- **Schema JSON**: Definição estruturada dos campos do formulário dinâmico

### Termos Técnicos

- **Base64**: Codificação de dados binários em texto (usado para assinaturas e fotos)
- **Data URL**: Formato `data:{mime};base64,{conteudo}` para incorporar arquivos
- **UUID**: Identificador único universal (formato: `a1b2c3d4-e5f6-...`)
- **Presigned URL**: URL temporária para acesso a bucket privado
- **RLS**: Row Level Security (políticas de segurança a nível de linha no PostgreSQL)
- **Zod**: Biblioteca TypeScript de validação de schemas
- **JSONB**: Tipo de dado JSON binário do PostgreSQL (indexável)

---

## Considerações de Escalabilidade

### Crescimento de Volume

#### PDFs e Imagens

- **Atual**: Armazenamento ilimitado no Backblaze B2 (pagamento por GB)
- **Crescimento**: Linear com número de assinaturas
- **Custo**: ~$5/TB/mês (armazenamento) + $10/TB (download)
- **Otimização**: Implementar lifecycle policies para arquivar PDFs antigos

#### Banco de Dados

- **Atual**: Supabase PostgreSQL (compartilhado)
- **Crescimento**:
  - Tabela `assinaturas` cresce linearmente
  - Tabela `sessoes` pode crescer exponencialmente (inclui tentativas abandonadas)
- **Mitigação**:
  - Implementar particionamento por data
  - Arquivar sessões antigas (>90 dias)
  - Índices parciais em queries comuns

#### Geração de PDFs

- **Gargalo**: Processamento síncrono no servidor
- **Atual**: ~1-2s por PDF
- **Escalabilidade**:
  - Implementar fila de processamento (BullMQ + Redis)
  - Workers dedicados para geração de PDF
  - Cache de templates renderizados

### Disponibilidade

#### Backblaze B2

- **SLA**: 99.9% uptime
- **Redundância**: Multi-region automática
- **Backup**: Versionamento nativo de arquivos

#### Supabase

- **SLA**: 99.9% uptime (plano pago)
- **Backup**: Snapshots diários automáticos
- **Replicação**: Read replicas disponíveis

---

## Roadmap de Melhorias

### Curto Prazo

1. **Rate Limiting**: Implementar limite de requisições por IP
2. **Webhooks**: Notificar sistemas externos após assinatura
3. **Analytics**: Dashboard de métricas (conversão, abandono)
4. **Assinatura Múltipla**: Permitir múltiplas assinaturas no mesmo documento

### Médio Prazo

1. **Autenticação 2FA**: Para administradores
2. **Assinatura Digital (ICP-Brasil)**: Integração com certificados digitais
3. **OCR**: Reconhecimento de texto em PDFs escaneados
4. **Versionamento de Assinaturas**: Histórico de alterações

### Longo Prazo

1. **Blockchain**: Registro de hash do PDF em blockchain público
2. **IA/ML**: Detecção de fraudes em assinaturas
3. **Multi-idioma**: Internacionalização do sistema
4. **API Pública**: Permitir integrações externas

---

## Referências Técnicas

### Bibliotecas Principais

- **pdf-lib**: Manipulação de PDFs
- **react-pdf**: Visualização de PDFs no browser
- **react-signature-canvas**: Captura de assinatura manuscrita
- **react-webcam**: Captura de foto via câmera
- **zod**: Validação de schemas
- **react-hook-form**: Gerenciamento de formulários
- **zustand**: Gerenciamento de estado global
- **@aws-sdk/client-s3**: Cliente S3 para Backblaze B2

### APIs Externas

- **ViaCEP**: Consulta de endereço por CEP
- **Backblaze B2**: Storage de arquivos (S3-compatible)

### Padrões e Especificações

- **ISO 8601**: Formato de data/hora
- **RFC 5322**: Formato de email
- **UUID v4**: Geração de identificadores únicos
- **Data URL**: Codificação de imagens em base64
