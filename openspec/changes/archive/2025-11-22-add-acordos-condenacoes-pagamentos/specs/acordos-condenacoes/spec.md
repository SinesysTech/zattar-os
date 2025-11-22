# acordos-condenacoes Specification Delta

## ADDED Requirements

### Requirement: CRUD de Acordos e Condenações
O sistema MUST fornecer operações completas de CRUD para acordos, condenações e custas processuais.

#### Scenario: Criar acordo ou condenação
- **WHEN** um usuário cria um novo acordo ou condenação
- **THEN** o sistema deve validar dados obrigatórios (processo_id, tipo, direção, valor_total, numero_parcelas)
- **AND** validar que processo_id existe na base
- **AND** criar registro em `acordos_condenacoes`
- **AND** distribuir automaticamente valores entre parcelas
- **AND** criar N registros em `parcelas` com valores calculados
- **AND** retornar acordo criado com ID e parcelas

#### Scenario: Listar acordos e condenações
- **WHEN** um usuário lista acordos/condenações
- **THEN** o sistema deve retornar lista paginada
- **AND** permitir filtrar por: processo_id, tipo, direcao, status
- **AND** incluir informações de parcelas (quantidade, pagas, pendentes)
- **AND** ordenar por data de criação (mais recentes primeiro)

#### Scenario: Buscar acordo por ID
- **WHEN** um usuário busca um acordo específico
- **THEN** o sistema deve retornar dados completos do acordo
- **AND** incluir todas as parcelas relacionadas
- **AND** incluir informações de repasses pendentes (se aplicável)
- **AND** retornar erro 404 se não encontrado

#### Scenario: Atualizar acordo
- **WHEN** um usuário atualiza um acordo existente
- **THEN** o sistema deve validar novos dados
- **AND** permitir editar: valor_total, percentual_escritorio, honorarios_sucumbenciais_total
- **AND** recalcular parcelas não editadas manualmente
- **AND** atualizar `updated_at`
- **AND** retornar acordo atualizado

#### Scenario: Deletar acordo
- **WHEN** um usuário deleta um acordo
- **THEN** o sistema deve verificar se há parcelas já pagas/recebidas
- **AND** impedir deleção se houver parcelas com status 'recebida' ou 'paga'
- **AND** deletar parcelas em cascata se permitido
- **AND** retornar confirmação ou erro

### Requirement: Tipos de Registro
O sistema MUST suportar três tipos distintos de registros financeiros.

#### Scenario: Registro de Acordo
- **WHEN** um acordo é registrado (tipo = 'acordo')
- **THEN** o sistema deve permitir direção 'recebimento' ou 'pagamento'
- **AND** permitir definir forma_distribuicao
- **AND** calcular honorários contratuais
- **AND** permitir honorários sucumbenciais

#### Scenario: Registro de Condenação
- **WHEN** uma condenação é registrada (tipo = 'condenacao')
- **THEN** o sistema deve permitir direção 'recebimento' ou 'pagamento'
- **AND** permitir definir forma_distribuicao
- **AND** calcular honorários contratuais
- **AND** permitir honorários sucumbenciais

#### Scenario: Registro de Custas Processuais
- **WHEN** custas processuais são registradas (tipo = 'custas_processuais')
- **THEN** o sistema deve fixar direção como 'pagamento'
- **AND** não permitir forma_distribuicao (sempre NULL)
- **AND** não calcular honorários contratuais ou sucumbenciais
- **AND** sempre criar parcela única (numero_parcelas = 1)

### Requirement: Formas de Distribuição
O sistema MUST suportar duas formas de distribuição de valores recebidos.

#### Scenario: Distribuição Integral
- **WHEN** forma_distribuicao = 'integral'
- **THEN** o sistema deve indicar que escritório recebe valor total
- **AND** calcular valor de repasse ao cliente
- **AND** habilitar controle de repasses nas parcelas
- **AND** aplicar percentual_escritorio sobre crédito principal

#### Scenario: Distribuição Dividida
- **WHEN** forma_distribuicao = 'dividido'
- **THEN** o sistema deve indicar que cada parte recebe direto
- **AND** não habilitar controle de repasses
- **AND** marcar status_repasse como 'nao_aplicavel' nas parcelas
- **AND** apenas rastrear se cada parte recebeu sua quota

### Requirement: Cálculo de Honorários
O sistema MUST calcular automaticamente honorários contratuais e sucumbenciais.

#### Scenario: Honorários Contratuais
- **WHEN** uma parcela é criada ou recalculada
- **THEN** o sistema deve calcular honorarios_contratuais = valor_bruto * percentual_escritorio
- **AND** aplicar apenas sobre crédito principal (não sobre sucumbenciais)
- **AND** recalcular quando percentual_escritorio mudar
- **AND** recalcular quando valor_bruto mudar

#### Scenario: Honorários Sucumbenciais
- **WHEN** honorarios_sucumbenciais_total é definido
- **THEN** o sistema deve distribuir igualmente entre todas as parcelas
- **AND** permitir edição manual do valor por parcela
- **AND** recalcular distribuição quando parcela é editada
- **AND** garantir que soma das parcelas não exceda total

### Requirement: Status do Acordo
O sistema MUST calcular automaticamente o status baseado nas parcelas.

#### Scenario: Status Pendente
- **WHEN** todas as parcelas estão com status 'pendente'
- **THEN** o acordo deve ter status 'pendente'

#### Scenario: Status Pago Parcial
- **WHEN** pelo menos uma parcela está 'recebida' ou 'paga'
- **AND** existem parcelas 'pendente' ou 'atrasado'
- **THEN** o acordo deve ter status 'pago_parcial'

#### Scenario: Status Pago Total
- **WHEN** todas as parcelas estão 'recebida' ou 'paga'
- **THEN** o acordo deve ter status 'pago_total'

#### Scenario: Status Atrasado
- **WHEN** pelo menos uma parcela está 'atrasado'
- **AND** nenhuma parcela está 'recebida' ou 'paga'
- **THEN** o acordo deve ter status 'atrasado'

### Requirement: Validações de Integridade
O sistema MUST validar integridade dos dados financeiros.

#### Scenario: Validar percentuais
- **WHEN** percentual_escritorio é definido
- **THEN** o sistema deve validar que está entre 0 e 100
- **AND** calcular percentual_cliente = 100 - percentual_escritorio
- **AND** aplicar validação em criar e atualizar

#### Scenario: Validar valores
- **WHEN** valores são definidos
- **THEN** o sistema deve validar que são positivos
- **AND** validar que soma das parcelas = valor_total (considerando edições manuais)
- **AND** impedir valores negativos ou zero

#### Scenario: Validar relacionamentos
- **WHEN** acordo é criado
- **THEN** o sistema deve validar que processo existe
- **AND** validar que usuario_repasse existe (quando aplicável)
- **AND** retornar erro específico se FK inválida
