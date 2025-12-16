## 1. Atualizar Domain com Novos Tipos

- [x] 1.1 Criar interface `DadosFinanceirosConsolidados` em `src/features/dashboard/domain.ts`
- [x] 1.2 Adicionar campo `dadosFinanceiros` em `DashboardUsuarioData`
- [x] 1.3 Adicionar campo `dadosFinanceiros` em `DashboardAdminData`
- [x] 1.4 Adicionar campo `usuario: { id: number; nome: string }` em `DashboardAdminData`

## 2. Atualizar Repository para Consolidar Queries Financeiras

- [x] 2.1 Criar função `buscarDadosFinanceirosConsolidados(usuarioId?: number)` em `src/features/dashboard/repository.ts`
- [x] 2.2 Implementar subqueries para saldo total, contas a pagar, contas a receber e alertas
- [x] 2.3 Usar `Promise.all()` para paralelizar subqueries
- [x] 2.4 Adicionar filtro por `usuarioId` quando fornecido

## 3. Atualizar Service para Incluir Dados Consolidados

- [x] 3.1 Modificar `obterDashboardUsuario()` para chamar `repo.buscarDadosFinanceirosConsolidados(usuarioId)`
- [x] 3.2 Modificar `obterDashboardAdmin()` para aceitar parâmetro opcional `usuarioId`
- [x] 3.3 Adicionar chamada a `repo.buscarDadosFinanceirosConsolidados()` (sem filtro) no admin
- [x] 3.4 Buscar nome do usuário admin via repository

## 4. Atualizar Actions para Passar UserId

- [x] 4.1 Modificar `actionObterDashboard` em `src/features/dashboard/actions/dashboard-actions.ts`
- [x] 4.2 Passar `usuario.id` para `service.obterDashboardAdmin(usuario.id)`

## 5. Criar Hook de Permissões de Widgets

- [x] 5.1 Criar arquivo `src/features/dashboard/hooks/use-widget-permissions.ts`
- [x] 5.2 Implementar hook `useWidgetPermissions()` usando `useMinhasPermissoes()`
- [x] 5.3 Retornar flags booleanas para cada tipo de widget

## 6. Criar Componente DomainSection

- [x] 6.1 Criar arquivo `src/features/dashboard/components/shared/domain-section.tsx`
- [x] 6.2 Implementar componente com props `title`, `description`, `icon`, `children`
- [x] 6.3 Usar `Typography.H4` para título e `Typography.Muted` para descrição
- [x] 6.4 Adicionar divider horizontal e grid responsivo para widgets

## 7. Refatorar FinancialMetricCards

- [x] 7.1 Modificar componente `FinancialMetricCards` em `src/features/dashboard/components/shared/dashboard-content.tsx`
- [x] 7.2 Remover hooks separados (`useSaldoContas`, `useContasPagarReceber`, `useAlertasFinanceiros`)
- [x] 7.3 Receber `dadosFinanceiros: DadosFinanceirosConsolidados` como prop
- [x] 7.4 Renderizar cards usando dados da prop

## 8. Atualizar UserDashboard

- [x] 8.1 Substituir `Typography.H3` por saudação "Olá, {data.usuario.nome}!"
- [x] 8.2 Adicionar hook `useWidgetPermissions()` no componente
- [x] 8.3 Renderizar widgets condicionalmente baseado em permissões
- [x] 8.4 Passar `data.dadosFinanceiros` para `FinancialMetricCards`
- [x] 8.5 Exibir mensagem quando usuário não possui nenhuma permissão

## 9. Atualizar AdminDashboard

- [x] 9.1 Substituir título por "Olá, {data.usuario.nome}!"
- [x] 9.2 Substituir descrição por "Visão administrativa do escritório"
- [x] 9.3 Organizar widgets em seções usando `DomainSection`
- [x] 9.4 Criar seção Processos com métricas de processos
- [x] 9.5 Criar seção Audiências com `WidgetAudienciasProximas`
- [x] 9.6 Criar seção Expedientes com `WidgetExpedientesUrgentes`
- [x] 9.7 Criar seção Financeiro com cards e widgets de fluxo/despesas
- [x] 9.8 Criar seção Produtividade com performance de advogados
- [x] 9.9 Criar seção Captura com status de capturas
- [x] 9.10 Passar `data.dadosFinanceiros` para componentes financeiros

## 10. Atualizar Exports do Módulo

- [x] 10.1 Adicionar export de `useWidgetPermissions` em `src/features/dashboard/hooks/index.ts`
- [x] 10.2 Adicionar export de `DomainSection` em `src/features/dashboard/components/shared/index.ts`
- [x] 10.3 Exportar tipo `DadosFinanceirosConsolidados` via barrel exports

## 11. Garantir Consistência com Design System

- [x] 11.1 Revisar widgets para uso consistente de `Typography.H4` para títulos
- [x] 11.2 Revisar widgets para uso consistente de `Typography.Muted` para descrições
- [x] 11.3 Verificar responsividade com breakpoints `sm:`, `md:`, `lg:`
- [x] 11.4 Garantir uso de componentes shadcn/ui (`Card`, `Button`, `Separator`)
