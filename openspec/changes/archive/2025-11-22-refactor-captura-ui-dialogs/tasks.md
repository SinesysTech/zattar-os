# Tasks: Refatorar UI da Página de Captura com Dialogs

## 1. Criar Componentes Base
- [ ] 1.1 Criar `components/captura/tipo-captura-select.tsx` - Dropdown para seleção de tipo de captura
- [ ] 1.2 Criar `components/captura/captura-dialog.tsx` - Dialog para nova captura com dropdown de tipo
- [ ] 1.3 Criar `components/captura/agendamento-dialog.tsx` - Dialog para novo agendamento com dropdown de tipo

## 2. Refatorar Página de Captura
- [ ] 2.1 Modificar `app/(dashboard)/captura/page.tsx` - Remover tab "Captura" e reorganizar para Histórico → Agendamentos
- [ ] 2.2 Adicionar botão "Nova Captura" no header da página que abre CapturaDialog
- [ ] 2.3 Integrar CapturaDialog com formulários existentes de captura

## 3. Adaptar Formulários de Captura
- [ ] 3.1 Verificar e adaptar `components/captura/acervo-geral-form.tsx` para uso em dialog
- [ ] 3.2 Verificar e adaptar `components/captura/arquivados-form.tsx` para uso em dialog
- [ ] 3.3 Verificar e adaptar `components/captura/audiencias-form.tsx` para uso em dialog
- [ ] 3.4 Verificar e adaptar `components/captura/pendentes-form.tsx` para uso em dialog

## 4. Implementar Tab Agendamentos
- [ ] 4.1 Adicionar botão "Novo Agendamento" na tab Agendamentos
- [ ] 4.2 Integrar AgendamentoDialog com formulário de agendamento
- [ ] 4.3 Conectar com API de agendamentos existente

## 5. Testes e Validação
- [ ] 5.1 Testar fluxo completo de nova captura via dialog
- [ ] 5.2 Testar seleção de diferentes tipos de captura no dropdown
- [ ] 5.3 Testar criação de agendamento via dialog
- [ ] 5.4 Validar responsividade dos dialogs em diferentes tamanhos de tela
- [ ] 5.5 Verificar acessibilidade (navegação por teclado, ARIA labels)

## 6. Limpeza e Documentação
- [ ] 6.1 Remover código não utilizado da versão anterior
- [ ] 6.2 Atualizar comentários e documentação inline
- [ ] 6.3 Garantir consistência de estilo com shadcn/ui
