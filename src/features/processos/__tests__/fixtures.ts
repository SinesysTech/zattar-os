export const criarUsuarioMock = (overrides = {}) => ({
  id: 1,
  nomeCompleto: 'Test User',
  emailCorporativo: 'test@example.com',
  ...overrides,
});

export const criarPecaMock = (overrides = {}) => ({
  id: 1,
  processo_id: 100,
  storage_key: 'uploads/peca-123.pdf',
  content_type: 'application/pdf',
  nome_arquivo: 'peca-123.pdf',
  ...overrides,
});

export const criarAndamentoMock = (overrides = {}) => ({
  id: 1,
  processo_id: 100,
  descricao: 'Andamento de teste',
  data: '2024-01-15',
  ...overrides,
});

export const criarEmbeddingMock = (overrides = {}) => ({
  id: 1,
  entity_type: 'processo_peca',
  entity_id: 1,
  parent_id: 100,
  content: 'Conteúdo de teste',
  embedding: Array(1536).fill(0.1),
  metadata: {
    indexed_by: 1,
    content_type: 'application/pdf',
    storage_key: 'uploads/peca-123.pdf',
  },
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});
