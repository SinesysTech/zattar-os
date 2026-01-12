## ADDED Requirements

### Requirement: Gestão de Modelos de Peças Jurídicas (REQ-PJ-001)

O sistema MUST permitir criar, editar, visualizar e deletar modelos de peças jurídicas com suporte a placeholders.

#### Scenario: Criar modelo de petição inicial
- **WHEN** o usuário acessa "Novo Modelo de Peça"
- **AND** preenche título, descrição, tipo "Petição Inicial"
- **AND** insere conteúdo com placeholders no editor
- **THEN** o sistema MUST salvar modelo em `pecas_modelos`
- **AND** extrair e armazenar lista de placeholders usados
- **AND** validar que placeholders seguem formato `{{entidade_N.campo}}`

#### Scenario: Editar modelo existente
- **WHEN** o usuário abre modelo para edição
- **THEN** o sistema MUST carregar conteúdo no editor Plate.js
- **AND** permitir modificar título, descrição, tipo e conteúdo
- **AND** ao salvar, atualizar `placeholders_definidos` com lista atual

#### Scenario: Listar modelos por tipo de peça
- **WHEN** o usuário filtra por tipo "Petição Inicial"
- **THEN** o sistema MUST mostrar apenas modelos do tipo selecionado
- **AND** ordenar por título alfabeticamente
- **AND** mostrar indicador de visibilidade (público/privado)

#### Scenario: Deletar modelo (soft delete)
- **WHEN** o usuário deleta modelo
- **THEN** o sistema MUST setar `ativo = false`
- **AND** modelo não aparece mais nas listagens
- **AND** documentos já gerados NÃO são afetados

---

### Requirement: Sistema de Placeholders Indexados (REQ-PJ-002)

O sistema MUST suportar placeholders no formato `{{entidade_N.campo}}` para substituição automática de dados.

#### Scenario: Inserir placeholder de autor no editor
- **WHEN** o usuário está editando modelo
- **AND** abre menu de placeholders
- **AND** seleciona "Autor > Nome"
- **THEN** o sistema MUST inserir `{{autor_1.nome}}` na posição do cursor
- **AND** destacar visualmente o placeholder no editor

#### Scenario: Placeholder com índice para múltiplas partes
- **WHEN** o modelo contém `{{autor_1.nome}}` e `{{autor_2.nome}}`
- **AND** o contrato possui 2 autores
- **THEN** o sistema MUST substituir cada placeholder pelo autor correspondente
- **AND** `{{autor_1.nome}}` → nome do primeiro autor
- **AND** `{{autor_2.nome}}` → nome do segundo autor

#### Scenario: Placeholder não encontrado
- **WHEN** o modelo contém `{{autor_3.nome}}`
- **AND** o contrato possui apenas 2 autores
- **THEN** o sistema MUST manter o placeholder inalterado no documento
- **AND** alertar usuário sobre placeholders não resolvidos

#### Scenario: Formatar CPF automaticamente
- **WHEN** o placeholder é `{{autor_1.cpf_formatado}}`
- **AND** o CPF do autor é "12345678901"
- **THEN** o sistema MUST substituir por "123.456.789-01"

---

### Requirement: Placeholders Disponíveis por Entidade (REQ-PJ-003)

O sistema MUST disponibilizar conjunto completo de placeholders para clientes (autores) e partes contrárias (réus).

#### Scenario: Placeholders de Pessoa Física
- **WHEN** o autor é pessoa física
- **THEN** o sistema MUST disponibilizar:
  - `{{autor_N.nome}}` - Nome completo
  - `{{autor_N.cpf}}` - CPF sem formatação
  - `{{autor_N.cpf_formatado}}` - CPF com formatação XXX.XXX.XXX-XX
  - `{{autor_N.rg}}` - RG
  - `{{autor_N.nacionalidade}}` - Nacionalidade
  - `{{autor_N.estado_civil}}` - Estado civil
  - `{{autor_N.data_nascimento}}` - Data de nascimento DD/MM/YYYY
  - `{{autor_N.nome_mae}}` - Nome da mãe

#### Scenario: Placeholders de Pessoa Jurídica
- **WHEN** o autor é pessoa jurídica
- **THEN** o sistema MUST disponibilizar:
  - `{{autor_N.razao_social}}` - Razão social
  - `{{autor_N.nome_fantasia}}` - Nome fantasia
  - `{{autor_N.cnpj}}` - CNPJ sem formatação
  - `{{autor_N.cnpj_formatado}}` - CNPJ com formatação XX.XXX.XXX/XXXX-XX
  - `{{autor_N.inscricao_estadual}}` - Inscrição estadual

#### Scenario: Placeholders de Endereço
- **WHEN** o autor possui endereço cadastrado
- **THEN** o sistema MUST disponibilizar:
  - `{{autor_N.endereco_completo}}` - Endereço formatado completo
  - `{{autor_N.logradouro}}` - Rua/Avenida
  - `{{autor_N.numero}}` - Número
  - `{{autor_N.complemento}}` - Complemento
  - `{{autor_N.bairro}}` - Bairro
  - `{{autor_N.cidade}}` - Cidade
  - `{{autor_N.estado}}` - UF
  - `{{autor_N.cep_formatado}}` - CEP com formatação XXXXX-XXX

#### Scenario: Placeholders de Metadados
- **THEN** o sistema MUST disponibilizar:
  - `{{meta.data_atual}}` - Data atual DD/MM/YYYY
  - `{{meta.data_atual_extenso}}` - Data por extenso
  - `{{meta.advogado_responsavel}}` - Nome do advogado responsável pelo contrato
  - `{{meta.oab_advogado}}` - Número da OAB do advogado

---

### Requirement: Geração de Peça a partir de Contrato (REQ-PJ-004)

O sistema MUST permitir gerar documento a partir de modelo selecionado, substituindo placeholders com dados do contrato.

#### Scenario: Gerar petição inicial de contrato
- **WHEN** o usuário está na página do contrato
- **AND** clica em "Gerar Peça"
- **AND** seleciona modelo "Petição Inicial Trabalhista"
- **THEN** o sistema MUST criar novo documento em `documentos`
- **AND** substituir todos os placeholders com dados do contrato
- **AND** vincular documento ao contrato em `contrato_documentos`
- **AND** redirecionar para editor do documento gerado

#### Scenario: Preview de dados antes da geração
- **WHEN** o usuário seleciona modelo para gerar
- **THEN** o sistema MUST mostrar preview dos dados que serão substituídos
- **AND** indicar placeholders que não serão resolvidos (dados faltantes)
- **AND** permitir cancelar ou prosseguir com geração

#### Scenario: Gerar peça com múltiplas partes
- **WHEN** o contrato possui 2 autores e 3 réus
- **AND** o modelo usa placeholders para autor_1, autor_2, reu_1, reu_2, reu_3
- **THEN** o sistema MUST substituir cada placeholder corretamente
- **AND** buscar dados de clientes e partes contrárias via `contrato_partes`

---

### Requirement: Vinculação Contrato-Documento (REQ-PJ-005)

O sistema MUST manter registro de documentos gerados a partir de contratos.

#### Scenario: Vincular documento ao contrato
- **WHEN** documento é gerado de modelo
- **THEN** o sistema MUST criar registro em `contrato_documentos`
- **AND** armazenar referência ao modelo usado (`gerado_de_modelo_id`)
- **AND** armazenar tipo do documento

#### Scenario: Listar documentos do contrato
- **WHEN** o usuário acessa aba "Documentos" do contrato
- **THEN** o sistema MUST listar todos os documentos vinculados
- **AND** mostrar: título, tipo, data de criação, modelo de origem
- **AND** permitir abrir documento no editor
- **AND** permitir exportar documento (DOCX/PDF)

#### Scenario: Desvincular documento do contrato
- **WHEN** o usuário desvincula documento
- **THEN** o sistema MUST remover registro de `contrato_documentos`
- **AND** documento continua existindo em `documentos`
- **AND** documento perde referência ao contrato

---

### Requirement: Interface de Inserção de Placeholders (REQ-PJ-006)

O sistema MUST fornecer interface amigável para inserir placeholders ao editar modelos.

#### Scenario: Menu de placeholders no editor
- **WHEN** o usuário está editando modelo de peça
- **AND** digita "/" ou clica no botão de placeholder
- **THEN** o sistema MUST mostrar menu categorizado:
  - Autor (dados do cliente)
  - Réu (dados da parte contrária)
  - Contrato (dados do contrato)
  - Meta (data, advogado, etc.)

#### Scenario: Busca de placeholder por nome
- **WHEN** o usuário digita no menu de placeholders
- **THEN** o sistema MUST filtrar placeholders por termo buscado
- **AND** mostrar label amigável (ex: "Nome do Autor 1" para {{autor_1.nome}})

#### Scenario: Destaque visual de placeholders
- **WHEN** o modelo possui placeholders no conteúdo
- **THEN** o sistema MUST destacar visualmente com background diferenciado
- **AND** mostrar tooltip com nome do campo ao passar mouse
- **AND** permitir editar índice do placeholder (trocar autor_1 para autor_2)

---

### Requirement: Tipos de Peças Jurídicas (REQ-PJ-007)

O sistema MUST categorizar modelos por tipo de peça jurídica.

#### Scenario: Tipos de peça disponíveis
- **THEN** o sistema MUST suportar os seguintes tipos:
  - `peticao_inicial` - Petição Inicial
  - `contestacao` - Contestação
  - `recurso_ordinario` - Recurso Ordinário
  - `agravo` - Agravo
  - `embargos_declaracao` - Embargos de Declaração
  - `manifestacao` - Manifestação
  - `parecer` - Parecer
  - `contrato_honorarios` - Contrato de Honorários
  - `procuracao` - Procuração
  - `outro` - Outro

#### Scenario: Filtrar modelos por tipo
- **WHEN** o usuário seleciona tipo no filtro
- **THEN** o sistema MUST mostrar apenas modelos do tipo selecionado

---

### Requirement: Exportação de Peças Geradas (REQ-PJ-008)

O sistema MUST permitir exportar documentos gerados em DOCX e PDF.

#### Scenario: Exportar peça para DOCX
- **WHEN** o usuário clica em "Exportar DOCX" no documento gerado
- **THEN** o sistema MUST usar exportação existente do módulo de documentos
- **AND** nome do arquivo: `{titulo}_{tipo_peca}.docx`

#### Scenario: Exportar peça para PDF
- **WHEN** o usuário clica em "Exportar PDF" no documento gerado
- **THEN** o sistema MUST usar exportação existente do módulo de documentos
- **AND** nome do arquivo: `{titulo}_{tipo_peca}.pdf`

#### Scenario: Exportar da lista de documentos do contrato
- **WHEN** o usuário está na aba "Documentos" do contrato
- **AND** clica em exportar em um documento da lista
- **THEN** o sistema MUST exportar diretamente sem abrir editor
