import { criarPacote } from '../pacote.service';
import type { TemplateBasico } from '../data.service';

jest.mock('@/lib/supabase/service-client', () => ({
  createServiceClient: jest.fn(),
}));
jest.mock('../documentos.service', () => ({
  createDocumentoFromUploadedPdf: jest.fn(),
}));

import { createServiceClient } from '@/lib/supabase/service-client';
import { createDocumentoFromUploadedPdf } from '../documentos.service';

interface SupabaseBuilder {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  eq: jest.Mock;
  gt: jest.Mock;
  maybeSingle: jest.Mock;
  single: jest.Mock;
  [key: string]: jest.Mock;
}

function makeBuilder(overrides: Partial<SupabaseBuilder> = {}): SupabaseBuilder {
  const b: SupabaseBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  return b;
}

const mockTemplate: TemplateBasico = {
  id: 1,
  template_uuid: 'u1',
  nome: 'Contrato',
  ativo: true,
  arquivo_original: 'x',
  campos: '[]',
};

const baseInput = {
  contratoId: 10,
  formularioId: 3,
  templatesComPdfs: [
    { template: mockTemplate, pdfBuffer: Buffer.from('fake'), titulo: 'Contrato' },
    { template: { ...mockTemplate, id: 2, template_uuid: 'u2', nome: 'Procuração' }, pdfBuffer: Buffer.from('fake'), titulo: 'Procuração' },
  ],
  clienteDadosSnapshot: { nome: 'João', cpf: '12345678900', email: 'joao@x.com' },
  userId: 99,
  overrides: {},
};

describe('criarPacote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reuses active pacote when one exists', async () => {
    const pacoteBuilder = makeBuilder({
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 42,
          token_compartilhado: 'existing-token',
          expira_em: '2026-05-01T00:00:00Z',
        },
        error: null,
      }),
    });
    const countBuilder = makeBuilder();
    countBuilder.select = jest.fn().mockReturnValue({
      ...countBuilder,
      eq: jest.fn().mockResolvedValue({ count: 4, error: null }),
    });

    const mockSupabase = {
      from: jest.fn()
        .mockReturnValueOnce(pacoteBuilder) // select existing pacote
        .mockReturnValueOnce(countBuilder),  // count pacote_documentos
    };
    (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);

    const result = await criarPacote(baseInput);

    expect(result.status).toBe('reaproveitado');
    expect(result.token).toBe('existing-token');
    expect(result.quantidadeDocs).toBe(4);
    expect(createDocumentoFromUploadedPdf).not.toHaveBeenCalled();
  });

  it('creates pacote + documents + junction rows when no active pacote exists', async () => {
    // Step 1: no existing pacote
    const selectExistingBuilder = makeBuilder({
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    // Step 2: insert pacote returns {id, token, expira_em}
    const insertPacoteBuilder = makeBuilder({
      single: jest.fn().mockResolvedValue({
        data: {
          id: 100,
          token_compartilhado: 'new-token',
          expira_em: '2026-04-23T00:00:00Z',
        },
        error: null,
      }),
    });

    // Step 3+: for each of the 2 templates: update doc.contrato_id + insert junction
    const updateDocBuilder = makeBuilder();
    const insertJunctionBuilder = makeBuilder();

    const mockSupabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'assinatura_digital_pacotes') {
          return mockSupabase.from.mock.calls.filter((c: string[]) => c[0] === 'assinatura_digital_pacotes').length === 1
            ? selectExistingBuilder
            : insertPacoteBuilder;
        }
        if (table === 'assinatura_digital_documentos') return updateDocBuilder;
        if (table === 'assinatura_digital_pacote_documentos') return insertJunctionBuilder;
        return makeBuilder();
      }),
    };
    (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);

    (createDocumentoFromUploadedPdf as jest.Mock).mockImplementation(async () => ({
      documento: { id: Math.floor(Math.random() * 1000), documento_uuid: 'uuid' },
      assinantes: [{ id: 1, token: 'assinante-token', public_link: '/assinatura/assinante-token' }],
    }));

    const result = await criarPacote(baseInput);

    expect(result.status).toBe('criado');
    expect(result.token).toBe('new-token');
    expect(result.quantidadeDocs).toBe(2);
    expect(createDocumentoFromUploadedPdf).toHaveBeenCalledTimes(2);
    // Verify update to set contrato_id happened twice (once per doc)
    expect(updateDocBuilder.update).toHaveBeenCalledTimes(2);
  });
});
