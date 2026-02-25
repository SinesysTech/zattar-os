## ADDED Requirements

### Requirement: Admin de templates/formulários/segmentos (frontend)

O frontend SHALL oferecer páginas para listar, criar/editar e excluir templates, formulários e segmentos de assinatura consumindo as APIs `/api/assinatura-digital-admin/*`, com filtros e paginação.

#### Scenario: Listar entidades

- **WHEN** o usuário abre a lista de templates, formulários ou segmentos
- **THEN** o sistema exibe tabela com filtros por busca/status/segmento (quando aplicável), paginação e ações de editar/deletar

#### Scenario: Criar/editar entidade

- **WHEN** o usuário cria ou edita um template/formulário/segmento
- **THEN** o formulário valida campos obrigatórios e salva via API, exibindo feedback de sucesso/erro

### Requirement: Fluxo de assinatura (frontend)

O frontend SHALL permitir ao usuário iniciar uma assinatura, visualizar preview do PDF e finalizar (assinatura + foto) usando as APIs `/api/assinatura-digital-signature/*`.

#### Scenario: Gerar preview

- **WHEN** o usuário solicita preview de um template/formulário com cliente/ação selecionados
- **THEN** o sistema chama `/assinatura-digital-signature/preview` e exibe o PDF retornado

#### Scenario: Capturar assinatura e finalizar

- **WHEN** o usuário fornece assinatura (canvas) e, se necessário, foto/geo
- **THEN** o sistema envia para `/assinatura-digital-signature/finalizar`, mostra progresso e exibe protocolo/pdf_url em caso de sucesso

### Requirement: Design system consistente

O frontend SHALL usar componentes do shadcn já existentes no Sinesis, só recorrendo a componentes da Assinatura Digital quando não houver equivalente, mantendo tipografia/cores/spacing do Sinesis.

#### Scenario: Reutilização de componentes

- **WHEN** uma UI requer tabelas, formulários, modais ou toasts
- **THEN** o sistema utiliza os componentes shadcn ou wrappers já presentes no projeto, evitando duplicação da Assinatura Digital
