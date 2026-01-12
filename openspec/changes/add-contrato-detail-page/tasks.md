# Tasks: Página de Detalhes do Contrato

## 1. Infraestrutura (Backend)

- [ ] 1.1 Adicionar `contratoId` ao `ListarLancamentosParams` em `src/features/financeiro/domain/lancamentos.ts`
- [ ] 1.2 Adicionar filtro por `contratoId` no repository `src/features/financeiro/repository/lancamentos.ts`
- [ ] 1.3 Criar action `actionBuscarContratoCompleto` em `src/features/contratos/actions/`

## 2. Componentes da Coluna Esquerda (Tab Resumo)

- [ ] 2.1 Criar `ContratoResumoCard` - Card com dados do cliente, estatísticas (partes, processos, documentos)
- [ ] 2.2 Criar `ContratoProgressCard` - Barra de progresso baseada no status do workflow
- [ ] 2.3 Criar `ContratoTagsCard` - Badges para tipo, cobrança, segmento, papel

## 3. Componentes da Coluna Direita (Tab Resumo)

- [ ] 3.1 Criar `ContratoPartesCard` - Lista de partes do contrato com avatares
- [ ] 3.2 Criar `ParteViewSheet` - Sheet lateral para visualizar detalhes da parte
- [ ] 3.3 Criar `ContratoProcessosCard` - Lista de processos vinculados

## 4. Tabs de Conteúdo

- [ ] 4.1 Criar `ContratoFinanceiroCard` - Tabela de lançamentos financeiros
- [ ] 4.2 Criar `ContratoDocumentosCard` - Wrapper para `ContratoDocumentosList` existente
- [ ] 4.3 Criar `ContratoTimeline` - Timeline de mudanças de status

## 5. Página Principal

- [ ] 5.1 Criar `ContratoDetalhesHeader` - Header com título, status badge e botões de ação
- [ ] 5.2 Refatorar `page.tsx` com estrutura de Tabs e carregamento de dados
- [ ] 5.3 Criar `loading.tsx` - Skeleton loading com Suspense
- [ ] 5.4 Criar `error.tsx` - Error Boundary para erros de carregamento
- [ ] 5.5 Criar `not-found.tsx` - Página 404 para contrato inexistente

## 6. Limpeza e Finalização

- [ ] 6.1 Criar barrel export em `components/index.ts`
- [ ] 6.2 Remover componentes template antigos (about-me, card-skills, connections, etc.)
- [ ] 6.3 Testar navegação desde a listagem de contratos
- [ ] 6.4 Testar cada tab individualmente
- [ ] 6.5 Testar responsividade mobile
- [ ] 6.6 Executar build e verificar erros de tipo
