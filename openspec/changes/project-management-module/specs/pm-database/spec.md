## ADDED Requirements

### Requirement: Schema de tabelas do módulo de projetos
O sistema SHALL criar tabelas com prefixo `pm_` para o módulo de gestão de projetos, incluindo ENUMs, foreign keys, indexes e triggers necessários.

#### Scenario: Criação dos ENUMs
- **WHEN** a migração é executada
- **THEN** os seguintes ENUMs são criados:
  - `pm_status_projeto` com valores: `planejamento`, `ativo`, `pausado`, `concluido`, `cancelado`
  - `pm_status_tarefa` com valores: `a_fazer`, `em_progresso`, `em_revisao`, `concluido`, `cancelado`
  - `pm_prioridade` com valores: `baixa`, `media`, `alta`, `urgente`
  - `pm_papel_projeto` com valores: `gerente`, `membro`, `observador`

#### Scenario: Criação da tabela pm_projetos
- **WHEN** a migração é executada
- **THEN** a tabela `pm_projetos` é criada com colunas:
  - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
  - `nome` VARCHAR(255) NOT NULL
  - `descricao` TEXT
  - `cliente_id` INTEGER REFERENCES clientes(id) ON DELETE SET NULL
  - `processo_id` INTEGER REFERENCES acervo(id) ON DELETE SET NULL
  - `contrato_id` INTEGER REFERENCES contratos(id) ON DELETE SET NULL
  - `status` pm_status_projeto NOT NULL DEFAULT 'planejamento'
  - `prioridade` pm_prioridade NOT NULL DEFAULT 'media'
  - `data_inicio` DATE
  - `data_previsao_fim` DATE
  - `data_conclusao` DATE
  - `responsavel_id` INTEGER NOT NULL REFERENCES usuarios(id)
  - `orcamento` DECIMAL(12,2)
  - `valor_gasto` DECIMAL(12,2) DEFAULT 0
  - `progresso` INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100)
  - `progresso_manual` INTEGER CHECK (progresso_manual >= 0 AND progresso_manual <= 100)
  - `tags` TEXT[] DEFAULT '{}'
  - `criado_por` INTEGER NOT NULL REFERENCES usuarios(id)
  - `criado_em` TIMESTAMPTZ NOT NULL DEFAULT now()
  - `atualizado_em` TIMESTAMPTZ NOT NULL DEFAULT now()

#### Scenario: Criação da tabela pm_tarefas
- **WHEN** a migração é executada
- **THEN** a tabela `pm_tarefas` é criada com colunas:
  - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
  - `projeto_id` UUID NOT NULL REFERENCES pm_projetos(id) ON DELETE CASCADE
  - `titulo` VARCHAR(255) NOT NULL
  - `descricao` TEXT
  - `status` pm_status_tarefa NOT NULL DEFAULT 'a_fazer'
  - `prioridade` pm_prioridade NOT NULL DEFAULT 'media'
  - `responsavel_id` INTEGER REFERENCES usuarios(id) ON DELETE SET NULL
  - `data_prazo` DATE
  - `data_conclusao` DATE
  - `ordem_kanban` INTEGER NOT NULL DEFAULT 0
  - `estimativa_horas` DECIMAL(6,2)
  - `horas_registradas` DECIMAL(6,2) DEFAULT 0
  - `tarefa_pai_id` UUID REFERENCES pm_tarefas(id) ON DELETE CASCADE
  - `criado_por` INTEGER NOT NULL REFERENCES usuarios(id)
  - `criado_em` TIMESTAMPTZ NOT NULL DEFAULT now()
  - `atualizado_em` TIMESTAMPTZ NOT NULL DEFAULT now()

#### Scenario: Criação da tabela pm_membros_projeto
- **WHEN** a migração é executada
- **THEN** a tabela `pm_membros_projeto` é criada com colunas:
  - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
  - `projeto_id` UUID NOT NULL REFERENCES pm_projetos(id) ON DELETE CASCADE
  - `usuario_id` INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
  - `papel` pm_papel_projeto NOT NULL DEFAULT 'membro'
  - `adicionado_em` TIMESTAMPTZ NOT NULL DEFAULT now()
- **AND** uma constraint UNIQUE em `(projeto_id, usuario_id)` é criada

#### Scenario: Criação da tabela pm_lembretes
- **WHEN** a migração é executada
- **THEN** a tabela `pm_lembretes` é criada com colunas:
  - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
  - `projeto_id` UUID REFERENCES pm_projetos(id) ON DELETE CASCADE
  - `tarefa_id` UUID REFERENCES pm_tarefas(id) ON DELETE CASCADE
  - `usuario_id` INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
  - `texto` TEXT NOT NULL
  - `data_hora` TIMESTAMPTZ NOT NULL
  - `prioridade` pm_prioridade NOT NULL DEFAULT 'media'
  - `concluido` BOOLEAN NOT NULL DEFAULT false
  - `criado_em` TIMESTAMPTZ NOT NULL DEFAULT now()

#### Scenario: Criação da tabela pm_comentarios
- **WHEN** a migração é executada
- **THEN** a tabela `pm_comentarios` é criada com colunas:
  - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
  - `projeto_id` UUID REFERENCES pm_projetos(id) ON DELETE CASCADE
  - `tarefa_id` UUID REFERENCES pm_tarefas(id) ON DELETE CASCADE
  - `usuario_id` INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
  - `conteudo` TEXT NOT NULL
  - `criado_em` TIMESTAMPTZ NOT NULL DEFAULT now()
  - `atualizado_em` TIMESTAMPTZ NOT NULL DEFAULT now()
- **AND** pelo menos um de `projeto_id` ou `tarefa_id` MUST ser NOT NULL (CHECK constraint)

#### Scenario: Criação da tabela pm_anexos
- **WHEN** a migração é executada
- **THEN** a tabela `pm_anexos` é criada com colunas:
  - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
  - `projeto_id` UUID REFERENCES pm_projetos(id) ON DELETE CASCADE
  - `tarefa_id` UUID REFERENCES pm_tarefas(id) ON DELETE CASCADE
  - `usuario_id` INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
  - `nome_arquivo` VARCHAR(255) NOT NULL
  - `url` TEXT NOT NULL
  - `tamanho_bytes` BIGINT
  - `tipo_mime` VARCHAR(100)
  - `criado_em` TIMESTAMPTZ NOT NULL DEFAULT now()

### Requirement: Indexes para performance
O sistema SHALL criar indexes otimizados para as queries mais frequentes do módulo.

#### Scenario: Indexes criados na migração
- **WHEN** a migração é executada
- **THEN** os seguintes indexes são criados:
  - `pm_projetos`: index em `status`, `responsavel_id`, `cliente_id`, `criado_em`
  - `pm_tarefas`: index em `projeto_id`, `status`, `responsavel_id`, `data_prazo`, `(projeto_id, status, ordem_kanban)`
  - `pm_membros_projeto`: index em `usuario_id`, `projeto_id`
  - `pm_lembretes`: index em `usuario_id`, `data_hora`, `concluido`

### Requirement: RLS Policies
O sistema SHALL aplicar Row Level Security em todas as tabelas `pm_*` para garantir que usuários só acessem dados de projetos dos quais são membros ou que criaram.

#### Scenario: RLS em pm_projetos
- **WHEN** um usuário consulta `pm_projetos`
- **THEN** apenas projetos são retornados onde:
  - O usuário é o `responsavel_id` do projeto, OU
  - O usuário é membro do projeto em `pm_membros_projeto`, OU
  - O usuário é o `criado_por` do projeto, OU
  - O usuário é super admin

#### Scenario: RLS em pm_tarefas
- **WHEN** um usuário consulta `pm_tarefas`
- **THEN** apenas tarefas são retornadas cujo `projeto_id` corresponde a um projeto acessível pelo usuário (mesmas regras de pm_projetos)

#### Scenario: RLS em demais tabelas pm_*
- **WHEN** um usuário consulta `pm_membros_projeto`, `pm_lembretes`, `pm_comentarios` ou `pm_anexos`
- **THEN** apenas registros são retornados cujo `projeto_id` ou `tarefa_id` pertence a um projeto acessível pelo usuário

### Requirement: Trigger de atualizado_em
O sistema SHALL atualizar automaticamente o campo `atualizado_em` nas tabelas que possuem esse campo.

#### Scenario: Atualização automática de timestamp
- **WHEN** um registro de `pm_projetos`, `pm_tarefas` ou `pm_comentarios` é atualizado
- **THEN** o campo `atualizado_em` é automaticamente definido para `now()`
