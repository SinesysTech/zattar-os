# Tasks: Refatorar Obrigacoes - Separacao Juridico/Financeiro

## 1. Analise e Consolidacao (Fase 1)

### 1.1 Revisar features/obrigacoes/
- [ ] 1.1.1 Auditar `domain.ts` - Identificar e remover tipos financeiros
- [ ] 1.1.2 Auditar `repository.ts` - Identificar e remover joins com `lancamentos_financeiros`
- [ ] 1.1.3 Auditar `service.ts` - Identificar e remover logica de sincronizacao
- [ ] 1.1.4 Auditar `actions/` - Identificar e remover actions de sincronizacao
- [ ] 1.1.5 Documentar estado atual e decisoes

### 1.2 Analisar features/financeiro/ (obrigacoes)
- [ ] 1.2.1 Auditar `domain/obrigacoes.ts` - Listar tipos a remover
- [ ] 1.2.2 Auditar `types/obrigacoes.ts` - Listar tipos a remover
- [ ] 1.2.3 Auditar `repository/obrigacoes.ts` - Identificar logica a simplificar
- [ ] 1.2.4 Auditar `services/obrigacoes.ts` - Identificar logica a simplificar
- [ ] 1.2.5 Mapear dependencias entre modulos

## 2. Refatoracao de features/obrigacoes/ (Fase 2)

### 2.1 Consolidar Domain Layer
- [ ] 2.1.1 Atualizar `domain.ts` - Garantir tipos juridicos puros
- [ ] 2.1.2 Remover tipos financeiros de `domain.ts`
- [ ] 2.1.3 Adicionar constantes de labels e formatacao
- [ ] 2.1.4 Adicionar funcoes de validacao juridica
- [ ] 2.1.5 Criar schemas Zod para validacao

### 2.2 Consolidar Repository Layer
- [ ] 2.2.1 Atualizar `repository.ts` - CRUD de Acordos
- [ ] 2.2.2 Atualizar `repository.ts` - CRUD de Parcelas
- [ ] 2.2.3 Atualizar `repository.ts` - Gestao de Repasses
- [ ] 2.2.4 Remover joins com `lancamentos_financeiros`
- [ ] 2.2.5 Otimizar queries para listagem

### 2.3 Consolidar Service Layer
- [ ] 2.3.1 Atualizar `service.ts` - Casos de uso de Acordos
- [ ] 2.3.2 Atualizar `service.ts` - Casos de uso de Parcelas
- [ ] 2.3.3 Atualizar `service.ts` - Gestao de Repasses
- [ ] 2.3.4 Remover logica de sincronizacao financeira
- [ ] 2.3.5 Adicionar validacoes de integridade juridica

### 2.4 Consolidar Actions
- [ ] 2.4.1 Atualizar `actions/acordos.ts` - CRUD completo
- [ ] 2.4.2 Atualizar `actions/parcelas.ts` - CRUD completo
- [ ] 2.4.3 Atualizar `actions/repasses.ts` - Gestao de repasses
- [ ] 2.4.4 Remover actions de sincronizacao
- [ ] 2.4.5 Atualizar `actions/index.ts` - Barrel export

### 2.5 Atualizar Barrel Export
- [ ] 2.5.1 Atualizar `index.ts` - Exportar apenas tipos juridicos
- [ ] 2.5.2 Remover exports de tipos financeiros
- [ ] 2.5.3 Verificar compatibilidade com consumidores

## 3. Limpeza em features/financeiro/ (Fase 3)

### 3.1 Remover Arquivos Redundantes
- [ ] 3.1.1 Fazer backup de `domain/obrigacoes.ts`
- [ ] 3.1.2 Remover `domain/obrigacoes.ts`
- [ ] 3.1.3 Fazer backup de `types/obrigacoes.ts`
- [ ] 3.1.4 Remover `types/obrigacoes.ts`
- [ ] 3.1.5 Atualizar imports em arquivos dependentes

### 3.2 Simplificar Repository
- [ ] 3.2.1 Refatorar `repository/obrigacoes.ts` - Manter apenas integracao
- [ ] 3.2.2 Remover mappers complexos
- [ ] 3.2.3 Manter funcoes de busca de lancamentos vinculados
- [ ] 3.2.4 Manter funcoes de deteccao de inconsistencias

### 3.3 Simplificar Services
- [ ] 3.3.1 Refatorar `services/obrigacoes.ts` - Manter apenas sincronizacao
- [ ] 3.3.2 Remover logica de gestao de repasses (e juridica)
- [ ] 3.3.3 Manter calculo de split de pagamento
- [ ] 3.3.4 Manter validacao de integridade financeira

### 3.4 Simplificar Actions
- [ ] 3.4.1 Refatorar `actions/obrigacoes.ts` - Manter apenas sincronizacao
- [ ] 3.4.2 Criar `actionSincronizarAcordo`
- [ ] 3.4.3 Criar `actionSincronizarParcela`
- [ ] 3.4.4 Remover actions juridicas duplicadas

## 4. Implementar Pagina de Obrigacoes (Fase 4)

### 4.1 Criar ObrigacoesContent
- [ ] 4.1.1 Criar `components/obrigacoes-content.tsx`
- [ ] 4.1.2 Implementar multiplas visualizacoes (semana, mes, ano, lista)
- [ ] 4.1.3 Implementar carrosseis de navegacao temporal
- [ ] 4.1.4 Implementar filtros avancados
- [ ] 4.1.5 Implementar sincronizacao com URL

### 4.2 Criar ObrigacoesTableWrapper
- [ ] 4.2.1 Criar `components/table/obrigacoes-table-wrapper.tsx`
- [ ] 4.2.2 Implementar padrao DataShell completo
- [ ] 4.2.3 Implementar paginacao server-side
- [ ] 4.2.4 Implementar filtros com debounce
- [ ] 4.2.5 Implementar chips de filtros ativos
- [ ] 4.2.6 Implementar selecao de linhas para acoes em lote
- [ ] 4.2.7 Criar `components/table/columns.tsx` com colunas

### 4.3 Criar Visualizacoes de Calendario
- [ ] 4.3.1 Criar `components/calendar/obrigacoes-calendar-month.tsx`
- [ ] 4.3.2 Criar `components/calendar/obrigacoes-calendar-year.tsx`
- [ ] 4.3.3 Implementar indicadores visuais (vencidas, hoje, proximas)
- [ ] 4.3.4 Implementar click em dia para ver detalhes
- [ ] 4.3.5 Implementar filtros de status

### 4.4 Criar Dialogs
- [ ] 4.4.1 Criar `components/dialogs/nova-obrigacao-dialog.tsx`
- [ ] 4.4.2 Criar `components/dialogs/obrigacao-detalhes-dialog.tsx`
- [ ] 4.4.3 Criar `components/dialogs/upload-declaracao-dialog.tsx`
- [ ] 4.4.4 Criar `components/dialogs/upload-comprovante-dialog.tsx`
- [ ] 4.4.5 Implementar validacoes e feedback

### 4.5 Criar Componentes Compartilhados
- [ ] 4.5.1 Criar `components/shared/resumo-cards.tsx`
- [ ] 4.5.2 Criar `components/shared/alertas-obrigacoes.tsx`
- [ ] 4.5.3 Criar `components/table/obrigacoes-bulk-actions.tsx`
- [ ] 4.5.4 Criar `components/shared/index.ts` barrel export

## 5. Rotas e Navegacao (Fase 5)

### 5.1 Atualizar Rotas
- [ ] 5.1.1 Atualizar `app/(dashboard)/financeiro/obrigacoes/page.tsx`
- [ ] 5.1.2 Criar `app/(dashboard)/financeiro/obrigacoes/semana/page.tsx`
- [ ] 5.1.3 Criar `app/(dashboard)/financeiro/obrigacoes/mes/page.tsx`
- [ ] 5.1.4 Criar `app/(dashboard)/financeiro/obrigacoes/ano/page.tsx`
- [ ] 5.1.5 Criar `app/(dashboard)/financeiro/obrigacoes/lista/page.tsx`

### 5.2 Atualizar Navegacao
- [ ] 5.2.1 Atualizar `components/layout/app-sidebar.tsx` com submenu
- [ ] 5.2.2 Adicionar icones para cada visualizacao
- [ ] 5.2.3 Testar navegacao entre visualizacoes

## 6. Sincronizacao Automatica (Fase 6)

### 6.1 Implementar Triggers
- [ ] 6.1.1 Criar trigger em `actionCriarAcordoComParcelas` para sincronizar
- [ ] 6.1.2 Criar trigger em `actionMarcarParcelaRecebida` para sincronizar
- [ ] 6.1.3 Criar trigger em `actionAtualizarAcordo` para sincronizar
- [ ] 6.1.4 Criar trigger em `actionDeletarAcordo` para sincronizar

### 6.2 Implementar Actions de Sincronizacao
- [ ] 6.2.1 Implementar `actionSincronizarAcordo` em `features/financeiro/`
- [ ] 6.2.2 Implementar `actionSincronizarParcela` em `features/financeiro/`
- [ ] 6.2.3 Implementar `actionObterResumoObrigacoes` para dashboard
- [ ] 6.2.4 Implementar `actionObterAlertasFinanceiros` para alertas
- [ ] 6.2.5 Testar fluxo completo de sincronizacao

## 7. Documentacao (Fase 7)

### 7.1 Documentacao do Modulo
- [ ] 7.1.1 Criar `features/obrigacoes/RULES.md` com regras de negocio
- [ ] 7.1.2 Criar/Atualizar `features/obrigacoes/README.md`
- [ ] 7.1.3 Documentar tipos e interfaces em JSDoc

### 7.2 Documentacao do Projeto
- [ ] 7.2.1 Atualizar `openspec/AGENTS.md` com nova arquitetura
- [ ] 7.2.2 Criar diagramas de arquitetura
- [ ] 7.2.3 Documentar fluxo de sincronizacao

## 8. Testes e Validacao (Fase 8)

### 8.1 Testes Unitarios
- [ ] 8.1.1 Testar funcoes de validacao em `domain.ts`
- [ ] 8.1.2 Testar funcoes de calculo em `service.ts`
- [ ] 8.1.3 Testar actions de CRUD

### 8.2 Testes de Integracao
- [ ] 8.2.1 Testar fluxo de criacao de acordo com sincronizacao
- [ ] 8.2.2 Testar fluxo de pagamento de parcela com sincronizacao
- [ ] 8.2.3 Testar fluxo de repasse completo

### 8.3 Testes de UI
- [ ] 8.3.1 Testar ObrigacoesContent em todas visualizacoes
- [ ] 8.3.2 Testar ObrigacoesTableWrapper com filtros
- [ ] 8.3.3 Testar dialogs e formularios

## 9. Finalizacao

### 9.1 Revisao Final
- [ ] 9.1.1 Verificar todos os imports atualizados
- [ ] 9.1.2 Executar build e corrigir erros
- [ ] 9.1.3 Executar lint e corrigir warnings
- [ ] 9.1.4 Testar fluxos principais manualmente

### 9.2 Deploy
- [ ] 9.2.1 Criar PR com todas as alteracoes
- [ ] 9.2.2 Revisar PR e aprovar
- [ ] 9.2.3 Merge para branch principal
- [ ] 9.2.4 Arquivar proposta OpenSpec
