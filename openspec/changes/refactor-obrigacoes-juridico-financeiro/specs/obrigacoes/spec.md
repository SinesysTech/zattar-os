# Capability: Obrigacoes (Juridico)

Gerenciamento de Acordos, Condenacoes e suas Parcelas vinculados a processos judiciais.

## ADDED Requirements

### Requirement: Separacao de Responsabilidades Juridico-Financeiro

O modulo de Obrigacoes (`features/obrigacoes/`) SHALL ser responsavel exclusivamente pelo controle juridico de Acordos, Condenacoes e Parcelas, sem conter logica financeira.

#### Scenario: Modulo nao contem tipos financeiros
- **GIVEN** o modulo `features/obrigacoes/`
- **WHEN** analisado o arquivo `domain.ts`
- **THEN** NAO DEVE conter tipos como `ObrigacaoComDetalhes`, `LancamentoFinanceiro` ou `SplitPagamento`

#### Scenario: Repository nao faz joins com lancamentos
- **GIVEN** o modulo `features/obrigacoes/`
- **WHEN** analisado o arquivo `repository.ts`
- **THEN** NAO DEVE conter joins com a tabela `lancamentos_financeiros`

#### Scenario: Service nao contem logica de sincronizacao
- **GIVEN** o modulo `features/obrigacoes/`
- **WHEN** analisado o arquivo `service.ts`
- **THEN** NAO DEVE conter funcoes como `sincronizarAcordo` ou `sincronizarParcela`

### Requirement: Tipos Juridicos Puros

O arquivo `domain.ts` SHALL conter apenas tipos relacionados ao dominio juridico de Acordos e Condenacoes.

#### Scenario: Definicao de AcordoCondenacao
- **GIVEN** o tipo `AcordoCondenacao` em `domain.ts`
- **WHEN** analisada sua estrutura
- **THEN** DEVE conter campos: `id`, `processo_id`, `tipo`, `direcao`, `valor_total`, `valor_honorarios`, `valor_liquido_cliente`, `descricao`, `data_acordo`, `created_at`, `updated_at`

#### Scenario: Definicao de Parcela
- **GIVEN** o tipo `Parcela` em `domain.ts`
- **WHEN** analisada sua estrutura
- **THEN** DEVE conter campos: `id`, `acordo_id`, `numero`, `valor`, `data_vencimento`, `status`, `status_repasse`, `data_recebimento`, `data_repasse`, `comprovante_repasse_url`, `declaracao_url`

#### Scenario: Enums de Status
- **GIVEN** os tipos em `types.ts`
- **WHEN** analisados os enums
- **THEN** DEVE conter: `TipoObrigacao`, `DirecaoPagamento`, `StatusAcordo`, `StatusParcela`, `StatusRepasse`

### Requirement: CRUD de Acordos

O sistema SHALL fornecer operacoes completas de CRUD para Acordos e Condenacoes.

#### Scenario: Criar acordo com parcelas
- **GIVEN** dados de um novo acordo
- **WHEN** chamada a action `actionCriarAcordoComParcelas`
- **THEN** DEVE criar o acordo e suas parcelas no banco de dados
- **AND** DEVE retornar o acordo criado com suas parcelas

#### Scenario: Listar acordos com filtros
- **GIVEN** filtros de busca (tipo, direcao, status, processo_id, data_inicio, data_fim)
- **WHEN** chamada a action `actionListarAcordos`
- **THEN** DEVE retornar acordos que correspondem aos filtros
- **AND** DEVE incluir informacoes do processo vinculado

#### Scenario: Buscar acordo por ID
- **GIVEN** um ID de acordo existente
- **WHEN** chamada a action `actionBuscarAcordo`
- **THEN** DEVE retornar o acordo com todas suas parcelas
- **AND** DEVE incluir informacoes do processo vinculado

#### Scenario: Atualizar acordo
- **GIVEN** um ID de acordo e dados atualizados
- **WHEN** chamada a action `actionAtualizarAcordo`
- **THEN** DEVE atualizar o acordo no banco de dados
- **AND** DEVE retornar o acordo atualizado

#### Scenario: Deletar acordo
- **GIVEN** um ID de acordo existente
- **WHEN** chamada a action `actionDeletarAcordo`
- **THEN** DEVE remover o acordo e suas parcelas do banco de dados

### Requirement: Gestao de Parcelas

O sistema SHALL fornecer operacoes para gerenciamento individual de Parcelas.

#### Scenario: Marcar parcela como recebida
- **GIVEN** um ID de parcela e data de recebimento
- **WHEN** chamada a action `actionMarcarParcelaRecebida`
- **THEN** DEVE atualizar o status da parcela para 'recebida'
- **AND** DEVE registrar a data de recebimento

#### Scenario: Marcar parcela como paga
- **GIVEN** um ID de parcela e data de pagamento
- **WHEN** chamada a action `actionMarcarParcelaPaga`
- **THEN** DEVE atualizar o status da parcela para 'paga'
- **AND** DEVE registrar a data de pagamento

#### Scenario: Cancelar parcela
- **GIVEN** um ID de parcela
- **WHEN** chamada a action `actionCancelarParcela`
- **THEN** DEVE atualizar o status da parcela para 'cancelada'

### Requirement: Gestao de Repasses

O sistema SHALL fornecer operacoes para controle de repasses ao cliente.

#### Scenario: Anexar declaracao de prestacao de contas
- **GIVEN** um ID de parcela e arquivo de declaracao
- **WHEN** chamada a action `actionAnexarDeclaracao`
- **THEN** DEVE fazer upload do arquivo para storage
- **AND** DEVE atualizar o campo `declaracao_url` da parcela
- **AND** DEVE atualizar o status_repasse para 'pendente_transferencia'

#### Scenario: Registrar repasse ao cliente
- **GIVEN** um ID de parcela e comprovante de transferencia
- **WHEN** chamada a action `actionRegistrarRepasse`
- **THEN** DEVE fazer upload do comprovante para storage
- **AND** DEVE atualizar o campo `comprovante_repasse_url` da parcela
- **AND** DEVE registrar a data de repasse
- **AND** DEVE atualizar o status_repasse para 'repassado'

#### Scenario: Listar repasses pendentes
- **GIVEN** filtros opcionais (status_repasse, processo_id)
- **WHEN** chamada a action `actionListarRepassesPendentes`
- **THEN** DEVE retornar parcelas com status_repasse diferente de 'nao_aplicavel' e 'repassado'
- **AND** DEVE incluir informacoes do acordo e processo

### Requirement: Pagina de Obrigacoes com Multiplas Visualizacoes

O sistema SHALL fornecer uma pagina de Obrigacoes com layout similar a Expedientes.

#### Scenario: Visualizacao por semana
- **GIVEN** usuario na pagina de Obrigacoes
- **WHEN** selecionada visualizacao 'semana'
- **THEN** DEVE exibir carrossel navegavel de semanas
- **AND** DEVE exibir obrigacoes da semana selecionada
- **AND** DEVE permitir navegacao entre semanas

#### Scenario: Visualizacao por mes
- **GIVEN** usuario na pagina de Obrigacoes
- **WHEN** selecionada visualizacao 'mes'
- **THEN** DEVE exibir calendario mensal
- **AND** DEVE exibir indicadores visuais em dias com obrigacoes
- **AND** DEVE permitir navegacao entre meses

#### Scenario: Visualizacao por ano
- **GIVEN** usuario na pagina de Obrigacoes
- **WHEN** selecionada visualizacao 'ano'
- **THEN** DEVE exibir calendario anual
- **AND** DEVE exibir indicadores visuais em meses com obrigacoes
- **AND** DEVE permitir navegacao entre anos

#### Scenario: Visualizacao em lista
- **GIVEN** usuario na pagina de Obrigacoes
- **WHEN** selecionada visualizacao 'lista'
- **THEN** DEVE exibir tabela com paginacao server-side
- **AND** DEVE permitir filtros avancados
- **AND** DEVE permitir selecao de linhas para acoes em lote

### Requirement: Tabela de Obrigacoes com DataShell

A visualizacao em lista SHALL seguir o padrao DataShell do projeto.

#### Scenario: Colunas da tabela
- **GIVEN** visualizacao em lista de obrigacoes
- **WHEN** tabela e renderizada
- **THEN** DEVE exibir colunas: Checkbox, Processo, Tipo, Direcao, Valor Total, Parcelas, Proximo Vencimento, Status, Status Repasse, Acoes

#### Scenario: Filtros com debounce
- **GIVEN** campo de filtro na tabela
- **WHEN** usuario digita texto
- **THEN** DEVE aguardar debounce antes de aplicar filtro
- **AND** DEVE exibir chips de filtros ativos

#### Scenario: Paginacao server-side
- **GIVEN** lista com mais obrigacoes que o limite por pagina
- **WHEN** usuario navega entre paginas
- **THEN** DEVE carregar dados do servidor para cada pagina
- **AND** DEVE exibir indicador de carregamento

#### Scenario: Acoes em lote
- **GIVEN** linhas selecionadas na tabela
- **WHEN** exibido menu de acoes em lote
- **THEN** DEVE permitir acoes como: Exportar, Marcar como recebido, Cancelar

### Requirement: Componentes de Resumo e Alertas

O sistema SHALL fornecer componentes para visualizacao rapida de metricas e alertas.

#### Scenario: Cards de resumo
- **GIVEN** pagina de obrigacoes carregada
- **WHEN** exibidos cards de resumo
- **THEN** DEVE exibir: Total de obrigacoes, Valor total, Vencidas, Repasses pendentes

#### Scenario: Alertas de vencimento
- **GIVEN** obrigacoes com parcelas proximas do vencimento
- **WHEN** exibido componente de alertas
- **THEN** DEVE listar parcelas que vencem em ate 7 dias
- **AND** DEVE destacar parcelas vencidas

#### Scenario: Alertas de repasse
- **GIVEN** parcelas com repasse pendente
- **WHEN** exibido componente de alertas
- **THEN** DEVE listar parcelas com status_repasse 'pendente_declaracao' ou 'pendente_transferencia'

### Requirement: Sincronizacao Automatica com Financeiro

O sistema SHALL sincronizar automaticamente obrigacoes juridicas com o modulo financeiro.

#### Scenario: Sincronizacao ao criar acordo
- **GIVEN** novo acordo criado em `features/obrigacoes/`
- **WHEN** action `actionCriarAcordoComParcelas` e executada
- **THEN** DEVE chamar `actionSincronizarAcordo` em `features/financeiro/`
- **AND** DEVE criar lancamentos correspondentes para cada parcela

#### Scenario: Sincronizacao ao atualizar parcela
- **GIVEN** parcela atualizada em `features/obrigacoes/`
- **WHEN** status da parcela e alterado
- **THEN** DEVE chamar `actionSincronizarParcela` em `features/financeiro/`
- **AND** DEVE atualizar lancamento correspondente

#### Scenario: Tratamento de falha na sincronizacao
- **GIVEN** falha na sincronizacao com financeiro
- **WHEN** erro ocorre durante sincronizacao
- **THEN** DEVE logar o erro
- **AND** DEVE registrar alerta de inconsistencia
- **AND** NAO DEVE reverter operacao juridica

### Requirement: Rotas de Navegacao

O sistema SHALL fornecer rotas para cada visualizacao de obrigacoes.

#### Scenario: Rota principal
- **GIVEN** usuario acessa `/financeiro/obrigacoes`
- **WHEN** pagina e carregada
- **THEN** DEVE redirecionar para visualizacao padrao (semana)

#### Scenario: Rotas de visualizacao
- **GIVEN** usuario acessa `/financeiro/obrigacoes/{visualizacao}`
- **WHEN** visualizacao e 'semana', 'mes', 'ano' ou 'lista'
- **THEN** DEVE exibir a visualizacao correspondente
- **AND** DEVE manter estado de filtros na URL

#### Scenario: Menu lateral
- **GIVEN** menu lateral do dashboard
- **WHEN** usuario expande menu de Obrigacoes
- **THEN** DEVE exibir submenu com links para cada visualizacao

### Requirement: Documentacao de Regras de Negocio

O modulo SHALL conter documentacao clara das regras de negocio.

#### Scenario: Arquivo RULES.md
- **GIVEN** modulo `features/obrigacoes/`
- **WHEN** arquivo `RULES.md` e lido
- **THEN** DEVE conter definicoes de tipos de obrigacoes
- **AND** DEVE conter fluxo de repasses
- **AND** DEVE conter regras de validacao
- **AND** DEVE conter integracao com financeiro

#### Scenario: Arquivo README.md
- **GIVEN** modulo `features/obrigacoes/`
- **WHEN** arquivo `README.md` e lido
- **THEN** DEVE conter visao geral do modulo
- **AND** DEVE conter estrutura de arquivos
- **AND** DEVE conter exemplos de uso

## REMOVED Requirements

### Requirement: Bridge Financeira Redundante

Os arquivos de bridge entre juridico e financeiro em `features/financeiro/` SHALL ser removidos para eliminar redundancia.

#### Scenario: Remocao de domain/obrigacoes.ts
- **GIVEN** arquivo `features/financeiro/domain/obrigacoes.ts`
- **WHEN** refatoracao e concluida
- **THEN** arquivo DEVE ser removido
- **AND** tipos `ObrigacaoComDetalhes`, `ParcelaObrigacao`, `ObrigacaoJuridica` NAO DEVEM mais existir

#### Scenario: Remocao de types/obrigacoes.ts
- **GIVEN** arquivo `features/financeiro/types/obrigacoes.ts`
- **WHEN** refatoracao e concluida
- **THEN** arquivo DEVE ser removido
- **AND** imports DEVEM ser atualizados para usar `features/obrigacoes/`

**Reason**: Estes arquivos criam redundancia e confusao conceitual entre os dominios juridico e financeiro.

**Migration**:
1. Atualizar imports para usar `features/obrigacoes/domain` e `features/obrigacoes/types`
2. Usar `features/financeiro/services/obrigacoes.ts` apenas para sincronizacao
