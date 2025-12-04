# Design: Tabela Unificada cadastros_pje

## Decisão: Tabela Polimórfica vs Tabelas Separadas

**Escolha**: Tabela polimórfica unificada `cadastros_pje`

**Razão**:
- Mesma pessoa pode ser cliente em um processo e parte contrária em outro
- Evita duplicação de lógica de mapeamento PJE → entidade
- Query simples: "Quais são todos os IDs PJE desta pessoa?"
- Facilita extensão para novos sistemas (ESAJ, Projudi, etc.)

## Schema Detalhado

```sql
-- Tabela unificada para mapear entidades aos seus IDs nos sistemas judiciais
create table cadastros_pje (
  id bigint generated always as identity primary key,

  -- Referência polimórfica à entidade
  tipo_entidade text not null check (tipo_entidade in ('cliente', 'parte_contraria', 'terceiro', 'representante')),
  entidade_id bigint not null,

  -- Identificação no sistema judicial
  id_pessoa_pje bigint not null,
  sistema text not null default 'pje_trt' check (sistema in ('pje_trt', 'pje_tst', 'esaj', 'projudi')),
  tribunal text not null,  -- 'TRT01', 'TRT03', 'TST', 'TJMG', etc.
  grau text check (grau in ('primeiro_grau', 'segundo_grau') or grau is null),

  -- Dados extras do cadastro (telefones PJE, emails PJE, status, etc.)
  dados_cadastro_pje jsonb default '{}',

  -- Auditoria
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraint: Mesmo id_pessoa_pje no mesmo sistema/tribunal/grau só pode existir uma vez por tipo_entidade
  constraint cadastros_pje_unique unique (tipo_entidade, id_pessoa_pje, sistema, tribunal, grau)
);

-- Índices para queries frequentes
create index idx_cadastros_pje_entidade on cadastros_pje(tipo_entidade, entidade_id);
create index idx_cadastros_pje_id_pessoa on cadastros_pje(id_pessoa_pje, sistema, tribunal);
create index idx_cadastros_pje_tribunal on cadastros_pje(tribunal, sistema);

-- Comentário descritivo
comment on table cadastros_pje is 'Mapeia entidades (clientes, partes contrárias, terceiros, representantes) aos seus múltiplos IDs nos sistemas judiciais (PJE, ESAJ, etc.). Uma pessoa pode ter IDs diferentes em cada tribunal/grau.';
```

## Fluxo de Captura Atualizado

### Antes (Arquitetura Atual - ERRADA)
```
1. Busca parte no PJE → obtém id_pessoa_pje
2. Upsert em clientes/partes_contrarias/terceiros por id_pessoa_pje
3. PROBLEMA: Cria duplicatas porque id_pessoa_pje não é único global
```

### Depois (Nova Arquitetura)
```
1. Busca parte no PJE → obtém id_pessoa_pje, CPF/CNPJ
2. Normaliza CPF/CNPJ (remove máscara)
3. Busca entidade existente por CPF/CNPJ
   - Se encontrou → UPDATE dados
   - Se não encontrou → INSERT nova entidade
4. Registra/atualiza cadastros_pje:
   - Upsert por (tipo_entidade, id_pessoa_pje, sistema, tribunal, grau)
   - Vincula ao entidade_id
5. Cria vínculo em processo_partes (se não existir)
```

## Migração de Dados

### Fase 1: Criar tabela cadastros_pje
```sql
-- Criar tabela vazia com estrutura correta
create table cadastros_pje (...);
```

### Fase 2: Migrar clientes
```sql
-- Clientes que têm id_pessoa_pje populado
insert into cadastros_pje (tipo_entidade, entidade_id, id_pessoa_pje, sistema, tribunal, grau)
select
  'cliente',
  id,
  id_pessoa_pje,
  'pje_trt',
  'UNKNOWN',  -- Precisamos determinar o tribunal de origem
  null
from clientes
where id_pessoa_pje is not null;
```

**PROBLEMA**: A tabela `clientes` não tem coluna `trt` ou `grau`. Precisaremos:
1. Inferir o tribunal via `processo_partes` JOIN `processos`
2. Ou aceitar que registros antigos terão tribunal='UNKNOWN'

### Fase 3: Migrar partes_contrarias
Similar a clientes, mas partes_contrarias provavelmente tem `trt`/`grau`.

### Fase 4: Migrar representantes (MAIS COMPLEXA)

A tabela `representantes` atual tem:
- 2.073 registros
- ~50 pessoas únicas (por CPF)
- Campos `trt`, `grau`, `numero_processo` por registro

**Estratégia de Deduplicação**:
```sql
-- 1. Criar tabela temporária com representantes únicos por CPF
create temp table representantes_unicos as
select distinct on (cpf)
  cpf,
  nome,
  numero_oab,
  -- ... outros campos de pessoa
from representantes
where cpf is not null
order by cpf, updated_at desc;

-- 2. Truncar e recriar representantes com estrutura correta
-- (ou criar nova tabela e migrar)

-- 3. Migrar cadastros_pje de representantes
insert into cadastros_pje (tipo_entidade, entidade_id, id_pessoa_pje, sistema, tribunal, grau)
select
  'representante',
  ru.id,  -- ID do representante único
  r.id_pessoa_pje,
  'pje_trt',
  r.trt,
  case r.grau when '1' then 'primeiro_grau' when '2' then 'segundo_grau' else null end
from representantes r
join representantes_unicos ru on r.cpf = ru.cpf
where r.id_pessoa_pje is not null;

-- 4. Atualizar processo_partes para apontar para representantes únicos
-- (via tabela de mapeamento old_id → new_id)
```

### Fase 5: Remover colunas id_pessoa_pje das tabelas de entidade
```sql
alter table clientes drop column id_pessoa_pje;
alter table partes_contrarias drop column id_pessoa_pje;
alter table terceiros drop column id_pessoa_pje;
-- representantes já foi recriada sem id_pessoa_pje
```

## Modificações nas Tabelas de Entidades

### clientes
```sql
-- Adicionar constraint de unicidade por CPF/CNPJ
alter table clientes add constraint clientes_cpf_unique unique (cpf) where cpf is not null;
alter table clientes add constraint clientes_cnpj_unique unique (cnpj) where cnpj is not null;

-- Remover id_pessoa_pje (vai para cadastros_pje)
alter table clientes drop column id_pessoa_pje;
```

### partes_contrarias
Similar a clientes.

### terceiros
Similar, mas terceiros atualmente está vazia então é mais simples.

### representantes
**BREAKING CHANGE** - Redesign completo:

```sql
-- Nova estrutura de representantes (pessoa única por CPF)
create table representantes_new (
  id bigint generated always as identity primary key,
  cpf text not null unique,
  nome text not null,
  numero_oab text,
  uf_oab text,
  situacao_oab text,
  tipo text,  -- ADVOGADO, DEFENSOR_PUBLICO, etc.
  emails jsonb,
  telefones jsonb,
  endereco_id bigint references enderecos(id),
  dados_anteriores jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Mudança de paradigma**:
- Antes: `representantes` tinha um registro por (representante, processo)
- Depois: `representantes` tem um registro por pessoa (CPF único)
- Vínculo representante↔parte fica em `processo_partes` ou nova tabela de junção

## Queries Úteis Pós-Migração

### Buscar todos os IDs PJE de um cliente
```sql
select cp.*
from cadastros_pje cp
where cp.tipo_entidade = 'cliente'
  and cp.entidade_id = :cliente_id;
```

### Buscar cliente por id_pessoa_pje de um TRT específico
```sql
select c.*
from clientes c
join cadastros_pje cp on cp.tipo_entidade = 'cliente' and cp.entidade_id = c.id
where cp.id_pessoa_pje = :id_pessoa_pje
  and cp.tribunal = :trt
  and cp.grau = :grau;
```

### Verificar se CPF já está cadastrado
```sql
select id from clientes where cpf = :cpf limit 1;
```

## Considerações de Performance

1. **Índice em CPF/CNPJ**: Queries de upsert por documento serão frequentes
2. **Índice composto em cadastros_pje**: `(id_pessoa_pje, sistema, tribunal, grau)` para lookup rápido
3. **Cache**: Considerar cache Redis para mapeamento `id_pessoa_pje → entidade_id`

## Rollback Plan

Em caso de problemas:
1. Manter backups das tabelas originais por 30 dias
2. `cadastros_pje` pode ser dropada sem afetar dados de entidades
3. Colunas `id_pessoa_pje` podem ser re-adicionadas se necessário
