# Change: Refatorar Obrigacoes - Separacao Juridico/Financeiro

## Why

Existe uma confusao conceitual grave no sistema entre o controle juridico de Acordos/Condenacoes (`features/obrigacoes/`) e a tentativa de criar uma camada "bridge" em `features/financeiro/domain/obrigacoes.ts`. Esta redundancia causa:

1. **Duplicacao de tipos e logica** - Tipos como `ObrigacaoComDetalhes` tentam consolidar dados que ja existem separadamente
2. **Confusao de responsabilidades** - Nao esta claro onde termina o juridico e comeca o financeiro
3. **Dificuldade de manutencao** - Alteracoes precisam ser feitas em multiplos lugares
4. **Inconsistencia de dados** - Risco de divergencia entre representacoes paralelas

## What Changes

### Fase 1: Consolidacao do Modulo Juridico (`features/obrigacoes/`)
- Garantir que `domain.ts` contem apenas tipos juridicos puros
- Remover referencias a `lancamentos_financeiros` do repository
- Remover logica de sincronizacao do service
- Documentar regras de negocio juridicas em `RULES.md`

### Fase 2: Limpeza do Modulo Financeiro (`features/financeiro/`)
- **BREAKING**: Remover `features/financeiro/domain/obrigacoes.ts`
- **BREAKING**: Remover `features/financeiro/types/obrigacoes.ts`
- Simplificar `features/financeiro/repository/obrigacoes.ts` - manter apenas integracao
- Simplificar `features/financeiro/services/obrigacoes.ts` - manter apenas sincronizacao
- Reorganizar actions para separacao clara

### Fase 3: Implementar Pagina de Obrigacoes
- Criar `ObrigacoesContent` com multiplas visualizacoes (semana, mes, ano, lista)
- Criar `ObrigacoesTableWrapper` seguindo padrao DataShell
- Criar visualizacoes de calendario
- Criar dialogs (nova, detalhes, declaracao, comprovante)
- Criar componentes de resumo e alertas

### Fase 4: Rotas e Navegacao
- Atualizar pagina principal `/financeiro/obrigacoes`
- Criar rotas para visualizacoes (semana, mes, ano, lista)
- Atualizar sidebar com submenu

### Fase 5: Sincronizacao Automatica
- Implementar trigger de sincronizacao Juridico -> Financeiro
- Criar actions de sincronizacao em `features/financeiro/`
- Garantir integridade bidirecional

### Fase 6: Documentacao
- Criar `RULES.md` com regras de negocio juridicas
- Atualizar `AGENTS.md` com nova arquitetura
- Criar `README.md` para o modulo

## Impact

### Affected Specs
- `obrigacoes` - Refatoracao completa da capability

### Affected Code

#### Features Modificadas
- `src/features/obrigacoes/` - Consolidacao como modulo juridico puro
- `src/features/financeiro/` - Remocao de redundancias

#### Arquivos Principais
- `src/features/obrigacoes/domain.ts` - Tipos juridicos
- `src/features/obrigacoes/repository.ts` - CRUD de acordos/parcelas
- `src/features/obrigacoes/service.ts` - Logica de negocio juridica
- `src/features/obrigacoes/actions/` - Server actions
- `src/features/obrigacoes/components/` - Componentes UI
- `src/features/financeiro/domain/obrigacoes.ts` - **REMOVER**
- `src/features/financeiro/types/obrigacoes.ts` - **REMOVER**
- `src/features/financeiro/services/obrigacoes.ts` - Simplificar
- `src/features/financeiro/repository/obrigacoes.ts` - Simplificar

#### Rotas Afetadas
- `/financeiro/obrigacoes` - Atualizar
- `/financeiro/obrigacoes/semana` - Criar
- `/financeiro/obrigacoes/mes` - Criar
- `/financeiro/obrigacoes/ano` - Criar
- `/financeiro/obrigacoes/lista` - Criar

### Breaking Changes
- Tipos `ObrigacaoComDetalhes`, `ParcelaObrigacao`, `ObrigacaoJuridica` serao removidos
- Imports de `features/financeiro/domain/obrigacoes` precisarao ser atualizados
- Imports de `features/financeiro/types/obrigacoes` precisarao ser atualizados

### Migration Path
1. Atualizar imports para usar tipos de `features/obrigacoes/domain`
2. Usar `features/obrigacoes/service` para operacoes juridicas
3. Usar `features/financeiro/services/obrigacoes` apenas para sincronizacao

## Arquitetura Alvo

```
JURIDICO (features/obrigacoes/)
├── Acordos/Condenacoes
├── Parcelas
└── Repasses ao cliente

        ↓ [Sincronizacao Automatica]

FINANCEIRO (features/financeiro/)
├── Lancamentos (Contas a Receber/Pagar)
├── Fluxo de Caixa
└── Contas Contabeis
```

## Beneficios Esperados

1. **Clareza conceitual** - Separacao clara entre juridico e financeiro
2. **Reducao de codigo** - Eliminacao de duplicacoes
3. **Facilidade de manutencao** - Alteracoes em um lugar apenas
4. **Consistencia de dados** - Uma unica fonte de verdade para cada dominio
5. **Melhor UX** - Pagina de obrigacoes com visualizacoes ricas
