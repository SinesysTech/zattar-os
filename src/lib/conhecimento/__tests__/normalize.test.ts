import { normalizarTextoExtraido } from '../normalize';

describe('normalizarTextoExtraido', () => {
  it('remove marcadores de página', () => {
    expect(normalizarTextoExtraido('Texto -- 492 of 579 -- continua'))
      .toBe('Texto continua');
  });

  it('junta hifenizações de quebra de linha', () => {
    expect(normalizarTextoExtraido('empre-\ngados trabalham')).toBe('empregados trabalham');
  });

  it('colapsa múltiplos espaços em um', () => {
    expect(normalizarTextoExtraido('SUM-85,    II    Compensação    de    jornada'))
      .toBe('SUM-85, II Compensação de jornada');
  });

  it('preserva parágrafos (\\n\\n)', () => {
    const input = 'Parágrafo 1\n\nParágrafo 2';
    expect(normalizarTextoExtraido(input)).toBe('Parágrafo 1\n\nParágrafo 2');
  });

  it('converte newlines simples em espaço (linhas visuais do PDF)', () => {
    expect(normalizarTextoExtraido('linha 1\nlinha 2\nlinha 3'))
      .toBe('linha 1 linha 2 linha 3');
  });

  it('colapsa múltiplos newlines em \\n\\n', () => {
    expect(normalizarTextoExtraido('a\n\n\n\nb')).toBe('a\n\nb');
  });

  it('trim final', () => {
    expect(normalizarTextoExtraido('   texto   ')).toBe('texto');
  });
});
