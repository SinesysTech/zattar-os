# Assinatura Digital - Template Creation

## ADDED Requirements

### Requirement: Template Creation Dialog

O sistema SHALL fornecer um diálogo modal para criação de templates de assinatura digital, utilizando o componente `DialogFormShell` padronizado do projeto.

#### Scenario: Abrir diálogo de criação
- **WHEN** usuário clica no botão "Novo Template" na listagem de templates
- **THEN** sistema exibe diálogo modal com formulário de criação
- **AND** diálogo carrega lista de segmentos disponíveis

#### Scenario: Criar template Markdown com sucesso
- **GIVEN** diálogo de criação está aberto
- **WHEN** usuário preenche nome, descrição, seleciona segmento
- **AND** usuário seleciona tipo "Markdown"
- **AND** usuário escreve conteúdo no editor Markdown
- **AND** usuário clica em "Criar Template"
- **THEN** sistema valida campos com Zod schema
- **AND** sistema executa `criarTemplateAction` com dados
- **AND** sistema exibe toast de sucesso
- **AND** sistema fecha o diálogo
- **AND** sistema revalida listagem de templates

#### Scenario: Criar template PDF com sucesso
- **GIVEN** diálogo de criação está aberto
- **WHEN** usuário preenche nome, descrição, seleciona segmento
- **AND** usuário seleciona tipo "PDF"
- **AND** usuário faz upload de arquivo PDF
- **AND** usuário clica em "Criar Template"
- **THEN** sistema valida campos com Zod schema
- **AND** sistema executa `criarTemplateAction` com URL do PDF
- **AND** sistema exibe toast de sucesso
- **AND** sistema fecha o diálogo
- **AND** sistema revalida listagem de templates

#### Scenario: Exibir erros de validação
- **WHEN** usuário tenta criar template com campos inválidos
- **THEN** sistema exibe mensagens de erro inline nos campos
- **AND** sistema não permite submissão até correção

#### Scenario: Cancelar criação
- **WHEN** usuário clica em "Cancelar" ou fecha o diálogo
- **THEN** sistema descarta dados não salvos
- **AND** sistema fecha o diálogo sem alterações

### Requirement: PDF Upload Field

O sistema SHALL fornecer um componente reutilizável para upload de arquivos PDF com validação de tipo e tamanho.

#### Scenario: Selecionar arquivo PDF válido
- **WHEN** usuário seleciona um arquivo PDF com tamanho menor que 10MB
- **THEN** sistema valida tipo MIME como `application/pdf`
- **AND** sistema faz upload para API `/api/assinatura-digital/templates/upload`
- **AND** sistema exibe nome e tamanho do arquivo
- **AND** sistema notifica componente pai via `onChange`

#### Scenario: Rejeitar arquivo não-PDF
- **WHEN** usuário seleciona um arquivo que não é PDF
- **THEN** sistema exibe erro "Apenas arquivos PDF são permitidos"
- **AND** sistema não faz upload do arquivo

#### Scenario: Rejeitar arquivo muito grande
- **WHEN** usuário seleciona um arquivo PDF maior que 10MB
- **THEN** sistema exibe erro "Arquivo muito grande. Máximo 10MB"
- **AND** sistema não faz upload do arquivo

#### Scenario: Remover arquivo selecionado
- **WHEN** usuário clica no botão de remover arquivo
- **THEN** sistema limpa seleção
- **AND** sistema notifica componente pai com `onChange(null)`

#### Scenario: Exibir estado de loading durante upload
- **WHEN** upload de arquivo está em progresso
- **THEN** sistema exibe indicador de loading
- **AND** sistema desabilita seleção de novo arquivo

#### Scenario: Exibir erro de upload
- **WHEN** upload de arquivo falha
- **THEN** sistema exibe mensagem de erro
- **AND** sistema permite nova tentativa

### Requirement: Template Form Fields

O sistema SHALL fornecer um componente de apresentação que renderiza os campos do formulário de template de forma responsiva e condicionalmente baseado no tipo de template.

#### Scenario: Renderizar campos básicos
- **WHEN** componente é renderizado
- **THEN** sistema exibe campo de nome (obrigatório)
- **AND** sistema exibe campo de descrição (opcional)
- **AND** sistema exibe seletor de segmento (obrigatório)
- **AND** sistema exibe seletor de tipo (PDF ou Markdown)

#### Scenario: Renderizar editor Markdown
- **GIVEN** tipo de template é "Markdown"
- **WHEN** componente é renderizado
- **THEN** sistema exibe componente `MarkdownRichTextEditor`
- **AND** sistema oculta componente `PdfUploadField`

#### Scenario: Renderizar upload de PDF
- **GIVEN** tipo de template é "PDF"
- **WHEN** componente é renderizado
- **THEN** sistema exibe componente `PdfUploadField`
- **AND** sistema oculta componente `MarkdownRichTextEditor`

#### Scenario: Layout responsivo
- **WHEN** componente é renderizado em tela mobile
- **THEN** campos são exibidos em coluna única
- **WHEN** componente é renderizado em tela desktop
- **THEN** campos básicos são exibidos em grid de 2 colunas
- **AND** editor/upload ocupa largura total

### Requirement: Template Validation Schemas

O sistema SHALL consolidar schemas de validação Zod para templates em arquivo centralizado `types/domain.ts`.

#### Scenario: Validar campos obrigatórios
- **WHEN** schema `createTemplateSchema` é aplicado
- **THEN** campo `nome` é obrigatório com mínimo 3 caracteres
- **AND** campo `segmento_id` é obrigatório (UUID válido)
- **AND** campo `tipo_template` é obrigatório (enum: 'pdf' | 'markdown')

#### Scenario: Validar template Markdown
- **GIVEN** `tipo_template` é "markdown"
- **WHEN** schema `createTemplateSchema` é aplicado
- **THEN** campo `conteudo_markdown` é obrigatório
- **AND** campo `pdf_url` é ignorado

#### Scenario: Validar template PDF
- **GIVEN** `tipo_template` é "pdf"
- **WHEN** schema `createTemplateSchema` é aplicado
- **THEN** campo `pdf_url` é obrigatório (URL válida)
- **AND** campo `conteudo_markdown` é ignorado

#### Scenario: Validar upload de PDF
- **WHEN** schema `uploadPdfSchema` é aplicado
- **THEN** arquivo deve ser do tipo `application/pdf`
- **AND** arquivo deve ter tamanho menor ou igual a 10MB
