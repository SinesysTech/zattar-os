# Migrations NAO Aplicadas

Esta pasta contem migrations que **AINDA NAO FORAM APLICADAS** no banco de dados Supabase de producao.

## Status Atual

Pendentes:
- `20251201120000_add_formsign_tables.sql` — cria tabelas Formsign (segmentos, templates, formularios, sessoes e assinaturas) para a integracao de assinatura digital.

## Historico de Aplicacoes Recentes

### 2025-11-25
- `20251125000000_create_locks_table.sql` - Tabela de distributed locks
- `20251125000003_add_ata_audiencia_fields.sql` - Campos de ata de audiencia
- `20251125000004_fix_processo_partes_constraint.sql` - Correcao da constraint unique em processo_partes

Aplicadas via MCP tool do Supabase.

## Processo para Novas Migrations

Quando uma nova migration for criada e ainda nao aplicada:

1. Coloque o arquivo `.sql` nesta pasta
2. Atualize este README com a descricao da migration
3. Aplique via Supabase Dashboard ou MCP tool
4. Mova para a pasta `aplicadas/`
5. Atualize os READMEs

## Total de Migrations Pendentes

**1 migration nao aplicada** ⚠️

---

_Ultima atualizacao: 2025-12-01_
