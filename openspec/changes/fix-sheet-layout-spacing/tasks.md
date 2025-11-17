# Tasks: Padronizar Layout e Espaçamento dos Componentes Sheet

## 1. Análise e Documentação
- [ ] 1.1 Auditar todos os componentes Sheet existentes no projeto
- [ ] 1.2 Documentar problemas específicos de cada implementação
- [ ] 1.3 Criar screenshot antes/depois para cada componente afetado
- [ ] 1.4 Definir design tokens finais (espaçamentos, fontes, cores)

## 2. Componentes de Usuários
- [ ] 2.1 Atualizar `components/usuarios/usuario-create-sheet.tsx`
  - [ ] 2.1.1 Remover subtítulo "Preencha os dados..."
  - [ ] 2.1.2 Ajustar título para `text-xl font-semibold`
  - [ ] 2.1.3 Adicionar padding lateral `p-6`
  - [ ] 2.1.4 Implementar `space-y-6` para seções
  - [ ] 2.1.5 Implementar `space-y-4` para campos
  - [ ] 2.1.6 Ajustar SheetFooter com `pt-6`
- [ ] 2.2 Atualizar `components/usuarios/usuario-edit-sheet.tsx` (se existir)
  - [ ] 2.2.1 Aplicar mesmo padrão de layout
- [ ] 2.3 Atualizar `components/usuarios/usuario-view-sheet.tsx` (se existir)
  - [ ] 2.3.1 Aplicar mesmo padrão de layout
- [ ] 2.4 Atualizar `components/usuarios/usuarios-filtros-avancados.tsx`
  - [ ] 2.4.1 Aplicar padrão de espaçamento
  - [ ] 2.4.2 Organizar filtros em seções lógicas

## 3. Componentes de Clientes
- [ ] 3.1 Atualizar `components/clientes/cliente-create-sheet.tsx` (se existir)
  - [ ] 3.1.1 Remover subtítulo redundante
  - [ ] 3.1.2 Aplicar padrão de layout
  - [ ] 3.1.3 Implementar hierarquia visual
- [ ] 3.2 Atualizar `components/clientes/clientes-filtros-avancados.tsx` (se existir)
  - [ ] 3.2.1 Aplicar padrão de espaçamento

## 4. Componentes de Audiências
- [ ] 4.1 Atualizar `components/audiencias/audiencias-filtros-avancados.tsx`
  - [ ] 4.1.1 Remover subtítulo se presente
  - [ ] 4.1.2 Aplicar padrão de layout
  - [ ] 4.1.3 Organizar filtros por tipo (data, tribunal, responsável)

## 5. Componentes de Processos/Acervo
- [ ] 5.1 Atualizar `components/processos/processos-filtros-avancados.tsx` (se existir)
  - [ ] 5.1.1 Aplicar padrão de layout

## 6. Componentes de Expedientes/Pendências
- [ ] 6.1 Atualizar `components/expedientes/expedientes-filtros-avancados.tsx` (se existir)
  - [ ] 6.1.1 Aplicar padrão de layout

## 7. Outros Componentes Sheet
- [ ] 7.1 Identificar outros Sheets no projeto
- [ ] 7.2 Aplicar padrão em cada um identificado

## 8. Componente Base (Opcional)
- [ ] 8.1 Avaliar necessidade de customizar `components/ui/sheet.tsx`
- [ ] 8.2 Se necessário, criar wrapper customizado para Sheet
- [ ] 8.3 Definir classes padrão para SheetContent, SheetHeader, SheetFooter

## 9. Documentação de Padrões
- [ ] 9.1 Criar guia de uso de Sheet em comentários ou doc
- [ ] 9.2 Documentar classes Tailwind recomendadas
- [ ] 9.3 Criar exemplo de referência (template)

## 10. Testes e Validação
- [ ] 10.1 Testar cada Sheet atualizado em diferentes resoluções
- [ ] 10.2 Validar hierarquia visual em cada componente
- [ ] 10.3 Verificar acessibilidade (navegação por teclado, labels)
- [ ] 10.4 Testar em mobile (responsividade)
- [ ] 10.5 Validar que textos não são cortados
- [ ] 10.6 Verificar consistência entre todos os Sheets

## 11. Code Review e Ajustes
- [ ] 11.1 Revisar código de todos os componentes atualizados
- [ ] 11.2 Garantir que padrão está sendo seguido
- [ ] 11.3 Ajustar inconsistências encontradas

## 12. Finalização
- [ ] 12.1 Executar type-check (`npm run type-check`)
- [ ] 12.2 Executar lint (`npm run lint`)
- [ ] 12.3 Build de produção para verificar erros (`npm run build`)
- [ ] 12.4 Atualizar este arquivo marcando todas as tasks como completas
