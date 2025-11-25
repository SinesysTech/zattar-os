# Migrations NÃO Aplicadas

Esta pasta contém migrations que **AINDA NÃO FORAM APLICADAS** no banco de dados Supabase de produção.

## ⚠️ ATENÇÃO

Estas migrations precisam ser revisadas e aplicadas manualmente:

### 1. `20251125000000_create_locks_table.sql`
**Descrição**: Cria tabela `locks` para distributed locking

**Como aplicar**:
1. Acesse: https://supabase.com/dashboard/project/cxxdivtgeslrujpfpivs/sql/new
2. Cole o conteúdo do arquivo SQL
3. Execute a query
4. Valide com: `npx tsx scripts/apply-locks-migration.ts`

### 2. `20251125000003_add_ata_audiencia_fields.sql`
**Descrição**: Adiciona campos `ata_assinada`, `ata_file_id`, etc. na tabela `audiencias`

**Como aplicar**:
1. Acesse: https://supabase.com/dashboard/project/cxxdivtgeslrujpfpivs/sql/new
2. Cole o conteúdo do arquivo SQL
3. Execute a query
4. Valide verificando se a coluna `ata_assinada` existe em `audiencias`

## Após Aplicar

Depois de aplicar uma migration:
1. Mova o arquivo para a pasta `aplicadas/`
2. Atualize este README removendo o item da lista
3. Execute `npx tsx scripts/check-applied-migrations.ts` para validar

## Total de Migrations Pendentes

**2 migrations não aplicadas**

---

_Última atualização: 2025-11-25_
