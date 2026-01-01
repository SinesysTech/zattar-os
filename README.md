# Sinesys - Sistema de Gestão Jurídica

![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)
![Redis](https://img.shields.io/badge/Redis-Cache-red?style=flat&logo=redis)
![AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)

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
git clone https://github.com/sinesys/sinesys.git
cd sinesys

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
**Repositório:** [GitHub](https://github.com/sinesys/sinesys)

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja nosso [Guia de Contribuição](./CONTRIBUTING.md).

## 💬 Suporte

- **Documentação**: [/docs](./docs/)
- **Issues**: [GitHub Issues](https://github.com/sinesys/sinesys/issues)
- **Discussões**: [GitHub Discussions](https://github.com/sinesys/sinesys/discussions)

---

**Última atualização:** Dezembro 2025
