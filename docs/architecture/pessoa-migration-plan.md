# Plano de Migração: Unificação de Entidades para `Pessoa`

## Visão Geral

Este documento descreve o plano de migração para unificar as entidades `Cliente`, `ParteContraria` e `Terceiro` em uma única entidade de domínio `Pessoa`, seguindo princípios de Domain-Driven Design (DDD) e mantendo compatibilidade com o código existente.

## Motivação

### Problemas Atuais

1. **Duplicação de Código**: As três entidades (`Cliente`, `ParteContraria`, `Terceiro`) compartilham ~90% dos mesmos campos (nome, CPF/CNPJ, emails, telefones, etc.)

2. **Inconsistência**: Campos idênticos podem ter validações ou comportamentos ligeiramente diferentes entre as entidades

3. **Manutenção Difícil**: Alterações em campos comuns requerem mudanças em três lugares diferentes

4. **Complexidade de Queries**: Buscar "todas as pessoas" requer queries em três tabelas diferentes

### Benefícios da Unificação

1. **Single Source of Truth**: Uma única entidade `Pessoa` com campos comuns
2. **Redução de Código**: Elimina ~70% de código duplicado
3. **Facilita Queries**: Buscar pessoas em uma única tabela
4. **Flexibilidade**: Uma pessoa pode ter múltiplos papéis (ser cliente e parte contrária em processos diferentes)
5. **Alinhamento com Domínio**: No mundo real, são todas "pessoas" com diferentes papéis processuais

---

## Estado Atual do Sistema

### Entidades Existentes

#### 1. **Cliente** (`clientes`)
- **Localização**: `backend/clientes/services/`, `types/domain/partes.ts`
- **Tipos**: `Cliente`, `CriarClienteParams`, `AtualizarClienteParams`, `ListarClientesParams`
- **API**: `/api/clientes`
- **Tabela**: `clientes`
- **Características**: Representa clientes do escritório (Pessoa Física ou Jurídica)

#### 2. **ParteContraria** (`partes_contrarias`)
- **Localização**: `backend/partes-contrarias/services/`, `types/domain/partes.ts`
- **Tipos**: `ParteContraria`, `CriarParteContrariaParams`, etc.
- **API**: `/api/partes-contrarias`
- **Tabela**: `partes_contrarias`
- **Características**: Representa a parte adversária em processos

#### 3. **Terceiro** (`terceiros`)
- **Localização**: `backend/terceiros/services/`, `types/domain/partes.ts`
- **Tipos**: `Terceiro`, `CriarTerceiroParams`, etc.
- **API**: `/api/terceiros`
- **Tabela**: `terceiros`
- **Características**: Representa terceiros intervenientes (perito, MP, testemunha, etc.)

### Relacionamentos com Processos

Todas as três entidades se relacionam com processos através da tabela polimórfica `processo_partes`:

```typescript
interface ProcessoParte {
  id: number;
  processo_id: number;
  tipo_entidade: 'cliente' | 'parte_contraria' | 'terceiro';
  entidade_id: number;
  tipo_parte: TipoParteProcesso; // 'AUTOR', 'REU', etc.
  polo: PoloProcessoParte; // 'ATIVO', 'PASSIVO', etc.
  // ...
}
```

---

## Estado Futuro Proposto

### Nova Entidade `Pessoa`

```typescript
// types/domain/pessoa.ts
export interface Pessoa {
  id: number;
  tipo_pessoa: 'pf' | 'pj';

  // Dados Comuns
  nome: string;
  cpf: string | null;
  cnpj: string | null;
  nome_social_fantasia: string | null;
  emails: string[] | null;
  // ... todos os campos comuns

  // Metadados
  created_at: string;
  updated_at: string;
}
```

### Relacionamentos

A tabela `processo_partes` será simplificada:

```typescript
interface ProcessoParte {
  id: number;
  processo_id: number;
  pessoa_id: number; // Apenas uma FK, sem polimorfismo
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  principal: boolean;
  // ...
}
```

### Contratos (Camada de API)

```typescript
// types/contracts/pessoa.ts
export interface CriarPessoaParams {
  tipo_pessoa: 'pf' | 'pj';
  nome: string;
  cpf?: string;
  cnpj?: string;
  // ... campos comuns
}

export interface AtualizarPessoaParams {
  id: number;
  // ... campos atualizáveis
}

export interface ListarPessoasParams {
  pagina?: number;
  limite?: number;
  tipo_pessoa?: 'pf' | 'pj';
  busca?: string;
  // ... filtros
}
```

---

## Plano de Migração (Fases)

### **Fase 1: Preparação (Sem Breaking Changes)**

#### 1.1. Criar Tipos de Domínio

- [ ] Criar `types/domain/pessoa.ts` com interface `Pessoa`
- [ ] Criar `types/contracts/pessoa.ts` com contracts de API
- [ ] Exportar tipos de `types/domain/index.ts` e `types/contracts/index.ts`

#### 1.2. Criar Migração de Banco de Dados

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_pessoas_table.sql

-- Criar tabela pessoas unificada
create table if not exists public.pessoas (
  id bigint generated always as identity primary key,
  tipo_pessoa text not null check (tipo_pessoa in ('pf', 'pj')),

  -- Dados Comuns
  nome text not null,
  cpf text,
  cnpj text,
  nome_social_fantasia text,
  emails text[],
  ddd_celular text,
  numero_celular text,
  -- ... todos os campos comuns

  -- Dados PF
  rg text,
  data_nascimento timestamptz,
  genero text,
  -- ... campos específicos de PF

  -- Dados PJ
  inscricao_estadual text,
  data_abertura timestamptz,
  -- ... campos específicos de PJ

  -- PJE Metadata
  id_pje bigint,
  dados_pje_completo jsonb,

  -- Auditoria
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices
create index idx_pessoas_cpf on public.pessoas(cpf) where cpf is not null;
create index idx_pessoas_cnpj on public.pessoas(cnpj) where cnpj is not null;
create index idx_pessoas_nome on public.pessoas using gin(nome gin_trgm_ops);
create index idx_pessoas_tipo_pessoa on public.pessoas(tipo_pessoa);

-- RLS
alter table public.pessoas enable row level security;

-- Políticas RLS (exemplo simplificado)
create policy "Authenticated users can view pessoas"
  on public.pessoas for select
  to authenticated
  using (true);

create policy "Authenticated users can create pessoas"
  on public.pessoas for insert
  to authenticated
  with check (true);
```

#### 1.3. Criar Aliases Deprecated

```typescript
// types/contracts/partes.ts (adicionar ao final)

/**
 * @deprecated Use `CriarPessoaParams` de `@/types/contracts/pessoa` em vez disso.
 * Este tipo será removido na v2.0.
 */
export type CriarClienteParamsDeprecated = CriarClienteParams;

/**
 * @deprecated Use `CriarPessoaParams` de `@/types/contracts/pessoa` em vez disso.
 * Este tipo será removido na v2.0.
 */
export type CriarParteContrariaParamsDeprecated = CriarParteContrariaParams;
```

---

### **Fase 2: Implementação Backend (Compatibilidade Dual)**

#### 2.1. Criar Serviços de Pessoa

```typescript
// backend/pessoas/services/pessoas/criar-pessoa.service.ts
export async function criarPessoa(params: CriarPessoaParams): Promise<Pessoa> {
  // Validações
  // Persistência
}

// backend/pessoas/services/persistence/pessoa-persistence.service.ts
export async function criarPessoaPersistence(params: CriarPessoaParams): Promise<Pessoa> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('pessoas')
    .insert(params)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

#### 2.2. Criar API Routes `/api/pessoas`

```typescript
// app/api/pessoas/route.ts
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const pessoa = await criarPessoa(body);

  return NextResponse.json({ success: true, data: pessoa });
}

export async function GET(request: NextRequest) {
  // Listar pessoas com filtros
}
```

#### 2.3. Criar Mappers (Cliente/ParteContraria/Terceiro ↔ Pessoa)

```typescript
// backend/pessoas/mappers/cliente-para-pessoa.mapper.ts
export function clienteParaPessoa(cliente: Cliente): Pessoa {
  return {
    id: cliente.id,
    tipo_pessoa: cliente.tipo_pessoa,
    nome: cliente.nome,
    cpf: cliente.cpf,
    cnpj: cliente.cnpj,
    // ... mapear todos os campos
  };
}

export function criarClienteParamsParaCriarPessoaParams(
  params: CriarClienteParams
): CriarPessoaParams {
  return {
    tipo_pessoa: params.tipo_pessoa,
    nome: params.nome,
    cpf: params.cpf,
    cnpj: params.cnpj,
    // ... mapear todos os campos
  };
}
```

#### 2.4. Atualizar APIs Existentes (Façade Pattern)

Manter `/api/clientes`, `/api/partes-contrarias`, `/api/terceiros` funcionando, mas internamente usando o serviço de `Pessoa`:

```typescript
// app/api/clientes/route.ts (atualizado)
import { criarPessoa } from '@/backend/pessoas/services/pessoas/criar-pessoa.service';
import { criarClienteParamsParaCriarPessoaParams } from '@/backend/pessoas/mappers/cliente-para-pessoa.mapper';

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: CriarClienteParams = await request.json();

  // Mapear para novo tipo
  const pessoaParams = criarClienteParamsParaCriarPessoaParams(body);

  // Usar novo serviço
  const pessoa = await criarPessoa(pessoaParams);

  // Retornar no formato antigo para compatibilidade
  return NextResponse.json({ success: true, data: pessoa });
}
```

---

### **Fase 3: Migração de Dados**

#### 3.1. Script de Migração de Dados

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_migrate_data_to_pessoas.sql

-- Migrar Clientes
insert into public.pessoas (
  tipo_pessoa, nome, cpf, cnpj, nome_social_fantasia,
  emails, ddd_celular, numero_celular, /* ... */
  created_at, updated_at
)
select
  tipo_pessoa, nome, cpf, cnpj, nome_social_fantasia,
  emails, ddd_celular, numero_celular, /* ... */
  created_at, updated_at
from public.clientes
where ativo = true;

-- Migrar Partes Contrárias
insert into public.pessoas (
  tipo_pessoa, nome, cpf, cnpj, /* ... */
)
select
  tipo_pessoa, nome, cpf, cnpj, /* ... */
from public.partes_contrarias
where ativo = true
  and (cpf is not null or cnpj is not null) -- Evitar duplicatas
  and not exists (
    select 1 from public.pessoas p
    where (p.cpf = partes_contrarias.cpf and p.cpf is not null)
       or (p.cnpj = partes_contrarias.cnpj and p.cnpj is not null)
  );

-- Migrar Terceiros (similar)
-- ...

-- Criar tabela de mapeamento temporária para rastreabilidade
create table public._migration_pessoa_mapping (
  tabela_origem text not null,
  id_origem bigint not null,
  pessoa_id bigint not null references public.pessoas(id),
  primary key (tabela_origem, id_origem)
);

-- Popular mapeamento para clientes
insert into public._migration_pessoa_mapping (tabela_origem, id_origem, pessoa_id)
select 'clientes', c.id, p.id
from public.clientes c
join public.pessoas p on (
  (c.cpf is not null and p.cpf = c.cpf) or
  (c.cnpj is not null and p.cnpj = c.cnpj)
)
where c.ativo = true;

-- Popular mapeamento para partes_contrarias e terceiros...
```

#### 3.2. Atualizar `processo_partes`

Adicionar coluna `pessoa_id` e popular:

```sql
-- Adicionar coluna pessoa_id (nullable inicialmente)
alter table public.processo_partes add column pessoa_id bigint references public.pessoas(id);

-- Popular pessoa_id usando mapeamento
update public.processo_partes pp
set pessoa_id = m.pessoa_id
from public._migration_pessoa_mapping m
where pp.tipo_entidade = m.tabela_origem
  and pp.entidade_id = m.id_origem;

-- Criar índice
create index idx_processo_partes_pessoa_id on public.processo_partes(pessoa_id);

-- Após validação, tornar coluna NOT NULL
-- alter table public.processo_partes alter column pessoa_id set not null;
```

---

### **Fase 4: Migração Frontend (Gradual)**

#### 4.1. Criar Hooks e Queries para `/api/pessoas`

```typescript
// app/_lib/hooks/use-pessoas.ts
export function usePessoas(params: ListarPessoasParams) {
  return useSWR(
    `/api/pessoas?${new URLSearchParams(params as any)}`,
    fetcher
  );
}

export function useCriarPessoa() {
  return useSWRMutation('/api/pessoas', async (url, { arg }: { arg: CriarPessoaParams }) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arg),
    });
    return res.json();
  });
}
```

#### 4.2. Atualizar Componentes Gradualmente

1. **Novos componentes**: Usar `/api/pessoas` desde o início
2. **Componentes existentes**: Manter usando `/api/clientes` até refatoração completa
3. **Shared components**: Criar variantes que aceitam `Pessoa` ou `Cliente`

```typescript
// Exemplo: Componente de seleção de pessoa
export function PessoaSelector({ onSelect }: { onSelect: (pessoa: Pessoa) => void }) {
  const { data } = usePessoas({ pagina: 1, limite: 10 });
  // ... renderizar selector
}
```

---

### **Fase 5: Deprecação e Remoção**

#### 5.1. Marcar APIs Antigas como Deprecated

```typescript
/**
 * @deprecated Use `/api/pessoas` em vez disso. Esta rota será removida na v2.0.
 */
export async function POST(request: NextRequest) {
  // ... implementação
}
```

#### 5.2. Adicionar Warnings em Desenvolvimento

```typescript
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATED] /api/clientes está deprecated. ' +
    'Use /api/pessoas em vez disso. Esta rota será removida na v2.0.'
  );
}
```

#### 5.3. Período de Convivência

- **v1.5**: APIs antigas e novas convivem (6 meses)
- **v1.8**: Warnings mais agressivos, documentação de migração
- **v2.0**: Remover completamente APIs antigas

#### 5.4. Remoção Final

Após validação completa e migração de 100% dos consumidores:

```sql
-- Remover colunas polimórficas antigas de processo_partes
alter table public.processo_partes drop column tipo_entidade;
alter table public.processo_partes drop column entidade_id;

-- Arquivar tabelas antigas (não deletar imediatamente)
alter table public.clientes rename to _archived_clientes;
alter table public.partes_contrarias rename to _archived_partes_contrarias;
alter table public.terceiros rename to _archived_terceiros;

-- Após 1 ano sem problemas, pode-se deletar as tabelas arquivadas
```

---

## Arquivos e Serviços Afetados

### Backend

#### Serviços a Migrar
- [ ] `backend/clientes/services/clientes/` → `backend/pessoas/services/pessoas/`
- [ ] `backend/clientes/services/persistence/` → `backend/pessoas/services/persistence/`
- [ ] `backend/partes-contrarias/services/` → Deprecar (usar pessoas)
- [ ] `backend/terceiros/services/` → Deprecar (usar pessoas)

#### Tipos a Migrar
- [ ] `backend/types/partes/` → `types/domain/pessoa.ts`
- [ ] `types/contracts/partes.ts` → `types/contracts/pessoa.ts`

### Frontend

#### APIs a Atualizar
- [ ] `app/api/clientes/route.ts` → Façade para `/api/pessoas`
- [ ] `app/api/partes-contrarias/route.ts` → Façade para `/api/pessoas`
- [ ] `app/api/terceiros/route.ts` → Façade para `/api/pessoas`
- [ ] `app/api/pessoas/route.ts` → Nova API principal

#### Componentes a Refatorar
- [ ] `app/(dashboard)/clientes/` → Migrar para usar `usePessoas`
- [ ] Formulários de criação/edição de clientes
- [ ] Seletores e autocompletes
- [ ] Listagens e tabelas

---

## Riscos e Mitigações

### Risco 1: Perda de Dados Durante Migração

**Mitigação:**
- Fazer backup completo antes de migrar
- Executar migração em ambiente de staging primeiro
- Manter tabelas antigas como `_archived_*` por 1 ano
- Criar tabela de mapeamento `_migration_pessoa_mapping` para rastreabilidade

### Risco 2: Breaking Changes em APIs

**Mitigação:**
- Manter APIs antigas funcionando via façade pattern
- Versionar APIs (`/api/v1/clientes`, `/api/v2/pessoas`)
- Período de convivência de 6 meses

### Risco 3: Duplicação de Pessoas

**Mitigação:**
- Adicionar constraints únicos em `cpf` e `cnpj`
- Script de detecção de duplicatas antes da migração
- Processo manual de merge de duplicatas

### Risco 4: Performance de Queries

**Mitigação:**
- Criar índices apropriados em `pessoas` (CPF, CNPJ, nome com trigram)
- Monitorar slow queries durante migração
- Manter queries antigas otimizadas durante período de transição

---

## Cronograma Estimado

| Fase | Atividade | Duração | Responsável |
|------|-----------|---------|-------------|
| 1 | Criar tipos e schemas | 1 semana | Backend |
| 2 | Implementar serviços e APIs | 2 semanas | Backend |
| 3 | Migração de dados (staging) | 1 semana | Backend/DBA |
| 4 | Atualizar frontend gradualmente | 4 semanas | Frontend |
| 5 | Validação e testes | 2 semanas | QA |
| 6 | Deploy em produção | 1 semana | DevOps |
| 7 | Período de convivência | 6 meses | Todos |
| 8 | Remoção de código legacy | 1 semana | Backend |

**Total**: ~3 meses de desenvolvimento + 6 meses de convivência

---

## Checklist de Implementação

### Fase 1: Preparação
- [ ] Criar `types/domain/pessoa.ts`
- [ ] Criar `types/contracts/pessoa.ts`
- [ ] Criar migração SQL para tabela `pessoas`
- [ ] Adicionar aliases deprecated nos tipos antigos
- [ ] Documentar arquitetura nova no `CLAUDE.md`

### Fase 2: Backend
- [ ] Criar `backend/pessoas/services/pessoas/`
- [ ] Criar `backend/pessoas/services/persistence/`
- [ ] Criar `backend/pessoas/mappers/`
- [ ] Criar API `/api/pessoas`
- [ ] Atualizar APIs antigas para usar façade

### Fase 3: Dados
- [ ] Script de migração de dados (staging)
- [ ] Validar integridade de dados migrados
- [ ] Criar tabela de mapeamento
- [ ] Atualizar `processo_partes` com `pessoa_id`
- [ ] Deploy em produção

### Fase 4: Frontend
- [ ] Criar hooks `usePessoas`, `useCriarPessoa`, etc.
- [ ] Atualizar páginas de listagem
- [ ] Atualizar formulários
- [ ] Atualizar componentes compartilhados
- [ ] Testes E2E

### Fase 5: Deprecação
- [ ] Adicionar warnings de deprecação
- [ ] Atualizar documentação
- [ ] Comunicar mudança para equipe
- [ ] Monitorar uso de APIs antigas
- [ ] Remover código legacy (após 6 meses)

---

## Conclusão

A unificação das entidades `Cliente`, `ParteContraria` e `Terceiro` em `Pessoa` é uma refatoração significativa, mas bem estruturada e de baixo risco quando executada em fases. A estratégia de compatibilidade dual garante que o sistema continue funcionando durante toda a migração, minimizando impacto em usuários e desenvolvimento paralelo.

**Próximos Passos Imediatos:**
1. Revisar este plano com a equipe técnica
2. Criar issue/ticket para Fase 1
3. Implementar Fase 1 em branch separada
4. Code review e validação de conceitos

---

**Documento criado em:** 2025-11-30
**Versão:** 1.0
**Status:** Proposta para Revisão
