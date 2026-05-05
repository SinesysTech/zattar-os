import { construirPathArquivo, sanitizarNomeArquivo } from '../../service';

describe('service helpers', () => {
  describe('construirPathArquivo', () => {
    it('monta path no formato {base_slug}/{document_id}-{nome-slug}.{ext}', () => {
      const path = construirPathArquivo({
        baseSlug: 'jurisprudencia-tst',
        documentId: 42,
        nomeOriginal: 'Súmula 331 — Terceirização.pdf',
        extensao: 'pdf',
      });
      expect(path).toBe('jurisprudencia-tst/42-sumula-331-terceirizacao.pdf');
    });
  });

  describe('sanitizarNomeArquivo', () => {
    it('remove acentos e converte para kebab-case', () => {
      expect(sanitizarNomeArquivo('Ação Trabalhista — Modelo')).toBe('acao-trabalhista-modelo');
    });

    it('limita o tamanho a 80 caracteres', () => {
      const longo = 'a'.repeat(200);
      expect(sanitizarNomeArquivo(longo).length).toBeLessThanOrEqual(80);
    });

    it('preserva números', () => {
      expect(sanitizarNomeArquivo('Documento 2024 v2')).toBe('documento-2024-v2');
    });
  });
});
