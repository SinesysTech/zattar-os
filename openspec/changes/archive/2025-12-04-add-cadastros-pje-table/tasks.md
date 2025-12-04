# Tasks: Implementar cadastros_pje

## Fase 1: Preparação e Análise

- [x] **1.1** Fazer backup completo das tabelas afetadas
  - `clientes`, `partes_contrarias`, `terceiros`, `representantes`, `processo_partes`
  - Salvar em formato SQL para possível rollback
  - **Status**: Concluído e sem problemas

- [x] **1.2** Analisar dados atuais para determinar tribunais
  - Query para inferir tribunal de `clientes` via `processo_partes` JOIN `processos`
  - Verificar se `partes_contrarias` tem campos `trt`/`grau`
  - Documentar casos onde tribunal não pode ser determinado
  - **Status**: Concluído - 100% dos registros com tribunal identificado
  - **Script**: `scripts/sincronizacao/resolver-cadastros-pje-unknown.ts`
  - **Resultado**: 434 registros atualizados + 171 duplicados removidos = 0 UNKNOWN restantes

- [x] **1.3** Criar script de análise de deduplicação de representantes
  - Contar representantes únicos por CPF
  - Identificar conflitos (mesmo CPF, dados diferentes)
  - Definir estratégia de merge (usar registro mais recente? combinar dados?)
  - **Status**: Concluído durante migração (migration 20251128000005)
  - **Resultado**: Representantes deduplicados por CPF, tabela reestruturada com constraint UNIQUE

## Fase 2: Criar Nova Estrutura

- [x] **2.1** Criar migration para tabela `cadastros_pje`
  ```sql
  create table cadastros_pje (
    id bigint generated always as identity primary key,
    tipo_entidade text not null,
    entidade_id bigint not null,
    id_pessoa_pje bigint not null,
    sistema text not null default 'pje_trt',
    tribunal text not null,
    grau text,
    dados_cadastro_pje jsonb default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint cadastros_pje_unique unique (tipo_entidade, id_pessoa_pje, sistema, tribunal, grau)
  );
  ```
  - **Status**: Concluído - migration `20251128000001_create_cadastros_pje.sql`

- [x] **2.2** Criar índices para cadastros_pje
  - `idx_cadastros_pje_entidade` (tipo_entidade, entidade_id)
  - `idx_cadastros_pje_id_pessoa` (id_pessoa_pje, sistema, tribunal)
  - `idx_cadastros_pje_tribunal` (tribunal, sistema)
  - **Status**: Concluído - índices criados na migration

- [x] **2.3** Habilitar RLS em cadastros_pje
  - Política para select (authenticated)
  - Política para insert/update (authenticated)
  - **Status**: Concluído

## Fase 3: Migração de Dados

- [x] **3.1** Migrar clientes para cadastros_pje
  - Inferir tribunal via processos vinculados
  - Inserir registros em cadastros_pje
  - Tratar casos sem tribunal conhecido (usar 'UNKNOWN' ou pular)
  - **Status**: Concluído - migration `20251128000002_migrate_clientes_to_cadastros_pje.sql`
  - **Resultado**: 10.383 registros de clientes migrados

- [x] **3.2** Migrar partes_contrarias para cadastros_pje
  - Verificar se tabela tem campos trt/grau
  - Inserir registros em cadastros_pje
  - **Status**: Concluído - migration `20251128000003_migrate_partes_contrarias_to_cadastros_pje.sql`
  - **Resultado**: 1.109 registros de partes contrárias migrados

- [x] **3.3** Preparar deduplicação de representantes
  - Criar tabela temporária `representantes_unicos`
  - Mapear old_id → new_id
  - Validar que todos os CPFs são válidos
  - **Status**: Concluído - migration `20251128000005_migrate_representantes_deduplication.sql`

- [x] **3.4** Migrar representantes para cadastros_pje
  - Criar nova tabela `representantes_v2` com estrutura correta
  - Inserir representantes únicos
  - Popular cadastros_pje com todos os id_pessoa_pje de cada representante
  - Atualizar processo_partes para apontar para novos IDs
  - **Status**: Concluído - 98 registros de representantes migrados

- [x] **3.5** Validar migração
  - Contar registros: cadastros_pje deve ter >= soma de id_pessoa_pje únicos
  - Verificar integridade referencial
  - Testar queries de lookup por id_pessoa_pje
  - **Status**: Concluído - 11.519 registros totais em cadastros_pje (após limpeza de UNKNOWN)

## Fase 4: Atualizar Estrutura das Tabelas de Entidades

- [x] **4.1** Adicionar constraints de unicidade por CPF/CNPJ
  ```sql
  -- clientes
  alter table clientes add constraint clientes_cpf_unique
    unique (cpf) where (cpf is not null);
  alter table clientes add constraint clientes_cnpj_unique
    unique (cnpj) where (cnpj is not null);

  -- partes_contrarias
  alter table partes_contrarias add constraint partes_contrarias_cpf_unique
    unique (cpf) where (cpf is not null);
  -- etc.
  ```
  - **Status**: Concluído - constraints verificadas no banco

- [x] **4.2** Remover coluna id_pessoa_pje das tabelas de entidade
  - Apenas APÓS migração completa validada
  - `alter table clientes drop column id_pessoa_pje;`
  - `alter table partes_contrarias drop column id_pessoa_pje;`
  - `alter table terceiros drop column id_pessoa_pje;`
  - **Status**: Concluído - migration `20251128000007_remove_id_pessoa_pje_from_entities.sql`

- [x] **4.3** Substituir tabela representantes
  - Renomear `representantes` → `representantes_old`
  - Renomear `representantes_v2` → `representantes`
  - Atualizar foreign keys em outras tabelas
  - **Status**: Concluído - nova estrutura de representantes ativa

## Fase 5: Atualizar Código de Captura

- [x] **5.1** Criar tipos TypeScript para cadastros_pje
  - `CadastroPJE` interface
  - `CriarCadastroPJEParams` interface
  - `TipoEntidadeCadastroPJE` type
  - **Status**: Concluído - `backend/types/partes/cadastros-pje-types.ts`

- [x] **5.2** Criar serviço de persistência cadastros_pje
  - `criarCadastroPJE()`
  - `buscarCadastroPJE()`
  - `upsertCadastroPJE()`
  - `buscarEntidadePorIdPessoaPJE()`
  - **Status**: Concluído - `backend/cadastros-pje/services/persistence/cadastro-pje-persistence.service.ts`

- [x] **5.3** Atualizar partes-capture.service.ts
  - Alterar lógica de upsert: buscar por CPF/CNPJ primeiro
  - Após upsert de entidade, registrar em cadastros_pje
  - Remover referências a `id_pessoa_pje` nas entidades
  - **Status**: Concluído - código usa `upsertCadastroPJE` e `buscarEntidadePorIdPessoaPJE`

- [x] **5.4** Atualizar tipos de clientes, partes_contrarias, terceiros
  - Remover `id_pessoa_pje` das interfaces
  - Adicionar constraint de CPF/CNPJ nos tipos
  - **Status**: Concluído

- [x] **5.5** Atualizar tipos e persistência de representantes
  - Redesenhar interfaces para estrutura única por CPF
  - Remover campos `trt`, `grau`, `numero_processo`
  - Atualizar serviços de persistência
  - **Status**: Concluído

## Fase 6: Testes e Validação

- [x] **6.1** Testar captura de processo existente
  - Verificar que cliente existente é atualizado (não duplicado)
  - Verificar que cadastros_pje é populado corretamente
  - **Status**: Concluído - validado em produção

- [x] **6.2** Testar captura de processo de TRT diferente
  - Mesma pessoa (CPF) em TRT diferente
  - Deve criar novo registro em cadastros_pje
  - Não deve criar nova entidade
  - **Status**: Concluído - validado em produção

- [x] **6.3** Testar lookup por id_pessoa_pje
  - Dado id_pessoa_pje + tribunal + grau, encontrar entidade correta
  - **Status**: Concluído - função `buscarEntidadePorIdPessoaPJE` operacional

- [x] **6.4** Testar representantes deduplicados
  - Verificar que processo_partes aponta para representante correto
  - Verificar que não há duplicatas por CPF
  - **Status**: Concluído - constraint UNIQUE em CPF garante unicidade

## Fase 7: Melhorias de Representantes

- [x] **7.1** Popular vínculos de representantes em processo_partes
  - Extrair dados de `dados_pje_completo->'representantes'`
  - Criar entradas com `tipo_entidade='representante'` em processo_partes
  - Atualizar constraint `processo_partes_tipo_entidade_check` para incluir 'representante'
  - **Status**: Concluído - migration `20251204150000_populate_representantes_vinculos.sql`
  - **Resultado**: 29.892 vínculos criados + 688 cadastros_pje para representantes
  - **Índice**: `idx_processo_partes_representante_entidade` criado

- [x] **7.2** Transformar campo OAB em JSONB (array de OABs)
  - Advogados podem ter OAB em múltiplos estados
  - Nova coluna `oabs` JSONB: `[{"numero": "MG128404", "uf": "MG", "situacao": "REGULAR"}]`
  - Popular com dados existentes + dados de `dados_pje_completo`
  - **Status**: Concluído - migration `20251204160000_transform_oab_to_jsonb.sql`
  - **Resultado**: Até 9 OABs por representante (ex: Raissa Bressanim)
  - **Índice GIN**: `idx_representantes_oabs` criado para buscas

## Fase 8: Limpeza

- [x] **8.1** Remover tabela representantes_old
  - **Status**: Concluído - tabela já foi removida
  - **Verificação**: Tabela não existe mais no banco

- [x] **8.2** Remover colunas antigas de OAB (numero_oab, uf_oab, situacao_oab)
  - **Status**: Concluído - migration `20251204170000_remove_old_oab_columns.sql`

- [x] **8.3** Remover backups (após validação completa)
  - **Status**: Concluído - 2024-12-04
  - **Removidos**: `partes-contrarias-types.ts.backup`, `audiencias/page.tsx.backup`
  - **Verificação**: Nenhuma tabela de backup existe no banco

- [x] **8.4** Atualizar documentação (CLAUDE.md, specs)
  - **Status**: Concluído - 2024-12-04

---

## Resumo de Execução

| Fase | Status | Observações |
|------|--------|-------------|
| Fase 1 | ✅ Concluído | Backup + análise de tribunais (0 UNKNOWN) |
| Fase 2 | ✅ Concluído | Tabela, índices e RLS criados |
| Fase 3 | ✅ Concluído | 11.519 registros migrados |
| Fase 4 | ✅ Concluído | Constraints e remoção de id_pessoa_pje |
| Fase 5 | ✅ Concluído | Tipos e código de captura atualizados |
| Fase 6 | ✅ Concluído | Validado em produção |
| Fase 7 | ✅ Concluído | 29.892 vínculos + OAB JSONB |
| Fase 8 | ✅ Concluído | Backups removidos, documentação atualizada |

**Data de conclusão das fases 1-6**: 2024-11-28
**Data de conclusão da fase 7**: 2024-12-04
**Data de conclusão da fase 8**: 2024-12-04
