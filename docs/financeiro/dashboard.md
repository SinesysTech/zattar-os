# Dashboard Financeiro

## Conteúdo
- Cards principais: saldo consolidado, contas a pagar, contas a receber, alertas.
- Gráficos: fluxo de caixa mensal, despesas por categoria.
- Indicadores: orçamento em execução, alertas de risco, obrigações e folha.

## API
- `GET /api/financeiro/dashboard` — métricas consolidadas.
- `GET /api/financeiro/dashboard/fluxo-caixa?meses=6` — projeção de fluxo de caixa.

## Widgets Disponíveis
- Saldo de Contas
- Contas a Pagar/Receber
- Fluxo de Caixa
- Despesas por Categoria
- Orçamento Atual
- Alertas Financeiros

## Cache
- Métricas e alertas com TTL de 5 minutos via Redis.

## Alertas
- Contas vencidas, saldo negativo, orçamentos estourados, folha pendente e transações não conciliadas.
