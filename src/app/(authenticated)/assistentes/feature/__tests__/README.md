# Testes - Assistentes

## Estrutura

- `unit/`: Testes unitários (service, repository, domain)
- `integration/`: Testes de integração (fluxos CRUD completos)
- `actions/`: Testes de Server Actions
- `fixtures.ts`: Dados de teste

## Cobertura de Testes

### Testes Unitários

**assistentes.service.test.ts**: Lógica de negócio
- `listarAssistentes()`: filtros (busca, ativo), ordenação
- `buscarAssistentePorId()`: sucesso, não encontrado
- `criarAssistente()`: validação Zod, sucesso, criado_por
- `atualizarAssistente()`: validação Zod, sucesso, updated_at
- `deletarAssistente()`: soft delete (ativo = false)

**assistentes.repository.test.ts**: Operações de banco
- Queries Supabase: CRUD completo
- Filtros: busca (nome, descricao), ativo
- Tratamento de erros: duplicata, não encontrado

**assistentes.domain.test.ts**: Schemas Zod
- `assistenteSchema`: nome obrigatório (min 1, max 200), iframe_code obrigatório
- `criarAssistenteSchema`: campos obrigatórios
- `atualizarAssistenteSchema`: partial
- Tipos: `Assistente`, `AssistentesParams`

### Testes de Integração

**assistentes-flow.test.ts**: Fluxos completos
- Criar assistente → Buscar por ID → Atualizar → Deletar
- Listar assistentes ativos → Filtrar por busca → Validar ordenação
- Criar assistente com dados inválidos → Validar erro Zod

### Testes de Actions

**assistentes-actions.test.ts**: Server Actions
- `actionListarAssistentes()`: autenticação (permissão: assistentes:listar), filtros
- `actionBuscarAssistente()`: autenticação, ID válido/inválido
- `actionCriarAssistente()`: autenticação (permissão: assistentes:criar), validação Zod, revalidatePath
- `actionAtualizarAssistente()`: autenticação (permissão: assistentes:editar), validação Zod, revalidatePath
- `actionDeletarAssistente()`: autenticação (permissão: assistentes:deletar), revalidatePath

## Executar Testes

```bash
npm run test:assistentes
npm run test:assistentes -- --watch
npm run test:coverage:assistentes
```

## Fixtures

```typescript
import { criarAssistenteMock } from '../fixtures';

const assistente = criarAssistenteMock({
  nome: 'Assistente Custom',
  iframe_code: '<iframe src="..."></iframe>',
});
```

## Cobertura Esperada

- Service: 90%+
- Repository: 85%+
- Domain: 95%+
- Actions: 90%+
