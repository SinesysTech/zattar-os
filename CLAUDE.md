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

### Criando Novos Módulos

Ao adicionar uma nova funcionalidade, siga esta estrutura:

#### 1. Estrutura de Diretórios
```
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

#### 2. Definir Tipos (`backend/types/nova-feature/types.ts`)
```typescript
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
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { Item, CriarItemParams } from '@/backend/types/nova-feature/types';

export async function criarItem(params: CriarItemParams): Promise<Item> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('items')
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
import { criarItem as criarItemPersistence } from '../persistence/item-persistence.service';
import type { CriarItemParams, Item } from '@/backend/types/nova-feature/types';

export async function criarItem(params: CriarItemParams): Promise<Item> {
  // Validações de negócio
  if (!params.nome || params.nome.trim().length === 0) {
    throw new Error('Nome é obrigatório');
  }

  // Chama persistência
  return await criarItemPersistence(params);
}
```

#### 5. Criar API Route
```typescript
// app/api/nova-feature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { criarItem } from '@/backend/nova-feature/services/nova-feature/criar-item.service';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const item = await criarItem(body);

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Erro ao criar item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
```

#### 6. Adicionar Cache (se necessário)
```typescript
import { withCache, generateCacheKey, invalidateCache } from '@/lib/redis';

export async function listarItems(params: ListarItemsParams) {
  const cacheKey = generateCacheKey('items', params);

  return await withCache(
    cacheKey,
    async () => {
      const items = await listarItemsPersistence(params);
      return items;
    },
    600 // TTL de 10 minutos
  );
}
```

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

#### Criando Migrações
Arquivos de migração devem seguir o formato `YYYYMMDDHHmmss_descricao.sql` em UTC:
- Exemplo: `20240906123045_create_profiles.sql`
- Localização: `supabase/migrations/`
- Incluir comentários explicativos sobre propósito e comportamento esperado
- SQL sempre em lowercase
- Adicionar comentários abundantes para operações destrutivas (drop, truncate, alter)

#### Row Level Security (RLS)
Ao criar tabelas:
- SEMPRE habilitar RLS, mesmo para tabelas públicas
- Criar políticas granulares (uma por operação: select, insert, update, delete)
- Políticas separadas para cada role (`anon`, `authenticated`)
- Nunca combinar políticas mesmo que tenham funcionalidade idêntica
- Usar `(select auth.uid())` em vez de `auth.uid()` direto para melhor performance
- Adicionar índices em colunas usadas nas políticas
- Especificar roles com `TO` (ex: `TO authenticated`)
- Evitar joins na tabela alvo; preferir `IN` ou `ANY` com subqueries

Exemplo correto:
```sql
-- Uma política para select
create policy "Users can view their own records"
on profiles for select
to authenticated
using ((select auth.uid()) = user_id);

-- Outra política separada para insert
create policy "Users can create their own records"
on profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);
```

#### SQL Style Guide
- Lowercase para palavras reservadas SQL
- snake_case para tabelas (plural) e colunas (singular)
- Sempre adicionar schema nas queries (ex: `public.users`)
- Foreign keys: singular da tabela + `_id` (ex: `user_id` para tabela `users`)
- Todo `id` deve ser `bigint generated always as identity primary key`
- Sempre adicionar comentário descritivo nas tabelas (até 1024 caracteres)
- Usar CTEs para queries complexas, priorizando legibilidade sobre performance
- Preferir nomes completos de tabelas em joins (evitar aliases curtos)

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
- 82 permissões em 13 recursos
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

### Desenvolvimento
```bash
npm run dev                     # Dev server
npm run dev:trace              # Dev com trace de deprecation
npm run build                   # Build produção
npm start                       # Servidor produção
npm run lint                    # ESLint
npm run type-check              # Verificar tipos TypeScript
npm run type-check:skip-lib    # Type-check sem verificar bibliotecas
```

### Testes de APIs PJE
```bash
npm run test:api-acervo-geral              # Testar API de acervo geral
npm run test:api-arquivados                # Testar API de arquivados
npm run test:api-audiencias                # Testar API de audiências
npm run test:api-pendentes-manifestacao    # Testar API de pendentes
```

### Utilitários
```bash
npm run debug:credentials                      # Debug de credenciais
npm run populate:tabelas-audiencias           # Popular tabelas auxiliares
npm run populate:classe-judicial-acervo       # Popular classe judicial
npm run sincronizar-usuarios                  # Sincronizar Supabase Auth <-> DB
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

## Desenvolvimento com OpenSpec

Este projeto usa **OpenSpec** para desenvolvimento orientado a especificações. OpenSpec gerencia propostas de mudanças e especificações de funcionalidades.

### Quando Criar uma Proposta OpenSpec

Criar proposta para:
- Adicionar novas funcionalidades
- Fazer mudanças breaking (API, schema)
- Alterar arquitetura ou padrões
- Otimizações de performance (que mudam comportamento)
- Atualizações de padrões de segurança

Pular proposta para:
- Bug fixes (restaurar comportamento esperado)
- Typos, formatação, comentários
- Atualizações de dependências (não-breaking)
- Mudanças de configuração
- Testes para comportamento existente

### Workflow OpenSpec (3 Estágios)

#### 1. Criando Propostas
```bash
# Ver estado atual
openspec list                # Mudanças ativas
openspec list --specs        # Especificações existentes

# Escolher change-id único (kebab-case, verb-led)
# Exemplos: add-timeline-view, refactor-cache-layer, remove-legacy-api

# Criar estrutura
mkdir -p openspec/changes/add-timeline-view/specs/timeline
touch openspec/changes/add-timeline-view/{proposal.md,tasks.md}
```

Estrutura da proposta (`proposal.md`):
- **Why**: 1-2 frases sobre problema/oportunidade
- **What Changes**: Lista de mudanças (marcar breaking com **BREAKING**)
- **Impact**: Specs afetadas e código afetado

Criar spec deltas em `specs/[capability]/spec.md`:
- Use `## ADDED Requirements` para novas capacidades
- Use `## MODIFIED Requirements` para comportamento alterado (incluir requirement completo)
- Use `## REMOVED Requirements` para features descontinuadas
- Todo requirement DEVE ter pelo menos um `#### Scenario:` (4 hashtags)

#### 2. Implementando Propostas
1. Ler `proposal.md` para entender o que será construído
2. Ler `design.md` (se existir) para decisões técnicas
3. Ler `tasks.md` para checklist de implementação
4. Implementar tasks sequencialmente
5. Atualizar checklist após conclusão de cada task
6. **NÃO começar implementação antes da aprovação da proposta**

#### 3. Arquivando Propostas
Após deploy em produção:
```bash
# Arquivar mudança (passa change-id explicitamente)
openspec archive add-timeline-view --yes

# Validar que tudo está correto
openspec validate --strict
```

### Comandos OpenSpec Úteis

```bash
openspec show <item>              # Ver detalhes de mudança ou spec
openspec validate <item> --strict # Validar rigorosamente
openspec show --json              # Output JSON para scripts
```

### Estrutura de Diretórios OpenSpec

```
openspec/
├── project.md              # Convenções do projeto
├── specs/                  # Verdade atual - o que ESTÁ construído
│   └── [capability]/
│       ├── spec.md         # Requirements e scenarios
│       └── design.md       # Padrões técnicos
├── changes/                # Propostas - o que DEVE mudar
│   ├── [change-id]/
│   │   ├── proposal.md     # Por quê, o quê, impacto
│   │   ├── tasks.md        # Checklist de implementação
│   │   ├── design.md       # Decisões técnicas (opcional)
│   │   └── specs/          # Mudanças delta
│   │       └── [capability]/spec.md
│   └── archive/            # Mudanças completadas
```

## Troubleshooting

### Problemas Comuns

#### Erro de Autenticação (`Unauthorized`)
**Problema**: Endpoints retornam 401 Unauthorized

**Solução**:
- Verificar se o usuário está logado
- Confirmar que o token JWT é válido
- Verificar variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

#### Erro de Compilação TypeScript
**Problema**: Erros de tipo durante build

**Solução**:
```bash
# Verificar tipos sem build
npm run type-check

# Verificar tipos sem bibliotecas
npm run type-check:skip-lib

# Limpar cache do Next.js
rm -rf .next
npm run dev
```

#### Cache Redis Não Funciona
**Problema**: Dados não são armazenados em cache

**Solução**:
- Verificar `ENABLE_REDIS_CACHE=true` em `.env.local`
- Testar conexão: `redis-cli -h host -p porta -a senha ping`
- Verificar logs do servidor para erros de conexão
- Ver estatísticas: `GET /api/cache/stats`

#### Erro ao Capturar Dados do PJE
**Problema**: Falha na captura de processos

**Solução**:
- Verificar credenciais no 2FAuth
- Confirmar `TWOFAUTH_API_URL`, `TWOFAUTH_API_TOKEN` e `TWOFAUTH_ACCOUNT_ID`
- Testar credenciais manualmente no PJE
- Verificar timeout de scraping (`SCRAPING_TIMEOUT`)

#### Problemas com MongoDB
**Problema**: Erro ao salvar timeline

**Solução**:
- Verificar `MONGODB_URL` e `MONGODB_DATABASE`
- Testar conexão: `mongosh "sua_connection_string"`
- Verificar permissões do usuário MongoDB

#### Hydration Mismatch com React 19
**Problema**: Erro de hidratação com componentes Tabs (Radix UI)

**Solução**:
- Usar `ClientOnlyTabs` em vez de `Tabs` do Radix UI
- Componente disponível em `components/ui/client-only-tabs.tsx`
- Incompatibilidade conhecida entre React 19 e Radix UI atual

### Logs e Debugging

#### Logs do Next.js
```bash
# Modo desenvolvimento com logs detalhados
npm run dev:trace
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

#### Logs do MongoDB
```bash
# Conectar ao MongoDB
mongosh "sua_connection_string"

# Ver logs de operações
db.setProfilingLevel(1)
```
