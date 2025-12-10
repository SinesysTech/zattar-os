# Sinesys - Sistema de Gestão Jurídica

![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)
![Redis](https://img.shields.io/badge/Redis-Cache-red?style=flat&logo=redis)
![MongoDB](https://img.shields.io/badge/MongoDB-NoSQL-green?style=flat&logo=mongodb)

**Desenvolvido por:** Sinesys  
**Cliente:** Zattar Advogados  
**Licença:** Em definição (será publicado como Open Source)

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
  - [Organização de Tipos no Sinesys](#organização-de-tipos-no-sinesys)
  - [Princípios de Domain-Driven Design (DDD) no Sinesys](#princípios-de-domain-driven-design-ddd-no-sinesys)
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

### Arquitetura Orientada a Features (Feature-Sliced Design)

O Sinesys adota uma **Arquitetura Orientada a Features** inspirada no **Feature-Sliced Design (FSD)**, otimizada para o Next.js App Router. Esta estrutura modular abandona a arquitetura simples de "páginas" e organiza o código por funcionalidades completas de negócio.

**Princípios da Arquitetura:**

- **Colocação (Colocation)**: Todo código relacionado a uma funcionalidade vive junto
- **Isolamento**: Features são independentes e auto-contidas
- **Escalabilidade**: Estrutura previsível facilita crescimento do sistema
- **Manutenibilidade**: Mudanças em uma feature não afetam outras

```
┌─────────────────────────────────────────────┐
│       Camada de Apresentação (app/)         │
│  - Páginas Next.js (apenas roteamento)     │
│  - Layouts e shells                         │
│  - Data fetching server-side                │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│      Features (src/features/{modulo}/)      │
│  - components/  → UI específica             │
│  - hooks/       → Lógica de estado          │
│  - actions/     → Server Actions            │
│  - service.ts   → Casos de uso              │
│  - repository.ts → Acesso a dados           │
│  - domain.ts    → Regras de negócio         │
│  - types.ts     → Tipagem específica        │
│  - utils.ts     → Utilitários               │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│     Camadas Compartilhadas (Shared)         │
│  components/ui/      → Componentes base     │
│  components/shared/  → Padrões reutilizáveis│
│  lib/                → Bibliotecas          │
│  hooks/              → Hooks globais        │
└─────────────────────────────────────────────┘
```

#### Responsabilidades por Camada

**Camada de Apresentação** (`app/(dashboard)/`)

- Define rotas e navegação
- Realiza data fetching server-side (quando necessário)
- Renderiza layouts e shells de página
- **NÃO contém lógica de negócio** - apenas composição

**Feature Modules** (`src/features/{modulo}/`)

- **components/**: Componentes React específicos da feature
- **hooks/**: Hooks customizados para gerenciar estado da feature
- **actions.ts**: Server Actions do Next.js 16
- **service.ts**: Casos de uso e lógica de negócio
- **repository.ts**: Acesso ao banco de dados (Supabase)
- **domain.ts**: Entidades, Value Objects e regras puras
- **types.ts**: Tipagem TypeScript específica
- **utils.ts**: Funções auxiliares (formatação, validação)
- **index.ts**: Barrel export para facilitar imports

**Camada Compartilhada** (`components/`, `lib/`, `hooks/`)

- Componentes UI reutilizáveis (shadcn/ui)
- Padrões de design (DataTableShell, PageShell)
- Hooks globais (useViewport, useDebounce)
- Utilitários gerais (formatação de datas, números)
- Clientes de infraestrutura (Supabase, Redis, MongoDB)

### Fluxo de Dados

```mermaid
graph TB
    A[Usuário] --> B[Componente React]
    B --> C{Tipo de Ação}
    C -->|Client-Side| D[Hook]
    C -->|Server-Side| E[Server Action]
    D --> F[API Route]
    E --> G[Service Layer]
    F --> G
    G --> H[Repository Layer]
    H --> I[(PostgreSQL)]
    H --> J[(Redis Cache)]
    I --> H
    J --> H
    H --> G
    G --> E
    G --> F
    F --> D
    E --> B
    D --> B
    B --> A
```

# Organização de Tipos no Sinesys

## 1. Visão Geral

A organização dos tipos no projeto Sinesys segue princípios de Domain-Driven Design (DDD) para garantir clareza, coesão e baixo acoplamento entre as diferentes camadas da aplicação (frontend, backend, domínio). O objetivo é centralizar os tipos de domínio e contratos de aplicação em um local compartilhado, enquanto mantém tipos específicos de infraestrutura e interface em suas respectivas camadas.

Essa estrutura promove:

- **Reutilização**: Tipos de domínio e contratos podem ser usados em todo o projeto sem duplicação.
- **Coerência**: Uma única fonte de verdade para a definição das estruturas de dados do negócio.
- **Separação de Preocupações**: Claramente distingue entre o que é o "negócio" (domínio), o "como o negócio é usado" (contratos/aplicação) e o "como o negócio é implementado" (infraestrutura/interface).
- **Manutenção Simplificada**: Alterações em tipos centrais refletem-se de forma controlada nas camadas dependentes.

## 2. Estrutura de Pastas

A nova estrutura de tipos compartilhados reside na pasta `/types` na raiz do projeto, organizada da seguinte forma:

```
/types
├── domain/        # Tipos da camada de Domínio (DDD)
│   ├── common.ts  # Tipos genéricos como Paginacao, TipoPessoa, GrauProcesso
│   ├── acervo.ts  # Entidades e Value Objects do domínio de Acervo
│   ├── audiencias.ts # Entidades e Value Objects do domínio de Audiências
│   ├── partes.ts  # Entidades e Value Objects para Cliente, ParteContraria, Terceiro
│   ├── enderecos.ts # Entidades e Value Objects para Endereços
│   ├── processo-partes.ts # Entidades e Value Objects para ProcessoPartes
│   ├── processo-relacionado.ts # Tipos para processos relacionados
│   └── index.ts   # Exporta todos os tipos de domínio
├── contracts/     # Tipos da camada de Aplicação (DDD)
│   ├── acervo.ts  # DTOs e interfaces de serviço para Acervo
│   ├── audiencias.ts # DTOs e interfaces de serviço para Audiências
│   ├── partes.ts  # DTOs e interfaces de serviço para Cliente, ParteContraria, Terceiro
│   ├── enderecos.ts # DTOs e interfaces de serviço para Endereços
│   ├── processo-partes.ts # DTOs e interfaces de serviço para ProcessoPartes
│   └── index.ts   # Exporta todos os tipos de contratos
└── index.ts       # Exporta todos os tipos de domínio e contratos para acesso simplificado
```

### Detalhamento das Subpastas:

- **`/types/domain`**:

  - Contém as definições mais puras do modelo de domínio.
  - Inclui Entidades, Value Objects, e Enums que representam conceitos centrais do negócio.
  - São agnósticos a qualquer tecnologia (banco de dados, framework web, etc.).
  - _Exemplos_: `Acervo`, `Cliente`, `Endereco`, `TipoPessoa`, `GrauProcesso`.

- **`/types/contracts`**:
  - Contém os Data Transfer Objects (DTOs) e interfaces de comunicação entre camadas ou serviços.
  - Define a "linguagem" pela qual a camada de aplicação interage com o domínio ou com outros serviços.
  - Inclui parâmetros de entrada para operações (e.g., `CriarClienteParams`), resultados de operações (e.g., `ListarClientesResult`), e estruturas para ordenação e filtragem.
  - _Exemplos_: `ListarAcervoParams`, `CriarAudienciaParams`.

### Outras Camadas de Tipos:

- **`backend/types/`**:

  - Após a refatoração, esta pasta deve conter apenas tipos que são estritamente específicos da infraestrutura ou de integrações de baixo nível do backend.
  - _Exemplos_: Tipos de integração com APIs externas (PJE-TRT), tipos de esquemas de banco de dados (MongoDB), configurações de ambiente específicas do servidor.

- **`app/_lib/types/`**:
  - Contém tipos específicos da camada de apresentação (frontend/UI).
  - Inclui:
    - `*ApiResponse`: Respostas padronizadas de APIs para o frontend.
    - `*Filters`: Interfaces para o estado de filtros da UI.
    - `*FormData`: Tipos para dados de formulários na UI.
    - Funções utilitárias de formatação e validação específicas da UI.
  - Estes tipos importam e utilizam os tipos de `/types/domain` e `/types/contracts`, adaptando-os para as necessidades da interface do usuário.

## 3. Convenções de Nomenclatura

- **Arquivos de Domínio**: Nome do conceito em `kebab-case.ts` (e.g., `acervo.ts`, `processo-partes.ts`).
- **Arquivos de Contratos**: Nome do conceito em `kebab-case.ts` (e.g., `acervo.ts`, `partes.ts`).
- **Interfaces/Tipos de Domínio**: `PascalCase` para entidades e value objects (e.g., `Cliente`, `Endereco`).
- **Interfaces/Tipos de Contratos**:
  - Parâmetros de entrada: `AcaoConceitoParams` (e.g., `CriarClienteParams`, `ListarAcervoParams`).
  - Resultados: `AcaoConceitoResult` (e.g., `ListarClientesResult`).
  - Ordenação: `OrdenarPorConceito`, `OrdemConceito`.
- **Interfaces/Tipos de Frontend**:
  - Respostas de API: `ConceitoApiResponse` (e.g., `ClientesApiResponse`).
  - Filtros: `ConceitoFilters` (e.g., `ProcessosFilters`).
  - Dados de formulário: `ConceitoFormData` (e.g., `ClienteFormData`).

## 4. Guia de Uso

- **Importar Tipos de Domínio**: Use `@/types/domain` para importar entidades, VOs e enums que representam o coração do seu negócio.
  ```typescript
  import type { Cliente, GrauProcesso } from "@/types/domain";
  // ou mais específico
  import type { Cliente } from "@/types/domain/partes";
  import type { GrauProcesso } from "@/types/domain/common";
  ```
- **Importar Contratos/DTOs**: Use `@/types/contracts` para interagir com as interfaces de serviço.
  ```typescript
  import type {
    ListarClientesParams,
    CriarAudienciaParams,
  } from "@/types/contracts";
  // ou mais específico
  import type { ListarClientesParams } from "@/types/contracts/partes";
  ```
- **Frontend-specific Types**: Use `app/_lib/types` apenas para tipos que são exclusivos da camada de apresentação e que não fariam sentido existirem no backend.
- **Evitar Ciclagem**: Garanta que as camadas superiores (Application/UI) importem de camadas inferiores (Domain), mas nunca o contrário.

## 5. Migração

- Todos os tipos que eram compartilhados entre frontend e backend, ou que representavam o domínio puro, foram movidos de `backend/types` para a nova estrutura `/types`.
- As pastas `backend/types/acervo`, `backend/types/audiencias`, `backend/types/partes` (e seus subarquivos) e `backend/types/global.ts` foram removidas ou esvaziadas.
- Módulos que referenciavam os tipos antigos devem atualizar seus imports para `@{/types/domain}` ou `@{/types/contracts}`.
- O `tsconfig.json` foi atualizado com aliases de caminho (`paths`) para facilitar esses imports.

# Princípios de Domain-Driven Design (DDD) no Sinesys

## 1. Visão Geral do Domain-Driven Design

Domain-Driven Design (DDD) é uma abordagem de desenvolvimento de software que foca na modelagem de um domínio de negócio complexo, conectando a implementação à um modelo em constante evolução. No Sinesys, a aplicação dos princípios de DDD visa criar um sistema que reflita de forma clara e precisa a lógica de negócio do escritório de advocacia Zattar Advogados, facilitando a comunicação entre especialistas de domínio e desenvolvedores, e promovendo uma arquitetura flexível e manutenível.

### Conceitos Fundamentais de DDD:

- **Domínio (Domain)**: A esfera de conhecimento, influência ou atividade para a qual a aplicação está sendo desenvolvida.
- **Modelo de Domínio (Domain Model)**: Uma representação abstrata do conhecimento do domínio, encapsulando dados e comportamento.
- **Linguagem Ubíqua (Ubiquitous Language)**: Uma linguagem comum e precisa, construída em conjunto por especialistas de domínio e desenvolvedores, e usada consistentemente em todo o projeto (código, documentação, conversas).
- **Contextos Delimitados (Bounded Contexts)**: Limites explícitos dentro dos quais um modelo de domínio específico é definido e aplicável. Cada contexto pode ter sua própria Linguagem Ubíqua e seu próprio modelo.
- **Camadas (Layers)**: A arquitetura do sistema é dividida em camadas, cada uma com responsabilidades específicas.

## 2. Camadas da Arquitetura e Aplicação no Sinesys

O Sinesys adota uma arquitetura em camadas para organizar o código, separando responsabilidades e promovendo a modularidade.

### 2.1. Camada de Domínio (Domain Layer)

Esta é a camada central, que contém a lógica de negócio e o modelo de domínio puro. É o coração da aplicação, independente das tecnologias de banco de dados, frameworks UI ou detalhes de infraestrutura.

- **Responsabilidades**:

  - Representar conceitos de negócio, regras e comportamentos.
  - Ser a "verdade" sobre o negócio.
  - Validar regras de negócio intrínsecas ao domínio.

- **Componentes Principais**:

  - **Entidades (Entities)**: Objetos que possuem uma identidade e um ciclo de vida. São mutáveis e identificados por um ID.
    - _Exemplos no Sinesys_: `Cliente`, `Acervo`, `Audiencia`, `Usuario`.
  - **Value Objects**: Objetos que descrevem aspectos do domínio, mas não possuem identidade própria. São imutáveis e comparados por seus valores.
    - _Exemplos no Sinesys_: `Endereco` (quando tratado como um bloco de valores, embora possa ser entidade em outros contextos), `NumeroProcesso`, `CpfCnpj`.
  - **Agregados (Aggregates)**: Agrupamento de Entidades e Value Objects tratados como uma única unidade transacional. Um Aggregate Root (Raiz do Agregado) garante a consistência do agregado.
    - _Exemplos no Sinesys_: Um `Processo` (Acervo) pode ser um Aggregate Root, com `Partes` e `Documentos` como parte do seu agregado.
  - **Serviços de Domínio (Domain Services)**: Operações de negócio que não se encaixam naturalmente em uma Entidade ou Value Object. Orquestram Entidades e Value Objects.
    - _Exemplos no Sinesys_: `GerenciamentoDePartesEmProcesso`, `CalculoDePrazos`.
  - **Eventos de Domínio (Domain Events)**: Notificações de algo significativo que aconteceu no domínio.
    - _Exemplos no Sinesys_: `ProcessoCapturado`, `AudienciaDesignada`.

- **Localização no Projeto**: `types/domain/` para as definições de tipos, e `backend/{modulo}/domain/` para as implementações da lógica de domínio quando aplicável.

### 2.2. Camada de Aplicação (Application Layer)

Orquestra a camada de domínio para realizar casos de uso específicos da aplicação. Não contém lógica de negócio diretamente, mas coordena Entidades e Serviços de Domínio para executar tarefas.

- **Responsabilidades**:

  - Definir os casos de uso da aplicação.
  - Transações e segurança.
  - Transformar DTOs em objetos de domínio e vice-versa.
  - Gerenciar o ciclo de vida dos objetos de domínio.

- **Componentes Principais**:

  - **Serviços de Aplicação (Application Services)**: Classes que implementam os casos de uso. Recebem DTOs como entrada, utilizam Repositórios para carregar Entidades, invocam a lógica de domínio e retornam DTOs.
    - _Exemplos no Sinesys_: `CriarClienteService`, `ListarAcervoService`, `AgendarCapturaService`.
  - **DTOs (Data Transfer Objects)**: Objetos simples, sem comportamento, usados para transferir dados entre as camadas de apresentação, aplicação e domínio.
    - _Exemplos no Sinesys_: `CriarClienteParams`, `ListarAcervoResult`.

- **Localização no Projeto**: `types/contracts/` para as definições de tipos (DTOs), e `backend/{modulo}/services/` para as implementações dos Application Services.

### 2.3. Camada de Infraestrutura (Infrastructure Layer)

Fornece a base técnica para a aplicação, lidando com aspectos como persistência de dados, comunicação externa, logging, etc. É a camada mais externa, dependendo das camadas de Domínio e Aplicação.

- **Responsabilidades**:

  - Implementar repositórios (acesso a dados).
  - Interagir com sistemas externos (APIs, serviços de terceiros).
  - Configuração e inicialização da aplicação.
  - Detalhes técnicos como ORMs, bibliotecas HTTP, etc.

- **Componentes Principais**:

  - **Repositórios (Repositories)**: Abstraem os detalhes de persistência de dados. A interface do Repositório (contrato) reside na camada de Domínio ou Aplicação, enquanto a implementação está na Infraestrutura.
    - _Exemplos no Sinesys_: `ClientePersistenceService` (implementa a interface `IClienteRepository`), `AcervoPersistenceService`.
  - **Serviços de Integração**: Implementam a comunicação com APIs externas ou outros microsserviços.
    - _Exemplos no Sinesys_: `PjeTrtApiService`, `SupabaseAuthService`.

- **Localização no Projeto**: `backend/persistence/`, `backend/api/`, `backend/utils/` e a camada de API do Next.js (`app/api/`).

### 2.4. Camada de Apresentação (Presentation Layer) / Interface do Usuário

A camada mais externa, responsável por exibir informações ao usuário e interpretar seus comandos. No Sinesys, esta é a interface web construída com Next.js e React.

- **Responsabilidades**:

  - Converter DTOs em um formato exibível para o usuário.
  - Capturar entradas do usuário e traduzi-las em comandos para a camada de Aplicação.
  - Gerenciar o estado da UI.

- **Componentes Principais**:
  - **Controladores/Rotas de API (Next.js API Routes)**: Atuam como interfaces entre o frontend e a camada de aplicação do backend.
    - _Exemplos no Sinesys_: `app/api/clientes/route.ts` que utiliza `CriarClienteService`.
  - **Componentes de UI (React Components)**: Renderizam a interface.
    - _Exemplos no Sinesys_: Componentes em `app/(dashboard)/` e `components/`.
  - **Tipos de UI/Forms**: Tipos específicos para gerenciar o estado e os dados de formulários na interface.
    - _Exemplos no Sinesys_: `ClienteFormData`, `ProcessosFilters` em `app/_lib/types/`.

## 3. Boas Práticas e Padrões Adotados

- **Injeção de Dependência**: Serviços e Repositórios são gerenciados e injetados, promovendo baixo acoplamento.
- **Validações**: Regras de validação são aplicadas na camada apropriada (domínio para regras de negócio intrínsecas, aplicação para DTOs e requisitos de caso de uso, apresentação para formatação de entrada).
- **Testes**: A arquitetura em camadas facilita o teste unitário de cada camada isoladamente, especialmente a camada de Domínio e Aplicação.
- **Linguagem Ubíqua Consistente**: Esforço contínuo para garantir que os nomes de tipos, variáveis, funções e nomes de arquivos reflitam a Linguagem Ubíqua do domínio, conforme definido com os especialistas jurídicos.

Ao seguir esses princípios e padrões, o projeto Sinesys busca ser robusto, escalável e alinhado com as necessidades de negócio da Zattar Advogados.

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

## 🌐 Progressive Web App (PWA)

O Sinesys é um Progressive Web App que pode ser instalado em dispositivos móveis e desktop.

### Funcionalidades PWA

- ✅ Instalável em dispositivos móveis e desktop
- ✅ Funciona offline com página de fallback
- ✅ Cache inteligente de recursos estáticos
- ✅ Ícones otimizados para todas as plataformas
- ✅ Suporte a tema claro/escuro
- ✅ Atualizações automáticas do service worker

### Instalação

Os usuários podem instalar o app:

- **Android/Chrome**: Clique no banner de instalação ou menu > "Instalar app"
- **iOS/Safari**: Toque em Compartilhar > "Adicionar à Tela de Início"
- **Desktop**: Clique no ícone de instalação na barra de endereços

### Desenvolvimento

Em modo de desenvolvimento, o PWA está desabilitado para facilitar debugging.
Para testar PWA localmente:

```bash
npm run build
npm start
```

### Arquivos PWA

- `public/manifest.json` - Web App Manifest
- `public/sw.js` - Service Worker (gerado automaticamente)
- `app/offline/page.tsx` - Página offline
- `components/pwa-install-prompt.tsx` - Prompt de instalação

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

#### 1. Estrutura de Feature Module

```bash
src/features/
  nova-feature/
    components/              # Componentes React específicos
      nova-feature-table.tsx
      nova-feature-form.tsx
    hooks/                   # Hooks customizados
      use-nova-feature.ts
    actions/                 # Server Actions (Next.js 16)
      nova-feature-actions.ts
    domain.ts                # Entidades e regras de negócio
    service.ts               # Casos de uso
    repository.ts            # Acesso a dados
    types.ts                 # Tipagem específica
    utils.ts                 # Utilitários
    index.ts                 # Barrel exports
```

#### 2. Definir Domínio

```typescript
// src/features/nova-feature/domain.ts
import { z } from "zod";

// Tipos base
export type NovaFeatureId = number;

// Schema Zod (validação)
export const novaFeatureSchema = z.object({
  nome: z.string().min(3, "Mínimo 3 caracteres"),
  descricao: z.string().optional(),
});

// Tipo inferido do schema
export type NovaFeature = z.infer<typeof novaFeatureSchema> & {
  id: NovaFeatureId;
  created_at: string;
  updated_at: string;
};

// Constantes
export const STATUS_LABELS = {
  ativo: "Ativo",
  inativo: "Inativo",
} as const;
```

#### 3. Implementar Repository (Acesso a Dados)

```typescript
// src/features/nova-feature/repository.ts
import { createClient } from "@/lib/supabase/server";
import type { NovaFeature } from "./domain";

export async function findAll(): Promise<NovaFeature[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nova_feature")
    .select("*")
    .order("nome");

  if (error) throw new Error(error.message);
  return data || [];
}

export async function findById(id: number): Promise<NovaFeature | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nova_feature")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function create(
  params: Omit<NovaFeature, "id" | "created_at" | "updated_at">
): Promise<NovaFeature> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nova_feature")
    .insert(params)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

#### 4. Implementar Service (Lógica de Negócio)

```typescript
// src/features/nova-feature/service.ts
import { novaFeatureSchema, type NovaFeature } from "./domain";
import * as repo from "./repository";

export async function listar(): Promise<NovaFeature[]> {
  return await repo.findAll();
}

export async function buscar(id: number): Promise<NovaFeature | null> {
  return await repo.findById(id);
}

export async function criar(params: unknown): Promise<NovaFeature> {
  // 1. Validar entrada
  const validacao = novaFeatureSchema.safeParse(params);
  if (!validacao.success) {
    throw new Error(validacao.error.errors[0].message);
  }

  // 2. Regras de negócio
  const dados = {
    ...validacao.data,
    nome: validacao.data.nome.trim().toUpperCase(),
  };

  // 3. Persistir
  return await repo.create(dados);
}
```

#### 5. Criar Server Actions

```typescript
// src/features/nova-feature/actions/nova-feature-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import * as service from "../service";
import type { NovaFeature } from "../domain";

export async function actionListar(): Promise<{
  success: boolean;
  data?: NovaFeature[];
  error?: string;
}> {
  try {
    const data = await service.listar();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao listar",
    };
  }
}

export async function actionCriar(formData: FormData): Promise<{
  success: boolean;
  data?: NovaFeature;
  error?: string;
}> {
  try {
    const params = {
      nome: formData.get("nome") as string,
      descricao: formData.get("descricao") as string,
    };

    const data = await service.criar(params);

    // Revalidar cache
    revalidatePath("/nova-feature");

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar",
    };
  }
}
```

#### 6. Criar Componentes

```typescript
// src/features/nova-feature/components/nova-feature-table.tsx
"use client";

import { ResponsiveTable } from "@/components/ui/responsive-table";
import type { NovaFeature } from "../domain";
import type { ResponsiveTableColumn } from "@/components/ui/responsive-table";

interface NovaFeatureTableProps {
  data: NovaFeature[];
}

export function NovaFeatureTable({ data }: NovaFeatureTableProps) {
  const columns: ResponsiveTableColumn<NovaFeature>[] = [
    {
      id: "nome",
      header: "Nome",
      accessor: "nome",
      priority: 1,
    },
    {
      id: "descricao",
      header: "Descrição",
      accessor: "descricao",
      priority: 2,
    },
  ];

  return <ResponsiveTable data={data} columns={columns} />;
}
```

#### 7. Criar Página (App Router)

```typescript
// src/app/(dashboard)/nova-feature/page.tsx
import { PageShell } from "@/components/shared/page-shell";
import { NovaFeatureTable } from "@/features/nova-feature/components/nova-feature-table";
import { actionListar } from "@/features/nova-feature/actions/nova-feature-actions";
import { Button } from "@/components/ui/button";

export default async function NovaFeaturePage() {
  const result = await actionListar();

  if (!result.success) {
    return (
      <PageShell title="Nova Feature">
        <div>Erro: {result.error}</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Nova Feature"
      description="Gerenciamento de nova feature"
      actions={<Button>Nova Feature</Button>}
    >
      <NovaFeatureTable data={result.data || []} />
    </PageShell>
  );
}
```

#### 8. Exportar Módulo

```typescript
// src/features/nova-feature/index.ts
// Domain
export type { NovaFeature, NovaFeatureId } from "./domain";
export { novaFeatureSchema, STATUS_LABELS } from "./domain";

// Service
export { listar, buscar, criar } from "./service";

// Components
export { NovaFeatureTable } from "./components/nova-feature-table";

// Actions
export { actionListar, actionCriar } from "./actions/nova-feature-actions";
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

### Visão Geral da Nova Arquitetura

```
sinesys/
├── src/
│   ├── app/                      # Next.js App Router (apenas roteamento)
│   │   ├── (dashboard)/          # Rotas protegidas do dashboard
│   │   │   ├── processos/        # → usa features/processos/
│   │   │   ├── audiencias/       # → usa features/audiencias/
│   │   │   ├── partes/           # → usa features/partes/
│   │   │   ├── contratos/        # → usa features/contratos/
│   │   │   └── layout.tsx        # Layout com Sidebar fixa
│   │   ├── api/                  # API Routes (REST endpoints)
│   │   ├── auth/                 # Páginas de autenticação
│   │   ├── globals.css
│   │   └── layout.tsx
│   │
│   ├── features/                 # 🆕 FEATURE MODULES (FSD)
│   │   ├── partes/               # ✅ Migrado
│   │   │   ├── components/
│   │   │   │   ├── clientes/
│   │   │   │   ├── partes-contrarias/
│   │   │   │   ├── terceiros/
│   │   │   │   ├── representantes/
│   │   │   │   └── shared/
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── processos/            # ✅ Migrado
│   │   │   ├── components/
│   │   │   ├── actions/
│   │   │   ├── hooks/
│   │   │   ├── domain.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── contratos/            # ✅ Migrado
│   │   ├── assinatura-digital/   # 🔄 Parcial
│   │   └── [outros módulos]/     # 📋 Planejado
│   │
│   ├── components/               # Componentes Compartilhados
│   │   ├── ui/                   # shadcn/ui base (170+ componentes)
│   │   │   ├── button.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── responsive-table.tsx
│   │   │   ├── table-toolbar.tsx
│   │   │   └── ...
│   │   ├── layout/               # Layout e navegação
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── app-header.tsx
│   │   │   └── page-shell.tsx
│   │   └── shared/               # Padrões Zattar
│   │       ├── data-table-shell.tsx  # Superfície de dados
│   │       ├── table-pagination.tsx
│   │       └── ...
│   │
│   ├── lib/                      # Bibliotecas e Infraestrutura
│   │   ├── supabase/             # Cliente Supabase
│   │   ├── redis/                # Cache Redis
│   │   ├── mongodb/              # MongoDB (logs, auditoria)
│   │   └── utils/                # Utilitários gerais
│   │
│   ├── hooks/                    # Hooks Globais
│   │   ├── use-viewport.ts
│   │   ├── use-debounce.ts
│   │   └── ...
│   │
│   ├── types/                    # Tipos Compartilhados
│   │   ├── domain/               # Entidades de domínio
│   │   └── contracts/            # DTOs e contratos
│   │
│   └── core/                     # 🔄 Legado (em migração)
│       └── partes/               # → movendo para features/partes/
│
├── backend/                      # 🔄 Legado (em migração para features/)
│   ├── {modulo}/services/        # → movendo para features/{modulo}/
│   ├── auth/                     # Autenticação (permanece)
│   ├── api/pje-trt/              # Integração PJE/TRT (permanece)
│   └── utils/                    # Utilitários (permanece)


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

Este documento descreve como fazer o deploy da stack Sinesys em diferentes ambientes.

### Arquitetura de Serviços

O Sinesys é composto por **3 serviços independentes**, cada um em seu próprio repositório:

| Serviço             | Repositório            | Descrição                  | Porta | WebSocket |
| ------------------- | ---------------------- | -------------------------- | ----- | --------- |
| **sinesys_app**     | Este repo              | Frontend Next.js + API     | 3000  | ❌        |
| **sinesys_mcp**     | sinesys-mcp-server     | MCP Server para agentes IA | 3001  | ❌        |
| **sinesys_browser** | sinesys-browser-server | Firefox (scraping PJE)     | 3000  | ✅        |

```
┌─────────────────────────────────────────────────────────────┐
│                        Servidor                              │
├─────────────────────────────────────────────────────────────┤
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│   │  sinesys_app │   │ sinesys_mcp  │   │sinesys_browser│   │
│   │  (Next.js)   │   │  (Node.js)   │   │   (Firefox)   │   │
│   │  :3000       │   │  :3001       │   │  :3000 (WS)   │   │
│   └──────┬───────┘   └──────┬───────┘   └───────┬───────┘   │
│          │                  │                    │           │
│          └──────────────────┼────────────────────┘           │
│                             │                                │
│                     ┌───────▼───────┐                       │
│                     │   Supabase    │                       │
│                     │ Redis MongoDB │                       │
│                     └───────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

### Deploy no CapRover (via Imagem Docker)

O deploy do Sinesys no CapRover é feito utilizando **imagens Docker pré-construídas via GitHub Actions**, evitando builds no servidor de produção e garantindo deploys mais rápidos e confiáveis.

#### Arquitetura de Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions                            │
│  1. Push na branch master/main                              │
│  2. Build da imagem Docker                                  │
│  3. Push para Docker Hub                                    │
│  4. Trigger deploy no CapRover (webhook)                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Docker Hub                              │
│  sinesystec/sinesys:latest                                  │
│  sinesystec/sinesys:abc1234 (SHA)                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      CapRover                                │
│  Pull imagem → Deploy → Restart container                   │
└─────────────────────────────────────────────────────────────┘
```

#### Pré-requisitos

- CapRover instalado e configurado
- Acesso ao dashboard do CapRover
- Conta no Docker Hub (para armazenar imagens)
- GitHub Actions configurado (já incluído no repositório)

#### Passo 1: Criar os Apps no CapRover

Acesse o dashboard do CapRover e crie **3 apps**:

| Nome do App       | Descrição               | HTTP Port | WebSocket |
| ----------------- | ----------------------- | --------- | --------- |
| `sinesys`         | App principal (Next.js) | 3000      | ❌        |
| `sinesys-mcp`     | MCP Server              | 3001      | ❌        |
| `sinesys-browser` | Firefox para scraping   | 3000      | ✅        |

> ⚠️ **Importante**: Habilite WebSocket Support apenas para `sinesys-browser`!

#### Passo 2: Configurar GitHub Secrets

No repositório do GitHub, vá em **Settings → Secrets and variables → Actions** e adicione:

| Secret                          | Descrição                  | Exemplo                          |
| ------------------------------- | -------------------------- | -------------------------------- |
| `DOCKERHUB_USERNAME`            | Username do Docker Hub     | `sinesystec`                     |
| `DOCKERHUB_TOKEN`               | Access Token do Docker Hub | `dckr_pat_xxx`                   |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do Supabase            | `https://xxx.supabase.co`        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Key do Supabase       | `eyJ...`                         |
| `CAPROVER_SERVER`               | URL do CapRover            | `https://captain.seudominio.com` |
| `CAPROVER_APP_TOKEN`            | Token do app (opcional)    | Ver passo 3                      |

> 💡 **Dica**: Para criar um Docker Hub Access Token, acesse Docker Hub → Account Settings → Security → New Access Token

#### Passo 3: Deploy Automático (Recomendado)

**No CapRover:**

1. Acesse **Apps → sinesys → Deployment**
2. Role até **App Webhooks**
3. Habilite **Enable App Token**
4. Copie o token gerado
5. Adicione como secret `CAPROVER_APP_TOKEN` no GitHub

**Resultado**: A cada push na branch `master` ou `main`, o GitHub Actions:

- Faz build da imagem
- Envia para Docker Hub
- Dispara deploy automático no CapRover

#### Passo 4: Deploy Manual (Alternativa)

Se não configurou o deploy automático:

1. Aguarde o GitHub Actions completar (veja na aba **Actions** do repositório)
2. No CapRover, acesse **Apps → sinesys → Deployment**
3. Na seção **Deploy via ImageName**, insira:
   ```
   sinesystec/sinesys:latest
   ```
4. Clique em **Deploy**

#### Passo 5: Configurar Variáveis de Ambiente

No dashboard do CapRover, vá em **Apps → sinesys → App Configs → Environmental Variables**:

```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_anon_key
SUPABASE_SECRET_KEY=sua_secret_key

# Browser Service (comunicação interna CapRover)
BROWSER_WS_ENDPOINT=ws://srv-captain--sinesys-browser:3000
BROWSER_SERVICE_URL=http://srv-captain--sinesys-browser:3000

# Redis (opcional)
ENABLE_REDIS_CACHE=true
REDIS_URL=redis://host:port

# MongoDB (opcional)
MONGODB_URL=mongodb://...
MONGODB_DATABASE=sinesys
```

#### Passo 6: Deploy dos Outros Serviços

**Browser Service (sinesys-browser):**

```env
PORT=3000
BROWSER_TOKEN=seu_token_opcional
```

- Container HTTP Port: `3000`
- WebSocket Support: ✅ **Habilitar**
- Memory: 2048MB (mínimo)

**MCP Server (sinesys-mcp):**

```env
NODE_ENV=production
PORT=3001
SINESYS_API_URL=http://srv-captain--sinesys:3000
SINESYS_API_KEY=sua_api_key
```

#### Passo 7: Configurar Domínios e HTTPS

No dashboard do CapRover:

| App             | Domínio                          | HTTPS |
| --------------- | -------------------------------- | ----- |
| sinesys         | app.seudominio.com.br            | ✅    |
| sinesys-mcp     | mcp.seudominio.com.br (opcional) | ✅    |
| sinesys-browser | (não expor)                      | —     |

#### Vantagens do Deploy via GitHub Actions + Docker Hub

| Aspecto                        | Build no CapRover    | Deploy via Imagem (GitHub Actions) |
| ------------------------------ | -------------------- | ---------------------------------- |
| **Tempo de deploy**            | ~5-10 min            | ~30 seg                            |
| **Uso de memória no servidor** | 6-8 GB durante build | Apenas runtime (~512MB)            |
| **Risco de OOM**               | Alto                 | Nenhum                             |
| **Consistência**               | Depende do servidor  | Imagem idêntica sempre             |
| **Rollback**                   | Rebuild necessário   | Trocar tag da imagem               |
| **Build acontece**             | No CapRover          | No GitHub Actions                  |
| **Custo do servidor**          | Precisa mais RAM     | Servidor menor e mais barato       |

---

### Deploy com Docker Compose (Local)

Para desenvolvimento local, você pode usar o `docker-compose.yml` simplificado:

```bash
# Subir apenas o app (sem mcp e browser)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

> **Nota**: Para desenvolvimento completo com os 3 serviços, clone os outros repositórios e suba-os separadamente.

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

---

### Progressive Web App (PWA)

O Sinesys é um **Progressive Web App (PWA)** completo, permitindo instalação como aplicativo nativo em dispositivos móveis e desktop.

**Tecnologias**: `@ducanh2912/next-pwa`, Workbox, Web App Manifest

**Benefícios**: Instalação como app nativo, carregamento instantâneo, funciona offline

Para verificar requisitos do PWA, execute:

```bash
npm run check:pwa
```

---

### Comunicação entre Serviços

**No CapRover**: Use `srv-captain--NOME_DO_APP` (ex: `http://srv-captain--sinesys:3000`)

**No Docker Compose**: Use o nome do serviço (ex: `http://sinesys_app:3000`)

---

### Scripts de Build para Produção

| Script           | Uso                       |
| ---------------- | ------------------------- |
| `build:caprover` | Produção (GitHub Actions) |
| `build:prod`     | Build local de produção   |
| `build`          | Desenvolvimento           |
| `analyze`        | Análise de bundle         |

**Importante**: O PWA requer Webpack em produção (`@ducanh2912/next-pwa`).

---

### Recursos Recomendados

| Serviço         | RAM         | CPU       |
| --------------- | ----------- | --------- |
| sinesys_app     | 512MB-1GB   | 1 core    |
| sinesys_mcp     | 128MB-256MB | 0.5 core  |
| sinesys_browser | 1GB-2GB     | 1-2 cores |

**Total recomendado**: VPS com 4GB RAM, 2-4 cores

---

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

## Design System

O Sinesys utiliza um Design System baseado em padrões (Pattern-Based Design) com Tailwind v4 + shadcn/ui.

### Para Agentes de Codificação

Antes de gerar código, consulte:

- `.qoder/rules/design-system-foundation.md` - Axiomas visuais e regras de estilo
- `.qoder/rules/component-structure.md` - Organização de componentes
- `components/shared/page-template-example.tsx` - Template de referência

### Tokens de Cor

- **Primary:** Zattar Purple (`--primary`) - CTAs, links, foco
- **Highlight:** Action Orange (`--highlight`) - Badges de ação
- **Muted:** Textos secundários (`--muted-foreground`)

### Tipografia

- **Títulos:** Montserrat (`font-heading`)
- **Corpo:** Inter (`font-sans`)
- **Código:** Geist Mono (`font-mono`)

---

## 📋 Documentação

Este README contém toda a documentação técnica centralizada do repositório Sinesys.

### Documentação Principal (neste arquivo)

- ✅ Visão Geral e Stack Tecnológica
- ✅ Arquitetura Orientada a Features (FSD)
- ✅ Organização de Tipos (Domain/Contracts)
- ✅ Princípios de DDD
- ✅ Instalação e Configuração
- ✅ Sistema de Cache Redis
- ✅ Componentes Reutilizáveis
- ✅ API e Endpoints
- ✅ MCP Server (Model Context Protocol)
- ✅ Scripts Úteis
- ✅ Deploy (CapRover, Docker, PWA)
- ✅ Troubleshooting
- ✅ Design System

### Documentação Técnica Complementar

Para análises técnicas profundas e documentação de módulos específicos:

#### Pareceres Técnicos

- **docs/PARECER_REFATORACAO_ARQUITETURAL.md** - Análise completa da refatoração arquitetural (DDD, camadas, migração)
- **docs/PARECER_DESIGN_SYSTEM_UX.md** - Análise do sistema de design, UX e arquitetura de informação

#### Documentação de Arquitetura

- **docs/arquitetura-sistema.md** - Documentação técnica completa da arquitetura do sistema
- **AGENTS.md** - Instruções para agentes de IA trabalhando no projeto

#### Planos de Migração

- **docs/MIGRACAO_CHAT.md** - Plano de migração do sistema de chat legado para nova arquitetura

#### Documentação de Módulos

- **docs/assinatura-digital/** - Arquitetura conceitual e conformidade legal do módulo de assinatura digital
- **docs/financeiro/** - Especificações de dashboard, conciliação bancária e exportações
- **docs/modulos/audiencias.md** - Arquitetura e fluxo de dados do módulo de audiências

#### Especificações e Propostas

- **openspec/** - Especificações OpenSpec e propostas de mudanças

---

## 📝 Licença

**Status:** Em definição - Será publicado como Open Source

### Opções de Licenças Open Source

Existem diversos tipos de licenças open source, cada uma com diferentes níveis de permissividade:

#### 1. Licenças Permissivas (Mais Livres)

**MIT License** ⭐ Mais Popular

- ✅ Uso comercial permitido
- ✅ Modificação permitida
- ✅ Distribuição permitida
- ✅ Uso privado permitido
- ⚠️ Sem garantia
- 📋 Requer apenas: Incluir aviso de copyright
- **Ideal para**: Máxima adoção e liberdade

**Apache 2.0**

- ✅ Tudo da MIT, mais:
- ✅ Proteção contra patentes
- ✅ Exige documentar mudanças
- 📋 Requer: Copyright + NOTICE file
- **Ideal para**: Projetos empresariais que precisam proteção de patentes

**BSD 3-Clause**

- ✅ Similar à MIT
- ✅ Proíbe uso do nome do projeto para endosso
- **Ideal para**: Projetos acadêmicos

#### 2. Licenças Copyleft Fraco

**LGPL (Lesser GPL)**

- ✅ Uso comercial permitido
- ✅ Pode ser linkado em software proprietário
- ⚠️ Modificações devem ser open source
- **Ideal para**: Bibliotecas que podem ser usadas em software proprietário

**MPL 2.0 (Mozilla Public License)**

- ✅ Copyleft aplicado apenas aos arquivos modificados
- ✅ Pode combinar com código proprietário
- **Ideal para**: Projetos que querem proteger o código mas permitir integração

#### 3. Licenças Copyleft Forte (Mais Restritivas)

**GPL v3 (GNU General Public License)**

- ✅ Uso comercial permitido
- ❌ Qualquer software derivado DEVE ser GPL
- ❌ Não pode ser incorporado em software proprietário
- ✅ Proteção contra "tivoização" (hardware que bloqueia modificações)
- **Ideal para**: Garantir que TODO código derivado seja open source

**AGPL v3**

- ✅ Tudo da GPL v3, mais:
- ✅ Copyleft se aplica mesmo para uso em rede (SaaS)
- **Ideal para**: Aplicações web/SaaS que devem permanecer abertas

#### 4. Licenças Especializadas

**Creative Commons (CC BY 4.0)**

- Apenas para documentação/conteúdo (não código)

**Unlicense / Public Domain**

- Domínio público total
- Sem restrições

### Comparação Rápida

| Licença    | Comercial | Link Proprietário | Derivados Abertos | Patentes |
| ---------- | --------- | ----------------- | ----------------- | -------- |
| MIT        | ✅        | ✅                | ❌ Opcional       | ❌       |
| Apache 2.0 | ✅        | ✅                | ❌ Opcional       | ✅       |
| LGPL       | ✅        | ✅                | ✅ Obrigatório    | ❌       |
| GPL v3     | ✅        | ❌                | ✅ Obrigatório    | ✅       |
| AGPL v3    | ✅        | ❌                | ✅ + SaaS         | ✅       |

### Recomendação para o Sinesys

Considerando que é um sistema de gestão jurídica:

**Opção 1: MIT License** 🌟 Recomendada

- Máxima adoção pela comunidade
- Outros escritórios podem usar e adaptar livremente
- Permite uso comercial por terceiros
- Simples e bem compreendida

**Opção 2: Apache 2.0**

- Se houver preocupação com patentes de software
- Proteção legal mais robusta

**Opção 3: AGPL v3**

- Se quiser garantir que modificações em versões SaaS sejam compartilhadas
- Impede que empresas peguem o código e "fechem" um serviço derivado

**Não recomendado: GPL v3**

- Muito restritiva para software de gestão
- Dificulta integração com ferramentas proprietárias

### Próximo Passo

Após escolher a licença, adicionar o arquivo `LICENSE` na raiz do projeto e atualizar esta seção com a licença escolhida.

---

## 👥 Sobre

**Desenvolvido por:** Sinesys  
**Cliente:** Zattar Advogados  
**Repositório:** [GitHub](https://github.com/seu-usuario/sinesys) _(atualizar após publicação)_

---

**Última atualização:** Novembro 2025
