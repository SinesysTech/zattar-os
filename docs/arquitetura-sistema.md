# Arquitetura do Sistema Sinesys

> **Documento de Arquitetura de Software**  
> Sistema de Gestão Jurídica para Zattar Advogados  
> Versão: 1.0  
> Data: Dezembro 2025

---

## Sumário

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura de Diretórios](#3-estrutura-de-diretórios)
4. [Arquitetura em Camadas](#4-arquitetura-em-camadas)
5. [Arquitetura Frontend](#5-arquitetura-frontend)
6. [Arquitetura Backend](#6-arquitetura-backend)
7. [Banco de Dados e Persistência](#7-banco-de-dados-e-persistência)
8. [Autenticação e Segurança](#8-autenticação-e-segurança)
9. [API e Integração](#9-api-e-integração)
10. [Módulos Funcionais](#10-módulos-funcionais)
11. [Infraestrutura e Deploy](#11-infraestrutura-e-deploy)
12. [Fluxos de Dados](#12-fluxos-de-dados)
13. [Padrões e Boas Práticas](#13-padrões-e-boas-práticas)

---

## 1. Visão Geral do Sistema

### 1.1. Propósito

O **Sinesys** é um sistema completo de gestão jurídica desenvolvido especificamente para o escritório **Zattar Advogados**. O sistema integra captura automatizada de dados do PJE/TRT, gerenciamento de processos, controle de audiências, expedientes, obrigações financeiras e muito mais.

### 1.2. Características Principais

- **Sistema Full-Stack**: Frontend e Backend integrados em uma única aplicação Next.js
- **Arquitetura em Camadas**: Separação clara entre apresentação, aplicação, domínio e infraestrutura
- **Progressive Web App (PWA)**: Funciona offline e pode ser instalado como aplicativo
- **Realtime**: Colaboração em tempo real com Supabase Realtime
- **Responsive**: Interface adaptável para desktop, tablet e mobile
- **Type-Safe**: TypeScript em toda a aplicação com tipagem estrita

### 1.3. Escala do Sistema

- **+40 Módulos Funcionais**
- **+170 Componentes UI Reutilizáveis**
- **+36 Schemas de Banco de Dados**
- **+50 Endpoints de API REST**
- **52 Tools MCP** para integração com IA

---

## 2. Stack Tecnológica

### 2.1. Frontend

| Tecnologia         | Versão | Função                                    |
| ------------------ | ------ | ----------------------------------------- |
| **Next.js**        | 16.x   | Framework React com App Router e SSR      |
| **React**          | 19.2   | Biblioteca de interface do usuário        |
| **TypeScript**     | 5.x    | Tipagem estática e segurança de tipos     |
| **Tailwind CSS**   | 4.x    | Framework CSS utility-first               |
| **shadcn/ui**      | -      | Biblioteca de componentes reutilizáveis   |
| **Radix UI**       | -      | Primitivos de UI acessíveis               |
| **Framer Motion**  | 12.x   | Animações e transições                    |
| **TanStack Table** | 8.x    | Tabelas avançadas com filtros e ordenação |
| **SWR**            | 2.x    | Fetching de dados e cache client-side     |

### 2.2. Backend

| Tecnologia             | Versão | Função                           |
| ---------------------- | ------ | -------------------------------- |
| **Next.js API Routes** | 16.x   | Endpoints HTTP RESTful           |
| **Supabase**           | 2.x    | Backend-as-a-Service (Auth + DB) |
| **PostgreSQL**         | 15.x   | Banco de dados relacional        |
| **Redis**              | -      | Cache e sessões                  |
| **MongoDB**            | 7.x    | Banco de dados NoSQL auxiliar    |
| **Playwright**         | 1.56   | Automação de captura de dados    |

### 2.3. Bibliotecas Especializadas

- **Plate.js** (52.x): Editor de texto rico (WYSIWYG)
- **Y.js**: Colaboração em tempo real (CRDT)
- **CopilotKit**: Integração com IA (Assistentes)
- **Recharts**: Gráficos e visualizações
- **pdf-lib**: Geração e manipulação de PDFs
- **ExcelJS**: Export/Import de Excel
- **Axios**: Cliente HTTP

### 2.4. DevOps e Infraestrutura

| Tecnologia       | Função                                   |
| ---------------- | ---------------------------------------- |
| **Docker**       | Containerização                          |
| **Docker Swarm** | Orquestração de containers               |
| **Traefik**      | Proxy reverso e load balancer            |
| **Backblaze B2** | Armazenamento de objetos (S3-compatible) |
| **Vercel**       | Deploy alternativo (desenvolvimento)     |

---

## 3. Estrutura de Diretórios

### 3.1. Visão Geral

```
sinesys/
├── src/
│   ├── app/                      # Aplicação Next.js (App Router)
│   │   ├── (dashboard)/          # Grupo de rotas do dashboard
│   │   ├── actions/              # Server Actions (legado)
│   │   ├── api/                  # Endpoints de API REST
│   │   ├── auth/                 # Páginas de autenticação
│   │   └── globals.css           # Estilos globais
│   ├── features/                 # 🆕 MÓDULOS FSD (Feature-Sliced Design)
│   │   ├── acervo/               # ✅ Processos (migrado)
│   │   ├── partes/               # ✅ Clientes e partes (migrado)
│   │   ├── processos/            # ✅ Processos (migrado)
│   │   ├── contratos/            # ✅ Contratos (migrado)
│   │   ├── rh/                   # ✅ RH (migrado)
│   │   ├── expedientes/          # ✅ Expedientes (migrado)
│   │   ├── advogados/            # ✅ Advogados (migrado)
│   │   ├── cargos/               # ✅ Cargos (migrado)
│   │   ├── usuarios/             # ✅ Usuários (migrado)
│   │   └── [...outros]/         # 🔄 Em migração
│   ├── components/               # Componentes React reutilizáveis
│   │   ├── ui/                   # Componentes base (shadcn/ui)
│   │   ├── layout/               # Componentes de layout
│   │   ├── shared/               # Componentes compartilhados
│   │   └── {dominio}/            # Componentes específicos de domínio
│   ├── lib/                      # Bibliotecas e configurações
│   │   ├── api/                  # Integrações externas
│   │   │   └── pje-trt/          # 🆕 Timeline PJE/TRT (migrado)
│   │   ├── auth/                 # Autenticação e autorização
│   │   ├── mongodb/              # Cliente MongoDB
│   │   ├── redis/                # Cache Redis
│   │   ├── supabase/             # Cliente Supabase
│   │   ├── copilotkit/           # Configuração IA
│   │   └── utils/                # Utilitários gerais
│   ├── hooks/                    # React Hooks customizados
│   └── types/                    # Tipos TypeScript compartilhados
│       ├── domain/               # Entidades de domínio
│       └── contracts/            # DTOs e contratos
├── backend/                  # 🔄 Lógica de negócio legada (em migração)
│   ├── {modulo}/services/    # Serviços de aplicação
│   │   ├── {modulo}/         # Lógica de negócio
│   │   └── persistence/      # Camada de persistência
│   ├── auth/                 # Autenticação e autorização
│   ├── types/                # Tipos TypeScript do backend
│   └── utils/                # Utilitários do backend
├── supabase/                 # Banco de dados
│   ├── migrations/           # Migrações SQL
│   └── schemas/              # Schemas declarativos
├── scripts/                  # Scripts auxiliares
├── docs/                     # Documentação
└── public/                   # Arquivos estáticos
```

### 3.2. Migração para Feature-Sliced Design (FSD)

O Sinesys está em **migração progressiva** de uma arquitetura baseada em camadas técnicas (`backend/`, `app/`) para uma **Arquitetura Orientada a Features (Feature-Sliced Design)**.

#### Estrutura de Features

```
src/features/{modulo}/
├── components/       # Componentes React específicos
├── hooks/            # Hooks customizados
├── actions/          # Server Actions (Next.js)
├── domain.ts         # Entidades e regras de negócio
├── service.ts        # Casos de uso
├── repository.ts     # Acesso ao banco de dados
├── types.ts          # Tipagem específica
├── utils.ts          # Utilitários
└── index.ts          # Barrel exports
```

#### Módulos Migrados para FSD ✅

- **Acervo** (`features/acervo/`) - Completo

  - Desacoplado do backend, com service/repository/actions próprios
  - Timeline migrada para `lib/api/pje-trt/`
  - Métodos específicos: `obterAcervoPaginado`, `obterAcervoUnificado`, `obterAcervoAgrupado`
  - `backend/acervo/` e `backend/types/acervo/` **removidos** ✅

- **Partes** (`features/partes/`) - Completo

  - Clientes, Partes Contrárias, Terceiros, Representantes

- **Processos** (`features/processos/`) - Completo

  - Domain, Service, Repository pattern

- **Contratos** (`features/contratos/`) - Completo

- **RH** (`features/rh/`) - Completo

  - Salários, Folhas de Pagamento, Integração Financeira

- **Expedientes** (`features/expedientes/`) - Completo

#### Módulos Legados (Backend) 🔄

Módulos ainda não migrados permanecem em `backend/{modulo}/services/`:

- Audiências
- Acordos/Condenações
- Financeiro
- Captura de dados PJE/TRT (infraestrutura)

#### Regras de Migração

1. **Novos módulos**: Implementar diretamente em `features/`
2. **Módulos existentes**: Migrar apenas quando houver necessidade de refatoração
3. **Retrocompatibilidade**: Garantir que mudanças não quebrem funcionalidades
4. **API Routes**: Migrar para Server Actions quando possível

### 3.3. Convenções de Nomenclatura

#### Diretórios

- **Backend**: `kebab-case` (ex: `acordos-condenacoes/`)
- **Features**: `kebab-case` (ex: `acervo/`, `partes/`)
- **Componentes**: `kebab-case` (ex: `table-toolbar/`)
- **Módulos**: Nome do domínio no singular/plural conforme contexto

#### Arquivos

- **Componentes React**: `kebab-case.tsx` (ex: `user-avatar.tsx`)
- **Serviços**: `{nome}.service.ts` (ex: `cliente.service.ts`)
- **Persistência**: `{entidade}-persistence.service.ts`
- **Types**: `{dominio}-types.ts` ou `types.ts`
- **Testes**: `{nome}.test.ts` ou `{nome}.spec.ts`

#### Código

- **TypeScript**: `camelCase` para variáveis/funções, `PascalCase` para tipos/classes
- **SQL**: `snake_case` para tabelas e colunas
- **CSS**: `kebab-case` para classes

---

## 4. Arquitetura em Camadas

O Sinesys segue uma **arquitetura em camadas** inspirada em **Domain-Driven Design (DDD)** para promover separação de responsabilidades, manutenibilidade e testabilidade.

### 4.1. Diagrama de Camadas

```
┌─────────────────────────────────────────────────────────────┐
│         CAMADA DE APRESENTAÇÃO (Presentation Layer)         │
│  - Componentes React                                        │
│  - Páginas Next.js                                          │
│  - Hooks customizados                                       │
│  - Estado da UI                                             │
│  Localização: app/(dashboard)/, components/                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              CAMADA DE API (API Layer)                      │
│  - Next.js API Routes                                       │
│  - Validação de entrada (Zod)                               │
│  - Autenticação e autorização                               │
│  - Formatação de resposta                                   │
│  Localização: app/api/                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│           CAMADA DE APLICAÇÃO (Application Layer)           │
│  - Serviços de aplicação                                    │
│  - Casos de uso                                             │
│  - DTOs (Data Transfer Objects)                             │
│  - Orquestração de lógica de negócio                        │
│  Localização: backend/{modulo}/services/{modulo}/           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            CAMADA DE DOMÍNIO (Domain Layer)                 │
│  - Entidades                                                │
│  - Value Objects                                            │
│  - Agregados                                                │
│  - Regras de negócio puras                                  │
│  Localização: types/domain/                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│        CAMADA DE INFRAESTRUTURA (Infrastructure Layer)      │
│  - Persistência (Repositórios)                              │
│  - APIs externas (PJE/TRT)                                  │
│  - Cache (Redis)                                            │
│  - Storage (Backblaze B2)                                   │
│  Localização: backend/{modulo}/services/persistence/        │
└─────────────────────────────────────────────────────────────┘
```

### 4.2. Responsabilidades por Camada

#### Camada de Apresentação

- Renderizar interface do usuário
- Capturar interações do usuário
- Gerenciar estado local da UI
- Validação de formulários (frontend)
- Feedback visual (loading, erros, sucesso)

**Exemplos**:

- `app/(dashboard)/processos/page.tsx`
- `components/ui/data-table.tsx`
- `hooks/use-viewport.ts`

#### Camada de API

- Receber requisições HTTP
- Validar entrada com schemas Zod
- Autenticar e autorizar usuários
- Invocar serviços de aplicação
- Retornar respostas padronizadas

**Formato de Resposta**:

```typescript
// Sucesso
{ success: true, data: T }

// Erro
{ success: false, error: string }
```

**Exemplos**:

- `app/api/clientes/route.ts`
- `app/api/acervo/[id]/route.ts`

#### Camada de Aplicação

- Implementar casos de uso
- Orquestrar múltiplas operações
- Validar regras de negócio
- Transformar DTOs em entidades de domínio
- Independente de detalhes de infraestrutura

**Exemplos**:

- `backend/clientes/services/clientes/criar-cliente.service.ts`
- `backend/acervo/services/acervo/listar-processos.service.ts`

#### Camada de Domínio

- Definir entidades e value objects
- Encapsular regras de negócio puras
- Sem dependências externas
- Reutilizável em qualquer contexto

**Exemplos**:

- `types/domain/cliente.ts`
- `types/domain/processo.ts`

#### Camada de Infraestrutura

- Acesso ao banco de dados
- Integração com APIs externas
- Cache e armazenamento
- Detalhes técnicos de implementação

**Exemplos**:

- `backend/clientes/services/persistence/cliente-persistence.service.ts`
- `backend/captura/services/trt/trt-auth.service.ts`

### 4.3. Fluxo de Dados Entre Camadas

```mermaid
graph LR
    A[Usuário] --> B[Componente React]
    B --> C[API Route]
    C --> D[Autenticação]
    D --> E[Serviço de Aplicação]
    E --> F[Serviço de Persistência]
    F --> G[(PostgreSQL)]
    F --> H[(Redis Cache)]
    G --> F
    H --> F
    F --> E
    E --> C
    C --> B
    B --> A
```

---

## 5. Arquitetura Frontend

### 5.1. Arquitetura Orientada a Features (Feature-Sliced Design)

O Sinesys adota uma **Arquitetura Orientada a Features** simplificada, inspirada no Feature-Sliced Design (FSD), otimizada para o Next.js App Router.

#### Estrutura do Frontend

```
src/
├── app/                      # CAMADA DE ROTEAMENTO (Apenas Entrypoints)
│   ├── (auth)/                 # Rotas de Autenticação (Login, Recuperar senha)
│   │   └── layout.tsx          # Layout limpo (sem sidebar)
│   │
│   ├── (dashboard)/            # O "Zattar Shell" (A aplicação principal)
│   │   ├── layout.tsx          # ⚠️ AQUI vive o Layout Grid (Sidebar + Main)
│   │   ├── loading.tsx         # Skeleton global do dashboard
│   │   │
│   │   ├── page.tsx            # Dashboard Home (Resumo)
│   │   │
│   │   ├── processos/          # Rota de Processos
│   │   │   ├── page.tsx        # Lista (usa features/processos/)
│   │   │   └── [id]/           # Detalhe do Processo
│   │   │
│   │   └── partes/             # Rota de Partes
│   │       └── ...             # (usa features/partes/)
│   │
│   ├── api/                    # Route Handlers (Webhooks, Uploads)
│   ├── globals.css             # O CSS com suas variáveis OKLCH e Fontes
│   └── layout.tsx              # Root Layout (Fontes Inter/Montserrat, Providers)
│
├── features/                 # CAMADA DE NEGÓCIO (Domain Logic)
│   ├── partes/                 # Tudo sobre "Partes" vive aqui
│   │   ├── components/         # Componentes específicos (ClientesTable, etc)
│   │   │   ├── clientes/
│   │   │   ├── partes-contrarias/
│   │   │   ├── terceiros/
│   │   │   ├── representantes/
│   │   │   └── shared/
│   │   ├── hooks/              # Hooks do módulo (use-clientes, use-terceiros)
│   │   ├── utils/              # Utilitários (formatação, validação)
│   │   ├── types/              # Tipagem Zod/TS específica
│   │   └── index.ts            # Barrel exports
│   │
│   ├── processos/
│   │   ├── components/
│   │   ├── actions/            # Server Actions
│   │   ├── hooks/
│   │   ├── domain.ts           # Entidades e Value Objects
│   │   ├── service.ts          # Casos de uso
│   │   ├── repository.ts       # Acesso a dados
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── contratos/
│       └── ...
│
├── components/               # CAMADA DE APRESENTAÇÃO (UI Pura)
│   ├── ui/                     # Primitivos shadcn (Button, Input, Card...)
│   │
│   ├── layout/                 # Blocos Estruturais do Shell
│   │   ├── app-sidebar.tsx     # A Sidebar "Charcoal"
│   │   ├── app-header.tsx      # Topbar com Breadcrumbs
│   │   └── page-shell.tsx      # Wrapper padrão para páginas
│   │
│   └── shared/                 # Padrões Zattar Reutilizáveis
│       ├── data-table-shell.tsx # Superfície de Dados (Toolbar + Table + Footer)
│       └── table-toolbar.tsx    # Componente de busca e filtros
│
├── lib/                      # CAMADA DE INFRAESTRUTURA
│   ├── supabase/               # Conexão Supabase
│   ├── utils.ts                # Helpers (cn(), etc)
│   └── constants.ts            # Menus, Configurações estáticas
│
└── hooks/                    # Hooks Globais (use-media-query, use-store)
```

#### Os 3 Pilares da Implementação FSD

**Pilar 1: O "Feature Module"**

Ao invés de espalhar código, **colocamos a lógica onde ela pertence**.

- _Errado:_ Colocar um componente `ProcessCard` dentro de `components/ui`.
- _Certo:_ Colocar em `src/features/processos/components/process-card.tsx`.
- _Por que:_ Quando você precisar alterar algo sobre processos, você vai em uma única pasta. Isso facilita a manutenção mental.

**Pilar 2: O Padrão "Data Surface" (Superfície de Dados)**

Para garantir aquele visual "colado" (Toolbar + Table) que definimos, usamos o componente `DataTableShell` em `components/shared/data-table-shell.tsx`.

Ele aceita a `Toolbar`, a `Table` e o `Pagination` como children ou props, e garante que as bordas e fundos estejam corretos (Toolbar `rounded-t`, Table sem borda top/bottom, Footer `rounded-b`).

**Pilar 3: O "Shell Layout" (Sidebar Fixa)**

O código crucial para `src/app/(dashboard)/layout.tsx`. Ele implementa o fundo Off-White e a Sidebar Charcoal fixa.

```tsx
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* 1. Sidebar (Fixo, Charcoal) */}
      <AppSidebar />

      {/* 2. Área Principal (Scrollável, Off-White) */}
      <SidebarInset id="main-content">
        {/* O Palco (Onde as páginas são renderizadas) */}
        {/* O scroll acontece AQUI DENTRO, não na janela inteira */}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
```

#### Migração Progressiva para FSD

**Módulos Migrados (✅ Completo)**

1. **Partes** (`features/partes/`)

   - Clientes
   - Partes Contrárias
   - Terceiros
   - Representantes

2. **Processos** (`features/processos/`)

   - Domain, Service, Repository pattern
   - Server Actions implementados
   - Componentes específicos isolados

3. **Contratos** (`features/contratos/`)
   - Estrutura completa de feature
   - Hooks customizados
   - Utils e tipos

**Módulos Legados (🔄 Em Migração)**

- **Audiências** - Mantém estrutura antiga em `app/(dashboard)/audiencias/`
- **Expedientes** - Mantém estrutura antiga em `app/(dashboard)/expedientes/`
- **Acordos/Condenações** - Mantém estrutura antiga
- **Financeiro** - Módulo complexo com estrutura própria
- **RH** - Mantém estrutura antiga
- **Assinatura Digital** - Parcialmente migrado para `features/assinatura-digital/`

**Estratégia de Migração**:

1. Módulos novos: implementar diretamente em `features/`
2. Módulos existentes: migrar incrementalmente conforme necessidade
3. Módulos legados: manter funcional, sem grandes refatorações

### 5.2. Componentes UI

#### Sistema de Design Baseado em shadcn/ui

```
components/ui/
├── badge.tsx                 # Badges e labels
├── button.tsx                # Botões primários
├── card.tsx                  # Cards e containers
├── data-table.tsx            # Tabelas de dados
├── dialog.tsx                # Modais e diálogos
├── form.tsx                  # Formulários (react-hook-form)
├── input.tsx                 # Inputs de texto
├── select.tsx                # Selects e dropdowns
├── table-toolbar.tsx         # Barra de ferramentas de tabelas
├── responsive-table.tsx      # Tabelas responsivas
└── ...                       # +170 componentes
```

#### Componentes Responsivos

O sistema possui uma estratégia completa de responsividade:

**Breakpoints**:

```typescript
{
  sm: 640,   // Mobile landscape
  md: 768,   // Tablet portrait
  lg: 1024,  // Desktop
  xl: 1280,  // Desktop large
  '2xl': 1536 // Desktop XL
}
```

**Hooks de Responsividade**:

- `useViewport()`: Detecta tamanho da tela e breakpoint atual
- `useOrientation()`: Detecta orientação (portrait/landscape)
- `useBreakpoint()`: Verifica se está em breakpoint específico

**Componentes Adaptativos**:

- `ResponsiveTable`: Alterna entre tabela e cards em mobile
- `ResponsiveDialog`: Sheet em mobile, Dialog em desktop
- `ResponsiveFilterPanel`: Filtros inline (desktop) ou Sheet (mobile)
- `ResponsiveFormLayout`: Layout de formulários adaptável

### 5.3. Roteamento e Navegação

#### App Router (Next.js 16)

O Sinesys utiliza o **App Router** do Next.js com **Route Groups** para organização:

```
app/
├── (dashboard)/              # Rotas protegidas com autenticação
│   └── layout.tsx            # Layout compartilhado (sidebar)
├── (public)/                 # Rotas públicas
│   └── formulario/
└── auth/                     # Autenticação (sem layout)
```

#### Navegação

**Componentes**:

- `AppSidebar`: Navegação lateral com módulos
- `AppBreadcrumb`: Breadcrumb dinâmico
- `MobileNav`: Menu mobile (Sheet)

**Configuração**:

```typescript
// components/layout/app-sidebar.tsx
const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Processos",
    url: "/processos",
    icon: FileText,
  },
  // ...
];
```

### 5.4. Gerenciamento de Estado

#### Estratégias de Estado

| Tipo de Estado         | Solução                  | Exemplo                    |
| ---------------------- | ------------------------ | -------------------------- |
| **Estado Local**       | `useState`, `useReducer` | Formulários, UI temporária |
| **Estado do Servidor** | SWR, React Query         | Dados de API               |
| **Estado Global**      | Context API, Zustand     | Tema, usuário autenticado  |
| **URL State**          | Next.js Router           | Filtros, paginação         |

#### Fetching de Dados com SWR

```typescript
// Exemplo: Listar processos com cache
import useSWR from "swr";

function ProcessosPage() {
  const { data, error, isLoading } = useSWR(
    "/api/acervo?pagina=1&limite=20",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  if (isLoading) return <Spinner />;
  if (error) return <Error />;

  return <DataTable data={data.processos} />;
}
```

### 5.5. Formulários e Validação

#### React Hook Form + Zod

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const clienteSchema = z.object({
  nome: z.string().min(3, "Mínimo 3 caracteres"),
  cpf: z.string().regex(/^\d{11}$/, "CPF inválido"),
  email: z.string().email("E-mail inválido"),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

function ClienteForm() {
  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
  });

  const onSubmit = async (data: ClienteFormData) => {
    const response = await fetch("/api/clientes", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // ...
  };

  return <Form {...form} onSubmit={onSubmit} />;
}
```

### 5.6. Temas e Estilização

#### Sistema de Temas (Dark/Light)

```typescript
// Configuração em app/layout.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

#### Variáveis CSS (Tailwind)

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

---

## 6. Arquitetura Backend

### 6.1. Estrutura do Backend

```
backend/
├── {modulo}/                 # Um diretório por módulo funcional
│   ├── services/
│   │   ├── {modulo}/         # Serviços de aplicação (lógica de negócio)
│   │   │   ├── criar-{entidade}.service.ts
│   │   │   ├── listar-{entidade}s.service.ts
│   │   │   ├── atualizar-{entidade}.service.ts
│   │   │   └── deletar-{entidade}.service.ts
│   │   └── persistence/      # Serviços de persistência (acesso a dados)
│   │       └── {entidade}-persistence.service.ts
│   └── types/                # Tipos específicos do módulo (opcional)
│       └── types.ts
├── auth/                     # Autenticação e autorização
│   ├── api-auth.ts           # Autenticação de requisições
│   └── permissions.ts        # Sistema de permissões
├── types/                    # Tipos compartilhados
│   ├── {modulo}/
│   │   └── types.ts
│   └── api.ts
└── utils/                    # Utilitários do backend
    ├── supabase/
    │   ├── server.ts         # Cliente Supabase (SSR)
    │   └── service-client.ts # Cliente Supabase (Service Role)
    ├── validation/           # Schemas de validação
    ├── logging/              # Logging estruturado
    └── cache/                # Cache Redis
```

### 6.2. Padrão de Serviços

#### Camada de Aplicação (Business Logic)

**Responsabilidades**:

- Validar regras de negócio
- Orquestrar múltiplas operações
- Transformar dados
- Independente de detalhes de persistência

**Exemplo**:

```typescript
// backend/clientes/services/clientes/criar-cliente.service.ts
import { criarCliente as criarClientePersistence } from "../persistence/cliente-persistence.service";
import type {
  CriarClienteParams,
  Cliente,
} from "@/backend/types/clientes/types";

export async function criarCliente(
  params: CriarClienteParams
): Promise<Cliente> {
  // 1. Validações de negócio
  if (!params.nome || params.nome.trim().length < 3) {
    throw new Error("Nome deve ter pelo menos 3 caracteres");
  }

  // 2. Normalização
  const dadosNormalizados = {
    ...params,
    nome: params.nome.trim().toUpperCase(),
    cpf: params.cpf.replace(/\D/g, ""),
  };

  // 3. Regras de negócio
  if (params.tipo === "PF" && !validarCPF(dadosNormalizados.cpf)) {
    throw new Error("CPF inválido");
  }

  // 4. Persistência
  return await criarClientePersistence(dadosNormalizados);
}
```

#### Camada de Persistência (Data Access)

**Responsabilidades**:

- Acesso ao banco de dados
- Queries e filtros
- Auditoria e logging
- Manipulação de relações

**Exemplo**:

```typescript
// backend/clientes/services/persistence/cliente-persistence.service.ts
import { createServiceClient } from "@/backend/utils/supabase/service-client";
import type {
  Cliente,
  CriarClienteParams,
} from "@/backend/types/clientes/types";

export async function criarCliente(
  params: CriarClienteParams
): Promise<Cliente> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nome: params.nome,
      cpf: params.cpf,
      tipo: params.tipo,
      email: params.email,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar cliente: ${error.message}`);
  }

  return data;
}

export async function listarClientes(
  filtros: ListarClientesParams
): Promise<ClientesPaginados> {
  const supabase = createServiceClient();

  let query = supabase.from("clientes").select("*", { count: "exact" });

  // Filtros
  if (filtros.busca) {
    query = query.or(
      `nome.ilike.%${filtros.busca}%,cpf.ilike.%${filtros.busca}%`
    );
  }

  if (filtros.tipo) {
    query = query.eq("tipo", filtros.tipo);
  }

  // Ordenação
  query = query.order("nome", { ascending: true });

  // Paginação
  const from = (filtros.pagina - 1) * filtros.limite;
  const to = from + filtros.limite - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar clientes: ${error.message}`);
  }

  return {
    clientes: data || [],
    total: count || 0,
    pagina: filtros.pagina,
    limite: filtros.limite,
  };
}
```

### 6.3. API Routes (Next.js)

#### Estrutura de Endpoint

```
app/api/
├── clientes/
│   ├── route.ts              # GET (listar), POST (criar)
│   └── [id]/
│       ├── route.ts          # GET (buscar), PATCH (atualizar), DELETE (deletar)
│       └── avatar/
│           └── route.ts      # POST (upload), DELETE (remover)
├── acervo/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── timeline/
│           └── route.ts
└── health/
    └── route.ts              # Health check
```

#### Exemplo de Endpoint

```typescript
// app/api/clientes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/backend/auth/api-auth";
import {
  criarCliente,
  listarClientes,
} from "@/backend/clientes/services/clientes";
import { z } from "zod";

// Schema de validação
const criarClienteSchema = z.object({
  nome: z.string().min(3),
  cpf: z.string().regex(/^\d{11}$/),
  tipo: z.enum(["PF", "PJ"]),
  email: z.string().email().optional(),
});

/**
 * @swagger
 * /api/clientes:
 *   post:
 *     summary: Criar novo cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, cpf, tipo]
 *             properties:
 *               nome:
 *                 type: string
 *               cpf:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [PF, PJ]
 *     responses:
 *       200:
 *         description: Cliente criado
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    // 2. Validação
    const body = await request.json();
    const validacao = criarClienteSchema.safeParse(body);

    if (!validacao.success) {
      return NextResponse.json(
        { success: false, error: validacao.error.errors[0].message },
        { status: 400 }
      );
    }

    // 3. Lógica de negócio
    const cliente = await criarCliente(validacao.data);

    // 4. Resposta
    return NextResponse.json({
      success: true,
      data: cliente,
    });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Listar clientes
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: pagina
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limite
 *         in: query
 *         schema:
 *           type: integer
 *       - name: busca
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filtros = {
      pagina: parseInt(searchParams.get("pagina") || "1"),
      limite: parseInt(searchParams.get("limite") || "20"),
      busca: searchParams.get("busca") || undefined,
      tipo: searchParams.get("tipo") as "PF" | "PJ" | undefined,
    };

    const resultado = await listarClientes(filtros);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error("Erro ao listar clientes:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
```

### 6.4. Tipos e Contratos

#### Organização de Tipos

```
types/
├── domain/                   # Entidades de domínio
│   ├── cliente.ts
│   ├── processo.ts
│   └── audiencia.ts
├── contracts/                # DTOs e contratos de API
│   ├── clientes/
│   │   ├── criar-cliente.ts
│   │   ├── listar-clientes.ts
│   │   └── atualizar-cliente.ts
│   └── processos/
│       └── ...
├── sinesys/                  # Tipos específicos do sistema
│   └── database.ts
└── index.ts                  # Re-exports
```

#### Exemplo de Tipos

```typescript
// types/domain/cliente.ts
export interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  tipo: "PF" | "PJ";
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// types/contracts/clientes/criar-cliente.ts
export interface CriarClienteParams {
  nome: string;
  cpf: string;
  tipo: "PF" | "PJ";
  email?: string;
  telefone?: string;
}

// types/contracts/clientes/listar-clientes.ts
export interface ListarClientesParams {
  pagina: number;
  limite: number;
  busca?: string;
  tipo?: "PF" | "PJ";
}

export interface ClientesPaginados {
  clientes: Cliente[];
  total: number;
  pagina: number;
  limite: number;
}
```

---

## 7. Banco de Dados e Persistência

### 7.1. Tecnologias de Persistência

| Tecnologia                | Uso                                          |
| ------------------------- | -------------------------------------------- |
| **PostgreSQL** (Supabase) | Banco de dados principal (dados relacionais) |
| **Redis**                 | Cache, sessões, locks distribuídos           |
| **MongoDB**               | Dados não estruturados (logs, capturas)      |
| **Backblaze B2**          | Armazenamento de objetos (PDFs, imagens)     |

### 7.2. Estrutura do Banco de Dados

#### Schemas SQL Declarativos

```
supabase/schemas/
├── 00_permissions.sql        # Permissões do service_role
├── 01_enums.sql              # Enums do sistema
├── 02_advogados.sql          # Tabela de advogados
├── 03_credenciais.sql        # Credenciais de captura
├── 04_acervo.sql             # Processos (acervo)
├── 05_acervo_unificado_view.sql
├── 06_expedientes.sql        # Expedientes
├── 07_audiencias.sql         # Audiências
├── 08_usuarios.sql           # Usuários do sistema
├── 09_clientes.sql           # Clientes
├── 10_partes_contrarias.sql  # Partes contrárias
├── 11_contratos.sql          # Contratos
├── 12_contrato_processos.sql # Relação contrato-processo
├── 13_tribunais.sql          # Tribunais
├── 14_logs_alteracao.sql     # Auditoria
├── 15_enderecos.sql          # Endereços
├── 16_terceiros.sql          # Terceiros
├── 17_processo_partes.sql    # Relação processo-partes
├── 18_representantes.sql     # Representantes legais
├── 19_audiencias_auxiliares.sql
├── 20_acordos_condenacoes.sql # Obrigações financeiras
├── 21_capturas.sql           # Logs de captura
├── 22_cargos_permissoes.sql  # Sistema de permissões
├── 23_dashboard.sql          # Views do dashboard
├── 24_processos_cliente_por_cpf_view.sql
├── 25_assinatura_digital.sql # Assinatura digital
├── 26_plano_contas.sql       # Plano de contas
├── 27_centros_custo.sql      # Centros de custo
├── 28_contas_bancarias.sql   # Contas bancárias
├── 29_lancamentos_financeiros.sql
├── 30_salarios.sql           # Salários (RH)
├── 31_conciliacao_bancaria.sql
├── 32_orcamento.sql          # Orçamento
├── 33_financeiro_functions.sql
├── 34_financeiro_views.sql
├── 35_financeiro_integracao.sql
└── 36_financeiro_seed.sql
```

#### Principais Tabelas

| Tabela                | Descrição                | Registros Estimados |
| --------------------- | ------------------------ | ------------------- |
| `acervo_geral`        | Processos de 1º grau     | ~50.000             |
| `acervo_segundo_grau` | Processos de 2º grau     | ~5.000              |
| `audiencias`          | Audiências agendadas     | ~10.000             |
| `expedientes`         | Expedientes/Prazos       | ~30.000             |
| `acordos_condenacoes` | Obrigações financeiras   | ~2.000              |
| `clientes`            | Clientes do escritório   | ~500                |
| `usuarios`            | Usuários do sistema      | ~50                 |
| `capturas`            | Logs de captura de dados | ~1.000              |

### 7.3. Row Level Security (RLS)

#### Estratégia de RLS

O Sinesys implementa **RLS (Row Level Security)** em todas as tabelas para garantir segurança no nível do banco de dados.

**Políticas Padrão**:

```sql
-- Service Role: Acesso total (usado pelas APIs backend)
CREATE POLICY "Service role tem acesso total"
  ON public.clientes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated: Leitura para colaboração
CREATE POLICY "Usuários autenticados podem visualizar clientes"
  ON public.clientes
  FOR SELECT
  TO authenticated
  USING (true);

-- Usuários autenticados podem inserir (backend valida permissões)
CREATE POLICY "Usuários autenticados podem inserir clientes"
  ON public.clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

**Observações**:

- Políticas RLS são camada adicional de segurança
- Autorização principal é feita no backend via `checkPermission()`
- Service role bypassa RLS (usado em serviços backend)
- Funções helper usam `SECURITY DEFINER` com `search_path` fixo

### 7.4. Migrações

#### Fluxo de Migrações

```mermaid
graph LR
    A[Alterar Schema] --> B[Gerar Migration]
    B --> C[Revisar SQL]
    C --> D[Aplicar no Supabase]
    D --> E[Versionar no Git]
```

**Comandos**:

```bash
# Gerar migration a partir de schemas
supabase db diff -f nome_da_migration

# Aplicar migrations
supabase db push

# Reset (desenvolvimento)
supabase db reset
```

#### Convenções de Migrações

- **Formato**: `YYYYMMDDHHmmss_descricao.sql`
- **Localização**: `supabase/migrations/`
- **SQL**: Sempre em lowercase
- **Comentários**: Abundantes, especialmente em operações destrutivas
- **Idempotência**: Usar `IF EXISTS`, `IF NOT EXISTS`

### 7.5. Views e Funções

#### Views Materializadas

```sql
-- View unificada de acervo (1º e 2º grau)
CREATE OR REPLACE VIEW public.acervo_unificado_view AS
SELECT
  id,
  numero_processo,
  tribunal_id,
  grau,
  classe_judicial,
  orgao_julgador,
  -- ...
FROM public.acervo_geral
WHERE ativo = true
UNION ALL
SELECT
  id,
  numero_processo,
  tribunal_id,
  grau,
  -- ...
FROM public.acervo_segundo_grau
WHERE ativo = true;
```

#### Funções de Banco

```sql
-- Função helper para obter ID do usuário
CREATE OR REPLACE FUNCTION public.get_usuario_id_from_auth()
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.usuarios
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;
```

### 7.6. Cache com Redis

#### Estratégias de Cache

```typescript
// backend/utils/cache/redis-cache.ts
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Cache de permissões (5 minutos)
export async function cachePermissoes(
  usuarioId: number,
  permissoes: Permissao[]
) {
  await redis.setex(
    `permissoes:${usuarioId}`,
    300, // 5 minutos
    JSON.stringify(permissoes)
  );
}

// Lock distribuído (para evitar capturas duplicadas)
export async function acquireLock(key: string, ttl: number): Promise<boolean> {
  const result = await redis.set(
    `lock:${key}`,
    "locked",
    "EX",
    ttl,
    "NX" // Só cria se não existir
  );
  return result === "OK";
}
```

---

## 8. Autenticação e Segurança

### 8.1. Autenticação Multi-Camada

O Sinesys implementa **três métodos de autenticação** para diferentes contextos:

```
┌─────────────────────────────────────────────────────────────┐
│                  MÉTODOS DE AUTENTICAÇÃO                    │
├─────────────────────────────────────────────────────────────┤
│ 1. Session Cookie (sb-access-token)                         │
│    ↳ Usuários no frontend (navegador)                       │
│    ↳ Supabase Auth gerencia sessão automaticamente          │
├─────────────────────────────────────────────────────────────┤
│ 2. Bearer Token (JWT)                                        │
│    ↳ APIs externas, integrações, mobile                     │
│    ↳ Header: Authorization: Bearer <token>                  │
├─────────────────────────────────────────────────────────────┤
│ 3. Service API Key                                           │
│    ↳ Scripts automatizados, jobs agendados                  │
│    ↳ Header: x-service-api-key: <key>                       │
└─────────────────────────────────────────────────────────────┘
```

#### Implementação

```typescript
// backend/auth/api-auth.ts
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthResult> {
  // 1. Service API Key (prioridade mais alta)
  const serviceApiKey = request.headers.get("x-service-api-key");
  if (serviceApiKey === process.env.SERVICE_API_KEY) {
    return {
      authenticated: true,
      userId: "system",
      source: "service",
    };
  }

  // 2. Bearer Token (JWT)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      return {
        authenticated: true,
        userId: data.user.id,
        source: "bearer",
      };
    }
  }

  // 3. Session Cookie (frontend)
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    return {
      authenticated: true,
      userId: data.user.id,
      source: "session",
    };
  }

  return { authenticated: false };
}
```

### 8.2. Sistema de Permissões Granulares

#### Estrutura de Permissões

O sistema implementa **81 permissões granulares** organizadas por recurso e operação:

```sql
-- Tabela de permissões
CREATE TABLE public.permissoes (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES public.usuarios(id),
  recurso VARCHAR(50) NOT NULL,      -- ex: 'acervo', 'clientes', 'audiencias'
  operacao VARCHAR(20) NOT NULL,     -- ex: 'visualizar', 'criar', 'editar', 'deletar'
  permitido BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX idx_permissoes_usuario_recurso_operacao
  ON public.permissoes(usuario_id, recurso, operacao);
```

#### Verificação de Permissões

```typescript
// backend/auth/permissions.ts
export async function checkPermission(
  usuarioId: number,
  recurso: string,
  operacao: string
): Promise<boolean> {
  // 1. Verificar cache
  const cacheKey = `permissao:${usuarioId}:${recurso}:${operacao}`;
  const cached = await redis.get(cacheKey);
  if (cached !== null) {
    return cached === "true";
  }

  // 2. Verificar se é super admin
  const usuario = await buscarUsuarioPorId(usuarioId);
  if (usuario?.is_super_admin) {
    await redis.setex(cacheKey, 300, "true");
    return true;
  }

  // 3. Consultar permissão específica
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("permissoes")
    .select("permitido")
    .eq("usuario_id", usuarioId)
    .eq("recurso", recurso)
    .eq("operacao", operacao)
    .single();

  const permitido = data?.permitido ?? false;
  await redis.setex(cacheKey, 300, permitido ? "true" : "false");

  return permitido;
}
```

#### Uso nas APIs

```typescript
// app/api/clientes/route.ts
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Verificar permissão
  const temPermissao = await checkPermission(
    auth.usuarioId!,
    "clientes",
    "criar"
  );

  if (!temPermissao) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // Prosseguir com a criação...
}
```

### 8.3. Segurança de Dados

#### Criptografia

- **Em Trânsito**: HTTPS/TLS 1.3
- **Em Repouso**: AES-256 (Supabase)
- **Credenciais**: Criptografadas no banco (algoritmo AES)

#### Proteções Implementadas

| Proteção          | Implementação                        |
| ----------------- | ------------------------------------ |
| **CSRF**          | Tokens CSRF em formulários           |
| **XSS**           | Sanitização de HTML (DOMPurify)      |
| **SQL Injection** | Prepared statements (Supabase)       |
| **Rate Limiting** | Middleware do Next.js                |
| **Audit Log**     | Triggers no banco (`logs_alteracao`) |

---

## 9. API e Integração

### 9.1. Documentação da API (Swagger)

A documentação interativa da API está disponível em:

**URL**: `http://localhost:3000/docs` (desenvolvimento)

#### Geração Automática

A documentação é gerada automaticamente via **swagger-jsdoc** a partir de anotações JSDoc:

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
 *       - name: busca
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
export async function GET(request: NextRequest) {
  // ...
}
```

### 9.2. Formato de Resposta Padronizado

Todas as APIs seguem o mesmo formato:

#### Sucesso

```json
{
  "success": true,
  "data": {
    // Dados retornados
  }
}
```

#### Erro

```json
{
  "success": false,
  "error": "Mensagem de erro descritiva"
}
```

### 9.3. Integração com PJE/TRT

O Sinesys integra com o sistema PJE/TRT para captura automatizada de dados processuais.

#### Fluxo de Captura

```mermaid
sequenceDiagram
    participant Script as "Script de Captura"
    participant API as "API Sinesys"
    participant Auth as "Serviço de Autenticação"
    participant PJE as "PJE/TRT"
    participant DB as "Banco de Dados"

    Script->>API: POST /api/captura/start
    API->>Auth: Descriptografar credenciais
    Auth->>PJE: Login SSO gov.br
    PJE-->>Auth: Redirecionar para 2FA
    Auth->>2FAuth: Obter OTP
    2FAuth-->>Auth: Código OTP
    Auth->>PJE: Submeter OTP
    PJE-->>Auth: Tokens (JWT)
    Auth->>PJE: Buscar dados (API)
    PJE-->>Auth: Dados processuais
    Auth->>DB: Salvar com auditoria
    DB-->>API: Confirmação
    API-->>Script: Status da captura
```

#### Componentes de Captura

```
backend/captura/
├── services/
│   ├── trt/
│   │   ├── trt-auth.service.ts        # Autenticação no PJE
│   │   ├── trt-capture.service.ts     # Orquestração
│   │   ├── acervo-geral.service.ts    # Captura de processos
│   │   ├── audiencias.service.ts      # Captura de audiências
│   │   └── pendentes.service.ts       # Captura de pendentes
│   └── persistence/
│       ├── acervo-persistence.service.ts
│       ├── audiencias-persistence.service.ts
│       └── pendentes-persistence.service.ts
└── types/
    └── trt-types.ts
```

### 9.4. MCP Server (Model Context Protocol)

O Sinesys possui um **MCP Server separado** com **52 tools** organizadas em 10 categorias:

**Repositório**: `sinesys-mcp-server` (separado)

**Categorias**:

1. Health & Info (2 tools)
2. Acervo/Processos (8 tools)
3. Audiências (6 tools)
4. Expedientes (7 tools)
5. Obrigações Financeiras (6 tools)
6. Captura de Dados (5 tools)
7. Clientes e Contratos (8 tools)
8. Usuários (4 tools)
9. Dashboard (2 tools)
10. Assistentes IA (4 tools)

---

## 10. Módulos Funcionais

### 10.1. Visão Geral dos Módulos

```
app/(dashboard)/
├── dashboard/                # Dashboard principal
├── processos/                # Gestão de processos
├── audiencias/               # Gestão de audiências
├── expedientes/              # Gestão de expedientes
├── acordos-condenacoes/      # Obrigações financeiras
├── contratos/                # Gestão de contratos
├── partes/                   # Clientes e partes contrárias
│   ├── clientes/
│   └── partes-contrarias/
├── usuarios/                 # Gestão de usuários
├── captura/                  # Captura de dados PJE/TRT
├── financeiro/               # Módulo financeiro completo
│   ├── plano-contas/
│   ├── lancamentos/
│   ├── conciliacao/
│   └── relatorios/
├── rh/                       # Recursos humanos
│   └── salarios/
├── documentos/               # Editor de documentos
├── assinatura-digital/       # Assinatura digital
├── assistentes/              # Assistentes IA
├── chat/                     # Chat interno
└── comunica-cnj/             # Integração CNJ
```

### 10.2. Módulo de Processos (Acervo)

#### Funcionalidades

- Listagem unificada (1º e 2º grau)
- Visualização de timeline
- Atribuição de responsável
- Filtros avançados (tribunal, classe judicial, status)
- Paginação e ordenação
- Busca textual (número, partes, assunto)

#### Arquivos Principais

```
app/(dashboard)/processos/
├── page.tsx                  # Listagem de processos
├── [id]/
│   ├── page.tsx              # Detalhes do processo
│   └── timeline/
│       └── page.tsx          # Timeline de movimentações
└── components/
    ├── processos-table.tsx
    ├── processo-filters.tsx
    └── timeline-view.tsx
```

### 10.3. Módulo de Audiências

#### Funcionalidades

- Visualizações: Semana, Mês, Lista
- Calendário interativo
- Observações e anotações
- Filtros por período, tipo, responsável
- Export para Excel
- Notificações de prazo

#### Arquivos Principais

```
app/(dashboard)/audiencias/
├── semana/
│   └── page.tsx              # Visualização semanal
├── mes/
│   └── page.tsx              # Visualização mensal
├── lista/
│   └── page.tsx              # Lista de audiências
└── components/
    ├── audiencia-calendar.tsx
    ├── audiencia-card.tsx
    └── audiencia-filters.tsx
```

### 10.4. Módulo de Expedientes

#### Funcionalidades

- Gerenciamento de prazos
- Workflow de baixa
- Status: Pendente, Em Andamento, Concluído
- Filtros por prazo, tipo, responsável
- Alertas de vencimento

#### Arquivos Principais

```
app/(dashboard)/expedientes/
├── lista/
│   └── page.tsx              # Lista de expedientes
├── semana/
│   └── page.tsx              # Visualização semanal
└── components/
    ├── expediente-card.tsx
    ├── baixa-expediente-dialog.tsx
    └── expediente-filters.tsx
```

### 10.5. Módulo de Obrigações Financeiras

#### Funcionalidades

- Acordos e condenações
- Parcelamento
- Repasses para clientes
- Declaração de valores
- Controle de pagamento

#### Arquivos Principais

```
app/(dashboard)/acordos-condenacoes/
├── lista/
│   └── page.tsx              # Lista de obrigações
├── [id]/
│   └── page.tsx              # Detalhes da obrigação
└── components/
    ├── obrigacoes-table.tsx
    ├── parcelas-table.tsx
    ├── repasse-dialog.tsx
    └── obrigacoes-filters.tsx
```

### 10.6. Módulo Financeiro

#### Funcionalidades Completas

- **Plano de Contas**: Hierárquico com categorias
- **Lançamentos**: Receitas e despesas
- **Conciliação Bancária**: Integração OFX
- **Centros de Custo**: Alocação de despesas
- **Orçamento**: Planejamento e acompanhamento
- **Relatórios**: DRE, Fluxo de Caixa, Balancete

#### Estrutura

```
app/(dashboard)/financeiro/
├── plano-contas/
├── lancamentos/
├── conciliacao/
├── centros-custo/
├── orcamento/
└── relatorios/
```

### 10.7. Módulo de Assinatura Digital

#### Funcionalidades

- Criação de formulários dinâmicos
- Templates PDF com campos mapeados
- Captura de assinatura manuscrita
- Geolocalização e foto
- URLs públicas (sem autenticação)
- Protocolo de finalização

#### Fluxo

1. Admin cria segmento e template
2. Admin mapeia campos no PDF
3. Admin cria formulário com schema JSON
4. Cliente acessa URL pública
5. Cliente preenche dados e assina
6. Sistema gera PDFs finais

---

## 11. Infraestrutura e Deploy

### 11.1. Containerização (Docker)

#### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Dependências
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build:prod

# Produção
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### Docker Compose

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SECRET_KEY=${SUPABASE_SECRET_KEY}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### 11.2. Deploy com Docker Swarm

#### Stack Configuration

```yaml
version: "3.8"

services:
  sinesys:
    image: registry.example.com/sinesys:latest
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.sinesys.rule=Host(`app.sinesys.com`)"
        - "traefik.http.services.sinesys.loadbalancer.server.port=3000"
    environment:
      - NODE_ENV=production
    networks:
      - traefik-public
      - internal

  traefik:
    image: traefik:v2.10
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/traefik.yml:ro
      - ./acme.json:/acme.json
    networks:
      - traefik-public

networks:
  traefik-public:
    external: true
  internal:
    driver: overlay
```

### 11.3. Variáveis de Ambiente

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SECRET_KEY=eyJhbGci...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...

# Service API Key
SERVICE_API_KEY=seu-secret-key-aqui

# Redis
REDIS_URL=redis://redis:6379

# MongoDB (opcional)
MONGODB_URI=mongodb://mongo:27017/sinesys

# Backblaze B2
B2_ENDPOINT=s3.us-west-002.backblazeb2.com
B2_KEY_ID=xxx
B2_APPLICATION_KEY=xxx
B2_BUCKET_NAME=sinesys-storage

# 2FAuth (para captura)
TWOFA_URL=https://2fauth.example.com
TWOFA_TOKEN=xxx

# Next.js
NEXT_PUBLIC_APP_URL=https://app.sinesys.com
```

### 11.4. Otimizações de Build

#### Next.js Config

```typescript
// next.config.ts
export default {
  output: "standalone", // Build otimizado para Docker
  productionBrowserSourceMaps: false, // Reduz 500MB no build
  experimental: {
    serverSourceMaps: false, // Reduz memória no servidor
    webpackMemoryOptimizations: true,
    webpackBuildWorker: true,
  },
  webpack: (config) => {
    config.parallelism = 1; // Reduz uso de memória
    return config;
  },
};
```

### 11.5. PWA (Progressive Web App)

#### Configuração

```typescript
// next.config.ts
import withPWA from "@ducanh2912/next-pwa";

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/api\/.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
})(nextConfig);
```

#### Manifest

```json
// public/manifest.json
{
  "name": "Sinesys - Gestão Jurídica",
  "short_name": "Sinesys",
  "description": "Sistema de Gestão Jurídica para Zattar Advogados",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 12. Fluxos de Dados

### 12.1. Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant M as Middleware
    participant S as Supabase Auth
    participant DB as PostgreSQL

    U->>F: Acessa /dashboard
    F->>M: Request interceptado
    M->>S: Verificar sessão
    S-->>M: Sessão inválida
    M->>F: Redirect para /auth/login
    U->>F: Preenche credenciais
    F->>S: Login (email, senha)
    S->>DB: Verificar credenciais
    DB-->>S: Usuário encontrado
    S-->>F: Token JWT + Cookie
    F->>F: Salvar cookie (sb-access-token)
    F->>M: Request para /dashboard
    M->>S: Verificar sessão
    S-->>M: Sessão válida
    M-->>F: Permitir acesso
    F-->>U: Renderizar Dashboard
```

### 12.2. Fluxo de Requisição API

```mermaid
sequenceDiagram
    participant C as Cliente
    participant A as API Route
    participant Auth as Autenticação
    participant Perm as Permissões
    participant Srv as Service
    participant Pers as Persistence
    participant DB as PostgreSQL

    C->>A: POST /api/clientes
    A->>Auth: authenticateRequest()
    Auth-->>A: { authenticated: true, usuarioId: 1 }
    A->>Perm: checkPermission(1, 'clientes', 'criar')
    Perm->>DB: SELECT FROM permissoes
    DB-->>Perm: { permitido: true }
    Perm-->>A: true
    A->>A: Validar entrada (Zod)
    A->>Srv: criarCliente(params)
    Srv->>Srv: Validações de negócio
    Srv->>Pers: criarClientePersistence()
    Pers->>DB: INSERT INTO clientes
    DB-->>Pers: Cliente criado
    Pers-->>Srv: Cliente
    Srv-->>A: Cliente
    A-->>C: { success: true, data: cliente }
```

### 12.3. Fluxo de Captura de Dados

```mermaid
sequenceDiagram
    participant Script as Script Agendado
    participant API as API /captura/start
    participant Auth as TRT Auth Service
    participant PJE as Sistema PJE/TRT
    participant Extr as Extração Service
    participant Pers as Persistence
    participant DB as PostgreSQL

    Script->>API: POST (tribunal, grau, credenciais)
    API->>Auth: autenticarPJE()
    Auth->>PJE: Login SSO gov.br
    PJE-->>Auth: Redirecionar 2FA
    Auth->>2FAuth: Obter código OTP
    2FAuth-->>Auth: Código
    Auth->>PJE: Submeter OTP
    PJE-->>Auth: access_token, xsrf_token
    Auth-->>API: { page, tokens, advogadoId }
    API->>Extr: extrairAcervoGeral()
    Extr->>PJE: GET /api/processos (paginado)
    PJE-->>Extr: Dados processos
    Extr->>Pers: salvarAcervo(processos)
    Pers->>DB: Comparar dados anteriores
    DB-->>Pers: Registros existentes
    Pers->>Pers: Detectar alterações
    Pers->>DB: INSERT/UPDATE com auditoria
    DB-->>Pers: Sucesso
    Pers-->>Extr: Resultados
    Extr-->>API: { processosCapturados, novos, atualizados }
    API-->>Script: Status da captura
```

### 12.4. Fluxo de Colaboração em Tempo Real

```mermaid
sequenceDiagram
    participant U1 as Usuário 1
    participant E1 as Editor (Browser 1)
    participant Yjs as Y.js (CRDT)
    participant Sup as Supabase Realtime
    participant E2 as Editor (Browser 2)
    participant U2 as Usuário 2

    U1->>E1: Digita texto
    E1->>Yjs: Aplicar operação local
    Yjs->>Yjs: Gerar delta (CRDT)
    Yjs->>Sup: Broadcast delta
    Sup->>E2: Enviar delta
    E2->>Yjs: Aplicar delta remoto
    Yjs->>E2: Atualizar documento
    E2-->>U2: Renderizar mudanças
```

---

## 13. Padrões e Boas Práticas

### 13.1. Convenções de Código

#### TypeScript

```typescript
// ✅ BOM: Tipos explícitos
const calcularTotal = (valores: number[]): number => {
  return valores.reduce((acc, val) => acc + val, 0);
};

// ❌ RUIM: Tipos implícitos
const calcularTotal = (valores) => {
  return valores.reduce((acc, val) => acc + val, 0);
};

// ✅ BOM: Interfaces para objetos
interface Usuario {
  id: number;
  nome: string;
  email: string;
}

// ❌ RUIM: Usar 'any'
const buscarUsuario = (id: any): any => {
  // ...
};
```

#### Nomenclatura

```typescript
// Componentes React: PascalCase
function UserAvatar({ user }: UserAvatarProps) {}

// Funções e variáveis: camelCase
const calcularDesconto = (valor: number) => {};
const isAtivo = true;

// Constantes: UPPER_SNAKE_CASE
const MAX_TENTATIVAS = 3;
const API_BASE_URL = "https://api.example.com";

// Handlers de eventos: prefixo 'handle'
const handleClick = () => {};
const handleSubmit = (data) => {};

// Tipos/Interfaces: PascalCase
type ClienteFormData = {};
interface ApiResponse {}
```

#### Organização de Imports

```typescript
// 1. React e bibliotecas externas
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

// 2. Componentes
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

// 3. Hooks
import { useViewport } from "@/hooks/use-viewport";

// 4. Utilitários e tipos
import { cn } from "@/lib/utils";
import type { Cliente } from "@/types/domain/cliente";

// 5. Estilos (se houver)
import styles from "./component.module.css";
```

### 13.2. Padrões de Componentes React

#### Estrutura de Componente

```typescript
"use client"; // Se necessário

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Cliente } from "@/types/domain/cliente";

// Props interface
interface ClienteCardProps {
  cliente: Cliente;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (id: number) => void;
}

// Componente
export function ClienteCard({ cliente, onEdit, onDelete }: ClienteCardProps) {
  // 1. Hooks
  const [isExpanded, setIsExpanded] = useState(false);

  // 2. Handlers
  const handleEdit = () => {
    onEdit?.(cliente);
  };

  const handleDelete = () => {
    if (confirm("Tem certeza?")) {
      onDelete?.(cliente.id);
    }
  };

  // 3. Render
  return (
    <div className="border rounded-lg p-4">
      <h3>{cliente.nome}</h3>
      <p>{cliente.cpf}</p>

      <div className="flex gap-2 mt-4">
        <Button onClick={handleEdit}>Editar</Button>
        <Button variant="destructive" onClick={handleDelete}>
          Deletar
        </Button>
      </div>
    </div>
  );
}
```

#### Server Components vs Client Components

```typescript
// ✅ Server Component (padrão no App Router)
// Pode fazer fetch de dados diretamente
async function ProcessosPage() {
  const processos = await fetch("/api/acervo").then((r) => r.json());

  return <ProcessosTable data={processos} />;
}

// ✅ Client Component (usa hooks, interatividade)
("use client");

function ProcessosTable({ data }: { data: Processo[] }) {
  const [filtro, setFiltro] = useState("");
  const [ordenacao, setOrdenacao] = useState("nome");

  return <Table>{/* ... */}</Table>;
}
```

### 13.3. Padrões de Banco de Dados

#### Nomenclatura de Tabelas

```sql
-- ✅ BOM: snake_case, plural para coleções
CREATE TABLE clientes (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ❌ RUIM: CamelCase ou singular
CREATE TABLE Cliente (
  Id INT PRIMARY KEY,
  Nome VARCHAR(255)
);
```

#### Políticas RLS

```sql
-- ✅ BOM: Políticas granulares por operação
CREATE POLICY "Service role pode ler clientes"
  ON public.clientes
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role pode inserir clientes"
  ON public.clientes
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ❌ RUIM: Política genérica
CREATE POLICY "Service role acesso total"
  ON public.clientes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

#### Índices

```sql
-- ✅ BOM: Índices em colunas de busca/filtro
CREATE INDEX idx_clientes_cpf ON public.clientes(cpf);
CREATE INDEX idx_clientes_nome_trgm ON public.clientes USING gin(nome gin_trgm_ops);
CREATE INDEX idx_processos_numero ON public.acervo_geral(numero_processo);

-- Índice composto para queries frequentes
CREATE INDEX idx_permissoes_lookup
  ON public.permissoes(usuario_id, recurso, operacao);
```

### 13.4. Tratamento de Erros

#### API Routes

```typescript
export async function POST(request: NextRequest) {
  try {
    // Lógica...
    return NextResponse.json({ success: true, data });
  } catch (error) {
    // Log estruturado
    console.error("Erro ao criar cliente:", {
      error: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Resposta genérica (não expor detalhes internos)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao processar requisição",
      },
      { status: 500 }
    );
  }
}
```

#### Frontend

```typescript
import { toast } from "sonner";

async function handleSubmit(data: FormData) {
  try {
    const response = await fetch("/api/clientes", {
      method: "POST",
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      toast.error(result.error || "Erro ao criar cliente");
      return;
    }

    toast.success("Cliente criado com sucesso!");
    router.push("/partes/clientes");
  } catch (error) {
    console.error(error);
    toast.error("Erro de conexão. Tente novamente.");
  }
}
```

### 13.5. Performance

#### Otimizações de Queries

```typescript
// ✅ BOM: Select específico + paginação
const { data } = await supabase
  .from("clientes")
  .select("id, nome, cpf, email") // Apenas campos necessários
  .range(0, 19) // Paginação
  .order("nome");

// ❌ RUIM: Select * sem paginação
const { data } = await supabase.from("clientes").select("*");
```

#### Memoização

```typescript
import { useMemo } from "react";

function ProcessosTable({ processos }: { processos: Processo[] }) {
  // ✅ BOM: Memoizar cálculos pesados
  const processosFiltrados = useMemo(() => {
    return processos
      .filter((p) => p.ativo)
      .sort((a, b) => a.numero_processo.localeCompare(b.numero_processo));
  }, [processos]);

  return <Table data={processosFiltrados} />;
}
```

#### Lazy Loading

```typescript
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ BOM: Lazy load de componentes pesados
const EditorDocumentos = lazy(() => import("@/components/documentos/editor"));

function DocumentosPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <EditorDocumentos />
    </Suspense>
  );
}
```

### 13.6. Segurança

#### Validação de Entrada

```typescript
import { z } from "zod";

// ✅ BOM: Validação com Zod
const clienteSchema = z.object({
  nome: z.string().min(3).max(255),
  cpf: z.string().regex(/^\d{11}$/),
  email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validar entrada
  const validacao = clienteSchema.safeParse(body);
  if (!validacao.success) {
    return NextResponse.json(
      { error: validacao.error.errors[0].message },
      { status: 400 }
    );
  }

  // Prosseguir...
}
```

#### Sanitização de HTML

```typescript
import DOMPurify from "dompurify";

// ✅ BOM: Sanitizar HTML do usuário
function DescricaoProcesso({ html }: { html: string }) {
  const htmlLimpo = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
    ALLOWED_ATTR: [],
  });

  return <div dangerouslySetInnerHTML={{ __html: htmlLimpo }} />;
}
```

---

## 14. Manutenção de Documentação

### 14.1. Manutenção Contínua

A documentação arquitetural deve ser mantida sincronizada com o código para garantir que o conhecimento permaneça atualizado e útil.

#### Quando Atualizar Documentação de Features

Sempre que uma feature em `src/features/{modulo}` ganhar novas capacidades importantes, atualize o `README.md` local da feature com:

- **Novos casos de uso**: Documente novos Server Actions, hooks ou serviços
- **Mudanças em regras de negócio**: Atualize exemplos e fluxos principais
- **Integrações críticas**: Documente dependências e integrações externas
- **Exemplos de uso**: Inclua exemplos práticos de uso via barrel export (`@/features/{modulo}`)

**Template de README de Feature:**

```markdown
# {Nome da Feature}

## 📁 Estrutura

[Estrutura de diretórios]

## 🎯 Funcionalidades

[Funcionalidades principais]

## 🔧 Server Actions

[Documentação de actions com exemplos]

## 🪝 Hooks

[Documentação de hooks]

## 🎨 Componentes

[Documentação de componentes]

## 🔄 Migração

[Se aplicável, histórico de migração]

## 📝 Uso em Páginas

[Exemplos de uso]
```

#### Quando Atualizar Documentação Central

Revise `AGENTS.md` e `docs/arquitetura-sistema.md` quando houver:

- **Mudanças estruturais** que afetem várias features:
  - Novo padrão de Server Actions
  - Mudança de camada de infraestrutura em `src/lib`
  - Alteração significativa de layout ou componentes compartilhados
- **Novos padrões arquiteturais**:
  - Nova estratégia de estado global
  - Novo padrão de autenticação/autorização
  - Mudanças em convenções de nomenclatura

#### Checklist de Revisão de PR

Para alterações maiores, exija que o PR contenha:

- [ ] Atualizações correspondentes nos READMEs de feature (se aplicável)
- [ ] Atualizações nos docs centrais (`AGENTS.md`, `docs/arquitetura-sistema.md`) se houver mudanças estruturais
- [ ] Exemplos de uso atualizados
- [ ] Documentação de breaking changes (se houver)

### 14.2. Prevenção de Regressão Arquitetural

Para manter a arquitetura estabilizada, o projeto implementa verificações automáticas e manuais.

#### Regras ESLint

O projeto possui regras ESLint que impedem:

- **Imports diretos de caminhos internos de features**: Força uso de barrel exports (`@/features/{modulo}`)
- **Imports de pastas legadas**: Alerta caso alguém tente reintroduzir imports de `@/backend`, `@/core` ou `@/app/_lib` em arquivos de `src/`

**Exemplos de imports proibidos:**

```typescript
// ❌ PROIBIDO - Import direto de caminho interno
import { ClientesTable } from "@/features/partes/components/clientes/clientes-table";

// ✅ CORRETO - Import via barrel export
import { ClientesTable } from "@/features/partes";

// ❌ PROIBIDO - Import de pasta legada
import { criarCliente } from "@/backend/clientes/services/clientes/criar-cliente.service";

// ✅ CORRETO - Import via feature
import { actionCriarCliente } from "@/features/partes";
```

#### Verificação no CI

O pipeline de CI inclui uma checagem que falha o build se encontrar:

- Novos imports de pastas legadas (`@/backend`, `@/core`, `@/app/_lib`) em `src/**/*.ts*`
- Imports diretos de caminhos internos de features fora da própria feature

Execute localmente:

```bash
npm run check:architecture
```

#### Checklist de Revisão de Código

Nas revisões de código, verifique:

- [ ] **Nova lógica de negócio** está em `src/features/{modulo}` e não em `backend/` ou `app/_lib/`
- [ ] **Novos componentes visuais reutilizáveis** foram avaliados para viver em `components/ui` ou `components/shared`
- [ ] **Imports** usam barrel exports (`@/features/{modulo}`) e não caminhos diretos
- [ ] **Server Actions** seguem o padrão `action{Verbo}` e estão em `features/{modulo}/actions/`
- [ ] **Hooks customizados** estão em `features/{modulo}/hooks/` quando específicos da feature
- [ ] **Tipos e schemas** estão em `features/{modulo}/domain.ts` ou `types.ts`

## Conclusão

O **Sinesys** é um sistema robusto e escalável que combina as melhores práticas de desenvolvimento moderno:

✅ **Arquitetura em Camadas**: Separação clara de responsabilidades  
✅ **Type-Safety**: TypeScript em todo o stack  
✅ **Segurança**: RLS, autenticação multi-camada, permissões granulares  
✅ **Performance**: Caching, lazy loading, otimização de queries  
✅ **Escalabilidade**: Containerização, microserviços, deploy automatizado  
✅ **UX**: Responsive design, PWA, colaboração em tempo real  
✅ **DX**: Documentação completa, padrões claros, ferramentas modernas  
✅ **Manutenibilidade**: Documentação sincronizada, verificações automáticas

### Próximos Passos

1. **Monitoramento**: Implementar APM (Application Performance Monitoring)
2. **Testes**: Ampliar cobertura de testes (unit, integration, e2e)
3. **CI/CD**: Automatizar pipeline completo de deploy
4. **Observabilidade**: Logs estruturados, métricas, alertas
5. **Documentação**: Manter docs atualizadas conforme evolução (processo estabelecido)

---

**Documento mantido por**: Equipe de Desenvolvimento Sinesys  
**Última atualização**: Dezembro 2025  
**Versão**: 1.1
