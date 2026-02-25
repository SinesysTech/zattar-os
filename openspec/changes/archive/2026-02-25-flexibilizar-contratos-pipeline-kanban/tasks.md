## 1. Database: Novas tabelas e migrations

- [x] 1.1 Criar migration com tabelas `contrato_tipos` e `contrato_tipos_cobranca` (schema, índices, RLS, policies)
- [x] 1.2 Criar migration com tabelas `contrato_pipelines` e `contrato_pipeline_estagios` (schema, índices, RLS, policies, segmento_id UNIQUE)
- [x] 1.3 Criar migration para adicionar colunas em `contratos`: `tipo_contrato_id` (FK nullable), `tipo_cobranca_id` (FK nullable), `estagio_id` (FK nullable) com índices
- [x] 1.4 Criar migration para adicionar colunas em `assinatura_digital_formularios`: `tipo_formulario` (text, check in 'contrato','documento','cadastro'), `contrato_config` (JSONB nullable)
- [x] 1.5 Criar migration seed: popular `contrato_tipos` com valores do enum `tipo_contrato` (7 registros) e `contrato_tipos_cobranca` com valores do enum `tipo_cobranca` (2 registros)
- [x] 1.6 Criar migration seed: criar pipeline default por segmento ativo com 4 estágios (Em Contratação, Contratado, Distribuído, Desistência)
- [x] 1.7 Criar migration backfill: popular `tipo_contrato_id`, `tipo_cobranca_id` e `estagio_id` nos contratos existentes baseado nos valores enum/status atuais

## 2. Backend: API de tipos configuráveis

- [x] 2.1 Criar types/schemas Zod para `contrato_tipos` e `contrato_tipos_cobranca`
- [x] 2.2 Criar repository layer para CRUD de `contrato_tipos` (Supabase service client)
- [x] 2.3 Criar repository layer para CRUD de `contrato_tipos_cobranca`
- [x] 2.4 Criar API routes: GET/POST `/api/contratos/tipos` e GET/PUT/DELETE `/api/contratos/tipos/[id]`
- [x] 2.5 Criar API routes: GET/POST `/api/contratos/tipos-cobranca` e GET/PUT/DELETE `/api/contratos/tipos-cobranca/[id]`
- [x] 2.6 Adicionar proteção contra deleção de tipo em uso (check contratos referenciando)

## 3. Backend: API de pipelines e estágios

- [x] 3.1 Criar types/schemas Zod para `contrato_pipelines` e `contrato_pipeline_estagios`
- [x] 3.2 Criar repository layer para CRUD de pipelines (com include de estágios)
- [x] 3.3 Criar repository layer para CRUD de estágios (com validação de is_default único)
- [x] 3.4 Criar API routes: GET/POST `/api/contratos/pipelines` e GET/PUT/DELETE `/api/contratos/pipelines/[id]`
- [x] 3.5 Criar API routes para estágios: POST `/api/contratos/pipelines/[id]/estagios`, PUT/DELETE `/api/contratos/pipelines/[id]/estagios/[estagioId]`
- [x] 3.6 Criar endpoint de reordenação: PUT `/api/contratos/pipelines/[id]/estagios/reorder` (recebe array de IDs)
- [x] 3.7 Adicionar proteção contra deleção de pipeline/estágio com contratos vinculados

## 4. Backend: Modificação do salvar-acao

- [x] 4.1 Adicionar query de `assinatura_digital_formularios` por `formulario_id` na rota salvar-acao para obter `contrato_config`
- [x] 4.2 Implementar lógica: se `contrato_config` presente, usar `tipo_contrato_id`, `tipo_cobranca_id`, `papel_cliente` e lookup estágio default do `pipeline_id`
- [x] 4.3 Implementar fallback: se `contrato_config` ausente, manter comportamento atual com valores hard-coded (backward compat)
- [x] 4.4 Criar endpoint PATCH `/api/contratos/[id]/estagio` para movimentação de estágio (Kanban drag-and-drop) com validação de pipeline

## 5. Backend: Configuração de contrato no formulário

- [x] 5.1 Criar schema Zod para validação de `contrato_config` (tipo_contrato_id, tipo_cobranca_id, papel_cliente, pipeline_id)
- [x] 5.2 Atualizar CRUD de formulários para aceitar e persistir `tipo_formulario` e `contrato_config`
- [x] 5.3 Adicionar validação: `contrato_config` só aceito quando `tipo_formulario = 'contrato'`; pipeline_id deve pertencer ao segmento do formulário
- [x] 5.4 Implementar função `generateContratoFormScaffold()` que retorna DynamicFormSchema base com 3 seções
- [x] 5.5 Integrar scaffold na criação de formulário: se `tipo_formulario = 'contrato'` e `form_schema` vazio, chamar scaffold

## 6. Frontend: UI admin de tipos configuráveis

- [x] 6.1 Criar página admin de tipos de contrato com DataTable (CRUD: listar, criar, editar, desativar)
- [x] 6.2 Criar página admin de tipos de cobrança com DataTable (CRUD: listar, criar, editar, desativar)
- [x] 6.3 Criar hooks `useContratoTipos` e `useContratoTiposCobranca` para fetch/mutate
- [x] 6.4 Adicionar navegação para as novas páginas admin no menu/sidebar

## 7. Frontend: UI admin de pipelines

- [x] 7.1 Criar página admin de pipelines com lista (pipeline por segmento, nome, contagem de estágios)
- [x] 7.2 Criar dialog/sheet de edição de pipeline com lista de estágios
- [x] 7.3 Implementar drag-and-drop de reordenação de estágios (dentro do editor de pipeline)
- [x] 7.4 Implementar color picker para cor do estágio
- [x] 7.5 Implementar lógica de estágio default (toggle, validação de pelo menos 1)

## 8. Frontend: Dialog de formulário expandido

- [x] 8.1 Adicionar select de `tipo_formulario` (contrato/documento/cadastro) no dialog de criação/edição de formulário
- [x] 8.2 Adicionar campos condicionais de configuração de contrato (tipo_contrato_id, tipo_cobranca_id, papel_cliente, pipeline_id) visíveis quando tipo = 'contrato'
- [x] 8.3 Popular selects com dados das APIs (contrato_tipos, contrato_tipos_cobranca, pipelines filtrados por segmento)
- [x] 8.4 Implementar limpeza de contrato_config ao mudar tipo_formulario para não-contrato

## 9. Frontend: Página Kanban de contratos

- [x] 9.1 ~Instalar dependência `@hello-pangea/dnd`~ Usa @dnd-kit existente via componente Kanban
- [x] 9.2 Criar página em `/app/contratos/kanban/page.tsx` com layout de board Kanban
- [x] 9.3 Implementar componente KanbanBoard: colunas = estágios do pipeline, cards = contratos
- [x] 9.4 Implementar componente KanbanCard: nome do cliente, tipo, cobrança, data, cor do estágio na borda
- [x] 9.5 Implementar drag-and-drop entre colunas usando @dnd-kit com atualização otimista
- [x] 9.6 Implementar filtro por segmento no topo da página (select que determina pipeline visível)
- [x] 9.7 Implementar click no card para abrir detalhes do contrato (sheet)
- [x] 9.8 Criar hook `useKanbanContratos` para fetch de contratos agrupados por estágio + mutação de estágio
- [x] 9.9 Adicionar botão com ícone Eye na DataTableToolbar da página de formulários (ao lado do Export, alinhado à direita) para navegar ao Kanban

## 10. Frontend: Atualizar listagem de contratos

- [x] 10.1 Atualizar colunas da tabela de contratos para exibir tipo_contrato e tipo_cobranca a partir das tabelas configuráveis (nome em vez de slug)
- [x] 10.2 Substituir coluna/filtro de status por estágio do pipeline (com badge colorida)
- [x] 10.3 Atualizar selects de filtros para popular a partir das APIs de tipos e estágios
- [x] 10.4 Atualizar formulário de criação/edição de contrato para usar selects das novas tabelas
