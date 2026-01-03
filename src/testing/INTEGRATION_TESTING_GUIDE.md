# Guia de Testes de Integração

Este guia documenta os padrões e convenções para criação de testes de integração no projeto.

## Índice

- [Estrutura](#estrutura)
- [Quando Criar Testes de Integração](#quando-criar-testes-de-integração)
- [Padrão de Mock](#padrão-de-mock)
- [Exemplo Completo](#exemplo-completo)
- [Helpers Disponíveis](#helpers-disponíveis)
- [Comandos Úteis](#comandos-úteis)
- [Referências](#referências)

## Estrutura

### Localização

Os testes de integração devem ser criados em:

```
src/features/{feature}/__tests__/integration/
```

### Nomenclatura

Os arquivos devem seguir o padrão:

```
{feature}-flow.test.ts
```

**Exemplos**:
- `contratos-flow.test.ts`
- `expedientes-flow.test.ts`
- `rh-folha-pagamento-flow.test.ts`

### Padrão AAA

Todos os testes devem seguir o padrão **AAA** (Arrange-Act-Assert):

```typescript
it('deve criar contrato com sucesso', async () => {
  // Arrange: Preparar dados e mocks
  const input = { ... };
  (repositoryFunction as jest.Mock).mockResolvedValue(ok(data));

  // Act: Executar a ação
  const result = await criarContrato(input);

  // Assert: Verificar resultados
  expect(result.success).toBe(true);
  expect(repositoryFunction).toHaveBeenCalled();
});
```

## Quando Criar Testes de Integração

Crie testes de integração para:

### 1. Fluxos entre Service → Repository

Testar a integração entre a camada de serviço e a camada de persistência.

```typescript
describe('Contratos Integration - Criação', () => {
  it('deve criar contrato e validar cliente', async () => {
    // Testa fluxo: service valida cliente → repository persiste
  });
});
```

### 2. Validações de Entidades Relacionadas

Testar validações que envolvem múltiplas entidades.

```typescript
it('deve validar partes contrárias nas partes relacionais', async () => {
  // Testa validação de parte contrária antes de criar contrato
});
```

### 3. Regras de Negócio Complexas

Testar fluxos com múltiplas etapas e validações.

```typescript
describe('RH Integration - Geração de Folha', () => {
  it('deve gerar folha com salários vigentes', async () => {
    // Testa: verificar período → buscar salários → criar folha → criar itens
  });
});
```

### 4. Integrações com Supabase (Mockadas)

Testar chamadas RPC e operações complexas do Supabase.

```typescript
it('deve realizar baixa e registrar auditoria via RPC', async () => {
  // Testa: baixar expediente → chamar RPC de auditoria
});
```

### 5. Auditoria e Logs

Testar criação de logs de auditoria.

```typescript
it('deve continuar se RPC de auditoria falhar (log crítico)', async () => {
  // Testa comportamento quando auditoria falha
});
```

## Padrão de Mock

### Estrutura Base

```typescript
import { funcaoService } from '../../service';
import {
  funcaoRepository1,
  funcaoRepository2,
} from '../../repository';

// Mock repository
jest.mock('../../repository');

describe('Feature Integration - Fluxo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve executar fluxo com sucesso', async () => {
    // Arrange
    (funcaoRepository1 as jest.Mock).mockResolvedValue(ok(true));
    (funcaoRepository2 as jest.Mock).mockResolvedValue(ok(data));

    // Act
    const result = await funcaoService(input);

    // Assert
    expect(result.success).toBe(true);
    expect(funcaoRepository1).toHaveBeenCalledWith(expectedParam);
  });
});
```

### Mock de Supabase Client

Para features que usam Supabase diretamente:

```typescript
import { createDbClient } from '@/lib/supabase';

jest.mock('@/lib/supabase');

beforeEach(() => {
  mockDb = {
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  (createDbClient as jest.Mock).mockReturnValue(mockDb);
});
```

### Mock de Result<T>

Use os helpers `ok()` e `err()` do sistema de Result:

```typescript
import { ok, err, appError } from '@/types';

// Sucesso
(repository as jest.Mock).mockResolvedValue(ok(data));

// Erro
(repository as jest.Mock).mockResolvedValue(
  err(appError('NOT_FOUND', 'Não encontrado'))
);
```

## Exemplo Completo

```typescript
/**
 * EXEMPLO INTEGRATION TEST
 *
 * Testa fluxo completo de criação de entidade com validações.
 */

import {
  criarEntidade,
  atualizarEntidade,
} from '../../service';
import {
  saveEntidade,
  findEntidadeById,
  updateEntidade,
  dependenciaExists,
} from '../../repository';
import { ok, err, appError } from '@/types';

// Mock repository
jest.mock('../../repository');

describe('Entidade Integration - Criação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar entidade e validar dependências', async () => {
    // Arrange
    const input = {
      nome: 'Teste',
      dependenciaId: 1,
    };

    const entidadeCriada = {
      id: 1,
      nome: 'Teste',
      dependenciaId: 1,
      createdAt: new Date().toISOString(),
    };

    (dependenciaExists as jest.Mock).mockResolvedValue(ok(true));
    (saveEntidade as jest.Mock).mockResolvedValue(ok(entidadeCriada));

    // Act
    const result = await criarEntidade(input);

    // Assert
    expect(result.success).toBe(true);
    expect(dependenciaExists).toHaveBeenCalledWith(1);
    expect(saveEntidade).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Teste' })
    );

    if (result.success) {
      expect(result.data.id).toBe(1);
    }
  });

  it('deve falhar se dependência não existir', async () => {
    // Arrange
    const input = {
      nome: 'Teste',
      dependenciaId: 999,
    };

    (dependenciaExists as jest.Mock).mockResolvedValue(ok(false));

    // Act
    const result = await criarEntidade(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
    expect(saveEntidade).not.toHaveBeenCalled();
  });
});

describe('Entidade Integration - Atualização', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve atualizar entidade e preservar dados anteriores', async () => {
    // Arrange
    const entidadeExistente = {
      id: 1,
      nome: 'Nome Original',
      status: 'ativo',
    };

    const updateInput = {
      nome: 'Nome Atualizado',
    };

    const entidadeAtualizada = {
      ...entidadeExistente,
      nome: 'Nome Atualizado',
      dadosAnteriores: {
        nome: 'Nome Original',
      },
    };

    (findEntidadeById as jest.Mock).mockResolvedValue(ok(entidadeExistente));
    (updateEntidade as jest.Mock).mockResolvedValue(ok(entidadeAtualizada));

    // Act
    const result = await atualizarEntidade(1, updateInput);

    // Assert
    expect(result.success).toBe(true);
    expect(findEntidadeById).toHaveBeenCalledWith(1);
    expect(updateEntidade).toHaveBeenCalled();

    if (result.success) {
      expect(result.data.dadosAnteriores).toBeDefined();
      expect(result.data.nome).toBe('Nome Atualizado');
    }
  });
});
```

## Helpers Disponíveis

### Integration Helpers

Localização: [src/testing/integration-helpers.ts](./integration-helpers.ts)

#### Mock Factories

```typescript
import { mockContrato, mockExpediente } from '@/testing/integration-helpers';

// Criar mock com valores padrão
const contrato = mockContrato();

// Criar mock com sobrescritas
const contratoCustomizado = mockContrato({
  id: 10,
  status: 'contratado',
});
```

#### Builders

```typescript
import { buildMultipleContratos } from '@/testing/integration-helpers';

// Criar múltiplos contratos
const contratos = buildMultipleContratos(5, {
  status: 'contratado',
});
```

#### Assertion Helpers

```typescript
import { assertPaginationCorrect } from '@/testing/integration-helpers';

// Verificar paginação
assertPaginationCorrect(result, 1, 10, 100);
// Valida: page=1, limit=10, total=100, totalPages=10, hasMore=true
```

#### Date Helpers

```typescript
import { daysAgo, daysFromNow, formatDateOnly } from '@/testing/integration-helpers';

const ontem = daysAgo(1);
const amanha = daysFromNow(1);
const hoje = formatDateOnly();
```

#### Supabase Mocks

```typescript
import { createMockSupabaseForIntegration } from '@/testing/integration-helpers';

const mockDb = createMockSupabaseForIntegration();
(createDbClient as jest.Mock).mockReturnValue(mockDb);
```

## Comandos Úteis

### Executar todos os testes de integração

```bash
npm run test:integration
```

### Executar com watch mode

```bash
npm run test:integration:watch
```

### Executar com coverage

```bash
npm run test:integration:coverage
```

### Executar teste de uma feature específica

```bash
npm run test:integration -- contratos
```

### Executar teste de um arquivo específico

```bash
npm run test:integration -- contratos-flow.test.ts
```

## Boas Práticas

### 1. Sempre Mock Dependências Externas

```typescript
jest.mock('../../repository');
jest.mock('@/lib/supabase');
jest.mock('@/lib/redis');
```

### 2. Limpar Mocks entre Testes

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 3. Usar Type Guards em Assertions

```typescript
const result = await criarContrato(input);

expect(result.success).toBe(true);

// Type guard para acessar result.data com segurança
if (result.success) {
  expect(result.data.id).toBe(1);
}
```

### 4. Testar Casos de Erro

Sempre teste tanto o caminho feliz quanto os casos de erro:

```typescript
describe('Feature Integration', () => {
  it('deve funcionar com sucesso', async () => {
    // Caso feliz
  });

  it('deve falhar se validação não passar', async () => {
    // Caso de erro
  });
});
```

### 5. Não Testar Implementação, Testar Comportamento

Evite:
```typescript
// Ruim: testando implementação
expect(result.data.createdAt).toContain('2024');
```

Prefira:
```typescript
// Bom: testando comportamento
expect(result.success).toBe(true);
expect(result.data.id).toBeDefined();
```

## Estrutura de Describes

Organize seus testes por **fluxo/operação**, não por função:

```typescript
// ✅ Bom
describe('Contratos Integration - Criação', () => {
  it('deve criar contrato com cliente');
  it('deve validar cliente antes de criar');
  it('deve falhar com dados inválidos');
});

describe('Contratos Integration - Atualização', () => {
  it('deve atualizar contrato');
  it('deve preservar dados anteriores');
});

// ❌ Ruim
describe('criarContrato', () => {
  // ...
});

describe('atualizarContrato', () => {
  // ...
});
```

## Cobertura de Código

Os testes de integração contribuem para a cobertura geral do projeto.

Meta de cobertura: **80-90%** dos fluxos críticos.

### Verificar cobertura

```bash
npm run test:integration:coverage
```

## Referências

### Testes Existentes

- **Contratos**: [contratos-flow.test.ts](../features/contratos/__tests__/integration/contratos-flow.test.ts)
- **Expedientes**: [expedientes-flow.test.ts](../features/expedientes/__tests__/integration/expedientes-flow.test.ts)
- **RH**: [rh-folha-pagamento-flow.test.ts](../features/rh/__tests__/integration/rh-folha-pagamento-flow.test.ts)
- **Cargos**: [cargos-flow.test.ts](../features/cargos/__tests__/integration/cargos-flow.test.ts)
- **Advogados**: [advogados-credenciais-flow.test.ts](../features/advogados/__tests__/integration/advogados-credenciais-flow.test.ts)
- **Documentos**: [file-manager-flow.test.ts](../features/documentos/__tests__/integration/file-manager-flow.test.ts)

### Recursos

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Integration Helpers](./integration-helpers.ts)
- [Testing Setup](./setup.ts)

---

**Última atualização**: 2024-01-02
