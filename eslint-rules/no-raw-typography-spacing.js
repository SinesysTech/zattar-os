/**
 * ESLint rule: no-raw-typography-spacing
 *
 * Proíbe o uso de classes Tailwind cruas para tipografia e espaçamento em módulos
 * do produto (authenticated/shared), forçando o uso das primitivas do Design System:
 * - <Heading>, <Text>
 * - <Stack>, <Inline>, <Inset>
 *
 * Excessões:
 * - src/components/ui/** (onde as primitivas são definidas)
 * - src/lib/design-system/**
 * - Comentário: // design-system-escape: <motivo>
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ESCOPO DA REGRA — atualizado pós Wave 10 (audit do design system).
 *
 * FLAGAR (existem tokens DS canônicos, exigir migração):
 * - text-(xs|sm|base|lg|xl|2xl|3xl) → <Text variant=...>/<Heading level=...>
 *   ou tokens text-caption/body-sm/body/body-lg/page-title/section-title/etc.
 * - font-(bold|semibold|medium) em <Text>/<Heading> → prop weight
 *   (em outros wrappers: aceito como className)
 * - p-(N) uniforme → <Inset variant=...> (inset-card-compact/dialog/etc.)
 * - gap-(N) → tokens inline-* (nano/micro/snug/tight/medium/default/loose/extra-loose)
 * - space-y-(N) → tokens stack-* (mesma escala)
 *
 * NÃO FLAGAR (uso legítimo de Tailwind, aceito como escape do DS):
 * - leading-*: line-height é ajuste fino caso-a-caso (cada token Text/Heading
 *   já inclui line-height apropriado; ajustes pontuais são intencionais)
 * - tracking-*: letter-spacing é modificador sub-tipográfico
 * - px-N/py-N/pt-N/pb-N/pl-N/pr-N: padding direcional inerente caso-a-caso
 *   (47 patterns únicos detectados — tokenizar seria explosão combinatorial)
 * - m-N/mx-N/my-N: margens são ad-hoc (mx-auto centralizar, my-2 separadores)
 * - space-x-N: espaçamento horizontal raro — usar gap-* via Inline
 * ────────────────────────────────────────────────────────────────────────────
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Proibir classes Tailwind cruas de tipografia e espaçamento',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [],
    messages: {
      rawTypography: 'Não use classes de tipografia cruas "{{match}}". Use <Heading> ou <Text> do Design System.',
      rawSpacing: 'Não use classes de espaçamento cruas "{{match}}". Use <Stack>, <Inline> ou <Inset> do Design System.',
    },
  },
  create(context) {
    const filename = context.getFilename();

    // Isentar arquivos de infra do design system e UI primitives
    if (
      filename.includes('src/components/ui/') ||
      filename.includes('src/lib/design-system/') ||
      filename.includes('globals.css') ||
      filename.includes('design-system/') ||
      filename.includes('src/app/website/')
    ) {
      return {};
    }

    // Apenas aplicar em arquivos de componentes/páginas (authenticated)
    if (!filename.includes('src/app/(authenticated)/')) {
      return {};
    }

    // Tipografia que tem token canônico DS (Wave 5/9):
    // - text-(xs/sm/base/lg/xl/2xl/3xl) → <Text variant>/<Heading level>
    // - font-(bold/semibold/medium) → prop weight em Text/Heading
    // Tracking e leading NÃO são flagrados (modificadores legítimos).
    const TYPO_REGEX = /\b(text-(xs|sm|base|lg|xl|2xl|3xl)|font-(semibold|bold|medium))\b/;

    // Espaçamento uniforme que tem token canônico DS (Waves 6/7/8):
    // - p-N (padding uniforme) → <Inset variant>
    // - gap-N → tokens inline-*
    // - space-y-N → tokens stack-*
    // NÃO flagrar: padding direcional (px/py/pt/pb/pl/pr), margens (m/mx/my),
    // space-x (raro, deveria virar gap via Inline).
    const SPACING_REGEX = /\b(p|gap|space-y)-[0-9.]+\b/;

    function checkLiteral(node) {
      if (typeof node.value !== 'string') return;

      // Verificar comentário de escape
      const sourceCode = context.getSourceCode();
      const comments = sourceCode.getCommentsBefore(node);
      const isEscaped = comments.some(c => c.value.includes('design-system-escape'));
      if (isEscaped) return;

      const typoMatch = node.value.match(TYPO_REGEX);
      if (typoMatch) {
        context.report({
          node,
          messageId: 'rawTypography',
          data: { match: typoMatch[0] },
        });
      }

      const spacingMatch = node.value.match(SPACING_REGEX);
      if (spacingMatch) {
        context.report({
          node,
          messageId: 'rawSpacing',
          data: { match: spacingMatch[0] },
        });
      }
    }

    return {
      Literal: checkLiteral,
      JSXAttribute(node) {
        if (node.name.name === 'className' && node.value && node.value.type === 'Literal') {
          checkLiteral(node.value);
        }
      },
      CallExpression(node) {
        // Capturar cn('...')
        if (node.callee.name === 'cn') {
          node.arguments.forEach(arg => {
            if (arg.type === 'Literal') checkLiteral(arg);
          });
        }
      },
    };
  },
};
