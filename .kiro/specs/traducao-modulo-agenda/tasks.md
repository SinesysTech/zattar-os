# Tasks: Tradução Completa e Ajustes de Layout do Módulo de Agenda

## 1. Preparação

- [ ] 1.1 Revisar requirements.md e design.md
- [ ] 1.2 Verificar se locale pt-BR do date-fns está configurado globalmente
- [ ] 1.3 Criar branch: `feature/traducao-modulo-agenda`

## 2. Tradução de Metadados e Estrutura Principal

- [ ] 2.1 Traduzir metadados em `page.tsx`
  - Alterar title: "Event Calendar" → "Agenda"
  - Alterar description para português
  - Adicionar PageShell para estrutura consistente

- [ ] 2.2 Configurar locale pt-BR do date-fns (se necessário)
  - Verificar configuração global
  - Adicionar import de locale onde necessário

## 3. Tradução do Componente Principal (event-calendar.tsx)

- [ ] 3.1 Traduzir botões de navegação
  - "Today" → "Hoje"
  - "New event" → "Novo evento"
  - aria-label "Previous" → "Anterior"
  - aria-label "Next" → "Próximo"

- [ ] 3.2 Traduzir dropdown de visualizações
  - "Month" → "Mês"
  - "Week" → "Semana"
  - "Day" → "Dia"
  - "Agenda" → "Agenda"
  - Manter atalhos de teclado (M, W, D, A)

- [ ] 3.3 Traduzir mensagens toast
  - `Event "${event.title}" added` → `Evento "${event.title}" adicionado`
  - `Event "${event.title}" updated` → `Evento "${event.title}" atualizado`
  - `Event "${event.title}" deleted` → `Evento "${event.title}" excluído`
  - `Event "${event.title}" moved` → `Evento "${event.title}" movido`

- [ ] 3.4 Traduzir textos responsivos (sr-only)
  - Verificar todos os spans com className="sr-only"
  - Traduzir textos ocultos para screen readers

## 4. Tradução do Diálogo de Evento (event-dialog.tsx)

- [ ] 4.1 Traduzir títulos do diálogo
  - "Create Event" → "Criar Evento"
  - "Edit Event" → "Editar Evento"

- [ ] 4.2 Traduzir descrições (sr-only)
  - "Edit the details of this event" → "Edite os detalhes deste evento"
  - "Add a new event to your calendar" → "Adicione um novo evento à sua agenda"

- [ ] 4.3 Traduzir labels de formulário
  - "Title" → "Título"
  - "Description" → "Descrição"
  - "Start Date" → "Data de Início"
  - "End Date" → "Data de Término"
  - "Start Time" → "Hora de Início"
  - "End Time" → "Hora de Término"
  - "All day" → "Dia inteiro"
  - "Location" → "Local"
  - "Etiquette" → "Etiqueta"

- [ ] 4.4 Traduzir placeholders
  - "Pick a date" → "Selecione uma data"
  - "Select time" → "Selecione o horário"

- [ ] 4.5 Traduzir opções de cor
  - "Sky" → "Azul Céu"
  - "Amber" → "Âmbar"
  - "Violet" → "Violeta"
  - "Rose" → "Rosa"
  - "Emerald" → "Esmeralda"
  - "Orange" → "Laranja"

- [ ] 4.6 Traduzir botões de ação
  - "Cancel" → "Cancelar"
  - "Save" → "Salvar"
  - aria-label "Delete event" → "Excluir evento"

- [ ] 4.7 Traduzir mensagens de erro
  - "End date cannot be before start date" → "Data de término não pode ser anterior à data de início"
  - `Selected time must be between ${StartHour}:00 and ${EndHour}:00` → `Horário selecionado deve estar entre ${StartHour}:00 e ${EndHour}:00`

## 5. Tradução da Visualização Agenda (agenda-view.tsx)

- [ ] 5.1 Traduzir estado vazio
  - "No events found" → "Nenhum evento encontrado"
  - "There are no events scheduled for this time period." → "Não há eventos agendados para este período."

- [ ] 5.2 Verificar formato de data
  - Confirmar que date-fns está usando locale pt-BR
  - Testar formato "d MMM, EEEE"

## 6. Tradução da Visualização Semana (week-view.tsx)

- [ ] 6.1 Traduzir "All day"
  - Localizar todas as ocorrências
  - Alterar para "Dia inteiro"

- [ ] 6.2 Verificar formato de hora
  - Confirmar formato "h a" (ex: "9 AM")
  - Manter formato ou adaptar se necessário

## 7. Tradução da Visualização Mês (month-view.tsx)

- [ ] 7.1 Traduzir texto "+ X more"
  - Localizar componente de eventos ocultos
  - Alterar para "+ {remainingCount} mais"
  - Traduzir sr-only text "more" → "mais"

## 8. Tradução de Dados de Exemplo (event-calendar-app.tsx)

- [ ] 8.1 Traduzir eventos de exemplo (opcional mas recomendado)
  - "Annual Planning" → "Planejamento Anual"
  - "Project Deadline" → "Prazo do Projeto"
  - "Quarterly Budget Review" → "Revisão Trimestral de Orçamento"
  - "Team Meeting" → "Reunião de Equipe"
  - "Lunch with Client" → "Almoço com Cliente"
  - "Product Launch" → "Lançamento de Produto"
  - "Sales Conference" → "Conferência de Vendas"
  - "Review contracts" → "Revisar contratos"
  - "Marketing Strategy Session" → "Sessão de Estratégia de Marketing"
  - "Annual Shareholders Meeting" → "Reunião Anual de Acionistas"
  - "Product Development Workshop" → "Workshop de Desenvolvimento de Produto"

- [ ] 8.2 Traduzir descrições dos eventos
  - "Strategic planning for next year" → "Planejamento estratégico para o próximo ano"
  - "Submit final deliverables" → "Enviar entregáveis finais"
  - "Weekly team sync" → "Sincronização semanal da equipe"
  - "Discuss new project requirements" → "Discutir requisitos do novo projeto"
  - "New product release" → "Lançamento de novo produto"
  - "Discuss about new clients" → "Discutir sobre novos clientes"
  - "Quarterly marketing planning" → "Planejamento trimestral de marketing"
  - "Presentation of yearly results" → "Apresentação dos resultados anuais"
  - "Brainstorming for new features" → "Brainstorming para novos recursos"

- [ ] 8.3 Traduzir localizações dos eventos
  - "Main Conference Hall" → "Sala de Conferências Principal"
  - "Office" → "Escritório"
  - "Conference Room A" → "Sala de Conferências A"
  - "Downtown Cafe" → "Café do Centro"
  - "Marketing Department" → "Departamento de Marketing"
  - "Grand Conference Center" → "Centro de Conferências Grand"
  - "Innovation Lab" → "Laboratório de Inovação"

## 9. Ajustes de Layout e Design System

- [ ] 9.1 Aplicar PageShell em page.tsx
  - Importar PageShell
  - Envolver EventCalendarApp com PageShell
  - Definir title="Agenda"
  - Definir description="Gerencie seus eventos e compromissos"

- [ ] 9.2 Verificar conformidade com design system
  - Confirmar que não há cores hardcoded
  - Verificar espaçamento (grid 4px)
  - Confirmar uso de componentes shadcn/ui

## 10. Testes e Validação

- [ ] 10.1 Testes manuais - Interface principal
  - Verificar título "Agenda" no PageShell
  - Testar botão "Hoje"
  - Testar botão "Novo evento"
  - Testar dropdown de visualizações
  - Testar atalhos de teclado (M, W, D, A)

- [ ] 10.2 Testes manuais - Diálogo de evento
  - Abrir diálogo de criação
  - Verificar todos os labels em português
  - Testar validação de datas
  - Verificar mensagens de erro em português
  - Testar criação de evento
  - Verificar toast de confirmação

- [ ] 10.3 Testes manuais - Edição e exclusão
  - Abrir evento existente
  - Verificar título "Editar Evento"
  - Modificar dados
  - Verificar toast de atualização
  - Testar exclusão
  - Verificar toast de exclusão

- [ ] 10.4 Testes manuais - Visualizações
  - Testar visualização Mês
  - Testar visualização Semana (verificar "Dia inteiro")
  - Testar visualização Dia
  - Testar visualização Agenda (verificar estado vazio)
  - Verificar "+ X mais" na visualização Mês

- [ ] 10.5 Testes manuais - Responsividade
  - Testar em mobile (375px)
  - Testar em tablet (768px)
  - Testar em desktop (1024px, 1440px)
  - Verificar textos responsivos (sr-only)

- [ ] 10.6 Testes manuais - Acessibilidade
  - Testar navegação por teclado
  - Testar com screen reader (se possível)
  - Verificar aria-labels
  - Verificar contraste de cores

- [ ] 10.7 Verificar TypeScript
  - Executar `npm run type-check`
  - Corrigir erros de tipo (se houver)

- [ ] 10.8 Verificar linting
  - Executar `npm run lint`
  - Corrigir warnings (se houver)

## 11. Documentação

- [ ] 11.1 Atualizar CHANGELOG.md
  - Adicionar entrada na seção [Unreleased]
  - Descrever mudanças de tradução

- [ ] 11.2 Adicionar comentários no código (se necessário)
  - Comentários em português
  - Documentar lógica complexa

- [ ] 11.3 Atualizar README.md (se aplicável)
  - Mencionar módulo de agenda traduzido

## 12. Revisão e Merge

- [ ] 12.1 Auto-revisão
  - Revisar todos os arquivos modificados
  - Verificar consistência terminológica
  - Confirmar que nenhuma funcionalidade foi quebrada

- [ ] 12.2 Criar Pull Request
  - Título: "feat: Tradução completa do módulo de Agenda para português"
  - Descrição detalhada das mudanças
  - Screenshots (antes/depois)
  - Checklist de testes

- [ ] 12.3 Code Review
  - Solicitar revisão de falante nativo de português
  - Solicitar revisão técnica
  - Endereçar comentários

- [ ] 12.4 Merge
  - Aguardar aprovação
  - Fazer merge para branch principal
  - Deletar branch de feature

## 13. Pós-Implementação

- [ ] 13.1 Monitorar produção
  - Verificar logs de erro
  - Coletar feedback de usuários

- [ ] 13.2 Documentar lições aprendidas
  - Registrar problemas encontrados
  - Documentar soluções aplicadas

## Resumo de Arquivos a Modificar

| Arquivo | Tipo de Mudança | Prioridade |
|---------|-----------------|------------|
| `page.tsx` | Metadados + PageShell | Alta |
| `event-calendar.tsx` | Tradução de interface | Alta |
| `event-dialog.tsx` | Tradução de formulário | Alta |
| `agenda-view.tsx` | Tradução de estado vazio | Média |
| `week-view.tsx` | Tradução "All day" | Média |
| `month-view.tsx` | Tradução "+ X more" | Média |
| `event-calendar-app.tsx` | Tradução de dados exemplo | Baixa |
| `constants.ts` | Comentários (opcional) | Baixa |

## Estimativa de Tempo

| Fase | Tempo Estimado |
|------|----------------|
| Preparação | 15 min |
| Tradução (arquivos principais) | 1h 30min |
| Tradução (dados exemplo) | 30 min |
| Ajustes de layout | 15 min |
| Testes manuais | 1h |
| Documentação | 15 min |
| Revisão e merge | 30 min |
| **Total** | **4h 15min** |

## Notas Importantes

1. **Não alterar lógica de negócio** - apenas tradução de textos
2. **Manter funcionalidade existente** - drag-and-drop, CRUD, navegação
3. **Testar extensivamente** - especialmente validações e toasts
4. **Consistência terminológica** - usar mesmos termos de outros módulos
5. **Acessibilidade** - não esquecer aria-labels e sr-only texts
