# Testes - Endereços

## Estrutura

- `unit/`: Testes unitários (service, repository, utils)
- `integration/`: Testes de integração (fluxos completos)
- `actions/`: Testes de Server Actions
- `fixtures.ts`: Dados de teste

## Arquivos de Teste

### Testes Unitários

- **enderecos.service.test.ts**: Testa a lógica de negócio do service
  - CRUD completo (criar, atualizar, buscar, listar, deletar)
  - Validação de parâmetros
  - Tratamento de erros

- **enderecos.repository.test.ts**: Testa operações de banco de dados
  - Queries Supabase
  - Filtros e ordenação
  - Tratamento de erros de banco (23505, PGRST116)
  - Soft delete

- **enderecos.utils.test.ts**: Testa funções utilitárias
  - Conversão de tipos (`converterParaEndereco`)
  - Validação Zod (`cepSchema`, `enderecoSchema`)
  - Transformações de dados

### Testes de Integração

- **enderecos-flow.test.ts**: Testa fluxos completos
  - CRUD completo: criar → buscar → atualizar → deletar
  - Listagem com paginação e filtros
  - Busca por entidade com ordenação
  - Upsert por id_pje
  - Filtros complexos

### Testes de Actions

- **enderecos-actions.test.ts**: Testa Server Actions
  - Validação Zod
  - Autenticação (authenticatedAction)
  - Revalidação de cache (revalidatePath)
  - Tratamento de erros

## Executar Testes

```bash
# Executar todos os testes de endereços
npm run test:enderecos

# Executar em modo watch
npm run test:enderecos -- --watch

# Executar com cobertura
npm run test:coverage:enderecos

# Executar apenas testes unitários
npm test -- src/features/enderecos/__tests__/unit

# Executar apenas testes de integração
npm test -- src/features/enderecos/__tests__/integration

# Executar apenas testes de actions
npm test -- src/features/enderecos/__tests__/actions
```

## Cobertura Esperada

- **Service**: 90%+
- **Repository**: 85%+
- **Actions**: 90%+
- **Utils**: 95%+

## Fixtures

O arquivo `fixtures.ts` contém funções auxiliares para gerar dados de teste:

- `criarEnderecoMock(overrides)`: Cria um endereço mock
- `criarListarEnderecosResultMock(numeroEnderecos, overrides)`: Cria resultado de listagem mock
- `mockEntidadeTipo`: Mock de tipos de entidade
- `mockSituacaoEndereco`: Mock de situações de endereço

### Exemplo de Uso

```typescript
import { criarEnderecoMock } from '../fixtures';

const endereco = criarEnderecoMock({
  id: 1,
  logradouro: 'Rua Custom',
  municipio: 'Rio de Janeiro',
});
```

## Padrão AAA

Todos os testes seguem o padrão **Arrange-Act-Assert**:

```typescript
it('deve criar endereço com sucesso', async () => {
  // Arrange - Preparar dados e mocks
  const endereco = criarEnderecoMock();
  (repository.criarEndereco as jest.Mock).mockResolvedValue(ok(endereco));

  // Act - Executar ação
  const result = await service.criarEndereco({ ... });

  // Assert - Verificar resultados
  expect(result.success).toBe(true);
  expect(result.data).toEqual(endereco);
});
```

## Mocks

### Supabase Client

```typescript
const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  single: jest.fn(),
};
```

### Authenticated Action

```typescript
const mockAuthAction = jest.fn((schema, handler) => {
  return async (input: unknown) => {
    const validation = schema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: 'Dados inválidos' };
    }
    return handler(input, { userId: 'user123' });
  };
});
```

## Convenções

1. Sempre usar `// @ts-nocheck` no início dos arquivos de teste
2. Limpar mocks em `beforeEach`
3. Usar `ok()` e `err()` do tipo `Result<T>` para resultados
4. Nomear testes descritivamente: "deve [ação] quando [condição]"
5. Agrupar testes relacionados com `describe`
