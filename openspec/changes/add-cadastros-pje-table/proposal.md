# Proposta: Criar Tabela Unificada cadastros_pje

## Why

O campo `id_pessoa_pje` **NÃO é globalmente único** - ele é específico por tribunal (TRT) e grau. A mesma pessoa física (ex: Pedro Zattar) tem `id_pessoa_pje` diferentes em cada TRT onde aparece. A arquitetura atual trata `id_pessoa_pje` como chave única global, causando:

1. **Duplicação massiva**: A tabela `representantes` tem 2.073 registros para ~50 pessoas distintas (562 registros só para Pedro Zattar - um por processo!)
2. **Impossibilidade de deduplicação**: Não conseguimos identificar que dois registros com `id_pessoa_pje` diferentes são a mesma pessoa
3. **Tabela terceiros vazia**: O upsert por `id_pessoa_pje` não funciona porque a lógica está errada

## What Changes

### 1. **NOVA TABELA** `cadastros_pje` (Unificada para todas as entidades)

Tabela polimórfica que registra os múltiplos IDs que uma pessoa tem nos sistemas PJE:

```sql
create table cadastros_pje (
  id bigint generated always as identity primary key,
  tipo_entidade text not null,           -- 'cliente', 'parte_contraria', 'terceiro', 'representante'
  entidade_id bigint not null,           -- FK polimórfica para a tabela correspondente
  id_pessoa_pje bigint not null,         -- ID da pessoa no PJE (específico do sistema/tribunal/grau)
  sistema text not null default 'pje_trt', -- 'pje_trt', 'pje_tst', 'esaj', 'projudi'
  tribunal text not null,                -- 'TRT01', 'TRT03', 'TST', etc.
  grau text,                             -- 'primeiro_grau', 'segundo_grau', null
  dados_cadastro_pje jsonb,              -- Dados extras do cadastro no PJE
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(tipo_entidade, id_pessoa_pje, sistema, tribunal, grau)
);
```

### 2. **MODIFICAÇÃO** nas tabelas de entidades

- `clientes`: Remover `id_pessoa_pje` (vai para `cadastros_pje`). CPF/CNPJ como chave única.
- `partes_contrarias`: Remover `id_pessoa_pje`. CPF/CNPJ como chave única.
- `terceiros`: Remover `id_pessoa_pje`. CPF/CNPJ como chave única.
- `representantes`: **BREAKING** - Redesenhar completamente. Remover campos `trt`, `grau`, `numero_processo`. CPF como chave única.

### 3. **MODIFICAÇÃO** na lógica de captura

- Upsert de pessoas por CPF/CNPJ (não mais por `id_pessoa_pje`)
- Após upsert, registrar o `id_pessoa_pje` na `cadastros_pje`
- Vínculo com processo via `processo_partes` (já existe)

## Impact

### Specs Afetadas
- `database-partes/spec.md` - Adicionar spec de `cadastros_pje`
- `processo-partes/spec.md` - Atualizar para refletir nova arquitetura

### Código Afetado
- `backend/captura/services/partes/partes-capture.service.ts` - Lógica de upsert
- `backend/clientes/services/persistence/` - Remover referência a `id_pessoa_pje`
- `backend/partes/services/` - Partes contrárias e terceiros
- `backend/types/partes/` - Todos os tipos de partes
- `backend/api/pje-trt/partes/` - Extração de dados

### Migração de Dados
- **1.813 clientes**: Extrair `id_pessoa_pje` para `cadastros_pje`
- **201 partes_contrarias**: Extrair `id_pessoa_pje` para `cadastros_pje`
- **2.073 representantes**: DEDUPLICAR por CPF, criar ~50 registros únicos, migrar `id_pessoa_pje` para `cadastros_pje`
- **0 terceiros**: Sem dados para migrar

### Riscos
- **BREAKING**: Tabela `representantes` será completamente reestruturada
- **Migração complexa**: Precisa deduplicar representantes e preservar vínculos com processos
- **Downtime**: Requer migração de dados em produção
