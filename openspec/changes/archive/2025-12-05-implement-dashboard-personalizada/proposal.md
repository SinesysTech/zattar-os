# Proposta: Implementar Dashboard Personalizada

## Why

O sistema atualmente não possui uma página inicial que ofereça visão consolidada e contextual das informações relevantes para cada usuário. Advogados precisam navegar por múltiplas páginas para entender sua carga de trabalho, enquanto administradores não têm métricas de gestão centralizadas. Uma dashboard personalizada aumentará produtividade e visibilidade.

## What Changes

### 1. Dashboard Contextual por Role

Dashboard com visualização diferenciada baseada no perfil do usuário:

- **Usuário comum**: Foco em itens atribuídos (processos, audiências, expedientes vencendo/vencidos)
- **Superadmin**: Métricas do escritório, carga por usuário, status de capturas, performance de advogados

### 2. Status Cards (Resumo Rápido)

Cards de status no topo para visão instantânea:

**Usuário:**
- Processos Ativos (total)
- Audiências Hoje (próximos 7 dias)
- Expedientes Vencendo (hoje + amanhã)
- Expedientes Vencidos (requer ação)

**Admin:**
- Total Processos (ativos)
- Total Audiências (mês)
- Expedientes Pendentes (vencidos)
- Usuários Ativos

### 3. Widgets de Detalhamento

Widgets com informações detalhadas:

**Usuário:**
- Distribuição de Processos (donut chart por status/grau/TRT)
- Audiências Próximas (lista com countdown)
- Expedientes Urgentes (lista priorizada)
- Produtividade (gráfico semanal de baixas)

**Admin:**
- Métricas do Escritório (gráficos de tendência)
- Carga por Usuário (bar chart comparativo)
- Status de Capturas (sucesso/erro por TRT)
- Performance de Advogados (ranking de baixas)

### 4. Biblioteca de Gráficos

Componentes wrapper para Recharts:
- MiniLineChart, MiniAreaChart, MiniBarChart
- MiniPieChart, MiniDonutChart
- ProgressBarChart, Sparkline

## Impact

### Specs Afetadas
- **NOVA** `dashboard/spec.md` - Definição completa da feature

### Código Afetado
- `app/(dashboard)/dashboard/` - Migração do sandbox para produção
- `backend/dashboard/services/` - Novos serviços para agregação de dados
- `components/ui/` - Novos componentes de gráficos

### Dependências
- **recharts** - Biblioteca de gráficos (já instalada)

### Banco de Dados
Usa tabelas existentes: `layouts_painel`, `tarefas`, `notas`, `links_personalizados`

### Entidades Consultadas
- `acervo` (processos)
- `audiencias`
- `pendentes_manifestacao` (renomeado "Expedientes" no frontend)
- `expedientes_manuais`
- `usuarios`
- `historico_capturas`
