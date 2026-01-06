# assinatura-digital Specification

## Purpose

Módulo de assinatura digital que permite criação de templates (PDF ou texto), preenchimento de formulários, captura de assinatura, integração com processos judiciais e geração de documentos assinados com validade legal.

## ADDED Requirements

### Requirement: Verificação de Permissões Administrativas

O sistema SHALL verificar permissões antes de executar operações administrativas no módulo de assinatura digital.

#### Scenario: Acesso autorizado a operações de escrita
- **WHEN** um usuário com permissão `assinatura_digital_admin` tenta criar, atualizar ou excluir templates/formulários/segmentos
- **THEN** o sistema permite a operação

#### Scenario: Acesso negado a operações de escrita
- **WHEN** um usuário sem permissão `assinatura_digital_admin` tenta criar, atualizar ou excluir templates/formulários/segmentos
- **THEN** o sistema retorna erro 403 Forbidden
- **AND** não executa a operação

#### Scenario: Listagem permitida para usuários autenticados
- **WHEN** um usuário autenticado tenta listar templates/formulários/segmentos
- **THEN** o sistema permite a operação de leitura

### Requirement: Integração com Processos Judiciais

O sistema SHALL permitir vincular templates e assinaturas a processos judiciais específicos.

#### Scenario: Criar template vinculado a processo
- **WHEN** um admin cria um template informando `processo_id`
- **THEN** o sistema persiste o vínculo com o processo
- **AND** disponibiliza variáveis do processo para uso no template

#### Scenario: Assinar documento vinculado a processo
- **WHEN** um cliente assina documento de template vinculado a processo
- **THEN** o sistema registra `processo_id` na assinatura
- **AND** inclui dados do processo no manifesto de assinatura

#### Scenario: Variáveis de processo disponíveis
- **WHEN** um template está vinculado a um processo
- **THEN** as variáveis `@processo.numero`, `@processo.vara`, `@processo.comarca`, `@processo.data_autuacao`, `@processo.valor_causa` estão disponíveis para uso

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
- **THEN** o sistema exibe autocompletar com variáveis disponíveis (cliente.nome, cliente.cpf, sistema.protocolo, processo.numero, etc.)
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

### Requirement: Consolidação de Tipos e Componentes

O sistema SHALL manter tipos e componentes consolidados em único local dentro da feature, sem duplicações.

#### Scenario: Importar tipos de assinatura digital
- **WHEN** um desenvolvedor precisa usar tipos do módulo
- **THEN** todos os tipos estão disponíveis em `src/features/assinatura-digital/types/`
- **AND** não existem tipos duplicados em `src/types/assinatura-digital/`

#### Scenario: Importar componentes de input
- **WHEN** um desenvolvedor precisa usar componentes de input do módulo
- **THEN** todos os componentes estão em `src/features/assinatura-digital/components/inputs/`
- **AND** não existem componentes duplicados em `components/form/inputs/`

#### Scenario: Usar interface TemplateCampo
- **WHEN** um desenvolvedor precisa usar a interface TemplateCampo
- **THEN** existe apenas uma versão em `types/template.types.ts` (versão portuguesa)
- **AND** está alinhada com o schema do banco de dados

### Requirement: Editor de Templates PDF Modular

O sistema SHALL organizar o editor de templates PDF em componentes menores e reutilizáveis.

#### Scenario: Usar hooks extraídos
- **WHEN** o FieldMappingEditor é renderizado
- **THEN** utiliza hooks separados para drag/drop, seleção, zoom e autosave
- **AND** cada hook pode ser testado independentemente

#### Scenario: Componentes organizados por responsabilidade
- **WHEN** o editor de templates é carregado
- **THEN** utiliza componentes separados para canvas (PdfCanvas/), propriedades (FieldProperties/) e informações (TemplateInfo/)
- **AND** o componente principal (FieldMappingEditor) funciona como orquestrador
