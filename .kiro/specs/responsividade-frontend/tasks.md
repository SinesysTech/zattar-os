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

## Fase 5: Componentes de Interação (Dialogs e Modals) ✅

- [x] 12. Otimizar Dialogs para mobile
- [x] 12.1 Criar variante ResponsiveDialog
- [x] 12.2 Atualizar dialogs críticos para ResponsiveDialog
- [x] 12.3 Escrever property tests para Dialogs

## Fase 6: Componentes Complexos (Editor e Chat) ✅

- [x] 13. Otimizar Editor de Documentos para mobile
- [x] 13.1 Implementar toolbar responsiva no Plate Editor
- [x] 13.2 Otimizar área de edição para mobile
- [x] 13.3 Escrever property tests para Editor

- [x] 14. Otimizar Chat para mobile
- [x] 14.1 Implementar navegação responsiva no Chat
- [x] 14.2 Otimizar message bubbles e attachments
- [x] 14.3 Escrever property tests para Chat

- [x] 15. Checkpoint - Garantir que todos os testes passem

## Fase 7: Dashboard e Visualizações ✅

- [x] 16. Otimizar Dashboard para mobile
- [x] 16.1 Implementar layout responsivo no Dashboard
- [x] 16.2 Otimizar charts e gráficos para mobile
- [x] 16.3 Implementar filtros colapsáveis no Dashboard
- [x] 16.4 Escrever property tests para Dashboard

## Fase 8: Otimização de Mídia ✅

- [x] 17. Otimizar componentes de mídia para mobile
- [x] 17.1 Verificar e otimizar media nodes do Plate
- [x] 17.2 Otimizar upload de mídia em mobile
- [x] 17.3 Escrever property tests para Mídia

## Fase 9: Suporte a Orientação

- [-] 18. Testar e otimizar suporte a orientação
- [x] 18.1 Implementar detecção e adaptação de orientação
  - Verificar se useOrientation hook está funcionando corretamente
  - Testar formulários em landscape (devem usar 2 colunas se possível)
  - Testar editor em landscape (mais espaço para toolbar)
  - Testar chat em landscape (pode mostrar rooms + messages)
  - Testar dashboard em landscape (mais colunas)
  - Verificar preservação de scroll position ao rotacionar
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 18.2 Otimizar visualização de mídia em landscape
  - Garantir que imagens/vídeos usem mais espaço em landscape
  - Implementar fullscreen otimizado para landscape
  - Testar preview de documentos em landscape
  - _Requirements: 14.5_

- [-] 18.3 Escrever property tests para Orientação
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

- [ ] 19. Auditar e melhorar acessibilidade responsiva
- [ ] 19.1 Implementar ARIA labels e roles em componentes responsivos
  - Adicionar ARIA labels apropriados no Sidebar mobile (Sheet)
  - Implementar anúncios de estado em menus colapsáveis (aria-expanded, aria-hidden)
  - Adicionar roles apropriados (navigation, menu, dialog)
  - Garantir que ResponsiveDialog tenha aria-modal e aria-labelledby
  - Garantir que ResponsiveTable tenha role="table" e estrutura semântica
  - _Requirements: 15.1, 15.2_

- [ ] 19.2 Implementar navegação por teclado em componentes responsivos
  - Testar navegação por teclado no Sidebar mobile
  - Testar navegação por teclado em ResponsiveDialog
  - Testar navegação por teclado em ResponsiveTable (modo cards)
  - Garantir que filtros colapsáveis sejam acessíveis por teclado
  - Verificar ordem de tab lógica em todos os layouts responsivos
  - _Requirements: 15.3, 15.5_

- [ ] 19.3 Implementar indicadores de foco visíveis
  - Adicionar estilos de foco visíveis em todos os breakpoints
  - Garantir contraste adequado para indicadores de foco
  - Testar indicadores de foco em modo escuro
  - Verificar que foco não é perdido ao mudar de breakpoint
  - _Requirements: 15.4_

- [ ] 19.4 Auditar e corrigir touch targets
  - Auditar todos os botões para garantir min 44x44px em mobile
  - Auditar checkboxes e radio buttons para garantir min 44x44px
  - Auditar links e elementos clicáveis
  - Corrigir componentes que não atendem o mínimo
  - _Requirements: 11.4_

- [ ] 19.5 Auditar tipografia e unidades responsivas
  - Verificar que body text tem min 16px em mobile
  - Verificar que componentes usam rem/em ao invés de px fixo
  - Verificar que espaçamentos usam unidades responsivas
  - Corrigir componentes com unidades fixas inadequadas
  - _Requirements: 11.3, 11.5_

- [ ] 19.6 Escrever property tests para Acessibilidade
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

- [ ] 20. Checkpoint Final - Garantir que todos os testes passem
  - Ensure all tests pass, ask the user if questions arise.

## Fase 11: Testes de Integração e Performance

- [ ] 21. Expandir testes E2E responsivos com Playwright
- [ ] 21.1 Expandir testes E2E para fluxos críticos em mobile
  - Expandir teste de login para incluir diferentes viewports
  - Criar teste de criação de processo em mobile
  - Criar teste de edição de documento em mobile
  - Criar teste de envio de mensagem no chat em mobile
  - Criar teste de upload de arquivo em mobile
  - _Requirements: All_

- [ ] 21.2 Criar testes E2E para mudanças de viewport e orientação
  - Testar resize de desktop para mobile durante uso
  - Testar mudança de orientação durante edição
  - Verificar preservação de estado ao mudar viewport
  - Testar scroll position preservation
  - _Requirements: 14.1, 14.2, 14.4_

- [ ] 22. Realizar auditoria de performance mobile
- [ ] 22.1 Executar Lighthouse em páginas principais
  - Auditar /dashboard em mobile (já tem teste básico, expandir)
  - Auditar /processos em mobile
  - Auditar /documentos em mobile
  - Auditar /chat em mobile
  - Auditar /audiencias em mobile
  - Identificar e corrigir issues de performance
  - _Requirements: All_

- [ ] 22.2 Otimizar métricas Core Web Vitals
  - Medir e otimizar LCP (Largest Contentful Paint) < 2.5s
  - Medir e otimizar FID/INP (First Input Delay/Interaction to Next Paint) < 200ms
  - Medir e otimizar CLS (Cumulative Layout Shift) < 0.1
  - Implementar lazy loading adicional onde apropriado
  - Analisar e otimizar bundle size para mobile
  - Implementar code splitting para rotas
  - _Requirements: All_

- [ ] 23. Realizar auditoria de acessibilidade com axe-core
- [ ] 23.1 Integrar axe-core nos testes E2E
  - Instalar @axe-core/playwright
  - Criar helper para executar axe em páginas
  - Testar /dashboard com axe-core em mobile e desktop
  - Testar /processos com axe-core em mobile e desktop
  - Testar /documentos com axe-core em mobile e desktop
  - Testar /chat com axe-core em mobile e desktop
  - Corrigir todos os issues críticos encontrados
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 23.2 Validar com screen readers
  - Testar navegação com VoiceOver (iOS/macOS)
  - Testar navegação com TalkBack (Android)
  - Testar navegação com NVDA/JAWS (Windows)
  - Documentar issues encontrados e corrigir
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

## Fase 12: Documentação e Finalização

- [ ] 24. Criar documentação de responsividade
- [ ] 24.1 Documentar componentes responsivos
  - Criar README.md em components/ui/ documentando ResponsiveTable
  - Documentar ResponsiveGrid com exemplos de uso
  - Documentar ResponsiveDialog e quando usar
  - Documentar ResponsiveFormLayout com exemplos
  - Documentar ResponsiveContainer e ResponsiveEditor
  - Documentar ResponsiveFilterPanel
  - Criar Storybook stories para componentes responsivos (opcional)
  - _Requirements: All_

- [ ] 24.2 Documentar hooks e utilitários
  - Documentar useViewport com exemplos de uso
  - Documentar useBreakpoint, useBreakpointBelow, useBreakpointBetween
  - Documentar useOrientation e useOrientationChange
  - Criar exemplos práticos de uso dos hooks
  - Documentar helpers de teste (responsive-test-helpers)
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 24.3 Criar guia de desenvolvimento responsivo
  - Documentar breakpoints do Tailwind e quando usar cada um
  - Criar checklist de responsividade para novos componentes
  - Documentar mobile-first approach
  - Documentar touch target sizes (min 44x44px)
  - Documentar performance best practices para mobile
  - Documentar acessibilidade em mobile
  - Criar guia de troubleshooting comum
  - _Requirements: All_

- [ ] 25. Revisar e refatorar código
- [ ] 25.1 Code review de componentes responsivos
  - Revisar ResponsiveTable e identificar melhorias
  - Revisar ResponsiveGrid e identificar melhorias
  - Revisar ResponsiveDialog e identificar melhorias
  - Revisar ResponsiveFormLayout e identificar melhorias
  - Identificar e refatorar código duplicado
  - Garantir consistência de naming e estrutura
  - Atualizar tipos TypeScript onde necessário
  - _Requirements: All_

- [ ] 25.2 Otimizações de performance
  - Auditar re-renders desnecessários com React DevTools Profiler
  - Implementar React.memo onde apropriado
  - Implementar useMemo/useCallback para callbacks pesados
  - Verificar bundle size com webpack-bundle-analyzer
  - Implementar code splitting adicional se necessário
  - Verificar tree-shaking está funcionando
  - _Requirements: All_

- [ ] 25.3 Limpeza de código
  - Remover imports não utilizados
  - Remover código comentado
  - Remover console.logs de debug
  - Atualizar comentários desatualizados
  - Garantir formatação consistente (Prettier)
  - _Requirements: All_

- [ ] 26. Validação final e testes em dispositivos reais
- [ ] 26.1 Testar em dispositivos iOS reais
  - Testar em iPhone (iOS Safari)
  - Testar navegação e interações touch
  - Testar formulários com teclado virtual
  - Testar orientação portrait/landscape
  - Validar performance e animações
  - _Requirements: All_

- [ ] 26.2 Testar em dispositivos Android reais
  - Testar em Android (Chrome)
  - Testar navegação e interações touch
  - Testar formulários com teclado virtual
  - Testar orientação portrait/landscape
  - Validar performance e animações
  - _Requirements: All_

- [ ] 26.3 Checkpoint Final - Validação completa
  - Ensure all tests pass, ask the user if questions arise.
  - Validar que todos os requisitos foram atendidos
  - Confirmar que todas as propriedades passam nos testes
  - Validar acessibilidade completa
  - Revisar documentação criada
  - Obter aprovação final do usuário
