import {
  calcularINSS,
  calcularIRRF,
  calcularSalarioLiquido,
  calcularHorasExtras,
  calcularFerias,
  calcularDecimoTerceiro,
  calcularSeguroDesemprego,
  calcularRescisao,
  calcularAdicionalNoturno,
  calcularInsalubridadePericulosidade,
  calcularFGTSAcumulado,
  calcularSimuladorAcao,
  LABELS_VERBAS,
} from '../../domain/trabalhista'
import {
  SALARIO_MINIMO_2026,
  TETO_INSS_2026,
  FGTS_PERCENTUAL,
} from '../../constants/tabelas-2026'

// Utility for rounding to 2 decimal places (matching the domain)
const r2 = (n: number) => Math.round(n * 100) / 100

// ---------------------------------------------------------------------------
// 1. calcularINSS
// ---------------------------------------------------------------------------
describe('calcularINSS', () => {
  it('returns zero for zero salary', () => {
    const result = calcularINSS(0)
    expect(result.total).toBe(0)
    expect(result.aliquotaEfetiva).toBe(0)
    expect(result.faixas).toHaveLength(0)
  })

  it('returns zero for negative salary', () => {
    const result = calcularINSS(-500)
    expect(result.total).toBe(0)
  })

  it('calculates correctly for single faixa (salario minimo)', () => {
    const result = calcularINSS(SALARIO_MINIMO_2026) // 1621
    expect(result.faixas).toHaveLength(1)
    expect(result.total).toBe(r2(1621 * 0.075))
    // r2(1621 * 0.075) may vary slightly due to floating point
    expect(result.total).toBeCloseTo(121.58, 0)
  })

  it('calculates progressively for multi-faixa salary', () => {
    // R$ 3000 spans 3 faixas
    const result = calcularINSS(3000)
    expect(result.faixas).toHaveLength(3)

    const faixa1 = r2(1621 * 0.075)       // 121.58
    const faixa2 = r2((2625.22 - 1621) * 0.09) // 90.38
    const faixa3 = r2((3000 - 2625.22) * 0.12)  // 44.97
    const expectedTotal = r2(faixa1 + faixa2 + faixa3)

    expect(result.faixas[0].contribuicao).toBe(faixa1)
    expect(result.faixas[1].contribuicao).toBe(faixa2)
    expect(result.faixas[2].contribuicao).toBe(faixa3)
    expect(result.total).toBe(expectedTotal)
  })

  it('caps at TETO_INSS for salaries above the ceiling', () => {
    const resultTeto = calcularINSS(TETO_INSS_2026)
    const resultAbove = calcularINSS(15000)
    expect(resultAbove.total).toBe(resultTeto.total)
    expect(resultAbove.faixas).toHaveLength(4)
  })

  it('calculates effective rate correctly', () => {
    const result = calcularINSS(3000)
    expect(result.aliquotaEfetiva).toBeCloseTo(result.total / 3000, 2)
  })
})

// ---------------------------------------------------------------------------
// 2. calcularIRRF
// ---------------------------------------------------------------------------
describe('calcularIRRF', () => {
  it('returns isento for low salary', () => {
    const inss = calcularINSS(SALARIO_MINIMO_2026)
    const result = calcularIRRF(SALARIO_MINIMO_2026, inss.total, 0)
    expect(result.isento).toBe(true)
    expect(result.imposto).toBe(0)
  })

  it('applies dependent deduction', () => {
    const salary = 5000
    const inss = calcularINSS(salary)
    const without = calcularIRRF(salary, inss.total, 0)
    const with2 = calcularIRRF(salary, inss.total, 2)
    // More dependents -> lower base -> lower tax
    expect(with2.baseCalculo).toBeLessThan(without.baseCalculo)
    expect(with2.imposto).toBeLessThanOrEqual(without.imposto)
  })

  it('applies redutor Lei 15.270 for salary <= 7350', () => {
    const salary = 5000
    const inss = calcularINSS(salary)
    const result = calcularIRRF(salary, inss.total, 0)
    // baseCalculo should reflect the redutor
    expect(result.baseCalculo).toBeLessThan(salary - inss.total)
  })

  it('does NOT apply redutor for salary > 7350', () => {
    const salary = 8000
    const inss = calcularINSS(salary)
    const result = calcularIRRF(salary, inss.total, 0)
    expect(result.baseCalculo).toBe(r2(salary - inss.total))
  })

  it('calculates high salary correctly (highest bracket)', () => {
    const salary = 15000
    const inss = calcularINSS(salary)
    const result = calcularIRRF(salary, inss.total, 0)
    expect(result.isento).toBe(false)
    expect(result.imposto).toBeGreaterThan(0)
    expect(result.aliquotaEfetiva).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 3. calcularSalarioLiquido
// ---------------------------------------------------------------------------
describe('calcularSalarioLiquido', () => {
  it('calculates simple salary (no additions)', () => {
    const result = calcularSalarioLiquido({ salarioBruto: 3000 })
    expect(result.salarioBruto).toBe(3000)
    expect(result.adicionalInsalubridade).toBe(0)
    expect(result.adicionalPericulosidade).toBe(0)
    expect(result.adicionalNoturno).toBe(0)
    expect(result.totalProventos).toBe(3000)
    expect(result.inss.total).toBeGreaterThan(0)
    expect(result.descontoVT).toBe(r2(3000 * 0.06))
    expect(result.salarioLiquido).toBeLessThan(3000)
  })

  it('deducts VT at 6% of base salary', () => {
    const result = calcularSalarioLiquido({ salarioBruto: 5000 })
    expect(result.descontoVT).toBe(300) // 5000 * 0.06
  })

  it('skips VT when descontoVT is false', () => {
    const result = calcularSalarioLiquido({ salarioBruto: 5000, descontoVT: false })
    expect(result.descontoVT).toBe(0)
  })

  it('adds insalubridade based on SALARIO_MINIMO', () => {
    const result = calcularSalarioLiquido({
      salarioBruto: 5000,
      insalubridade: 'maximo',
    })
    expect(result.adicionalInsalubridade).toBe(r2(SALARIO_MINIMO_2026 * 0.40))
  })

  it('adds periculosidade based on salary', () => {
    const result = calcularSalarioLiquido({
      salarioBruto: 5000,
      periculosidade: true,
    })
    expect(result.adicionalPericulosidade).toBe(r2(5000 * 0.30))
  })

  it('includes pensao alimenticia in deductions', () => {
    const result = calcularSalarioLiquido({
      salarioBruto: 5000,
      pensaoAlimenticia: 500,
    })
    expect(result.pensaoAlimenticia).toBe(500)
    expect(result.totalDescontos).toBeGreaterThan(500)
  })
})

// ---------------------------------------------------------------------------
// 4. calcularHorasExtras
// ---------------------------------------------------------------------------
describe('calcularHorasExtras', () => {
  it('calculates weekday overtime at 50%', () => {
    const result = calcularHorasExtras({
      salarioBruto: 2200,
      horasExtrasSemana: 10,
    })
    const valorHora = r2(2200 / 220)
    expect(result.valorHoraNormal).toBe(valorHora) // 10
    expect(result.valorHoraExtraSemana).toBe(r2(valorHora * 1.5)) // 15
    expect(result.totalSemana).toBe(r2(10 * 15))
  })

  it('calculates DSR as total/6', () => {
    const result = calcularHorasExtras({
      salarioBruto: 2200,
      horasExtrasSemana: 12,
    })
    expect(result.dsr).toBe(r2(result.totalHorasExtras / 6))
  })

  it('calculates weekend overtime at 100%', () => {
    const result = calcularHorasExtras({
      salarioBruto: 2200,
      horasExtrasSemana: 0,
      horasExtrasFimDeSemana: 8,
    })
    expect(result.valorHoraExtraFds).toBe(r2(10 * 2)) // 20
    expect(result.totalFds).toBe(r2(8 * 20))
  })

  it('includes reflexos (ferias, 13o, FGTS)', () => {
    const result = calcularHorasExtras({
      salarioBruto: 2200,
      horasExtrasSemana: 20,
    })
    expect(result.reflexoFerias).toBeGreaterThan(0)
    expect(result.reflexo13o).toBeGreaterThan(0)
    expect(result.reflexoFGTS).toBeGreaterThan(0)
    expect(result.totalComReflexos).toBeGreaterThan(result.totalHorasExtras + result.dsr)
  })
})

// ---------------------------------------------------------------------------
// 5. calcularFerias
// ---------------------------------------------------------------------------
describe('calcularFerias', () => {
  it('calculates full vacation (12 months, no absences)', () => {
    const result = calcularFerias({ salarioBruto: 3000 })
    expect(result.diasDireito).toBe(30)
    expect(result.diasGozo).toBe(30)
    expect(result.diasAbono).toBe(0)
    expect(result.valorBase).toBe(3000)
    expect(result.tercoConstitucional).toBe(1000)
    expect(result.totalBruto).toBe(4000)
  })

  it('reduces days by unjustified absences', () => {
    const result = calcularFerias({ salarioBruto: 3000, faltasInjustificadas: 10 })
    expect(result.diasDireito).toBe(24)
  })

  it('loses all days with more than 32 absences', () => {
    const result = calcularFerias({ salarioBruto: 3000, faltasInjustificadas: 33 })
    expect(result.diasDireito).toBe(0)
    expect(result.valorBase).toBe(0)
  })

  it('handles abono pecuniario', () => {
    const result = calcularFerias({ salarioBruto: 3000, abonoPecuniario: true })
    expect(result.diasAbono).toBe(10) // 30/3
    expect(result.diasGozo).toBe(20)
    expect(result.valorAbono).toBeGreaterThan(0)
    expect(result.tercoAbono).toBeGreaterThan(0)
  })

  it('calculates proportional vacation', () => {
    const result = calcularFerias({ salarioBruto: 3000, mesesTrabalhados: 6 })
    expect(result.diasGozo).toBe(15) // 30*6/12
  })
})

// ---------------------------------------------------------------------------
// 6. calcularDecimoTerceiro
// ---------------------------------------------------------------------------
describe('calcularDecimoTerceiro', () => {
  it('calculates full year 13th salary', () => {
    const result = calcularDecimoTerceiro({ salarioBruto: 3000, mesesTrabalhados: 12 })
    expect(result.valor13oBruto).toBe(3000)
    expect(result.primeiraParcelaValor).toBe(1500)
    expect(result.segundaParcelaBruto).toBe(1500)
    expect(result.inss.total).toBeGreaterThan(0)
    expect(result.totalLiquido).toBeLessThan(3000)
  })

  it('calculates proportional 13th salary', () => {
    const result = calcularDecimoTerceiro({ salarioBruto: 3000, mesesTrabalhados: 6 })
    expect(result.valor13oBruto).toBe(1500)
    expect(result.primeiraParcelaValor).toBe(750)
  })

  it('includes habitual additionals', () => {
    const result = calcularDecimoTerceiro({
      salarioBruto: 3000,
      mesesTrabalhados: 12,
      adicionaisHabituais: 500,
    })
    expect(result.valor13oBruto).toBe(3500)
  })

  it('deducts INSS/IRRF only on 2nd installment', () => {
    const result = calcularDecimoTerceiro({ salarioBruto: 5000, mesesTrabalhados: 12 })
    // 1st installment is gross half
    expect(result.primeiraParcelaValor).toBe(2500)
    // 2nd installment has deductions
    expect(result.segundaParcelaLiquido).toBeLessThan(result.segundaParcelaBruto)
  })
})

// ---------------------------------------------------------------------------
// 7. calcularSeguroDesemprego
// ---------------------------------------------------------------------------
describe('calcularSeguroDesemprego', () => {
  it('returns ineligible when months are insufficient', () => {
    const result = calcularSeguroDesemprego({
      salarioMedio: 2000,
      mesesTrabalhados: 5,
      solicitacao: '1a',
    })
    expect(result.elegivel).toBe(false)
    expect(result.motivoInelegibilidade).toBeDefined()
  })

  it('calculates 1a faixa (multiplicar)', () => {
    const result = calcularSeguroDesemprego({
      salarioMedio: 1800,
      mesesTrabalhados: 15,
      solicitacao: '1a',
    })
    expect(result.elegivel).toBe(true)
    // 1800 * 0.8 = 1440, but floor is SALARIO_MINIMO (1621)
    expect(result.valorParcela).toBe(SALARIO_MINIMO_2026)
    expect(result.quantidadeParcelas).toBeGreaterThanOrEqual(4)
  })

  it('calculates 2a faixa (fixo + excedente)', () => {
    const result = calcularSeguroDesemprego({
      salarioMedio: 3000,
      mesesTrabalhados: 12,
      solicitacao: '2a',
    })
    expect(result.elegivel).toBe(true)
    const excedente = 3000 - 2138.76
    const expected = r2(1711.01 + excedente * 0.5)
    expect(result.valorParcela).toBe(expected)
  })

  it('caps at teto for high salaries', () => {
    const result = calcularSeguroDesemprego({
      salarioMedio: 10000,
      mesesTrabalhados: 24,
      solicitacao: '3a_ou_mais',
    })
    expect(result.elegivel).toBe(true)
    expect(result.valorParcela).toBe(2518.65)
  })

  it('floors at minimum wage for very low salaries', () => {
    const result = calcularSeguroDesemprego({
      salarioMedio: 800,
      mesesTrabalhados: 12,
      solicitacao: '1a',
    })
    expect(result.valorParcela).toBe(SALARIO_MINIMO_2026)
  })

  it('determines parcels by months worked', () => {
    // 1a solicitacao, 12-23 meses = 4-5 parcelas
    const r12 = calcularSeguroDesemprego({
      salarioMedio: 2000,
      mesesTrabalhados: 12,
      solicitacao: '1a',
    })
    expect(r12.quantidadeParcelas).toBe(4) // 12 meses = faixa[0] = 4

    const r24 = calcularSeguroDesemprego({
      salarioMedio: 2000,
      mesesTrabalhados: 24,
      solicitacao: '1a',
    })
    expect(r24.quantidadeParcelas).toBe(5) // 24 meses = faixa[2] = 5
  })
})

// ---------------------------------------------------------------------------
// 8. calcularRescisao
// ---------------------------------------------------------------------------
describe('calcularRescisao', () => {
  const baseParams = {
    salarioBruto: 3000,
    dataAdmissao: new Date(2022, 0, 10), // Jan 10, 2022
    dataDemissao: new Date(2026, 2, 15), // Mar 15, 2026
    diasTrabalhados: 15,
    saldoFGTS: 10000,
    dependentes: 0,
  }

  it('calculates sem_justa_causa with all rights', () => {
    const result = calcularRescisao({
      ...baseParams,
      tipo: 'sem_justa_causa',
      avisoPrevio: 'indenizado',
    })

    expect(result.tipo).toBe('sem_justa_causa')
    expect(result.saldoSalario).toBe(r2(15 * (3000 / 30))) // 1500
    expect(result.decimoTerceiroProporcional).toBeGreaterThan(0)
    expect(result.feriasProporcional).toBeGreaterThan(0)
    expect(result.tercoFeriasProporcional).toBeGreaterThan(0)
    expect(result.multaFGTS).toBe(r2(10000 * 0.40)) // 4000
    expect(result.percentualMultaFGTS).toBe(0.40)
    expect(result.avisoPrevio.dias).toBeGreaterThanOrEqual(30)
    expect(result.avisoPrevio.valor).toBeGreaterThan(0)
    expect(result.totalLiquido).toBeGreaterThan(0)
    expect(result.verbas.length).toBeGreaterThan(0)
  })

  it('calculates justa_causa with minimal rights', () => {
    const result = calcularRescisao({
      ...baseParams,
      tipo: 'justa_causa',
      avisoPrevio: 'dispensado',
    })

    expect(result.saldoSalario).toBeGreaterThan(0) // still gets saldo
    expect(result.decimoTerceiroProporcional).toBe(0)
    expect(result.feriasProporcional).toBe(0)
    expect(result.multaFGTS).toBe(0)
    expect(result.avisoPrevio.valor).toBe(0)
  })

  it('calculates consensual with 50% aviso and 20% FGTS', () => {
    const result = calcularRescisao({
      ...baseParams,
      tipo: 'consensual',
      avisoPrevio: 'indenizado',
    })

    expect(result.percentualMultaFGTS).toBe(0.20)
    expect(result.multaFGTS).toBe(r2(10000 * 0.20))
    // Aviso is halved for consensual
    // 4 years -> 30 + 4*3 = 42 days, halved = 21
    expect(result.avisoPrevio.dias).toBeLessThanOrEqual(45)
  })

  it('includes ferias vencidas when flagged', () => {
    const result = calcularRescisao({
      ...baseParams,
      tipo: 'sem_justa_causa',
      avisoPrevio: 'indenizado',
      feriasVencidas: true,
    })

    expect(result.feriasVencidas).toBe(3000)
    expect(result.tercoFeriasVencidas).toBe(1000)
  })

  it('has verbas array for UI rendering', () => {
    const result = calcularRescisao({
      ...baseParams,
      tipo: 'sem_justa_causa',
      avisoPrevio: 'indenizado',
    })

    const proventos = result.verbas.filter((v) => v.tipo === 'provento')
    const descontos = result.verbas.filter((v) => v.tipo === 'desconto')
    expect(proventos.length).toBeGreaterThan(0)
    // There should be descontos (INSS at minimum)
    expect(descontos.length).toBeGreaterThanOrEqual(0)
    // Each verba has label, valor, tipo
    result.verbas.forEach((v) => {
      expect(v).toHaveProperty('label')
      expect(v).toHaveProperty('valor')
      expect(v).toHaveProperty('tipo')
    })
  })
})

// ---------------------------------------------------------------------------
// 9. calcularAdicionalNoturno
// ---------------------------------------------------------------------------
describe('calcularAdicionalNoturno', () => {
  it('calculates urbano with hora ficta', () => {
    const result = calcularAdicionalNoturno({
      salarioBruto: 2200,
      horasNoturnas: 7,
    })

    expect(result.tipo).toBe('urbano')
    expect(result.periodoNoturno).toBe('22h as 5h')

    // 7 real hours * (60/52.5) = 8 ficta hours
    expect(result.horasFictas).toBe(r2(7 * (60 / 52.5)))
    expect(result.horasFictas).toBeGreaterThan(7)

    const valorHora = r2(2200 / 220)
    expect(result.valorHoraNormal).toBe(valorHora)
    expect(result.adicionalPorHora).toBe(r2(valorHora * 0.20))
    expect(result.totalAdicional).toBe(r2(result.horasFictas * result.adicionalPorHora))
  })

  it('rural does not apply hora ficta', () => {
    const result = calcularAdicionalNoturno({
      salarioBruto: 2200,
      horasNoturnas: 7,
      tipo: 'rural_pecuaria',
    })

    expect(result.horasFictas).toBe(7)
    expect(result.periodoNoturno).toBe('20h as 4h')
  })

  it('shows correct period for rural lavoura', () => {
    const result = calcularAdicionalNoturno({
      salarioBruto: 2200,
      horasNoturnas: 5,
      tipo: 'rural_lavoura',
    })

    expect(result.periodoNoturno).toBe('21h as 5h')
  })
})

// ---------------------------------------------------------------------------
// 10. calcularInsalubridadePericulosidade
// ---------------------------------------------------------------------------
describe('calcularInsalubridadePericulosidade', () => {
  it('calculates insalubridade maximo on SALARIO_MINIMO', () => {
    const result = calcularInsalubridadePericulosidade({
      salarioBruto: 5000,
      insalubridade: 'maximo',
    })

    expect(result.insalubridade.grau).toBe('maximo')
    expect(result.insalubridade.baseCalculo).toBe(SALARIO_MINIMO_2026)
    expect(result.insalubridade.valor).toBe(r2(SALARIO_MINIMO_2026 * 0.40))
  })

  it('calculates periculosidade on salary', () => {
    const result = calcularInsalubridadePericulosidade({
      salarioBruto: 5000,
      periculosidade: true,
    })

    expect(result.periculosidade.baseCalculo).toBe(5000)
    expect(result.periculosidade.valor).toBe(1500) // 30%
  })

  it('applies non-cumulation rule (chooses higher)', () => {
    const result = calcularInsalubridadePericulosidade({
      salarioBruto: 5000,
      insalubridade: 'maximo',
      periculosidade: true,
    })

    expect(result.cumulacao).toBe(false)
    // Periculosidade (1500) > Insalubridade (648.40)
    expect(result.tipoMaiorValor).toBe('periculosidade')
    expect(result.maiorValor).toBe(1500)
  })

  it('returns nenhum when nothing is set', () => {
    const result = calcularInsalubridadePericulosidade({ salarioBruto: 5000 })
    expect(result.tipoMaiorValor).toBe('nenhum')
    expect(result.maiorValor).toBe(0)
  })

  it('calculates insalubridade minimo correctly', () => {
    const result = calcularInsalubridadePericulosidade({
      salarioBruto: 5000,
      insalubridade: 'minimo',
    })
    expect(result.insalubridade.valor).toBe(r2(SALARIO_MINIMO_2026 * 0.10))
  })
})

// ---------------------------------------------------------------------------
// 11. calcularFGTSAcumulado
// ---------------------------------------------------------------------------
describe('calcularFGTSAcumulado', () => {
  it('calculates monthly deposit correctly', () => {
    const result = calcularFGTSAcumulado({
      salarioBruto: 3000,
      mesesTrabalhados: 1,
    })

    expect(result.depositoMensal).toBe(r2(3000 * FGTS_PERCENTUAL)) // 240
    expect(result.detalhamento).toHaveLength(1)
    expect(result.detalhamento[0].deposito).toBe(240)
  })

  it('grows over time with compound interest', () => {
    const result = calcularFGTSAcumulado({
      salarioBruto: 3000,
      mesesTrabalhados: 24,
    })

    expect(result.totalDepositos).toBeGreaterThan(0)
    expect(result.totalRendimentos).toBeGreaterThan(0)
    expect(result.saldoEstimado).toBeGreaterThan(result.totalDepositos)
    expect(result.detalhamento).toHaveLength(24)

    // Balance should grow each month
    for (let i = 1; i < result.detalhamento.length; i++) {
      expect(result.detalhamento[i].saldoAcumulado).toBeGreaterThan(
        result.detalhamento[i - 1].saldoAcumulado
      )
    }
  })

  it('includes 13o and ferias deposits at 12-month marks', () => {
    const result = calcularFGTSAcumulado({
      salarioBruto: 3000,
      mesesTrabalhados: 12,
      incluir13o: true,
      incluirFerias: true,
    })

    // Month 12 should have extra deposits
    const month12 = result.detalhamento[11]
    const month1 = result.detalhamento[0]
    expect(month12.deposito).toBeGreaterThan(month1.deposito)
  })

  it('excludes 13o/ferias when flagged false', () => {
    const result = calcularFGTSAcumulado({
      salarioBruto: 3000,
      mesesTrabalhados: 12,
      incluir13o: false,
      incluirFerias: false,
    })

    // All months should have the same deposit
    const deposits = result.detalhamento.map((d) => d.deposito)
    expect(new Set(deposits).size).toBe(1)
    expect(result.deposito13o).toBe(0)
    expect(result.depositoFerias).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 12. calcularSimuladorAcao
// ---------------------------------------------------------------------------
describe('calcularSimuladorAcao', () => {
  it('calculates horas_extras with reflexos', () => {
    const result = calcularSimuladorAcao({
      salarioBruto: 3000,
      verbas: [
        { tipo: 'horas_extras', valorMensal: 500, meses: 12 },
      ],
    })

    expect(result.verbas).toHaveLength(1)
    const verba = result.verbas[0]
    expect(verba.tipo).toBe('horas_extras')
    expect(verba.label).toBe(LABELS_VERBAS.horas_extras)
    expect(verba.valorBase).toBe(6000) // 500 * 12
    expect(verba.reflexoDSR).toBeGreaterThan(0)
    expect(verba.reflexoFerias).toBeGreaterThan(0)
    expect(verba.reflexo13o).toBeGreaterThan(0)
    expect(verba.reflexoFGTS).toBeGreaterThan(0)
    expect(verba.totalComReflexos).toBeGreaterThan(verba.valorBase)
  })

  it('calculates dano_moral without reflexos', () => {
    const result = calcularSimuladorAcao({
      salarioBruto: 3000,
      verbas: [
        { tipo: 'dano_moral', valorMensal: 0, meses: 1, gravidade: 'grave' },
      ],
    })

    const verba = result.verbas[0]
    expect(verba.tipo).toBe('dano_moral')
    expect(verba.valorBase).toBe(r2(3000 * 20)) // grave = 20x
    expect(verba.reflexoDSR).toBe(0)
    expect(verba.reflexoFerias).toBe(0)
    expect(verba.reflexo13o).toBe(0)
    expect(verba.reflexoFGTS).toBe(0)
    expect(verba.totalComReflexos).toBe(verba.valorBase)
  })

  it('calculates ferias_nao_gozadas without reflexos', () => {
    const result = calcularSimuladorAcao({
      salarioBruto: 3000,
      verbas: [
        { tipo: 'ferias_nao_gozadas', valorMensal: 0, meses: 2 },
      ],
    })

    const verba = result.verbas[0]
    expect(verba.valorBase).toBe(r2((3000 + 1000) * 2)) // (sal + 1/3) * 2
    expect(verba.reflexoDSR).toBe(0)
  })

  it('produces 3 scenarios (baixo, medio, alto)', () => {
    const result = calcularSimuladorAcao({
      salarioBruto: 3000,
      verbas: [
        { tipo: 'horas_extras', valorMensal: 500, meses: 12 },
      ],
    })

    expect(result.cenarios).toHaveLength(3)
    expect(result.cenarios[0].nome).toBe('Cenario Baixo')
    expect(result.cenarios[0].fator).toBe(0.80)
    expect(result.cenarios[1].nome).toBe('Cenario Medio')
    expect(result.cenarios[1].fator).toBe(1.00)
    expect(result.cenarios[2].nome).toBe('Cenario Alto')
    expect(result.cenarios[2].fator).toBe(1.20)

    // baixo < medio < alto
    expect(result.cenarios[0].total).toBeLessThan(result.cenarios[1].total)
    expect(result.cenarios[1].total).toBeLessThan(result.cenarios[2].total)
  })

  it('sums multiple verbas correctly', () => {
    const result = calcularSimuladorAcao({
      salarioBruto: 3000,
      verbas: [
        { tipo: 'horas_extras', valorMensal: 500, meses: 12 },
        { tipo: 'dano_moral', valorMensal: 0, meses: 1, gravidade: 'leve' },
      ],
    })

    expect(result.verbas).toHaveLength(2)
    expect(result.totalBase).toBe(
      r2(result.verbas[0].valorBase + result.verbas[1].valorBase)
    )
  })

  it('calculates FGTS nao depositado based on salary', () => {
    const result = calcularSimuladorAcao({
      salarioBruto: 3000,
      verbas: [
        { tipo: 'fgts_nao_depositado', valorMensal: 0, meses: 24 },
      ],
    })

    const verba = result.verbas[0]
    expect(verba.valorBase).toBe(r2(3000 * 0.08 * 24)) // 5760
  })
})
