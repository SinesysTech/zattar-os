# Guia de Testes do Sinesys

Este guia descreve a estratégia de testes do projeto Sinesys, alinhada com a arquitetura Feature-Sliced Design (FSD).

## Estrutura de Testes

Os testes são colocados dentro de cada feature, próximos ao código que eles testam, para melhorar a manutenção e a coesão.

```text
src/
  features/
    [feature-name]/
      __tests__/
        unit/           # Testes de unidade (serviços, dominios)
        integration/    # Testes de integração (fluxos completos)
        components/     # Testes de componentes UI
```

## Tipos de Testes

### 1. Testes Unitários (`test:unit`)

Testam funções isoladas, regras de domínio e serviços.

- **Local:** `__tests__/unit`
- **Extensão:** `.service.test.ts` ou `.test.ts`
- **Mocks:** Devem mockar repositórios e dependências externas (ex: Supabase).

Exemplo:

```typescript
import { criarUsuario } from '../../service';
import { usuarioRepository } from '../../repository';
jest.mock('../../repository');

it('deve criar usuário', async () => { ... });
```

### 2. Testes de Integração (`test:integration`)

Testam a interação entre camadas (Service -> Repository) ou fluxos maiores.

- **Local:** `__tests__/integration`
- **Extensão:** `.integration.test.ts`
- **Mocks:** Podem usar banco em memória ou mocks parciais.

### 3. Testes de Componentes (`test:components`)

Testam componentes React, interações de UI e acessibilidade.

- **Local:** `__tests__/components` (ou em `src/components/__tests__` para shared)
- **Ferramentas:** React Testing Library

## Comandos Úteis

- `npm run test` - Roda todos os testes
- `npm run test:unit` - Roda apenas testes unitários
- `npm run test:integration` - Roda apenas testes de integração
- `npm run test:components` - Roda apenas testes de componentes
- `npm run test:ci` - Roda testes otimizados para CI

## Boas Práticas

1. **Use Helpers:** Utilize `src/testing/factories.ts` para gerar dados de teste.
2. **Mock Supabase:** Utilize `createMockSupabaseClient` de `src/testing/mocks.ts`.
3. **Não commite `console.log`** nos testes.
4. **Respeite o FSD:** Não importe código de outras features diretamente nos testes unitários a menos que seja via interface pública.
