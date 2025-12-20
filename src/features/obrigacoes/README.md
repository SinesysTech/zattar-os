# Módulo de Obrigações

Este módulo gerencia obrigações financeiras (acordos, condenações e custas processuais) seguindo a arquitetura FSD (Feature-Sliced Design).

## Estrutura

- **components/**
  - **table/**: Componentes da tabela (DataShell pattern)
  - **calendar/**: Visualizações de calendário (Mês, Ano)
  - **dialogs/**: Diálogos de criação e detalhes
  - **shared/**: Componentes reutilizáveis (Cards, Alertas)
- **actions/**: Server Actions para manipulação de dados
- **domain.ts**: Definições de tipos e regras de negócio
- **repository.ts**: Acesso ao banco de dados (Supabase)

## Funcionalidades Principais

- **Visualizações Temporais**: Semana, Mês, Ano e Lista.
- **Integração Financeira**: Sincronização com contas a pagar/receber.
- **Gestão de Parcelas**: Controle detalhado de parcelas e repasses.

## Componentes Chave

- `ObrigacoesContent`: Container principal que gerencia o estado da visualização.
- `ObrigacoesTableWrapper`: Implementação da tabela com filtros avançados.
- `ObrigacoesCalendarMonth`: Visualização de calendário mensal.
- `ObrigacaoDetalhesDialog`: Visualização detalhada de uma obrigação.

## Fluxo de Dados

1. O usuário acessa `/financeiro/obrigacoes`.
2. `ObrigacoesContent` determina a visualização inicial baseada na URL.
3. Componentes de visualização (Table/Calendar) buscam dados via Server Actions.
4. Ações de criação/edição/exclusão invalidam o cache e atualizam a interface.
