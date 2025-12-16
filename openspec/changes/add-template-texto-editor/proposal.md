# Change: Adicionar suporte a Templates de Texto com Editor Plate

## Why

O sistema de assinatura digital atualmente suporta apenas templates baseados em upload de PDF, exigindo que usuários criem documentos externamente. Esta limitação dificulta a criação de documentos simples (contratos, termos, declarações) e impede o uso de variáveis dinâmicas no corpo do texto. Adicionar suporte para criação de templates de texto diretamente no sistema, utilizando o Plate Editor já integrado, permitirá maior agilidade e flexibilidade na geração de documentos para assinatura.

## What Changes

### Novos Componentes de Interface

- **TemplateTypeSelector**: Componente de seleção entre "Upload de PDF" e "Documento de Texto" na criação de templates
- **TemplateTextoCreateForm**: Formulário de criação de templates de texto com Plate Editor
- **TemplateTextoEditor**: Editor completo para templates de texto existentes
- **TemplateTextoToolbar**: Toolbar customizada com botões de formatação e inserção de variáveis
- **TemplateTextoPreviewModal**: Modal de preview do PDF gerado a partir do template texto
- **VariaveisPlugin**: Plugin do Plate para sistema de menções/variáveis inline (@variavel)

### Novos Serviços

- **template-texto-pdf.service**: Serviço de conversão Plate → HTML → PDF via Puppeteer
- **template-texto-html.template**: Template HTML base para renderização A4 profissional

### Novas Actions e API Routes

- **templates-texto-actions**: Server actions para CRUD de templates texto
- **preview-texto/route.ts**: API route para geração de preview PDF

### Extensão de Tipos e Schemas

- Tipos `TemplateTexto`, `VariavelMention`, `VariavelNode` em template.types.ts
- Type guards `isTemplatePdf()` e `isTemplateTexto()` para discriminação
- Schema Zod `templateTextoSchema` com validação de conteúdo Plate

### Modificações em Fluxos Existentes

- Dialog de criação de template com step de seleção de tipo
- Listagem de templates com indicador visual de tipo (badge PDF/Texto)
- Fluxo de assinatura detecta tipo de template e usa serviço apropriado
- Nova página `/templates/[id]/edit-texto` para edição de templates texto

## Impact

- Affected specs: `assinatura-digital` (nova spec)
- Affected code:
  - `src/features/assinatura-digital/types/template.types.ts`
  - `src/features/assinatura-digital/service.ts`
  - `src/app/(dashboard)/assinatura-digital/templates/components/`
  - `src/app/(dashboard)/assinatura-digital/templates/[id]/`
  - `src/app/api/assinatura-digital/templates/`

## Compatibility Notes

- **100% retrocompatível** com templates PDF existentes
- Templates PDF continuam funcionando sem modificações
- Fluxo de assinatura detecta automaticamente o tipo de template
- Banco de dados já possui campos `tipo_template` e `conteudo_markdown` (subutilizados)
