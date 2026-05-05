import { chunkText, type ChunkOptions } from '../chunking';

describe('chunkText', () => {
  it('retorna um único chunk se o texto cabe inteiro', () => {
    const text = 'Texto curto.';
    const result = chunkText(text, { targetTokens: 100, overlapTokens: 20 });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      conteudo: 'Texto curto.',
      posicao: 0,
      tokens: expect.any(Number),
    });
  });

  it('divide texto longo em múltiplos chunks com overlap', () => {
    const paragraphs = Array.from({ length: 30 }, (_, i) =>
      `Parágrafo número ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`
    );
    const text = paragraphs.join('\n\n');

    const result = chunkText(text, { targetTokens: 100, overlapTokens: 20 });

    expect(result.length).toBeGreaterThan(1);
    expect(result[0].posicao).toBe(0);
    expect(result[1].posicao).toBe(1);
    // chunks consecutivos devem ter overlap (parte do final de um aparece no começo do próximo)
    const fimDoPrimeiro = result[0].conteudo.slice(-50);
    expect(result[1].conteudo).toContain(fimDoPrimeiro.split('\n').at(-1)?.slice(0, 20) ?? '');
  });

  it('preserva ordem original dos parágrafos', () => {
    const text = ['Alpha.', 'Beta.', 'Gamma.'].join('\n\n').repeat(20);
    const result = chunkText(text, { targetTokens: 50, overlapTokens: 10 });
    const fullJoined = result.map((c) => c.conteudo).join(' ');
    const alphaIndex = fullJoined.indexOf('Alpha');
    const betaIndex = fullJoined.indexOf('Beta');
    const gammaIndex = fullJoined.indexOf('Gamma');
    expect(alphaIndex).toBeLessThan(betaIndex);
    expect(betaIndex).toBeLessThan(gammaIndex);
  });

  it('respeita separadores semânticos (não quebra no meio de palavra)', () => {
    const text = 'A '.repeat(500) + '. ' + 'B '.repeat(500);
    const result = chunkText(text, { targetTokens: 200, overlapTokens: 30 });
    result.forEach((chunk) => {
      // não deve terminar com letra solta (palavra cortada)
      expect(chunk.conteudo).not.toMatch(/\s[A-Za-z]$/);
    });
  });

  it('rejeita texto vazio', () => {
    expect(() => chunkText('', { targetTokens: 100, overlapTokens: 20 }))
      .toThrow('Texto vazio');
  });

  it('rejeita opções inválidas', () => {
    expect(() => chunkText('texto', { targetTokens: 0, overlapTokens: 0 }))
      .toThrow('targetTokens deve ser positivo');
    expect(() => chunkText('texto', { targetTokens: 100, overlapTokens: 100 }))
      .toThrow('overlapTokens deve ser menor que targetTokens');
  });

  it('estima tokens por heurística chars/4 quando tiktoken indisponível', () => {
    const text = 'a'.repeat(400);
    const result = chunkText(text, { targetTokens: 100, overlapTokens: 20 });
    expect(result[0].tokens).toBeGreaterThanOrEqual(90);
    expect(result[0].tokens).toBeLessThanOrEqual(110);
  });
});
