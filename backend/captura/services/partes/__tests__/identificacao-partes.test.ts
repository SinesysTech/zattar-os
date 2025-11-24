/**
 * Testes Unitários: identificacao-partes.service.ts
 *
 * PROPÓSITO:
 * Validar a lógica de identificação automática de tipos de parte:
 * - cliente (representado por nosso advogado)
 * - parte_contraria (não representado por nós)
 * - terceiro (tipo especial: perito, MP, etc.)
 *
 * EXECUÇÃO:
 * npx tsx backend/captura/services/partes/__tests__/identificacao-partes.test.ts
 */

import {
  identificarTipoParte,
  normalizarCpf,
  isTipoEspecial,
  type AdvogadoIdentificacao,
} from '../identificacao-partes.service';
import type { PartePJE, RepresentantePJE } from '@/backend/api/pje-trt/partes/types';

// ============================================================================
// HELPERS DE TESTE
// ============================================================================

let testsPassed = 0;
let testsFailed = 0;
let currentTestSuite = '';

function describe(suiteName: string, fn: () => void) {
  currentTestSuite = suiteName;
  console.log(`\n📦 ${suiteName}`);
  fn();
}

function it(testName: string, fn: () => void) {
  try {
    fn();
    testsPassed++;
    console.log(`  ✅ ${testName}`);
  } catch (error) {
    testsFailed++;
    console.log(`  ❌ ${testName}`);
    console.log(`     ${error instanceof Error ? error.message : String(error)}`);
  }
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: any) {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${expectedStr}, but got ${actualStr}`);
      }
    },
    toThrow() {
      let threw = false;
      try {
        if (typeof actual === 'function') {
          actual();
        }
      } catch {
        threw = true;
      }
      if (!threw) {
        throw new Error('Expected function to throw, but it did not');
      }
    },
  };
}

// ============================================================================
// MOCKS DE DADOS
// ============================================================================

const mockAdvogado: AdvogadoIdentificacao = {
  id: 1,
  cpf: '123.456.789-00',
  nome: 'Dr. João Silva',
};

type ParteOverrides = Partial<Omit<PartePJE, 'representantes'>> & {
  representantes?: Array<Partial<RepresentantePJE>>;
};

const createParteMock = (overrides: ParteOverrides = {}): PartePJE => {
  const { representantes, ...rest } = overrides;

  return {
    idParte: 12345,
    idPessoa: 67890,
    nome: 'Maria Santos',
    tipoParte: 'AUTOR',
    polo: 'ATIVO',
    numeroDocumento: '987.654.321-00',
    tipoDocumento: 'CPF',
    emails: [],
    telefones: [],
    principal: true,
    representantes: representantes
      ? representantes.map((rep) =>
          createRepresentanteMock(rep as Partial<RepresentantePJE>)
        )
      : [],
    dadosCompletos: {},
    ...rest,
  };
};

const createRepresentanteMock = (
  overrides: Partial<RepresentantePJE> = {}
): RepresentantePJE => ({
  idPessoa: overrides.idPessoa ?? 1,
  nome: overrides.nome ?? 'Dr. Representante',
  tipoDocumento: overrides.tipoDocumento ?? 'CPF',
  numeroDocumento: overrides.numeroDocumento ?? '00000000000',
  numeroOAB: overrides.numeroOAB ?? null,
  ufOAB: overrides.ufOAB ?? null,
  situacaoOAB: overrides.situacaoOAB ?? null,
  tipo: overrides.tipo ?? 'ADVOGADO',
  email: overrides.email ?? null,
  telefones: overrides.telefones ?? [],
  dadosCompletos: overrides.dadosCompletos ?? {},
});

// ============================================================================
// TESTES: normalizarCpf
// ============================================================================

describe('normalizarCpf()', () => {
  it('deve remover pontos e hífens', () => {
    expect(normalizarCpf('123.456.789-00')).toBe('12345678900');
  });

  it('deve remover espaços', () => {
    expect(normalizarCpf(' 123 456 789 00 ')).toBe('12345678900');
  });

  it('deve retornar vazio se CPF for vazio', () => {
    expect(normalizarCpf('')).toBe('');
  });

  it('deve retornar vazio se CPF for null/undefined', () => {
    expect(normalizarCpf(null as any)).toBe('');
    expect(normalizarCpf(undefined as any)).toBe('');
  });

  it('deve preservar apenas números', () => {
    expect(normalizarCpf('abc123def456ghi789jkl00')).toBe('12345678900');
  });

  it('deve lidar com CPF já normalizado', () => {
    expect(normalizarCpf('12345678900')).toBe('12345678900');
  });
});

// ============================================================================
// TESTES: isTipoEspecial
// ============================================================================

describe('isTipoEspecial()', () => {
  it('deve identificar PERITO como tipo especial', () => {
    expect(isTipoEspecial('PERITO')).toBe(true);
  });

  it('deve identificar MINISTERIO_PUBLICO como tipo especial', () => {
    expect(isTipoEspecial('MINISTERIO_PUBLICO')).toBe(true);
  });

  it('deve identificar AMICUS_CURIAE como tipo especial', () => {
    expect(isTipoEspecial('AMICUS_CURIAE')).toBe(true);
  });

  it('deve identificar CUSTOS_LEGIS como tipo especial', () => {
    expect(isTipoEspecial('CUSTOS_LEGIS')).toBe(true);
  });

  it('não deve identificar AUTOR como tipo especial', () => {
    expect(isTipoEspecial('AUTOR')).toBe(false);
  });

  it('não deve identificar REU como tipo especial', () => {
    expect(isTipoEspecial('REU')).toBe(false);
  });

  it('não deve identificar RECLAMANTE como tipo especial', () => {
    expect(isTipoEspecial('RECLAMANTE')).toBe(false);
  });

  it('não deve identificar RECLAMADA como tipo especial', () => {
    expect(isTipoEspecial('RECLAMADA')).toBe(false);
  });

  it('deve ser case-insensitive', () => {
    expect(isTipoEspecial('perito')).toBe(true);
    expect(isTipoEspecial('Perito')).toBe(true);
    expect(isTipoEspecial('PERITO')).toBe(true);
  });

  it('deve retornar false para tipo vazio', () => {
    expect(isTipoEspecial('')).toBe(false);
  });

  it('deve retornar false para null/undefined', () => {
    expect(isTipoEspecial(null as any)).toBe(false);
    expect(isTipoEspecial(undefined as any)).toBe(false);
  });
});

// ============================================================================
// TESTES: identificarTipoParte - Validações
// ============================================================================

describe('identificarTipoParte() - Validações', () => {
  it('deve lançar erro se parte for null', () => {
    expect(() => identificarTipoParte(null as any, mockAdvogado)).toThrow();
  });

  it('deve lançar erro se advogado for null', () => {
    const parte = createParteMock();
    expect(() => identificarTipoParte(parte, null as any)).toThrow();
  });

  it('deve lançar erro se CPF do advogado estiver ausente', () => {
    const parte = createParteMock();
    const advogadoSemCpf = { id: 1, cpf: '', nome: 'Dr. João' };
    expect(() => identificarTipoParte(parte, advogadoSemCpf)).toThrow();
  });
});

// ============================================================================
// TESTES: identificarTipoParte - Tipos Especiais (Terceiros)
// ============================================================================

describe('identificarTipoParte() - Tipos Especiais (Terceiros)', () => {
  it('deve classificar PERITO como terceiro', () => {
    const parte = createParteMock({
      tipoParte: 'PERITO',
      nome: 'Dr. Carlos Perito',
      representantes: [],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('terceiro');
  });

  it('deve classificar MINISTERIO_PUBLICO como terceiro', () => {
    const parte = createParteMock({
      tipoParte: 'MINISTERIO_PUBLICO',
      nome: 'Ministério Público do Trabalho',
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('terceiro');
  });

  it('deve classificar PERITO mesmo com representante do escritório', () => {
    const parte = createParteMock({
      tipoParte: 'PERITO',
      nome: 'Dr. Carlos Perito',
      representantes: [
        createRepresentanteMock({
          idPessoa: 1,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00', // Mesmo CPF do advogado!
          tipoDocumento: 'CPF',
        }),
      ],
    });
    // Tipo especial tem PRIORIDADE sobre representante
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('terceiro');
  });

  it('deve classificar AMICUS_CURIAE como terceiro', () => {
    const parte = createParteMock({
      tipoParte: 'AMICUS_CURIAE',
      nome: 'Sindicato Amicus',
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('terceiro');
  });
});

// ============================================================================
// TESTES: identificarTipoParte - Cliente (Representado por nós)
// ============================================================================

describe('identificarTipoParte() - Cliente', () => {
  it('deve identificar cliente com CPF formatado idêntico', () => {
    const parte = createParteMock({
      tipoParte: 'AUTOR',
      nome: 'Maria Santos',
      representantes: [
        createRepresentanteMock({
          idPessoa: 1,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00', // Mesmo CPF do advogado
          tipoDocumento: 'CPF',
        }),
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('cliente');
  });

  it('deve identificar cliente com CPF sem formatação', () => {
    const parte = createParteMock({
      tipoParte: 'RECLAMANTE',
      representantes: [
        createRepresentanteMock({
          idPessoa: 1,
          nome: 'Dr. João Silva',
          numeroDocumento: '12345678900', // Sem formatação
          tipoDocumento: 'CPF',
        }),
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('cliente');
  });

  it('deve identificar cliente quando advogado CPF não formatado', () => {
    const advogadoSemFormatacao: AdvogadoIdentificacao = {
      id: 1,
      cpf: '12345678900',
      nome: 'Dr. João Silva',
    };
    const parte = createParteMock({
      representantes: [
        createRepresentanteMock({
          idPessoa: 1,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00', // Com formatação
          tipoDocumento: 'CPF',
        }),
      ],
    });
    expect(identificarTipoParte(parte, advogadoSemFormatacao)).toBe('cliente');
  });

  it('deve identificar cliente entre múltiplos representantes', () => {
    const parte = createParteMock({
      representantes: [
        createRepresentanteMock({
          idPessoa: 1,
          nome: 'Dra. Maria Oliveira',
          numeroDocumento: '111.222.333-44',
          tipoDocumento: 'CPF',
        }),
        createRepresentanteMock({
          idPessoa: 2,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00', // Match!
          tipoDocumento: 'CPF',
        }),
        createRepresentanteMock({
          idPessoa: 3,
          nome: 'Dr. Pedro Costa',
          numeroDocumento: '555.666.777-88',
          tipoDocumento: 'CPF',
        }),
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('cliente');
  });

  it('deve ignorar representantes com CPF null', () => {
    const parte = createParteMock({
      representantes: [
        createRepresentanteMock({
          idPessoa: 1,
          nome: 'Defensor Público',
          numeroDocumento: null as any,
          tipoDocumento: 'CPF',
        }),
        createRepresentanteMock({
          idPessoa: 2,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00', // Match!
          tipoDocumento: 'CPF',
        }),
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('cliente');
  });

  it('deve ignorar representantes com CPF vazio', () => {
    const parte = createParteMock({
      representantes: [
        createRepresentanteMock({
          idPessoa: 1,
          nome: 'Sem CPF',
          numeroDocumento: '',
          tipoDocumento: 'CPF',
        }),
        createRepresentanteMock({
          idPessoa: 2,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00',
          tipoDocumento: 'CPF',
        }),
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('cliente');
  });
});

// ============================================================================
// TESTES: identificarTipoParte - Parte Contrária
// ============================================================================

describe('identificarTipoParte() - Parte Contrária', () => {
  it('deve classificar como parte contrária quando sem representantes', () => {
    const parte = createParteMock({
      tipoParte: 'REU',
      nome: 'Empresa XYZ Ltda',
      representantes: [],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('parte_contraria');
  });

  it('deve classificar como parte contrária quando representantes não batem', () => {
    const parte = createParteMock({
      tipoParte: 'RECLAMADA',
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dra. Maria Oliveira',
          numeroDocumento: '111.222.333-44',
          tipoDocumento: 'CPF',
        },
        {
          idPessoa: 2,
          nome: 'Dr. Pedro Costa',
          numeroDocumento: '555.666.777-88',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('parte_contraria');
  });

  it('deve classificar como parte contrária quando representantes sem CPF', () => {
    const parte = createParteMock({
      representantes: [
        {
          idPessoa: 1,
          nome: 'Defensor Público',
          numeroDocumento: null as any,
          tipoDocumento: 'CPF',
        },
        {
          idPessoa: 2,
          nome: 'Outro Defensor',
          numeroDocumento: '',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('parte_contraria');
  });

  it('deve classificar como parte contrária quando CPF diferente por 1 dígito', () => {
    const parte = createParteMock({
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dr. Quase João',
          numeroDocumento: '123.456.789-01', // Último dígito diferente
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('parte_contraria');
  });
});

// ============================================================================
// TESTES: identificarTipoParte - Edge Cases
// ============================================================================

describe('identificarTipoParte() - Edge Cases', () => {
  it('deve lidar com array de representantes undefined', () => {
    const parte = createParteMock({
      tipoParte: 'AUTOR',
      representantes: undefined as any,
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('parte_contraria');
  });

  it('deve lidar com tipoParte em maiúsculas', () => {
    const parte = createParteMock({
      tipoParte: 'PERITO_CONTADOR',
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('terceiro');
  });

  it('deve priorizar tipo especial mesmo com match de CPF', () => {
    const parte = createParteMock({
      tipoParte: 'ASSISTENTE_TECNICO',
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00',
          tipoDocumento: 'CPF',
        },
      ],
    });
    // Tipo especial tem prioridade
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('terceiro');
  });

  it('deve lidar com CPF com espaços extras', () => {
    const parte = createParteMock({
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dr. João Silva',
          numeroDocumento: '  123.456.789-00  ',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('cliente');
  });

  it('deve lidar com advogado CPF com espaços', () => {
    const advogadoComEspacos: AdvogadoIdentificacao = {
      id: 1,
      cpf: '  123.456.789-00  ',
      nome: 'Dr. João Silva',
    };
    const parte = createParteMock({
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, advogadoComEspacos)).toBe('cliente');
  });
});

// ============================================================================
// EXECUTAR TESTES
// ============================================================================

console.log('\n🧪 TESTES UNITÁRIOS: identificacao-partes.service.ts\n');
console.log('=' .repeat(60));

describe('normalizarCpf()', () => {
  it('deve remover pontos e hífens', () => {
    expect(normalizarCpf('123.456.789-00')).toBe('12345678900');
  });

  it('deve remover espaços', () => {
    expect(normalizarCpf(' 123 456 789 00 ')).toBe('12345678900');
  });

  it('deve retornar vazio se CPF for vazio', () => {
    expect(normalizarCpf('')).toBe('');
  });

  it('deve retornar vazio se CPF for null/undefined', () => {
    expect(normalizarCpf(null as any)).toBe('');
    expect(normalizarCpf(undefined as any)).toBe('');
  });

  it('deve preservar apenas números', () => {
    expect(normalizarCpf('abc123def456ghi789jkl00')).toBe('12345678900');
  });

  it('deve lidar com CPF já normalizado', () => {
    expect(normalizarCpf('12345678900')).toBe('12345678900');
  });
});

describe('isTipoEspecial()', () => {
  it('deve identificar PERITO como tipo especial', () => {
    expect(isTipoEspecial('PERITO')).toBe(true);
  });

  it('deve identificar MINISTERIO_PUBLICO como tipo especial', () => {
    expect(isTipoEspecial('MINISTERIO_PUBLICO')).toBe(true);
  });

  it('deve identificar AMICUS_CURIAE como tipo especial', () => {
    expect(isTipoEspecial('AMICUS_CURIAE')).toBe(true);
  });

  it('deve identificar CUSTOS_LEGIS como tipo especial', () => {
    expect(isTipoEspecial('CUSTOS_LEGIS')).toBe(true);
  });

  it('não deve identificar AUTOR como tipo especial', () => {
    expect(isTipoEspecial('AUTOR')).toBe(false);
  });

  it('não deve identificar REU como tipo especial', () => {
    expect(isTipoEspecial('REU')).toBe(false);
  });

  it('não deve identificar RECLAMANTE como tipo especial', () => {
    expect(isTipoEspecial('RECLAMANTE')).toBe(false);
  });

  it('não deve identificar RECLAMADA como tipo especial', () => {
    expect(isTipoEspecial('RECLAMADA')).toBe(false);
  });

  it('deve ser case-insensitive', () => {
    expect(isTipoEspecial('perito')).toBe(true);
    expect(isTipoEspecial('Perito')).toBe(true);
    expect(isTipoEspecial('PERITO')).toBe(true);
  });

  it('deve retornar false para tipo vazio', () => {
    expect(isTipoEspecial('')).toBe(false);
  });

  it('deve retornar false para null/undefined', () => {
    expect(isTipoEspecial(null as any)).toBe(false);
    expect(isTipoEspecial(undefined as any)).toBe(false);
  });
});

describe('identificarTipoParte() - Validações', () => {
  it('deve lançar erro se parte for null', () => {
    expect(() => identificarTipoParte(null as any, mockAdvogado)).toThrow();
  });

  it('deve lançar erro se advogado for null', () => {
    const parte = createParteMock();
    expect(() => identificarTipoParte(parte, null as any)).toThrow();
  });

  it('deve lançar erro se CPF do advogado estiver ausente', () => {
    const parte = createParteMock();
    const advogadoSemCpf = { id: 1, cpf: '', nome: 'Dr. João' };
    expect(() => identificarTipoParte(parte, advogadoSemCpf)).toThrow();
  });
});

describe('identificarTipoParte() - Tipos Especiais (Terceiros)', () => {
  it('deve classificar PERITO como terceiro', () => {
    const parte = createParteMock({
      tipoParte: 'PERITO',
      nome: 'Dr. Carlos Perito',
      representantes: [],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('terceiro');
  });

  it('deve classificar MINISTERIO_PUBLICO como terceiro', () => {
    const parte = createParteMock({
      tipoParte: 'MINISTERIO_PUBLICO',
      nome: 'Ministério Público do Trabalho',
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('terceiro');
  });

  it('deve classificar PERITO mesmo com representante do escritório', () => {
    const parte = createParteMock({
      tipoParte: 'PERITO',
      nome: 'Dr. Carlos Perito',
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('terceiro');
  });

  it('deve classificar AMICUS_CURIAE como terceiro', () => {
    const parte = createParteMock({
      tipoParte: 'AMICUS_CURIAE',
      nome: 'Sindicato Amicus',
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('terceiro');
  });
});

describe('identificarTipoParte() - Cliente', () => {
  it('deve identificar cliente com CPF formatado idêntico', () => {
    const parte = createParteMock({
      tipoParte: 'AUTOR',
      nome: 'Maria Santos',
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('cliente');
  });

  it('deve identificar cliente com CPF sem formatação', () => {
    const parte = createParteMock({
      tipoParte: 'RECLAMANTE',
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dr. João Silva',
          numeroDocumento: '12345678900',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('cliente');
  });

  it('deve identificar cliente quando advogado CPF não formatado', () => {
    const advogadoSemFormatacao: AdvogadoIdentificacao = {
      id: 1,
      cpf: '12345678900',
      nome: 'Dr. João Silva',
    };
    const parte = createParteMock({
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, advogadoSemFormatacao)).toBe('cliente');
  });

  it('deve identificar cliente entre múltiplos representantes', () => {
    const parte = createParteMock({
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dra. Maria Oliveira',
          numeroDocumento: '111.222.333-44',
          tipoDocumento: 'CPF',
        },
        {
          idPessoa: 2,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00',
          tipoDocumento: 'CPF',
        },
        {
          idPessoa: 3,
          nome: 'Dr. Pedro Costa',
          numeroDocumento: '555.666.777-88',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('cliente');
  });

  it('deve ignorar representantes com CPF null', () => {
    const parte = createParteMock({
      representantes: [
        {
          idPessoa: 1,
          nome: 'Defensor Público',
          numeroDocumento: null as any,
          tipoDocumento: 'CPF',
        },
        {
          idPessoa: 2,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('cliente');
  });

  it('deve ignorar representantes com CPF vazio', () => {
    const parte = createParteMock({
      representantes: [
        {
          idPessoa: 1,
          nome: 'Sem CPF',
          numeroDocumento: '',
          tipoDocumento: 'CPF',
        },
        {
          idPessoa: 2,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('cliente');
  });
});

describe('identificarTipoParte() - Parte Contrária', () => {
  it('deve classificar como parte contrária quando sem representantes', () => {
    const parte = createParteMock({
      tipoParte: 'REU',
      nome: 'Empresa XYZ Ltda',
      representantes: [],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('parte_contraria');
  });

  it('deve classificar como parte contrária quando representantes não batem', () => {
    const parte = createParteMock({
      tipoParte: 'RECLAMADA',
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dra. Maria Oliveira',
          numeroDocumento: '111.222.333-44',
          tipoDocumento: 'CPF',
        },
        {
          idPessoa: 2,
          nome: 'Dr. Pedro Costa',
          numeroDocumento: '555.666.777-88',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('parte_contraria');
  });

  it('deve classificar como parte contrária quando representantes sem CPF', () => {
    const parte = createParteMock({
      representantes: [
        {
          idPessoa: 1,
          nome: 'Defensor Público',
          numeroDocumento: null as any,
          tipoDocumento: 'CPF',
        },
        {
          idPessoa: 2,
          nome: 'Outro Defensor',
          numeroDocumento: '',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('parte_contraria');
  });

  it('deve classificar como parte contrária quando CPF diferente por 1 dígito', () => {
    const parte = createParteMock({
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dr. Quase João',
          numeroDocumento: '123.456.789-01',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('parte_contraria');
  });
});

describe('identificarTipoParte() - Edge Cases', () => {
  it('deve lidar com array de representantes undefined', () => {
    const parte = createParteMock({
      tipoParte: 'AUTOR',
      representantes: undefined as any,
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('parte_contraria');
  });

  it('deve lidar com tipoParte em maiúsculas', () => {
    const parte = createParteMock({
      tipoParte: 'PERITO_CONTADOR',
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('terceiro');
  });

  it('deve priorizar tipo especial mesmo com match de CPF', () => {
    const parte = createParteMock({
      tipoParte: 'ASSISTENTE_TECNICO',
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('terceiro');
  });

  it('deve lidar com CPF com espaços extras', () => {
    const parte = createParteMock({
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dr. João Silva',
          numeroDocumento: '  123.456.789-00  ',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, mockAdvogado)).toBe('cliente');
  });

  it('deve lidar com advogado CPF com espaços', () => {
    const advogadoComEspacos: AdvogadoIdentificacao = {
      id: 1,
      cpf: '  123.456.789-00  ',
      nome: 'Dr. João Silva',
    };
    const parte = createParteMock({
      representantes: [
        {
          idPessoa: 1,
          nome: 'Dr. João Silva',
          numeroDocumento: '123.456.789-00',
          tipoDocumento: 'CPF',
        },
      ],
    });
    expect(identificarTipoParte(parte, advogadoComEspacos)).toBe('cliente');
  });
});

// ============================================================================
// RESULTADO FINAL
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log(`\n📊 RESULTADO FINAL\n`);
console.log(`✅ Testes Passou: ${testsPassed}`);
console.log(`❌ Testes Falhou: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}`);
console.log(`🎯 Taxa de Sucesso: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed > 0) {
  console.log(`\n❌ FALHOU - ${testsFailed} teste(s) falharam\n`);
  process.exit(1);
} else {
  console.log(`\n✅ SUCESSO - Todos os testes passaram!\n`);
  process.exit(0);
}
