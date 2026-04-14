---
phase: 260414-mnp
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/domain/profiles/components/profile-layout/profile-header.tsx
  - src/lib/domain/profiles/components/profile-layout/profile-sidebar.tsx
  - src/lib/domain/profiles/components/profile-layout/profile-kpi-strip.tsx
  - src/lib/domain/profiles/components/profile-shell-client.tsx
  - src/app/(authenticated)/partes/partes-client.tsx
autonomous: true
requirements:
  - MNP-01 — ProfileHeader redesign (banner + avatar square + metadata strip + badges) conforme POC
  - MNP-02 — KPI Strip novo + ProfileSidebar redesign + ProfileShell orquestração (--tipo-color)
  - MNP-03 — Fix link "Ver perfil completo" no detail panel de partes-client (next/link com rota por tipo)

must_haves:
  truths:
    - "ProfileHeader renderiza banner radial gradient colorido pelo entityType via CSS var --tipo-color"
    - "ProfileSidebar usa GlassPanel + Text variant='overline' + progress card separado com cor do tipo"
    - "ProfileKpiStrip renderiza 3-4 KPIs específicos por entityType usando GlassPanel depth={2}"
    - "ProfileShellClient aplica --tipo-color no container raiz e insere KpiStrip entre header e grid"
    - "Botão 'Ver perfil completo' em partes-client é <Link> navegando para /partes/{rotaTipo}/{id} por tipo"
    - "npm run type-check passa em toda a árvore tocada"
    - "Zero mudança em *.config.ts, sections/*, adapters/*, actions/*"
  artifacts:
    - path: "src/lib/domain/profiles/components/profile-layout/profile-header.tsx"
      provides: "Header redesign POC com banner radial + avatar square + metadata strip"
    - path: "src/lib/domain/profiles/components/profile-layout/profile-kpi-strip.tsx"
      provides: "Novo componente KPI strip com 3-4 cards por entityType"
    - path: "src/lib/domain/profiles/components/profile-layout/profile-sidebar.tsx"
      provides: "Sidebar GlassPanel + progress card com tint do tipo"
    - path: "src/lib/domain/profiles/components/profile-shell-client.tsx"
      provides: "Orquestração: --tipo-color no root + KpiStrip inserido + entityType prop passado ao Header"
    - path: "src/app/(authenticated)/partes/partes-client.tsx"
      provides: "Link corrigido para perfil completo"
  key_links:
    - from: "profile-shell-client.tsx"
      to: "profile-header.tsx"
      via: "ProfileHeader prop entityType + style inline --tipo-color"
      pattern: "entityType=\\{entityType\\}"
    - from: "profile-shell-client.tsx"
      to: "profile-kpi-strip.tsx"
      via: "<ProfileKpiStrip entityType={...} stats={data.stats} />"
      pattern: "ProfileKpiStrip"
    - from: "partes-client.tsx EntityDetail"
      to: "next/link"
      via: "Link href dinâmico por config.label"
      pattern: "next/link"
---

<objective>
Implementar em React a POC HTML aprovada `docs/architecture/poc/parte-profile-redesign.html` sobre o ProfileShell já existente (`src/lib/domain/profiles/*`), preservando toda a API declarativa das configs e a lógica de renderSection.

Também corrigir bug do botão "Ver perfil completo" em `partes-client.tsx` que hoje é um `<button>` sem href — substituir por `<Link>` navegando para `/partes/{rotaTipo}/{id}` com mapeamento por tipo.

Purpose: ProfileShell visualmente alinhado ao Glass Briefing (já adotado em Audiências/Expedientes/Processos/Chat) e navegação do detail panel de Partes funcionando.
Output: 3 commits atômicos (1 por task), zero regressão funcional, `npm run type-check` passa.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@docs/architecture/poc/parte-profile-redesign.html
@src/lib/domain/profiles/components/profile-shell-client.tsx
@src/lib/domain/profiles/components/profile-layout/profile-header.tsx
@src/lib/domain/profiles/components/profile-layout/profile-sidebar.tsx
@src/lib/domain/profiles/configs/types.ts
@src/lib/domain/profiles/configs/cliente-profile.config.ts
@src/app/(authenticated)/partes/partes-client.tsx
@src/components/shared/glass-panel.tsx
@src/components/ui/typography.tsx

<interfaces>
<!-- Tipos que o executor precisa usar sem ir buscar. -->

From src/lib/domain/profiles/configs/types.ts:
```ts
export interface HeaderConfig {
  showBanner: boolean;
  showAvatar: boolean;
  showStatus: boolean;
  titleField: string;
  subtitleFields: string[];
  badges?: { field: string; variant?: "default"|"secondary"|"destructive"|"outline"; map?: Record<string,string> }[];
  metadata?: FieldConfig[];
}
export interface SidebarSection { title: string; fields: FieldConfig[] }
export interface ProfileData { id: number|string; [key: string]: unknown }
```

From src/components/shared/glass-panel.tsx:
```ts
export function GlassPanel({ children, className, depth?: 1|2|3 }): JSX.Element
// depth=1 glass-widget | depth=2 glass-kpi | depth=3 primary tint
```

From src/components/ui/typography.tsx:
```ts
function Heading({ level: 'page'|'section'|'card'|'subsection'|'widget', ... })
function Text({ variant: 'kpi-value'|'label'|'caption'|'widget-sub'|'meta-label'|'micro-caption'|'micro-badge'|'overline', ... })
```

From src/components/dashboard/entity-card.tsx:
```ts
export interface EntityCardConfig { label: string; icon: LucideIcon; color: string; bg: string }
export interface EntityCardData { id; nome; tipo: 'pf'|'pj'; config: EntityCardConfig; ... }
// config.label is one of: 'Cliente' | 'Parte Contrária' | 'Terceiro' | 'Representante'
```

Current ProfileShellClient passes to ProfileHeader only `{ config, data }` — Task 1 needs to add `entityType`.

entityType → CSS var mapping (from POC lines 28-33, 173-176):
  cliente        → var(--primary)      (oklch 0.55 0.18 270)
  parte_contraria→ var(--destructive)  (oklch 0.58 0.22 25 — POC usa 'contraria' oklch 0.65 0.2 30)
  terceiro       → var(--info)         (oklch 0.62 0.17 240)
  representante  → var(--success)      (oklch 0.62 0.17 150)
  usuario        → var(--primary)      (fallback)

label → rota mapping:
  'Cliente'        → '/partes/clientes/{id}'
  'Parte Contrária'→ '/partes/partes-contrarias/{id}'
  'Terceiro'       → '/partes/terceiros/{id}'
  'Representante'  → '/partes/representantes/{id}'
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: ProfileHeader redesign (banner radial + avatar square + metadata strip + --tipo-color)</name>
  <files>src/lib/domain/profiles/components/profile-layout/profile-header.tsx</files>
  <action>
Reescrever `profile-header.tsx` para espelhar a POC (ver seções "BANNER", "AVATAR + IDENTIDADE", "METADATA STRIP", "BADGES GRID" de `docs/architecture/poc/parte-profile-redesign.html`). Detalhes:

1. **Props**: Adicionar `entityType: 'cliente' | 'parte_contraria' | 'terceiro' | 'representante' | 'usuario'` ao `ProfileHeaderProps`. Manter `config`, `data`, `onEdit` opcionais.

2. **Container raiz**: `<div className="relative">` inalterado. NÃO aplicar inline style aqui — o `--tipo-color` virá do container pai (ProfileShellClient, Task 2). Apenas consumir via `var(--tipo-color, var(--primary))` nas classes/estilos inline.

3. **Banner** (quando `config.showBanner`):
   - `<div className="relative h-44 md:h-48 lg:h-56 overflow-hidden rounded-t-2xl">`
   - Background: inline style
     ```ts
     style={{
       background: `
         radial-gradient(600px 200px at 20% 0%, color-mix(in oklch, var(--tipo-color, var(--primary)) 25%, transparent), transparent 70%),
         radial-gradient(500px 180px at 85% 80%, color-mix(in oklch, var(--tipo-color, var(--primary)) 18%, transparent), transparent 70%),
         linear-gradient(135deg, color-mix(in oklch, var(--tipo-color, var(--primary)) 10%, transparent), color-mix(in oklch, var(--info) 6%, transparent))
       `,
     }}
     ```
   - Se `coverUrl` existir, renderizar `<img>` acima com `absolute inset-0 object-cover` (mantém a funcionalidade já existente).
   - Grain sobreposto opcional (ver POC `.banner-grain::before`): pode omitir nesta iteração se adicionar complexidade; documentar como TODO via comentário `// TODO POC grain overlay`.
   - Botão Edit (se `onEdit`) mantido: `absolute top-4 right-4` com `bg-background/50 backdrop-blur-sm rounded-full`.

4. **Avatar + identidade + metadata** (bloco inferior, sobreposto ao banner):
   - Wrapper: `<div className="px-4 sm:px-6 pb-4 -mt-10 md:-mt-12 lg:-mt-16 relative">`
   - **Avatar square glass** (substitui `<Avatar>` redondo nesta visualização):
     ```tsx
     <div
       className="size-20 md:size-24 lg:size-28 rounded-3xl flex items-center justify-center border border-border/40 shadow-lg backdrop-blur-xl"
       style={{
         background: 'color-mix(in oklch, var(--card) 78%, transparent)',
       }}
     >
       {avatarUrl ? (
         <img src={avatarUrl} alt={title} className="size-full rounded-3xl object-cover" />
       ) : (
         <span
           className="font-display text-3xl lg:text-4xl font-bold"
           style={{ color: 'var(--tipo-color, var(--primary))' }}
         >
           {initials}
         </span>
       )}
     </div>
     ```
   - Garantir PT-BR em alts/aria-labels.

5. **Título + subtítulos**: logo abaixo do avatar (alinhamento à esquerda, NÃO center — a POC usa left-aligned):
   - `<Heading level="page" className="mt-3">{title}</Heading>` — importar de `@/components/ui/typography`.
   - Subtítulos: `subtitleFields` renderizados como `<Text variant="meta-label">` em linha, separados por `·` (middot).

6. **Metadata strip com border-t**: bloco colado abaixo com `border-t border-border/40 pt-3 mt-4`, renderizando `config.metadata` num `flex flex-wrap gap-x-6 gap-y-2`. Cada item: `<div className="flex items-center gap-1.5"><Icon className="size-3.5 text-muted-foreground/60" /><Text variant="meta-label">{value}</Text></div>`.

7. **Badges grid**: abaixo do metadata, `flex flex-wrap gap-2 mt-3`. Usar `AppBadge` existente para cada badge de `config.badges`. Status ativo → `variant="default"`, inativo → `variant="secondary"`. Tipo pessoa → `variant="outline"`. Nada hardcoded de cor.

8. **Nada de `bg-blue-500`, `#hex`, `bg-linear-to-br from-primary/20 via-primary/10 to-secondary/20`** — substituir por CSS vars semânticas (`var(--tipo-color, var(--primary))`, `bg-muted`, `border-border/40`). Dark mode respeitado automaticamente.

9. Preservar a assinatura de `getNestedValue`, a lógica de `coverUrl`/`avatarUrl`/`initials` e o comportamento quando `config.showAvatar === false` (oculta o avatar mas mantém o bloco).

Garantir que consumidores existentes (ProfileShellClient antes da Task 2) continuem funcionando — `entityType` é **opcional com default `'cliente'`** para NÃO quebrar o type-check intermediário quando esta task roda sozinha (Task 2 passará a prop depois).
  </action>
  <verify>
    <automated>npm run type-check</automated>
  </verify>
  <done>
    - Arquivo `profile-header.tsx` reescrito com banner radial gradient via `var(--tipo-color, var(--primary))`, avatar glass square (rounded-3xl), metadata strip com border-t, badges grid.
    - Prop `entityType` aceita (default `'cliente'`) — não quebra chamada atual.
    - `npm run type-check` passa sem novos erros.
    - Zero cor hardcoded (sem `bg-blue-*`, `#hex`, gradientes literais `from-primary/20`). Apenas CSS vars e `color-mix`.
    - Heading level="page" e Text variant="meta-label" em uso.
    - Commit atômico: `refactor(profiles): redesign ProfileHeader conforme POC Glass Briefing (260414-mnp)`
  </done>
</task>

<task type="auto">
  <name>Task 2: ProfileKpiStrip (novo) + ProfileSidebar redesign + ProfileShellClient orquestra --tipo-color e entityType</name>
  <files>src/lib/domain/profiles/components/profile-layout/profile-kpi-strip.tsx, src/lib/domain/profiles/components/profile-layout/profile-sidebar.tsx, src/lib/domain/profiles/components/profile-shell-client.tsx</files>
  <action>
Implementar 3 mudanças em paralelo (mesmo commit):

### 2.1 — Criar `profile-kpi-strip.tsx` (novo)

Arquivo: `src/lib/domain/profiles/components/profile-layout/profile-kpi-strip.tsx`

Spec (ver POC seção "KPI STRIP — 4 métricas"):

```tsx
'use client';

import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import type { LucideIcon } from 'lucide-react';
import { FileText, Activity, AlertTriangle, Users, Gavel, Briefcase } from 'lucide-react';
import type { ProfileData } from '../../configs/types';

type EntityType = 'cliente' | 'parte_contraria' | 'terceiro' | 'representante' | 'usuario';

interface KpiSpec {
  label: string;
  icon: LucideIcon;
  valuePath: string; // dot path em profileData.stats
  formatter?: (v: unknown) => string;
  tone?: 'default' | 'warning' | 'success';
}

const KPI_SPECS: Record<EntityType, KpiSpec[]> = {
  cliente: [
    { label: 'Processos totais', icon: FileText, valuePath: 'stats.total_processos' },
    { label: 'Ativos', icon: Activity, valuePath: 'stats.processos_ativos', tone: 'success' },
    { label: 'Pendências', icon: AlertTriangle, valuePath: 'stats.pendencias', tone: 'warning' },
  ],
  parte_contraria: [
    { label: 'Processos vinculados', icon: Gavel, valuePath: 'stats.total_processos' },
    { label: 'Em andamento', icon: Activity, valuePath: 'stats.processos_ativos', tone: 'success' },
  ],
  terceiro: [
    { label: 'Processos onde atua', icon: FileText, valuePath: 'stats.total_processos' },
  ],
  representante: [
    { label: 'Clientes', icon: Users, valuePath: 'stats.total_clientes' },
    { label: 'Processos', icon: Briefcase, valuePath: 'stats.total_processos' },
    { label: 'Ativos', icon: Activity, valuePath: 'stats.processos_ativos', tone: 'success' },
  ],
  usuario: [],
};

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown =>
  path.split('.').reduce<unknown>(
    (acc, part) => (acc && typeof acc === 'object' && part in acc ? (acc as Record<string, unknown>)[part] : undefined),
    obj,
  );

interface ProfileKpiStripProps {
  entityType: EntityType;
  data: ProfileData;
}

export function ProfileKpiStrip({ entityType, data }: ProfileKpiStripProps) {
  const specs = KPI_SPECS[entityType];
  if (!specs || specs.length === 0) return null;

  const items = specs.map((spec) => {
    const raw = getNestedValue(data as Record<string, unknown>, spec.valuePath);
    const value = raw === null || raw === undefined ? '—' : spec.formatter ? spec.formatter(raw) : String(raw);
    return { ...spec, value };
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        const valueColor =
          item.tone === 'success'
            ? 'text-success'
            : item.tone === 'warning'
              ? 'text-warning'
              : 'text-foreground';
        return (
          <GlassPanel key={item.label} depth={2} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="size-3.5 text-muted-foreground/60" />
              <Text variant="overline">{item.label}</Text>
            </div>
            <Heading level="card" className={valueColor}>
              {item.value}
            </Heading>
          </GlassPanel>
        );
      })}
    </div>
  );
}
```

Sem cores hardcoded. Usa `text-success`/`text-warning` (CSS vars semânticas existentes em globals.css). GlassPanel depth=2. Heading/Text do DS.

### 2.2 — Reescrever `profile-sidebar.tsx`

Manter a assinatura `ProfileSidebarProps` e as funções `calculateProfileCompletion`/`sectionHasVisibleFields` intactas. Trocar os wrappers visuais:

1. Imports: remover `Card, CardContent, CardHeader, CardTitle` de `@/components/ui/card`. Adicionar `GlassPanel` de `@/components/shared/glass-panel` e `Heading, Text` de `@/components/ui/typography`.
2. Root: `<div className="space-y-4">` mantido.
3. **Progress card separado** (primeiro GlassPanel, quando `showProgress`):
   ```tsx
   <GlassPanel depth={2} className="p-4">
     <Text variant="overline" className="mb-3 block">Completude do perfil</Text>
     <div className="flex items-center gap-3">
       <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
         <div
           className="h-full rounded-full transition-all"
           style={{
             width: `${profileCompletion}%`,
             background: 'var(--tipo-color, var(--primary))',
           }}
         />
       </div>
       <Text variant="meta-label" className="tabular-nums">{profileCompletion}%</Text>
     </div>
   </GlassPanel>
   ```
4. **Profile sections card**: trocar `<Card><CardContent className="pt-6">...` por `<GlassPanel depth={1} className="p-5">...</GlassPanel>`. Substituir o `<h3 className="font-semibold">Perfil</h3>` por `<Heading level="subsection">Perfil</Heading>`.
5. Dentro do map das sections: substituir `<p className="text-muted-foreground mb-3 text-xs font-medium uppercase">{section.title}</p>` por `<Text variant="overline" className="mb-3 block">{section.title}</Text>`.
6. Ícones e valores: manter layout `flex items-center gap-3 text-sm`. Valor em `<Text variant="label">` (ou manter `<span>` com classe semântica — aceitável manter `<span className="wrap-break-word text-sm">`). Ícone mantém `text-muted-foreground h-4 w-4 shrink-0`.
7. Preservar `sectionHasVisibleFields` skip e `field.type === 'date'` com `format` do date-fns.

### 2.3 — Editar `profile-shell-client.tsx`

1. Importar `ProfileKpiStrip` de `./profile-layout/profile-kpi-strip`.
2. Definir map TIPO→COR no topo do arquivo (ou inline):
   ```ts
   const TIPO_COLOR_VAR: Record<ProfileShellClientProps['entityType'], string> = {
     cliente: 'var(--primary)',
     parte_contraria: 'var(--destructive)',
     terceiro: 'var(--info)',
     representante: 'var(--success)',
     usuario: 'var(--primary)',
   };
   ```
3. Root container: trocar
   ```tsx
   <div className="mx-auto min-h-screen lg:max-w-7xl xl:pt-6">
   ```
   por
   ```tsx
   <div
     className="mx-auto min-h-screen lg:max-w-7xl xl:pt-6"
     style={{ ['--tipo-color' as string]: TIPO_COLOR_VAR[entityType] } as React.CSSProperties}
   >
   ```
4. Passar `entityType` para `<ProfileHeader config={config.headerConfig} data={data} entityType={entityType} />`.
5. Inserir `<ProfileKpiStrip entityType={entityType} data={data} />` **entre o `</Card>` do header** e o `<div className="gap-4 space-y-4 lg:grid ...">`. Ex: antes do grid, depois do Card. Envelopar num wrapper para respirar: já existe `space-y-4`, basta inserir no mesmo nível.
6. Preservar 100% o switch de `renderSection` e toda a lógica de tabs.

Nada muda em configs `*.config.ts`. Nada muda em `sections/*`.
  </action>
  <verify>
    <automated>npm run type-check</automated>
  </verify>
  <done>
    - `profile-kpi-strip.tsx` criado com specs por entityType, GlassPanel depth=2, Heading/Text do DS.
    - `profile-sidebar.tsx` usa GlassPanel + Text variant="overline", progress bar colorida por `var(--tipo-color)`.
    - `profile-shell-client.tsx` aplica `style={{ '--tipo-color': ... }}` no root e renderiza `<ProfileKpiStrip>` entre header e grid sidebar/main.
    - ProfileHeader recebe prop `entityType`.
    - Lógica de `renderSection`, hooks, configs, sections/* 100% preservados.
    - `npm run type-check` passa.
    - Commit atômico: `feat(profiles): novo KPI Strip + sidebar glass + orquestração de cor por tipo (260414-mnp)`
  </done>
</task>

<task type="auto">
  <name>Task 3: Fix link "Ver perfil completo" em partes-client.tsx (next/link por tipo)</name>
  <files>src/app/(authenticated)/partes/partes-client.tsx</files>
  <action>
Em `src/app/(authenticated)/partes/partes-client.tsx`:

1. Adicionar import no topo: `import Link from 'next/link';`
2. Dentro do componente `EntityDetail`, derivar a rota a partir de `data.config.label`:
   ```ts
   const LABEL_TO_SEGMENT: Record<string, string> = {
     'Cliente': 'clientes',
     'Parte Contrária': 'partes-contrarias',
     'Terceiro': 'terceiros',
     'Representante': 'representantes',
   };
   const segment = LABEL_TO_SEGMENT[data.config.label] ?? 'clientes';
   const perfilHref = `/partes/${segment}/${data.id}`;
   ```
   (declarar logo após `const { config } = data;` — fora do JSX).
3. Substituir o botão atual (linhas ~212-216):
   ```tsx
   <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary/70 text-xs font-medium hover:bg-primary/15 transition-colors cursor-pointer">
     <ExternalLink className="size-3" />
     Ver perfil completo
   </button>
   ```
   Por:
   ```tsx
   <Link
     href={perfilHref}
     className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary/70 text-xs font-medium hover:bg-primary/15 transition-colors cursor-pointer"
   >
     <ExternalLink className="size-3" />
     Ver perfil completo
   </Link>
   ```
   Preservar EXATAMENTE as mesmas classes visuais. Nada de mudança de estilo — só troca semântica `<button>` → `<Link>`.

4. Verificar que as rotas destino existem:
   - `/partes/clientes/[id]`
   - `/partes/partes-contrarias/[id]`
   - `/partes/terceiros/[id]`
   - `/partes/representantes/[id]`
   
   Se alguma não existir no filesystem, NÃO criar — apenas reportar na mensagem de commit. (Uma rápida inspeção via Glob antes de commit é aceitável.)

5. Não tocar em nada mais do arquivo — zero refactor adicional.
  </action>
  <verify>
    <automated>npm run type-check</automated>
  </verify>
  <done>
    - Import `Link` de `next/link` adicionado.
    - `LABEL_TO_SEGMENT` mapeia os 4 tipos para os segmentos corretos de rota.
    - Botão "Ver perfil completo" é um `<Link href={...}>` com as mesmas classes visuais.
    - Ícone `ExternalLink` preservado.
    - `npm run type-check` passa.
    - Commit atômico: `fix(partes): link Ver perfil completo navega para /partes/{tipo}/{id} (260414-mnp)`
  </done>
</task>

</tasks>

<verification>
Após as 3 tasks:

1. `npm run type-check` — zero novos erros em toda a árvore tocada.
2. Smoke visual manual (opcional nesta quick task, mas recomendado):
   - Abrir `/partes/clientes/{id}` → header banner roxo (primary), KPI strip com 3 cards, sidebar glass com progress roxo.
   - Abrir `/partes/partes-contrarias/{id}` → banner avermelhado (destructive), KPI com 2 cards.
   - Abrir `/partes/terceiros/{id}` → banner azul (info).
   - Abrir `/partes/representantes/{id}` → banner verde (success), KPI com 3 cards.
   - Em `/partes`, clicar num card → botão "Ver perfil completo" navega para a rota correta do tipo.
3. Confirmar zero mudança em:
   - `src/lib/domain/profiles/configs/*.config.ts`
   - `src/lib/domain/profiles/components/sections/*`
   - `src/lib/domain/profiles/adapters/*`
   - actions, hooks, repositórios

```bash
git diff --stat src/lib/domain/profiles/configs/ src/lib/domain/profiles/components/sections/
# deve retornar vazio
```
</verification>

<success_criteria>
- 3 commits atômicos (um por task), com prefixo `260414-mnp` no scope.
- ProfileHeader, ProfileSidebar e ProfileShellClient usam Design System Glass Briefing (GlassPanel, Heading, Text, CSS vars).
- ProfileKpiStrip existe e renderiza 2-4 cards por entityType, lendo de `data.stats.*`.
- Cor do banner/avatar iniciais/progress bar derivada do entityType via CSS var `--tipo-color`, com fallback para `var(--primary)`.
- Botão "Ver perfil completo" em `partes-client.tsx EntityDetail` é `<Link>` para `/partes/{segment}/{id}`.
- `npm run type-check` passa.
- Configs e sections não foram tocadas.
- Dark mode funciona sem lógica condicional manual.
</success_criteria>

<output>
Após completar, criar `.planning/quick/260414-mnp-novo-skin-do-perfil-de-parte-profileshel/260414-mnp-SUMMARY.md` seguindo o template de summary.
</output>
