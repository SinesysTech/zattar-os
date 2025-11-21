<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

---

# Sinesys - Sistema de Gestão Jurídica

## Visão Geral

O **Sinesys** é um sistema de gestão jurídica desenvolvido para o escritório Zattar Advogados, com foco em automação de captura de dados do PJE (Processo Judicial Eletrônico) dos Tribunais Regionais do Trabalho (TRT). O sistema automatiza a coleta de informações processuais, audiências, pendências e timeline, integrando-se com todos os 24 TRTs brasileiros.

## Stack Tecnológica

### Frontend
- **Next.js 16** com App Router e Server Components
- **React 19.2** com hooks modernos
- **TypeScript 5** em strict mode
- **Tailwind CSS 4** para estilização
- **shadcn/ui** (Radix UI + Tailwind) para componentes
- **Framer Motion** para animações
- **SWR** para data fetching client-side

### Backend/API
- **Next.js API Routes** (REST endpoints)
- **Supabase** (PostgreSQL, Auth, Storage)
- **Redis (ioredis)** para cache distribuído
- **MongoDB** para timeline e documentos
- **Swagger/OpenAPI** para documentação

### Automação
- **Playwright/Puppeteer** para web scraping do PJE
- **2FAuth** para geração de códigos OTP (2FA)
- **Google Drive API** para upload de documentos

## Estrutura de Diretórios

```
app/                          # Next.js App Router
  (dashboard)/               # Rotas protegidas (processos, audiências, etc.)
  api/                       # REST endpoints
  auth/                      # Rotas de autenticação
backend/                     # Lógica de negócio
  [feature]/services/        # Serviços por funcionalidade
  captura/                   # Automação PJE-TRT
  types/                     # Tipos TypeScript backend
components/                  # Componentes React reutilizáveis
  ui/                        # Componentes shadcn/ui
lib/                         # Bibliotecas e utilitários
  client.ts                  # Cliente Supabase browser
  server.ts                  # Cliente Supabase server
  redis/                     # Cliente Redis e cache
  mongodb/                   # Cliente MongoDB
  types/                     # Tipos TypeScript frontend
supabase/                    # Configurações Supabase
  migrations/                # Migrações SQL
  schemas/                   # Schemas declarativos
```

## Convenções de Código

### Nomenclatura
- **Arquivos**: kebab-case (`acervo-geral.service.ts`)
- **Componentes React**: PascalCase (`TableToolbar.tsx`)
- **Funções/variáveis**: camelCase (`getUserById`)
- **Tipos/Interfaces**: PascalCase (`CredencialParams`)
- **Constantes**: SCREAMING_SNAKE_CASE (`REDIS_CACHE_TTL`)
- **Banco de dados**: snake_case (tabelas e colunas PostgreSQL)

### TypeScript
- Strict mode habilitado
- Tipos explícitos para parâmetros e retornos
- Preferir `const` sobre `function` para funções
- Prefixar handlers de eventos com `handle` (ex: `handleClick`)

### Comentários
- Comentários em português para domínio jurídico
- JSDoc para funções públicas e APIs
- Comentários explicativos para lógica complexa

### Formatação
- 2 espaços para indentação
- Aspas simples para strings
- Ponto e vírgula obrigatório
- Quebras de linha após imports e antes de exports

## Padrões de Arquitetura

### Separação de Responsabilidades
- **API Routes** (`app/api/`): Validação, autenticação, formatação de resposta
- **Serviços** (`backend/[feature]/services/`): Lógica de negócio pura
- **Persistência**: Acesso ao banco via Supabase/MongoDB
- **Componentes**: UI pura, sem lógica de negócio

### API REST
- Métodos HTTP semânticos (GET, POST, PUT, DELETE, PATCH)
- Respostas padronizadas: `{ success: boolean, data?: T, error?: string }`
- Autenticação via `authenticateRequest()` helper
- Documentação Swagger com JSDoc annotations

### Banco de Dados
- **Schemas Declarativos** em `supabase/schemas/`
- **Migrações** geradas via `supabase db diff`
- **RLS (Row Level Security)** sempre habilitado
- **Auditoria** via triggers para log de alterações
- **Nomenclatura**: snake_case com comentários descritivos

### Cache Redis
- **Cache-Aside pattern** (Lazy Loading)
- **TTLs diferenciados**:
  - Listagens dinâmicas: 10 minutos
  - Dados auxiliares: 15-30 minutos
  - Dados estáveis: 1 hora
- **Invalidação inteligente** baseada em eventos
- **Fallback automático** em caso de falha

## Funcionalidades Core

### 1. Captura Automatizada PJE-TRT
- Acervo geral, processos arquivados, audiências, pendentes
- Timeline de processos com movimentações
- Download e upload de documentos para Google Drive
- Suporte a 24 TRTs (primeiro e segundo grau)
- Autenticação SSO com 2FA/OTP

### 2. Gestão de Processos
- Visualização de acervo completo com filtros avançados
- Atribuição de responsáveis
- Tipos de expediente customizáveis
- Baixa de expedientes com histórico

### 3. Gestão de Audiências
- Listagem com detalhes completos
- URL de audiência virtual editável
- Sincronização automática com PJE

### 4. Acordos e Condenações
- Valores recebidos/pagos com parcelamento
- Cálculo automático de honorários
- Controle de repasses para clientes

### 5. Sistema de Permissões
- 81 permissões em 13 recursos
- Cargos para organização interna
- Cache in-memory com TTL de 5 minutos
- Logs de auditoria completos

### 6. Agendamentos (Scheduler)
- Execuções programadas via cron
- Retry logic com backoff exponencial
- Logs detalhados de execução

## Domínio Jurídico

### Entidades Principais
- **Clientes**: Pessoas físicas ou jurídicas
- **Contratos**: Ajuizamento, defesa, ato processual, assessoria, etc.
- **Processos**: Vinculados a contratos e clientes
- **Tribunais**: TRT1 a TRT24 (Tribunais Regionais do Trabalho)
- **Audiências**: Eventos processuais agendados
- **Pendências**: Intimações que requerem manifestação

### Integração PJE-TRT
- Sistema federal de processos eletrônicos dos TRTs
- Autenticação via SSO com suporte a 2FA
- APIs não documentadas (captura via web scraping)
- URLs variam por tribunal: `https://pje.trt[N].jus.br`

## Integrações Externas

### Supabase
- Autenticação JWT com RLS
- PostgreSQL com migrations
- Storage para arquivos

### Redis
- Cache distribuído com TTL configurável
- Endpoints: `/api/cache/stats`, `/api/cache/clear`

### MongoDB
- Timeline de processos (NoSQL)
- Índices otimizados para consultas

### Google Drive
- Upload automático de documentos PJE
- Organização por pasta de processos
- Service Account authentication

### 2FAuth
- Geração de códigos OTP para 2FA
- API REST com retry logic

## Componentes Reutilizáveis

### UI Básicos (shadcn/ui)
Button, Input, Select, Checkbox, Dialog, Sheet, Popover, Table, Card, Badge, Avatar, Alert, Toast, Skeleton, Tabs, Collapsible, Accordion

### Componentes Customizados
- **TableToolbar**: Barra de ferramentas para tabelas com busca/filtros
- **DataTableColumnHeader**: Cabeçalhos com ordenação
- **Combobox**: Select com busca
- **Field, InputGroup, Item**: Sistema de formulários
- **Empty**: Estado vazio com ilustração
- **ClientOnlyTabs**: Wrapper para Tabs que evita hydration mismatch com React 19 (usar em vez de Tabs quando houver erros de hidratação)

## APIs Principais

### Captura
- `POST /api/captura/trt/acervo-geral`
- `POST /api/captura/trt/arquivados`
- `POST /api/captura/trt/audiencias`
- `POST /api/captura/trt/pendentes`
- `GET /api/captura/historico`

### Processos
- `GET /api/acervo`
- `GET /api/acervo/[id]`
- `PATCH /api/acervo/[id]/responsavel`

### Audiências
- `GET /api/audiencias`
- `PATCH /api/audiencias/[id]/url-virtual`
- `PATCH /api/audiencias/[id]/responsavel`

### Permissões
- `GET /api/permissoes/recursos`
- `GET /api/permissoes/usuarios/[id]`
- `POST /api/permissoes/usuarios/[id]`

### Cache
- `GET /api/cache/stats`
- `POST /api/cache/clear`

### Documentação
- `GET /api/docs` - Swagger UI interativo

## Variáveis de Ambiente

### Obrigatórias
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=
SUPABASE_SECRET_KEY=
SERVICE_API_KEY=
```

### Redis
```env
ENABLE_REDIS_CACHE=true
REDIS_URL=
REDIS_PASSWORD=
REDIS_CACHE_TTL=600
```

### MongoDB
```env
MONGODB_URL=
MONGODB_DATABASE=
```

### 2FAuth
```env
TWOFAUTH_API_URL=
TWOFAUTH_API_TOKEN=
TWOFAUTH_ACCOUNT_ID=
```

### Automação
```env
DEFAULT_BROWSER=firefox
HEADLESS=true
SCRAPING_TIMEOUT=60000
```

## Scripts Disponíveis

```bash
npm run dev                     # Dev server
npm run build                   # Build produção
npm start                       # Servidor produção
npm run lint                    # ESLint
npm run type-check              # Verificar tipos TypeScript
```

## Debugging e Monitoramento

- **Swagger UI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Health check**: `/api/health`
- **Cache stats**: `/api/cache/stats`
- **Logs estruturados** no console
- **Screenshots** de automação em modo debug

## Constraints Importantes

### Técnicos
- Supabase RLS deve ser respeitado
- PJE tem rate limiting e requer 2FA
- Next.js 16 App Router obrigatório
- TypeScript strict mode
- **React 19 + Radix UI**: Usar `ClientOnlyTabs` para evitar hydration mismatch com componentes Tabs (incompatibilidade conhecida entre React 19 e versões atuais do Radix UI)

### Regulatórios
- LGPD: Proteção de dados pessoais
- Sigilo profissional: Dados confidenciais
- Auditoria: Log de alterações importantes

### Performance
- Captura PJE deve ser eficiente e não-bloqueante
- Queries devem usar índices apropriados
- Paginação obrigatória para listagens grandes
