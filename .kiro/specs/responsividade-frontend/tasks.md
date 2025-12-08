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

- [x] 2. Implementar Sidebar responsiva
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

- [x] 2.3 Escrever property tests para Sidebar
  - **Property 1: Sidebar drawer on mobile**
  - **Validates: Requirements 1.1**
  - **Property 2: Sidebar overlay closes drawer**
  - **Validates: Requirements 1.3**
  - **Property 3: Collapsed sidebar shows icons**
  - **Validates: Requirements 1.4**
  - **Property 4: Navigation closes mobile sidebar**
  - **Validates: Requirements 1.5**

- [x] 3. Implementar Breadcrumb responsivo
- [x] 3.1 Atualizar componente AppBreadcrumb
  - Implementar truncamento para mobile (apenas current + parent)
  - Adicionar menu collapsed para níveis adicionais
  - Implementar truncamento de texto longo com ellipsis
  - Garantir navegação funcional em todos os breakpoints
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3.2 Escrever property tests para Breadcrumb
  - **Property 24: Breadcrumb truncation on mobile**
  - **Validates: Requirements 6.1**
  - **Property 25: Breadcrumb collapse menu**
  - **Validates: Requirements 6.2**
  - **Property 26: Breadcrumb full path on desktop**
  - **Validates: Requirements 6.3**
  - **Property 27: Breadcrumb text truncation**
  - **Validates: Requirements 6.4**

- [x] 4. Checkpoint - Garantir que todos os testes passem
  - Ensure all tests pass, ask the user if questions arise.

## Fase 3: Componentes de Dados (Tabelas e Grids)

- [x] 5. Implementar Tabelas responsivas
- [x] 5.1 Criar componente ResponsiveTable
  - Implementar horizontal scroll para mobile com indicadores visíveis
  - Adicionar priorização de colunas essenciais
  - Implementar sticky first column quando contém identificadores
  - Criar layout de cards como alternativa para mobile
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5.2 Implementar ações de tabela responsivas
  - Agrupar ações em dropdown/action sheet no mobile
  - Manter ações inline no desktop
  - Adicionar suporte para bulk actions em mobile
  - _Requirements: 2.5, 12.4_

- [x] 5.3 Escrever property tests para Tabelas
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

- [x] 6. Implementar Grids responsivos
- [x] 6.1 Criar componente ResponsiveGrid
  - Implementar sistema de colunas adaptativo (1→2→3→4)
  - Adicionar suporte para gap responsivo
  - Implementar scaling proporcional de imagens em cards
  - Adicionar configuração customizável de breakpoints
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6.2 Escrever property tests para Grids
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
- [-] 7.1 Migrar páginas de listagem para ResponsiveTable
  - Atualizar /processos para usar ResponsiveTable com layout cards em mobile
  - Atualizar /audiencias para usar ResponsiveTable com priorização de colunas
  - Atualizar /contratos para usar ResponsiveTable
  - Atualizar /clientes para usar ResponsiveTable
  - Atualizar /usuarios para usar ResponsiveTable
  - _Requirements: 12.1, 12.2, 12.3, 12.5_

- [ ] 7.2 Implementar filtros responsivos nas páginas de listagem
  - Criar componente FilterPanel colapsável para mobile
  - Implementar Sheet/Drawer para filtros em mobile
  - Manter filtros inline em desktop
  - Adicionar botão de "Filtros" com badge de contagem em mobile
  - _Requirements: 12.3_

- [ ] 7.3 Escrever property tests para Listagens
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
- [ ] 9.1 Criar wrapper ResponsiveFormLayout
  - Implementar container que aplica grid responsivo para campos
  - Adicionar suporte para stacking vertical em mobile (< 640px)
  - Adicionar layout 2-colunas para tablet (768px-1024px)
  - Implementar botões full-width ou stacked em mobile
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ] 9.2 Atualizar componentes base de formulário
  - Garantir que Button tenha touch targets mínimos de 44x44px em mobile
  - Atualizar Input para ter altura adequada em mobile (min-h-11)
  - Atualizar Select para ter altura adequada em mobile
  - Atualizar Checkbox e Radio para ter touch targets de 44x44px
  - Adicionar classes responsivas de spacing
  - _Requirements: 3.1, 3.3_

- [ ] 9.3 Migrar formulários existentes para layout responsivo
  - Atualizar formulário de cadastro de clientes
  - Atualizar formulário de cadastro de processos
  - Atualizar formulário de cadastro de contratos
  - Atualizar formulário de assinatura digital (dados pessoais)
  - Garantir consistência em todos os formulários
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ] 9.4 Escrever property tests para Formulários
  - **Property 10: Form fields stacked on mobile**
  - **Validates: Requirements 3.1**
  - **Property 11: Touch target minimum size**
  - **Validates: Requirements 3.3**
  - **Property 12: Tablet form columns**
  - **Validates: Requirements 3.4**
  - **Property 13: Mobile form buttons layout**
  - **Validates: Requirements 3.5**

- [ ] 10. Otimizar Selects e Date Pickers para mobile
- [ ] 10.1 Atualizar DatePicker para mobile
  - Verificar se react-day-picker já é touch-friendly
  - Aumentar tamanho dos botões de navegação em mobile
  - Garantir que células do calendário tenham 44x44px em mobile
  - Adicionar feedback visual claro para seleção
  - _Requirements: 7.1, 7.3, 7.5_

- [ ] 10.2 Atualizar Select e Combobox para mobile
  - Verificar se Radix Select já usa Sheet em mobile
  - Garantir que opções tenham altura mínima de 44px
  - Adicionar scroll suave para listas longas
  - Implementar busca otimizada em Combobox para mobile
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [ ] 10.3 Escrever property tests para Selects e Date Pickers
  - **Property 29: Touch-optimized date picker**
  - **Validates: Requirements 7.1**
  - **Property 30: Mobile select interface**
  - **Validates: Requirements 7.2**
  - **Property 31: Select option touch targets**
  - **Validates: Requirements 7.3**
  - **Property 32: Mobile combobox interface**
  - **Validates: Requirements 7.4**

- [ ] 12. Checkpoint - Garantir que todos os testes passem
  - Ensure all tests pass, ask the user if questions arise.

## Fase 5: Componentes de Interação (Dialogs e Modals)

- [ ] 11. Otimizar Dialogs para mobile
- [ ] 11.1 Criar variante ResponsiveDialog
  - Criar wrapper que usa Dialog em desktop e Sheet em mobile
  - Implementar detecção automática de viewport
  - Garantir que formulários em dialogs sejam responsivos
  - Posicionar botões adequadamente em mobile (bottom sticky)
  - Implementar scroll vertical quando conteúdo excede viewport
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11.2 Atualizar dialogs críticos para ResponsiveDialog
  - Atualizar create-document-dialog
  - Atualizar share-document-dialog
  - Atualizar create-chat-dialog
  - Atualizar upload-dialog
  - Atualizar template-library-dialog
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11.3 Escrever property tests para Dialogs
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

- [ ] 12. Otimizar Editor de Documentos para mobile
- [ ] 12.1 Implementar toolbar responsiva no Plate Editor
  - Verificar se Plate já tem suporte a floating toolbar
  - Criar versão mobile da fixed-toolbar com ícones essenciais
  - Implementar overflow menu para opções avançadas em mobile
  - Garantir que toolbar não ocupe muito espaço vertical em mobile
  - Testar preservação de conteúdo ao mudar orientação
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12.2 Otimizar área de edição para mobile
  - Garantir que editor ocupe altura adequada em mobile
  - Implementar scroll suave dentro do editor
  - Otimizar padding e spacing para mobile
  - Testar com teclado virtual aberto
  - _Requirements: 8.1, 8.5_

- [ ] 12.3 Escrever property tests para Editor
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

- [ ] 13. Otimizar Chat para mobile
- [ ] 13.1 Implementar navegação responsiva no Chat
  - Criar layout com Sheet para room list em mobile
  - Implementar botão de voltar para room list em mobile
  - Garantir que messages ocupem toda largura em mobile
  - Otimizar input de mensagem para mobile (com teclado virtual)
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 13.2 Otimizar message bubbles e attachments
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

- [ ] 15. Otimizar Dashboard para mobile
- [ ] 15.1 Implementar layout responsivo no Dashboard
  - Usar ResponsiveGrid para widgets do dashboard
  - Configurar grid: 1 coluna mobile, 2 colunas tablet, 3-4 desktop
  - Garantir que cards de métricas sejam legíveis em mobile
  - Implementar scroll suave entre seções
  - _Requirements: 9.1, 9.4_

- [ ] 15.2 Otimizar charts e gráficos para mobile
  - Verificar se recharts já é responsivo
  - Ajustar tamanho de fonte em labels para mobile
  - Implementar scroll horizontal para charts muito largos
  - Simplificar legendas em mobile
  - Garantir que tooltips sejam touch-friendly
  - _Requirements: 9.2_

- [ ] 15.3 Implementar filtros colapsáveis no Dashboard
  - Criar Sheet para filtros em mobile
  - Manter filtros inline em desktop
  - Adicionar botão "Filtros" com badge de contagem
  - Implementar aplicação de filtros com feedback visual
  - _Requirements: 9.5_

- [ ] 15.4 Escrever property tests para Dashboard
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

- [ ] 16. Otimizar componentes de mídia para mobile
- [ ] 16.1 Verificar e otimizar media nodes do Plate
  - Verificar se media-image-node já é responsivo
  - Garantir que imagens usem max-width: 100% e height: auto
  - Implementar aspect-ratio adequado para vídeos
  - Adicionar loading="lazy" para imagens off-screen
  - Testar preview de mídia em mobile
  - _Requirements: 13.1, 13.2, 13.4_

- [ ] 16.2 Otimizar upload de mídia em mobile
  - Verificar se upload-dialog é responsivo
  - Implementar preview adequado de arquivos em mobile
  - Adicionar feedback de progresso visível em mobile
  - Otimizar tamanho de thumbnails para mobile
  - _Requirements: 13.5_

- [ ] 16.3 Escrever property tests para Mídia
  - **Property 58: Responsive image sizing**
  - **Validates: Requirements 13.1**
  - **Property 59: Media lazy loading**
  - **Validates: Requirements 13.2**
  - **Property 60: Responsive video containers**
  - **Validates: Requirements 13.4**

## Fase 9: Suporte a Orientação

- [ ] 17. Testar e otimizar suporte a orientação
- [ ] 17.1 Testar mudanças de orientação em componentes críticos
  - Testar formulários em landscape (devem usar 2 colunas se possível)
  - Testar editor em landscape (mais espaço para toolbar)
  - Testar chat em landscape (pode mostrar rooms + messages)
  - Testar dashboard em landscape (mais colunas)
  - Verificar preservação de scroll position
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
- [ ] 18.1 Auditar navegação responsiva
  - Verificar ARIA labels no Sidebar mobile (Sheet)
  - Verificar anúncios de estado em menus colapsáveis
  - Testar navegação por teclado em mobile
  - Garantir indicadores de foco visíveis em todos os breakpoints
  - Verificar ordem de tab em layouts responsivos
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 18.2 Auditar componentes base
  - Verificar touch targets em Button, Checkbox, Radio (min 44x44px)
  - Verificar tipografia legível em mobile (min 16px para body)
  - Verificar que componentes usam unidades responsivas (rem, em, %)
  - Testar com screen readers em mobile
  - _Requirements: 11.3, 11.4, 11.5_

- [ ] 18.3 Escrever property tests para Acessibilidade
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

- [ ] 20. Implementar testes E2E responsivos com Playwright
- [ ] 20.1 Criar testes E2E para fluxos críticos em mobile
  - Testar login e navegação em mobile viewport
  - Testar criação de processo em mobile
  - Testar visualização de documento em mobile
  - Testar chat em mobile
  - Testar upload de arquivo em mobile
  - _Requirements: All_

- [ ] 20.2 Criar testes E2E para mudanças de viewport
  - Testar resize de desktop para mobile
  - Testar mudança de orientação
  - Verificar preservação de estado
  - _Requirements: 14.1, 14.2, 14.4_

- [ ] 21. Realizar auditoria de performance mobile
- [ ] 21.1 Executar Lighthouse em páginas principais
  - Auditar /dashboard em mobile
  - Auditar /processos em mobile
  - Auditar /documentos em mobile
  - Auditar /chat em mobile
  - Identificar e corrigir issues de performance
  - _Requirements: All_

- [ ] 21.2 Otimizar métricas Core Web Vitals
  - Otimizar LCP (Largest Contentful Paint) < 2.5s
  - Otimizar FID/INP (First Input Delay/Interaction to Next Paint) < 200ms
  - Otimizar CLS (Cumulative Layout Shift) < 0.1
  - Implementar lazy loading onde apropriado
  - Otimizar bundle size para mobile
  - _Requirements: All_

- [ ] 22. Realizar auditoria de acessibilidade com axe-core
- [ ] 22.1 Executar testes axe em páginas principais
  - Testar /dashboard com axe-core
  - Testar /processos com axe-core
  - Testar /documentos com axe-core
  - Corrigir todos os issues críticos encontrados
  - Validar com screen readers (VoiceOver/TalkBack)
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

## Fase 12: Documentação e Finalização

- [ ] 23. Criar documentação de responsividade
- [ ] 23.1 Documentar componentes e padrões responsivos
  - Criar guia de uso de ResponsiveTable, ResponsiveGrid, ResponsiveContainer
  - Documentar hooks: useViewport, useBreakpoint, useOrientation
  - Criar exemplos de código para casos comuns
  - Documentar breakpoints do Tailwind e quando usar cada um
  - Criar checklist de responsividade para novos componentes
  - _Requirements: All_

- [ ] 23.2 Documentar best practices
  - Documentar mobile-first approach
  - Documentar touch target sizes (min 44x44px)
  - Documentar performance best practices
  - Documentar acessibilidade em mobile
  - Criar guia de troubleshooting
  - _Requirements: All_

- [ ] 24. Revisar e refatorar código
- [ ] 24.1 Code review final
  - Revisar todos os componentes implementados
  - Identificar e refatorar código duplicado
  - Garantir consistência de naming e estrutura
  - Atualizar tipos TypeScript onde necessário
  - Remover código não utilizado
  - _Requirements: All_

- [ ] 24.2 Otimizações finais
  - Otimizar re-renders desnecessários
  - Implementar memoization onde apropriado
  - Otimizar bundle size
  - Verificar tree-shaking
  - _Requirements: All_

- [ ] 25. Checkpoint Final - Validação completa
  - Ensure all tests pass, ask the user if questions arise.
  - Validar que todos os requisitos foram atendidos
  - Confirmar que todas as propriedades passam nos testes
  - Testar em dispositivos reais (iOS e Android)
  - Validar acessibilidade completa
  - Obter aprovação final do usuário
