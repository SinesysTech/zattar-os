# Configuracao Multi-App do Sinesys

O Sinesys opera com tres aplicacoes distintas em um unico monorepo Next.js. Este documento descreve a arquitetura e configuracao necessaria.

## Arquitetura

```
src/app/
├── (dashboard)/          # Dashboard Principal - Sistema interno
├── meu-processo/         # Portal do Cliente - Consulta de processos
└── website/              # Website Institucional - Site publico
```

### Dashboard Principal

- **Caminho**: `src/app/(dashboard)/`
- **URL Producao**: Configurada via `NEXT_PUBLIC_DASHBOARD_URL`
- **Autenticacao**: Supabase Auth
- **Proposito**: Sistema interno para advogados e equipe

### Meu Processo (Portal do Cliente)

- **Caminho**: `src/app/meu-processo/`
- **URL Producao**: Configurada via `NEXT_PUBLIC_MEU_PROCESSO_URL`
- **Autenticacao**: CPF Cookie
- **Proposito**: Portal para clientes consultarem seus processos

### Website Institucional

- **Caminho**: `src/app/website/`
- **URL Producao**: Configurada via `NEXT_PUBLIC_WEBSITE_URL`
- **Autenticacao**: Nenhuma (publico)
- **Proposito**: Site institucional do escritorio

## Variaveis de Ambiente

Adicione as seguintes variaveis ao seu `.env.local`:

```bash
# URLs dos Apps (Producao)
NEXT_PUBLIC_DASHBOARD_URL=https://app.seudominio.com
NEXT_PUBLIC_MEU_PROCESSO_URL=https://meuprocesso.seudominio.com
NEXT_PUBLIC_WEBSITE_URL=https://www.seudominio.com
```

### Valores Padrao (Desenvolvimento)

Em desenvolvimento, os valores padrao sao:

| Variavel | Valor Padrao |
|----------|--------------|
| `NEXT_PUBLIC_DASHBOARD_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_MEU_PROCESSO_URL` | `http://localhost:3000/meu-processo` |
| `NEXT_PUBLIC_WEBSITE_URL` | `http://localhost:3000/website` |

## Onde as URLs sao Usadas

As variaveis de ambiente sao utilizadas nos seguintes locais:

| Local | Uso |
|-------|-----|
| `src/lib/urls.ts` | Funcoes helper (`getDashboardUrl`, `getMeuProcessoUrl`, `getWebsiteUrl`) |
| `src/app/website/components/hero.tsx` | Botao "Consultar Processo" redireciona para Meu Processo |
| `src/app/website/components/header.tsx` | Link "Meu Processo" no menu de navegacao |

## Usando as URLs no Codigo

O arquivo `src/lib/urls.ts` fornece funcoes helper para acessar as URLs:

```typescript
import { getDashboardUrl, getMeuProcessoUrl, getWebsiteUrl } from "@/lib/urls";

// URL base
const dashboardHome = getDashboardUrl();
// => "https://app.seudominio.com" (producao)
// => "http://localhost:3000" (desenvolvimento)

// URL com caminho
const processosPage = getDashboardUrl("/processos");
// => "https://app.seudominio.com/processos"

// Portal do cliente
const meuProcesso = getMeuProcessoUrl();
// => "https://meuprocesso.seudominio.com"

// Website
const website = getWebsiteUrl("/contato");
// => "https://www.seudominio.com/contato"
```

## Design System

Todos os tres apps compartilham o mesmo design system:

### Fontes

- **Inter**: Fonte principal para texto (`font-sans`)
- **Montserrat**: Fonte para headings (`font-display`)
- **Geist Mono**: Fonte monospacada (`font-mono`)

### Tokens

Os tokens de design estao definidos em `src/lib/design-system/tokens.ts`:

- Espacamentos: `gap-2`, `gap-4`, `gap-6`, `gap-8`
- Padding: `p-2`, `p-4`, `p-6`, `p-8`
- Transicoes: `transition-colors duration-200`
- Border radius: `rounded-md`, `rounded-lg`

### Cores do Website

O website mantem sua identidade visual propria com a cor brand roxa:

```css
/* Cor primaria do website */
--brand: #5523eb;
```

## Navegacao Entre Apps

Para navegar entre os apps, use as funcoes helper:

```tsx
import Link from "next/link";
import { getMeuProcessoUrl } from "@/lib/urls";

// No website, link para o portal do cliente
<Link href={getMeuProcessoUrl()}>
  Consultar Processo
</Link>
```

## Deploy

### Ambiente Unico

Se todos os apps estiverem no mesmo dominio:

```bash
NEXT_PUBLIC_DASHBOARD_URL=https://app.exemplo.com
NEXT_PUBLIC_MEU_PROCESSO_URL=https://app.exemplo.com/meu-processo
NEXT_PUBLIC_WEBSITE_URL=https://app.exemplo.com/website
```

### Dominios Separados

Para dominios separados, configure o middleware e DNS:

```bash
NEXT_PUBLIC_DASHBOARD_URL=https://app.exemplo.com
NEXT_PUBLIC_MEU_PROCESSO_URL=https://meuprocesso.exemplo.com
NEXT_PUBLIC_WEBSITE_URL=https://www.exemplo.com
```

## Estrutura de Componentes

Cada app tem seus proprios componentes em sua pasta:

```
src/app/website/components/     # Componentes do website
src/app/meu-processo/components/ # Componentes do portal
src/components/                  # Componentes compartilhados (dashboard)
```

Os componentes do website usam imports relativos (`./components/`) para manter isolamento.
