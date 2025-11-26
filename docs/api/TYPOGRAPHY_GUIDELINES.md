# Guidelines de Tipografia

## Visão Geral

Este documento estabelece as diretrizes para uso do sistema de tipografia shadcn/ui no projeto Sinesys. O objetivo é garantir consistência visual, hierarquia clara e manutenibilidade do código tipográfico.

## Sistema de Tipografia Disponível

O projeto possui um sistema completo de tipografia baseado no shadcn/ui com as seguintes variantes:

### Títulos (Headings)
- **H1**: Título principal da página (apenas um por página)
- **H2**: Seções principais
- **H3**: Subseções
- **H4**: Títulos menores ou em componentes

### Texto (Text)
- **P**: Parágrafo padrão
- **Lead**: Parágrafo introdutório destacado
- **Large**: Texto grande para ênfase
- **Small**: Texto pequeno para notas
- **Muted**: Texto com cor atenuada

### Especiais (Special)
- **Blockquote**: Citações
- **List**: Listas com marcadores
- **InlineCode**: Código ou termos técnicos
- **Table**: Tabelas com estilo consistente

## Diretrizes de Uso

### 1. Para Novos Componentes

**SEMPRE use o sistema de tipografia** em novos componentes. Escolha entre:

#### Opção A: Componentes React (Recomendado)

```tsx
import { Typography } from '@/components/ui/typography';

export function MyComponent() {
  return (
    <div>
      <Typography.H2>Título da Seção</Typography.H2>
      <Typography.P>
        Parágrafo de texto com espaçamento e estilos consistentes.
      </Typography.P>
    </div>
  );
}
```

**Vantagens:**
- Type-safe com TypeScript
- Polimorfismo (`as` prop)
- Composição fácil com `className`
- IntelliSense completo no VS Code

#### Opção B: Classes CSS

```tsx
export function MyComponent() {
  return (
    <div>
      <h2 className="typography-h2">Título da Seção</h2>
      <p className="typography-p">
        Parágrafo de texto com espaçamento e estilos consistentes.
      </p>
    </div>
  );
}
```

**Vantagens:**
- Mais direto para HTML semântico simples
- Menor overhead de componentes

### 2. Hierarquia Tipográfica

Mantenha sempre uma hierarquia lógica:

```tsx
// ✅ CORRETO
<Typography.H1>Página Principal</Typography.H1>
<Typography.H2>Seção</Typography.H2>
<Typography.H3>Subseção</Typography.H3>
<Typography.H4>Detalhe</Typography.H4>

// ❌ ERRADO - Não pular níveis
<Typography.H1>Página Principal</Typography.H1>
<Typography.H4>Detalhe</Typography.H4> {/* Pulou H2 e H3 */}
```

### 3. Uso de Polimorfismo

Use a prop `as` quando precisar de um elemento HTML diferente mantendo o estilo visual:

```tsx
// H1 semântico com visual de H2 (útil para SEO)
<Typography.H2 as="h1">
  Título Principal com Visual de H2
</Typography.H2>

// Div com estilo de parágrafo
<Typography.P as="div">
  Conteúdo que precisa ser div mas com estilo de parágrafo
</Typography.P>
```

### 4. Composição com Classes Tailwind

Você pode adicionar classes Tailwind adicionais mantendo os estilos base:

```tsx
<Typography.H2 className="mt-8 text-primary">
  Título com Margem e Cor Customizadas
</Typography.H2>

<Typography.P className="max-w-prose text-justify">
  Parágrafo com largura máxima e texto justificado
</Typography.P>
```

### 5. Quando Usar Cada Variante

| Variante | Uso Recomendado |
|----------|-----------------|
| **H1** | Título principal da página, hero sections |
| **H2** | Seções principais, separadores de conteúdo |
| **H3** | Subseções, títulos de cards importantes |
| **H4** | Títulos menores, labels de grupos de formulário |
| **Lead** | Primeiro parágrafo de artigos, introduções |
| **P** | Texto de corpo padrão |
| **Large** | Perguntas importantes, CTAs textuais |
| **Muted** | Metadados (datas, autores), instruções secundárias |
| **Small** | Labels de formulário, legendas, notas de rodapé |
| **Blockquote** | Citações, destaques importantes |
| **InlineCode** | Nomes de variáveis, comandos, termos técnicos |
| **List** | Listas ordenadas ou não ordenadas |
| **Table** | Tabelas de dados |

### 6. Acessibilidade

#### Sempre:
- ✅ Use tags HTML semânticas corretas
- ✅ Mantenha hierarquia lógica (não pule níveis)
- ✅ Garanta contraste mínimo de 4.5:1 para texto normal
- ✅ Use line-height de pelo menos 1.5
- ✅ Tamanho mínimo de fonte: 14px para corpo

#### Nunca:
- ❌ Use headings apenas para estilo (use `as` prop se precisar)
- ❌ Pule níveis de heading (h1 → h3)
- ❌ Use múltiplos H1 na mesma página

## Migrando Código Existente

### Análise Automática

Use o script de análise para identificar componentes que usam tipografia inconsistente:

```bash
node scripts/analyze-typography.js
```

Este script gera um relatório e um arquivo JSON com:
- Arquivos que usam classes Tailwind de tipografia
- Classes mais usadas no projeto
- Componentes prioritários para migração

### Substituições Comuns

| Tailwind Antigo | Sistema de Tipografia |
|----------------|----------------------|
| `text-4xl font-bold` | `<Typography.H1>` ou `className="typography-h1"` |
| `text-3xl font-bold` | `<Typography.H2>` ou `className="typography-h2"` |
| `text-2xl font-semibold` | `<Typography.H3>` ou `className="typography-h3"` |
| `text-xl font-semibold` | `<Typography.H4>` ou `className="typography-h4"` |
| `text-base` | `<Typography.P>` ou `className="typography-p"` |
| `text-lg text-muted-foreground` | `<Typography.Lead>` ou `className="typography-lead"` |
| `text-sm text-muted-foreground` | `<Typography.Muted>` ou `className="typography-muted"` |
| `text-xs` | `<Typography.Small>` ou `className="typography-small"` |

### Processo de Migração Gradual

1. **Identifique**: Use o script de análise
2. **Priorize**: Componentes de UI primeiro, depois páginas
3. **Teste**: Valide visualmente após migração
4. **Documente**: Anote mudanças significativas

#### Não é necessário migrar:
- Componentes que já funcionam bem
- Código legado que será reescrito em breve
- Casos onde Tailwind é mais apropriado (ex: utilitários específicos)

## Exemplos Práticos

### Exemplo 1: Card de Processo

```tsx
// ❌ ANTES (inconsistente)
<Card>
  <div className="text-xl font-bold">Processo #12345</div>
  <p className="text-sm text-gray-500">Status: Em andamento</p>
  <div className="text-base mt-4">
    Detalhes do processo...
  </div>
</Card>

// ✅ DEPOIS (consistente)
<Card>
  <Typography.H3>Processo #12345</Typography.H3>
  <Typography.Muted>Status: Em andamento</Typography.Muted>
  <Typography.P className="mt-4">
    Detalhes do processo...
  </Typography.P>
</Card>
```

### Exemplo 2: Página de Captura

```tsx
// ✅ BOM
export function CapturaPage() {
  return (
    <div className="container">
      <Typography.H1>Captura de Dados PJE-TRT</Typography.H1>
      <Typography.Lead className="mt-4">
        Sistema automatizado de captura de processos, audiências e pendências
        dos Tribunais Regionais do Trabalho.
      </Typography.Lead>

      <div className="mt-8">
        <Typography.H2>Nova Captura</Typography.H2>
        <Typography.P>
          Selecione o tipo de captura e preencha os dados necessários.
        </Typography.P>
        {/* Formulário */}
      </div>
    </div>
  );
}
```

### Exemplo 3: Dialog com Informações

```tsx
// ✅ BOM
<Dialog>
  <DialogContent>
    <DialogHeader>
      <Typography.H3 as="h2">Detalhes da Audiência</Typography.H3>
      <Typography.Muted>Processo: 0001234-56.2024.5.03.0001</Typography.Muted>
    </DialogHeader>

    <div className="space-y-4">
      <div>
        <Typography.H4>Data e Horário</Typography.H4>
        <Typography.P>15/11/2024 às 14:30</Typography.P>
      </div>

      <div>
        <Typography.H4>Local</Typography.H4>
        <Typography.P>Sala Virtual</Typography.P>
        <Typography.InlineCode>https://pje.trt3.jus.br/...</Typography.InlineCode>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

## Recursos

- **Documentação Interativa**: [http://localhost:3000/docs/typography](http://localhost:3000/docs/typography)
- **Componente**: `components/ui/typography.tsx`
- **Classes CSS**: Definidas em `app/globals.css`
- **Script de Análise**: `scripts/analyze-typography.js`

## Suporte

Para dúvidas sobre uso do sistema de tipografia:
1. Consulte a [página de documentação](http://localhost:3000/docs/typography)
2. Veja exemplos no código existente
3. Execute o script de análise para referência

---

**Lembre-se**: O objetivo é consistência e manutenibilidade. Quando em dúvida, prefira usar o sistema de tipografia.
