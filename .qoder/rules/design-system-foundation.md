## Seção 2.1: Hierarquia Tipográfica
- **Títulos de Interface:** `font-heading font-bold text-foreground`
  - H1 Página: `text-3xl tracking-tight`
  - H2 Seção: `text-xl tracking-tight`
  - H3 Card: `text-lg font-semibold`
- **Dados Tabulares:** `font-sans text-sm tabular-nums` (para números)
- **Labels/Metadados:** `font-sans text-sm text-muted-foreground font-medium`
- **Regra Crítica:** Nunca usar tamanhos arbitrários como `text-[13px]`

## Seção 2.2: Sistema de Espaçamento (4px Grid)
- **Padding de Card:** `p-4` ou `p-6` (nunca `p-8` ou `p-10`)
- **Gap de Listas:** `gap-2` ou `gap-3`
- **Gap de Layout:** `gap-6` (entre sidebar e conteúdo)
- **Regra:** Sistema denso em dados - evitar "espaçamento de marketing"

## Seção 2.3: Profundidade e Camadas (Flat Tech Style)
- **Camada 1 (Background):** `bg-background` (off-white)
- **Camada 2 (Cards/Tabelas):** `bg-card border border-border` (branco + borda fina)
- **Camada 3 (Popovers/Dropdowns):** `bg-popover shadow-md border border-border`
- **Camada 4 (Modais):** `bg-card shadow-lg` + overlay `bg-black/80`
- **Regra:** Preferir bordas sutis a sombras pesadas (`shadow-xl` proibido)

## Seção 2.4: Tokens de Cor - Quando Usar
Tabela de decisão:

| Contexto | Token | Classe Tailwind |
|----------|-------|-----------------|
| Botão primário | `--primary` | `bg-primary text-primary-foreground` |
| Badge de ação | `--highlight` | `bg-highlight text-foreground` (verificar contraste) |
| Texto de label | `--muted-foreground` | `text-muted-foreground` |
| Borda de input | `--input` | `border-input` |
| Foco de input | `--ring` | `ring-ring` |
| Sidebar background | `--sidebar` | `bg-sidebar` |

**Nota Crítica:** O uso direto de `oklch()` (ou qualquer valor de cor literal hexadecimal/RGB) em arquivos `.tsx` é estritamente proibido e será flagrado pelo validador `scripts/validate-design-system.ts`. Todas as cores em componentes devem ser aplicadas via classes Tailwind que utilizam os tokens semânticos definidos em `app/globals.css`.


## Seção 2.5: Regras de Composição
- **Nunca** misturar `bg-primary` com `text-primary` (usar `text-primary-foreground`)
- **Sempre** usar `cn()` de `lib/utils.ts` para merge de classes
- **Sempre** aplicar `tabular-nums` em colunas de números (CPF, valores monetários)
