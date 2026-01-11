import { sanitizeForLogs } from '@/lib/utils/sanitize-logs';

describe('sanitizeForLogs', () => {
  it('redacts sensitive keys', () => {
    const input = {
      password: 'supersecret123',
      senha: 'minhasenha',
      token: 'abcd'.repeat(10),
      apiKey: 'a'.repeat(32),
      api_key: 'b'.repeat(32),
      authorization: 'Bearer abc.def.ghi',
      nested: {
        secret: 'shhh',
      },
    };

    expect(sanitizeForLogs(input)).toEqual({
      password: '[REDACTED]',
      senha: '[REDACTED]',
      token: '[REDACTED]',
      apiKey: '[REDACTED]',
      api_key: '[REDACTED]',
      authorization: '[REDACTED]',
      nested: {
        secret: '[REDACTED]',
      },
    });
  });

  it('masks CPF and CNPJ', () => {
    expect(sanitizeForLogs({ cpf: '123.456.789-10' })).toEqual({ cpf: '123***' });
    expect(sanitizeForLogs({ cpf: '12345678910' })).toEqual({ cpf: '123***' });

    expect(sanitizeForLogs({ cnpj: '12.345.678/0001-90' })).toEqual({ cnpj: '123***' });
    expect(sanitizeForLogs({ cnpj: '12345678000190' })).toEqual({ cnpj: '123***' });
  });

  it('masks emails', () => {
    expect(sanitizeForLogs({ email: 'abcdef@domain.com' })).toEqual({
      email: 'abc***@domain.com',
    });
  });

  it('supports nested objects and arrays', () => {
    const input = {
      users: [
        {
          email: 'john.doe@example.com',
          cpf: '11122233344',
        },
      ],
      meta: {
        bearer: 'Bearer xyz',
      },
    };

    expect(sanitizeForLogs(input)).toEqual({
      users: [
        {
          email: 'joh***@example.com',
          cpf: '111***',
        },
      ],
      meta: {
        bearer: '[REDACTED]',
      },
    });
  });

  it('truncates long strings (>100 chars)', () => {
    const long = 'x'.repeat(150);
    const result = sanitizeForLogs({ message: long }) as { message: string };

    expect(result.message.length).toBe(103);
    expect(result.message.endsWith('...')).toBe(true);
  });

  it('handles null and undefined', () => {
    expect(sanitizeForLogs({ a: null, b: undefined })).toEqual({ a: null, b: undefined });
  });
});
