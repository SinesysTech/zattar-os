# Guia de Barrel Exports

Este documento estabelece os padrões e boas práticas para barrel exports (arquivos `index.ts`) no projeto.

## Por que Barrel Exports Explícitos?

### Problema com `export *`

O uso de `export * from './module'` pode parecer conveniente, mas causa problemas:

1. **Tree-shaking ineficiente**: Bundlers não conseguem remover código não utilizado
2. **Conflitos de nomes**: Exports com mesmo nome de módulos diferentes causam erros silenciosos
3. **Build mais lento**: O bundler precisa processar todos os exports, mesmo os não utilizados
4. **Dificuldade de rastreamento**: Não fica claro de onde cada export vem

### Solução: Exports Explícitos

```typescript
// ❌ Evitar
export * from './clientes';
export * from './processos';

// ✅ Preferir
export {
  useClientes,
  ClientesTable,
  type Cliente,
} from './clientes';

export {
  useProcessos,
  ProcessosTable,
  type Processo,
} from './processos';
```

## Padrão de Barrel Export

### Estrutura Recomendada

Cada arquivo `index.ts` deve seguir esta estrutura:

```typescript
/**
 * Barrel export para [nome do módulo]
 *
 * ⚠️ OTIMIZAÇÃO DE BUILD:
 * Prefira imports diretos quando possível para melhor tree-shaking:
 *
 * ✅ Recomendado (import direto):
 * import { useClientes } from '@/features/partes/hooks/use-clientes';
 *
 * ⚠️ Use com moderação (barrel export):
 * import { useClientes } from '@/features/partes';
 */

// ============================================================================
// Components
// ============================================================================
export { ClientesTable, ClienteForm } from './components';

// ============================================================================
// Hooks
// ============================================================================
export { useClientes, useCliente } from './hooks';

// ============================================================================
// Types
// ============================================================================
export type { Cliente, ClienteFilters } from './types';
```

### Regras para JSDoc

1. **Sempre incluir warning de otimização** no topo do arquivo
2. **Mostrar exemplos** de import direto vs barrel import
3. **Usar seções com delimitadores visuais** (`// ===...===`)

## Hierarquia de Barrels

### Feature-Sliced Design (FSD)

```
src/features/partes/
├── index.ts                    # Barrel principal (re-exporta sub-barrels)
├── components/
│   └── index.ts                # Sub-barrel de componentes
├── hooks/
│   └── index.ts                # Sub-barrel de hooks
├── actions/
│   └── index.ts                # Sub-barrel de server actions
├── domain/
│   └── index.ts                # Sub-barrel de tipos/schemas
└── services/
    └── index.ts                # Sub-barrel de serviços
```

### Ordem de Imports no Barrel Principal

1. Components
2. Hooks
3. Utils
4. Types
5. Domain (Schemas, Validation)
6. Services
7. Actions (Server Actions)
8. Errors
9. Repositories

## Tratamento de Conflitos de Nomes

### Usando Aliases

Quando dois módulos exportam símbolos com mesmo nome:

```typescript
// ❌ Conflito
export { aprovarOrcamento } from './hooks/use-orcamentos';  // hook
export { aprovarOrcamento } from './services/orcamentos';   // service

// ✅ Com alias
export { aprovarOrcamento } from './hooks/use-orcamentos';
export { aprovarOrcamento as aprovarOrcamentoService } from './services/orcamentos';
```

### Mantendo Backward Compatibility

Quando renomear um export, mantenha ambos os nomes por um tempo:

```typescript
export {
  actionBuscarClientePorCPF,
  actionBuscarClientePorCPF as actionBuscarClientePorCPFAction,
} from './actions';
```

### Usando Namespace Exports

Para módulos com muitos conflitos, use namespace:

```typescript
// Quando há muitos conflitos entre módulos similares
export * as orcamentosTypes from './domain/orcamentos';
export * as dreTypes from './domain/dre';
```

## Tipos vs Valores

### Separar Exports de Tipo

```typescript
// Valores (funções, constantes, classes)
export { useClientes, ClientesTable, CLIENTES_FILTER_CONFIGS } from './clientes';

// Tipos (apenas para TypeScript, removidos no runtime)
export type { Cliente, ClienteFilters, ClienteFormData } from './clientes';
```

### `export type *` para Tipos Grandes

Para arquivos de tipos muito grandes (como `database.types.ts`):

```typescript
// Re-exporta todos os tipos sem afetar bundle
export type * from './database.types';
```

## Imports Recomendados

### Quando Usar Import Direto

✅ **Use import direto quando**:
- Importando de um único módulo
- Performance é crítica
- Arquivo está em hot path

```typescript
// ✅ Direto - melhor tree-shaking
import { useClientes } from '@/features/partes/hooks/use-clientes';
```

### Quando Usar Barrel Import

⚠️ **Use barrel import quando**:
- Importando múltiplos itens relacionados
- Conveniência supera micro-otimização
- Código não está em path crítico

```typescript
// ⚠️ Barrel - conveniente mas menos eficiente
import {
  useClientes,
  ClientesTable,
  type Cliente
} from '@/features/partes';
```

## Validação

### Scripts de Verificação

Execute regularmente para verificar conformidade:

```bash
# Verifica violações arquiteturais
npm run check:architecture

# Verifica exports (se disponível)
npm run validate:exports

# Type-check completo
npm run type-check
```

### Checklist de Review

Ao criar/modificar barrels, verifique:

- [ ] JSDoc com warning de otimização presente
- [ ] Seções organizadas com delimitadores visuais
- [ ] Sem `export *` (exceto `export type *` para tipos)
- [ ] Aliases para conflitos de nomes
- [ ] Tipos separados com `export type`
- [ ] Build passa sem erros

## Referências

- [Feature-Sliced Design](https://feature-sliced.design/)
- [TypeScript Barrel Files](https://basarat.gitbook.io/typescript/main-1/barrel)
- [Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
