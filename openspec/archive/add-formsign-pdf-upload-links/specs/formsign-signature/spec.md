## ADDED Requirements

### Requirement: Link público por assinante (sem expiração e sem reuso)
O sistema SHALL gerar um link público por assinante para execução da assinatura, sem expiração, com token opaco não enumerável, e SHALL impedir reuso após o assinante concluir.

#### Scenario: Acesso válido ao link
- **WHEN** o assinante acessa o link público com token válido e ainda não concluído
- **THEN** o sistema permite iniciar o fluxo do assinante

#### Scenario: Link já concluído
- **WHEN** o assinante acessa o link público após concluir a assinatura
- **THEN** o sistema bloqueia o reuso e informa que o link já foi concluído

### Requirement: Identificação do assinante no link público
O sistema SHALL exigir que o assinante informe ou confirme nome completo, CPF, e-mail e telefone antes de iniciar selfie/assinatura, independentemente do assinante ser entidade existente ou convidado.

#### Scenario: Convidado preenche dados obrigatórios
- **WHEN** um assinante convidado abre o link com dados ausentes no documento
- **THEN** o sistema solicita nome completo, CPF, e-mail e telefone
- **AND** persiste esses dados no registro do assinante do documento (sem criar entidade no sistema)

#### Scenario: Dados previamente preenchidos
- **WHEN** o assinante abre o link e os dados já estão presentes
- **THEN** o sistema solicita confirmação e permite correção antes de prosseguir

### Requirement: Selfie opcional (única opção configurável)
O sistema SHALL solicitar selfie somente quando o documento exigir selfie; demais elementos de segurança (IP, geo, hash/cripto, user_agent) SHALL ser coletados como padrão e não configuráveis.

#### Scenario: Documento exige selfie
- **WHEN** o documento está configurado com selfie habilitada
- **THEN** o fluxo público inclui captura de selfie antes da assinatura/rubrica

#### Scenario: Documento não exige selfie
- **WHEN** o documento está configurado sem selfie
- **THEN** o fluxo público não exibe etapa de selfie

### Requirement: Assinatura e rubrica com replicação nas âncoras
O sistema SHALL suportar dois tipos de marcação (`assinatura` e `rubrica`) e SHALL permitir múltiplas âncoras por tipo para cada assinante; o assinante realiza 1 captura por tipo e o sistema replica em todas as âncoras correspondentes no PDF final.

#### Scenario: Assinatura replicada em múltiplas âncoras
- **WHEN** o assinante captura sua assinatura uma vez
- **THEN** o sistema aplica a assinatura em todas as âncoras do tipo `assinatura` definidas para o assinante

#### Scenario: Rubrica replicada em múltiplas páginas
- **WHEN** o assinante captura sua rubrica uma vez
- **THEN** o sistema aplica a rubrica em todas as âncoras do tipo `rubrica` definidas para o assinante

### Requirement: Conclusão paralela e finalização do documento
O sistema SHALL permitir assinaturas em paralelo (sem ordem). O documento SHALL ser marcado como concluído somente quando todos os assinantes concluírem; cada assinante individual SHALL ser marcado como concluído ao finalizar seu fluxo.

#### Scenario: Assinante conclui independentemente
- **WHEN** um assinante conclui seu fluxo com sucesso
- **THEN** o sistema marca o assinante como concluído e bloqueia o reuso do link
- **AND** o documento permanece pendente se houver outros assinantes não concluídos

#### Scenario: Documento concluído após último assinante
- **WHEN** o último assinante pendente conclui seu fluxo
- **THEN** o sistema marca o documento como concluído e gera/persiste o PDF final


