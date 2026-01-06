## ADDED Requirements

### Requirement: Criação de documento de assinatura via upload de PDF
O sistema SHALL permitir que um usuário administrativo crie um documento de assinatura a partir de um PDF uploadado, configurando 1..N assinantes, a opção de selfie (única configuração não-padrão) e as âncoras visuais (assinatura/rubrica) por assinante.

#### Scenario: Criar documento com assinantes de entidades existentes
- **WHEN** um admin seleciona um PDF e adiciona assinantes referenciando entidades existentes (tipo + id) e define âncoras de assinatura/rubrica por assinante
- **THEN** o sistema persiste o documento, os assinantes, as âncoras e retorna um identificador do documento
- **AND** retorna um link público por assinante para assinatura

#### Scenario: Criar documento com assinante convidado (dados incompletos)
- **WHEN** um admin adiciona um assinante “convidado” sem informar nome/CPF/e-mail/telefone e define âncoras no PDF
- **THEN** o sistema persiste o documento e o assinante convidado com dados vazios/parciais
- **AND** o link público do assinante exige que o assinante preencha esses dados antes de assinar

### Requirement: Listagem e consulta de documentos de assinatura (admin)
O sistema SHALL permitir que um admin liste e consulte documentos de assinatura criados via upload, incluindo status por assinante e acesso aos links públicos (enquanto pendentes).

#### Scenario: Listar documentos com status agregado
- **WHEN** um admin lista documentos de assinatura
- **THEN** o sistema retorna paginação, total e para cada documento o status agregado (pendente/em andamento/concluído)
- **AND** inclui a contagem de assinantes concluídos vs total

#### Scenario: Consultar links por assinante enquanto pendente
- **WHEN** um admin consulta um documento ainda não concluído
- **THEN** o sistema retorna os links públicos por assinante que ainda não concluiu
- **AND** não retorna links para assinantes já concluídos (ou marca como “concluído” e não reutilizável)


