# Project Context

## Purpose
Sinesys é um sistema de gestão jurídica desenvolvido para escritórios de advocacia, com foco em:
- Gestão de clientes (pessoas físicas e jurídicas)
- Gestão de contratos e processos jurídicos
- Captura automatizada de dados do PJE-TRT (Processo Judicial Eletrônico dos Tribunais Regionais do Trabalho)
- Gestão de acervo processual, audiências e pendências de manifestação
- Atribuição de responsáveis e auditoria de alterações

## Tech Stack

### Frontend
- **Next.js 16**: App Router, Server Components, Server Actions
- **React 19**: React Server Components, useActionState, useOptimistic
- **TypeScript**: Strict mode habilitado
- **shadcn/ui**: Componentes UI baseados em Radix UI
- **Tailwind CSS v4**: Estilização utility-first
- **Framer Motion**: Animações e micro-interações
- **Lucide React**: Ícones

### Backend
- **Next.js API Routes**: Endpoints REST no App Router
- **Supabase**: Banco de dados PostgreSQL com Row Level Security (RLS)
- **Supabase Auth**: Autenticação e autorização
- **Puppeteer/Playwright**: Automação web para captura de dados do PJE

### Ferramentas de Desenvolvimento
- **ESLint**: Configuração Next.js (core-web-vitals + TypeScript)
- **Swagger/OpenAPI**: Documentação de APIs REST
- **tsx**: Execução de scripts TypeScript

## Project Conventions

### Code Style

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

### Architecture Patterns

#### Estrutura de Diretórios
```
app/                    # Next.js App Router
  (dashboard)/          # Rotas protegidas do dashboard
  api/                  # API Routes (REST endpoints)
backend/                # Lógica de negócio e serviços
  [feature]/            # Módulos por funcionalidade
    services/           # Serviços de negócio
      [feature]/        # Serviços específicos
      persistence/      # Camada de persistência (Supabase)
components/             # Componentes React reutilizáveis
  ui/                   # Componentes shadcn/ui
supabase/
  schemas/              # Schemas declarativos do banco
  migrations/           # Migrações geradas automaticamente
```

#### Separação de Responsabilidades
- **API Routes** (`app/api/`): Validação de entrada, autenticação, formatação de resposta
- **Serviços de Negócio** (`backend/[feature]/services/[feature]/`): Lógica de negócio pura
- **Persistência** (`backend/[feature]/services/persistence/`): Acesso ao banco de dados via Supabase
- **Componentes**: UI pura, sem lógica de negócio

#### Padrões de API
- RESTful com métodos HTTP apropriados (GET, POST, PUT, DELETE)
- Documentação Swagger/OpenAPI com anotações JSDoc
- Respostas padronizadas: `{ success: boolean, data?: T, error?: string }`
- Autenticação obrigatória via `authenticateRequest()` helper
- Tratamento de erros consistente com try/catch

#### Banco de Dados
- **Schemas Declarativos**: Definir estado final em `supabase/schemas/`
- **Migrações**: Geradas automaticamente via `supabase db diff`
- **RLS**: Sempre habilitado, políticas granulares por operação (SELECT, INSERT, UPDATE, DELETE)
- **Auditoria**: Triggers para log de alterações e atribuições
- **Nomenclatura**: snake_case, comentários em todas as tabelas e colunas importantes

### Testing Strategy
- Scripts de teste para APIs externas em `dev_data/scripts/`
- Testes manuais via scripts TypeScript executáveis com `tsx`
- Foco em testes de integração para captura de dados do PJE
- Validação de credenciais e fluxos de autenticação

### Git Workflow
- Branch principal: `main` (assumido)
- Commits descritivos em português
- Estrutura de commits: `tipo: descrição breve`
- Usar OpenSpec para gerenciar mudanças significativas

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
