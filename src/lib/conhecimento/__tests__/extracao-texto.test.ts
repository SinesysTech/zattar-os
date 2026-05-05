import { extrairTexto, type FormatoArquivo } from '../extracao-texto';
import { PDFParse } from 'pdf-parse';

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    load: jest.fn(async () => undefined),
    getText: jest.fn(async () => ({ text: 'Texto extraído do PDF de teste' })),
  })),
}));

jest.mock('mammoth', () => ({
  extractRawText: jest.fn(async () => ({
    value: 'Texto extraído do DOCX de teste',
    messages: [],
  })),
}));

describe('extrairTexto', () => {
  it('extrai texto de TXT (UTF-8)', async () => {
    const buf = Buffer.from('Conteúdo simples em UTF-8 com acentos: ção, são.', 'utf-8');
    const result = await extrairTexto(buf, 'txt');
    expect(result).toContain('Conteúdo simples');
    expect(result).toContain('ção');
  });

  it('extrai texto de MD removendo marcadores básicos opcionalmente', async () => {
    const md = '# Título\n\n**negrito** e *itálico*.';
    const buf = Buffer.from(md, 'utf-8');
    const result = await extrairTexto(buf, 'md');
    // markdown é tratado como texto puro (preserva sintaxe)
    expect(result).toContain('Título');
    expect(result).toContain('negrito');
  });

  it('extrai texto de HTML removendo tags', async () => {
    const html = '<html><body><h1>Título</h1><p>Parágrafo com <strong>negrito</strong>.</p><script>alert(1)</script></body></html>';
    const buf = Buffer.from(html, 'utf-8');
    const result = await extrairTexto(buf, 'html');
    expect(result).toContain('Título');
    expect(result).toContain('Parágrafo com negrito');
    expect(result).not.toContain('<h1>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert(1)');
  });

  it('extrai texto de PDF via pdf-parse', async () => {
    const buf = Buffer.from('fake pdf bytes');
    const result = await extrairTexto(buf, 'pdf');
    expect(result).toBe('Texto extraído do PDF de teste');
  });

  it('extrai texto de DOCX via mammoth', async () => {
    const buf = Buffer.from('fake docx bytes');
    const result = await extrairTexto(buf, 'docx');
    expect(result).toBe('Texto extraído do DOCX de teste');
  });

  it('rejeita formato desconhecido', async () => {
    const buf = Buffer.from('x');
    await expect(extrairTexto(buf, 'xyz' as FormatoArquivo))
      .rejects.toThrow('Formato não suportado: xyz');
  });

  it('lança erro descritivo quando PDF parser falha', async () => {
    (PDFParse as jest.Mock).mockImplementationOnce(() => ({
      load: jest.fn(async () => { throw new Error('PDF malformado'); }),
      getText: jest.fn(),
    }));
    const buf = Buffer.from('bad');
    await expect(extrairTexto(buf, 'pdf'))
      .rejects.toThrow(/PDF malformado/);
  });

  it('rejeita texto vazio extraído', async () => {
    (PDFParse as jest.Mock).mockImplementationOnce(() => ({
      load: jest.fn(async () => undefined),
      getText: jest.fn(async () => ({ text: '   ' })),
    }));
    const buf = Buffer.from('empty');
    await expect(extrairTexto(buf, 'pdf'))
      .rejects.toThrow('Texto extraído está vazio');
  });
});
