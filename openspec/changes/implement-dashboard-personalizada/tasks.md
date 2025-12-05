# Tasks: Implementar Dashboard Personalizada

## Fase 1: Validação do Sandbox

- [x] **1.1** Instalar dependência Recharts
- [x] **1.2** Criar estrutura de diretórios em `app/sandbox/dashboard/`
- [x] **1.3** Definir tipos TypeScript (`dashboard.types.ts`)
- [x] **1.4** Criar dados mockados (`mock-data.ts`)
- [x] **1.5** Implementar componentes de gráficos (`mini-chart.tsx`)
- [x] **1.6** Implementar wrapper de widgets (`widget-wrapper.tsx`)
- [x] **1.7** Implementar status cards (`status-cards.tsx`)
- [x] **1.8** Implementar widgets de usuário
  - [x] Widget Processos Compact
  - [x] Widget Audiências Próximas
  - [x] Widget Expedientes Urgentes
  - [x] Widget Produtividade
- [x] **1.9** Implementar widgets de admin
  - [x] Widget Métricas Escritório
  - [x] Widget Carga Usuários
  - [x] Widget Status Capturas
  - [x] Widget Performance Advogados
- [x] **1.10** Implementar página principal com toggle de role
- [x] **1.11** Aplicar hierarquia tipográfica correta

## Fase 2: Backend - Serviços de Agregação

- [x] **2.1** Criar tipos para dashboard em `backend/types/dashboard/`
  - DashboardUsuarioData
  - DashboardAdminData
  - ProcessosResumo, AudienciasResumo, ExpedientesResumo
  - MetricasEscritorio, CargaUsuario, StatusCaptura

- [x] **2.2** Criar serviços de persistência em `backend/dashboard/services/persistence/`
  - `dashboard-processos.persistence.ts` - Queries de processos por responsável
  - `dashboard-audiencias.persistence.ts` - Queries de audiências
  - `dashboard-expedientes.persistence.ts` - Queries de pendentes + expedientes manuais
  - `dashboard-metricas.persistence.ts` - Queries de métricas globais

- [x] **2.3** Criar serviços de negócio em `backend/dashboard/services/dashboard/`
  - `dashboard-usuario.service.ts` - Agregação para usuário comum
  - `dashboard-admin.service.ts` - Agregação para superadmin

- [x] **2.4** Implementar cache Redis para dados de dashboard
  - TTL de 5 minutos para dados de usuário
  - TTL de 10 minutos para métricas globais
  - Invalidação via withCache helper

## Fase 3: API Routes

- [x] **3.1** Criar endpoint `GET /api/dashboard`
  - Retornar dados baseado no role do usuário autenticado
  - Cache diferenciado por perfil

- [x] **3.2** Criar endpoint `GET /api/dashboard/metricas` (admin only)
  - Métricas globais do escritório
  - Comparativos mensais
  - Cache Redis (10 minutos)

- [x] **3.3** Criar endpoint `GET /api/dashboard/capturas` (admin only)
  - Status das últimas capturas por TRT
  - Cache Redis (2 minutos)

- [x] **3.4** Documentar endpoints no Swagger
  - Schemas adicionados: MetricasEscritorio, CargaUsuario, PerformanceAdvogado, StatusCaptura

## Fase 4: Migração para Produção

- [x] **4.1** Mover componentes de gráficos para `components/ui/charts/`
  - mini-chart.tsx (componentes Recharts)
  - Exportar de index.ts

- [x] **4.2** Criar componentes de widgets em `app/(dashboard)/dashboard/components/widgets/`
  - stat-card.tsx - Cards de estatísticas
  - widget-wrapper.tsx - Container base
  - widget-processos-resumo.tsx - Resumo de processos
  - widget-audiencias-proximas.tsx - Próximas audiências
  - widget-expedientes-urgentes.tsx - Expedientes urgentes
  - widget-produtividade.tsx - Métricas de produtividade
  - status-cards.tsx - Cards de status (usuário/admin)

- [x] **4.3** Criar hook `useDashboard` em `app/_lib/hooks/`
  - Fetch de dados da API
  - Type guards para admin/usuário

- [x] **4.4** Criar componente `DashboardContent`
  - Detecta perfil automaticamente
  - Renderiza dashboard adequada
  - Loading states e error handling

- [x] **4.5** Atualizar página principal `app/(dashboard)/dashboard/page.tsx`
  - Integrar com API routes
  - Usar novos componentes

- [x] **4.6** Integrar widgets existentes (Tarefas, Notas, Links)
  - TarefasWidget integrado no DashboardContent ✓
  - NotasWidget integrado no DashboardContent ✓
  - LinksWidget integrado no DashboardContent ✓
  - Seção "Área Pessoal" adicionada para usuários e admins

## Fase 5: Personalização (Futuro)

- [ ] **5.1** Implementar drag-and-drop para reordenar widgets
  - Usar @dnd-kit (já instalado)
  - Integrar com useDashboardStore existente

- [ ] **5.2** Implementar persistência de layout
  - Salvar ordem dos widgets em `layouts_painel`
  - Carregar preferências ao iniciar

- [ ] **5.3** Implementar show/hide de widgets
  - Permitir usuário ocultar widgets
  - Menu para reativar widgets ocultos

## Fase 6: Testes e Refinamentos

- [ ] **6.1** Testar responsividade em diferentes resoluções
  - Mobile (< 768px)
  - Tablet (768px - 1024px)
  - Desktop (> 1024px)

- [ ] **6.2** Testar performance de carregamento
  - Verificar tempo de resposta das APIs
  - Otimizar queries se necessário

- [ ] **6.3** Validar acessibilidade
  - Contraste de cores nos gráficos
  - Labels em elementos interativos
  - Navegação por teclado

- [x] **6.4** Remover sandbox após migração completa
  - Deletar `app/sandbox/dashboard/` ✓
  - Atualizar documentação ✓

---

## Status Atual

**Fases 1-4 e 6.4 concluídas**: Dashboard funcional com dados reais da API.

**Implementado**:
- Backend completo (tipos, persistência, serviços, API)
- Frontend completo (hook, widgets, página)
- Cache Redis integrado
- Detecção automática de perfil (admin/usuário)
- Endpoints de métricas e capturas (admin only) ✓
- Documentação Swagger completa ✓
- Sandbox removido ✓
- Widgets pessoais integrados (Tarefas, Notas, Links) ✓

**Pendente** (opcional/futuro):
- Personalização drag-and-drop (Fase 5)
- Testes de responsividade, performance e acessibilidade (6.1-6.3)
