/**
 * marketing-scale.ts — Contrato de escala proporcional do website público
 * ============================================================================
 * Este arquivo é a "fonte única de verdade" para a escala visual do marketing
 * (seções, cards, ícones, paddings, gaps). Existe porque a tipografia marketing
 * já está tokenizada (text-marketing-hero, -section, -title, -lead, -overline
 * em globals.css) mas os elementos visuais ao redor estavam ad-hoc — o resultado
 * era ícone de 48px competindo com título de 16px, ou `p-10` num card de 320px.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * HIERARQUIA TIPOGRÁFICA DE REFERÊNCIA (de globals.css)
 * ────────────────────────────────────────────────────────────────────────────
 *   marketing-hero     36 → 80 px    (H1 hero)
 *   marketing-section  26 → 48 px    (H2 seção, ex. "Soluções jurídicas…")
 *   marketing-title    22 → 34 px    (H3 bloco, ex. "Defesa Assertiva")
 *   marketing-lead     15 → 19 px    (parágrafo lead)
 *   marketing-overline 13 px          (eyebrow)
 *   Heading level=card 16 px          (overlay card title)
 *   Text caption       13 px          (overlay card description)
 *
 * ────────────────────────────────────────────────────────────────────────────
 * REGRA DE PROPORÇÃO APLICADA
 * ────────────────────────────────────────────────────────────────────────────
 * Cada elemento visual é derivado do tamanho do heading mais próximo:
 *
 *   Ícone em container colorido   ≈ 1.5x do título adjacente
 *   Container do ícone            ≈ 2.75x do título adjacente
 *   Padding interno do card       ≈ 1.5x do título adjacente
 *   Margem entre heading e body   ≈ 0.3x do heading
 *   Gap entre blocos de seção     ≈ 2x do marketing-section (≈ 96px desktop)
 *   Gap entre seções da página    ≈ 1.5x do gap entre blocos (≈ 96–128px)
 *
 * Ex.: overlay card tem título de 16px → ícone ~24px (w-6), container ~44px
 * (w-11), padding ~24px (p-6). Não é ícone de 48px nem padding de 40px.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * USO
 * ────────────────────────────────────────────────────────────────────────────
 * As classes Tailwind estão inlineadas nos componentes (por ergonomia do JSX)
 * mas as constantes abaixo servem para:
 *   1) Code review: se alguém usa `py-32` numa seção que deveria ser `py-24`,
 *      o diff contra este contrato torna a regressão óbvia.
 *   2) Novas seções: copiar uma das constantes em vez de inventar do zero.
 *   3) Documentação viva: o dev entra aqui para entender a relação entre níveis.
 * ============================================================================
 */

/**
 * Paddings verticais de SEÇÕES do website.
 * Referência: marketing-section (48px max) × 2 ≈ 96px na escala máxima.
 */
export const MARKETING_SECTION_PADDING = {
  /** Seção normal (services, about, insights). py 56→72→96px */
  default: 'py-14 sm:py-18 md:py-24',
  /** Seção com CTA final, um degrau acima. py 64→80→96px */
  cta: 'py-16 sm:py-20 md:py-24',
  /** Footer principal (Zona 2), um degrau abaixo. py 40→48→56px */
  footerMain: 'py-10 sm:py-12 md:py-14',
} as const;

/**
 * Margens sob o header de uma SEÇÃO (entre overline+heading e o primeiro bloco).
 * Referência: ≈ 1.33x do marketing-section (≈ 64px desktop).
 */
export const MARKETING_SECTION_HEADER_MB = 'mb-10 sm:mb-12 md:mb-16';

/**
 * Gap vertical entre BLOCOS dentro de uma seção (ex.: entre 3 ServiceBlocks).
 * Referência: ≈ 2x do marketing-section (≈ 96px desktop).
 */
export const MARKETING_BLOCK_GAP_Y = 'space-y-14 sm:space-y-16 md:space-y-24';

/**
 * Gap horizontal padrão entre colunas de um block (image + text).
 * Referência: ≈ 0.83x do marketing-section (≈ 40px desktop).
 */
export const MARKETING_BLOCK_GAP_X = 'gap-6 md:gap-10';

/**
 * Margens entre elementos dentro de um bloco (heading → lead → CTA).
 * Referência: ≈ 0.3x do marketing-title (≈ 10–20px desktop).
 */
export const MARKETING_BLOCK_SPACING = {
  /** overline → heading: 12–16px */
  overlineToHeading: 'mb-3',
  /** heading → lead: 16–20px (mb-4 → mb-5) */
  headingToLead: 'mb-4 md:mb-5',
  /** lead → CTA: 24–28px (mb-6 → mb-7) */
  leadToCta: 'mb-6 md:mb-7',
} as const;

/**
 * Escala de ÍCONES contextualizados por heading adjacente.
 * Regra: ícone ≈ 1.5x do título; container ≈ 2.75x do título.
 */
export const MARKETING_ICON_SCALE = {
  /** Ao lado de Heading level="card" (16px) — ex.: overlay card. w-5 em w-11. */
  card: { icon: 'w-5 h-5', container: 'w-11 h-11 rounded-xl' },
  /** Ao lado de Heading level="widget" (15px) — ex.: footer contato. w-3.5 em w-8. */
  widget: { icon: 'w-3.5 h-3.5', container: 'w-8 h-8 rounded-lg' },
  /** Ao lado de marketing-title (34px) — ex.: feature block principal. w-8 em w-14. */
  title: { icon: 'w-8 h-8', container: 'w-14 h-14 rounded-2xl' },
  /** Ao lado de marketing-section (48px) — ex.: hero feature. w-10 em w-18. */
  section: { icon: 'w-10 h-10', container: 'w-18 h-18 rounded-2xl' },
} as const;

/**
 * Paddings internos do MarketingCard em contexto.
 * Referência: ≈ 1.5x do heading interno.
 */
export const MARKETING_CARD_PADDING = {
  /** Para card com Heading level="card" (16px): usar padding="md" do MarketingCard */
  overlay: 'md' as const,
  /** Para card com marketing-title (34px): usar padding="lg" do MarketingCard */
  feature: 'lg' as const,
} as const;

/**
 * Aspect ratios recomendados para imagens em BLOCKS.
 * Evitar `aspect-video` (16:9 = 1.77) em colunas largas porque a altura explode
 * e desbalanceia a relação com o texto lateral.
 */
export const MARKETING_ASPECT = {
  /** Block horizontal de serviço (imagem à esquerda + texto à direita). */
  block: 'aspect-4/3 md:aspect-16/10',
  /** Grid de equipe (retrato). */
  portrait: 'aspect-3/4',
  /** Hero circular/quadrado. */
  hero: 'aspect-square',
} as const;
