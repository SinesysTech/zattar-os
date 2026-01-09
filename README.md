# Sinesys - Sistema de Gestão Jurídica

![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)
![Redis](https://img.shields.io/badge/Redis-Cache-red?style=flat&logo=redis)
![AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)
[![codecov](https://codecov.io/gh/SinesysTech/zattar-advogados-app/branch/main/graph/badge.svg)](https://codecov.io/gh/SinesysTech/zattar-advogados-app)
![Build](https://github.com/SinesysTech/zattar-advogados-app/workflows/Tests%20and%20Coverage/badge.svg)

**Desenvolvido por:** Sinesys  
**Cliente:** Zattar Advogados  
**Licença:** GNU Affero General Public License v3.0 (AGPL-3.0)  
**Status:** Open Source

---

## 🎯 O que é o Sinesys?

O **Sinesys** é um sistema completo de gestão jurídica desenvolvido especificamente para escritórios de advocacia trabalhista, com foco em **automação**, **integração** e **conformidade legal**.

### ⚡ Principais Diferenciais

- 🤖 **Captura Automatizada** de dados do PJE/TRT via Playwright
- ✍️ **Assinatura Digital** com conformidade legal (MP 2.200-2/2001)
- 📊 **Dashboard Financeiro** com conciliação bancária inteligente
- 🔐 **Segurança Avançada** com 2FA e controle granular de permissões
- 🚀 **Performance** com cache Redis e otimizações Next.js 16
- 📱 **PWA** - Funciona offline e pode ser instalado

### 💼 Funcionalidades Principais

| Módulo         | Descrição                                                         |
| -------------- | ----------------------------------------------------------------- |
| **Processos**  | Gestão completa de processos trabalhistas com captura PJE/TRT     |
| **Audiências** | Agenda inteligente com notificações e atribuição de responsáveis  |
| **Partes**     | Cadastro de clientes, partes contrárias e terceiros               |
| **Contratos**  | Gestão de contratos com assinatura digital certificada            |
| **Financeiro** | Dashboard, conciliação bancária (OFX/CSV), contas a pagar/receber |
| **Documentos** | Editor colaborativo em tempo real com versionamento               |
| **Pendências** | Controle de prazos processuais e manifestações                    |

---

## 🚀 Início Rápido

### Instalação e Configuração

```bash
# 1. Clone o repositório
git clone https://github.com/SinesysTech/zattar-advogados-app.git
cd zattar-advogados-app

# 2. Instale dependências
pnpm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Execute migrações do banco
pnpm db:migrate

# 5. Inicie o servidor
pnpm dev
```

Acesse: **http://localhost:3000**

📖 **Guia completo**: [Instalação e Configuração](./docs/guia-inicio-rapido.md)

---

## 🏗️ Build (CI/Docker)

- **Build local (padrão)**: `npm run build`
- **Build para CI/Docker (recomendado)**: `npm run build:ci` (usa heap maior para evitar OOM)

### Build Performance

O projeto utiliza configuração híbrida otimizada:

- **Desenvolvimento**: Turbopack (5-10x mais rápido)
- **Produção**: Webpack (necessário para PWA)
- **Heap alocado**: 6GB (local) / 8GB (CI)
- **Tempo de build**: ~3-5 minutos (otimizado)

**Otimizações aplicadas**:
- `modularizeImports` para tree-shaking de 12+ bibliotecas
- Code splitting inteligente (Plate.js, Radix UI, commons)
- `turbotrace` para análise de dependências
- Cache incremental habilitado

**Analisar bundle**:
```bash
# Windows PowerShell
$env:ANALYZE="true"; npm run build
start analyze/client.html

# Bash/Linux
ANALYZE=true npm run build
open analyze/client.html
```

---

## 📊 Cobertura de Testes

[![codecov](https://codecov.io/gh/SinesysTech/zattar-advogados-app/branch/main/graph/badge.svg)](https://codecov.io/gh/SinesysTech/zattar-advogados-app)

O projeto mantém **80% de cobertura mínima** em todas as camadas:

| Camada                       | Threshold | Status |
| ---------------------------- | --------- | ------ |
| **Global**                   | 80%       | [![codecov](https://codecov.io/gh/SinesysTech/zattar-advogados-app/branch/main/graph/badge.svg)](https://codecov.io/gh/SinesysTech/zattar-advogados-app) |
| **Features (Domain/Service)** | 90%      | Configurado |
| **Lib (Formatters/Utils)**   | 95%       | Configurado |
| **Auth/Redis**               | 85%       | Configurado |

### Visualizar Cobertura

```bash
# Gerar relatório HTML e abrir no navegador
npm run test:coverage:open

# Gerar relatório por módulo
npm run test:coverage:features    # Apenas features
npm run test:coverage:lib         # Apenas lib
npm run test:coverage:components  # Apenas components
```

### Relatórios Disponíveis

- **HTML**: `coverage/index.html` (navegável por arquivo)
- **LCOV**: `coverage/lcov.info` (para IDEs)
- **JSON**: `coverage/coverage-summary.json` (para análise programática)
- **Codecov**: [https://codecov.io/gh/SinesysTech/zattar-advogados-app](https://codecov.io/gh/SinesysTech/zattar-advogados-app)

---

## 🧪 Testes

### Estratégia de Testes

O Sinesys utiliza uma **estratégia de testes em múltiplas camadas**:

```
Property-Based Tests → Testes Unitários → Testes de Integração → Testes E2E
       ↓                      ↓                    ↓                   ↓
  Formatters, Utils    Domain, Service,    Actions, Hooks, API   Fluxos de Usuário
                         Repository
```

### Comandos de Teste

#### Execução Básica

```bash
# Todos os testes
npm test

# Modo watch (desenvolvimento)
npm run test:watch

# Com cobertura
npm run test:coverage

# CI (otimizado para GitHub Actions)
npm run test:ci
```

#### Testes por Tipo

```bash
# Unitários
npm run test:unit

# Integração
npm run test:integration
npm run test:integration:watch
npm run test:integration:coverage

# Componentes
npm run test:components

# E2E (Playwright)
npm run test:e2e
```

#### Testes por Módulo

```bash
# Features específicas
npm run test:enderecos
npm run test:pericias
npm run test:portal-cliente
npm run test:assistentes
npm run test:pangea

# Actions
npm run test:actions:processos
npm run test:actions:partes
npm run test:actions:financeiro
npm run test:actions              # Todas as actions
npm run test:actions:watch
npm run test:actions:coverage

# Services
npm run test:services
```

#### Relatórios de Cobertura

```bash
# Relatório HTML completo
npm run test:coverage:report

# Abrir relatório no navegador
npm run test:coverage:open

# Relatório JSON (para scripts)
npm run test:coverage:json

# Cobertura por módulo
npm run test:coverage:features
npm run test:coverage:lib
npm run test:coverage:components
```

### Estrutura de Testes

| Tipo | Localização | Framework | Propósito |
|------|-------------|-----------|-----------|
| **Property-Based** | `src/lib/__tests__/unit/` | Jest + fast-check | Testes com milhares de casos gerados |
| **Unitários** | `src/**/__tests__/unit/` | Jest | Testes isolados de funções/classes |
| **Integração** | `src/**/__tests__/integration/` | Jest | Testes de módulos com dependências |
| **Componentes** | `src/**/__tests__/components/` | Jest + Testing Library | Testes de componentes React |
| **E2E** | `src/**/__tests__/e2e/` | Playwright | Testes de fluxos completos |

### Thresholds de Cobertura

O projeto mantém thresholds rigorosos de cobertura:

| Camada | Lines | Branches | Functions | Statements |
|--------|-------|----------|-----------|------------|
| **Global** | 80% | 80% | 80% | 80% |
| **Domain/Service** | 90% | - | - | 90% |
| **Formatters/Utils** | 95% | 90% | 95% | 95% |
| **Safe-Action** | 90% | 85% | 90% | 90% |
| **Auth/Redis** | 85% | 80% | 85% | 85% |

### Helpers de Teste

O projeto fornece helpers reutilizáveis em [src/lib/__tests__/helpers/test-helpers.ts](src/lib/__tests__/helpers/test-helpers.ts):

```typescript
import {
  createMockUser,
  createMockSupabaseClient,
  createMockRedisClient,
  createFormData,
  testDataGenerators,
} from '@/lib/__tests__/helpers/test-helpers';

// Criar mock de usuário
const user = createMockUser({ id: 1, nomeCompleto: 'João Silva' });

// Gerar dados aleatórios
const cpf = testDataGenerators.randomCPF();
const email = testDataGenerators.randomEmail();
```

### CI/CD

Os testes são executados automaticamente em **todos os PRs** via GitHub Actions:

- ✅ Testes unitários e de integração
- ✅ Testes E2E (Playwright)
- ✅ Verificação de cobertura (gate de 80%)
- ✅ Upload para Codecov
- ✅ Comentário automático em PRs com análise de cobertura

**Workflow:** [.github/workflows/tests.yml](.github/workflows/tests.yml)

### Visualização de Cobertura

#### Local (HTML)

```bash
npm run test:coverage:open
```

Abre `coverage/index.html` com:
- Cobertura por arquivo
- Linhas cobertas/não cobertas
- Branches não testados
- Navegação interativa

#### Codecov (Online)

Acesse: [https://codecov.io/gh/SinesysTech/zattar-advogados-app](https://codecov.io/gh/SinesysTech/zattar-advogados-app)

Recursos:
- 📈 Histórico de cobertura
- 🔍 Análise de diff em PRs
- 🎯 Cobertura por módulo (flags)
- 📊 Gráficos de tendência
- 💬 Comentários automáticos em PRs

### Boas Práticas

1. **Escreva testes antes de abrir PR**
2. **Mantenha cobertura acima de 80%**
3. **Use property-based testing para validações** (formatters, utils)
4. **Teste casos de erro**, não apenas happy path
5. **Mock dependências externas** (Supabase, Redis, APIs)
6. **Teste responsividade** em componentes UI
7. **Use helpers de teste** para reduzir duplicação

---

## 📚 Documentação

### 🏗️ Arquitetura e Desenvolvimento

| Documento                                                     | Descrição                                                                    |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **[Arquitetura do Sistema](./docs/arquitetura-sistema.md)**   | Documentação técnica completa (2.500+ linhas) - Camadas DDD, módulos, fluxos |
| **[Guia de Desenvolvimento](./docs/guia-desenvolvimento.md)** | Como criar features, componentes, APIs e testes                              |
| **[AGENTS.md](./AGENTS.md)**                                  | Instruções para agentes de IA trabalhando no projeto                         |

### 🔧 Configuração e Deploy

| Documento                                                 | Descrição                                  |
| --------------------------------------------------------- | ------------------------------------------ |
| **[Guia de Início Rápido](./docs/guia-inicio-rapido.md)** | Instalação, configuração e primeiro acesso |

### 📦 Módulos Específicos

| Módulo                 | Documentação                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Assinatura Digital** | [Arquitetura](./docs/assinatura-digital/arquitetura-conceitual.md) \| [Conformidade Legal](./docs/assinatura-digital/CONFORMIDADE_LEGAL.md)                         |
| **Financeiro**         | [Dashboard](./docs/financeiro/dashboard.md) \| [Conciliação Bancária](./docs/financeiro/conciliacao-bancaria.md) \| [Exportações](./docs/financeiro/exportacoes.md) |
| **Audiências**         | [Arquitetura e Fluxos](./docs/modulos/audiencias.md)                                                                                                                |
| **Multi-App**          | [Configuração Multi-App](./docs/multi-app-setup.md) - URLs dos três apps (Dashboard, Meu Processo, Website)                                                         |

---

## 🛠 Stack Tecnológica

### Frontend

**Next.js 16** • **React 19** • **TypeScript 5** • **Tailwind CSS 4** • **shadcn/ui** • **Radix UI** • **Framer Motion** • **TanStack Table** • **SWR**

### Backend

**Next.js API Routes** • **Supabase (PostgreSQL/JSONB)** • **Redis** • **Puppeteer** • **Playwright**

### IA (Editor de Documentos)

O editor de documentos utiliza **Plate AI** com streaming via **Vercel AI SDK**.

Variáveis de ambiente relevantes:

- `AI_GATEWAY_API_KEY` (obrigatória para habilitar IA no editor)
- `AI_DEFAULT_MODEL` (opcional)
- `AI_TOOL_CHOICE_MODEL` (opcional)
- `AI_COMMENT_MODEL` (opcional)

### Desabilitar Indexação AI em Emergências

Se o banco estiver com Disk I/O alto, você pode desabilitar temporariamente a indexação:

```bash
# .env.local
ENABLE_AI_INDEXING=false
```

Isso impede que novos documentos sejam adicionados à fila de indexação. Para reativar:

```bash
ENABLE_AI_INDEXING=true
```

Após reativar, execute o cron job manualmente para processar documentos pendentes:

```bash
curl -X POST https://seu-dominio.com/api/cron/indexar-documentos \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Infraestrutura

**Docker** • **Docker Swarm** • **Traefik** • **Backblaze B2**

---

## 🏗️ Arquitetura

O Sinesys utiliza **Feature-Sliced Design (FSD)** com **Domain-Driven Design (DDD)**:

```
┌─────────────────────────────────────┐
│    Camada de Apresentação (app/)    │  ← Next.js Pages & Layouts
├─────────────────────────────────────┤
│    Features (src/features/)         │  ← Módulos de Negócio (DDD)
├─────────────────────────────────────┤
│    Shared (components/, lib/)       │  ← Componentes e Utils
├─────────────────────────────────────┤
│    Infraestrutura (Supabase, Redis) │  ← Banco, Cache, Storage
└─────────────────────────────────────┘
```

📖 **Detalhes**: [Arquitetura do Sistema](./docs/arquitetura-sistema.md)

---

## 📈 Monitoramento e Qualidade

### Métricas de Código

| Métrica | Status | Detalhes |
|---------|--------|----------|
| **Cobertura de Testes** | [![codecov](https://codecov.io/gh/SinesysTech/zattar-advogados-app/branch/main/graph/badge.svg)](https://codecov.io/gh/SinesysTech/zattar-advogados-app) | 80% mínimo |
| **Build Status** | ![Build](https://github.com/SinesysTech/zattar-advogados-app/workflows/Tests%20and%20Coverage/badge.svg) | CI/CD automatizado |
| **TypeScript** | ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript) | Strict mode |
| **Linting** | ![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?style=flat&logo=eslint) | Next.js config |

### Dashboards

- **Codecov**: [https://codecov.io/gh/SinesysTech/zattar-advogados-app](https://codecov.io/gh/SinesysTech/zattar-advogados-app)
- **GitHub Actions**: [https://github.com/SinesysTech/zattar-advogados-app/actions](https://github.com/SinesysTech/zattar-advogados-app/actions)
- **Dependências**: [https://github.com/SinesysTech/zattar-advogados-app/network/dependencies](https://github.com/SinesysTech/zattar-advogados-app/network/dependencies)

### Relatórios Automatizados

Em cada PR, você receberá:

- ✅ Status dos testes (pass/fail)
- 📊 Análise de cobertura (diff)
- 🎯 Cobertura por módulo
- 🔍 Arquivos com maior impacto
- 💬 Comentário automático com resumo

### Comandos de Qualidade

```bash
# Verificar tipagem
npm run type-check

# Executar linter
npm run lint

# Executar testes com cobertura
npm run test:coverage

# Verificar arquitetura
npm run check:architecture
```

---

## 📝 Licença

Este projeto é licenciado sob a **GNU Affero General Public License v3.0 (AGPL-3.0)**.

### O que isso significa?

✅ **Você PODE**:

- Usar comercialmente (incluindo SaaS)
- Modificar o código
- Distribuir cópias
- Usar internamente

📋 **Você DEVE**:

- Disponibilizar código-fonte (incluindo modificações)
- Manter licença AGPL v3
- Incluir avisos de copyright
- Fornecer acesso ao código mesmo em serviços web

❌ **Você NÃO PODE**:

- Fechar o código (criar versão proprietária)
- Usar "Sinesys" como nome do seu serviço
- Remover atribuições

### Marca Registrada

⚠️ A licença AGPL v3 **não** concede direitos sobre a marca "Sinesys".

- ❌ Não pode nomear seu serviço como "Sinesys", "Sinesys Pro", etc.
- ✅ Pode dizer que é "Baseado em Sinesys" ou "Powered by Sinesys"

📄 **Documentos Legais**:

- [LICENSE](./LICENSE) - Texto completo da AGPL v3
- [TRADEMARK](./TRADEMARK) - Política de uso da marca
- [NOTICE](./NOTICE) - Avisos de copyright

---

## 👥 Sobre

**Desenvolvido por:** Sinesys  
**Cliente:** Zattar Advogados  
**Repositório:** [GitHub](https://github.com/SinesysTech/zattar-advogados-app)

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja nosso [Guia de Contribuição](./CONTRIBUTING.md).

## 💬 Suporte

- **Documentação**: [/docs](./docs/)
- **Issues**: [GitHub Issues](https://github.com/SinesysTech/zattar-advogados-app/issues)
- **Discussões**: [GitHub Discussions](https://github.com/SinesysTech/zattar-advogados-app/discussions)

---

**Última atualização:** Dezembro 2025
