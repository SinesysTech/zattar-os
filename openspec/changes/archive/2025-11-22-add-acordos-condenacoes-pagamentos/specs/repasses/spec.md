# repasses Specification Delta

## ADDED Requirements

### Requirement: Fluxo de Repasse ao Cliente
O sistema MUST gerenciar o fluxo completo de repasse de valores aos clientes.

#### Scenario: Repasse Pendente após Recebimento
- **WHEN** parcela com forma_distribuicao = 'integral' é marcada como recebida
- **THEN** o sistema deve calcular valor_repasse_cliente automaticamente
- **AND** definir status_repasse = 'pendente_declaracao'
- **AND** tornar parcela visível na lista de repasses pendentes
- **AND** bloquear finalização até declaração anexada

#### Scenario: Anexar Declaração de Prestação de Contas
- **WHEN** usuário anexa declaração de prestação de contas
- **THEN** o sistema deve validar formato do arquivo (PDF, JPG, PNG)
- **AND** fazer upload via serviço de storage configurado
- **AND** salvar path do arquivo em arquivo_declaracao_prestacao_contas
- **AND** registrar data_declaracao_anexada
- **AND** atualizar status_repasse = 'pendente_transferencia'
- **AND** liberar parcela para transferência

#### Scenario: Realizar Repasse ao Cliente
- **WHEN** usuário realiza repasse e anexa comprovante
- **THEN** o sistema deve validar que declaração foi anexada
- **AND** exigir upload de comprovante de transferência (obrigatório)
- **AND** fazer upload do comprovante via storage
- **AND** salvar path em arquivo_comprovante_repasse
- **AND** registrar data_repasse = now()
- **AND** registrar usuario_repasse_id (quem fez o repasse)
- **AND** atualizar status_repasse = 'repassado'
- **AND** remover parcela da lista de pendentes

### Requirement: Lista de Repasses Pendentes
O sistema MUST fornecer view dedicada para repasses que precisam ser processados.

#### Scenario: Visualizar Repasses Pendentes
- **WHEN** usuário acessa tela de repasses pendentes
- **THEN** o sistema deve listar parcelas com status_repasse IN ('pendente_declaracao', 'pendente_transferencia')
- **AND** agrupar por status (declaração pendente / transferência pendente)
- **AND** ordenar por data_efetivacao (mais antigas primeiro)
- **AND** exibir: processo, acordo, parcela, valor_repasse, status_repasse
- **AND** permitir filtrar por processo, período, valor

#### Scenario: Filtros de Repasses
- **WHEN** usuário filtra repasses
- **THEN** o sistema deve permitir filtrar por:
  - status_repasse específico
  - período de recebimento (data_efetivacao)
  - valor mínimo/máximo de repasse
  - processo relacionado
- **AND** atualizar lista dinamicamente

### Requirement: Validações de Repasse
O sistema MUST garantir integridade do processo de repasse.

#### Scenario: Validar Declaração Obrigatória
- **WHEN** usuário tenta realizar repasse
- **AND** arquivo_declaracao_prestacao_contas é NULL
- **THEN** o sistema deve bloquear operação
- **AND** retornar erro: "Declaração de prestação de contas é obrigatória"
- **AND** manter status_repasse = 'pendente_declaracao'

#### Scenario: Validar Comprovante Obrigatório
- **WHEN** usuário tenta marcar repasse como concluído
- **AND** não anexa comprovante de transferência
- **THEN** o sistema deve bloquear operação
- **AND** retornar erro: "Comprovante de transferência é obrigatório"
- **AND** não atualizar status_repasse

#### Scenario: Validar Formato de Arquivos
- **WHEN** usuário faz upload de arquivo
- **THEN** o sistema deve validar extensão (PDF, JPG, JPEG, PNG)
- **AND** validar tamanho máximo (5MB)
- **AND** retornar erro específico se inválido
- **AND** não salvar arquivo inválido

### Requirement: Integração com Storage
O sistema MUST usar serviço de storage abstrato para arquivos.

#### Scenario: Upload via Storage Service
- **WHEN** arquivo é enviado
- **THEN** o sistema deve usar IStorageService configurado
- **AND** gerar path único: `repasses/{acordo_id}/{parcela_id}/{tipo}_{timestamp}.{ext}`
- **AND** fazer upload via provider configurado (Minio/S3/AWS)
- **AND** retornar URL ou path do arquivo
- **AND** salvar path no banco de dados

#### Scenario: Download de Arquivo
- **WHEN** usuário solicita download de declaração ou comprovante
- **THEN** o sistema deve usar IStorageService.getUrl()
- **AND** retornar URL assinada/temporária (se provider suportar)
- **AND** permitir visualização no navegador (se PDF)

#### Scenario: Deletar Arquivo
- **WHEN** usuário remove declaração ou comprovante
- **THEN** o sistema deve deletar do storage via IStorageService.delete()
- **AND** remover path do banco de dados
- **AND** ajustar status_repasse conforme necessário

### Requirement: Permissões de Repasse
O sistema MUST controlar quem pode realizar repasses.

#### Scenario: Usuário Autorizado
- **WHEN** usuário com permissão acessa repasses
- **THEN** o sistema deve permitir visualizar lista
- **AND** permitir anexar declarações
- **AND** permitir realizar repasses
- **AND** registrar usuario_repasse_id

#### Scenario: Auditoria de Repasses
- **WHEN** repasse é realizado
- **THEN** o sistema deve registrar:
  - usuario_repasse_id (quem fez)
  - data_repasse (quando)
  - arquivo_comprovante_repasse (evidência)
- **AND** não permitir editar após conclusão
- **AND** manter histórico imutável

### Requirement: Estados do Repasse
O sistema MUST gerenciar estados distintos do fluxo de repasse.

#### Scenario: Não Aplicável
- **WHEN** forma_distribuicao do acordo = 'dividido'
- **THEN** status_repasse deve ser 'nao_aplicavel'
- **AND** não exibir na lista de repasses pendentes
- **AND** não exigir declaração ou comprovante

#### Scenario: Pendente Declaração
- **WHEN** parcela é marcada como recebida
- **AND** forma_distribuicao = 'integral'
- **THEN** status_repasse = 'pendente_declaracao'
- **AND** exibir na lista com tag "Aguardando Declaração"
- **AND** permitir apenas upload de declaração

#### Scenario: Pendente Transferência
- **WHEN** declaração foi anexada
- **THEN** status_repasse = 'pendente_transferencia'
- **AND** exibir na lista com tag "Pronto para Transferir"
- **AND** permitir realizar repasse com comprovante

#### Scenario: Repassado
- **WHEN** repasse foi concluído
- **THEN** status_repasse = 'repassado'
- **AND** remover da lista de pendentes
- **AND** exibir em histórico de repasses concluídos
- **AND** não permitir edições

### Requirement: Notificações de Repasse (Preparação Futura)
O sistema MUST preparar estrutura para notificações de repasses.

#### Scenario: Campos para Notificação
- **WHEN** status_repasse muda
- **THEN** o sistema deve ter campos prontos para:
  - data de mudança de status
  - histórico de estados
  - possibilidade de enviar notificação
- **AND** permitir integração futura com sistema de notificações

### Requirement: Relatórios de Repasses
O sistema MUST permitir consultar histórico de repasses.

#### Scenario: Histórico de Repasses Realizados
- **WHEN** usuário consulta repasses realizados
- **THEN** o sistema deve listar parcelas com status_repasse = 'repassado'
- **AND** exibir: processo, acordo, parcela, valor, data_repasse, usuario_repasse
- **AND** permitir filtrar por período, usuário, processo
- **AND** calcular total repassado no período

#### Scenario: Repasses por Usuário
- **WHEN** usuário consulta repasses por responsável
- **THEN** o sistema deve agrupar por usuario_repasse_id
- **AND** exibir total repassado por usuário
- **AND** exibir quantidade de repasses
- **AND** permitir drill-down para detalhes
