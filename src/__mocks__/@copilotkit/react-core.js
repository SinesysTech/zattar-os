/**
 * Mock do @copilotkit/react-core para testes.
 * Evita importação transitiva de @a2ui/lit (ESM-only).
 */
module.exports = {
    useAgentContext: () => ({}),
    useCopilotContext: () => ({}),
    CopilotKit: ({ children }) => children,
};
