import {
  KnowledgeBaseSchema,
  KnowledgeDocumentSchema,
  KnowledgeChunkSchema,
  CriarBaseInputSchema,
  CriarDocumentoInputSchema,
  BuscarConhecimentoInputSchema,
  type StatusDocumento,
} from '../../domain';

describe('domain schemas', () => {
  it('KnowledgeBaseSchema valida base completa', () => {
    const valid = {
      id: 1,
      nome: 'Jurisprudência TST',
      slug: 'jurisprudencia-tst',
      descricao: 'Súmulas e OJs do TST',
      cor: '#0EA5E9',
      icone: 'gavel',
      total_documentos: 12,
      total_chunks: 340,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(() => KnowledgeBaseSchema.parse(valid)).not.toThrow();
  });

  it('CriarBaseInputSchema rejeita slug com espaços', () => {
    expect(() => CriarBaseInputSchema.parse({ nome: 'X', slug: 'tem espaco' }))
      .toThrow();
  });

  it('CriarBaseInputSchema aceita slug kebab-case', () => {
    expect(() => CriarBaseInputSchema.parse({ nome: 'X', slug: 'meu-slug' }))
      .not.toThrow();
  });

  it('CriarDocumentoInputSchema rejeita arquivo > 50MB', () => {
    expect(() => CriarDocumentoInputSchema.parse({
      base_id: 1,
      nome: 'doc.pdf',
      arquivo_tipo: 'pdf',
      arquivo_tamanho_bytes: 60 * 1024 * 1024,
    })).toThrow(/50/);
  });

  it('BuscarConhecimentoInputSchema aplica defaults', () => {
    const result = BuscarConhecimentoInputSchema.parse({ query: 'teste' });
    expect(result.limit).toBe(8);
    expect(result.threshold).toBe(0.7);
  });

  it('StatusDocumento aceita apenas valores conhecidos', () => {
    const statuses: StatusDocumento[] = ['pending', 'processing', 'indexed', 'failed'];
    statuses.forEach((s) => {
      expect(() => KnowledgeDocumentSchema.shape.status.parse(s)).not.toThrow();
    });
    expect(() => KnowledgeDocumentSchema.shape.status.parse('unknown')).toThrow();
  });
});
