#!/usr/bin/env tsx
/**
 * Design System Audit — ZattarOS (Glass Briefing)
 *
 * Fonte canônica: design-system/README.md + colors_and_type.css + SKILL.md
 * (novo spec — substituiu o antigo MASTER.md pós-bundle Claude Design)
 *
 * Relatório completo sobre:
 *   1. Cobertura de tokens (CSS vs registro em token-registry.ts, vs spec)
 *   2. Adoção de typed components (<Heading>, <Text>, <GlassPanel>, etc.)
 *   3. Antipatterns (hex literais, classes Tailwind hardcoded, shadow-xl, etc.)
 *   4. Score por módulo (src/app/(authenticated)/<module>/)
 *   5. Baseline histórico (snapshots em design-system/reports/)
 *
 * CLI:
 *   npx tsx scripts/dev-tools/design/audit-design-system.ts              # relatório completo
 *   npx tsx scripts/dev-tools/design/audit-design-system.ts --ci         # exit 1 se meta não atingida
 *   npx tsx scripts/dev-tools/design/audit-design-system.ts --metrics    # apenas KPIs
 *   npx tsx scripts/dev-tools/design/audit-design-system.ts --module chat
 *   npx tsx scripts/dev-tools/design/audit-design-system.ts --violations hardcoded-colors
 *   npx tsx scripts/dev-tools/design/audit-design-system.ts --where --primary
 *   npx tsx scripts/dev-tools/design/audit-design-system.ts --json       # saída JSON
 *   npx tsx scripts/dev-tools/design/audit-design-system.ts --save       # salva snapshot
 */

import { glob } from 'glob';
import fs from 'node:fs/promises';
import path from 'node:path';

// =============================================================================
// TIPOS
// =============================================================================

interface AuditReport {
  timestamp: string;
  version: string;
  coverage: TokenCoverage;
  adoption: AdoptionMetrics;
  violations: ViolationsReport;
  modules: ModuleScore[];
  overall: OverallScore;
  kpis: KPIStatus[];
}

interface TokenCoverage {
  cssVariablesTotal: number;
  registryTotal: number;
  missingInRegistry: string[];
  missingInCss: string[];
  documentedInMaster: number;
  coveragePercent: number;
}

interface AdoptionMetrics {
  totalFiles: number;
  typography: { count: number; files: string[] };
  glassPanel: { count: number; files: string[] };
  iconContainer: { count: number; files: string[] };
  pageShell: { count: number; files: string[] };
  semanticBadge: { count: number; files: string[] };
  anyTyped: { count: number; percent: number };
  designSystemImports: { count: number; percent: number };
}

interface ViolationsReport {
  hardcodedBgColors: Violation[];
  hardcodedTextColors: Violation[];
  hardcodedBorderColors: Violation[];
  hexLiterals: Violation[];
  oklchInline: Violation[];
  shadowXl: Violation[];
  manualComposition: Violation[];
  whiteLowOpacity: Violation[];
  toolbarWrongSize: Violation[];
  total: number;
}

interface Violation {
  file: string;
  line: number;
  match: string;
  rule: string;
}

interface ModuleScore {
  name: string;
  files: number;
  adoption: number; // 0-100
  violations: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface OverallScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
}

interface KPI {
  name: string;
  current: number;
  target: number;
  comparison: 'gte' | 'lte' | 'eq';
  severity: 'block' | 'warn' | 'info';
}

interface KPIStatus extends KPI {
  status: 'pass' | 'fail';
  delta: number;
}

// =============================================================================
// CONFIG
// =============================================================================

const REPO_ROOT = path.resolve(process.cwd());
const GLOBALS_CSS = path.join(REPO_ROOT, 'src/app/globals.css');
const TOKEN_REGISTRY_FILE = path.join(REPO_ROOT, 'src/lib/design-system/token-registry.ts');

/**
 * Fontes canônicas do design system "Glass Briefing" (novo spec, pós bundle).
 * O script concatena o texto dessas fontes para avaliar cobertura de tokens
 * (quantos CSS vars aparecem documentados no spec narrativo).
 *
 * Ordem = prioridade em caso de duplicação. O primeiro arquivo que existir
 * é suficiente; arquivos ausentes são ignorados silenciosamente.
 */
const CANONICAL_SPEC_FILES = [
  path.join(REPO_ROOT, 'design-system/README.md'),
  path.join(REPO_ROOT, 'design-system/colors_and_type.css'),
  path.join(REPO_ROOT, 'design-system/SKILL.md'),
  // Extensions — lista exaustiva de tokens derivados (MD3/chart/portal/video/
  // glow/skeleton/widget/etc.) gerada automaticamente do token-registry.ts
  path.join(REPO_ROOT, 'design-system/extensions.md'),
];
const REPORTS_DIR = path.join(REPO_ROOT, 'design-system/reports');

const FILE_GLOBS = {
  authenticated: 'src/app/(authenticated)/**/*.tsx',
  components: 'src/components/**/*.tsx',
  all: 'src/**/*.tsx',
};

const EXCLUDES = [
  '**/node_modules/**',
  '**/__tests__/**',
  '**/*.test.tsx',
  '**/*.stories.tsx',
  '**/.next/**',
  '**/dist/**',
];

// Ofensores aceitos (documentados em GOVERNANCE.md §6) — não entram no score
const ALLOWED_OFFENDERS = [
  // PDF rendering (hex persistido para desenho em canvas, não é CSS de UI)
  'src/app/(authenticated)/assinatura-digital/components/editor/PdfCanvasArea.tsx',
  'src/app/(authenticated)/assinatura-digital/components/editor/FieldMappingEditor.tsx',

  // Plate.js editor (brand colors do Plate/Lexical — integração externa)
  'src/components/editor/plate-ui/**',

  // Mock/dev data
  'src/app/(authenticated)/dashboard/mock/**',

  // Mail preview — CSS embutido em iframe isolado renderizando HTML externo
  'src/app/(authenticated)/mail/components/mail-display.tsx',
  'src/app/(authenticated)/mail/components/mail-display-mobile.tsx',

  // Contratos pipelines — hex em form defaults persistidos no banco + placeholder
  // do input de cor. Não é estilização de UI, é valor de domínio.
  'src/app/(authenticated)/contratos/pipelines/page-client.tsx',

  // Video reel UI — always-dark overlay sobre vídeo. `bg-white/N` é semanticamente
  // correto (branco translúcido sobre fundo de vídeo escuro). Não depende de tema.
  'src/components/ui/reel.tsx',

  // Table toolbar — primitive shadcn-like com items de dropdown (text-sm = 14px
  // é padrão shadcn em dropdown items, diferente de filter-bar pills de 11px).
  // O regex detecta `text-sm` dentro de CommandItems/MenuItems que são 14px
  // por design (legibilidade em menus longos). Não é uma filter-bar pill.
  'src/components/ui/table-toolbar.tsx',

  // Website marketing demo pages — showcases visuais com paletas decorativas
  // propositalmente variadas (ex: demo de pipeline de recrutamento com badges
  // coloridos por estágio). Não são produto — são telas de vendas.
  'src/app/website/demo/**',

  // Dev tools — rota (dev) tem library, visual-diff, playgrounds internos que
  // usam paletas diretas para QA de componentes e comparação visual. Não é UI
  // de produto.
  'src/app/(dev)/**',

  // Portal do Cliente (navbar) — escopo visual próprio via tokens --portal-*.
  // Alguns fallbacks slate-* existem por legado do portal antes dos tokens.
  // Tokenizar será feito em epic próprio de portal.
  'src/app/portal/feature/components/navbar/**',

  // Next.js Viewport metadata — themeColor é meta-tag PWA e Next.js só aceita
  // hex nesse campo (OKLCH não é permitido pelo spec do browser).
  'src/app/layout.tsx',

  // Recharts primitive — hex dentro de attribute selectors CSS (ex:
  // `[stroke='#ccc']:stroke-border/50`). O hex é o seletor que matcha cores
  // geradas internamente pela lib externa; o override aplica o token. Não é
  // cor hardcoded de UI.
  'src/components/ui/chart.tsx',

  // Plate.js integração — cores de cursor/awareness para YJS collaborative
  // editor. São identidades visuais de colaboradores (por hash de user-id),
  // geradas fora do sistema de tokens.
  'src/components/editor/plate/**',

  // CopilotKit HITL — integração externa com paleta própria.
  'src/lib/copilotkit/**',

  // Chatwoot exemplos — arquivo de documentação/examples, não UI de produto.
  'src/lib/chatwoot/hooks/examples.tsx',

  // Design system showcase route — specimens DIDÁTICOS que mostram hex como
  // TEXTO legenda dos tokens (ex: "#5523EB" ao lado do swatch `var(--primary)`).
  // São conteúdo literal, não cor hardcoded.
  'src/app/(authenticated)/design-system/_components/**',

  // Website marketing — drama visual (shadow-2xl em heroes/cards premium) é
  // intencional em páginas de venda. Regra `shadow-lg como teto` aplica-se a
  // UI de produto, não marketing.
  'src/app/website/**',

  // Portal do Cliente — escopo visual separado com tokens --portal-* próprios.
  // shadow-2xl em hero/wizard é parte do guide portal, não do admin.
  'src/app/portal/**',

  // Rotas públicas de assinatura digital — fluxo externo (clientes assinando
  // sem login). Design mais dramático intencional.
  'src/app/(assinatura-digital)/**',

  // Theme customizer — ferramenta interna de QA/dev para ajuste runtime de
  // tema. Não é UI de produto.
  'src/components/layout/header/theme-customizer/**',
];

const TAILWIND_COLORS = [
  'blue', 'red', 'green', 'yellow', 'orange', 'pink',
  'gray', 'slate', 'zinc', 'stone', 'neutral', 'purple',
  'violet', 'indigo', 'cyan', 'teal', 'emerald', 'lime',
  'amber', 'rose', 'fuchsia', 'sky',
].join('|');

// Regex patterns
const PATTERNS = {
  bgColor: new RegExp(`\\bbg-(${TAILWIND_COLORS})-\\d{2,3}\\b`, 'g'),
  textColor: new RegExp(`\\btext-(${TAILWIND_COLORS})-\\d{2,3}\\b`, 'g'),
  borderColor: new RegExp(`\\bborder-(${TAILWIND_COLORS})-\\d{2,3}\\b`, 'g'),
  hexLiteral: /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g,
  // Captura `oklch(...)` inline mas IGNORA o padrão legítimo `oklch(var(--X)...)`
  // ou `oklch(from var(--X) ...)` que deriva alpha/calc de um token existente.
  // Aceita `_` como separador (Tailwind arbitrary values usam underscore no
  // lugar de espaço: `shadow-[0_0_6px_oklch(from_var(--x)_l_c_h/0.35)]`).
  // Só flagga valores LITERAIS (ex: `oklch(0.5 0.2 281)`).
  oklchInline: /oklch\s*\(\s*(?!var\(|from[\s_]+var\()/g,
  shadowXl: /\bshadow-(xl|2xl|3xl)\b/g,
  manualComposition: /\bfont-heading\s+text-2xl\s+font-bold\b/g,
  whiteLowOpacity: /\bbg-white\/([1-9]|1[0-5])\b(?![0-9])/g,
  cssVarDef: /^\s*(--[a-zA-Z0-9-]+)\s*:/gm,
  // Glass Briefing spec (design-system/README.md) — Toolbars/filter-bars/bulk-actions devem usar text-[11px]
  // em pills e triggers. `text-caption` (13px) é o anti-pattern histórico que já
  // causou regressão (commit ad9ec7ee2). `text-sm`/`text-base` são grandes demais
  // para qualquer contexto de pill. `text-xs` (12px) é aceitável em items de
  // popover/command e NÃO é flagged.
  toolbarWrongSize: /\btext-(caption|sm|base)\b/g,
};

/**
 * Arquivo é um toolbar/filter-bar/bulk-actions?
 * Nesses arquivos, o spec Glass Briefing obriga text-[11px] em pills.
 */
function isToolbarFile(filePath: string): boolean {
  const name = path.basename(filePath);
  return (
    /-filter-bar\.tsx$/.test(name) ||
    /-bulk-actions\.tsx$/.test(name) ||
    /-toolbar\.tsx$/.test(name)
  );
}

// =============================================================================
// KPI METAS
// =============================================================================

const KPI_TARGETS: KPI[] = [
  { name: 'Typography Adoption', current: 0, target: 200, comparison: 'gte', severity: 'warn' },
  { name: 'GlassPanel Adoption', current: 0, target: 115, comparison: 'gte', severity: 'info' },
  { name: 'Manual Composition', current: 0, target: 0, comparison: 'lte', severity: 'block' },
  { name: 'shadow-xl in (authenticated)/', current: 0, target: 0, comparison: 'lte', severity: 'block' },
  { name: 'Toolbar Wrong Size (§13.6)', current: 0, target: 0, comparison: 'lte', severity: 'block' },
  { name: 'Hardcoded Tailwind Colors', current: 0, target: 3, comparison: 'lte', severity: 'warn' },
  { name: 'Hex Literals in (authenticated)/', current: 0, target: 9, comparison: 'lte', severity: 'warn' },
  { name: 'Token Documentation Coverage', current: 0, target: 95, comparison: 'gte', severity: 'warn' },
  { name: 'CSS Variables in Registry', current: 0, target: 99, comparison: 'gte', severity: 'warn' },
];

// =============================================================================
// UTILS
// =============================================================================

async function loadGlobalsCss(): Promise<string> {
  return await fs.readFile(GLOBALS_CSS, 'utf-8');
}

/** Extrai lista de `--token-name` declarados em globals.css */
function extractCssVariables(css: string): Set<string> {
  const found = new Set<string>();
  const re = /^\s*(--[a-zA-Z0-9-]+)\s*:/gm;
  let m;
  while ((m = re.exec(css)) !== null) {
    found.add(m[1]);
  }
  return found;
}

/** Lê os nomes de token registrados em token-registry.ts */
async function loadRegisteredTokens(): Promise<Set<string>> {
  const src = await fs.readFile(TOKEN_REGISTRY_FILE, 'utf-8');
  const found = new Set<string>();
  const re = /name:\s*['"`](--[a-zA-Z0-9-]+)['"`]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    found.add(m[1]);
  }
  // Tokens dinâmicos gerados via Array.from() no registry
  for (let i = 1; i <= 18; i++) found.add(`--palette-${i}`);
  for (let i = 1; i <= 8; i++) found.add(`--chart-${i}`);
  return found;
}

/**
 * Tokens derivados/aliases que NÃO são tokens reais de design.
 * Existem em globals.css mas são:
 *   - Aliases @theme inline do Tailwind v4 (geram utility classes a partir de semantic tokens)
 *   - Internals do Tailwind (ring/shadow helpers)
 *   - CSS vars locais de utility classes (não são globais)
 *   - Radius aliases derivados via calc() de --radius
 */
const DERIVED_ALIASES_PATTERNS: RegExp[] = [
  /^--color-/,       // @theme inline aliases (bg-primary etc.)
  /^--tw-/,          // Tailwind internals
  /^--dot-/,         // .canvas-dots local vars
  /^--radius-(lg|md|sm|xl|2xl)$/, // calc() derivados de --radius
];

function isDerivedAlias(token: string): boolean {
  return DERIVED_ALIASES_PATTERNS.some((re) => re.test(token));
}

/** Busca ocorrências de um pattern em múltiplos arquivos. */
async function findViolations(
  files: string[],
  pattern: RegExp,
  ruleName: string,
): Promise<Violation[]> {
  const violations: Violation[] = [];
  for (const file of files) {
    const rel = path.relative(REPO_ROOT, file);
    if (ALLOWED_OFFENDERS.some((g) => matchGlob(rel, g))) continue;

    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      pattern.lastIndex = 0;
      let m;
      while ((m = pattern.exec(line)) !== null) {
        violations.push({ file: rel, line: idx + 1, match: m[0], rule: ruleName });
      }
    });
  }
  return violations;
}

function matchGlob(file: string, pattern: string): boolean {
  // Glob → regex. Passo crítico: substituir `**` por um placeholder antes de
  // tocar `*` sozinho, senão o `*` do `.*` (resultado de **) seria reprocessado
  // como `[^/]*`, virando `.[^/]*` e perdendo o wildcard cross-dir.
  const GLOBSTAR = '\x00GLOBSTAR\x00';
  const re = new RegExp(
    '^' +
      pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, GLOBSTAR)
        .replace(/\*/g, '[^/]*')
        .replace(new RegExp(GLOBSTAR, 'g'), '.*') +
      '$',
  );
  return re.test(file);
}

async function countImports(
  files: string[],
  importPath: string,
  componentName?: string,
  proxyPatterns?: RegExp[]
): Promise<string[]> {
  const matching: string[] = [];
  const specific = new RegExp(`from\\s+['"\`]${importPath.replace(/[/\-]/g, '\\$&')}['"\`]`);
  // Barrel parent — ex: `@/components/shared/page-shell` → aceita também
  // `import { PageShell, ... } from '@/components/shared'` (barrel).
  const lastSlash = importPath.lastIndexOf('/');
  const parentPath = lastSlash > 0 ? importPath.slice(0, lastSlash) : null;
  const barrel =
    parentPath && componentName
      ? new RegExp(
          `import\\s*\\{[^}]*\\b${componentName}\\b[^}]*\\}\\s*from\\s*['"\`]${parentPath.replace(/[/\-]/g, '\\$&')}['"\`]`,
          's'
        )
      : null;
  // Proxy patterns — re-exports conhecidos do componente (ex: dashboard widgets
  // importam `GlassPanel`/`WidgetContainer` via `../primitives` que re-exporta
  // de `@/components/shared/glass-panel`). Adoção transitiva real.
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    if (specific.test(content) || (barrel && barrel.test(content))) {
      matching.push(path.relative(REPO_ROOT, file));
      continue;
    }
    if (proxyPatterns && proxyPatterns.some((re) => re.test(content))) {
      matching.push(path.relative(REPO_ROOT, file));
    }
  }
  return matching;
}

async function collectFiles(pattern: string): Promise<string[]> {
  return glob(pattern, { cwd: REPO_ROOT, absolute: true, ignore: EXCLUDES });
}

function gradeFromScore(score: number): OverallScore['grade'] {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

// Score por módulo usa apenas `adoption - violationPenalty` (mais rígido que o
// overall, que pondera coverage + violations). Thresholds calibrados à
// distribuição real: módulos grandes possuem muitos sub-componentes funcionais
// (combos, filters, form fields) que não importam typed components por design.
function gradeFromModuleScore(score: number): OverallScore['grade'] {
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

// =============================================================================
// AUDITORIA
// =============================================================================

async function auditCoverage(): Promise<TokenCoverage> {
  const css = await loadGlobalsCss();
  const cssVarsRaw = extractCssVariables(css);
  // Exclui aliases/derivados — eles existem por automação do Tailwind v4, não são
  // tokens de design primários que devem ser documentados individualmente.
  const cssVars = new Set([...cssVarsRaw].filter((v) => !isDerivedAlias(v)));
  const registered = await loadRegisteredTokens();

  const missingInRegistry = [...cssVars].filter((v) => !registered.has(v));
  const missingInCss = [...registered].filter((v) => !cssVarsRaw.has(v));

  // Concatena texto de todas as fontes canônicas que existirem (novo spec
  // Glass Briefing substituiu MASTER.md por README.md + colors_and_type.css).
  let specText = '';
  for (const specFile of CANONICAL_SPEC_FILES) {
    try {
      specText += '\n' + (await fs.readFile(specFile, 'utf-8'));
    } catch {
      // Arquivo ausente — ignorar silenciosamente
    }
  }
  const documented = [...cssVars].filter((v) => specText.includes(v)).length;
  const coveragePercent = cssVars.size === 0
    ? 0
    : Math.round((documented / cssVars.size) * 100);

  return {
    cssVariablesTotal: cssVars.size,
    registryTotal: registered.size,
    missingInRegistry,
    missingInCss,
    documentedInMaster: documented,
    coveragePercent,
  };
}

// Thin page wrappers (server components que só fazem auth + fetch + <Client/>)
// não deveriam ser penalizados no score de adoção — o papel deles é delegar,
// não renderizar tipografia. Filtro conservador: apenas `page.tsx` sem
// 'use client', sem classes text-*/font-* e com padrão de return ou redirect.
async function filterOutThinPageWrappers(files: string[]): Promise<string[]> {
  const result: string[] = [];
  for (const file of files) {
    if (!file.endsWith('/page.tsx')) {
      result.push(file);
      continue;
    }
    const content = await fs.readFile(file, 'utf-8');
    const isClient = /['"`]use client['"`]/m.test(content);
    const hasTypography =
      /className=["'`][^"'`]*\b(text-(sm|xs|lg|xl|2xl|base|\[|display|page|section|card|kpi|label|caption|overline|meta|widget)|font-(bold|semibold|medium|heading|display))/.test(
        content,
      );
    const hasDelegation = /return\s+(<|\(|redirect)|redirect\(/.test(content);
    const isThinWrapper = !isClient && !hasTypography && hasDelegation;
    if (!isThinWrapper) result.push(file);
  }
  return result;
}

async function auditAdoption(files: string[]): Promise<AdoptionMetrics> {
  files = await filterOutThinPageWrappers(files);
  const typography = await countImports(files, '@/components/ui/typography');
  const glassPanel = await countImports(files, '@/components/shared/glass-panel', 'GlassPanel', [
    // Dashboard widgets: primitives.tsx re-exporta GlassPanel e WidgetContainer
    /import\s*\{[^}]*\b(GlassPanel|WidgetContainer)\b[^}]*\}\s*from\s*['"`][./]+primitives['"`]/s,
  ]);
  const iconContainer = await countImports(files, '@/components/ui/icon-container');
  const pageShell = await countImports(files, '@/components/shared/page-shell', 'PageShell');
  const semanticBadge = await countImports(files, '@/components/ui/semantic-badge');
  const designSystem = await countImports(files, '@/lib/design-system');

  const allTypedSet = new Set([
    ...typography,
    ...glassPanel,
    ...iconContainer,
    ...pageShell,
    ...semanticBadge,
  ]);

  return {
    totalFiles: files.length,
    typography: { count: typography.length, files: typography },
    glassPanel: { count: glassPanel.length, files: glassPanel },
    iconContainer: { count: iconContainer.length, files: iconContainer },
    pageShell: { count: pageShell.length, files: pageShell },
    semanticBadge: { count: semanticBadge.length, files: semanticBadge },
    anyTyped: {
      count: allTypedSet.size,
      percent: Math.round((allTypedSet.size / files.length) * 100),
    },
    designSystemImports: {
      count: designSystem.length,
      percent: Math.round((designSystem.length / files.length) * 100),
    },
  };
}

async function auditViolations(files: string[]): Promise<ViolationsReport> {
  const [bg, text, border, hex, oklch, shadow, composition, white] = await Promise.all([
    findViolations(files, PATTERNS.bgColor, 'hardcoded-bg-color'),
    findViolations(files, PATTERNS.textColor, 'hardcoded-text-color'),
    findViolations(files, PATTERNS.borderColor, 'hardcoded-border-color'),
    findViolations(files, PATTERNS.hexLiteral, 'hex-literal'),
    findViolations(files, PATTERNS.oklchInline, 'oklch-inline'),
    findViolations(files, PATTERNS.shadowXl, 'shadow-xl'),
    findViolations(files, PATTERNS.manualComposition, 'manual-composition'),
    findViolations(files, PATTERNS.whiteLowOpacity, 'white-low-opacity'),
  ]);

  // Glass Briefing spec — filter-bars/bulk-actions/toolbars devem usar text-[11px].
  // Aplica o pattern apenas em arquivos dessa família.
  const toolbarFiles = files.filter(isToolbarFile);
  const toolbarWrongSize = await findViolations(
    toolbarFiles,
    PATTERNS.toolbarWrongSize,
    'toolbar-wrong-size',
  );

  const total =
    bg.length + text.length + border.length + hex.length + oklch.length +
    shadow.length + composition.length + white.length + toolbarWrongSize.length;

  return {
    hardcodedBgColors: bg,
    hardcodedTextColors: text,
    hardcodedBorderColors: border,
    hexLiterals: hex,
    oklchInline: oklch,
    shadowXl: shadow,
    manualComposition: composition,
    whiteLowOpacity: white,
    toolbarWrongSize,
    total,
  };
}

async function auditModules(files: string[], violations: ViolationsReport): Promise<ModuleScore[]> {
  files = await filterOutThinPageWrappers(files);
  const modulesMap = new Map<string, { files: string[]; violations: number; adopted: Set<string> }>();

  const typedFiles = new Set<string>();
  const typography = await countImports(files, '@/components/ui/typography');
  const glassPanel = await countImports(files, '@/components/shared/glass-panel', 'GlassPanel', [
    // Dashboard widgets: primitives.tsx re-exporta GlassPanel e WidgetContainer
    /import\s*\{[^}]*\b(GlassPanel|WidgetContainer)\b[^}]*\}\s*from\s*['"`][./]+primitives['"`]/s,
  ]);
  const iconContainer = await countImports(files, '@/components/ui/icon-container');
  const pageShell = await countImports(files, '@/components/shared/page-shell', 'PageShell');
  const semanticBadge = await countImports(files, '@/components/ui/semantic-badge');
  [...typography, ...glassPanel, ...iconContainer, ...pageShell, ...semanticBadge].forEach((f) => typedFiles.add(f));

  for (const f of files) {
    const rel = path.relative(REPO_ROOT, f);
    const m = rel.match(/src\/app\/\(authenticated\)\/([^/]+)/);
    if (!m) continue;
    const module = m[1];

    if (!modulesMap.has(module)) {
      modulesMap.set(module, { files: [], violations: 0, adopted: new Set() });
    }
    modulesMap.get(module)!.files.push(rel);
    if (typedFiles.has(rel)) modulesMap.get(module)!.adopted.add(rel);
  }

  const allViolations = [
    ...violations.hardcodedBgColors,
    ...violations.hardcodedTextColors,
    ...violations.hardcodedBorderColors,
    ...violations.hexLiterals,
    ...violations.shadowXl,
    ...violations.manualComposition,
  ];

  for (const v of allViolations) {
    const m = v.file.match(/src\/app\/\(authenticated\)\/([^/]+)/);
    if (!m) continue;
    const mod = modulesMap.get(m[1]);
    if (mod) mod.violations++;
  }

  const scores: ModuleScore[] = [];
  for (const [name, data] of modulesMap) {
    const adoption = data.files.length > 0 ? (data.adopted.size / data.files.length) * 100 : 0;
    const violationPenalty = Math.min(data.violations * 10, 50);
    const score = Math.max(0, Math.round(adoption - violationPenalty));
    scores.push({
      name,
      files: data.files.length,
      adoption: Math.round(adoption),
      violations: data.violations,
      grade: gradeFromModuleScore(score),
    });
  }

  scores.sort((a, b) => a.name.localeCompare(b.name));
  return scores;
}

function computeKpis(report: {
  adoption: AdoptionMetrics;
  violations: ViolationsReport;
  coverage: TokenCoverage;
  authViolations: { shadowXl: number; hex: number; bg: number };
}): KPIStatus[] {
  const values: Record<string, number> = {
    'Typography Adoption': report.adoption.typography.count,
    'GlassPanel Adoption': report.adoption.glassPanel.count,
    'Manual Composition': report.violations.manualComposition.length,
    'shadow-xl in (authenticated)/': report.authViolations.shadowXl,
    'Toolbar Wrong Size (§13.6)': report.violations.toolbarWrongSize.length,
    'Hardcoded Tailwind Colors': report.authViolations.bg,
    'Hex Literals in (authenticated)/': report.authViolations.hex,
    'Token Documentation Coverage': report.coverage.coveragePercent,
    'CSS Variables in Registry': Math.round(
      ((report.coverage.cssVariablesTotal - report.coverage.missingInRegistry.length) /
        report.coverage.cssVariablesTotal) *
        100,
    ),
  };

  return KPI_TARGETS.map((k) => {
    const current = values[k.name] ?? 0;
    const pass =
      k.comparison === 'gte' ? current >= k.target :
      k.comparison === 'lte' ? current <= k.target :
      current === k.target;
    const delta =
      k.comparison === 'gte' ? current - k.target :
      k.comparison === 'lte' ? k.target - current :
      current - k.target;
    return { ...k, current, status: pass ? 'pass' : 'fail', delta };
  });
}

function computeOverall(report: AuditReport): OverallScore {
  const blockKpis = report.kpis.filter((k) => k.severity === 'block');
  const hasBlockFailures = blockKpis.some((k) => k.status === 'fail');

  const adoption = report.adoption.anyTyped.percent;
  const coverage = report.coverage.coveragePercent;
  const violationPenalty = Math.min(report.violations.total * 2, 30);

  let score = Math.round(adoption * 0.4 + coverage * 0.4 + (100 - violationPenalty) * 0.2);
  if (hasBlockFailures) score = Math.min(score, 60);

  const grade = gradeFromScore(score);
  const summary = hasBlockFailures
    ? `Blocking failures present — ${blockKpis.filter((k) => k.status === 'fail').map((k) => k.name).join(', ')}`
    : `Healthy system — ${report.adoption.anyTyped.count}/${report.adoption.totalFiles} files adopt typed components`;

  return { score, grade, summary };
}

// =============================================================================
// RENDERING
// =============================================================================

function renderMarkdown(report: AuditReport): string {
  const modRows = report.modules
    .map((m) => `| ${m.name} | ${m.files} | ${m.adoption}% | ${m.violations} | **${m.grade}** |`)
    .join('\n');

  const kpiRows = report.kpis
    .map((k) => {
      const arrow = k.status === 'pass' ? 'OK' : k.severity === 'block' ? 'BLOCK' : 'WARN';
      return `| ${k.name} | ${k.current} | ${k.comparison} ${k.target} | **${arrow}** |`;
    })
    .join('\n');

  const topViolations = [
    ...report.violations.hardcodedBgColors,
    ...report.violations.hexLiterals,
    ...report.violations.manualComposition,
    ...report.violations.shadowXl,
  ]
    .slice(0, 15)
    .map((v) => `- \`${v.rule}\` at [${v.file}:${v.line}](${v.file}#L${v.line}): \`${v.match}\``)
    .join('\n');

  return `# Design System Audit — ${report.timestamp}

> Version: ${report.version}
> Overall grade: **${report.overall.grade}** (${report.overall.score}/100)
> ${report.overall.summary}

## KPIs

| Métrica | Current | Meta | Status |
|---|---:|---|---|
${kpiRows}

## Token Coverage

| Métrica | Valor |
|---|---:|
| CSS variables em globals.css | ${report.coverage.cssVariablesTotal} |
| Registrados em token-registry.ts | ${report.coverage.registryTotal} |
| Documentados em spec (design-system/) | ${report.coverage.documentedInMaster} (${report.coverage.coveragePercent}%) |
| Tokens drift (CSS sem registry) | ${report.coverage.missingInRegistry.length} |
| Tokens drift (registry sem CSS) | ${report.coverage.missingInCss.length} |

${report.coverage.missingInRegistry.length > 0
    ? `### Drift: tokens no CSS que não estão no registry\n\n${report.coverage.missingInRegistry.map((t) => `- \`${t}\``).join('\n')}`
    : ''}

${report.coverage.missingInCss.length > 0
    ? `### Drift: tokens no registry que não estão no CSS\n\n${report.coverage.missingInCss.map((t) => `- \`${t}\``).join('\n')}`
    : ''}

## Adoption

| Componente typed | Arquivos | % dos TSX |
|---|---:|---:|
| \`<Heading>/<Text>\` (typography) | ${report.adoption.typography.count} | ${Math.round((report.adoption.typography.count / report.adoption.totalFiles) * 100)}% |
| \`<GlassPanel>\` | ${report.adoption.glassPanel.count} | ${Math.round((report.adoption.glassPanel.count / report.adoption.totalFiles) * 100)}% |
| \`<IconContainer>\` | ${report.adoption.iconContainer.count} | ${Math.round((report.adoption.iconContainer.count / report.adoption.totalFiles) * 100)}% |
| \`<PageShell>\` | ${report.adoption.pageShell.count} | ${Math.round((report.adoption.pageShell.count / report.adoption.totalFiles) * 100)}% |
| \`<SemanticBadge>\` | ${report.adoption.semanticBadge.count} | ${Math.round((report.adoption.semanticBadge.count / report.adoption.totalFiles) * 100)}% |
| **Qualquer typed** | **${report.adoption.anyTyped.count}** | **${report.adoption.anyTyped.percent}%** |
| Importam \`@/lib/design-system\` | ${report.adoption.designSystemImports.count} | ${report.adoption.designSystemImports.percent}% |

## Violations

| Regra | Ocorrências |
|---|---:|
| Hardcoded bg-color | ${report.violations.hardcodedBgColors.length} |
| Hardcoded text-color | ${report.violations.hardcodedTextColors.length} |
| Hardcoded border-color | ${report.violations.hardcodedBorderColors.length} |
| Hex literal | ${report.violations.hexLiterals.length} |
| OKLCH inline | ${report.violations.oklchInline.length} |
| \`shadow-xl\` | ${report.violations.shadowXl.length} |
| Manual composition | ${report.violations.manualComposition.length} |
| \`bg-white/[1-15]\` | ${report.violations.whiteLowOpacity.length} |
| Toolbar wrong size (§13.6) | ${report.violations.toolbarWrongSize.length} |
| **TOTAL** | **${report.violations.total}** |

${topViolations ? `### Top 15 violações\n\n${topViolations}` : '### No violations found'}

## Module Scores

| Módulo | Arquivos | Adoção | Violações | Grade |
|---|---:|---:|---:|:---:|
${modRows}

---

_Generated by \`audit-design-system.ts\` · Total TSX scanned: ${report.adoption.totalFiles}_
`;
}

function renderConsole(report: AuditReport): void {
  const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
  };
  console.log(`\n${c.bold}Design System Audit${c.reset}  ${c.dim}${report.timestamp}${c.reset}`);
  console.log(
    `Overall: ${c.bold}${report.overall.grade}${c.reset} (${report.overall.score}/100) — ${report.overall.summary}\n`,
  );

  console.log(`${c.bold}KPIs${c.reset}`);
  for (const k of report.kpis) {
    const color = k.status === 'pass' ? c.green : k.severity === 'block' ? c.red : c.yellow;
    const badge = k.status === 'pass' ? 'OK' : k.severity === 'block' ? 'BLOCK' : 'WARN';
    console.log(
      `  ${color}[${badge}]${c.reset} ${k.name}: ${k.current} ${c.dim}(${k.comparison} ${k.target})${c.reset}`,
    );
  }

  console.log(`\n${c.bold}Token Coverage${c.reset}`);
  console.log(`  CSS vars: ${report.coverage.cssVariablesTotal}`);
  console.log(`  Registry: ${report.coverage.registryTotal}`);
  console.log(`  Documentado: ${report.coverage.coveragePercent}%`);
  if (report.coverage.missingInRegistry.length > 0) {
    console.log(`  ${c.yellow}Drift CSS→Registry: ${report.coverage.missingInRegistry.length}${c.reset}`);
  }

  console.log(`\n${c.bold}Adoption${c.reset} (${report.adoption.totalFiles} arquivos TSX)`);
  console.log(`  Typography: ${report.adoption.typography.count}`);
  console.log(`  GlassPanel: ${report.adoption.glassPanel.count}`);
  console.log(`  IconContainer: ${report.adoption.iconContainer.count}`);
  console.log(`  PageShell: ${report.adoption.pageShell.count}`);
  console.log(`  SemanticBadge: ${report.adoption.semanticBadge.count}`);
  console.log(`  ${c.cyan}Any typed: ${report.adoption.anyTyped.count} (${report.adoption.anyTyped.percent}%)${c.reset}`);

  console.log(`\n${c.bold}Violations${c.reset} (total ${report.violations.total})`);
  console.log(`  bg-*: ${report.violations.hardcodedBgColors.length}`);
  console.log(`  text-*: ${report.violations.hardcodedTextColors.length}`);
  console.log(`  border-*: ${report.violations.hardcodedBorderColors.length}`);
  console.log(`  hex: ${report.violations.hexLiterals.length}`);
  console.log(`  oklch: ${report.violations.oklchInline.length}`);
  console.log(`  shadow-xl: ${report.violations.shadowXl.length}`);
  console.log(`  composition: ${report.violations.manualComposition.length}`);
  console.log(`  white-low: ${report.violations.whiteLowOpacity.length}`);
  console.log(`  toolbar-wrong-size: ${report.violations.toolbarWrongSize.length}`);

  console.log(`\n${c.bold}Modules${c.reset} (top 10 por adoção)`);
  const top = [...report.modules].sort((a, b) => b.adoption - a.adoption).slice(0, 10);
  for (const m of top) {
    console.log(
      `  ${m.grade === 'A' ? c.green : m.grade === 'F' ? c.red : c.yellow}${m.grade}${c.reset} ${m.name.padEnd(28)} ${String(m.adoption).padStart(3)}% adoção · ${m.violations} violações · ${m.files} arquivos`,
    );
  }
  console.log('');
}

// =============================================================================
// CLI
// =============================================================================

interface CliArgs {
  ci: boolean;
  metricsOnly: boolean;
  json: boolean;
  save: boolean;
  module?: string;
  violations?: string;
  where?: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { ci: false, metricsOnly: false, json: false, save: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ci') args.ci = true;
    else if (a === '--metrics' || a === '--metrics-only') args.metricsOnly = true;
    else if (a === '--json') args.json = true;
    else if (a === '--save') args.save = true;
    else if (a === '--module') args.module = argv[++i];
    else if (a === '--violations') args.violations = argv[++i];
    else if (a === '--where') args.where = argv[++i];
  }
  return args;
}

async function whereIsToken(token: string): Promise<void> {
  const files = await collectFiles('src/**/*.{ts,tsx,css}');
  let total = 0;
  const needle = token.startsWith('--') ? token : `--${token}`;
  for (const f of files) {
    const rel = path.relative(REPO_ROOT, f);
    const content = await fs.readFile(f, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes(needle)) {
        console.log(`  ${rel}:${idx + 1} — ${line.trim().slice(0, 100)}`);
        total++;
      }
    });
  }
  console.log(`\nTotal: ${total} ocorrências de \`${needle}\``);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.where) {
    await whereIsToken(args.where);
    return;
  }

  console.error('[audit] Coletando arquivos TSX...');
  const authFiles = await collectFiles(FILE_GLOBS.authenticated);
  const allFiles = await collectFiles(FILE_GLOBS.all);

  console.error(`[audit] Analisando ${authFiles.length} arquivos em (authenticated)/...`);
  const adoption = await auditAdoption(authFiles);

  console.error('[audit] Verificando cobertura de tokens...');
  const coverage = await auditCoverage();

  console.error('[audit] Detectando violações...');
  const violations = await auditViolations(allFiles);

  console.error('[audit] Calculando score por módulo...');
  const modules = await auditModules(authFiles, violations);

  const authOnly = allFiles.filter((f) =>
    path.relative(REPO_ROOT, f).startsWith('src/app/(authenticated)/'),
  );
  const authViolations = {
    shadowXl: (await findViolations(authOnly, PATTERNS.shadowXl, 'shadow-xl')).length,
    hex: (await findViolations(authOnly, PATTERNS.hexLiteral, 'hex')).length,
    bg: (await findViolations(authOnly, PATTERNS.bgColor, 'bg')).length,
  };

  const kpis = computeKpis({ adoption, violations, coverage, authViolations });

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    coverage,
    adoption,
    violations,
    modules,
    overall: { score: 0, grade: 'C', summary: '' },
    kpis,
  };
  report.overall = computeOverall(report);

  // Rendering
  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else if (args.module) {
    const m = modules.find((x) => x.name === args.module);
    if (!m) {
      console.error(`Module "${args.module}" not found`);
      process.exit(1);
    }
    console.log(JSON.stringify(m, null, 2));
  } else if (args.violations) {
    const key = args.violations.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) as keyof ViolationsReport;
    const v = violations[key];
    if (!v || !Array.isArray(v)) {
      console.error(`Unknown violation: ${args.violations}. Options: hardcoded-bg-colors, hardcoded-text-colors, hex-literals, shadow-xl, manual-composition, oklch-inline, white-low-opacity`);
      process.exit(1);
    }
    v.forEach((x) => console.log(`${x.file}:${x.line} — ${x.match}`));
    console.log(`\nTotal: ${v.length}`);
  } else {
    renderConsole(report);
  }

  // Save snapshot
  if (args.save) {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
    const today = new Date().toISOString().slice(0, 10);
    const mdPath = path.join(REPORTS_DIR, `${today}.md`);
    const jsonPath = path.join(REPORTS_DIR, 'latest.json');
    await fs.writeFile(mdPath, renderMarkdown(report), 'utf-8');
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
    console.error(`\n[audit] Snapshot salvo em ${path.relative(REPO_ROOT, mdPath)}`);
  }

  // CI mode
  if (args.ci) {
    const blocked = report.kpis.some((k) => k.severity === 'block' && k.status === 'fail');
    process.exit(blocked ? 1 : 0);
  }
}

main().catch((err) => {
  console.error('[audit] Erro:', err);
  process.exit(2);
});
