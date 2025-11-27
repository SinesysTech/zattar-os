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

- [ ] **2.1** Criar tipos para dashboard em `backend/types/dashboard/`
  - DashboardUsuarioData
  - DashboardAdminData
  - ProcessosResumo, AudienciasResumo, PendentesResumo
  - MetricasEscritorio, CargaUsuario, StatusCaptura

- [ ] **2.2** Criar serviços de persistência em `backend/dashboard/services/persistence/`
  - `dashboard-processos.persistence.ts` - Queries de processos por responsável
  - `dashboard-audiencias.persistence.ts` - Queries de audiências
  - `dashboard-expedientes.persistence.ts` - Queries de pendentes + expedientes manuais
  - `dashboard-metricas.persistence.ts` - Queries de métricas globais

- [ ] **2.3** Criar serviços de negócio em `backend/dashboard/services/dashboard/`
  - `dashboard-usuario.service.ts` - Agregação para usuário comum
  - `dashboard-admin.service.ts` - Agregação para superadmin

- [ ] **2.4** Implementar cache Redis para dados de dashboard
  - TTL de 5 minutos para dados de usuário
  - TTL de 10 minutos para métricas globais
  - Invalidação em alterações relevantes

## Fase 3: API Routes

- [ ] **3.1** Criar endpoint `GET /api/dashboard`
  - Retornar dados baseado no role do usuário autenticado
  - Suportar query params para filtros (período, tribunal)

- [ ] **3.2** Criar endpoint `GET /api/dashboard/metricas` (admin only)
  - Métricas globais do escritório
  - Comparativos mensais

- [ ] **3.3** Criar endpoint `GET /api/dashboard/capturas` (admin only)
  - Status das últimas capturas por TRT

- [ ] **3.4** Documentar endpoints no Swagger

## Fase 4: Migração para Produção

- [ ] **4.1** Mover componentes de gráficos para `components/ui/charts/`
  - mini-chart.tsx (componentes Recharts)
  - Exportar de index.ts

- [ ] **4.2** Mover componentes de dashboard para `app/(dashboard)/dashboard/components/`
  - Adaptar imports para usar dados reais
  - Remover dados mockados

- [ ] **4.3** Atualizar página principal `app/(dashboard)/dashboard/page.tsx`
  - Integrar com API routes
  - Implementar loading states com SWR
  - Adicionar error boundaries

- [ ] **4.4** Integrar widgets existentes
  - Reutilizar TarefasWidget existente
  - Reutilizar NotasWidget existente
  - Reutilizar LinksWidget existente

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

- [ ] **6.4** Remover sandbox após migração completa
  - Deletar `app/sandbox/dashboard/`
  - Atualizar documentação

---

## Status Atual

**Fase 1 concluída**: Sandbox funcional com dados mockados e toggle de visualização user/admin.

**Próximo passo**: Fase 2 - Criar serviços backend para agregação de dados reais.
