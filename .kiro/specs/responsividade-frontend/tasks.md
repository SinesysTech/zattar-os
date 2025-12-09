# Implementation Plan - Responsividade Frontend Completa

## Fase 1: Infraestrutura e Utilitários Base ✅

- [x] 1. Configurar infraestrutura de testes responsivos
- [x] 1.1 Configurar fast-check para property-based testing
- [x] 1.2 Criar utilitários de viewport e breakpoint
- [x] 1.3 Criar componente ResponsiveContainer base
- [x] 1.4 Escrever property tests para utilitários base

## Fase 2: Componentes de Layout Core ✅

- [x] 2. Implementar Sidebar responsiva
- [x] 2.1 Atualizar componente Sidebar para mobile
- [x] 2.2 Otimizar modo collapsed para desktop
- [x] 2.3 Escrever property tests para Sidebar

- [x] 3. Implementar Breadcrumb responsivo
- [x] 3.1 Atualizar componente AppBreadcrumb
- [x] 3.2 Escrever property tests para Breadcrumb

- [x] 4. Checkpoint - Garantir que todos os testes passem

## Fase 3: Componentes de Dados (Tabelas e Grids) ✅

- [x] 5. Implementar Tabelas responsivas
- [x] 5.1 Criar componente ResponsiveTable
- [x] 5.2 Implementar ações de tabela responsivas
- [x] 5.3 Escrever property tests para Tabelas

- [x] 6. Implementar Grids responsivos
- [x] 6.1 Criar componente ResponsiveGrid
- [x] 6.2 Escrever property tests para Grids

- [x] 7. Atualizar componentes de listagem existentes
- [x] 7.1 Migrar páginas de listagem para ResponsiveTable
- [x] 7.2 Implementar filtros responsivos nas páginas de listagem
- [x] 7.3 Escrever property tests para Listagens

- [x] 8. Checkpoint - Garantir que todos os testes passem

## Fase 4: Componentes de Formulário ✅

- [x] 9. Implementar Formulários responsivos
- [x] 9.1 Criar wrapper ResponsiveFormLayout
- [x] 9.2 Atualizar componentes base de formulário
- [x] 9.3 Migrar formulários existentes para layout responsivo
- [x] 9.4 Escrever property tests para Formulários

- [x] 10. Otimizar Selects e Date Pickers para mobile
- [x] 10.1 Atualizar DatePicker para mobile
- [x] 10.2 Atualizar Select e Combobox para mobile
- [x] 10.3 Escrever property tests para Selects e Date Pickers

- [x] 11. Checkpoint - Garantir que todos os testes passem

## Fase 5: Componentes de Interação (Dialogs e Modals)

- [x] 11. Otimizar Dialogs para mobile
- [x] 11.1 Criar variante ResponsiveDialog
  - Criar wrapper que usa Dialog em desktop e Sheet em mobile
  - Implementar detecção automática de viewport
  - Garantir que formulários em dialogs sejam responsivos
  - Posicionar botões adequadamente em mobile (bottom sticky)
  - Implementar scroll vertical quando conteúdo excede viewport
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 11.2 Atualizar dialogs críticos para ResponsiveDialog
  - Atualizar create-document-dialog
  - Atualizar share-document-dialog
  - Atualizar create-chat-dialog
  - Atualizar upload-dialog
  - Atualizar template-library-dialog
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 11.3 Escrever property tests para Dialogs
  - **Property 19: Dialog full-screen on mobile**
  - **Validates: Requirements 5.1**
  - **Property 20: Dialog form no horizontal scroll**
  - **Validates: Requirements 5.2**
  - **Property 21: Dialog buttons at bottom**
  - **Validates: Requirements 5.3**
  - **Property 22: Dialog vertical scroll**
  - **Validates: Requirements 5.4**
  - **Property 23: Dialog prevents background scroll**
  - **Validates: Requirements 5.5**

## Fase 6: Componentes Complexos (Editor e Chat)

- [x] 12. Otimizar Editor de Documentos para mobile
- [x] 12.1 Implementar toolbar responsiva no Plate Editor
  - Verificar se Plate já tem suporte a floating toolbar
  - Criar versão mobile da fixed-toolbar com ícones essenciais
  - Implementar overflow menu para opções avançadas em mobile
  - Garantir que toolbar não ocupe muito espaço vertical em mobile
  - Testar preservação de conteúdo ao mudar orientação
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 12.2 Otimizar área de edição para mobile
  - Garantir que editor ocupe altura adequada em mobile
  - Implementar scroll suave dentro do editor
  - Otimizar padding e spacing para mobile
  - Testar com teclado virtual aberto
  - _Requirements: 8.1, 8.5_

- [x] 12.3 Escrever property tests para Editor
  - **Property 34: Editor toolbar hidden on mobile**
  - **Validates: Requirements 8.1**
  - **Property 35: Editor floating toolbar**
  - **Validates: Requirements 8.2**
  - **Property 36: Editor toolbar overflow menus**
  - **Validates: Requirements 8.3**
  - **Property 37: Editor condensed toolbar on tablet**
  - **Validates: Requirements 8.4**
  - **Property 38: Editor state preservation**
  - **Validates: Requirements 8.5**

- [x] 13. Otimizar Chat para mobile
- [x] 13.1 Implementar navegação responsiva no Chat
  - Criar layout com Sheet para room list em mobile
  - Implementar botão de voltar para room list em mobile
  - Garantir que messages ocupem toda largura em mobile
  - Otimizar input de mensagem para mobile (com teclado virtual)
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 13.2 Otimizar message bubbles e attachments
  - Ajustar largura máxima de bubbles para mobile
  - Implementar layout compacto para attachments em mobile
  - Garantir que imagens sejam responsivas
  - Otimizar preview de arquivos para mobile
  - _Requirements: 10.3, 10.5_

- [ ] 13.3 Escrever property tests para Chat
  - **Property 44: Chat separate views on mobile**
  - **Validates: Requirements 10.1**
  - **Property 45: Chat room navigation**
  - **Validates: Requirements 10.2**
  - **Property 46: Chat message bubbles optimized**
  - **Validates: Requirements 10.3**
  - **Property 47: Chat attachments compact**
  - **Validates: Requirements 10.5**

- [ ] 14. Checkpoint - Garantir que todos os testes passem
  - Ensure all tests pass, ask the user if questions arise.


## Fase 7: Dashboard e Visualizações

- [x] 15. Otimizar Dashboard para mobile
- [x] 15.1 Implementar layout responsivo no Dashboard
  - Usar ResponsiveGrid para widgets do dashboard
  - Configurar grid: 1 coluna mobile, 2 colunas tablet, 3-4 desktop
  - Garantir que cards de métricas sejam legíveis em mobile
  - Implementar scroll suave entre seções
  - _Requirements: 9.1, 9.4_

- [x] 15.2 Otimizar charts e gráficos para mobile
  - Verificar se recharts já é responsivo
  - Ajustar tamanho de fonte em labels para mobile
  - Implementar scroll horizontal para charts muito largos
  - Simplificar legendas em mobile
  - Garantir que tooltips sejam touch-friendly
  - _Requirements: 9.2_

- [x] 15.3 Implementar filtros colapsáveis no Dashboard
  - Criar Sheet para filtros em mobile
  - Manter filtros inline em desktop
  - Adicionar botão "Filtros" com badge de contagem
  - Implementar aplicação de filtros com feedback visual
  - _Requirements: 9.5_

- [x] 15.4 Escrever property tests para Dashboard
  - **Property 39: Dashboard widgets stacked on mobile**
  - **Validates: Requirements 9.1**
  - **Property 40: Charts scale on mobile**
  - **Validates: Requirements 9.2**
  - **Property 41: Dashboard metrics prioritization**
  - **Validates: Requirements 9.3**
  - **Property 42: Dashboard two-column on tablet**
  - **Validates: Requirements 9.4**
  - **Property 43: Dashboard filters collapsible**
  - **Validates: Requirements 9.5**


## Fase 8: Otimização de Mídia

- [x] 16. Otimizar componentes de mídia para mobile
- [x] 16.1 Verificar e otimizar media nodes do Plate
  - Verificar se media-image-node já é responsivo
  - Garantir que imagens usem max-width: 100% e height: auto
  - Implementar aspect-ratio adequado para vídeos
  - Adicionar loading="lazy" para imagens off-screen
  - Testar preview de mídia em mobile
  - _Requirements: 13.1, 13.2, 13.4_

- [x] 16.2 Otimizar upload de mídia em mobile
  - Verificar se upload-dialog é responsivo
  - Implementar preview adequado de arquivos em mobile
  - Adicionar feedback de progresso visível em mobile
  - Otimizar tamanho de thumbnails para mobile
  - _Requirements: 13.5_

- [x] 16.3 Escrever property tests para Mídia
  - **Property 58: Responsive image sizing**
  - **Validates: Requirements 13.1**
  - **Property 59: Media lazy loading**
  - **Validates: Requirements 13.2**
  - **Property 60: Responsive video containers**
  - **Validates: Requirements 13.4**

## Fase 9: Suporte a Orientação

- [ ] 17. Testar e otimizar suporte a orientação
- [ ] 17.1 Implementar detecção e adaptação de orientação
  - Verificar se useOrientation hook está funcionando corretamente
  - Testar formulários em landscape (devem usar 2 colunas se possível)
  - Testar editor em landscape (mais espaço para toolbar)
  - Testar chat em landscape (pode mostrar rooms + messages)
  - Testar dashboard em landscape (mais colunas)
  - Verificar preservação de scroll position ao rotacionar
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 17.2 Otimizar visualização de mídia em landscape
  - Garantir que imagens/vídeos usem mais espaço em landscape
  - Implementar fullscreen otimizado para landscape
  - Testar preview de documentos em landscape
  - _Requirements: 14.5_

- [ ] 17.3 Escrever property tests para Orientação
  - **Property 62: Portrait to landscape reflow**
  - **Validates: Requirements 14.1**
  - **Property 63: Landscape to portrait adjustment**
  - **Validates: Requirements 14.2**
  - **Property 64: Landscape form optimization**
  - **Validates: Requirements 14.3**
  - **Property 65: Rotation state preservation**
  - **Validates: Requirements 14.4**
  - **Property 66: Landscape media maximization**
  - **Validates: Requirements 14.5**

## Fase 10: Acessibilidade e Componentes Base

- [ ] 18. Auditar e melhorar acessibilidade responsiva
- [ ] 18.1 Implementar ARIA labels e roles em componentes responsivos
  - Adicionar ARIA labels apropriados no Sidebar mobile (Sheet)
  - Implementar anúncios de estado em menus colapsáveis (aria-expanded, aria-hidden)
  - Adicionar roles apropriados (navigation, menu, dialog)
  - Garantir que ResponsiveDialog tenha aria-modal e aria-labelledby
  - Garantir que ResponsiveTable tenha role="table" e estrutura semântica
  - _Requirements: 15.1, 15.2_

- [ ] 18.2 Implementar navegação por teclado em componentes responsivos
  - Testar navegação por teclado no Sidebar mobile
  - Testar navegação por teclado em ResponsiveDialog
  - Testar navegação por teclado em ResponsiveTable (modo cards)
  - Garantir que filtros colapsáveis sejam acessíveis por teclado
  - Verificar ordem de tab lógica em todos os layouts responsivos
  - _Requirements: 15.3, 15.5_

- [ ] 18.3 Implementar indicadores de foco visíveis
  - Adicionar estilos de foco visíveis em todos os breakpoints
  - Garantir contraste adequado para indicadores de foco
  - Testar indicadores de foco em modo escuro
  - Verificar que foco não é perdido ao mudar de breakpoint
  - _Requirements: 15.4_

- [ ] 18.4 Auditar e corrigir touch targets
  - Auditar todos os botões para garantir min 44x44px em mobile
  - Auditar checkboxes e radio buttons para garantir min 44x44px
  - Auditar links e elementos clicáveis
  - Corrigir componentes que não atendem o mínimo
  - _Requirements: 11.4_

- [ ] 18.5 Auditar tipografia e unidades responsivas
  - Verificar que body text tem min 16px em mobile
  - Verificar que componentes usam rem/em ao invés de px fixo
  - Verificar que espaçamentos usam unidades responsivas
  - Corrigir componentes com unidades fixas inadequadas
  - _Requirements: 11.3, 11.5_

- [ ] 18.6 Escrever property tests para Acessibilidade
  - **Property 67: Navigation ARIA labels**
  - **Validates: Requirements 15.1**
  - **Property 68: Menu state announcements**
  - **Validates: Requirements 15.2**
  - **Property 69: Touch targets keyboard accessible**
  - **Validates: Requirements 15.3**
  - **Property 70: Visible focus indicators**
  - **Validates: Requirements 15.4**
  - **Property 71: Logical tab order preservation**
  - **Validates: Requirements 15.5**
  - **Property 50: Readable typography on mobile**
  - **Validates: Requirements 11.3**
  - **Property 51: Interactive elements touch targets**
  - **Validates: Requirements 11.4**
  - **Property 52: Responsive sizing units**
  - **Validates: Requirements 11.5**

- [ ] 19. Checkpoint Final - Garantir que todos os testes passem
  - Ensure all tests pass, ask the user if questions arise.

## Fase 11: Testes de Integração e Performance

- [ ] 20. Expandir testes E2E responsivos com Playwright
- [ ] 20.1 Expandir testes E2E para fluxos críticos em mobile
  - Expandir teste de login para incluir diferentes viewports
  - Criar teste de criação de processo em mobile
  - Criar teste de edição de documento em mobile
  - Criar teste de envio de mensagem no chat em mobile
  - Criar teste de upload de arquivo em mobile
  - _Requirements: All_

- [ ] 20.2 Criar testes E2E para mudanças de viewport e orientação
  - Testar resize de desktop para mobile durante uso
  - Testar mudança de orientação durante edição
  - Verificar preservação de estado ao mudar viewport
  - Testar scroll position preservation
  - _Requirements: 14.1, 14.2, 14.4_

- [ ] 21. Realizar auditoria de performance mobile
- [ ] 21.1 Executar Lighthouse em páginas principais
  - Auditar /dashboard em mobile (já tem teste básico, expandir)
  - Auditar /processos em mobile
  - Auditar /documentos em mobile
  - Auditar /chat em mobile
  - Auditar /audiencias em mobile
  - Identificar e corrigir issues de performance
  - _Requirements: All_

- [ ] 21.2 Otimizar métricas Core Web Vitals
  - Medir e otimizar LCP (Largest Contentful Paint) < 2.5s
  - Medir e otimizar FID/INP (First Input Delay/Interaction to Next Paint) < 200ms
  - Medir e otimizar CLS (Cumulative Layout Shift) < 0.1
  - Implementar lazy loading adicional onde apropriado
  - Analisar e otimizar bundle size para mobile
  - Implementar code splitting para rotas
  - _Requirements: All_

- [ ] 22. Realizar auditoria de acessibilidade com axe-core
- [ ] 22.1 Integrar axe-core nos testes E2E
  - Instalar @axe-core/playwright
  - Criar helper para executar axe em páginas
  - Testar /dashboard com axe-core em mobile e desktop
  - Testar /processos com axe-core em mobile e desktop
  - Testar /documentos com axe-core em mobile e desktop
  - Testar /chat com axe-core em mobile e desktop
  - Corrigir todos os issues críticos encontrados
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 22.2 Validar com screen readers
  - Testar navegação com VoiceOver (iOS/macOS)
  - Testar navegação com TalkBack (Android)
  - Testar navegação com NVDA/JAWS (Windows)
  - Documentar issues encontrados e corrigir
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

## Fase 12: Documentação e Finalização

- [ ] 23. Criar documentação de responsividade
- [ ] 23.1 Documentar componentes responsivos
  - Criar README.md em components/ui/ documentando ResponsiveTable
  - Documentar ResponsiveGrid com exemplos de uso
  - Documentar ResponsiveDialog e quando usar
  - Documentar ResponsiveFormLayout com exemplos
  - Documentar ResponsiveContainer e ResponsiveEditor
  - Documentar ResponsiveFilterPanel
  - Criar Storybook stories para componentes responsivos (opcional)
  - _Requirements: All_

- [ ] 23.2 Documentar hooks e utilitários
  - Documentar useViewport com exemplos de uso
  - Documentar useBreakpoint, useBreakpointBelow, useBreakpointBetween
  - Documentar useOrientation e useOrientationChange
  - Criar exemplos práticos de uso dos hooks
  - Documentar helpers de teste (responsive-test-helpers)
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 23.3 Criar guia de desenvolvimento responsivo
  - Documentar breakpoints do Tailwind e quando usar cada um
  - Criar checklist de responsividade para novos componentes
  - Documentar mobile-first approach
  - Documentar touch target sizes (min 44x44px)
  - Documentar performance best practices para mobile
  - Documentar acessibilidade em mobile
  - Criar guia de troubleshooting comum
  - _Requirements: All_

- [ ] 24. Revisar e refatorar código
- [ ] 24.1 Code review de componentes responsivos
  - Revisar ResponsiveTable e identificar melhorias
  - Revisar ResponsiveGrid e identificar melhorias
  - Revisar ResponsiveDialog e identificar melhorias
  - Revisar ResponsiveFormLayout e identificar melhorias
  - Identificar e refatorar código duplicado
  - Garantir consistência de naming e estrutura
  - Atualizar tipos TypeScript onde necessário
  - _Requirements: All_

- [ ] 24.2 Otimizações de performance
  - Auditar re-renders desnecessários com React DevTools Profiler
  - Implementar React.memo onde apropriado
  - Implementar useMemo/useCallback para callbacks pesados
  - Verificar bundle size com webpack-bundle-analyzer
  - Implementar code splitting adicional se necessário
  - Verificar tree-shaking está funcionando
  - _Requirements: All_

- [ ] 24.3 Limpeza de código
  - Remover imports não utilizados
  - Remover código comentado
  - Remover console.logs de debug
  - Atualizar comentários desatualizados
  - Garantir formatação consistente (Prettier)
  - _Requirements: All_

- [ ] 25. Validação final e testes em dispositivos reais
- [ ] 25.1 Testar em dispositivos iOS reais
  - Testar em iPhone (iOS Safari)
  - Testar navegação e interações touch
  - Testar formulários com teclado virtual
  - Testar orientação portrait/landscape
  - Validar performance e animações
  - _Requirements: All_

- [ ] 25.2 Testar em dispositivos Android reais
  - Testar em Android (Chrome)
  - Testar navegação e interações touch
  - Testar formulários com teclado virtual
  - Testar orientação portrait/landscape
  - Validar performance e animações
  - _Requirements: All_

- [ ] 25.3 Checkpoint Final - Validação completa
  - Ensure all tests pass, ask the user if questions arise.
  - Validar que todos os requisitos foram atendidos
  - Confirmar que todas as propriedades passam nos testes
  - Validar acessibilidade completa
  - Revisar documentação criada
  - Obter aprovação final do usuário
