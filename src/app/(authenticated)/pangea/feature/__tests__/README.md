# Testes - Pangea

## Estrutura

- `unit/`: Testes unitários (service, repository, domain)
- `integration/`: Testes de integração (API externa, cache)
- `actions/`: Testes de Server Actions
- `fixtures.ts`: Dados de teste

## Cobertura de Testes

### Testes Unitários

**pangea.service.test.ts**: Lógica de negócio
- `buscarPrecedentes()`: validação Zod, sucesso, erro de API
- `listarOrgaosDisponiveis()`: sucesso, cache, erro

**pangea.repository.test.ts**: Integração com API
- `buscarPrecedentesPangea()`: chamada HTTP, headers, query params
- `listarOrgaosDisponiveis()`: chamada HTTP, cache
- Tratamento de erros: timeout, 500, 404

**pangea.domain.test.ts**: Schemas Zod complexos
- `pangeaBuscaInputSchema`: tamanhoPagina (max 10.000), ordenacao (enum), tipos (enum)
- `pangeaBuscaResponseSchema`: transformações de dados, nullToUndefined
- `pangeaResultadoSchema`: nr como number ou string, link opcional
- Transformações: datas (yyyy-mm-dd ou dd/mm/yyyy), nullToUndefined
- Edge cases: campos null, arrays vazios, números como strings

**Property-Based Testing:**
```typescript
import * as fc from 'fast-check';

it('deve validar schema com dados aleatórios', () => {
  fc.assert(
    fc.property(
      fc.record({
        buscaGeral: fc.string(),
        pagina: fc.integer({ min: 1, max: 100 }),
        tamanhoPagina: fc.integer({ min: 1, max: 10000 }),
      }),
      (input) => {
        const result = pangeaBuscaInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Testes de Integração

**pangea-busca-flow.test.ts**: Fluxos com API externa
- Buscar precedentes → Validar resposta → Parsear com Zod
- Listar órgãos → Filtrar por código → Buscar precedentes por órgão
- Busca com múltiplos filtros → Validar agregações (aggsEspecies, aggsOrgaos)
- Busca com paginação → Validar posicao_inicial, posicao_final, total

**Mock fetch:**
```typescript
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(criarPangeaBuscaResponseMock()),
  })
) as jest.Mock;
```

### Testes de Actions

**pangea-actions.test.ts**: Server Actions
- `actionListarOrgaosPangeaDisponiveis()`: autenticação (permissão: pangea:listar), sucesso
- `actionBuscarPrecedentesPangea()`: autenticação, validação Zod, sucesso, erro de API

## Executar Testes

```bash
npm run test:pangea
npm run test:pangea -- --watch
npm run test:coverage:pangea
```

## Fixtures

```typescript
import { criarPangeaBuscaInputMock, criarPangeaBuscaResponseMock } from '../fixtures';

const input = criarPangeaBuscaInputMock({
  buscaGeral: 'trabalho remoto',
  tamanhoPagina: 50,
});

const response = criarPangeaBuscaResponseMock(10);
```

## Features Especiais

### Schemas Zod Complexos

- **nullToUndefined**: Converte null em undefined
- **nullableArray**: Arrays que aceitam null
- **nullableRecord**: Records que aceitam null
- **nullableInt**: Números que aceitam null ou string
- **Preprocessors**: Transformam dados antes da validação

### Validações Especiais

- **nr**: Aceita number ou string, converte para number
- **link**: Aceita qualquer formato, converte para string
- **datas**: Aceita yyyy-mm-dd ou dd/mm/yyyy
- **arrays**: [] quando null
- **records**: {} quando null

## Cobertura Esperada

- Service: 90%+
- Repository: 85%+
- Domain: 95%+ (schemas complexos)
- Actions: 90%+
