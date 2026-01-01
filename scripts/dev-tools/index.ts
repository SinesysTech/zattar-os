/**
 * Ferramentas de Desenvolvimento
 * 
 * Scripts para análise, validação e debug do código e build do projeto.
 * 
 * IMPORTANTE: Ferramentas de DESENVOLVIMENTO apenas.
 * Não são parte do build de produção.
 * 
 * @module scripts/dev-tools
 */

/**
 * Estrutura
 * =========
 * 
 * dev-tools/
 * ├── design/     # Análise e validação de design system
 * │   ├── analyze-typography.js
 * │   └── validate-design-system.ts
 * └── build/      # Análise de build e performance
 *     ├── check-build-memory.sh
 *     ├── run-analyze.js
 *     └── run-build-debug-memory.js
 * 
 * 
 * Design System (`design/`)
 * =========================
 * 
 * 1. **analyze-typography.js**
 * 
 * Analisa uso de classes de tipografia Tailwind no código
 * 
 * Uso:
 * ```bash
 * node scripts/dev-tools/design/analyze-typography.js
 * ```
 * 
 * O que faz:
 * - Varre arquivos .ts/.tsx em app/ e components/
 * - Identifica uso direto de classes Tailwind (text-xl, font-bold, etc.)
 * - Sugere migração para sistema de tipografia shadcn/ui
 * - Gera relatório de prioridades
 * - Exporta resultados em typography-analysis.json
 * 
 * Saída:
 * - Classes mais usadas
 * - Componentes prioritários (alta/média/baixa)
 * - Recomendações de migração
 * 
 * 2. **validate-design-system.ts**
 * 
 * Valida conformidade com regras do design system
 * 
 * Uso:
 * ```bash
 * npm run validate:design-system
 * # ou
 * npx tsx scripts/dev-tools/design/validate-design-system.ts
 * ```
 * 
 * Regras verificadas:
 * - ❌ Uso direto de oklch() (deve usar variáveis CSS)
 * - ❌ Uso de shadow-xl (deve usar shadow-lg ou shadow-md)
 * - ⚠️ Futuramente: validação de font-heading, tabular-nums
 * 
 * Saída:
 * - Lista de erros com arquivo e linha
 * - Exit code 1 se houver erros (útil para CI/CD)
 * 
 * 
 * Build Analysis (`build/`)
 * =========================
 * 
 * 1. **check-build-memory.sh**
 * 
 * Verifica memória disponível antes do build
 * 
 * Uso:
 * ```bash
 * bash scripts/dev-tools/build/check-build-memory.sh
 * ```
 * 
 * O que faz:
 * - Verifica memória livre do sistema
 * - Alerta se memória < 4GB
 * - Usado em prebuild:check no package.json
 * 
 * 2. **run-analyze.js**
 * 
 * Analisa tamanho do bundle de produção
 * 
 * Uso:
 * ```bash
 * npm run analyze
 * ```
 * 
 * O que faz:
 * - Executa build com webpack-bundle-analyzer
 * - Gera relatório HTML interativo
 * - Mostra tamanho de cada módulo/chunk
 * - Identifica dependências pesadas
 * 
 * 3. **run-build-debug-memory.js**
 * 
 * Debug de uso de memória durante o build
 * 
 * Uso:
 * ```bash
 * npm run build:debug-memory
 * ```
 * 
 * O que faz:
 * - Executa build com opções de debug de memória Node.js
 * - Aumenta max-old-space-size para 4GB
 * - Útil para investigar erros de memória
 * 
 * 
 * Outros Scripts (raiz de scripts/)
 * ==================================
 * 
 * **check-pwa.js**
 * 
 * Valida configuração PWA antes do build
 * 
 * Uso:
 * ```bash
 * npm run check:pwa
 * ```
 * 
 * O que faz:
 * - Verifica se public/sw.js existe antes do build
 * - Detecta se é service worker do next-pwa (Workbox)
 * - Previne conflitos de service workers manuais
 * 
 * **validate-design-system.ts**
 * 
 * Já documentado acima. Pode ser movido para dev-tools/design/ futuramente.
 * 
 * **check-terceiros.ts**
 * 
 * Script de debug para verificar terceiros (Supabase)
 * 
 * Uso:
 * ```bash
 * npx tsx scripts/check-terceiros.ts
 * ```
 * 
 * O que faz:
 * - Busca registros relacionados a terceiros no Supabase
 * - Útil para debug de persistência
 * 
 * 
 * Pré-requisitos
 * ==============
 * 
 * Scripts de design:
 * - Node.js instalado
 * - Projeto com dependências instaladas
 * 
 * Scripts de build:
 * - Bash (WSL ou Git Bash no Windows)
 * - Node.js com memória suficiente
 * 
 * Scripts de PWA:
 * - next-pwa configurado
 * 
 * 
 * Casos de Uso
 * ============
 * 
 * 1. **Antes de refatorar tipografia**
 *    ```bash
 *    node scripts/dev-tools/design/analyze-typography.js
 *    # Analisar typography-analysis.json
 *    # Priorizar componentes de alta prioridade
 *    ```
 * 
 * 2. **Validar código antes de commit**
 *    ```bash
 *    npm run validate:design-system
 *    # Se passar, código está conforme
 *    ```
 * 
 * 3. **Investigar bundle grande**
 *    ```bash
 *    npm run analyze
 *    # Abrir relatório HTML
 *    # Identificar dependências pesadas
 *    # Remover ou code-split
 *    ```
 * 
 * 4. **Debug de erro de memória no build**
 *    ```bash
 *    npm run build:debug-memory
 *    # Ver logs de memória
 *    # Ajustar max-old-space-size se necessário
 *    ```
 * 
 * 
 * Integração CI/CD
 * ================
 * 
 * Scripts recomendados para pipeline:
 * 
 * ```yaml
 * # .github/workflows/ci.yml
 * - name: Validate Design System
 *   run: npm run validate:design-system
 * 
 * - name: Check PWA
 *   run: npm run check:pwa
 * 
 * - name: Analyze Bundle Size
 *   run: npm run analyze
 * ```
 * 
 * 
 * Notas Importantes
 * =================
 * 
 * ⚠️ **Análise de Tipografia**
 * - Resultados são SUGESTÕES, não obrigatórios
 * - Componentes de alta prioridade devem ser priorizados
 * - Migração gradual é recomendada
 * 
 * ⚠️ **Validação de Design System**
 * - Regras podem ser atualizadas
 * - Adicione exceções com cuidado
 * - Use // eslint-disable apenas quando necessário
 * 
 * ⚠️ **Bundle Analysis**
 * - Gera arquivos grandes (vários MB)
 * - Não commitar relatórios gerados
 * - Executar periodicamente para monitorar crescimento
 * 
 * ⚠️ **Scripts de Build**
 * - Requerem Bash (WSL/Git Bash no Windows)
 * - Podem falhar em ambientes sem Bash
 * - Verificar sempre antes de build de produção
 * 
 * 
 * Troubleshooting
 * ===============
 * 
 * Erro: "bash: command not found"
 * → Instale Git Bash (Windows) ou use WSL
 * 
 * Erro: "Out of memory"
 * → Aumente max-old-space-size
 * → Use npm run build:debug-memory
 * 
 * Erro: "ENOENT: no such file"
 * → Verifique caminhos relativos
 * → Execute do diretório raiz do projeto
 * 
 * 
 * Referências
 * ===========
 * 
 * - Design System: docs/design-system.md (se existir)
 * - Next.js Bundle Analyzer: https://www.npmjs.com/package/@next/bundle-analyzer
 * - PWA: https://github.com/shadowwalker/next-pwa
 * 
 * @see {@link ../../docs} Documentação do projeto
 */

export { };
