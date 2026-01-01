/**
 * Scripts de Sincronização de Dados
 * 
 * Scripts para sincronizar, correlacionar e corrigir dados entre diferentes fontes
 * (PostgreSQL/Supabase, API do PJE).
 * 
 * IMPORTANTE: Scripts de DESENVOLVIMENTO e MANUTENÇÃO.
 * Não executam automaticamente em produção.
 * 
 * @module scripts/sincronizacao
 */

/**
 * Estrutura
 * =========
 * 
 * sincronizacao/
 * ├── usuarios/      # Sincronização de usuários
 * │   └── sincronizar-usuarios.ts
 * ├── entidades/     # Sincronização de entidades (partes, endereços)
 * │   └── corrigir-entidades-polo.ts
 * └── processos/     # Sincronização de processos e partes
 *     ├── sincronizar-partes-processos.ts
 *     ├── sincronizar-partes-processos-avancado.ts
 *     └── reprocessar-partes-acervo.ts (movido de scripts/reprocessamento/)
 * 
 * 
 * Usuários (`usuarios/`)
 * ======================
 * 
 * **sincronizar-usuarios.ts**
 * 
 * Sincroniza usuários de auth.users (Supabase Auth) para public.usuarios
 * 
 * Uso:
 * ```bash
 * npm run sincronizar-usuarios
 * # ou
 * npx tsx scripts/sincronizacao/usuarios/sincronizar-usuarios.ts
 * ```
 * 
 * O que faz:
 * - Busca todos os usuários de auth.users
 * - Cria/atualiza registros em public.usuarios
 * - Sincroniza: id, email, nome, avatar_url
 * - Reporta erros e estatísticas
 * 
 * 
 * Entidades (`entidades/`)
 * ========================
 * 
 * 1. **corrigir-entidades-polo.ts**
 * 
 * Corrige polo (ATIVO/PASSIVO/OUTROS) das entidades
 * 
 * Uso:
 * ```bash
 * npx tsx scripts/sincronizacao/entidades/corrigir-entidades-polo.ts
 * ```
 * 
 * Processos (`processos/`)
 * ========================
 * 
 * 1. **sincronizar-partes-processos.ts**
 * 
 * Correlaciona partes com processos do acervo
 * 
 * Uso:
 * ```bash
 * npx tsx scripts/sincronizacao/processos/sincronizar-partes-processos.ts [opções]
 * 
 * Opções:
 * --dry-run        Simula sem persistir
 * --limit N        Limita quantidade de processos
 * --trt TRTX       Filtra por TRT específico
 * --verbose        Logs detalhados
 * ```
 * 
 * Estratégia:
 * - Busca processos do acervo sem partes vinculadas
 * - Correlaciona por nome:
 *   - Cliente: pelo nome da parte autora
 *   - Parte contrária: pelo nome da parte ré
 * - Cria vínculos em processo_partes
 * 
 * 2. **sincronizar-partes-processos-avancado.ts**
 * 
 * Versão avançada com 3 níveis de correlação
 * 
 * Uso:
 * ```bash
 * npx tsx scripts/sincronizacao/processos/sincronizar-partes-processos-avancado.ts [opções]
 * 
 * Opções:
 * --dry-run            Simula sem persistir
 * --limit N            Limita quantidade de processos
 * --trt TRTX           Filtra por TRT específico
 * --nivel N            Nível máximo (1, 2 ou 3)
 * --recapturar         Habilita recaptura do PJE (nível 3)
 * --credencial-id N    ID da credencial para PJE
 * --verbose            Logs detalhados
 * ```
 * 
 * Níveis de sincronização:
 * - Nível 1: Correlação por nome
 * - Nível 2: Correlação por CPF/CNPJ via cadastros_pje
 * - Nível 3: Recaptura direta da API do PJE
 * 
 * 3. **reprocessar-partes-acervo.ts**
 * 
 * Re-captura partes de processos do acervo direto do PJE
 * 
 * Uso:
 * ```bash
 * npx tsx scripts/sincronizacao/processos/reprocessar-partes-acervo.ts [opções]
 * 
 * Opções:
 * --dry-run           Simula sem persistir
 * --limit N           Limita quantidade de processos
 * --trt TRTX          Filtra por TRT específico
 * --grau G            Filtra por grau
 * --credencial-id N   ID da credencial (obrigatório)
 * --delay N           Delay entre requisições (ms)
 * --verbose           Logs detalhados
 * --processo-id N     Processa apenas um processo
 * --resume-from N     Retoma do processo ID > N
 * ```
 * 
 * O que faz:
 * - Busca processos do acervo
 * - Autentica no PJE
 * - Captura partes via API
 * - Persiste entidades e vínculos
 * - Salva payload bruto no PostgreSQL (captura_logs_brutos)
 * 
 * 
 * Pré-requisitos
 * ==============
 * 
 * Variáveis de ambiente (.env.local):
 * ```bash
 * # PostgreSQL
 * NEXT_PUBLIC_SUPABASE_URL=
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=
 * SUPABASE_SERVICE_ROLE_KEY=
 * ```
 * 
 * 
 * Características Comuns
 * ======================
 * 
 * Todos os scripts de sincronização:
 * ✅ Suportam `--dry-run` para simulação segura
 * ✅ Opção `--limit` para processar lotes
 * ✅ Logs detalhados com `--verbose`
 * ✅ Salvam resultados em JSON
 * ✅ Tratamento de erros robusto
 * ✅ Estatísticas detalhadas
 * 
 * 
 * Casos de Uso
 * ============
 * 
 * 1. **Sincronizar usuários após migração**
 *    ```bash
 *    npm run sincronizar-usuarios
 *    ```
 * 
 * 2. **Corrigir dados de partes**
 *    ```bash
 *    npx tsx scripts/sincronizacao/entidades/sincronizar-entidades-enderecos.ts --verbose
 *    ```
 * 
 * 3. **Vincular processos com partes**
 *    ```bash
 *    npx tsx scripts/sincronizacao/processos/sincronizar-partes-processos.ts --dry-run --limit 100
 *    ```
 * 
 * 4. **Re-capturar partes específicas**
 *    ```bash
 *    npx tsx scripts/sincronizacao/processos/reprocessar-partes-acervo.ts \
 *      --credencial-id 1 \
 *      --trt TRT3 \
 *      --limit 50
 *    ```
 * 
 * 
 * Notas Importantes
 * =================
 * 
 * ⚠️ **Sempre use --dry-run primeiro!**
 * - Valide resultados antes de persistir
 * - Verifique estatísticas
 * - Corrija problemas identificados
 * 
 * ⚠️ **Performance**
 * - Use --limit para processar em lotes
 * - Evite processar tudo de uma vez
 * - Evite varrer muitos registros sem filtros
 * 
 * ⚠️ **Integridade de Dados**
 * - Scripts podem sobrescrever dados
 * - Faça backup antes de executar
 * - Verifique constraints e foreign keys
 * 
 * 
 * Troubleshooting
 * ===============
 * 
 * Erro: "Duplicate key violation"
 * → Entidade já existe, script tentou inserir novamente
 * → Use UPSERT ou verifique duplicados antes
 * 
 * Erro: "Foreign key constraint violation"
 * → Entidade referenciada não existe
 * → Execute sincronização de dependências primeiro
 * 
 * Erro: "timeout"
 * → Verifique conectividade (Supabase/Redis/PJE) e configure retries/delays
 * 
 * 
 * Referências
 * ===========
 * 
 * - Backend: backend/partes/
 * - Backend: backend/processo-partes/
 * - Schemas: supabase/schemas/
 * 
 * @see {@link ../../backend/partes} Serviços de partes
 * @see {@link ../../backend/processo-partes} Serviços de processo-partes
 */

export { };
