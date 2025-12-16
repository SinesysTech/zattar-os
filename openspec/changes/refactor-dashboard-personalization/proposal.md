# Change: Refatorar Dashboard com Personalização, Otimização e Organização por Domínio

## Why

O dashboard atual possui três problemas principais: (1) múltiplas requisições separadas para dados financeiros causando latência desnecessária, (2) ausência de filtragem baseada em permissões granulares do usuário, e (3) falta de organização por domínio na visão admin. Além disso, o título estático "Dashboard Administrador" não oferece uma experiência personalizada ao usuário.

## What Changes

### Otimização de Queries
- Consolidar queries financeiras em uma única função `buscarDadosFinanceirosConsolidados()` no repository
- Remover hooks separados (`useSaldoContas`, `useContasPagarReceber`, `useAlertasFinanceiros`) do componente
- Passar dados financeiros consolidados como prop para `FinancialMetricCards`

### Contextualização por Permissões
- Criar hook `useWidgetPermissions()` para verificar permissões de visualização
- Filtrar widgets no dashboard de usuário baseado em permissões granulares (`processos:read`, `audiencias:read`, etc.)
- Exibir mensagem quando usuário não possui nenhuma permissão

### Organização por Domínio (Admin)
- Criar componente `DomainSection` para agrupar widgets por área
- Reorganizar widgets do admin em seções: Processos, Audiências, Expedientes, Financeiro, Produtividade, Captura

### Personalização de Saudação
- Substituir títulos estáticos por saudação "Olá, {nome}!" em ambos os dashboards
- Buscar nome do usuário admin no service

## Impact

- **Affected specs**: `dashboard`
- **Affected code**:
  - `src/features/dashboard/repository.ts` - nova função consolidada
  - `src/features/dashboard/service.ts` - integrar dados consolidados
  - `src/features/dashboard/domain.ts` - novos tipos
  - `src/features/dashboard/hooks/use-widget-permissions.ts` - novo hook
  - `src/features/dashboard/components/shared/dashboard-content.tsx` - refatorar componentes
  - `src/features/dashboard/components/shared/domain-section.tsx` - novo componente
  - `src/features/dashboard/actions/dashboard-actions.ts` - passar userId para admin
