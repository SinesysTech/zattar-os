module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Detecta secrets hardcoded no código',
      category: 'Security',
      recommended: true,
    },
    messages: {
      hardcodedSecret:
        'Possível secret hardcoded detectado: {{type}}. Use variáveis de ambiente.',
    },
  },
  create(context) {
    const secretPatterns = [
      { regex: /(?:password|senha)\s*[:=]\s*['"][^'"]{8,}['"]/i, type: 'password' },
      { regex: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{20,}['"]/i, type: 'API key' },
      { regex: /(?:token|bearer)\s*[:=]\s*['"][^'"]{20,}['"]/i, type: 'token' },
      { regex: /(?:secret|private[_-]?key)\s*[:=]\s*['"][^'"]{20,}['"]/i, type: 'secret' },
      { regex: /sk-[a-zA-Z0-9]{32,}/, type: 'OpenAI API key' },
      { regex: /ghp_[a-zA-Z0-9]{36}/, type: 'GitHub token' },
      { regex: /xox[baprs]-[a-zA-Z0-9-]{10,}/, type: 'Slack token' },
    ];

    return {
      Literal(node) {
        if (typeof node.value !== 'string') return;

        for (const { regex, type } of secretPatterns) {
          if (regex.test(node.value)) {
            context.report({
              node,
              messageId: 'hardcodedSecret',
              data: { type },
            });
            break;
          }
        }
      },
    };
  },
};
