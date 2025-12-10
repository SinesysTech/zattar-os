# Tarefas de Migração: backend/comunica-cnj → src/core/comunica-cnj

Este documento lista todas as referências ao módulo legado `backend/comunica-cnj` que precisam ser migradas para `src/core/comunica-cnj`.

## Status da Migração

- [ ] **Scripts de teste**
- [ ] **APIs/rotas** (se houver)
- [ ] **Jobs/schedulers** (se houver)
- [ ] **Outras referências**

---

## Tarefas de Migração

### 1. Script: `scripts/test-comunica-cnj-api.ts`

**Arquivo:** `scripts/test-comunica-cnj-api.ts`

**Referências encontradas:**
- `import { ComunicaCNJClient } from '../backend/comunica-cnj/client/comunica-cnj-client';`

**Ação necessária:**
- Migrar para `import { ComunicaCNJClient, getComunicaCNJClient } from '@/core/comunica-cnj';`
- Atualizar uso do cliente para usar `getComunicaCNJClient()` ou criar instância via `createComunicaCNJClientFromEnv()`
- Verificar se a API do cliente mudou e ajustar conforme necessário

**Equivalente no core:**
- Cliente: `@/core/comunica-cnj` → `ComunicaCNJClient`, `getComunicaCNJClient`, `createComunicaCNJClientFromEnv`
- Serviços: `buscarComunicacoes()`, `listarTribunaisDisponiveis()`, `obterStatusRateLimit()`

---

### 2. Script: `scripts/test-captura-oab.ts`

**Arquivo:** `scripts/test-captura-oab.ts`

**Referências encontradas:**
- `import { ComunicaCNJClient } from '../backend/comunica-cnj/client/comunica-cnj-client';`
- `import { executarCaptura } from '../backend/comunica-cnj/services/comunica-cnj/capturar-comunicacoes.service';`

**Ação necessária:**
- Migrar cliente para `@/core/comunica-cnj`
- Migrar `executarCaptura()` para `sincronizarComunicacoes()` em `@/core/comunica-cnj`
- Verificar diferenças na API:
  - `executarCaptura({ numero_oab, uf_oab })` → `sincronizarComunicacoes({ numeroOab, ufOab })`
  - Verificar formato de resposta e ajustar conforme necessário

**Equivalente no core:**
- Cliente: `@/core/comunica-cnj` → `getComunicaCNJClient()`
- Captura: `sincronizarComunicacoes()` em `@/core/comunica-cnj/service`

---

## Checklist de Migração

Para cada arquivo migrado, verificar:

- [ ] Imports atualizados para `@/core/comunica-cnj`
- [ ] API do serviço/função compatível ou ajustada
- [ ] Tipos atualizados (usar tipos de `@/core/comunica-cnj/domain`)
- [ ] Tratamento de erros atualizado (usar `Result<T>` pattern)
- [ ] Testes executados e funcionando
- [ ] Documentação atualizada (se aplicável)

---

## Após Conclusão da Migração

Quando todas as referências forem migradas:

1. Remover o diretório `backend/comunica-cnj/` completamente
2. Atualizar este arquivo indicando conclusão
3. Remover este arquivo de migração

---

## Notas

- O módulo `src/core/comunica-cnj` usa o padrão `Result<T>` para tratamento de erros
- Todos os serviços no core retornam `Result<T>` em vez de lançar exceções
- Validação é feita com Zod schemas no core
- O core tem melhor separação de responsabilidades (domain, repository, service)
