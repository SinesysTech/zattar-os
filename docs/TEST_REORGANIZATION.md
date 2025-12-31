# Reorganização da Estrutura de Testes

## 📋 Resumo

Reorganização completa da estrutura de testes seguindo os princípios do Feature-Sliced Design (FSD), movendo todos os arquivos de teste para dentro dos módulos correspondentes.

**Data:** 2024-12-31

## 🎯 Objetivos

1. Alinhar estrutura de testes com arquitetura FSD
2. Melhorar localização e manutenção dos testes
3. Consolidar utilitários de teste em local centralizado
4. Organizar testes e2e por feature

## 📁 Estrutura Anterior

```
├── coverage/                    # ✅ Mantido na raiz (gerado automaticamente)
├── dist-test/                   # ✅ Mantido na raiz (build de testes, .gitignore)
├── e2e/                         # ❌ Removido - distribuído por features
│   ├── calls/
│   ├── documentos/
│   ├── fixtures/
│   ├── dashboard.spec.ts
│   ├── formsign.spec.ts
│   └── responsiveness.spec.ts
├── src/
│   ├── testing/                 # ✅ Mantido (utilitários compartilhados)
│   └── tests/                   # ❌ Removido - unificado em src/testing/
│       └── helpers/
```

## 📁 Estrutura Nova

```
├── coverage/                    # ✅ Mantido (gerado automaticamente)
├── dist-test/                   # ✅ Mantido (build, .gitignore)
├── src/
│   ├── testing/                 # ✅ Utilitários + testes cross-feature
│   │   ├── helpers/             # ✅ Movido de src/tests/helpers/
│   │   │   └── responsive-test-helpers.ts
│   │   └── e2e/                 # ✅ Testes e2e cross-feature
│   │       └── responsiveness.spec.ts
│   │   ├── factories.ts
│   │   ├── mocks.ts
│   │   ├── setup.ts
│   │   └── templates/
│   └── features/
│       ├── assinatura-digital/
│       │   └── __tests__/
│       │       ├── e2e/         # ✅ Novo
│       │       │   └── formsign.spec.ts
│       │       ├── integration/
│       │       └── unit/
│       ├── chat/
│       │   └── __tests__/
│       │       ├── e2e/         # ✅ Novo
│       │       │   ├── calls/
│       │       │   │   ├── call-a11y.spec.ts
│       │       │   │   ├── call-controls.spec.ts
│       │       │   │   ├── call-initialization.spec.ts
│       │       │   │   └── call-recording.spec.ts
│       │       │   └── fixtures/
│       │       │       └── call-fixtures.ts
│       │       ├── components/
│       │       ├── integration/
│       │       └── unit/
│       ├── dashboard/
│       │   └── __tests__/
│       │       ├── e2e/         # ✅ Novo
│       │       │   └── dashboard.spec.ts
│       │       └── components/
│       └── documentos/
│           └── __tests__/
│               ├── e2e/         # ✅ Novo
│               │   └── documentos.spec.ts
│               ├── integration/
│               └── unit/
```

## 🔄 Mudanças Realizadas

### 1. Testes e2e Reorganizados por Feature

| Feature | Arquivos Movidos | Novo Local |
|---------|-----------------|------------|
| **assinatura-digital** | `e2e/formsign.spec.ts` | `src/features/assinatura-digital/__tests__/e2e/` |
| **chat** | `e2e/calls/*` + `e2e/fixtures/call-fixtures.ts` | `src/features/chat/__tests__/e2e/` |
| **dashboard** | `e2e/dashboard.spec.ts` | `src/features/dashboard/__tests__/e2e/` |
| **documentos** | `e2e/documentos/*` | `src/features/documentos/__tests__/e2e/` |
| **cross-feature** | `e2e/responsiveness.spec.ts` | `src/testing/e2e/` |

### 2. Helpers de Teste Consolidados

- ✅ Movido `src/tests/helpers/` → `src/testing/helpers/`
- ✅ Adicionada função `renderWithViewport` ao arquivo de helpers

### 3. Imports Atualizados

Todos os imports foram atualizados para refletir os novos caminhos:

```typescript
// ❌ Antes
import { setViewport } from '@/tests/helpers/responsive-test-helpers';
import { test, expect } from '../../e2e/fixtures/call-fixtures';

// ✅ Depois
import { setViewport } from '@/testing/helpers/responsive-test-helpers';
import { test, expect } from '../fixtures/call-fixtures';
```

### 4. Configurações Atualizadas

#### playwright.config.ts

```typescript
// ❌ Antes
export default defineConfig({
  testDir: './e2e',
  // ...
});

// ✅ Depois
export default defineConfig({
  testDir: './src',
  testMatch: [
    '**/__tests__/e2e/**/*.spec.ts',
    '**/testing/e2e/**/*.spec.ts',
  ],
  // ...
});
```

#### .gitignore

```gitignore
# testing
/coverage
/dist-test  # ✅ Adicionado
```

## 📝 Convenções

### Estrutura de Testes por Feature

```
src/features/{feature}/
  └── __tests__/
      ├── e2e/              # Testes end-to-end (Playwright)
      ├── integration/      # Testes de integração
      ├── unit/             # Testes unitários
      └── components/       # Testes de componentes React
```

### Testes Cross-Feature

Testes que envolvem múltiplas features ou aspectos gerais do sistema devem ficar em:

```
src/testing/
  └── e2e/                  # Testes e2e cross-feature
```

## ✅ Checklist de Validação

- [x] Todos os arquivos movidos para local correto
- [x] Imports atualizados
- [x] Playwright config atualizado
- [x] .gitignore atualizado
- [x] Função `renderWithViewport` adicionada aos helpers
- [x] Sem erros de lint
- [x] Estrutura alinhada com FSD

## 🚀 Próximos Passos

1. Executar testes para validar reorganização
2. Atualizar documentação de testes (`docs/testing-guide.md`) se necessário
3. Comunicar mudanças à equipe

## 📚 Referências

- [Guia de Testes](./testing-guide.md)
- [Arquitetura FSD](../ARCHITECTURE.md)
- [Feature-Sliced Design](https://feature-sliced.design/)

