# assinatura-digital Specification

## Purpose

Módulo de assinatura digital que permite criação de templates (PDF ou texto), preenchimento de formulários, captura de assinatura e geração de documentos assinados com validade legal.

## ADDED Requirements

### Requirement: Templates de Texto com Editor Plate

O sistema SHALL permitir criar e editar templates de assinatura usando um editor de texto rico (Plate Editor) como alternativa ao upload de PDF.

#### Scenario: Selecionar tipo de template na criação
- **WHEN** um admin acessa a criação de novo template
- **THEN** o sistema exibe opções "Upload de PDF" e "Documento de Texto"
- **AND** ao selecionar "Documento de Texto", exibe o formulário com Plate Editor

#### Scenario: Criar template de texto
- **WHEN** um admin cria um template de texto informando nome, descrição e conteúdo no editor
- **THEN** o sistema persiste o template com tipo_template='markdown' e conteudo_plate serializado como JSON
- **AND** registra as variáveis usadas em variaveis_usadas

#### Scenario: Editar template de texto existente
- **WHEN** um admin edita um template de texto
- **THEN** o sistema carrega conteudo_plate no Plate Editor
- **AND** permite modificar texto, formatação e variáveis
- **AND** persiste alterações ao salvar

### Requirement: Sistema de Variáveis Inline

O sistema SHALL suportar inserção de variáveis dinâmicas no corpo do template de texto usando sintaxe de menção (@variavel).

#### Scenario: Inserir variável via menção
- **WHEN** um admin digita "@" no editor de texto
- **THEN** o sistema exibe autocompletar com variáveis disponíveis (cliente.nome, cliente.cpf, sistema.protocolo, etc.)
- **AND** ao selecionar, insere a variável como elemento inline destacado

#### Scenario: Listar variáveis usadas
- **WHEN** um admin visualiza detalhes de um template de texto
- **THEN** o sistema exibe lista das variáveis inseridas no documento

#### Scenario: Substituir variáveis na geração de PDF
- **WHEN** o sistema gera PDF a partir de template de texto com variáveis
- **THEN** cada @variavel é substituída pelo valor correspondente do contexto de assinatura

### Requirement: Geração de PDF a partir de Template de Texto

O sistema SHALL gerar PDF em formato A4 profissional a partir do conteúdo do template de texto.

#### Scenario: Gerar preview de PDF
- **WHEN** um admin solicita preview de template de texto
- **THEN** o sistema converte conteudo_plate para HTML, aplica estilos A4, gera PDF via Puppeteer
- **AND** retorna URL temporária do PDF para visualização

#### Scenario: Gerar PDF final para assinatura
- **WHEN** o sistema processa assinatura de documento com template de texto
- **THEN** gera PDF com variáveis substituídas
- **AND** anexa manifesto de assinatura (hash SHA-256, timestamp, metadados)
- **AND** o PDF resultante segue mesmo padrão de conformidade legal dos templates PDF

#### Scenario: Configurar formatação de página
- **WHEN** um admin configura template de texto
- **THEN** pode definir margens (padrão 2cm), fonte (padrão Helvetica) e tamanho de fonte (padrão 12pt)

### Requirement: Diferenciação Visual de Tipos de Template

O sistema SHALL exibir indicadores visuais para diferenciar templates PDF de templates de texto na listagem.

#### Scenario: Exibir tipo na listagem
- **WHEN** um admin visualiza lista de templates
- **THEN** cada template exibe badge indicando tipo: "PDF" (azul) ou "Texto" (verde)

#### Scenario: Filtrar por tipo
- **WHEN** um admin aplica filtro de tipo na listagem
- **THEN** o sistema exibe apenas templates do tipo selecionado

#### Scenario: Redirecionar para editor correto
- **WHEN** um admin clica em "Editar" em um template
- **THEN** redireciona para `/templates/[id]/edit` se PDF
- **OR** redireciona para `/templates/[id]/edit-texto` se texto

### Requirement: Compatibilidade com Fluxo de Assinatura Existente

O sistema SHALL detectar automaticamente o tipo de template e usar o serviço de geração de PDF apropriado, mantendo compatibilidade total com templates PDF existentes.

#### Scenario: Assinar documento com template de texto
- **WHEN** um cliente completa formulário de assinatura usando template de texto
- **THEN** o sistema gera PDF via serviço de conversão de texto
- **AND** aplica mesma lógica de manifesto de assinatura
- **AND** persiste assinatura e artefatos no storage

#### Scenario: Assinar documento com template PDF (regressão)
- **WHEN** um cliente completa formulário de assinatura usando template PDF
- **THEN** o sistema usa fluxo existente de geração de PDF com campos posicionados
- **AND** comportamento permanece inalterado
