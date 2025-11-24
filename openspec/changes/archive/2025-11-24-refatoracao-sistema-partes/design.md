# Design: Refatoração do Sistema de Partes

## Context
O sistema atual não suporta adequadamente a captura de partes do PJE. A estrutura de dados é incompatível com o formato retornado pela API do PJE, dificultando a implementação de captura automatizada.

## Decision Drivers
1. **Alinhamento com PJE**: Estrutura de dados deve ser idêntica ao PJE para facilitar mapeamento
2. **Normalização**: Endereços e telefones são entidades próprias no PJE
3. **Flexibilidade**: Uma pessoa pode ter múltiplos endereços, emails e telefones
4. **Rastreabilidade**: Cada parte pode aparecer em múltiplos processos com papéis diferentes
5. **UX**: Centralizar gestão de todas as partes em uma interface única

## Architectural Decisions

### 1. Normalização de Endereços

**Decisão**: Criar tabela `enderecos` separada com relacionamento polimórfico.

**Alternativas consideradas**:
- ❌ Manter endereço como JSONB em cada tabela
- ❌ Criar tabelas separadas (clientes_enderecos, partes_contrarias_enderecos, etc)
- ✅ **Tabela única polimórfica** (escolhida)

**Rationale**:
- PJE trata endereços como entidade própria (tem `id`, `idPessoa`, status)
- Uma pessoa pode ter múltiplos endereços (residencial, comercial, correspondência)
- Relacionamento polimórfico (`entidade_tipo`, `entidade_id`) evita duplicação de código
- Permite queries diretas em endereços (busca por CEP, município, etc)
- Facilita atualização quando PJE retorna novos endereços

**Trade-offs**:
- ✅ Pro: Flexibilidade, normalização, queries eficientes
- ⚠️ Contra: JOINs necessários (mitigado com índices)
- ⚠️ Contra: Polimorfismo pode confundir iniciantes (mitigado com helpers)

### 2. Estrutura Idêntica ao PJE

**Decisão**: Replicar estrutura de campos do PJE sem simplificações.

**Alternativas consideradas**:
- ❌ Simplificar campos, manter apenas essenciais
- ❌ Usar JSONB para dados "extras" do PJE
- ✅ **Campos explícitos para tudo** (escolhida)

**Rationale**:
- Mapeamento 1:1 facilita captura automatizada (menos transformações)
- TypeScript garante type-safety
- Queries SQL diretas em qualquer campo
- Facilita debug (dados visíveis no banco)
- Permite análises e relatórios avançados

**Trade-offs**:
- ✅ Pro: Type-safety, queries diretas, debug fácil
- ⚠️ Contra: Muitos campos (~60 por tabela)
- ⚠️ Contra: Formulários grandes (mitigado com tabs/accordions)

### 3. Separação: Identidade vs Participação

**Decisão**: Criar tabela `processo_partes` para relacionamento N:N.

**Alternativas consideradas**:
- ❌ Dados de participação direto em `clientes`/`partes_contrarias`
- ❌ JSONB em `acervo` com array de partes
- ✅ **Tabela de relacionamento dedicada** (escolhida)

**Rationale**:
```
┌─────────────┐       ┌──────────────────┐       ┌─────────┐
│  clientes   │───┐   │ processo_partes  │   ┌───│ acervo  │
│ (identidade)│   └──→│  (participação)  │←──┘   │(processo)│
└─────────────┘       └──────────────────┘       └─────────┘
      │                       │
      │ Dados gerais:         │ Dados específicos:
      │ - CPF/CNPJ            │ - polo (ativo/passivo)
      │ - Nome                │ - tipo_parte (AUTOR/RÉU)
      │ - Endereços           │ - ordem, principal
      │ - Telefones           │ - id_pje (deste processo)
      │ - Data nascimento     │ - dados_pje_completo
```

**Exemplo**:
- Cliente "João Silva" (CPF 123...) existe uma vez em `clientes`
- Aparece como AUTOR no processo A (registro em `processo_partes`)
- Aparece como RÉU no processo B (outro registro em `processo_partes`)
- Mantém mesma identidade, papéis diferentes

**Trade-offs**:
- ✅ Pro: Normalização correta, histórico completo
- ✅ Pro: Suporta litisconsortes (múltiplas partes mesmo lado)
- ⚠️ Contra: JOIN adicional (mitigado com índices e foreign keys)

### 4. Tabela Terceiros Separada

**Decisão**: Criar tabela `terceiros` independente de `clientes`/`partes_contrarias`.

**Alternativas consideradas**:
- ❌ Colocar terceiros em `partes_contrarias` com flag
- ❌ Tabela única `partes` para tudo
- ✅ **Tabela dedicada `terceiros`** (escolhida)

**Rationale**:
- Terceiros têm natureza diferente (não são clientes nem adversários)
- Tipos diversos: PERITO, MINISTERIO_PUBLICO, ASSISTENTE, etc
- Não participam de contratos
- Campos específicos (especialidade do perito, órgão do MP, etc)
- Facilita queries e relatórios específicos

**Trade-offs**:
- ✅ Pro: Semântica clara, queries específicas
- ✅ Pro: Facilita evolução futura (campos específicos)
- ⚠️ Contra: Mais uma tabela (aceitável dado o domínio)

### 5. Frontend Unificado com Tabs

**Decisão**: Página única `/partes` com tabs (Clientes | Partes Contrárias | Terceiros).

**Alternativas consideradas**:
- ❌ Manter páginas separadas (`/clientes`, `/partes-contrarias`, `/terceiros`)
- ❌ Página única com filtro dropdown
- ✅ **Tabs com ClientOnlyTabs** (escolhida)

**Rationale**:
```
/partes
├── Tab: Clientes ────────┐
├── Tab: Partes Contrárias│ ← Navegação rápida
├── Tab: Terceiros────────┘   sem reload
└── Compartilham:
    - Layout
    - Estilos
    - Lógica de tabela
    - Formulários similares
```

- UX: Troca rápida entre tipos sem navegação
- DX: Código compartilhado (componentes, hooks, tipos)
- React 19: `ClientOnlyTabs` evita hydration mismatch
- Estado local preservado durante troca de tabs

**Trade-offs**:
- ✅ Pro: UX superior, menos código duplicado
- ✅ Pro: URL simples (`/partes?tab=clientes`)
- ⚠️ Contra: Bundle maior (mitigado com lazy loading se necessário)

## Data Flow

### Captura de Partes (Fluxo Futuro)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. API PJE: GET /processos/:id/partes?retornaEndereco=true │
└──────────────────────┬──────────────────────────────────────┘
                       │ JSON { ATIVO, PASSIVO, TERCEIROS }
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Identificar Cliente (via advogado da credencial)        │
│    - Advogado em ATIVO.representantes → Cliente = ATIVO    │
│    - Advogado em PASSIVO.representantes → Cliente = PASSIVO│
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Upsert Entidades                                         │
│    ┌───────────────┐  ┌──────────────────┐  ┌───────────┐ │
│    │ Cliente       │  │ Parte Contrária  │  │ Terceiro  │ │
│    │ (identidade)  │  │ (identidade)     │  │(identidade│ │
│    │ em clientes   │  │ em partes_contra.│  │em terceiro│ │
│    └───────┬───────┘  └────────┬─────────┘  └─────┬─────┘ │
│            │                   │                    │       │
│            └───────────────────┴────────────────────┘       │
└────────────────────────────────┬────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Upsert Endereços                                         │
│    Para cada parte.endereco:                                │
│    INSERT INTO enderecos (entidade_tipo, entidade_id, ...)  │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Upsert Relacionamento                                    │
│    INSERT INTO processo_partes (                            │
│      processo_id,                                           │
│      tipo_entidade ('cliente'/'parte_contraria'/'terceiro'),│
│      entidade_id,                                           │
│      polo, tipo_parte, ordem, ...                           │
│    )                                                        │
└─────────────────────────────────────────────────────────────┘
```

### Query de Partes de um Processo

```sql
-- Buscar todas as partes de um processo
SELECT
  pp.polo,
  pp.tipo_parte,
  pp.ordem,
  pp.principal,
  CASE pp.tipo_entidade
    WHEN 'cliente' THEN c.nome
    WHEN 'parte_contraria' THEN pc.nome
    WHEN 'terceiro' THEN t.nome
  END as nome,
  CASE pp.tipo_entidade
    WHEN 'cliente' THEN c.cpf
    WHEN 'parte_contraria' THEN pc.cpf
    WHEN 'terceiro' THEN t.cpf
  END as documento
FROM processo_partes pp
LEFT JOIN clientes c ON pp.tipo_entidade = 'cliente' AND pp.entidade_id = c.id
LEFT JOIN partes_contrarias pc ON pp.tipo_entidade = 'parte_contraria' AND pp.entidade_id = pc.id
LEFT JOIN terceiros t ON pp.tipo_entidade = 'terceiro' AND pp.entidade_id = t.id
WHERE pp.processo_id = :processo_id
ORDER BY pp.polo, pp.ordem;
```

## Performance Considerations

### Índices Criados
```sql
-- enderecos
CREATE INDEX idx_enderecos_entidade ON enderecos(entidade_tipo, entidade_id);
CREATE INDEX idx_enderecos_id_pje ON enderecos(id_pje) WHERE id_pje IS NOT NULL;
CREATE INDEX idx_enderecos_cep ON enderecos(cep) WHERE cep IS NOT NULL;

-- clientes
CREATE UNIQUE INDEX idx_clientes_id_pessoa_pje ON clientes(id_pessoa_pje) WHERE id_pessoa_pje IS NOT NULL;
CREATE INDEX idx_clientes_cpf ON clientes(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_clientes_cnpj ON clientes(cnpj) WHERE cnpj IS NOT NULL;

-- partes_contrarias (idênticos)
-- terceiros (idênticos)

-- processo_partes (a criar)
CREATE INDEX idx_processo_partes_processo ON processo_partes(processo_id);
CREATE INDEX idx_processo_partes_entidade ON processo_partes(entidade_tipo, entidade_id);
CREATE UNIQUE INDEX idx_processo_partes_unique ON processo_partes(processo_id, id_pje, trt, grau);
```

### Query Patterns Otimizados
1. **Busca por processo**: `processo_id` indexado
2. **Busca por pessoa**: `entidade_tipo + entidade_id` indexado
3. **Busca por CPF/CNPJ**: Índices diretos em cada tabela
4. **Busca por endereço**: CEP e município_ibge indexados
5. **Deduplicação PJE**: `id_pessoa_pje` único por tabela

## Migration Strategy

### Fase 1: Database (Concluída ✅)
1. ✅ Criar `enderecos`
2. ✅ Alterar `clientes` (DROP + ADD columns)
3. ✅ Alterar `partes_contrarias` (DROP + ADD columns)

### Fase 2: Database (Pendente 🔄)
4. 🔄 Criar `terceiros`
5. 🔄 Criar `processo_partes`

### Fase 3: Backend (Pendente 🔄)
6. 🔄 Tipos TypeScript
7. 🔄 Serviços de persistência
8. 🔄 API routes com validação

### Fase 4: Frontend (Pendente 🔄)
9. 🔄 Renomear rota
10. 🔄 Implementar tabs
11. 🔄 Refatorar formulários
12. 🔄 Atualizar navegação

### Rollback Plan
- Tabelas vazias: DROP simples sem perda de dados
- Git revert para código backend/frontend
- Migrations numeradas sequencialmente para ordem correta

## Security Considerations

### RLS (Row Level Security)
```sql
-- Todas as tabelas habilitam RLS
ALTER TABLE enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE terceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE processo_partes ENABLE ROW LEVEL SECURITY;

-- Políticas padrão (seguindo padrão do projeto):
-- - Service role: Acesso total
-- - Authenticated users: SELECT
-- - Backend valida permissões granulares via sistema de permissões
```

### Validações
1. **Tipo de entidade**: CHECK constraint em `entidade_tipo`
2. **CPF/CNPJ**: Validação em application layer
3. **Unicidade**: `id_pessoa_pje` único por tabela
4. **Foreign Keys**: Garantem integridade referencial

## Testing Strategy

### Manual Tests
1. **CRUD Clientes**: Criar, ler, atualizar, deletar
2. **CRUD Partes Contrárias**: Operações completas
3. **Endereços**: Múltiplos endereços por entidade
4. **Relacionamento**: Vincular partes a processos
5. **UI Tabs**: Navegação e state preservation

### Integration Tests (Futuro)
- Captura de partes do PJE
- Deduplicação por `id_pessoa_pje`
- Queries com JOINs complexos

## Open Questions
- ❓ Adicionar soft delete em `processo_partes`? (parte removida do processo)
- ❓ Histórico de mudanças em endereços? (usar `dados_anteriores`?)
- ❓ Cache de queries complexas com JOINs?

## References
- [PJE API Endpoint](https://pje.trt3.jus.br/pje-comum-api/api/processos/id/{id}/partes)
- [Planejamento Inicial](docs/planejamento-captura-partes.md)
- Migrations aplicadas: `criar_tabela_enderecos`, `reestruturar_tabela_clientes`, `reestruturar_tabela_partes_contrarias`
