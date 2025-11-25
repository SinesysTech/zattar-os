# Migrations NÃO Aplicadas

Esta pasta contém migrations que **AINDA NÃO FORAM APLICADAS** no banco de dados Supabase de produção.

## ✅ Status Atual

**Todas as migrations foram aplicadas com sucesso!**

Não há migrations pendentes no momento.

## Histórico de Aplicações Recentes

### ✅ 2025-11-25
- `20251125000000_create_locks_table.sql` - Tabela de distributed locks
- `20251125000003_add_ata_audiencia_fields.sql` - Campos de ata de audiência
- `20251125000004_fix_processo_partes_constraint.sql` - Correção da constraint unique em processo_partes

Aplicadas via MCP tool do Supabase.

## Processo para Novas Migrations

Quando uma nova migration for criada e ainda não aplicada:

1. Coloque o arquivo `.sql` nesta pasta
2. Atualize este README com a descrição da migration
3. Aplique via Supabase Dashboard ou MCP tool
4. Mova para a pasta `aplicadas/`
5. Atualize os READMEs

## Total de Migrations Pendentes

**0 migrations não aplicadas** ✅

---

_Última atualização: 2025-11-25_
