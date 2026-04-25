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

    const TYPO_REGEX = /\b(text-(xs|sm|base|lg|xl|2xl|3xl)|font-(semibold|bold|medium)|leading-|tracking-)\b/;
    const SPACING_REGEX = /\b(p|px|py|pt|pb|pl|pr|m|mx|my|gap|space-(x|y))-[0-9.]+\b/;

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
