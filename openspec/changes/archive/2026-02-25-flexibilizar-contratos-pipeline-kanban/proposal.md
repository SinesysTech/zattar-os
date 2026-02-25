## Why

A rota de criação de contratos (`salvar-acao`) tem valores hard-coded (`tipo_contrato: 'ajuizamento'`, `tipo_cobranca: 'pro_exito'`, `papel_cliente_no_contrato: 'autora'`, `status: 'em_contratacao'`) que impedem o uso do módulo de Assinatura Digital para outros cenários contratuais. Além disso, o pipeline de status de contratos é fixo e não há visão Kanban para gestão visual dos contratos — funcionalidades essenciais para um CRM jurídico.

## What Changes

- Novo sistema de **pipelines configuráveis por segmento** com estágios personalizáveis (nome, ordem, cor), substituindo o status fixo de contratos
- Novas tabelas de **tipos de contrato** e **tipos de cobrança** configuráveis pelo admin, substituindo enums hard-coded
- Novo campo `tipo_formulario` em `assinatura_digital_formularios` para distinguir formulários de contrato, documento e cadastro
- Novos campos de configuração de contrato no formulário: `tipo_contrato_id`, `tipo_cobranca_id`, `papel_cliente`, `pipeline_id`
- **Auto-scaffold** do schema do formulário quando `tipo_formulario = 'contrato'` — gera automaticamente seções de Dados do Cliente, Parte Contrária e Dados do Contrato como ponto de partida editável
- **BREAKING**: Rota `salvar-acao` passa a ler `tipo_contrato`, `tipo_cobranca`, `papel_cliente` e `pipeline_id` da configuração do formulário em vez de valores hard-coded
- Nova **página Kanban** de contratos com drag-and-drop entre estágios do pipeline, acessível via botão na toolbar da tabela de formulários
- UI de admin para CRUD de pipelines, tipos de contrato e tipos de cobrança

## Capabilities

### New Capabilities

- `contrato-pipelines`: Pipelines configuráveis por segmento com estágios personalizáveis (CRUD + drag-and-drop reordenação). Inclui tabelas `contrato_pipelines` e `contrato_pipeline_estagios`
- `contrato-tipos-config`: Tipos de contrato e tipos de cobrança configuráveis pelo admin (CRUD). Inclui tabelas `contrato_tipos` e `contrato_tipos_cobranca`
- `contrato-kanban`: Página Kanban de contratos com visualização por pipeline/estágio, drag-and-drop para mover contratos entre estágios, filtros por segmento
- `formulario-tipo-contrato`: Campo `tipo_formulario` no formulário, configuração de metadados de contrato (tipo, cobrança, papel_cliente, pipeline), e auto-scaffold do schema

### Modified Capabilities

- `assinatura-digital-admin`: Formulários passam a ter `tipo_formulario` e campos de configuração de contrato. Dialog de criação precisa de novos campos
- `assinatura-digital-assinatura`: Rota `salvar-acao` deixa de usar valores hard-coded e passa a ler configuração do formulário para criar contratos
- `contratos`: Tabela `contratos` passa a referenciar `contrato_pipeline_estagios` em vez de usar coluna `status` com enum fixo. Tipos de contrato e cobrança passam a ser FK para novas tabelas

## Impact

**Banco de dados:**

- Novas tabelas: `contrato_pipelines`, `contrato_pipeline_estagios`, `contrato_tipos`, `contrato_tipos_cobranca`
- Alteração em `contratos`: nova coluna `estagio_id` (FK para `contrato_pipeline_estagios`), `tipo_contrato_id` e `tipo_cobranca_id` como FK
- Alteração em `assinatura_digital_formularios`: novos campos `tipo_formulario`, `contrato_config` (JSONB)
- Migration de dados: mapear status existentes para estágios do pipeline default

**API:**

- Novas rotas CRUD para pipelines, tipos de contrato, tipos de cobrança
- Rota `salvar-acao` modificada para ler config do formulário
- Nova rota para mover contrato entre estágios (Kanban drag-and-drop)

**Frontend:**

- Nova página Kanban em `/app/assinatura-digital/contratos/kanban`
- Botão de acesso ao Kanban na toolbar da tabela de formulários (ícone Eye, ao lado do Export)
- Dialog de criação de formulário expandido com campos de configuração de contrato
- UI de admin para pipelines e tipos configuráveis
- Schema builder: auto-scaffold quando `tipo_formulario = 'contrato'`

**Dependências:**

- `@hello-pangea/dnd` ou similar para drag-and-drop no Kanban
