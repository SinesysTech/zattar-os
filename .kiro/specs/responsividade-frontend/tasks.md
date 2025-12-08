# Implementation Plan - Responsividade Frontend Completa

## Fase 1: Infraestrutura e Utilitários Base

- [x] 1. Configurar infraestrutura de testes responsivos
- [x] 1.1 Configurar fast-check para property-based testing
  - Instalar fast-check como dependência de desenvolvimento
  - Criar helpers para testes de viewport (renderWithViewport, getComputedColumns, etc)
  - Configurar Jest para suportar property-based tests
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 1.2 Criar utilitários de viewport e breakpoint
  - Implementar hook useViewport para detecção de viewport atual
  - Criar hook useBreakpoint para verificação de breakpoints específicos
  - Implementar hook useOrientation para detecção de orientação do dispositivo
  - Adicionar tipos TypeScript para ViewportState e ResponsiveConfig
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 1.3 Criar componente ResponsiveContainer base
  - Implementar container que aplica classes responsivas automaticamente
  - Adicionar suporte para responsive spacing e padding
  - Implementar detecção de touch device
  - _Requirements: 11.1, 11.2_

- [x] 1.4 Escrever property tests para utilitários base
  - **Property 48: Components responsive classes**
  - **Validates: Requirements 11.1**
  - **Property 49: Responsive spacing**
  - **Validates: Requirements 11.2**

## Fase 2: Componentes de Layout Core

- [ ] 2. Implementar Sidebar responsiva
- [x] 2.1 Atualizar componente Sidebar para mobile
  - Garantir que sidebar renderiza como Sheet em viewports < 768px
  - Implementar overlay com fechamento ao clicar
  - Adicionar animações suaves de abertura/fechamento
  - Implementar auto-close ao navegar em mobile
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 2.2 Otimizar modo collapsed para desktop
  - Garantir que apenas ícones são exibidos quando collapsed
  - Implementar tooltips para ícones
  - Adicionar transições suaves entre estados
  - _Requirements: 1.4_

- [-] 2.3 Escrever property tests para Sidebar
  - **Property 1: Sidebar drawer on mobile**
  - **Validates: Requirements 1.1**
  - **Property 2: Sidebar overlay closes drawer**
  - **Validates: Requirements 1.3**
  - **Property 3: Collapsed sidebar shows icons**
  - **Validates: Requirements 1.4**
  - **Property 4: Navigation closes mobile sidebar**
  - **Validates: Requirements 1.5**

- [ ] 3. Implementar Breadcrumb responsivo
- [ ] 3.1 Atualizar componente AppBreadcrumb
  - Implementar truncamento para mobile (apenas current + parent)
  - Adicionar menu collapsed para níveis adicionais
  - Implementar truncamento de texto longo com ellipsis
  - Garantir navegação funcional em todos os breakpoints
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 3.2 Escrever property tests para Breadcrumb
  - **Property 24: Breadcrumb truncation on mobile**
  - **Validates: Requirements 6.1**
  - **Property 25: Breadcrumb collapse menu**
  - **Validates: Requirements 6.2**
  - **Property 26: Breadcrumb full path on desktop**
  - **Validates: Requirements 6.3**
  - **Property 27: Breadcrumb text truncation**
  - **Validates: Requirements 6.4**

- [ ] 4. Checkpoint - Garantir que todos os testes passem
  - Ensure all tests pass, ask the user if questions arise.

## Fase 3: Componentes de Dados (Tabelas e Grids)

- [ ] 5. Implementar Tabelas responsivas
- [ ] 5.1 Criar componente ResponsiveTable
  - Implementar horizontal scroll para mobile com indicadores visíveis
  - Adicionar priorização de colunas essenciais
  - Implementar sticky first column quando contém identificadores
  - Criar layout de cards como alternativa para mobile
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 5.2 Implementar ações de tabela responsivas
  - Agrupar ações em dropdown/action sheet no mobile
  - Manter ações inline no desktop
  - Adicionar suporte para bulk actions em mobile
  - _Requirements: 2.5, 12.4_

- [ ] 5.3 Escrever property tests para Tabelas
  - **Property 5: Table horizontal scroll on mobile**
  - **Validates: Requirements 2.1**
  - **Property 6: Table column prioritization**
  - **Validates: Requirements 2.2**
  - **Property 7: Sticky first column**
  - **Validates: Requirements 2.3**
  - **Property 8: Table full display on desktop**
  - **Validates: Requirements 2.4**
  - **Property 9: Mobile table actions grouped**
  - **Validates: Requirements 2.5**

- [ ] 6. Implementar Grids responsivos
- [ ] 6.1 Criar componente ResponsiveGrid
  - Implementar sistema de colunas adaptativo (1→2→3→4)
  - Adicionar suporte para gap responsivo
  - Implementar scaling proporcional de imagens em cards
  - Adicionar configuração customizável de breakpoints
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6.2 Escrever property tests para Grids
  - **Property 14: Grid single column on mobile**
  - **Validates: Requirements 4.1**
  - **Property 15: Grid two columns on small screens**
  - **Validates: Requirements 4.2**
  - **Property 16: Grid three columns on tablet**
  - **Validates: Requirements 4.3**
  - **Property 17: Grid four+ columns on desktop**
  - **Validates: Requirements 4.4**
  - **Property 18: Card images scale proportionally**
  - **Validates: Requirements 4.5**

- [ ] 7. Atualizar componentes de listagem existentes
- [ ] 7.1 Converter páginas de listagem para layout responsivo
  - Atualizar lista de processos para usar ResponsiveTable
  - Atualizar lista de audiências para layout card em mobile
  - Atualizar lista de contratos para grid responsivo
  - Implementar filtros colapsáveis para mobile
  - _Requirements: 12.1, 12.2, 12.3, 12.5_

- [ ] 7.2 Escrever property tests para Listagens
  - **Property 53: List card layout on mobile**
  - **Validates: Requirements 12.1**
  - **Property 54: List item information hierarchy**
  - **Validates: Requirements 12.2**
  - **Property 55: List filters collapsible**
  - **Validates: Requirements 12.3**

- [ ] 8. Checkpoint - Garantir que todos os testes passem
  - Ensure all tests pass, ask the user if questions arise.

## Fase 4: Componentes de Formulário

- [ ] 9. Implementar Formulários responsivos
- [ ] 9.1 Criar componente ResponsiveForm
  - Implementar stacking vertical para mobile (< 640px)
  - Adicionar layout 2-colunas para tablet (768px-1024px)
  - Garantir touch targets mínimos de 44x44px
  - Implementar botões full-width ou stacked em mobile
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ] 9.2 Atualizar componentes de input existentes
  - Adicionar classes responsivas aos inputs de CPF, CNPJ, telefone, CEP
  - Garantir labels flutuantes em mobile
  - Implementar feedback visual adequado para touch
  - Otimizar spacing para diferentes breakpoints
  - _Requirements: 3.1, 3.3_

- [ ] 9.3 Escrever property tests para Formulários
  - **Property 10: Form fields stacked on mobile**
  - **Validates: Requirements 3.1**
  - **Property 11: Touch target minimum size**
  - **Validates: Requirements 3.3**
  - **Property 12: Tablet form columns**
  - **Validates: Requirements 3.4**
  - **Property 13: Mobile form buttons layout**
  - **Validates: Requirements 3.5**

- [ ] 10. Implementar Selects e Date Pickers responsivos
- [ ] 10.1 Criar componentes touch-optimized
  - Implementar date picker com interface touch-optimized para mobile
  - Criar select com bottom sheet/full-screen em mobile
  - Implementar combobox com interface de busca mobile-optimized
  - Garantir touch targets de 44x44px para opções
  - Adicionar feedback visual claro para interações
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10.2 Escrever property tests para Selects e Date Pickers
  - **Property 29: Touch-optimized date picker**
  - **Validates: Requirements 7.1**
  - **Property 30: Mobile select interface**
  - **Validates: Requirements 7.2**
  - **Property 31: Select option touch targets**
  - **Validates: Requirements 7.3**
  - **Property 32: Mobile combobox interface**
  - **Validates: Requirements 7.4**

- [ ] 11. Atualizar formulários existentes
- [ ] 11.1 Migrar formulários para layout responsivo
  - Atualizar formulário de dados pessoais (assinatura digital)
  - Atualizar formulários de cadastro (clientes, processos, etc)
  - Atualizar formulários de filtros em páginas de listagem
  - Garantir consistência em todos os formulários
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ] 12. Checkpoint - Garantir que todos os testes passem
  - Ensure all tests pass, ask the user if questions arise.

## Fase 5: Componentes de Interação (Dialogs e Modals)

- [ ] 13. Implementar Dialogs responsivos
- [ ] 13.1 Atualizar componente Dialog
  - Implementar full-screen/near full-screen para mobile (< 640px)
  - Adicionar variante bottom-sheet para ações simples
  - Garantir que formulários em dialogs não tenham scroll horizontal
  - Posicionar botões no bottom com spacing adequado em mobile
  - Implementar scroll vertical quando conteúdo excede viewport
  - Prevenir scroll do background quando dialog aberto
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 13.2 Escrever property tests para Dialogs
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

- [ ] 14. Atualizar dialogs existentes
- [ ] 14.1 Migrar dialogs para layout responsivo
  - Atualizar create-document-dialog
  - Atualizar share-document-dialog
  - Atualizar create-chat-dialog
  - Atualizar todos os dialogs de confirmação
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

## Fase 6: Componentes Complexos (Editor e Chat)

- [ ] 15. Implementar Editor de Documentos responsivo
- [ ] 15.1 Atualizar componente DocumentEditor
  - Ocultar/colapsar toolbar de formatação em mobile (< 768px)
  - Implementar floating toolbar compacta ao tocar no editor
  - Agrupar opções avançadas em overflow menus
  - Criar toolbar condensada para tablet
  - Preservar conteúdo e posição do cursor ao mudar viewport
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 15.2 Otimizar toolbars do editor
  - Atualizar ToolbarButtons para desktop
  - Atualizar ToolbarButtonsMobile para mobile
  - Implementar detecção automática de viewport
  - Adicionar transições suaves entre modos
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 15.3 Escrever property tests para Editor
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

- [ ] 16. Implementar Chat responsivo
- [ ] 16.1 Atualizar componente ChatInterface
  - Separar room list e messages em views distintas para mobile (< 768px)
  - Implementar navegação com back button em mobile
  - Otimizar message bubbles para telas estreitas
  - Implementar formato compacto e scrollable para attachments
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 16.2 Escrever property tests para Chat
  - **Property 44: Chat separate views on mobile**
  - **Validates: Requirements 10.1**
  - **Property 45: Chat room navigation**
  - **Validates: Requirements 10.2**
  - **Property 46: Chat message bubbles optimized**
  - **Validates: Requirements 10.3**
  - **Property 47: Chat attachments compact**
  - **Validates: Requirements 10.5**

- [ ] 17. Checkpoint - Garantir que todos os testes passem
  - Ensure all tests pass, ask the user if questions arise.

## Fase 7: Dashboard e Visualizações

- [ ] 18. Implementar Dashboard responsivo
- [ ] 18.1 Criar componente ResponsiveDashboard
  - Implementar stacking vertical de widgets em mobile (< 640px)
  - Criar layout 2-colunas para tablet
  - Implementar scaling de charts para mobile mantendo legibilidade
  - Adicionar priorização de métricas com expansão para detalhes
  - Implementar filtros colapsáveis em panel/bottom sheet
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 18.2 Escrever property tests para Dashboard
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

- [ ] 19. Atualizar página de Dashboard
  - Migrar dashboard principal para layout responsivo
  - Atualizar widgets de métricas
  - Atualizar gráficos e charts
  - Implementar filtros responsivos
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

## Fase 8: Otimização de Mídia

- [ ] 20. Implementar otimizações de mídia
- [ ] 20.1 Criar sistema de imagens responsivas
  - Implementar componente ResponsiveImage com srcset
  - Adicionar lazy loading para imagens off-screen
  - Implementar containers responsivos para vídeos com aspect ratio
  - Adicionar otimização de upload em mobile
  - _Requirements: 13.1, 13.2, 13.4, 13.5_

- [ ] 20.2 Escrever property tests para Mídia
  - **Property 58: Responsive image sizing**
  - **Validates: Requirements 13.1**
  - **Property 59: Media lazy loading**
  - **Validates: Requirements 13.2**
  - **Property 60: Responsive video containers**
  - **Validates: Requirements 13.4**

- [ ] 21. Atualizar componentes de mídia existentes
  - Atualizar media-image-node para usar ResponsiveImage
  - Atualizar media-video-node para containers responsivos
  - Atualizar upload-dialog para otimização mobile
  - Implementar lazy loading em galerias
  - _Requirements: 13.1, 13.2, 13.4, 13.5_

## Fase 9: Suporte a Orientação

- [ ] 22. Implementar suporte a mudanças de orientação
- [ ] 22.1 Criar handlers de orientação
  - Implementar detecção de mudança de orientação
  - Adicionar reflow de conteúdo para landscape
  - Otimizar layout de formulários para landscape
  - Preservar scroll position e state durante rotação
  - Maximizar área de visualização de mídia em landscape
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 22.2 Escrever property tests para Orientação
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

- [ ] 23. Implementar melhorias de acessibilidade
- [ ] 23.1 Adicionar suporte a acessibilidade responsiva
  - Adicionar ARIA labels e roles apropriados em navegação responsiva
  - Implementar anúncios de mudança de estado para screen readers
  - Garantir acessibilidade por teclado de touch targets
  - Adicionar indicadores de foco visíveis
  - Preservar ordem lógica de tab em layouts responsivos
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 23.2 Escrever property tests para Acessibilidade
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

- [ ] 24. Atualizar componentes UI base
- [ ] 24.1 Garantir responsividade em todos os componentes base
  - Atualizar Button para touch targets adequados
  - Atualizar Input para responsive sizing
  - Atualizar Card para layouts responsivos
  - Atualizar Alert para mobile
  - Atualizar Badge, Avatar, e outros componentes pequenos
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 24.2 Escrever property tests para Componentes Base
  - **Property 50: Readable typography on mobile**
  - **Validates: Requirements 11.3**
  - **Property 51: Interactive elements touch targets**
  - **Validates: Requirements 11.4**
  - **Property 52: Responsive sizing units**
  - **Validates: Requirements 11.5**

- [ ] 25. Checkpoint Final - Garantir que todos os testes passem
  - Ensure all tests pass, ask the user if questions arise.

## Fase 11: Testes de Integração e Performance

- [ ] 26. Implementar testes de integração E2E
- [ ] 26.1 Criar testes Playwright para fluxos responsivos
  - Testar jornada completa de usuário em mobile
  - Testar navegação entre breakpoints
  - Testar submissão de formulários em diferentes dispositivos
  - Testar interações de chat em mobile
  - Testar upload e visualização de mídia
  - _Requirements: All_

- [ ] 27. Implementar testes de regressão visual
- [ ] 27.1 Configurar testes visuais com Playwright
  - Capturar screenshots de componentes em cada breakpoint
  - Configurar baseline de comparação
  - Testar dark mode em todos os breakpoints
  - Testar estados de hover/focus/active
  - _Requirements: All_

- [ ] 28. Realizar auditoria de performance
- [ ] 28.1 Otimizar performance mobile
  - Executar Lighthouse em páginas principais
  - Otimizar FCP, LCP, CLS, TTI
  - Implementar code splitting para mobile
  - Otimizar bundle size
  - Adicionar preload/prefetch estratégico
  - _Requirements: All_

- [ ] 29. Realizar auditoria de acessibilidade
- [ ] 29.1 Executar testes axe-core
  - Testar todas as páginas principais
  - Corrigir issues de acessibilidade encontrados
  - Validar com screen readers
  - Testar navegação por teclado
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

## Fase 12: Documentação e Finalização

- [ ] 30. Criar documentação de responsividade
- [ ] 30.1 Documentar padrões e guidelines
  - Criar guia de uso de componentes responsivos
  - Documentar breakpoints e quando usar cada um
  - Criar exemplos de código para casos comuns
  - Documentar best practices de performance
  - Criar checklist de responsividade para novos componentes
  - _Requirements: All_

- [ ] 31. Revisar e refatorar código
- [ ] 31.1 Code review e refactoring final
  - Revisar todos os componentes implementados
  - Refatorar código duplicado
  - Otimizar performance onde necessário
  - Garantir consistência de código
  - Atualizar tipos TypeScript
  - _Requirements: All_

- [ ] 32. Checkpoint Final - Validação completa
  - Ensure all tests pass, ask the user if questions arise.
  - Validar que todos os requisitos foram atendidos
  - Confirmar que todas as propriedades passam nos testes
  - Verificar performance em dispositivos reais
  - Validar acessibilidade completa
