# parcelas Specification Delta

## ADDED Requirements

### Requirement: CRUD de Parcelas
O sistema MUST fornecer operações para gerenciar parcelas de acordos/condenações.

#### Scenario: Criar parcelas automaticamente
- **WHEN** um acordo/condenação é criado com N parcelas
- **THEN** o sistema deve criar N registros em `parcelas`
- **AND** numerar sequencialmente de 1 a N
- **AND** distribuir valores igualmente (credito_principal / N)
- **AND** distribuir honorarios_sucumbenciais igualmente (total / N)
- **AND** calcular data_vencimento espaçadas (30 dias entre cada)
- **AND** definir status inicial como 'pendente'

#### Scenario: Listar parcelas de um acordo
- **WHEN** um usuário lista parcelas de um acordo
- **THEN** o sistema deve retornar todas as parcelas do acordo
- **AND** ordenar por numero_parcela (crescente)
- **AND** incluir valores calculados (honorarios_contratuais, valor_repasse)
- **AND** incluir status de repasse (se aplicável)

#### Scenario: Buscar parcela por ID
- **WHEN** um usuário busca uma parcela específica
- **THEN** o sistema deve retornar dados completos da parcela
- **AND** incluir informações do acordo relacionado
- **AND** incluir arquivos anexados (declaração, comprovante)
- **AND** retornar erro 404 se não encontrado

#### Scenario: Atualizar parcela manualmente
- **WHEN** um usuário edita valor_bruto ou honorarios_sucumbenciais de uma parcela
- **THEN** o sistema deve marcar editado_manualmente = true
- **AND** recalcular honorarios_contratuais
- **AND** recalcular valor_repasse_cliente
- **AND** redistribuir saldo restante entre parcelas NÃO editadas
- **AND** atualizar updated_at

### Requirement: Edição Manual com Redistribuição
O sistema MUST redistribuir valores automaticamente quando uma parcela é editada.

#### Scenario: Editar crédito principal de uma parcela
- **WHEN** usuário altera valor_bruto_credito_principal da parcela X
- **THEN** o sistema deve marcar parcela X como editado_manualmente = true
- **AND** calcular saldo_restante = valor_total_acordo - valor_parcela_X
- **AND** buscar todas as parcelas onde editado_manualmente = false
- **AND** distribuir saldo_restante igualmente entre essas parcelas
- **AND** recalcular honorarios_contratuais de todas as parcelas
- **AND** recalcular valor_repasse_cliente de todas as parcelas

#### Scenario: Editar honorários sucumbenciais de uma parcela
- **WHEN** usuário altera honorarios_sucumbenciais da parcela X
- **THEN** o sistema deve marcar parcela X como editado_manualmente = true
- **AND** calcular saldo_sucumbenciais = total_sucumbenciais - valor_parcela_X
- **AND** buscar parcelas não editadas
- **AND** redistribuir saldo_sucumbenciais entre parcelas não editadas
- **AND** garantir que soma total = honorarios_sucumbenciais_total

#### Scenario: Resetar edições manuais
- **WHEN** usuário solicita redistribuição completa
- **THEN** o sistema deve marcar todas parcelas como editado_manualmente = false
- **AND** redistribuir valores igualmente entre todas as parcelas
- **AND** recalcular todos os campos derivados

### Requirement: Formas de Pagamento por Parcela
O sistema MUST permitir definir forma de pagamento individual por parcela.

#### Scenario: Transferência Direta
- **WHEN** forma_pagamento = 'transferencia_direta'
- **THEN** o sistema deve indicar que pagamento será via transferência bancária
- **AND** não exigir dados de depósito judicial/recursal
- **AND** permitir anexar comprovante de transferência

#### Scenario: Depósito Judicial
- **WHEN** forma_pagamento = 'deposito_judicial'
- **THEN** o sistema deve indicar que pagamento será via juízo
- **AND** permitir registrar dados do alvará/depósito
- **AND** indicar que requer levantamento

#### Scenario: Depósito Recursal
- **WHEN** forma_pagamento = 'deposito_recursal'
- **THEN** o sistema deve indicar que pagamento será de depósito recursal
- **AND** permitir registrar dados do depósito
- **AND** indicar que requer levantamento

#### Scenario: Pagamento Híbrido (múltiplas parcelas)
- **WHEN** um acordo tem múltiplas parcelas
- **THEN** o sistema deve permitir formas diferentes para cada parcela
- **AND** parcela 1 pode ser 'deposito_judicial'
- **AND** parcela 2 pode ser 'transferencia_direta'
- **AND** rastrear forma individualmente

### Requirement: Status de Parcelas
O sistema MUST gerenciar status de parcelas automaticamente.

#### Scenario: Parcela Pendente
- **WHEN** parcela é criada
- **THEN** status inicial deve ser 'pendente'
- **AND** data_efetivacao deve ser NULL

#### Scenario: Marcar como Recebida/Paga
- **WHEN** usuário marca parcela como recebida (ou paga)
- **THEN** o sistema deve atualizar status para 'recebida' (ou 'paga')
- **AND** registrar data_efetivacao = now()
- **AND** atualizar status do acordo principal
- **AND** se forma_distribuicao = 'integral', definir status_repasse = 'pendente_declaracao'

#### Scenario: Parcela Atrasada (trigger automático)
- **WHEN** data_vencimento < CURRENT_DATE
- **AND** status = 'pendente'
- **THEN** trigger deve atualizar status para 'atrasado'
- **AND** atualizar status do acordo principal

### Requirement: Valores Calculados
O sistema MUST calcular automaticamente campos derivados.

#### Scenario: Honorários Contratuais
- **WHEN** parcela é criada ou valor_bruto é alterado
- **THEN** o sistema deve calcular honorarios_contratuais = valor_bruto * percentual_escritorio
- **AND** usar percentual_escritorio do acordo principal
- **AND** recalcular quando percentual muda no acordo

#### Scenario: Valor de Repasse ao Cliente
- **WHEN** parcela é criada ou valor_bruto é alterado
- **AND** forma_distribuicao do acordo = 'integral'
- **THEN** o sistema deve calcular valor_repasse_cliente = valor_bruto * percentual_cliente
- **AND** não incluir honorarios_sucumbenciais no cálculo
- **AND** usar percentual_cliente do acordo principal

#### Scenario: Valores quando Dividido
- **WHEN** forma_distribuicao do acordo = 'dividido'
- **THEN** o sistema deve definir valor_repasse_cliente = NULL
- **AND** status_repasse = 'nao_aplicavel'
- **AND** não exigir controle de repasse

### Requirement: Validações de Parcelas
O sistema MUST validar integridade dos dados de parcelas.

#### Scenario: Validar soma de parcelas
- **WHEN** todas as parcelas estão definidas
- **THEN** o sistema deve validar que soma(valor_bruto) está próxima de valor_total do acordo
- **AND** permitir diferença de até 0.01 por arredondamentos
- **AND** bloquear se diferença > 0.01

#### Scenario: Validar datas de vencimento
- **WHEN** parcelas são criadas
- **THEN** data_vencimento deve ser no futuro (ou presente)
- **AND** parcelas subsequentes devem ter data >= parcela anterior
- **AND** sugerir espaçamento de 30 dias entre parcelas

#### Scenario: Validar edição de parcela paga
- **WHEN** usuário tenta editar parcela com status 'recebida' ou 'paga'
- **THEN** o sistema deve impedir edição de valores
- **AND** permitir apenas edição de arquivos/comprovantes
- **AND** retornar erro explicativo

### Requirement: Histórico de Parcelas
O sistema MUST rastrear mudanças nas parcelas.

#### Scenario: Registrar edições
- **WHEN** parcela é editada
- **THEN** o sistema deve atualizar updated_at
- **AND** marcar editado_manualmente se aplicável
- **AND** manter histórico de valores (se implementado)

#### Scenario: Rastrear recebimentos
- **WHEN** parcela é marcada como recebida
- **THEN** o sistema deve registrar data_efetivacao
- **AND** registrar quem marcou (se rastreado)
- **AND** não permitir reverter sem validações
