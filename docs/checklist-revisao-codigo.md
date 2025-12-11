# Checklist de Revisão de Código - Sinesys

Este documento estabelece o checklist padrão para revisões de código, garantindo que o desenho arquitetural alcançado seja mantido ao longo do tempo.

## 📋 Checklist Geral

### Arquitetura e Estrutura

- [ ] **Nova lógica de negócio** está em `src/features/{modulo}/` e não em `backend/` ou `app/_lib/`
- [ ] **Novos componentes visuais reutilizáveis** foram avaliados para viver em `components/ui` ou `components/shared`
- [ ] **Imports** usam barrel exports (`@/features/{modulo}`) e não caminhos diretos internos
- [ ] **Server Actions** seguem o padrão `action{Verbo}` e estão em `features/{modulo}/actions/`
- [ ] **Hooks customizados** estão em `features/{modulo}/hooks/` quando específicos da feature
- [ ] **Tipos e schemas** estão em `features/{modulo}/domain.ts` ou `types.ts`

### Imports e Dependências

- [ ] **Sem imports de pastas legadas**: Não há imports de `@/backend`, `@/core` ou `@/app/_lib` em arquivos de `src/`
- [ ] **Barrel exports**: Imports de features usam `@/features/{modulo}` e não caminhos internos como `@/features/{modulo}/components/...`
- [ ] **Dependências externas**: Novas dependências são justificadas e necessárias

### Padrões de Código

- [ ] **Nomenclatura**: Segue convenções do projeto (camelCase, PascalCase, kebab-case conforme contexto)
- [ ] **TypeScript**: Tipos explícitos, sem uso de `any`
- [ ] **Validação**: Inputs validados com Zod schemas
- [ ] **Error handling**: Tratamento adequado de erros com mensagens claras

### Documentação

- [ ] **README de feature**: Em mudanças significativas (uso, regras, integrações), o `README.md` foi atualizado com propósito, entidades, fluxos e exemplos
- [ ] **Documentação central**: Para mudanças arquiteturais, `AGENTS.md` ou `docs/` foram atualizados (doc desatualizada = dívida técnica)
- [ ] **Comentários**: Código complexo possui comentários explicativos

### Testes

- [ ] **Testes unitários**: Lógica de negócio possui testes
- [ ] **Testes de integração**: Integrações críticas possuem testes
- [ ] **Cobertura**: Cobertura de testes mantida ou aumentada

### Performance

- [ ] **Queries otimizadas**: Queries de banco de dados são eficientes (select específico, paginação, índices)
- [ ] **Memoização**: Cálculos pesados são memoizados quando apropriado
- [ ] **Lazy loading**: Componentes pesados usam lazy loading

### Segurança

- [ ] **Validação server-side**: Validação sempre no servidor, não apenas no cliente
- [ ] **Permissões**: Verificação de permissões implementada onde necessário
- [ ] **Sanitização**: Inputs do usuário são sanitizados quando necessário

## 🔍 Verificações Automáticas

Antes de submeter o PR, execute:

```bash
# Verificar imports arquiteturais
npm run check:architecture

# Verificar lint
npm run lint

# Verificar tipos
npm run type-check
```

## 📝 Exemplos de Boas Práticas

### ✅ Correto

```typescript
// Import via barrel export
import { ClientesTable, actionListarClientes } from "@/features/partes";

// Server Action em features/
import { actionCriarProcesso } from "@/features/processos";

// Componente compartilhado
import { PageShell } from "@/components/shared/page-shell";
```

### ❌ Incorreto

```typescript
// Import direto de caminho interno (proibido)
import { ClientesTable } from "@/features/partes/components/clientes/clientes-table";

// Import de pasta legada (proibido)
// (exemplo legado removido; use sempre imports via features)

// Lógica de negócio fora de features/ (proibido)
// Em app/_lib/ ou backend/ quando deveria estar em features/
```

## 🚨 Quando Bloquear um PR

Bloqueie o PR se:

1. **Imports de pastas legadas** em `src/` que não sejam `backend/` ou `core/`
2. **Lógica de negócio** sendo adicionada fora de `src/features/`
3. **Imports diretos** de caminhos internos de features (deve usar barrel exports)
4. **Falta de documentação** em mudanças estruturais significativas
5. **Violação de padrões** estabelecidos que comprometem a arquitetura

## 📚 Referências

- `docs/arquitetura-sistema.md` - Documentação completa da arquitetura
- `.cursor/rules/AGENTS.md` - Instruções para agentes de IA
- `eslint.config.mjs` - Regras ESLint de imports

---

**Última atualização**: Dezembro 2025
