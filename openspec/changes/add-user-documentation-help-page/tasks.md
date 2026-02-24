## 1. Infraestrutura da página de ajuda

- [x] 1.1 Criar `src/app/app/ajuda/layout.tsx` com sidebar de navegação de documentação à esquerda e área de conteúdo à direita
- [x] 1.2 Criar `src/app/app/ajuda/[[...slug]]/page.tsx` com catch-all route que resolve slugs via registry
- [x] 1.3 Criar `src/app/app/ajuda/page.tsx` (página inicial da ajuda) com visão geral, cards de acesso rápido e campo de busca
- [x] 1.4 Criar `src/app/app/ajuda/docs-registry.ts` com mapeamento de slugs para componentes, títulos e hierarquia de navegação
- [x] 1.5 Criar componente `DocsSidebar` com árvore de navegação expansível, item ativo destacado e campo de busca por filtro
- [x] 1.6 Garantir que `/app/ajuda/design-system/playground` continue funcionando (rota explícita tem prioridade sobre catch-all)

## 2. Componentes de documentação reutilizáveis

- [x] 2.1 Criar componente `DocSection` — wrapper de seção com título, âncora e separador
- [x] 2.2 Criar componente `DocFieldTable` — tabela de campos com colunas: Campo, Tipo, Obrigatório, Descrição
- [x] 2.3 Criar componente `DocActionList` — lista de ações com ícone, nome e descrição
- [x] 2.4 Criar componente `DocTip` — callout de dica usando Alert do shadcn/ui
- [x] 2.5 Criar componente `DocSteps` — passos numerados com título e descrição

## 3. Conteúdo — Navegação Principal

- [x] 3.1 Escrever documentação do Dashboard (visão geral, widgets, sub-dashboards, personalização)
- [x] 3.2 Escrever documentação de Clientes (campos, ações CRUD, busca/filtro, exportação)
- [x] 3.3 Escrever documentação de Partes Contrárias (campos, ações, relação com processos)
- [x] 3.4 Escrever documentação de Terceiros (campos, ações disponíveis)
- [x] 3.5 Escrever documentação de Representantes (campos incluindo OAB, ações)
- [x] 3.6 Escrever documentação de Contratos (campos, vincular clientes/processos, valores/parcelas, fluxo de criação)
- [x] 3.7 Escrever documentação de Processos (campos, timeline, captura PJE, filtros por tribunal/status)
- [x] 3.8 Escrever documentação de Audiências (campos, visualizações semana/mês/ano/lista, integração calendário)
- [x] 3.9 Escrever documentação de Expedientes (campos, prazos, visualizações, marcar como lido)
- [x] 3.10 Escrever documentação de Perícias (campos, tipos, visualizações)
- [x] 3.11 Escrever documentação de Obrigações (acordos, condenações, parcelas, pagamentos)

## 4. Conteúdo — Serviços

- [x] 4.1 Escrever documentação da Agenda (calendário, eventos, integração com audiências/expedientes)
- [x] 4.2 Escrever documentação de Tarefas (quadros kanban, criar tarefas, arrastar/soltar, atribuir responsáveis)
- [x] 4.3 Escrever documentação de Notas (criar/editar, organização, editor)
- [x] 4.4 Escrever documentação de Documentos (editor com IA, criar/editar, lixeira)
- [x] 4.5 Escrever documentação de Peças Jurídicas (modelos, placeholders, geração a partir de contrato)
- [x] 4.6 Escrever documentação de Pesquisa Jurídica (Diário Oficial / Comunica CNJ, Pangea)
- [x] 4.7 Escrever documentação do Chat (chat com IA, histórico de chamadas)
- [x] 4.8 Escrever documentação de Assistentes (lista de assistentes, como interagir)
- [x] 4.9 Escrever documentação de Assinatura Digital — Documentos (criar, configurar signatários, enviar, acompanhar, revisar)
- [x] 4.10 Escrever documentação de Assinatura Digital — Templates (criar template, upload PDF, campos)
- [x] 4.11 Escrever documentação de Assinatura Digital — Formulários (criar, configurar campos, vincular templates, link público)

## 5. Conteúdo — Gestão (Admin)

- [x] 5.1 Escrever documentação do Dashboard Financeiro (métricas, gráficos)
- [x] 5.2 Escrever documentação de Orçamentos (criar, analisar, comparar períodos)
- [x] 5.3 Escrever documentação de Contas a Pagar (registrar despesas, categorizar, marcar como paga)
- [x] 5.4 Escrever documentação de Contas a Receber (registrar receitas, vincular contratos, inadimplência)
- [x] 5.5 Escrever documentação do Plano de Contas (categorias contábeis, hierarquia)
- [x] 5.6 Escrever documentação de Conciliação Bancária (importar extratos, conciliar, resolver divergências)
- [x] 5.7 Escrever documentação do DRE (selecionar período, comparar orçado, exportar)
- [x] 5.8 Escrever documentação de Equipe/Usuários (gerenciar membros, cargos, permissões)
- [x] 5.9 Escrever documentação de Salários (cadastrar salários, componentes, custo de pessoal)
- [x] 5.10 Escrever documentação de Folhas de Pagamento (gerar folha mensal, detalhes, relatório)
- [x] 5.11 Escrever documentação de Captura — Histórico (visualizar capturas realizadas)
- [x] 5.12 Escrever documentação de Captura — Agendamentos (programar capturas automáticas)
- [x] 5.13 Escrever documentação de Captura — Advogados, Credenciais e Tribunais

## 6. Conteúdo — Configurações e Perfil

- [x] 6.1 Escrever documentação de Perfil (dados pessoais, senha, avatar)
- [x] 6.2 Escrever documentação de Configurações (integrações, assistentes IA, aparência)
- [x] 6.3 Escrever documentação de Notificações (tipos, preferências)

## 7. Integração e Finalização

- [x] 7.1 Registrar todas as páginas de conteúdo no `docs-registry.ts` com slugs, títulos e keywords de busca
- [x] 7.2 Testar navegação completa pela sidebar (expandir/colapsar seções, links corretos)
- [x] 7.3 Testar busca por termos em diferentes módulos
- [x] 7.4 Testar responsividade (sidebar colapsável em mobile)
- [x] 7.5 Testar que `/app/ajuda/design-system/playground` continua acessível
- [x] 7.6 Verificar que slugs inválidos mostram mensagem "Página não encontrada"
