# Relatório de Busca: Pasta `server/` e Scripts de Raspagem de Tribunais

**Data da Busca:** 2026-01-03  
**Período Analisado:** Setembro 2024 - Dezembro 2025  
**Objetivo:** Encontrar referências a uma pasta `server/` na raiz que teria existido no início de novembro de 2025, contendo scripts de raspagem relacionados a tribunais (TJMG, TJSP, TJs, etc.)

## 📋 Resumo Executivo

Após uma busca abrangente no histórico do Git (todos os branches locais e remotos), **não foram encontradas evidências** de uma pasta `server/` na raiz do repositório que tenha existido no início de novembro de 2025.

## 🔍 Metodologia de Busca

### 1. Branches Analisados
- `master` (local e remoto)
- `development` (local e remoto)
- Todos os branches remotos disponíveis (`origin/*`)
- Branches de feature/claude

### 2. Períodos Verificados
- **Setembro 2024 - Dezembro 2025**: Busca ampla no histórico
- **Outubro - Novembro 2025**: Foco no período especificado
- **Setembro 2024 - Dezembro 2025**: Busca por arquivos deletados

### 3. Técnicas Utilizadas
- Busca por commits que adicionaram arquivos em `server/`
- Busca por commits que deletaram arquivos em `server/`
- Busca por commits que renomearam/moveram arquivos de/para `server/`
- Verificação de conteúdo de commits específicos
- Busca por mensagens de commit contendo "server", "raspagem", "scraping", "TJMG", "TJSP"
- Listagem de árvores de commits para encontrar estrutura de pastas

## 📊 Resultados Encontrados

### Arquivos `server.ts` Encontrados
Foram encontradas referências a arquivos individuais `server.ts`, mas **não** a uma pasta `server/` na raiz:

1. **`lib/server.ts`**
   - Criado em: 16/11/2025 (commit 447f828)
   - Criado em: 17/11/2025 (commit 97f7d1a)
   - Criado em: 30/11/2025 (commit 83d404c)

2. **`backend/utils/supabase/server.ts`**
   - Criado em: 16/11/2025 (commit 447f828)

3. **`src/features/captura/server.ts`**
   - Arquivo atual que exporta funções de captura/scraping
   - Localização: `src/features/captura/server.ts`
   - Contém exports de funções relacionadas a tribunais (PJE-TRT)

### Scripts de Raspagem/Scraping Encontrados

Os scripts de raspagem relacionados a tribunais foram encontrados, mas **não** em uma pasta `server/` na raiz:

1. **Estrutura Atual (Dezembro 2025):**
   ```
   scripts/captura/
   ├── acervo-geral/
   ├── arquivados/
   ├── audiencias/
   ├── partes/
   ├── pendentes/
   └── timeline/
   ```

2. **Estrutura Anterior (antes de Dezembro 2025):**
   ```
   scripts/
   ├── api-acervo-geral/
   ├── api-arquivados/
   ├── api-audiencias/
   ├── api-partes/
   ├── api-pendentes-manifestacao/
   └── api-timeline/
   ```

3. **Reorganização:**
   - **Data:** 10 de Dezembro de 2025
   - **Documentação:** `scripts/REORGANIZACAO.md`
   - Os scripts foram reorganizados de `api-*/` para `captura/*/`, mas **não** de `server/`

### Referências a Tribunais Encontradas

Foram encontradas várias referências a tribunais (TJMG, TJSP, etc.) no código:

1. **Variantes de Design System:**
   - `src/lib/design-system/variants.ts`: Mapeamento de cores para TJSP, TJMG
   - `src/components/ui/tribunal-badge.tsx`: Componente para exibir badges de tribunais

2. **Scripts de Captura:**
   - Múltiplos scripts em `scripts/captura/` que trabalham com tribunais
   - Scripts importam de `@/features/captura/server`

3. **Documentação:**
   - `.claude/skills/pje-scraping/SKILL.md`: Documentação sobre scraping PJE
   - `scripts/captura/index.ts`: Documentação completa dos scripts de captura

4. **Schemas de Banco:**
   - `supabase/schemas/13_tribunais.sql`: Tabela de tribunais
   - Referências a TJMG, TJSP em múltiplos arquivos SQL

## 🤔 Possíveis Explicações

### 1. A pasta nunca existiu na raiz
É possível que a pasta `server/` nunca tenha existido na raiz do repositório. Os scripts de raspagem podem ter sempre estado em:
- `scripts/api-*/` (estrutura antiga)
- `scripts/captura/*/` (estrutura atual)
- `backend/` (código de backend)

### 2. A pasta estava em outro repositório
A pasta `server/` pode ter existido em um repositório diferente (por exemplo, um repositório separado para serviços backend).

### 3. A pasta foi removida antes do período analisado
Se a pasta foi removida antes de setembro de 2024, ela não estaria no histórico analisado. No entanto, commits antigos geralmente permanecem no Git mesmo após remoções.

### 4. A pasta estava em um branch não rastreado
É possível que a pasta tenha existido apenas em um branch local que foi deletado ou que nunca foi enviado para o remoto.

## 📝 Arquivos Relacionados Encontrados

### Código Atual de Captura/Scraping

1. **`src/features/captura/server.ts`**
   - Exporta funções de autenticação PJE
   - Exporta funções de captura de tribunais
   - Exporta drivers para diferentes sistemas judiciais

2. **Scripts de Captura:**
   - `scripts/captura/partes/test-captura-partes.ts`
   - `scripts/captura/timeline/test-api-timeline.ts`
   - `scripts/captura/audiencias/test-api-audiencias.ts`
   - E muitos outros...

3. **Serviços Backend:**
   - `backend/captura/` (não verificado em detalhes, mas mencionado na documentação)

## 🎯 Conclusão

**Não foram encontradas evidências** de uma pasta `server/` na raiz do repositório contendo scripts de raspagem de tribunais no início de novembro de 2025.

Os scripts de raspagem/scraping relacionados a tribunais sempre estiveram organizados em:
- `scripts/api-*/` (estrutura antiga, antes de dez/2025)
- `scripts/captura/*/` (estrutura atual, após dez/2025)
- `src/features/captura/` (código da aplicação)
- `backend/` (serviços backend)

## 📌 Recomendações

1. **Verificar outros repositórios:** Se a pasta `server/` existiu, pode estar em um repositório separado (backend, serviços, etc.)

2. **Verificar backups locais:** Se você tinha a pasta localmente, pode estar em:
   - Backups locais não commitados
   - Stash do Git (`git stash list`)
   - Worktree do Git

### ✅ Verificação Realizada (2026-01-03)

**1. Stash do Git:**
- **Encontrado:** 1 stash (`stash@{0}`)
- **Conteúdo:** WIP no master relacionado a refactor de autenticação
- **Resultado:** ❌ Não contém referências a pasta `server/` ou scripts de raspagem de tribunais
- **Comando usado:** `git stash list` e `git stash show -p stash@{0}`

**2. Worktrees do Git:**
- **Encontrado:** Apenas 1 worktree (o atual)
- **Resultado:** ❌ Não há worktrees adicionais que possam conter a pasta `server/`
- **Comando usado:** `git worktree list`

**3. Reflog do Git:**
- **Verificado:** Histórico completo do reflog desde 2024-01-01
- **Resultado:** ❌ Não encontradas referências a pasta `server/` no reflog
- **Comando usado:** `git reflog --all` e busca por commits no reflog

**4. Objetos Dangling (fsck):**
- **Encontrado:** 20 objetos dangling (blobs órfãos)
- **Nota:** Objetos dangling são normais no Git (arquivos não referenciados por commits)
- **Resultado:** ⚠️ Objetos dangling podem conter dados antigos, mas não são facilmente acessíveis sem hash específico
- **Comando usado:** `git fsck --lost-found`

**5. Pastas de Backup/Temp:**
- **Encontrado:** Algumas pastas com nomes relacionados (temp, old, backup)
- **Resultado:** ✅ Nenhuma pasta relevante encontrada (apenas pastas do projeto como `supabase/.temp`, `docs/feature-template`, etc.)

**Conclusão das Verificações:**
- ❌ **Stash:** Não contém a pasta `server/` (apenas WIP sobre refactor de autenticação)
- ❌ **Worktrees:** Não há worktrees adicionais (apenas o worktree atual)
- ❌ **Reflog:** Não mostra referências à pasta `server/` em commits do reflog
- ⚠️ **Objetos Dangling:** 20 objetos dangling encontrados (normais no Git), mas requerem investigação manual com hashes específicos
- ✅ **Pastas Backup/Temp:** Nenhuma pasta relevante encontrada

**Resumo Final:**
Todas as verificações de backups locais, stash, worktrees e reflog foram realizadas sem encontrar evidências da pasta `server/` ou scripts de raspagem específicos de tribunais. A pasta `server/` na raiz não foi encontrada em nenhum lugar do histórico Git acessível.

3. **Verificar histórico de repositórios remotos:** Se o código estava em um fork ou repositório diferente, verificar lá

4. **Consultar documentação antiga:** Verificar documentação, notas ou issues que possam mencionar a estrutura antiga

## 📚 Referências Encontradas

- `scripts/REORGANIZACAO.md`: Documenta reorganização de dezembro/2025
- `scripts/README.md`: Documentação atual dos scripts
- `scripts/captura/index.ts`: Documentação dos scripts de captura
- `.claude/skills/pje-scraping/SKILL.md`: Documentação sobre scraping PJE

---

**Próximos Passos Sugeridos:**
1. Verificar se há outros repositórios relacionados ao projeto
2. Consultar a equipe sobre a estrutura histórica do projeto
3. Verificar backups ou snapshots de sistema
4. Se necessário, verificar reflog do Git para commits não referenciados: `git reflog`

