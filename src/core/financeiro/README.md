# Módulo Financeiro (Core)

Este diretório contém a lógica de negócio centralizada (Core) do módulo financeiro do Sinesys.

## Arquitetura Unificada

O módulo foi refatorado para seguir uma arquitetura unificada, onde **Lançamentos** atuam como o "Livro Razão" (General Ledger), centralizando todas as movimentações financeiras, independentemente de sua origem (Obrigações Jurídicas, Contas Avulsas, Folha, etc.).

### Estrutura de Diretórios

- **`lancamentos/`**: Entidade central. Registra receitas e despesas efetivas ou previstas.
- **`obrigacoes-juridicas/`**: Gerencia acordos e obrigações oriundas de processos. Sincroniza parcelas para criar Lançamentos. Contém lógica de Split de Pagamentos e Repasses.
- **`plano-contas/`**: Categorização hierárquica das contas (ex: "1. Receitas", "2. Despesas Operacionais").
- **`conciliacao/`**: Lógica de conciliação bancária (matching entre extratos e lançamentos).
- **`fluxo-caixa/`**: Serviço agregador que consolida Lançamentos (Realizado) e Obrigações Pendentes (Projetado) para relatórios unificados.

## Principais Fluxos

1.  **Sincronização**: `ObrigacoesService` -> cria/atualiza `Lancamento`.
2.  **Repasse**: `ObrigacoesService` gerencia o ciclo de vida do repasse ao cliente (Pendente -> Declaração -> Transferido).
3.  **Fluxo de Caixa**: `FluxoCaixaService` lê de `LancamentosRepository` e `ObrigacoesRepository` para gerar visão completa.

## Como Usar

A lógica deve ser consumida preferencialmente via **Server Actions** localizadas em `src/app/actions/financeiro/`.

### Exemplo: Obter Fluxo de Caixa

```typescript
import { actionObterFluxoCaixaUnificado } from '@/app/actions/financeiro/dashboard/actionObterFluxoCaixaUnificado';

const { data } = await actionObterFluxoCaixaUnificado('2024-01-01', '2024-06-30');
// data.realizado
// data.projetado
```
