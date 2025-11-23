# Tasks: Refatoração do Sistema de Partes

## Overview
Total: 22 tarefas organizadas em 7 fases sequenciais.

## FASE 1: Preparação do Banco de Dados

### ✅ Task 1.1: Criar tabela enderecos
**Status**: ✅ Concluído
**Estimated**: 30min | **Actual**: 20min

**Description**: Criar tabela normalizada para endereços polimórficos.

**Acceptance Criteria**:
- [x] Tabela criada com todos os campos do PJE
- [x] Relacionamento polimórfico (`entidade_tipo`, `entidade_id`)
- [x] Índices criados (entidade, id_pje, CEP, município_ibge)
- [x] RLS habilitado
- [x] Comentários em todos os campos

**Validation**: Migration `criar_tabela_enderecos` aplicada com sucesso.

---

### ✅ Task 1.2: Reestruturar tabela clientes
**Status**: ✅ Concluído
**Estimated**: 45min | **Actual**: 30min

**Description**: Adicionar campos PJE e remover campos antigos de clientes.

**Acceptance Criteria**:
- [x] 42 campos novos adicionados (PF, PJ, PJE, contatos)
- [x] 4 campos removidos (endereco, email, telefones)
- [x] Índice único em `id_pessoa_pje`
- [x] Comentários em campos principais

**Validation**: Migration `reestruturar_tabela_clientes` aplicada com sucesso.

---

### ✅ Task 1.3: Reestruturar tabela partes_contrarias
**Status**: ✅ Concluído
**Estimated**: 45min | **Actual**: 25min

**Description**: Aplicar mesma reestruturação de clientes em partes_contrarias.

**Acceptance Criteria**:
- [x] Estrutura idêntica a `clientes`
- [x] 42 campos novos, 4 removidos
- [x] Índices criados

**Validation**: Migration `reestruturar_tabela_partes_contrarias` aplicada.

---

### Task 1.4: Criar tabela terceiros
**Status**: 🔄 Pendente
**Estimated**: 1h
**Dependencies**: None

**Description**: Criar tabela para terceiros interessados (peritos, MP, etc).

**Acceptance Criteria**:
- [ ] Estrutura similar a clientes/partes_contrarias
- [ ] Campo `tipo_parte` para PERITO, MINISTERIO_PUBLICO, ASSISTENTE, etc
- [ ] Relacionamento com processo via `processo_id`
- [ ] Índices: id_pessoa_pje (único), cpf, cnpj, tipo_parte, processo_id
- [ ] RLS habilitado
- [ ] Comentários completos

**Validation**:
```sql
-- Deve retornar a tabela
\d terceiros;

-- Deve retornar índices
\di terceiros_*;
```

---

### Task 1.5: Criar tabela processo_partes
**Status**: 🔄 Pendente
**Estimated**: 1h
**Dependencies**: Task 1.4

**Description**: Criar tabela de relacionamento N:N entre processos e partes.

**Acceptance Criteria**:
- [ ] FK para `acervo(id)` (processo_id)
- [ ] Relacionamento polimórfico para entidades (tipo_entidade, entidade_id)
- [ ] Campos de participação: polo, tipo_parte, ordem, principal
- [ ] Campo `dados_pje_completo` JSONB (JSON original)
- [ ] Constraint UNIQUE (processo_id, id_pje, trt, grau)
- [ ] Índices: processo_id, entidade, id_pje
- [ ] RLS habilitado

**Validation**:
```sql
-- Deve retornar a tabela com constraints
\d processo_partes;

-- Deve retornar constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'processo_partes';
```

---

## FASE 2: Backend - Tipos TypeScript

### Task 2.1: Atualizar tipos backend para clientes
**Status**: 🔄 Pendente
**Estimated**: 1h
**Dependencies**: Task 1.3

**Description**: Criar tipos TypeScript backend para nova estrutura de clientes.

**Files**:
- `backend/types/database.types.ts` (ou similar)
- `backend/clientes/types.ts` (se existir)

**Acceptance Criteria**:
- [ ] Tipo `Cliente` com todos os 60 campos
- [ ] Tipos para PF e PJ (union types ou discriminated union)
- [ ] Tipo `ClienteInsert` (sem id, timestamps gerados)
- [ ] Tipo `ClienteUpdate` (campos opcionais)
- [ ] Tipos exportados e documentados

**Validation**:
```typescript
// Deve compilar sem erros
const cliente: Cliente = { /* ... */ };
const insert: ClienteInsert = { /* ... */ };
```

---

### Task 2.2: Atualizar tipos backend para partes_contrarias
**Status**: 🔄 Pendente
**Estimated**: 45min
**Dependencies**: Task 2.1

**Description**: Criar tipos para partes_contrarias (idênticos a Cliente).

**Acceptance Criteria**:
- [ ] Tipo `ParteContraria` com 60 campos
- [ ] Tipos Insert e Update
- [ ] Compartilhar utility types com Cliente se possível

**Validation**: Compilação TypeScript sem erros.

---

### Task 2.3: Criar tipos backend para enderecos
**Status**: 🔄 Pendente
**Estimated**: 45min
**Dependencies**: Task 1.1

**Description**: Criar tipos para tabela enderecos.

**Acceptance Criteria**:
- [ ] Tipo `Endereco` com campos do PJE
- [ ] Tipo `EntidadeTipo` = 'cliente' | 'parte_contraria' | 'terceiro'
- [ ] Tipos Insert e Update
- [ ] Helper type para relacionamento polimórfico

**Validation**: Compilação TypeScript sem erros.

---

### Task 2.4: Criar tipos backend para terceiros
**Status**: 🔄 Pendente
**Estimated**: 45min
**Dependencies**: Task 1.4

**Description**: Criar tipos para tabela terceiros.

**Acceptance Criteria**:
- [ ] Tipo `Terceiro` completo
- [ ] Tipos Insert e Update
- [ ] Tipo `TipoParteTerceiro` com valores possíveis

**Validation**: Compilação TypeScript sem erros.

---

### Task 2.5: Criar tipos backend para processo_partes
**Status**: 🔄 Pendente
**Estimated**: 45min
**Dependencies**: Task 1.5

**Description**: Criar tipos para relacionamento processo-partes.

**Acceptance Criteria**:
- [ ] Tipo `ProcessoParte` com campos de participação
- [ ] Tipos Insert e Update
- [ ] Tipo `PoloProcessual` = 'ativo' | 'passivo' | 'outros'
- [ ] Helper types para queries com JOINs

**Validation**: Compilação TypeScript sem erros.

---

## FASE 3: Backend - Serviços de Persistência

### Task 3.1: Atualizar serviço de clientes
**Status**: 🔄 Pendente
**Estimated**: 2h
**Dependencies**: Task 2.1

**Description**: Atualizar serviço de persistência de clientes.

**Files**:
- `backend/clientes/services/persistence/clientes.service.ts` (ou similar)

**Acceptance Criteria**:
- [ ] CRUD completo: create, read, update, delete
- [ ] Queries com novos campos
- [ ] Validações de CPF/CNPJ
- [ ] Tratamento de erros
- [ ] Deduplicação por `id_pessoa_pje`

**Validation**:
```typescript
// Testes manuais
const cliente = await clientesService.create({ /* ... */ });
const found = await clientesService.getById(cliente.id);
await clientesService.update(cliente.id, { /* ... */ });
await clientesService.delete(cliente.id);
```

---

### Task 3.2: Atualizar serviço de partes_contrarias
**Status**: 🔄 Pendente
**Estimated**: 1.5h
**Dependencies**: Task 2.2

**Description**: Criar/atualizar serviço de partes_contrarias.

**Acceptance Criteria**:
- [ ] CRUD completo (similar a clientes)
- [ ] Validações idênticas
- [ ] Queries otimizadas

**Validation**: Testes manuais de CRUD.

---

### Task 3.3: Criar serviço de enderecos
**Status**: 🔄 Pendente
**Estimated**: 2h
**Dependencies**: Task 2.3

**Description**: Criar serviço para gestão de endereços polimórficos.

**Files**:
- `backend/enderecos/services/persistence/enderecos.service.ts`

**Acceptance Criteria**:
- [ ] `getByEntidade(tipo, id)` - buscar endereços de uma entidade
- [ ] `create()` - criar endereço vinculado
- [ ] `update()` - atualizar endereço
- [ ] `delete()` - remover endereço
- [ ] `setPrincipal()` - definir endereço principal
- [ ] Validação de CEP
- [ ] Queries com filtros (situacao, correspondencia)

**Validation**:
```typescript
const enderecos = await enderecosService.getByEntidade('cliente', clienteId);
const novoEndereco = await enderecosService.create({
  entidade_tipo: 'cliente',
  entidade_id: clienteId,
  /* ... */
});
```

---

### Task 3.4: Criar serviço de terceiros
**Status**: 🔄 Pendente
**Estimated**: 1.5h
**Dependencies**: Task 2.4

**Description**: Criar serviço de persistência para terceiros.

**Acceptance Criteria**:
- [ ] CRUD completo
- [ ] Filtros por tipo_parte
- [ ] Queries por processo_id
- [ ] Deduplicação por id_pessoa_pje

**Validation**: Testes manuais de CRUD.

---

### Task 3.5: Criar serviço de processo_partes
**Status**: 🔄 Pendente
**Estimated**: 2h
**Dependencies**: Task 2.5

**Description**: Criar serviço para relacionamento processo-partes.

**Files**:
- `backend/processo-partes/services/persistence/processo-partes.service.ts`

**Acceptance Criteria**:
- [ ] `getByProcesso(processoId)` - todas as partes de um processo
- [ ] `getByEntidade(tipo, id)` - todos os processos de uma entidade
- [ ] `vincular()` - criar relacionamento
- [ ] `atualizar()` - atualizar dados de participação
- [ ] `desvincular()` - remover relacionamento
- [ ] Query com JOIN para retornar dados completos (nome, cpf, etc)

**Validation**:
```typescript
const partes = await processoPartesService.getByProcesso(processoId);
// Deve retornar array com dados das partes e seus relacionamentos
```

---

## FASE 4: Backend - API Routes

### Task 4.1: Atualizar API routes de clientes
**Status**: 🔄 Pendente
**Estimated**: 2h
**Dependencies**: Task 3.1

**Description**: Atualizar endpoints REST para clientes.

**Files**:
- `app/api/clientes/route.ts` (GET, POST)
- `app/api/clientes/[id]/route.ts` (GET, PUT, DELETE)

**Acceptance Criteria**:
- [ ] GET /api/clientes - listar com paginação
- [ ] POST /api/clientes - criar com validação
- [ ] GET /api/clientes/[id] - buscar por ID
- [ ] PUT /api/clientes/[id] - atualizar
- [ ] DELETE /api/clientes/[id] - deletar
- [ ] Validação de entrada (Zod ou similar)
- [ ] Autenticação com `authenticateRequest()`
- [ ] Documentação Swagger atualizada
- [ ] Tratamento de erros consistente

**Validation**:
```bash
# Testes com curl ou Postman
curl -X GET http://localhost:3000/api/clientes
curl -X POST http://localhost:3000/api/clientes -d '{ /* ... */ }'
```

---

### Task 4.2: Criar API routes de partes_contrarias
**Status**: 🔄 Pendente
**Estimated**: 1.5h
**Dependencies**: Task 3.2

**Description**: Criar endpoints REST para partes_contrarias.

**Files**:
- `app/api/partes-contrarias/route.ts`
- `app/api/partes-contrarias/[id]/route.ts`

**Acceptance Criteria**:
- [ ] Mesma estrutura de clientes
- [ ] CRUD completo
- [ ] Documentação Swagger

**Validation**: Testes manuais de todos os endpoints.

---

### Task 4.3: Criar API routes de enderecos
**Status**: 🔄 Pendente
**Estimated**: 1.5h
**Dependencies**: Task 3.3

**Description**: Criar endpoints para gestão de endereços.

**Files**:
- `app/api/enderecos/route.ts`
- `app/api/enderecos/[id]/route.ts`
- `app/api/enderecos/entidade/[tipo]/[id]/route.ts` (endereços de uma entidade)

**Acceptance Criteria**:
- [ ] GET /api/enderecos/entidade/cliente/[id] - endereços de um cliente
- [ ] POST /api/enderecos - criar endereço
- [ ] PUT /api/enderecos/[id] - atualizar
- [ ] DELETE /api/enderecos/[id] - deletar
- [ ] PATCH /api/enderecos/[id]/principal - definir como principal

**Validation**: Testes de CRUD com diferentes entidades.

---

## FASE 5: Frontend - Tipos TypeScript

### Task 5.1: Atualizar tipos frontend para clientes
**Status**: 🔄 Pendente
**Estimated**: 45min
**Dependencies**: Task 2.1

**Description**: Criar tipos frontend para clientes.

**Files**:
- `lib/types/clientes.ts` (ou similar)

**Acceptance Criteria**:
- [ ] Tipos sincronizados com backend
- [ ] Tipos para formulários (com validação Zod se aplicável)
- [ ] Tipos para respostas de API

**Validation**: Compilação TypeScript sem erros no frontend.

---

### Task 5.2: Criar tipos frontend para partes_contrarias
**Status**: 🔄 Pendente
**Estimated**: 30min
**Dependencies**: Task 2.2

**Description**: Criar tipos frontend para partes_contrarias.

**Acceptance Criteria**:
- [ ] Tipos sincronizados com backend
- [ ] Compartilhar utility types com clientes

**Validation**: Compilação TypeScript sem erros.

---

### Task 5.3: Criar tipos frontend para enderecos e terceiros
**Status**: 🔄 Pendente
**Estimated**: 30min
**Dependencies**: Task 2.3, Task 2.4

**Description**: Criar tipos frontend restantes.

**Acceptance Criteria**:
- [ ] Tipos para Endereco, Terceiro, ProcessoParte
- [ ] Todos sincronizados com backend

**Validation**: Compilação TypeScript sem erros.

---

## FASE 6: Frontend - Estrutura de Páginas

### Task 6.1: Renomear rota de clientes para partes
**Status**: 🔄 Pendente
**Estimated**: 30min
**Dependencies**: None

**Description**: Renomear pasta e atualizar rotas.

**Steps**:
1. Renomear `app/(dashboard)/clientes/` → `app/(dashboard)/partes/`
2. Atualizar imports internos
3. Atualizar links de navegação

**Acceptance Criteria**:
- [ ] Pasta renomeada
- [ ] Rota acessível em `/partes`
- [ ] Sem erros de compilação
- [ ] Links funcionando

**Validation**:
```bash
# Deve existir
ls app/(dashboard)/partes/

# Deve acessar
curl http://localhost:3000/partes
```

---

### Task 6.2: Criar estrutura com ClientOnlyTabs
**Status**: 🔄 Pendente
**Estimated**: 1h
**Dependencies**: Task 6.1

**Description**: Criar página principal com tabs usando ClientOnlyTabs (React 19).

**Files**:
- `app/(dashboard)/partes/page.tsx`

**Acceptance Criteria**:
- [ ] Componente `ClientOnlyTabs` importado
- [ ] 3 tabs: "Clientes", "Partes Contrárias", "Terceiros"
- [ ] URL com query param: `/partes?tab=clientes`
- [ ] Estado preservado ao trocar tabs
- [ ] Layout responsivo

**Validation**:
```tsx
// Deve renderizar sem hydration mismatch
// Deve trocar tabs sem reload
// URL deve atualizar corretamente
```

---

### Task 6.3: Implementar tab Clientes
**Status**: 🔄 Pendente
**Estimated**: 3h
**Dependencies**: Task 6.2, Task 4.1

**Description**: Implementar CRUD completo de clientes no tab.

**Components**:
- Listagem com DataTable
- Formulário de criação/edição
- Modal/Sheet de visualização
- Gestão de endereços (modal secundário ou accordion)

**Acceptance Criteria**:
- [ ] Listagem com filtros, paginação, ordenação
- [ ] Criar cliente (formulário com todos os campos)
- [ ] Editar cliente
- [ ] Deletar cliente (com confirmação)
- [ ] Visualizar detalhes completos
- [ ] Adicionar/editar/remover endereços do cliente
- [ ] Validações no formulário
- [ ] Loading states
- [ ] Mensagens de sucesso/erro

**Validation**:
- Manual: Testar fluxo completo de CRUD
- Visual: Todos os campos renderizando corretamente

---

### Task 6.4: Implementar tab Partes Contrárias
**Status**: 🔄 Pendente
**Estimated**: 2h
**Dependencies**: Task 6.3, Task 4.2

**Description**: Implementar CRUD de partes contrárias (similar a clientes).

**Acceptance Criteria**:
- [ ] Mesma estrutura de Clientes
- [ ] Todos os componentes adaptados
- [ ] CRUD completo funcional

**Validation**: Testes manuais de CRUD.

---

### Task 6.5: Implementar tab Terceiros (estrutura básica)
**Status**: 🔄 Pendente
**Estimated**: 1.5h
**Dependencies**: Task 6.4

**Description**: Criar estrutura básica do tab Terceiros.

**Acceptance Criteria**:
- [ ] Listagem de terceiros (vazia por enquanto)
- [ ] Mensagem "Nenhum terceiro cadastrado"
- [ ] Estrutura pronta para futuro CRUD
- [ ] Placeholder para funcionalidade futura

**Validation**: Tab renderiza sem erros, exibe mensagem apropriada.

---

### Task 6.6: Atualizar navegação e menu
**Status**: 🔄 Pendente
**Estimated**: 30min
**Dependencies**: Task 6.1

**Description**: Atualizar menu lateral e breadcrumbs.

**Files**:
- Componente de navegação/sidebar
- Breadcrumbs

**Acceptance Criteria**:
- [ ] Item "Clientes" renomeado para "Partes"
- [ ] Link aponta para `/partes`
- [ ] Ícone apropriado
- [ ] Breadcrumbs atualizado
- [ ] Active state correto

**Validation**: Navegação funcional, visual correto.

---

## FASE 7: Testes e Validação

### Task 7.1: Testar fluxo completo de clientes
**Status**: 🔄 Pendente
**Estimated**: 1h
**Dependencies**: Task 6.3

**Description**: Teste end-to-end do CRUD de clientes.

**Test Cases**:
1. Criar cliente PF com endereço
2. Criar cliente PJ com múltiplos endereços
3. Editar cliente (mudar dados PF)
4. Adicionar endereço adicional
5. Remover endereço
6. Deletar cliente
7. Validações de formulário (campos obrigatórios, CPF inválido)
8. Filtros e busca
9. Paginação

**Acceptance Criteria**:
- [ ] Todos os casos passam sem erros
- [ ] Dados salvos corretamente no banco
- [ ] UI responsiva e consistente

**Validation**: Checklist de casos de teste completa.

---

### Task 7.2: Testar fluxo completo de partes contrárias
**Status**: 🔄 Pendente
**Estimated**: 45min
**Dependencies**: Task 6.4

**Description**: Teste end-to-end do CRUD de partes contrárias.

**Test Cases**:
1. Criar parte contrária PF
2. Criar parte contrária PJ
3. Editar e deletar
4. Gestão de endereços
5. Validações

**Acceptance Criteria**:
- [ ] Todos os casos passam
- [ ] Comportamento idêntico a clientes

**Validation**: Checklist de casos de teste completa.

---

## Summary

| Fase | Tarefas | Concluídas | Pendentes | Tempo Estimado |
|------|---------|------------|-----------|----------------|
| 1. Database | 5 | 3 ✅ | 2 🔄 | 2h (1h15 restante) |
| 2. Tipos Backend | 5 | 0 | 5 🔄 | 4h15 |
| 3. Serviços Backend | 5 | 0 | 5 🔄 | 9h |
| 4. API Routes | 3 | 0 | 3 🔄 | 5h |
| 5. Tipos Frontend | 3 | 0 | 3 🔄 | 1h45 |
| 6. Frontend | 6 | 0 | 6 🔄 | 8h30 |
| 7. Testes | 2 | 0 | 2 🔄 | 1h45 |
| **TOTAL** | **29** | **3** | **26** | **~32 horas** |

## Parallel Work Opportunities
- Tasks 2.1-2.5 podem ser feitas em paralelo (tipos independentes)
- Tasks 3.1-3.4 podem ser parcialmente paralelas (após tipos prontos)
- Tasks 6.3 e 6.4 podem ser feitas em paralelo (tabs independentes)

## Critical Path
1. Database completo (1.4, 1.5) → Tipos → Serviços → API → Frontend
2. Sem database completo, backend não pode avançar
3. Sem API pronto, frontend não funciona

## Next Actions
1. ✅ **Concluir Fase 1**: Tasks 1.4 e 1.5 (criar terceiros e processo_partes)
2. 🔄 **Iniciar Fase 2**: Criar tipos TypeScript backend (paralelo)
3. 🔄 **Fase 3-4**: Implementar serviços e API (sequencial)
4. 🔄 **Fase 5-6**: Frontend completo (após API pronto)
5. 🔄 **Fase 7**: Testes finais
