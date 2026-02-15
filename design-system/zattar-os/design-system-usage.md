# Design System Sinesys - Guia de Uso

Este documento descreve como utilizar o Design System Determinisrico do Sinesys.

## Arquitetura

```
src/lib/design-system/
  tokens.ts      # Valores atomicos (cores, espacamentos, tipografia)
  variants.ts    # Mapeamentos semanticos (dominio -> variante visual)
  utils.ts       # Funcoes de formatacao e validacao
  index.ts       # Re-exports centralizados
```

## Variantes Semanticas de Badge

### Funcao Principal: `getSemanticBadgeVariant()`

```tsx
import { getSemanticBadgeVariant } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';

// Obter variante baseada no dominio
const variant = getSemanticBadgeVariant('tribunal', 'TRT1'); // retorna 'info'

<Badge variant={variant}>TRT1</Badge>
```

### Categorias Disponiveis

| Categoria | Descricao | Exemplo |
|-----------|-----------|---------|
| `tribunal` | Tribunais (TRT, TJ, TST, STJ, STF) | `getSemanticBadgeVariant('tribunal', 'TRT1')` |
| `status` | Status de processo | `getSemanticBadgeVariant('status', 'ATIVO')` |
| `grau` | Grau de jurisdicao | `getSemanticBadgeVariant('grau', 'primeiro_grau')` |
| `parte` | Tipo de parte/terceiro | `getSemanticBadgeVariant('parte', 'PERITO')` |
| `polo` | Polo processual | `getSemanticBadgeVariant('polo', 'ATIVO')` |
| `audiencia_status` | Status de audiencia | `getSemanticBadgeVariant('audiencia_status', 'Marcada')` |
| `audiencia_modalidade` | Modalidade de audiencia | `getSemanticBadgeVariant('audiencia_modalidade', 'Virtual')` |
| `expediente_tipo` | Tipo de expediente (ID) | `getSemanticBadgeVariant('expediente_tipo', 1)` |
| `captura_status` | Status de captura | `getSemanticBadgeVariant('captura_status', 'completed')` |

### Mapeamentos de Tribunais

| Tribunal | Variante | Tribunal | Variante |
|----------|----------|----------|----------|
| TRT1 | info | TRT13 | accent |
| TRT2 | success | TRT14 | neutral |
| TRT3 | warning | TRT15 | info |
| TRT4 | destructive | TRT16 | success |
| TRT5 | accent | TRT17 | warning |
| TRT6 | info | TRT18 | info |
| TRT7 | success | TRT19 | success |
| TRT8 | neutral | TRT20 | warning |
| TRT9 | warning | TRT21 | accent |
| TRT10 | info | TRT22 | neutral |
| TRT11 | success | TRT23 | info |
| TRT12 | warning | TRT24 | success |
| TST | neutral | STJ | neutral |
| STF | neutral | TJSP | success |

### Mapeamentos de Status

| Status | Variante |
|--------|----------|
| ATIVO | success |
| EM_ANDAMENTO | success |
| SUSPENSO | warning |
| AGUARDANDO | warning |
| PENDENTE | warning |
| ARQUIVADO | neutral |
| ENCERRADO | neutral |
| ERRO | destructive |
| CANCELADO | destructive |

### Mapeamentos de Tipos de Parte

| Tipo | Variante |
|------|----------|
| PERITO | info |
| PERITO_CONTADOR | info |
| MINISTERIO_PUBLICO | accent |
| ASSISTENTE | success |
| TESTEMUNHA | info |
| PREPOSTO | warning |
| CURADOR | warning |
| OUTRO | default |

## Componentes Semanticos

### SemanticBadge

```tsx
import { SemanticBadge } from '@/components/ui/semantic-badge';

// Uso basico
<SemanticBadge category="tribunal" value="TRT1">TRT1</SemanticBadge>

// Com label automatico para partes
<SemanticBadge category="parte" value="PERITO" autoLabel />
// Renderiza: Perito

// Componentes especializados
import {
  TribunalSemanticBadge,
  StatusSemanticBadge,
  ParteTipoSemanticBadge,
  AudienciaStatusSemanticBadge,
} from '@/components/ui/semantic-badge';

<TribunalSemanticBadge value="TRT1" />
<StatusSemanticBadge value="ATIVO" />
<ParteTipoSemanticBadge value="PERITO" />
```

### TribunalBadge

```tsx
import { TribunalBadge } from '@/components/ui/tribunal-badge';

<TribunalBadge codigo="TRT1" />
<TribunalBadge codigo="TST" />
<TribunalBadge codigo="TJSP" />
```

## Funcoes de Formatacao

```tsx
import {
  formatCurrency,
  formatDate,
  formatCPF,
  formatCNPJ,
  formatPhone,
} from '@/lib/design-system';

// Moeda
formatCurrency(1234.56);           // "R$ 1.234,56"
formatCurrency(1234.56, { showSymbol: false }); // "1.234,56"

// Data
formatDate('2024-01-15');          // "15/01/2024"
formatDate('2024-01-15T10:30', { includeTime: true }); // "15/01/2024 10:30"

// Documentos
formatCPF('12345678901');          // "123.456.789-01"
formatCNPJ('12345678000199');      // "12.345.678/0001-99"

// Telefone
formatPhone('11999887766');        // "(11) 99988-7766"
```

## Funcoes de Validacao

```tsx
import { isValidCPF, isValidCNPJ } from '@/lib/design-system';

isValidCPF('12345678909');  // true/false
isValidCNPJ('12345678000190'); // true/false
```

## Funcoes de Calculo

```tsx
import { calculateAge, daysUntil } from '@/lib/design-system';

// Idade
calculateAge('1990-05-15'); // 34 (ou null se invalido)

// Dias ate uma data
daysUntil('2024-12-31'); // numero de dias (negativo se passou)
```

## Variantes Visuais de Badge

| Variante | Cor | Uso Recomendado |
|----------|-----|-----------------|
| default | Primary | Cor principal do tema |
| secondary | Cinza | Estados secundarios |
| destructive | Vermelho | Erros, exclusao, perigo |
| outline | Transparente | Apenas borda |
| success | Verde | Sucesso, ativo, concluido |
| warning | Ambar | Alertas, pendente, atencao |
| info | Azul | Informacoes, tribunais |
| neutral | Cinza | Estados neutros, arquivado |
| accent | Laranja | Destaque, acoes especiais |

## Migracaode Componentes Legados

### Antes (codigo legado)

```tsx
// EVITAR - cores hardcoded
const getTRTColorClass = (trt: string): string => {
  const colors = {
    TRT1: 'bg-blue-100 text-blue-800 border-blue-200',
    TRT2: 'bg-green-100 text-green-800 border-green-200',
  };
  return colors[trt] || 'bg-gray-100 text-gray-800';
};

<Badge className={getTRTColorClass(trt)}>{trt}</Badge>
```

### Depois (codigo refatorado)

```tsx
// RECOMENDADO - usar sistema semantico
import { getSemanticBadgeVariant } from '@/lib/design-system';

<Badge variant={getSemanticBadgeVariant('tribunal', trt)}>{trt}</Badge>
```

## Adicionar Novos Mapeamentos

Para adicionar um novo tribunal ou status:

1. Abra `src/lib/design-system/variants.ts`
2. Encontre o Record correspondente
3. Adicione a nova entrada

```tsx
// Em variants.ts
export const TRIBUNAL_VARIANTS: Record<string, BadgeVisualVariant> = {
  // ...existentes...
  TJNOVO: 'info', // Nova entrada
};
```

## Validacao

Execute o validador para verificar conformidade:

```bash
npm run validate:design-system

# Com detalhes
npm run validate:design-system -- --verbose
```

O validador detecta:
- Uso de `oklch()` direto
- Uso de `shadow-xl`
- Funcoes `getXXXColorClass()` locais
- Cores hardcoded em componentes de feature

## Regras para AI Assistants

Agentes de IA devem seguir as regras em `.cursor/rules/design-system-protocols.mdc`:

1. NUNCA criar cores hardcoded em badges
2. SEMPRE usar `getSemanticBadgeVariant()`
3. NUNCA criar funcoes `getXXXColorClass()` locais
4. SEMPRE usar PageShell para paginas
5. SEMPRE usar Typography para headings
6. SEMPRE seguir grid de 4px para espacamentos

## Documentação Adicional

- **Padrões de Diálogos**: `docs/design-system/dialog-patterns.md` - Diretrizes completas para uso do `DialogFormShell`
