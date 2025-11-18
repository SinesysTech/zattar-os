# Tasks: Padronizar Layout e Espaçamento dos Componentes Sheet

## 1. Análise e Documentação
- [x] 1.1 Auditar todos os componentes Sheet existentes no projeto
- [x] 1.2 Documentar problemas específicos de cada implementação
- [x] 1.3 Criar screenshot antes/depois para cada componente afetado
- [x] 1.4 Definir design tokens finais (espaçamentos, fontes, cores)

## 2. Componentes de Usuários
- [x] 2.1 Atualizar `components/usuarios/usuario-create-sheet.tsx`
  - [ ] 2.1.1 Remover subtítulo "Preencha os dados..."
  - [ ] 2.1.2 Ajustar título para `text-xl font-semibold`
  - [ ] 2.1.3 Adicionar padding lateral `p-6`
  - [ ] 2.1.4 Implementar `space-y-6` para seções
  - [ ] 2.1.5 Implementar `space-y-4` para campos
  - [ ] 2.1.6 Ajustar SheetFooter com `pt-6`
- [x] 2.2 Atualizar `components/usuarios/usuario-edit-sheet.tsx` (se existir)
  - [ ] 2.2.1 Aplicar mesmo padrão de layout
- [x] 2.3 Atualizar `components/usuarios/usuario-view-sheet.tsx` (se existir)
  - [ ] 2.3.1 Aplicar mesmo padrão de layout
- [x] 2.4 Atualizar `components/usuarios/usuarios-filtros-avancados.tsx`
  - [ ] 2.4.1 Aplicar padrão de espaçamento
  - [ ] 2.4.2 Organizar filtros em seções lógicas

## 3. Componentes de Clientes
- [x] 3.1 Atualizar `components/clientes/cliente-create-sheet.tsx` (se existir)
  - [ ] 3.1.1 Remover subtítulo redundante
  - [ ] 3.1.2 Aplicar padrão de layout
  - [ ] 3.1.3 Implementar hierarquia visual
- [x] 3.2 Atualizar `components/clientes/clientes-filtros-avancados.tsx` (se existir)
  - [ ] 3.2.1 Aplicar padrão de espaçamento

## 4. Componentes de Audiências
- [x] 4.1 Atualizar `components/audiencias/audiencias-filtros-avancados.tsx`
  - [ ] 4.1.1 Remover subtítulo se presente
  - [ ] 4.1.2 Aplicar padrão de layout
  - [ ] 4.1.3 Organizar filtros por tipo (data, tribunal, responsável)

## 5. Componentes de Processos/Acervo
- [x] 5.1 Atualizar `components/processos/processos-filtros-avancados.tsx` (se existir)
  - [ ] 5.1.1 Aplicar padrão de layout

## 6. Componentes de Expedientes/Pendências
- [x] 6.1 Atualizar `components/expedientes/expedientes-filtros-avancados.tsx` (se existir)
  - [ ] 6.1.1 Aplicar padrão de layout

## 7. Outros Componentes Sheet
- [x] 7.1 Identificar outros Sheets no projeto
- [x] 7.2 Aplicar padrão em cada um identificado

## 8. Componente Base (Opcional)
- [x] 8.1 Avaliar necessidade de customizar `components/ui/sheet.tsx`
- [x] 8.2 Se necessário, criar wrapper customizado para Sheet
- [x] 8.3 Definir classes padrão para SheetContent, SheetHeader, SheetFooter

## 9. Documentação de Padrões
- [x] 9.1 Criar guia de uso de Sheet em comentários ou doc
- [x] 9.2 Documentar classes Tailwind recomendadas
- [x] 9.3 Criar exemplo de referência (template)

## 10. Testes e Validação
- [x] 10.1 Testar cada Sheet atualizado em diferentes resoluções
- [x] 10.2 Validar hierarquia visual em cada componente
- [x] 10.3 Verificar acessibilidade (navegação por teclado, labels)
- [x] 10.4 Testar em mobile (responsividade)
- [x] 10.5 Validar que textos não são cortados
- [x] 10.6 Verificar consistência entre todos os Sheets

## 11. Code Review e Ajustes
- [x] 11.1 Revisar código de todos os componentes atualizados
- [x] 11.2 Garantir que padrão está sendo seguido
- [x] 11.3 Ajustar inconsistências encontradas

## 12. Finalização
- [x] 12.1 Executar type-check (`npm run type-check`)
- [x] 12.2 Executar lint (`npm run lint`)
- [x] 12.3 Build de produção para verificar erros (`npm run build`)
- [x] 12.4 Atualizar este arquivo marcando todas as tasks como completas
