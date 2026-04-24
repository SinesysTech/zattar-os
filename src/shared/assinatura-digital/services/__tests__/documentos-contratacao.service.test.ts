import { gerarZipPdfsContratacao } from '../documentos-contratacao.service';
import type { TemplateBasico } from '@/shared/assinatura-digital/services/data.service';
import type { DadosContratoParaMapping } from '../mapeamento-contrato-input-data';
import type {
  FormularioComTemplates,
  PacoteTemplatesContratacao,
} from '../documentos-contratacao.service';

jest.mock('@/shared/assinatura-digital/services/template-pdf.service', () => ({
  generatePdfFromTemplate: jest.fn(async (template: TemplateBasico) =>
    Buffer.from(`fake-pdf-${template.nome}`),
  ),
}));

const mockDados: DadosContratoParaMapping = {
  contrato: { id: 1, segmento_id: 1, cliente_id: 10 },
  cliente: {
    id: 10,
    nome: 'João Teste',
    tipo_pessoa: 'pf',
    cpf: '12345678900',
    rg: 'MG-1',
    nacionalidade: 'brasileira',
    estado_civil: 'solteiro',
    ddd_celular: '31',
    numero_celular: '999998888',
    emails: ['j@x.com'],
    endereco: {
      logradouro: 'R', numero: '1', bairro: 'B', municipio: 'BH',
      estado_sigla: 'MG', cep: '30100000',
    },
  },
  partes: [
    { tipo_entidade: 'parte_contraria', papel_contratual: 're', nome_snapshot: 'Acme', ordem: 1 },
  ],
};

const mockTemplates: TemplateBasico[] = [
  { id: 1, template_uuid: 'u1', nome: 'Contrato', ativo: true, arquivo_original: 'a', campos: '[]' },
  { id: 2, template_uuid: 'u2', nome: 'Procuração', ativo: true, arquivo_original: 'b', campos: '[]' },
];

const segmentoMock = { id: 1, nome: 'Trabalhista', slug: 'trabalhista', ativo: true };

const formularioMock: FormularioComTemplates = {
  id: 3, formulario_uuid: 'f-uuid', nome: 'Contratação', slug: 'contratacao',
  segmento_id: 1, ativo: true, ordem: 0, template_ids: ['u1', 'u2'],
  segmento: segmentoMock,
};

const pacoteMock: PacoteTemplatesContratacao = {
  segmento: segmentoMock,
  formularios: [formularioMock],
  formularioPrincipal: formularioMock,
  templateUuidsUnificados: ['u1', 'u2'],
};

describe('gerarZipPdfsContratacao', () => {
  it('produces a Buffer zip containing one PDF per template, named by template', async () => {
    const zipBuffer = await gerarZipPdfsContratacao({
      dados: mockDados,
      templates: mockTemplates,
      pacote: pacoteMock,
    });

    expect(Buffer.isBuffer(zipBuffer)).toBe(true);

    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(zipBuffer);
    const filenames = Object.keys(zip.files).sort();
    expect(filenames).toEqual(['Contrato.pdf', 'Procuração.pdf']);
  });

  it('propagates errors from merge (does not build partial zip)', async () => {
    const { generatePdfFromTemplate } = await import(
      '@/shared/assinatura-digital/services/template-pdf.service'
    );
    (generatePdfFromTemplate as jest.Mock).mockRejectedValueOnce(
      new Error('pdf merge failed'),
    );

    await expect(
      gerarZipPdfsContratacao({
        dados: mockDados,
        templates: mockTemplates,
        pacote: pacoteMock,
      }),
    ).rejects.toThrow('pdf merge failed');
  });

  it('when pacote has two formularios, ctx uses formularioPrincipal and templates are merged deduplicated', async () => {
    const extra: FormularioComTemplates = {
      ...formularioMock,
      id: 4, formulario_uuid: 'f-uuid-2', nome: 'Complementar', slug: 'complementar',
      ordem: 1, template_ids: ['u2', 'u3'], // u2 duplicado com o principal
    };
    const u3: TemplateBasico = {
      id: 3, template_uuid: 'u3', nome: 'Anexo', ativo: true, arquivo_original: 'c', campos: '[]',
    };

    const pacoteMulti: PacoteTemplatesContratacao = {
      segmento: segmentoMock,
      formularios: [formularioMock, extra],
      formularioPrincipal: formularioMock, // primeiro por ordem
      templateUuidsUnificados: ['u1', 'u2', 'u3'], // dedup preservando ordem
    };

    const zipBuffer = await gerarZipPdfsContratacao({
      dados: mockDados,
      templates: [...mockTemplates, u3],
      pacote: pacoteMulti,
    });

    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(zipBuffer);
    const filenames = Object.keys(zip.files).sort();
    expect(filenames).toEqual(['Anexo.pdf', 'Contrato.pdf', 'Procuração.pdf']);
  });
});
