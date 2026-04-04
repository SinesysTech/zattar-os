import {
  FAIXAS_INSS_2026,
  FAIXAS_IRRF_2026,
  SALARIO_MINIMO_2026,
  TETO_INSS_2026,
  calcularDiasAvisoPrevio,
  REDUCAO_FERIAS_POR_FALTAS,
} from '../../constants/tabelas-2026'

describe('Tabelas 2026', () => {
  test('salario minimo 2026 = R$ 1.621,00', () => {
    expect(SALARIO_MINIMO_2026).toBe(1621.00)
  })

  test('teto INSS 2026 = R$ 8.475,55', () => {
    expect(TETO_INSS_2026).toBe(8475.55)
  })

  test('INSS tem 4 faixas progressivas', () => {
    expect(FAIXAS_INSS_2026).toHaveLength(4)
    expect(FAIXAS_INSS_2026[0].aliquota).toBe(0.075)
    expect(FAIXAS_INSS_2026[3].aliquota).toBe(0.14)
  })

  test('IRRF tem 5 faixas', () => {
    expect(FAIXAS_IRRF_2026).toHaveLength(5)
    expect(FAIXAS_IRRF_2026[0].aliquota).toBe(0)
    expect(FAIXAS_IRRF_2026[4].aliquota).toBe(0.275)
  })

  test('aviso previo: 1 ano = 33 dias', () => {
    expect(calcularDiasAvisoPrevio(1)).toBe(33)
  })

  test('aviso previo: 20 anos = 90 dias (teto)', () => {
    expect(calcularDiasAvisoPrevio(20)).toBe(90)
  })

  test('aviso previo: 0 anos = 30 dias', () => {
    expect(calcularDiasAvisoPrevio(0)).toBe(30)
  })

  test('reducao ferias: 6 faltas = 24 dias', () => {
    const regra = REDUCAO_FERIAS_POR_FALTAS.find(r => 6 <= r.faltasAte)
    expect(regra?.diasFerias).toBe(24)
  })
})
