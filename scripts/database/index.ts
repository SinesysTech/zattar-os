/**
 * Scripts de Banco de Dados
 * 
 * Scripts de gestão, manutenção e população do banco de dados PostgreSQL (Supabase).
 * 
 * IMPORTANTE: Scripts de DESENVOLVIMENTO apenas.
 * Não executam automaticamente em produção.
 * 
 * @module scripts/database
 */

/**
 * Estrutura
 * =========
 * 
 * database/
 * ├── migrations/     # Gestão de migrations
 * │   ├── apply-migrations-via-supabase-sdk.ts
 * │   ├── check-applied-migrations.ts
 * │   ├── apply-locks-migration.ts
 * │   ├── apply-rls-simple.ts
 * │   └── organize-migrations.ts
 * └── population/     # População de dados
 *     ├── populate-database.ts
 *     └── populate-tabelas-auxiliares-audiencias.ts
 * 
 * 
 * Migrations (`migrations/`)
 * ==========================
 * 
 * Scripts para aplicar e gerenciar migrations do Supabase.
 * 
 * Principais scripts:
 * 
 * 1. **check-applied-migrations.ts**
 *    Verifica quais migrations foram aplicadas
 *    ```bash
 *    npx tsx scripts/database/migrations/check-applied-migrations.ts
 *    ```
 * 
 * 2. **apply-migrations-via-supabase-sdk.ts**
 *    Aplica migrations pendentes via SDK do Supabase
 *    ```bash
 *    npx tsx scripts/database/migrations/apply-migrations-via-supabase-sdk.ts
 *    ```
 * 
 * 3. **apply-locks-migration.ts**
 *    Aplica migration específica de locks (Redis)
 *    ```bash
 *    npx tsx scripts/database/migrations/apply-locks-migration.ts
 *    ```
 * 
 * 4. **apply-rls-simple.ts**
 *    Aplica Row Level Security (RLS) simplificado
 *    ```bash
 *    npx tsx scripts/database/migrations/apply-rls-simple.ts
 *    ```
 * 
 * 5. **organize-migrations.ts**
 *    Organiza migrations em aplicadas/não-aplicadas
 *    ```bash
 *    npx tsx scripts/database/migrations/organize-migrations.ts
 *    ```
 * 
 * 
 * População (`population/`)
 * =========================
 * 
 * Scripts para popular o banco com dados de teste ou produção.
 * 
 * 1. **populate-database.ts**
 *    Popula banco com resultados de capturas
 *    - Lê JSONs de scripts/results/
 *    - Insere processos no acervo
 *    - Ignora duplicados
 *    ```bash
 *    npx tsx scripts/database/population/populate-database.ts
 *    ```
 * 
 * 2. **populate-tabelas-auxiliares-audiencias.ts**
 *    Popula tabelas auxiliares de audiências
 *    - Tipos de audiência
 *    - Situações
 *    - Outros metadados
 *    ```bash
 *    npx tsx scripts/database/population/populate-tabelas-auxiliares-audiencias.ts
 *    ```
 * 
 * 
 * Pré-requisitos
 * ==============
 * 
 * Variáveis de ambiente (.env.local):
 * ```bash
 * NEXT_PUBLIC_SUPABASE_URL=
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=
 * SUPABASE_SERVICE_ROLE_KEY=  # Necessário para migrations
 * ```
 * 
 * 
 * Fluxo de Trabalho - Migrations
 * ===============================
 * 
 * 1. Desenvolver migration em supabase/migrations/
 * 2. Testar localmente com Supabase CLI:
 *    ```bash
 *    supabase db reset
 *    ```
 * 3. Verificar status:
 *    ```bash
 *    npx tsx scripts/database/migrations/check-applied-migrations.ts
 *    ```
 * 4. Aplicar em staging/produção:
 *    ```bash
 *    supabase db push
 *    ```
 * 
 * 
 * Fluxo de Trabalho - População
 * ==============================
 * 
 * 1. Executar captura de dados:
 *    ```bash
 *    npx tsx scripts/captura/acervo-geral/test-api-acervo-geral.ts
 *    ```
 * 2. Resultados salvos em scripts/results/
 * 3. Popular banco:
 *    ```bash
 *    npx tsx scripts/database/population/populate-database.ts
 *    ```
 * 
 * 
 * Notas Importantes
 * =================
 * 
 * ⚠️ **Migrations**
 * - NUNCA edite migrations já aplicadas
 * - Crie nova migration para correções
 * - Use supabase/schemas/ para referência
 * - Teste sempre localmente primeiro
 * 
 * ⚠️ **População**
 * - Scripts de população podem ser destrutivos
 * - Sempre verifique dados antes de popular
 * - Use transações quando possível
 * - Faça backup antes de popular produção
 * 
 * ⚠️ **SERVICE_ROLE_KEY**
 * - Tem acesso TOTAL ao banco
 * - Ignora RLS
 * - NUNCA exponha em frontend
 * - Use apenas em scripts backend
 * 
 * 
 * Troubleshooting
 * ===============
 * 
 * Erro: "Migration já aplicada"
 * → Verifique supabase_migrations.schema_migrations
 * 
 * Erro: "Constraint violation"
 * → Verifique se há dados conflitantes
 * → Use UPSERT em vez de INSERT quando apropriado
 * 
 * Erro: "Permission denied"
 * → Verifique se está usando SERVICE_ROLE_KEY
 * → Verifique RLS policies
 * 
 * 
 * Referências
 * ===========
 * 
 * - Supabase Migrations: https://supabase.com/docs/guides/cli/local-development
 * - Schemas SQL: supabase/schemas/
 * - Documentação: docs/arquitetura-sistema.md
 * 
 * @see {@link ../../supabase/migrations} Migrations do projeto
 * @see {@link ../../supabase/schemas} Schemas de referência
 */

export { };
