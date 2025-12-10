

# Project Specification: Sinesys

## 1. Project Overview

### 1.1. Introduction
Sinesys is a legal management system developed for law firms, focusing on client management (individuals and legal entities), contract and legal process management, automated data capture from PJE-TRT (Electronic Judicial Process of Regional Labor Courts), management of case files, hearings, and pending actions, assignment of responsibilities, and audit of changes.

### 1.2. Key Features
*   Client Management (Physical and Legal Persons)
*   Contract and Legal Process Management
*   Automated Data Capture from PJE-TRT
*   Management of Case Files, Hearings, and Pending Actions
*   Assignment of Responsibilities and Audit of Changes
*   Integration with PJE-TRT for data capture (General archives, archived processes, hearings, pending manifestations)
*   Authentication via SSO with 2FA (OTP) for PJE
*   API documentation with Swagger/OpenAPI

## Tech Stack

### 2.1. Frontend
*   **Framework:** Next.js (React)
*   **Language:** TypeScript
*   **UI Library:** Radix UI, Tailwind CSS for styling
*   **Rich Text Editor:** Plate.js / Tiptap
*   **AI Integration:** AI SDK, CopilotKit
*   **Other Libraries:** Framer Motion, Dnd Kit, Date-fns, Lodash, Zod

### 2.2. Backend
*   **Framework:** Next.js API Routes (TypeScript)
*   **Database Interaction:** Supabase client libraries (for PostgreSQL)
*   **Additional Data Storage:** MongoDB (potentially for specific use cases or legacy components)
*   **Utilities:** Axios, Pino (logging), ioredis (Redis client)

### 2.3. Database
*   **Primary Database:** PostgreSQL (managed by Supabase)
*   **Secondary/Specific Use Case Database:** MongoDB

### 2.4. Other Technologies
*   **CI/CD:** Not explicitly defined in `package.json`, but `build:caprover` suggests CapRover as a potential deployment target. Vercel is also suggested by `vercel.json`.
*   **Testing Frameworks:** Jest (Unit/Integration), Playwright (E2E)
*   **Logging:** Pino

### Ferramentas de Desenvolvimento
- **ESLint**: Configuração Next.js (core-web-vitals + TypeScript)
- **Swagger/OpenAPI**: Documentação de APIs REST
- **tsx**: Execução de scripts TypeScript

## 3. Architecture

### 3.1. High-Level Architecture
The project follows a Next.js full-stack architecture. The application leverages Next.js App Router for routing, with protected routes for the dashboard. API Routes handle REST endpoints, while the `backend/` directory encapsulates business logic and services, organized modularly by feature. Supabase manages database schemas and migrations.


## 4. Development Guidelines

### 4.1. Code Style and Linting

#### TypeScript
- Strict mode habilitado (`strict: true`)
- Usar tipos explícitos para parâmetros e retornos de funções
- Preferir `const` sobre `function` para declarações de funções
- Prefixar handlers de eventos com `handle` (ex: `handleClick`, `handleSubmit`)

#### Nomenclatura
- **Arquivos**: kebab-case para arquivos, PascalCase para componentes React
- **Variáveis e funções**: camelCase
- **Tipos e interfaces**: PascalCase
- **Constantes**: UPPER_SNAKE_CASE ou camelCase conforme contexto
- **Banco de dados**: snake_case para tabelas e colunas (conforme padrão PostgreSQL)

#### Comentários
- Comentários em português para código de domínio jurídico
- JSDoc para funções públicas e APIs
- Comentários explicativos para lógica complexa
- Incluir comentários em schemas SQL explicando propósito de tabelas e colunas

#### Formatação
- 2 espaços para indentação
- Aspas simples para strings (quando possível)
- Ponto e vírgula no final de statements
- Quebras de linha após imports e antes de exports

### 4.2. Testing Strategy
- Scripts de teste para APIs externas em `dev_data/scripts/`
- Testes manuais via scripts TypeScript executáveis com `tsx`
- Foco em testes de integração para captura de dados do PJE
- Validação de credenciais e fluxos de autenticação
- **Frameworks:** Jest (Unit/Integration), Playwright (E2E)

### 4.3. Deployment
The application is a Next.js project, built using `next build` (with `turbopack` or `webpack`). Deployment is supported on platforms compatible with Node.js applications. `build:caprover` script suggests CapRover as a potential target, and `vercel.json` indicates Vercel is also an option.

### 4.4. Git Workflow
- Branch principal: `main` (assumido)
- Commits descritivos em português
- Estrutura de commits: `tipo: descrição breve`
- Usar OpenSpec para gerenciar mudanças significativas

## Project Conventions



## Domain Context

### Domínio Jurídico
- **Clientes**: Podem ser pessoas físicas (PF) ou jurídicas (PJ)
- **Contratos**: Tipos incluem ajuizamento, defesa, ato processual, assessoria, consultoria, extrajudicial, parecer
- **Processos**: Vinculados a contratos, com status e grau (primeiro ou segundo grau)
- **Tribunais**: Sistema focado em TRT (Tribunais Regionais do Trabalho), códigos TRT1 a TRT24
- **Audiências**: Eventos processuais com data, hora e responsável
- **Pendências de Manifestação**: Ações pendentes que requerem resposta do advogado

### Integração PJE-TRT
- Sistema de captura automatizada de dados do Processo Judicial Eletrônico
- Autenticação via SSO com suporte a 2FA (OTP)
- Captura de: acervo geral, processos arquivados, audiências, pendências de manifestação
- Cache de credenciais com renovação automática
- Suporte a múltiplos tribunais TRT

### Entidades Principais
- **Advogados**: Usuários do sistema com credenciais PJE
- **Usuários**: Usuários internos do sistema
- **Clientes**: Pessoas físicas ou jurídicas representadas
- **Partes Contrárias**: Oponentes nos processos
- **Contratos**: Acordos de prestação de serviços jurídicos
- **Processos**: Vinculados a contratos e clientes
- **Acervo**: Processos capturados do PJE
- **Audiências**: Eventos processuais agendados
- **Pendências**: Ações que requerem manifestação

## Important Constraints

### Técnicos
- **Supabase**: Limitações de RLS e políticas de segurança devem ser respeitadas
- **PJE**: Rate limiting e necessidade de autenticação SSO com 2FA
- **Next.js 16**: App Router obrigatório, Server Components por padrão
- **TypeScript Strict**: Tipos devem ser explícitos e corretos

### Regulatórios e de Negócio
- **LGPD**: Dados pessoais de clientes devem ser protegidos
- **Sigilo Profissional**: Informações jurídicas são confidenciais
- **Auditoria**: Todas as alterações importantes devem ser registradas
- **Atribuição de Responsáveis**: Processos e pendências devem ter responsáveis atribuídos

### Performance
- Captura de dados do PJE deve ser eficiente e não bloquear outras operações
- Queries ao banco devem usar índices apropriados
- Paginação obrigatória para listagens grandes

## External Dependencies

### Supabase
- **Banco de Dados**: PostgreSQL gerenciado
- **Autenticação**: Supabase Auth com sessões
- **Row Level Security**: Políticas de segurança no banco
- **Storage**: Disponível para documentos (se necessário)

### PJE-TRT
- **URL Base**: `https://pje.trt3.jus.br` (exemplo TRT3, varia por tribunal)
- **SSO**: `https://sso.cloud.pje.jus.br`
- **Autenticação**: SSO com suporte a 2FA via OTP
- **APIs**: Não documentadas oficialmente, captura via web scraping

### Bibliotecas Principais
- **@supabase/supabase-js**: Cliente Supabase
- **@supabase/ssr**: Integração SSR com Next.js
- **puppeteer/playwright**: Automação de navegador
- **swagger-jsdoc**: Geração de documentação OpenAPI
- **swagger-ui-react**: Interface de documentação Swagger
