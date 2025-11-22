# Change: Refatorar UI da Página de Captura com Dialogs

## Why
A página de captura atual possui uma estrutura de navegação em tabs aninhadas (Captura > Tipo de Captura) que ocupa muito espaço vertical e torna a interface mais pesada. Além disso, os usuários raramente precisam visualizar o formulário de captura e o histórico simultaneamente, justificando uma abordagem mais compacta com dialogs.

A refatoração propõe uma UI mais clean e moderna, onde:
- Formulários de captura são acessados via dialogs (modais)
- A página principal foca em visualizar histórico e gerenciar agendamentos
- A seleção de tipo de captura usa dropdown ao invés de tabs aninhadas

## What Changes
- **Nova estrutura de tabs principais**: Histórico (primeira tab) → Agendamentos (segunda tab)
- **Remover tab fixa "Captura"**: Transformar em button + dialog
- **Adicionar botão "Nova Captura"**: Abre dialog com formulário de captura
- **Dialog de Nova Captura**: Contém dropdown de tipo de captura (Acervo Geral, Arquivados, Audiências, Expedientes) e formulário dinâmico
- **Tab Agendamentos**: Adicionar botão "Novo Agendamento" que abre dialog
- **Dialog de Novo Agendamento**: Contém dropdown de tipo de captura e formulário de configuração de agendamento
- **Componentes de dialog reutilizáveis**: CapturaDialog e AgendamentoDialog com tipos via dropdown

## Impact
- **Affected specs**: `captura-trt`, `agendamentos`
- **Affected code**:
  - `app/(dashboard)/captura/page.tsx` - Refatorar estrutura de tabs
  - `components/captura/*-form.tsx` - Adaptar para uso em dialogs
  - Criar `components/captura/captura-dialog.tsx` - Dialog de nova captura
  - Criar `components/captura/agendamento-dialog.tsx` - Dialog de novo agendamento
  - Criar `components/captura/tipo-captura-select.tsx` - Dropdown de tipos
- **Breaking changes**: Nenhuma (apenas UI, API permanece a mesma)
- **User experience**: Melhoria significativa na navegação e uso de espaço vertical
