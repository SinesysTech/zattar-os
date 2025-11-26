# Tasks: Implementar cadastros_pje

## Fase 1: Preparação e Análise

- [ ] **1.1** Fazer backup completo das tabelas afetadas
  - `clientes`, `partes_contrarias`, `terceiros`, `representantes`, `processo_partes`
  - Salvar em formato SQL para possível rollback

- [ ] **1.2** Analisar dados atuais para determinar tribunais
  - Query para inferir tribunal de `clientes` via `processo_partes` JOIN `processos`
  - Verificar se `partes_contrarias` tem campos `trt`/`grau`
  - Documentar casos onde tribunal não pode ser determinado

- [ ] **1.3** Criar script de análise de deduplicação de representantes
  - Contar representantes únicos por CPF
  - Identificar conflitos (mesmo CPF, dados diferentes)
  - Definir estratégia de merge (usar registro mais recente? combinar dados?)

## Fase 2: Criar Nova Estrutura

- [ ] **2.1** Criar migration para tabela `cadastros_pje`
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

- [ ] **2.2** Criar índices para cadastros_pje
  - `idx_cadastros_pje_entidade` (tipo_entidade, entidade_id)
  - `idx_cadastros_pje_id_pessoa` (id_pessoa_pje, sistema, tribunal)
  - `idx_cadastros_pje_tribunal` (tribunal, sistema)

- [ ] **2.3** Habilitar RLS em cadastros_pje
  - Política para select (authenticated)
  - Política para insert/update (authenticated)

## Fase 3: Migração de Dados

- [ ] **3.1** Migrar clientes para cadastros_pje
  - Inferir tribunal via processos vinculados
  - Inserir registros em cadastros_pje
  - Tratar casos sem tribunal conhecido (usar 'UNKNOWN' ou pular)

- [ ] **3.2** Migrar partes_contrarias para cadastros_pje
  - Verificar se tabela tem campos trt/grau
  - Inserir registros em cadastros_pje

- [ ] **3.3** Preparar deduplicação de representantes
  - Criar tabela temporária `representantes_unicos`
  - Mapear old_id → new_id
  - Validar que todos os CPFs são válidos

- [ ] **3.4** Migrar representantes para cadastros_pje
  - Criar nova tabela `representantes_v2` com estrutura correta
  - Inserir representantes únicos
  - Popular cadastros_pje com todos os id_pessoa_pje de cada representante
  - Atualizar processo_partes para apontar para novos IDs

- [ ] **3.5** Validar migração
  - Contar registros: cadastros_pje deve ter >= soma de id_pessoa_pje únicos
  - Verificar integridade referencial
  - Testar queries de lookup por id_pessoa_pje

## Fase 4: Atualizar Estrutura das Tabelas de Entidades

- [ ] **4.1** Adicionar constraints de unicidade por CPF/CNPJ
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

- [ ] **4.2** Remover coluna id_pessoa_pje das tabelas de entidade
  - Apenas APÓS migração completa validada
  - `alter table clientes drop column id_pessoa_pje;`
  - `alter table partes_contrarias drop column id_pessoa_pje;`
  - `alter table terceiros drop column id_pessoa_pje;`

- [ ] **4.3** Substituir tabela representantes
  - Renomear `representantes` → `representantes_old`
  - Renomear `representantes_v2` → `representantes`
  - Atualizar foreign keys em outras tabelas

## Fase 5: Atualizar Código de Captura

- [ ] **5.1** Criar tipos TypeScript para cadastros_pje
  - `CadastroPJE` interface
  - `CriarCadastroPJEParams` interface
  - `TipoEntidadeCadastroPJE` type

- [ ] **5.2** Criar serviço de persistência cadastros_pje
  - `criarCadastroPJE()`
  - `buscarCadastroPJE()`
  - `upsertCadastroPJE()`
  - `buscarEntidadePorIdPessoaPJE()`

- [ ] **5.3** Atualizar partes-capture.service.ts
  - Alterar lógica de upsert: buscar por CPF/CNPJ primeiro
  - Após upsert de entidade, registrar em cadastros_pje
  - Remover referências a `id_pessoa_pje` nas entidades

- [ ] **5.4** Atualizar tipos de clientes, partes_contrarias, terceiros
  - Remover `id_pessoa_pje` das interfaces
  - Adicionar constraint de CPF/CNPJ nos tipos

- [ ] **5.5** Atualizar tipos e persistência de representantes
  - Redesenhar interfaces para estrutura única por CPF
  - Remover campos `trt`, `grau`, `numero_processo`
  - Atualizar serviços de persistência

## Fase 6: Testes e Validação

- [ ] **6.1** Testar captura de processo existente
  - Verificar que cliente existente é atualizado (não duplicado)
  - Verificar que cadastros_pje é populado corretamente

- [ ] **6.2** Testar captura de processo de TRT diferente
  - Mesma pessoa (CPF) em TRT diferente
  - Deve criar novo registro em cadastros_pje
  - Não deve criar nova entidade

- [ ] **6.3** Testar lookup por id_pessoa_pje
  - Dado id_pessoa_pje + tribunal + grau, encontrar entidade correta

- [ ] **6.4** Testar representantes deduplicados
  - Verificar que processo_partes aponta para representante correto
  - Verificar que não há duplicatas por CPF

## Fase 7: Limpeza

- [ ] **7.1** Remover tabela representantes_old (após 30 dias)
- [ ] **7.2** Remover backups (após validação completa)
- [ ] **7.3** Atualizar documentação (CLAUDE.md, specs)

---

## Ordem de Execução Recomendada

1. **Fase 1** (1 dia) - Preparação
2. **Fase 2** (0.5 dia) - Criar cadastros_pje
3. **Fase 3.1-3.2** (0.5 dia) - Migrar clientes e partes_contrarias
4. **Fase 5.1-5.2** (0.5 dia) - Criar tipos e serviço cadastros_pje
5. **Fase 3.3-3.5** (1 dia) - Migrar representantes (mais complexo)
6. **Fase 5.3-5.5** (1 dia) - Atualizar código de captura
7. **Fase 4** (0.5 dia) - Atualizar estrutura das tabelas
8. **Fase 6** (1 dia) - Testes completos
9. **Fase 7** (após 30 dias) - Limpeza

**Estimativa total**: ~6 dias de trabalho + 30 dias de observação antes de limpeza final
