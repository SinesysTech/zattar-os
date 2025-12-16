# Design: Templates de Texto para Assinatura Digital

## Context

O módulo de assinatura digital atualmente suporta apenas templates baseados em upload de PDF. O banco de dados já possui os campos `tipo_template` ('pdf' | 'markdown') e `conteudo_markdown`, mas a interface utiliza apenas o fluxo de PDF. O Plate Editor está integrado no projeto em `src/components/editor/plate/`. As bibliotecas `puppeteer`, `html2canvas-pro` e `pdf-lib` estão disponíveis para conversão de conteúdo rico em PDF.

**Stakeholders**: Usuários administrativos que criam templates de documentos para assinatura.

**Constraints**:
- Manter 100% de compatibilidade com templates PDF existentes
- Utilizar Plate Editor já integrado no projeto
- Gerar PDFs em formato A4 profissional
- Manter conformidade legal (hash SHA-256, manifesto de assinatura)

## Goals / Non-Goals

### Goals
- Permitir criação de templates de texto diretamente no sistema
- Suportar variáveis dinâmicas inline via sistema de menções (@variavel)
- Gerar PDFs A4 profissionais a partir do conteúdo Plate
- Integrar com fluxo de assinatura existente sem breaking changes

### Non-Goals
- Migrar templates PDF existentes para texto (opcional, não obrigatório)
- Suportar formatação avançada (tabelas complexas, imagens inline) na v1
- Criar editor WYSIWYG pixel-perfect com o PDF final

## Decisions

### 1. Armazenamento de Conteúdo

**Decisão**: Usar campo `conteudo_plate` (JSON) ao invés do existente `conteudo_markdown`.

**Rationale**: O Plate Editor serializa para JSON estruturado (`Descendant[]`), não Markdown. Usar a estrutura nativa do Plate:
- Preserva formatação rica sem conversões
- Facilita edição incremental
- Permite tracking preciso de variáveis usadas

**Alternativas consideradas**:
- Markdown: Perderia formatação rica, exigiria parser adicional
- HTML string: Difícil de editar, vulnerável a XSS

### 2. Conversão para PDF

**Decisão**: Puppeteer para renderização HTML → PDF.

**Rationale**:
- Suporte completo a CSS (fontes, margens, cores)
- Controle preciso de formato A4 e quebra de páginas
- Já disponível como dependência do projeto

**Alternativas consideradas**:
- `html2canvas` + `jsPDF`: Qualidade inferior para texto
- `react-pdf`: Exigiria reescrever componentes de renderização
- `pdfmake`: API diferente, curva de aprendizado

### 3. Sistema de Variáveis

**Decisão**: Plugin de menções do Plate com trigger `@`.

**Rationale**:
- UX familiar (similar a mencionar usuários)
- Autocompletar nativo do Plate
- Variáveis renderizadas como elementos inline editáveis
- Fácil tracking de variáveis usadas no documento

**Formato de variáveis**:
```
@cliente.nome_completo → José da Silva
@cliente.cpf → 123.456.789-00
@sistema.protocolo → PROT-2024-001234
@sistema.data_assinatura → 16/12/2024
```

### 4. Tipos de Template (Discriminated Union)

**Decisão**: Usar campo `tipo_template` existente como discriminador de tipo TypeScript.

```typescript
type Template = TemplatePdf | TemplateTexto;

interface TemplatePdf {
  tipo_template: 'pdf';
  arquivo_original: string;
  campos: CampoTemplate[];
}

interface TemplateTexto {
  tipo_template: 'markdown'; // mantém valor do enum existente
  conteudo_plate: Descendant[];
  variaveis_usadas: TipoVariavel[];
  configuracao_pagina: ConfiguracaoPagina;
}
```

## Risks / Trade-offs

| Risco | Mitigação |
|-------|-----------|
| Puppeteer é pesado (memória) | Pool de instâncias reutilizáveis, limite de concorrência |
| Formatação A4 pode variar | CSS `@page` com margens fixas, testes visuais de regressão |
| Editor Plate pode ser lento em documentos grandes | Lazy loading, limitar tamanho máximo de template |
| Variáveis podem quebrar layout | Preview obrigatório antes de ativar template |

## Migration Plan

1. **Fase 1 (esta change)**: Adicionar suporte para criação de novos templates de texto
2. **Fase 2 (futura)**: Script opcional para converter `conteudo_markdown` existente para `conteudo_plate`
3. **Rollback**: Simplesmente não usar templates de texto; templates PDF continuam funcionando

**Não há breaking changes**. O fluxo detecta `tipo_template` e usa o serviço apropriado.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Template Creation                         │
├─────────────────────────────────────────────────────────────────┤
│  TemplateTypeSelector                                            │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   Upload PDF     │    │ Documento Texto  │                   │
│  │   (existente)    │    │    (novo)        │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           ▼                       ▼                              │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ PDF Upload Flow  │    │ TemplateTexto    │                   │
│  │ FieldMapping     │    │ CreateForm       │                   │
│  │ Editor           │    │ + PlateEditor    │                   │
│  └──────────────────┘    └────────┬─────────┘                   │
│                                   │                              │
│                                   ▼                              │
│                          ┌──────────────────┐                   │
│                          │ VariaveisPlugin  │                   │
│                          │ (@menções)       │                   │
│                          └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        PDF Generation                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Plate     │    │    HTML     │    │    PDF      │         │
│  │   JSON      │───▶│  + CSS A4   │───▶│ (Puppeteer) │         │
│  │             │    │             │    │             │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                               │                  │
│                                               ▼                  │
│                          ┌──────────────────────────────┐       │
│                          │ Manifesto de Assinatura      │       │
│                          │ (hash, timestamp, metadados) │       │
│                          └──────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Open Questions

- [ ] Definir lista exata de variáveis suportadas (subset de `TipoVariavel` ou todas?)
- [ ] Limite de tamanho para templates de texto (em páginas ou caracteres?)
- [ ] Incluir opção de fonte customizada na configuração de página?
