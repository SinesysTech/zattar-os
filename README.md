# Sinesys - Sistema de Gestão Jurídica

![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)
![Redis](https://img.shields.io/badge/Redis-Cache-red?style=flat&logo=redis)
![MongoDB](https://img.shields.io/badge/MongoDB-NoSQL-green?style=flat&logo=mongodb)

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Execução](#-execução)
- [Desenvolvimento](#-desenvolvimento)
- [Estrutura de Diretórios](#-estrutura-de-diretórios)
- [Sistema de Cache Redis](#-sistema-de-cache-redis)
- [Componentes Reutilizáveis](#-componentes-reutilizáveis)
- [API e Documentação](#-api-e-documentação)
- [Scripts Úteis](#-scripts-úteis)
- [Deploy](#-deploy)
- [Troubleshooting](#-troubleshooting)

## 🎯 Visão Geral

O **Sinesys** é um sistema completo de gestão jurídica desenvolvido para escritórios de advocacia, com foco em integração com sistemas PJE/TRT (Processo Judicial Eletrônico / Tribunal Regional do Trabalho). O sistema oferece captura automatizada de dados processuais, gestão de contratos, audiências, pendências de manifestação e muito mais.

### Principais Funcionalidades

- 📊 **Dashboard Centralizado**: Visualização completa de processos, audiências e pendências
- ⚖️ **Captura Automatizada**: Integração com PJE/TRT para captura de acervo, audiências e pendentes
- 📄 **Gestão de Contratos**: CRUD completo com associação de processos e clientes
- 👥 **Gestão de Clientes e Partes**: Cadastro e gerenciamento de clientes e partes contrárias
- 📅 **Agenda de Audiências**: Visualização e gerenciamento de audiências com atribuição de responsáveis
- ⚠️ **Pendências de Manifestação**: Controle de prazos e atribuição de responsáveis
- 💰 **Acordos e Condenações**: Gestão de pagamentos, parcelas e repasses
- 🔒 **Sistema de Permissões**: Controle granular de acesso baseado em cargos e permissões
- 🔐 **Autenticação Segura**: Suporte a 2FA com integração ao 2FAuth

## 🛠 Stack Tecnológica

### Frontend

- **[Next.js 16](https://nextjs.org/)** - Framework React com App Router
- **[React 19](https://react.dev/)** - Biblioteca UI
- **[TypeScript 5](https://www.typescriptlang.org/)** - Tipagem estática
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Framework CSS utility-first
- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes UI reutilizáveis
- **[Radix UI](https://www.radix-ui.com/)** - Primitivos de UI acessíveis
- **[Framer Motion](https://www.framer.com/motion/)** - Animações
- **[SWR](https://swr.vercel.app/)** - Fetching de dados e cache client-side
- **[TanStack Table](https://tanstack.com/table/)** - Tabelas avançadas

### Backend

- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** - Endpoints REST
- **[Supabase](https://supabase.com/)** - Backend as a Service (PostgreSQL)
- **[MongoDB](https://www.mongodb.com/)** - Banco NoSQL para timelines e auditoria
- **[Redis (ioredis)](https://github.com/redis/ioredis)** - Sistema de cache distribuído
- **[Puppeteer](https://pptr.dev/)** - Automação de navegador para captura de dados
- **[Playwright](https://playwright.dev/)** - Testes e automação end-to-end

### Infraestrutura

- **[Docker](https://www.docker.com/)** - Containerização
- **[Docker Swarm](https://docs.docker.com/engine/swarm/)** - Orquestração
- **[Traefik](https://traefik.io/)** - Proxy reverso e balanceamento de carga

## 🏗 Arquitetura

### Padrão de Camadas

O Sinesys segue uma arquitetura em três camadas que promove separação de responsabilidades e facilita manutenção:

```
┌─────────────────────────────────────────────┐
│         Camada de API (app/api/)            │
│  - Autenticação e autorização               │
│  - Validação de entrada                     │
│  - Formatação de resposta                   │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Camada de Serviço (backend/*/services/)    │
│  - Lógica de negócio pura                   │
│  - Regras de validação                      │
│  - Orquestração de operações                │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Camada de Persistência (*/persistence/)    │
│  - Acesso ao banco de dados                 │
│  - Queries e filtros                        │
│  - Auditoria e logging                      │
└─────────────────────────────────────────────┘
```

#### Responsabilidades por Camada

**Camada de API** (`app/api/`)

- Recebe requisições HTTP
- Autentica usuários via `authenticateRequest()`
- Valida parâmetros de entrada
- Invoca serviços de negócio
- Retorna respostas padronizadas: `{ success: boolean, data?: T, error?: string }`

**Camada de Serviço** (`backend/[feature]/services/[feature]/`)

- Contém lógica de negócio pura
- Valida regras de negócio
- Orquestra múltiplas operações de persistência
- Independente de detalhes de infraestrutura

**Camada de Persistência** (`backend/[feature]/services/persistence/`)

- Acesso direto ao banco de dados
- Executa queries com filtros e paginação
- Implementa auditoria e comparação de dados
- Usa `createServiceClient()` do Supabase

### Fluxo de Dados

```mermaid
graph LR
    A[Cliente] --> B[API Route]
    B --> C[Serviço de Negócio]
    C --> D[Persistência]
    D --> E[Supabase/MongoDB]
    D --> F[Redis Cache]
```

## 📥 Instalação

### Pré-requisitos

- **Node.js** 20.x ou superior
- **npm** 10.x ou superior
- Acesso aos serviços:
  - Supabase (PostgreSQL)
  - Redis
  - MongoDB
  - 2FAuth (para autenticação de dois fatores)

### Passos de Instalação

1. **Clone o repositório**

   ```bash
   git clone <url-do-repositorio>
   cd sinesys
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**

   Crie um arquivo `.env.local` na raiz do projeto (veja [Configuração](#-configuração))

4. **Execute as migrações do banco de dados** (se necessário)
   ```bash
   # As migrações são aplicadas automaticamente pelo Supabase
   # Os schemas estão em supabase/schemas/
   ```

## ⚙️ Configuração

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

### Supabase (Obrigatório)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_anon_key
SUPABASE_SECRET_KEY=sua_secret_key
```

### MongoDB (Obrigatório)

```bash
MONGODB_URL=mongodb://usuario:senha@host:porta/database?authSource=admin
MONGODB_DATABASE=nome_do_database
ENABLE_MONGODB_AUDIT=true
```

### Redis (Recomendado)

```bash
REDIS_URL=redis://:senha@host:porta
REDIS_PASSWORD=sua_senha_redis
ENABLE_REDIS_CACHE=true
REDIS_CACHE_TTL=600              # TTL padrão em segundos (10 minutos)
REDIS_CACHE_MAX_MEMORY=256mb     # Memória máxima do Redis
ENABLE_REDIS_LOG_STREAMING=false # Desabilitar em desenvolvimento
```

### 2FAuth (Obrigatório para 2FA)

```bash
TWOFAUTH_API_URL=https://authenticator.service.sinesys.app/api/v1
TWOFAUTH_API_TOKEN=seu_token_api
TWOFAUTH_ACCOUNT_ID=seu_account_id
```

### API de Serviço (Obrigatório para Jobs)

```bash
SERVICE_API_KEY=sua_chave_api_segura_gerada_aleatoriamente
```

### Storage (Configurar conforme provider)

```bash
# Provider de storage (minio | s3 | aws | google-drive | backblaze)
STORAGE_PROVIDER=backblaze

# Backblaze B2 (Recomendado)
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_BUCKET=seu-bucket
B2_KEY_ID=sua_key_id
B2_APPLICATION_KEY=sua_application_key

# Google Drive (Deprecated - migrar para Backblaze)
GOOGLE_DRIVE_WEBHOOK_URL=https://webhook.sinesys.app/webhook/drive
```

## 🚀 Execução

### Desenvolvimento

```bash
# Modo de desenvolvimento com hot reload
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

### Produção

```bash
# Build da aplicação
npm run build

# Iniciar servidor de produção
npm start
```

### Docker

```bash
# Build da imagem Docker
docker build -t sinesys:latest .

# Executar com Docker Compose
docker-compose up -d
```

## 📚 Desenvolvimento

### Estrutura de Código

#### Convenções de Nomenclatura

- **Arquivos**: kebab-case (ex: `listar-acervo.service.ts`)
- **Componentes React**: PascalCase (ex: `TableToolbar.tsx`)
- **Variáveis e funções**: camelCase (ex: `buscarAcervo`)
- **Tipos e Interfaces**: PascalCase (ex: `ListarAcervoParams`)
- **Banco de dados**: snake_case (ex: `numero_processo`)

#### Padrões de Código

- TypeScript **strict mode** habilitado
- Tipos explícitos para parâmetros e retornos
- Usar `const` para funções arrow
- 2 espaços para indentação
- Aspas simples para strings
- Ponto e vírgula obrigatório

#### Comentários

- Comentários em **português** para domínio jurídico
- JSDoc para funções públicas e APIs
- Comentários explicativos para lógica complexa

### Criando Novos Módulos

#### 1. Criar Estrutura de Diretórios

```bash
backend/
  nova-feature/
    services/
      nova-feature/          # Lógica de negócio
        criar-item.service.ts
        listar-items.service.ts
        atualizar-item.service.ts
        deletar-item.service.ts
      persistence/           # Acesso ao banco
        item-persistence.service.ts
    types/
      types.ts              # Interfaces TypeScript
```

#### 2. Definir Tipos

```typescript
// backend/types/nova-feature/types.ts
export interface CriarItemParams {
  nome: string;
  descricao?: string;
}

export interface Item {
  id: number;
  nome: string;
  descricao: string | null;
  created_at: string;
  updated_at: string;
}
```

#### 3. Implementar Persistência

```typescript
// backend/nova-feature/services/persistence/item-persistence.service.ts
import { createServiceClient } from "@/backend/utils/supabase/service-client";
import type { Item, CriarItemParams } from "@/backend/types/nova-feature/types";

export async function criarItem(params: CriarItemParams): Promise<Item> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("items")
    .insert(params)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

#### 4. Implementar Serviço de Negócio

```typescript
// backend/nova-feature/services/nova-feature/criar-item.service.ts
import { criarItem as criarItemPersistence } from "../persistence/item-persistence.service";
import type { CriarItemParams, Item } from "@/backend/types/nova-feature/types";

export async function criarItem(params: CriarItemParams): Promise<Item> {
  // Validações de negócio
  if (!params.nome || params.nome.trim().length === 0) {
    throw new Error("Nome é obrigatório");
  }

  // Chama persistência
  return await criarItemPersistence(params);
}
```

#### 5. Criar Rota de API

```typescript
// app/api/nova-feature/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/backend/utils/auth/api-auth";
import { criarItem } from "@/backend/nova-feature/services/nova-feature/criar-item.service";

export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse do body
    const body = await request.json();

    // Chama serviço
    const item = await criarItem(body);

    // Retorna sucesso
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Erro ao criar item:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
```

### Usando Cache Redis

```typescript
import { withCache, generateCacheKey, invalidateCache } from "@/lib/redis";

export async function listarItems(params: ListarItemsParams) {
  const cacheKey = generateCacheKey("items", params);

  return await withCache(
    cacheKey,
    async () => {
      // Query ao banco
      const items = await listarItemsPersistence(params);
      return items;
    },
    600
  ); // TTL de 10 minutos
}

// Invalidar cache após atualização
export async function atualizarItem(id: number, params: AtualizarItemParams) {
  const item = await atualizarItemPersistence(id, params);
  await invalidateCache("items", id);
  return item;
}
```

### Componentes UI

O projeto usa **shadcn/ui** para componentes reutilizáveis. Para adicionar novos componentes:

```bash
# Exemplo: adicionar um novo componente
npx shadcn@latest add dialog
```

Os componentes ficam em `components/ui/` e podem ser importados:

```typescript
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
```

## 📁 Estrutura de Diretórios

```
sinesys/
├── app/                      # Next.js App Router
│   ├── (dashboard)/          # Rotas protegidas do dashboard
│   │   ├── acervo/
│   │   ├── audiencias/
│   │   ├── captura/
│   │   ├── clientes/
│   │   ├── contratos/
│   │   ├── expedientes/
│   │   ├── processos/
│   │   ├── usuarios/
│   │   └── layout.tsx
│   ├── api/                  # API Routes (REST endpoints)
│   │   ├── acervo/
│   │   ├── audiencias/
│   │   ├── cache/
│   │   ├── captura/
│   │   ├── clientes/
│   │   ├── contratos/
│   │   └── ...
│   ├── auth/                 # Páginas de autenticação
│   ├── globals.css
│   └── layout.tsx
│
├── backend/                  # Lógica de negócio e serviços
│   ├── acervo/
│   │   └── services/
│   │       ├── acervo/           # Serviços de negócio
│   │       └── persistence/      # Camada de persistência
│   ├── api/
│   │   └── pje-trt/          # APIs do PJE/TRT
│   │       ├── acervo-geral/
│   │       ├── audiencias/
│   │       ├── pendentes-manifestacao/
│   │       ├── arquivados/
│   │       ├── timeline/
│   │       └── shared/           # Utilitários compartilhados
│   ├── audiencias/
│   ├── captura/
│   ├── clientes/
│   ├── contratos/
│   ├── types/                # Tipos TypeScript globais
│   └── utils/                # Utilitários compartilhados
│       ├── auth/
│       ├── supabase/
│       └── logs/
│
├── components/              # Componentes React reutilizáveis
│   ├── ui/                  # Componentes shadcn/ui
│   ├── layout/              # Componentes de layout (sidebar, navbar)
│   └── examples/            # Exemplos de uso de componentes
│
├── lib/                     # Bibliotecas e utilitários
│   ├── api/                 # Cliente API
│   ├── hooks/               # Hooks personalizados
│   ├── mongodb/             # Cliente MongoDB
│   ├── redis/               # Cliente e utilitários Redis
│   │   ├── client.ts
│   │   ├── cache-utils.ts
│   │   ├── cache-keys.ts
│   │   ├── invalidation.ts
│   │   └── index.ts
│   ├── types/               # Tipos globais
│   └── utils/               # Utilitários gerais
│
├── supabase/                # Configuração do Supabase
│   ├── migrations/          # Migrações do banco de dados
│   └── schemas/             # Schemas declarativos SQL
│
├── dev_data/                # Scripts e dados de desenvolvimento
│   ├── scripts/             # Scripts de teste e utilitários
│   └── docs/                # Documentação adicional
│
├── openspec/                # Especificações OpenSpec
│   ├── changes/             # Propostas de mudanças
│   └── specs/               # Especificações de API
│
├── .env.local               # Variáveis de ambiente (não versionado)
├── next.config.ts           # Configuração do Next.js
├── tsconfig.json            # Configuração do TypeScript
├── tailwind.config.ts       # Configuração do Tailwind CSS
├── docker-compose.yml       # Composição de containers Docker
└── package.json             # Dependências do projeto
## 📦 Sistema de Cache Redis

### Visão Geral

O Sinesys utiliza **Redis** como sistema de cache distribuído para otimizar consultas ao banco de dados e reduzir latência. O cache segue o padrão **Cache-Aside (Lazy Loading)**, onde os dados são buscados primeiro no cache e, em caso de miss, consultados no banco e armazenados no cache para requisições futuras.

### Arquitetura do Cache

```

┌────────────────────────────────────────────┐
│ Requisição da API │
└─────────────────┬───────────────────────────┘
│
▼
┌────────────────────────────────────────────┐
│ Verificar Cache Redis │
└───────────┬────────────────────────────────┘
│
┌───────┼────────┐
│ │ │
Cache Hit Cache Miss
│ │
▼ ▼
┌───────────────────────────────────┐
│ Retornar do Cache │
└───────────────────────────────────┘
┌───────────────────────────────────┐
│ Consultar Banco de Dados │
└─────────────┬──────────────────────┘
│
▼
┌───────────────────────────────────┐
│ Armazenar no Cache │
└─────────────┬──────────────────────┘
│
▼
┌───────────────────────────────────┐
│ Retornar Resposta │
└───────────────────────────────────┘

````

### Configuração

O cache Redis é configurado através de variáveis de ambiente no arquivo `.env.local`:

```bash
# Habilitar/desabilitar cache
ENABLE_REDIS_CACHE=true

# Conexão
REDIS_URL=redis://:senha@host:porta
REDIS_PASSWORD=sua_senha

# Configurações
REDIS_CACHE_TTL=600              # TTL padrão: 10 minutos
REDIS_CACHE_MAX_MEMORY=256mb     # Memória máxima
````

### TTLs por Tipo de Dado

Os TTLs (Time To Live) são configurados de acordo com a volatilidade dos dados:

| Tipo de Dado                                                                         | TTL            | Justificativa                  |
| ------------------------------------------------------------------------------------ | -------------- | ------------------------------ |
| **Listagens dinâmicas** (pendentes, audiências, acervo)                              | 10 min (600s)  | Dados que mudam com frequência |
| **Dados auxiliares** (usuários, clientes, contratos, tipos de expedientes, cargos)   | 15-30 min      | Mudanças ocasionais            |
| **Dados estáveis** (classes judiciais, tipos de audiência, salas, órgãos julgadores) | 1 hora (3600s) | Raramente mudam                |

### Utilização do Cache

#### Função `withCache`

A forma mais simples de usar o cache é com a função `withCache`:

```typescript
import { withCache, generateCacheKey } from "@/lib/redis";

export async function listarPendentes(params: ListarPendentesParams) {
  const cacheKey = generateCacheKey("pendentes", params);

  return await withCache(
    cacheKey,
    async () => {
      // Esta função só é executada em caso de cache miss
      const dados = await listarPendentesPersistence(params);
      return dados;
    },
    600
  ); // TTL de 10 minutos
}
```

#### Funções Individuais

Para controle mais fino:

```typescript
import { getCached, setCached, deleteCached } from "@/lib/redis";

// Buscar do cache
const cached = await getCached<MeuTipo>("chave");
if (cached) {
  return cached;
}

// Armazenar no cache
const dados = await buscarDoBanco();
await setCached("chave", dados, 600);

// Deletar do cache
await deleteCached("chave");
```

### Invalidação de Cache

O sistema implementa invalidação inteligente baseada em eventos:

```typescript
import { invalidateCache } from "@/lib/redis";

// Após atualizar um registro
export async function atualizarPendente(id: number, params: AtualizarParams) {
  const resultado = await atualizarPendentePersistence(id, params);

  // Invalida cache relacionado
  await invalidateCache("pendentes", id);

  return resultado;
}
```

Invalidação por padrão (todas as chaves que correspondem ao padrão):

```typescript
import { deletePattern } from "@/lib/redis";

// Limpar todos os caches de pendentes
await deletePattern("pendentes:*");
```

### Monitoramento

#### Endpoint de Estatísticas

**GET** `/api/cache/stats`

Retorna estatísticas do Redis:

```json
{
  "success": true,
  "data": {
    "available": true,
    "stats": {
      "used_memory": "2048000",
      "keyspace_hits": "15000",
      "keyspace_misses": "500",
      "uptime_in_seconds": "86400",
      "total_connections_received": "1000"
    }
  }
}
```

#### Endpoint de Limpeza

**POST** `/api/cache/clear`

Limpa o cache manualmente (requer permissão de administrador):

```json
// Limpar todo o cache
{}

// Limpar por padrão
{
  "pattern": "pendentes:*"
}
```

### Desenvolvimento

Para desabilitar o cache durante o desenvolvimento:

```bash
# .env.local
ENABLE_REDIS_CACHE=false
```

Isso permite testar a aplicação sem dependência do Redis.

### Fallback Automático

O sistema possui fallback automático em caso de falha do Redis:

- Se o Redis não estiver disponível, as operações continuam normalmente
- Logs de erro são registrados, mas não afetam a funcionalidade
- Queries são executadas diretamente no banco de dados

### Troubleshooting

| Problema                   | Solução                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| Cache não está sendo usado | Verificar `ENABLE_REDIS_CACHE=true` e conexão via `REDIS_URL`        |
| Dados desatualizados       | Usar `/api/cache/clear` ou aguardar expiração do TTL                 |
| Erro de conexão            | Confirmar credenciais e disponibilidade do servidor Redis            |
| Memória esgotada           | Ajustar `REDIS_CACHE_MAX_MEMORY` ou configurar políticas de eviction |

### Recursos Adicionais

- [Documentação do Redis](https://redis.io/documentation)
- [Documentação do ioredis](https://github.com/redis/ioredis)
- [Cache-Aside Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)

## 🧩 Componentes Reutilizáveis

### TableToolbar

Componente avançado de barra de ferramentas para tabelas, integrando busca, filtros múltiplos e ações.

**Localização:** `components/ui/table-toolbar.tsx`

#### Recursos

- 🔍 **Busca em tempo real** com debounce
- 🎨 **Filtros múltiplos** organizados por categoria
- ➕ **Botão de criação** customizável
- 📋 **Contador de filtros** ativos
- 🎨 **Dropdown categorizado** com hover
- ♻️ **Totalmente reutilizável** entre diferentes páginas

#### Uso Básico

```typescript
import { TableToolbar } from "@/components/ui/table-toolbar";

// Definição de filtros
const filterOptions = [
  {
    id: "trt1",
    label: "TRT 1 - Rio de Janeiro",
    category: "Tribunais",
  },
  {
    id: "primeiroGrau",
    label: "Primeiro Grau",
    category: "Grau",
  },
];

// No componente
<TableToolbar
  searchValue={busca}
  onSearchChange={setBusca}
  isSearching={isSearching}
  searchPlaceholder="Buscar processos..."
  filterOptions={filterOptions}
  selectedFilters={selectedFilterIds}
  onFiltersChange={handleFilterIdsChange}
  onNewClick={() => setCreateOpen(true)}
  newButtonTooltip="Novo Processo"
/>;
```

#### Props

| Prop                | Tipo                      | Descrição                                |
| ------------------- | ------------------------- | ---------------------------------------- |
| `searchValue`       | `string`                  | Valor atual da busca                     |
| `onSearchChange`    | `(value: string) => void` | Callback quando a busca muda             |
| `isSearching`       | `boolean`                 | Indica se está buscando (mostra spinner) |
| `searchPlaceholder` | `string`                  | Placeholder do campo de busca            |
| `filterOptions`     | `FilterOption[]`          | Opções de filtro disponíveis             |
| `selectedFilters`   | `string[]`                | IDs dos filtros selecionados             |
| `onFiltersChange`   | `(ids: string[]) => void` | Callback quando filtros mudam            |
| `onNewClick`        | `() => void`              | Callback do botão "Novo"                 |
| `newButtonTooltip`  | `string`                  | Tooltip do botão "Novo"                  |

#### Exemplo de FilterOption

```typescript
interface FilterOption {
  id: string; // ID único do filtro
  label: string; // Texto exibido
  category: string; // Categoria para agrupamento
}
```

#### Páginas que Utilizam

- 📄 **Processos** (`app/(dashboard)/processos/`)
- 📅 **Audiências** (`app/(dashboard)/audiencias/`)
- 📜 **Contratos** (`app/(dashboard)/contratos/`)
- 💰 **Acordos e Condenações** (`app/(dashboard)/acordos-condenacoes/`)
- 📥 **Captura** (`app/(dashboard)/captura/`)

#### Configuração de Filtros

Cada página define seus filtros específicos em arquivos `*-toolbar-filters.tsx`:

```typescript
// Exemplo: processos/components/processos-toolbar-filters.tsx
export const processosFilters: FilterOption[] = [
  // Tribunais
  { id: "trt1", label: "TRT 1 - Rio de Janeiro", category: "Tribunais" },
  { id: "trt2", label: "TRT 2 - São Paulo", category: "Tribunais" },

  // Grau
  { id: "primeiroGrau", label: "Primeiro Grau", category: "Grau" },
  { id: "segundoGrau", label: "Segundo Grau", category: "Grau" },

  // Status
  { id: "ativo", label: "Ativo", category: "Status" },
  { id: "arquivado", label: "Arquivado", category: "Status" },
];
```

### Outros Componentes UI

O projeto utiliza **shadcn/ui** como base para componentes reutilizáveis:

- **Dialog**: Diálogos modais
- **Table**: Tabelas com TanStack Table
- **Form**: Formulários com validação
- **Select**: Dropdowns customizados
- **Calendar**: Seletor de datas
- **Tooltip**: Dicas de ferramentas
- **Badge**: Etiquetas e tags
- **Button**: Botões em diversos estilos

Todos os componentes estão em `components/ui/` e podem ser importados diretamente.

## 📚 API e Documentação

### Swagger/OpenAPI

A documentação interativa da API está disponível em:

**🌐 URL:** `http://localhost:3000/docs` (desenvolvimento)

A documentação é gerada automaticamente a partir de anotações JSDoc nos endpoints:

```typescript
/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Listar todos os clientes
 *     tags:
 *       - Clientes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: Termo de busca
 *     responses:
 *       200:
 *         description: Lista de clientes
 *       401:
 *         description: Não autenticado
 */
```

### Autenticação da API

A API suporta três métodos de autenticação:

#### 1. Bearer Token (JWT)

```bash
curl -H "Authorization: Bearer seu_jwt_token" \
  http://localhost:3000/api/clientes
```

#### 2. Session Cookie (Supabase)

Automático após login. O cookie `sb-access-token` é enviado automaticamente.

#### 3. Service API Key (Jobs do Sistema)

```bash
curl -H "x-service-api-key: sua_chave_api" \
  http://localhost:3000/api/captura/start
```

### Formato de Resposta Padronizado

Todas as respostas seguem o formato:

**Sucesso:**

```json
{
  "success": true,
  "data": {
    // ... dados retornados
  }
}
```

**Erro:**

```json
{
  "error": "Mensagem de erro descritiva"
}
```

**Com Paginação:**

```json
{
  "success": true,
  "data": [
    // ... itens
  ],
  "paginacao": {
    "pagina": 1,
    "limite": 50,
    "total": 150,
    "totalPaginas": 3
  }
}
```

### Principais Endpoints

#### Clientes

- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Criar cliente
- `GET /api/clientes/[id]` - Buscar cliente
- `PUT /api/clientes/[id]` - Atualizar cliente
- `DELETE /api/clientes/[id]` - Deletar cliente

#### Contratos

- `GET /api/contratos` - Listar contratos
- `POST /api/contratos` - Criar contrato
- `GET /api/contratos/[id]` - Buscar contrato
- `PUT /api/contratos/[id]` - Atualizar contrato
- `DELETE /api/contratos/[id]` - Deletar contrato

#### Audiências

- `GET /api/audiencias` - Listar audiências
- `POST /api/audiencias` - Criar audiência
- `PATCH /api/audiencias/[id]/atribuir` - Atribuir responsável
- `PATCH /api/audiencias/[id]/url-virtual` - Atualizar URL virtual

#### Captura de Dados

- `POST /api/captura/acervo-geral/start` - Iniciar captura de acervo geral
- `POST /api/captura/audiencias/start` - Iniciar captura de audiências
- `POST /api/captura/pendentes-manifestacao/start` - Iniciar captura de pendentes
- `POST /api/captura/arquivados/start` - Iniciar captura de arquivados

#### Usuários

- `GET /api/usuarios` - Listar usuários
- `POST /api/usuarios` - Criar usuário
- `PATCH /api/usuarios/[id]/toggle-admin` - Alternar admin
- `PATCH /api/usuarios/[id]/toggle-status` - Alternar status ativo

#### Cache

- `GET /api/cache/stats` - Estatísticas do Redis
- `POST /api/cache/clear` - Limpar cache

## 🤖 MCP Server (Model Context Protocol)

O Sinesys possui um **MCP Server** completo que expõe todas as APIs do sistema para agentes de IA via [Model Context Protocol](https://modelcontextprotocol.io/). Isso permite que assistentes como Claude Desktop interajam programaticamente com o Sinesys.

> **📦 Repositório Separado**: O MCP Server agora está em um repositório independente: **sinesys-mcp-server**

### Visão Geral

- **52 Tools Disponíveis** organizadas em 10 categorias
- **Autenticação Segura** via Service API Key ou Bearer Token
- **Operações Assíncronas** com polling automático para capturas
- **Validação Robusta** com Zod schemas
- **Retry Logic** para resiliência em operações HTTP

### Categorias de Tools

- **Clientes** (4 tools): CRUD completo de clientes PF/PJ
- **Contratos** (3 tools): Gestão de contratos e vínculos
- **Acervo** (3 tools): Listagem e gestão de processos
- **Audiências** (6 tools): Gestão completa de audiências
- **Pendentes de Manifestação** (4 tools): Controle de prazos e baixas
- **Expedientes Manuais** (8 tools): CRUD de expedientes
- **Captura** (7 tools): Captura assíncrona de dados do PJE/TRT
- **Advogados** (7 tools): Gestão de advogados e credenciais PJE
- **Usuários** (6 tools): Gestão de usuários e permissões
- **Admin** (3 tools): Cache, health check e administração

### Instalação e Documentação

Para instalação, configuração e uso completo, consulte o repositório do MCP Server:

**Repositório:** [sinesys-mcp-server](https://github.com/seu-org/sinesys-mcp-server)

#### Configuração Rápida

1. Clone o repositório do MCP Server
2. Configure as variáveis de ambiente:
   ```env
   SINESYS_API_URL=https://seu-sinesys.com
   SINESYS_API_KEY=sua_service_api_key
   ```
3. Build e execute:
   ```bash
   npm install
   npm run build
   npm start
   ```

---

## 🛠 Scripts Úteis

### Scripts de Desenvolvimento

```bash
# Executar em modo desenvolvimento
npm run dev

# Executar com trace de deprecation
npm run dev:trace

# Build para produção
npm run build

# Iniciar servidor de produção
npm start

# Lint do código
npm run lint

# Type-check (verificar tipos)
npm run type-check

# Type-check sem verificar bibliotecas
npm run type-check:skip-lib
```

### Scripts de Teste de APIs PJE

```bash
# Testar API de acervo geral
npm run test:api-acervo-geral

# Testar API de processos arquivados
npm run test:api-arquivados

# Testar API de audiências
npm run test:api-audiencias

# Testar API de pendentes de manifestação
npm run test:api-pendentes-manifestacao
```

### Scripts de População de Dados

```bash
# Popular tabelas auxiliares de audiências
npm run populate:tabelas-audiencias

# Popular classe judicial do acervo
npm run populate:classe-judicial-acervo
```

### Scripts Administrativos

```bash
# Sincronizar usuários Supabase Auth <-> Database
npm run sincronizar-usuarios

# Debug de credenciais
npm run debug:credentials
```

## 🚀 Deploy

### Docker

O projeto está configurado para deploy com Docker e Docker Swarm.

#### 1. Build da Imagem

```bash
docker build -t sinesys:latest .
```

#### 2. Deploy no Swarm

```bash
# Inicializar Swarm (se necessário)
docker swarm init

# Deploy usando docker-compose.yml
docker stack deploy -c docker-compose.yml sinesys
```

#### 3. Verificar Status

```bash
# Listar serviços
docker service ls

# Ver logs
docker service logs sinesys_zattar_advogados -f

# Escalar serviço
docker service scale sinesys_zattar_advogados=3
```

### Variáveis de Ambiente para Produção

Certifique-se de configurar as seguintes variáveis no ambiente de produção:

```bash
# Next.js
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_anon_key
SUPABASE_SECRET_KEY=sua_secret_key

# Redis
ENABLE_REDIS_CACHE=true
REDIS_URL=redis://:senha@host:porta

# MongoDB
MONGODB_URL=mongodb://...

# Outras configurações...
```

### Health Check

O sistema possui um endpoint de health check em `/api/health`:

```bash
curl http://localhost:3000/api/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "timestamp": "2025-11-21T..."
}
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Autenticação

**Problema:** `Unauthorized` ao acessar endpoints

**Solução:**

- Verificar se o usuário está logado
- Confirmar que o token JWT é válido
- Verificar se as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` estão corretas

#### 2. Erro de Compilação TypeScript

**Problema:** Erros de tipo durante o build

**Solução:**

```bash
# Verificar tipos sem build
npm run type-check

# Limpar cache do Next.js
rm -rf .next
npm run dev
```

#### 3. Cache Redis Não Funciona

**Problema:** Dados não são armazenados em cache

**Solução:**

- Verificar `ENABLE_REDIS_CACHE=true`
- Testar conexão: `redis-cli -h host -p porta -a senha ping`
- Verificar logs do servidor para erros de conexão

#### 4. Erro ao Capturar Dados do PJE

**Problema:** Falha na captura de processos

**Solução:**

- Verificar credenciais no 2FAuth
- Confirmar que `TWOFAUTH_API_URL`, `TWOFAUTH_API_TOKEN` e `TWOFAUTH_ACCOUNT_ID` estão corretos
- Testar credenciais manualmente no PJE

#### 5. Problemas com MongoDB

**Problema:** Erro ao salvar timeline

**Solução:**

- Verificar `MONGODB_URL` e `MONGODB_DATABASE`
- Testar conexão: `mongosh "sua_connection_string"`
- Verificar permissões do usuário MongoDB

#### 6. Erro de Build Docker

**Problema:** Build falha no Docker

**Solução:**

```bash
# Limpar cache do Docker
docker builder prune -a

# Rebuild sem cache
docker build --no-cache -t sinesys:latest .
```

### Logs e Debugging

#### Logs do Next.js

```bash
# Modo desenvolvimento com logs detalhados
npm run dev:trace
```

#### Logs do Docker

```bash
# Ver logs de um serviço específico
docker service logs sinesys_zattar_advogados -f

# Logs de um container específico
docker logs <container_id> -f
```

#### Logs do Redis

```bash
# Conectar ao Redis CLI
redis-cli -h host -p porta -a senha

# Monitorar comandos em tempo real
MONITOR

# Ver estatísticas
INFO
```

### Suporte

Para problemas não listados acima:

1. Verificar logs do sistema
2. Consultar a documentação em `openspec/` e `dev_data/docs/`
3. Revisar issues conhecidos no repositório
4. Contatar a equipe de desenvolvimento

---

## 📝 Licença

Proprietary - Zattar Advogados

## 👥 Equipe

Desenvolvido por Zattar Advogados

---

**Última atualização:** Novembro 2025
