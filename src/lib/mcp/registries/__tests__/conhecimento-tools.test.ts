jest.mock('../../server', () => {
  const registered: Array<{ name: string; feature: string; requiresAuth: boolean }> = [];
  return {
    registerMcpTool: jest.fn((tool: { name: string; feature: string; requiresAuth: boolean }) => {
      registered.push(tool);
    }),
    __getRegistered: () => registered,
  };
});

jest.mock('@/lib/supabase/service-client', () => ({
  createServiceClient: jest.fn(),
}));

jest.mock('@/lib/ai/embedding', () => ({
  gerarEmbedding: jest.fn(),
}));

import { registerConhecimentoTools } from '../conhecimento-tools';

describe('registerConhecimentoTools', () => {
  beforeEach(() => {
    const { registerMcpTool } = require('../../server');
    (registerMcpTool as jest.Mock).mockClear();
  });

  it('registra exatamente 2 tools', async () => {
    await registerConhecimentoTools();
    const { registerMcpTool } = require('../../server');
    const calls = (registerMcpTool as jest.Mock).mock.calls.map((c: [{ name: string }]) => c[0].name);
    expect(calls).toEqual(
      expect.arrayContaining(['listar_bases_conhecimento', 'buscar_conhecimento'])
    );
    expect(calls).toHaveLength(2);
  });

  it('todas as tools têm requiresAuth=true e feature=conhecimento', async () => {
    const { registerMcpTool } = require('../../server');
    await registerConhecimentoTools();
    const calls = (registerMcpTool as jest.Mock).mock.calls.map((c: [{ requiresAuth: boolean; feature: string }]) => c[0]);
    calls.forEach((tool: { requiresAuth: boolean; feature: string }) => {
      expect(tool.requiresAuth).toBe(true);
      expect(tool.feature).toBe('conhecimento');
    });
  });
});
