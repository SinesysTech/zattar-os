# Guia de Migração: Implementação de cadastros_pje

Este guia detalha a implementação da tabela `cadastros_pje` para resolver o problema de duplicação de entidades causado pelo campo `id_pessoa_pje` não ser globalmente único.

## 1. Visão Geral

### Problema Atual

O campo `id_pessoa_pje` **não é globalmente único** - ele é específico por tribunal (TRT) e grau. A mesma pessoa física pode ter `id_pessoa_pje` diferentes em cada TRT onde aparece. A arquitetura atual trata `id_pessoa_pje` como chave única global, causando:

- **Duplicação massiva**: Tabela `representantes` tem 2.073 registros para ~50 pessoas distintas (562 registros só para Pedro Zattar)
- **Impossibilidade de deduplicação**: Não conseguimos identificar que dois registros com `id_pessoa_pje` diferentes são a mesma pessoa
- **Tabela terceiros vazia**: O upsert por `id_pessoa_pje` não funciona porque a lógica está errada

### Solução Proposta

- **Nova tabela polimórfica** `cadastros_pje` para mapear os múltiplos IDs PJE de cada pessoa
- **CPF/CNPJ como chave única** nas tabelas de entidades (`clientes`, `partes_contrarias`, `terceiros`, `representantes`)
- **Redesenho completo** da tabela `representantes` (BREAKING CHANGE): um registro por CPF, removendo campos de contexto de processo

### Impacto

- **BREAKING CHANGE**: Tabela `representantes` será completamente reestruturada
- **Migração complexa**: Deduplicação de representantes e preservação de vínculos com processos
- **Downtime necessário**: Requer migração de dados em produção

## 2. Pré-requisitos

### Backup Completo

Antes de qualquer ação, faça backup completo das tabelas afetadas:

```bash
# Backup via pg_dump
pg_dump -h localhost -U postgres -d sinesys --table=clientes --table=partes_contrarias --table=terceiros --table=representantes --table=processo_partes --format=custom --file=backup_pre_migracao.backup

# Ou via Supabase CLI
supabase db dump --db-url="$DATABASE_URL" --schema=public --table=clientes,partes_contrarias,terceiros,representantes,processo_partes > backup_pre_migracao.sql
```

### Ambiente de Teste

- Configure ambiente de desenvolvimento idêntico ao produção
- Execute todas as migrations e validações no ambiente de teste primeiro
- Teste cenários de captura com dados reais

### Validação de Dados Existentes

Execute queries de análise antes da migração:

```sql
-- Contagem de registros por entidade
SELECT 'clientes' as tabela, COUNT(*) as total FROM clientes
UNION ALL
SELECT 'partes_contrarias', COUNT(*) FROM partes_contrarias
UNION ALL
SELECT 'terceiros', COUNT(*) FROM terceiros
UNION ALL
SELECT 'representantes', COUNT(*) FROM representantes;

-- Análise de duplicação de representantes por CPF
SELECT cpf, COUNT(*) as duplicatas
FROM representantes
WHERE cpf IS NOT NULL
GROUP BY cpf
HAVING COUNT(*) > 1
ORDER BY duplicatas DESC;
```

## 3. Ordem de Execução

A migração é dividida em 7 fases sequenciais. Execute uma fase por vez e valide antes de prosseguir.

### Fase 1: Preparação (1 dia)
- Fazer backups completos
- Executar análises de dados
- Criar scripts de validação

### Fase 2: Criar Estrutura (0.5 dia)
```bash
# Executar migration
supabase migration up --include-all
# Ou manualmente
psql -f supabase/migrations/nao-aplicadas/20251128000001_create_cadastros_pje.sql
```

### Fase 3: Migrar Dados (1.5 dias)
```bash
# Ordem específica - respeitar dependências
psql -f supabase/migrations/nao-aplicadas/20251128000002_migrate_clientes_to_cadastros_pje.sql
psql -f supabase/migrations/nao-aplicadas/20251128000003_migrate_partes_contrarias_to_cadastros_pje.sql
psql -f supabase/migrations/nao-aplicadas/20251128000004_migrate_terceiros_to_cadastros_pje.sql
psql -f supabase/migrations/nao-aplicadas/20251128000005_migrate_representantes_deduplication.sql  # MAIS COMPLEXA
```

### Fase 4: Atualizar Schemas (0.5 dia)
```bash
psql -f supabase/migrations/nao-aplicadas/20251128000006_add_cpf_cnpj_unique_constraints.sql
psql -f supabase/migrations/nao-aplicadas/20251128000007_remove_id_pessoa_pje_from_entities.sql
```

### Fase 5: Atualizar Código (1 dia)
- Deploy das mudanças em tipos TypeScript
- Deploy dos serviços de persistência atualizados
- Deploy do serviço de captura modificado

### Fase 6: Testes e Validação (1 dia)
- Executar script de validação
- Testar cenários de captura
- Validar queries de produção

### Fase 7: Limpeza (após 30 dias)
- Remover tabelas temporárias
- Dropar backups antigos

## 4. Validação

### Executar Script de Validação

```bash
# Executar validação completa
npx tsx scripts/database/validate-cadastros-pje-migration.ts
```

### Métricas Principais

O script verifica:

1. **Contagem de registros**:
   - `cadastros_pje` deve ter pelo menos a soma dos `id_pessoa_pje` únicos das tabelas originais
   - Exemplo: Se `clientes` tinha 100 `id_pessoa_pje` únicos, `cadastros_pje` deve ter >=100 registros para `tipo_entidade='cliente'`

2. **Integridade referencial**:
   - Todos os `entidade_id` em `cadastros_pje` devem existir na tabela correspondente
   - Query: `SELECT COUNT(*) FROM cadastros_pje cp LEFT JOIN clientes c ON cp.entidade_id = c.id WHERE cp.tipo_entidade='cliente' AND c.id IS NULL;`

3. **Unicidade**:
   - Não deve haver duplicatas na constraint UNIQUE de `cadastros_pje`
   - Representantes devem ser únicos por CPF

4. **Deduplicação de representantes**:
   - Contar representantes únicos: `SELECT COUNT(DISTINCT cpf) FROM representantes;`
   - Verificar que `processo_partes` aponta para IDs válidos

### Interpretando Resultados

- **PASS**: Todas as validações passaram - pode prosseguir
- **FAIL**: Verificar logs detalhados e resolver problemas antes de continuar
- **WARN**: Atenção necessária, mas pode prosseguir com cuidado

## 5. Rollback

### Quando Fazer Rollback

- Se validação falhar criticamente
- Se bugs em produção impedirem operação normal
- Se downtime exceder tempo planejado

### Executar Rollback

```bash
# ATENÇÃO: Só executar com --confirm
npx tsx scripts/database/rollback-cadastros-pje-migration.ts --confirm
```

O script de rollback:
1. Restaura tabela `representantes` da backup
2. Reverte `processo_partes` para IDs antigos
3. Re-adiciona colunas `id_pessoa_pje` nas entidades
4. Remove constraints de unicidade por CPF/CNPJ

### Validar Rollback

Após rollback, execute queries para confirmar restauração:

```sql
-- Verificar que representantes voltou ao estado original
SELECT COUNT(*) FROM representantes;  -- Deve ser ~2073 novamente

-- Verificar que id_pessoa_pje voltou
SELECT COUNT(*) FROM clientes WHERE id_pessoa_pje IS NOT NULL;

-- Testar upsert antigo (deve funcionar novamente)
```

## 6. Testes

### Cenários de Captura de Partes

1. **Cliente existente em mesmo TRT**:
   - Processo: Mesmo cliente em processo diferente no mesmo TRT
   - Esperado: Atualizar dados do cliente, adicionar novo registro em `cadastros_pje`

2. **Cliente existente em TRT diferente**:
   - Processo: Mesmo cliente (CPF) em TRT diferente
   - Esperado: Atualizar dados do cliente, adicionar registro em `cadastros_pje` com tribunal diferente

3. **Novo cliente**:
   - Processo: Cliente nunca visto antes
   - Esperado: Criar novo cliente, criar registro em `cadastros_pje`

### Cenários de Representantes

1. **Representante existente**:
   - Mesmo CPF em processo diferente
   - Esperado: Não criar novo representante, apenas vincular em `processo_partes`

2. **Novo representante**:
   - CPF nunca visto
   - Esperado: Criar representante único, registrar em `cadastros_pje`

### Cenários de Queries

1. **Buscar entidade por id_pessoa_pje**:
   ```sql
   SELECT c.* FROM clientes c
   JOIN cadastros_pje cp ON cp.tipo_entidade='cliente' AND cp.entidade_id=c.id
   WHERE cp.id_pessoa_pje = 12345 AND cp.tribunal='TRT01' AND cp.grau='primeiro_grau';
   ```

2. **Listar todos os IDs PJE de uma pessoa**:
   ```sql
   SELECT * FROM cadastros_pje WHERE tipo_entidade='cliente' AND entidade_id = :cliente_id;
   ```

3. **Buscar por CPF**:
   ```sql
   SELECT * FROM clientes WHERE cpf = '12345678901';
   ```

## 7. Troubleshooting

### Problemas Comuns

1. **Constraint violation em cadastros_pje**:
   - Causa: Mesmo `id_pessoa_pje` tentando ser inserido duas vezes
   - Solução: Verificar se migration está usando `ON CONFLICT DO NOTHING`

2. **Representante não encontrado após deduplicação**:
   - Causa: `processo_partes` ainda aponta para ID antigo
   - Solução: Verificar se mapeamento old→new foi aplicado corretamente

3. **CPF duplicado**:
   - Causa: Mesmo CPF em registros diferentes com dados conflitantes
   - Solução: Resolver manualmente antes da migração

### Identificar Duplicatas por CPF/CNPJ

```sql
-- Clientes com CPF duplicado
SELECT cpf, COUNT(*), array_agg(id) as ids
FROM clientes
WHERE cpf IS NOT NULL
GROUP BY cpf
HAVING COUNT(*) > 1;

-- Mesmo para CNPJ, partes_contrarias, terceiros, representantes
```

### Resolver Conflitos de Dados

Para conflitos em representantes:

```sql
-- Ver registros conflitantes
SELECT * FROM representantes WHERE cpf = '12345678901' ORDER BY updated_at DESC;

-- Estratégia: Manter registro mais recente, salvar dados antigos em dados_anteriores
UPDATE representantes SET dados_anteriores = row_to_json(OLD) WHERE id = :old_id;
DELETE FROM representantes WHERE id = :old_id;
```

## 8. Referências

### Documentos de Especificação
- [Proposal: Criar Tabela Unificada cadastros_pje](openspec/changes/add-cadastros-pje-table/proposal.md)
- [Design: Tabela Unificada cadastros_pje](openspec/changes/add-cadastros-pje-table/design.md)
- [Tasks: Implementar cadastros_pje](openspec/changes/add-cadastros-pje-table/tasks.md)
- [Spec: Database Partes](openspec/database-partes/spec.md)

### Código Relacionado
- Migrations: `supabase/migrations/nao-aplicadas/20251128000001_*`
- Tipos: `backend/types/partes/cadastros-pje-types.ts`
- Serviço: `backend/cadastros-pje/services/persistence/cadastro-pje-persistence.service.ts`
- Captura: `backend/captura/services/partes/partes-capture.service.ts`
- Validação: `scripts/database/validate-cadastros-pje-migration.ts`
- Rollback: `scripts/database/rollback-cadastros-pje-migration.ts`

### Diagramas

```
Antes (ERRADO):
Processo PJE → id_pessoa_pje → Upsert entidade → DUPLICATAS

Depois (CORRETO):
Processo PJE → CPF/CNPJ → Upsert entidade → Registrar em cadastros_pje
                                      ↓
                            entidade_id ← id_pessoa_pje + tribunal + grau
```

---

**Estimativa Total**: 6 dias de implementação + 30 dias de observação
**Riscos**: Breaking change em representantes, migração complexa
**Contato**: Em caso de dúvidas, consulte a equipe de desenvolvimento