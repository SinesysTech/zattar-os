/**
 * Motor de Calculo Trabalhista Compartilhado
 *
 * Funcoes puras para calculos de direitos trabalhistas brasileiros.
 * Todas as funcoes sao sincronas e sem efeitos colaterais.
 */
import {
  SALARIO_MINIMO_2026,
  TETO_INSS_2026,
  FAIXAS_INSS_2026,
  FAIXAS_IRRF_2026,
  DEDUCAO_DEPENDENTE_IRRF_2026,
  REDUTOR_LEI_15270_2025,
  FAIXAS_SEGURO_DESEMPREGO_2026,
  PISO_SEGURO_DESEMPREGO_2026,
  TETO_SEGURO_DESEMPREGO_VALOR_2026,
  REGRAS_PARCELAS_SEGURO,
  FGTS_PERCENTUAL,
  FGTS_MULTA_PERCENTUAL,
  FGTS_RENDIMENTO_MENSAL,
  ADICIONAL_NOTURNO_PERCENTUAL,
  HORA_NOTURNA_REDUZIDA_MINUTOS,
  INSALUBRIDADE_PERCENTUAIS,
  PERICULOSIDADE_PERCENTUAL,
  REDUCAO_FERIAS_POR_FALTAS,
  MULTIPLICADORES_DANO_MORAL,
  calcularDiasAvisoPrevio,
  type FaixaINSS,
  type GrauInsalubridade,
  type GravidadeDanoMoral,
} from '../constants/tabelas-2026'

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Round to 2 decimal places (centavos) */
function r2(n: number): number {
  return Math.round(n * 100) / 100
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TipoRescisao =
  | 'sem_justa_causa'
  | 'pedido_demissao'
  | 'justa_causa'
  | 'consensual'
  | 'indireta'
  | 'termino_contrato'

export type TipoAvisoPrevio = 'trabalhado' | 'indenizado' | 'dispensado'

// --- INSS ---

export interface ResultadoINSS {
  total: number
  aliquotaEfetiva: number
  faixas: { faixa: FaixaINSS; contribuicao: number }[]
}

// --- IRRF ---

export interface ResultadoIRRF {
  baseCalculo: number
  imposto: number
  aliquotaEfetiva: number
  isento: boolean
}

// --- Salario Liquido ---

export interface ParamsSalarioLiquido {
  salarioBruto: number
  dependentes?: number
  descontoVT?: boolean // default true, 6% do bruto
  pensaoAlimenticia?: number // valor fixo
  outrosDescontos?: number
  insalubridade?: GrauInsalubridade
  periculosidade?: boolean
  adicionalNoturno?: boolean
  horasNoturnas?: number // horas trabalhadas no periodo noturno
}

export interface ResultadoSalarioLiquido {
  salarioBruto: number
  adicionalInsalubridade: number
  adicionalPericulosidade: number
  adicionalNoturno: number
  totalProventos: number
  inss: ResultadoINSS
  irrf: ResultadoIRRF
  descontoVT: number
  pensaoAlimenticia: number
  outrosDescontos: number
  totalDescontos: number
  salarioLiquido: number
}

// --- Horas Extras ---

export interface ParamsHorasExtras {
  salarioBruto: number
  horasMensais?: number // default 220
  horasExtrasSemana: number
  horasExtrasFimDeSemana?: number
  percentualSemana?: number // default 0.50
  percentualFimDeSemana?: number // default 1.00
}

export interface ResultadoHorasExtras {
  valorHoraNormal: number
  valorHoraExtraSemana: number
  valorHoraExtraFds: number
  totalSemana: number
  totalFds: number
  totalHorasExtras: number
  dsr: number
  reflexoFerias: number
  reflexo13o: number
  reflexoFGTS: number
  totalComReflexos: number
}

// --- Ferias ---

export interface ParamsFerias {
  salarioBruto: number
  mesesTrabalhados?: number // default 12 (ferias integrais)
  faltasInjustificadas?: number
  abonoPecuniario?: boolean
  dependentes?: number
  adicionaisHabituais?: number // soma de adicionais habituais
}

export interface ResultadoFerias {
  diasDireito: number
  diasGozo: number
  diasAbono: number
  valorBase: number
  tercoConstitucional: number
  valorAbono: number
  tercoAbono: number
  totalBruto: number
  baseTributavel: number
  inss: ResultadoINSS
  irrf: ResultadoIRRF
  totalLiquido: number
}

// --- Decimo Terceiro ---

export interface ParamsDecimoTerceiro {
  salarioBruto: number
  mesesTrabalhados: number // 1-12
  dependentes?: number
  adicionaisHabituais?: number
}

export interface ResultadoDecimoTerceiro {
  valor13oBruto: number
  primeiraParcelaValor: number
  segundaParcelaBruto: number
  inss: ResultadoINSS
  irrf: ResultadoIRRF
  segundaParcelaLiquido: number
  totalLiquido: number
}

// --- Seguro Desemprego ---

export interface ParamsSeguroDesemprego {
  salarioMedio: number // media ultimos 3 meses
  mesesTrabalhados: number
  solicitacao: '1a' | '2a' | '3a_ou_mais'
}

export interface ResultadoSeguroDesemprego {
  elegivel: boolean
  motivoInelegibilidade?: string
  valorParcela: number
  quantidadeParcelas: number
  totalEstimado: number
}

// --- Rescisao ---

export interface ParamsRescisao {
  salarioBruto: number
  tipo: TipoRescisao
  avisoPrevio: TipoAvisoPrevio
  dataAdmissao: Date
  dataDemissao: Date
  diasTrabalhados: number // dias no ultimo mes
  saldoFGTS?: number
  feriasVencidas?: boolean
  dependentes?: number
}

export interface VerbaRescisoria {
  label: string
  valor: number
  tipo: 'provento' | 'desconto'
}

export interface ResultadoRescisao {
  tipo: TipoRescisao
  avisoPrevio: { dias: number; valor: number }
  saldoSalario: number
  decimoTerceiroProporcional: number
  feriasProporcional: number
  tercoFeriasProporcional: number
  feriasVencidas: number
  tercoFeriasVencidas: number
  multaFGTS: number
  percentualMultaFGTS: number
  inss: ResultadoINSS
  irrf: ResultadoIRRF
  totalBruto: number
  totalDescontos: number
  totalLiquido: number
  verbas: VerbaRescisoria[]
}

// --- Adicional Noturno ---

export type TipoTrabalhoNoturno = 'urbano' | 'rural_pecuaria' | 'rural_lavoura'

export interface ParamsAdicionalNoturno {
  salarioBruto: number
  horasMensais?: number // default 220
  horasNoturnas: number
  tipo?: TipoTrabalhoNoturno // default 'urbano'
}

export interface ResultadoAdicionalNoturno {
  tipo: TipoTrabalhoNoturno
  horasInput: number
  horasFictas: number
  valorHoraNormal: number
  adicionalPorHora: number
  totalAdicional: number
  periodoNoturno: string
}

// --- Insalubridade / Periculosidade ---

export interface ParamsInsalubridadePericulosidade {
  salarioBruto: number
  insalubridade?: GrauInsalubridade
  periculosidade?: boolean
}

export interface ResultadoInsalubridadePericulosidade {
  insalubridade: {
    grau: GrauInsalubridade | null
    baseCalculo: number
    percentual: number
    valor: number
  }
  periculosidade: {
    baseCalculo: number
    percentual: number
    valor: number
  }
  cumulacao: boolean
  maiorValor: number
  tipoMaiorValor: 'insalubridade' | 'periculosidade' | 'nenhum'
}

// --- FGTS Acumulado ---

export interface ParamsFGTSAcumulado {
  salarioBruto: number
  mesesTrabalhados: number
  incluir13o?: boolean
  incluirFerias?: boolean
}

export interface DepositoFGTSMensal {
  mes: number
  deposito: number
  rendimento: number
  saldoAcumulado: number
}

export interface ResultadoFGTSAcumulado {
  depositoMensal: number
  deposito13o: number
  depositoFerias: number
  totalDepositos: number
  totalRendimentos: number
  saldoEstimado: number
  detalhamento: DepositoFGTSMensal[]
}

// --- Simulador Acao ---

export type VerbaAcao =
  | 'horas_extras'
  | 'intervalo_suprimido'
  | 'adicional_noturno'
  | 'insalubridade'
  | 'periculosidade'
  | 'fgts_nao_depositado'
  | 'ferias_nao_gozadas'
  | 'decimo_terceiro'
  | 'dano_moral'
  | 'desvio_funcao'

export const LABELS_VERBAS: Record<VerbaAcao, string> = {
  horas_extras: 'Horas Extras',
  intervalo_suprimido: 'Intervalo Intrajornada Suprimido',
  adicional_noturno: 'Adicional Noturno',
  insalubridade: 'Adicional de Insalubridade',
  periculosidade: 'Adicional de Periculosidade',
  fgts_nao_depositado: 'FGTS Nao Depositado',
  ferias_nao_gozadas: 'Ferias Nao Gozadas',
  decimo_terceiro: '13o Salario',
  dano_moral: 'Dano Moral',
  desvio_funcao: 'Desvio de Funcao',
}

export interface VerbaSimulacao {
  tipo: VerbaAcao
  valorMensal: number
  meses: number
  gravidade?: GravidadeDanoMoral // only for dano_moral
}

export interface ParamsSimuladorAcao {
  salarioBruto: number
  verbas: VerbaSimulacao[]
}

export interface ResultadoVerbaSimulada {
  tipo: VerbaAcao
  label: string
  valorBase: number
  reflexoDSR: number
  reflexoFerias: number
  reflexo13o: number
  reflexoFGTS: number
  totalComReflexos: number
}

export interface CenarioSimulacao {
  nome: string
  fator: number
  total: number
}

export interface ResultadoSimuladorAcao {
  verbas: ResultadoVerbaSimulada[]
  totalBase: number
  totalReflexos: number
  cenarios: CenarioSimulacao[]
}

// ---------------------------------------------------------------------------
// 1. INSS Progressivo
// ---------------------------------------------------------------------------

export function calcularINSS(salarioBruto: number): ResultadoINSS {
  if (salarioBruto <= 0) {
    return { total: 0, aliquotaEfetiva: 0, faixas: [] }
  }

  const salario = Math.min(salarioBruto, TETO_INSS_2026)
  const faixasResult: { faixa: FaixaINSS; contribuicao: number }[] = []
  let anterior = 0
  let total = 0

  for (const faixa of FAIXAS_INSS_2026) {
    if (salario <= anterior) break
    const base = Math.min(salario, faixa.ate) - anterior
    const contribuicao = r2(base * faixa.aliquota)
    faixasResult.push({ faixa, contribuicao })
    total += contribuicao
    anterior = faixa.ate
  }

  total = r2(total)

  return {
    total,
    aliquotaEfetiva: salarioBruto > 0 ? r2((total / salarioBruto) * 100) / 100 : 0,
    faixas: faixasResult,
  }
}

// ---------------------------------------------------------------------------
// 2. IRRF Progressivo
// ---------------------------------------------------------------------------

export function calcularIRRF(
  salarioBruto: number,
  descontoINSS: number,
  dependentes: number = 0
): ResultadoIRRF {
  const deducaoDependentes = dependentes * DEDUCAO_DEPENDENTE_IRRF_2026
  let baseCalculo = salarioBruto - descontoINSS - deducaoDependentes

  // Redutor Lei 15.270/2025 para salarios ate R$ 7.350
  if (salarioBruto <= 7_350) {
    baseCalculo -= REDUTOR_LEI_15270_2025
  }

  baseCalculo = r2(Math.max(baseCalculo, 0))

  // Find applicable bracket
  let imposto = 0
  for (const faixa of FAIXAS_IRRF_2026) {
    if (baseCalculo <= faixa.ate) {
      imposto = r2(baseCalculo * faixa.aliquota - faixa.deducao)
      break
    }
  }

  imposto = Math.max(r2(imposto), 0)

  return {
    baseCalculo,
    imposto,
    aliquotaEfetiva: baseCalculo > 0 ? r2((imposto / baseCalculo) * 100) / 100 : 0,
    isento: imposto === 0,
  }
}

// ---------------------------------------------------------------------------
// 3. Salario Liquido
// ---------------------------------------------------------------------------

export function calcularSalarioLiquido(params: ParamsSalarioLiquido): ResultadoSalarioLiquido {
  const {
    salarioBruto,
    dependentes = 0,
    descontoVT = true,
    pensaoAlimenticia = 0,
    outrosDescontos = 0,
    insalubridade,
    periculosidade = false,
    adicionalNoturno = false,
    horasNoturnas = 0,
  } = params

  // Adicionais
  const adicionalInsalubridade = insalubridade
    ? r2(SALARIO_MINIMO_2026 * INSALUBRIDADE_PERCENTUAIS[insalubridade])
    : 0

  const adicionalPericulosidade = periculosidade
    ? r2(salarioBruto * PERICULOSIDADE_PERCENTUAL)
    : 0

  const valorHoraNormal = salarioBruto / 220
  const adicionalNoturnovalor = adicionalNoturno
    ? r2(valorHoraNormal * ADICIONAL_NOTURNO_PERCENTUAL * horasNoturnas)
    : 0

  const totalProventos = r2(
    salarioBruto + adicionalInsalubridade + adicionalPericulosidade + adicionalNoturnovalor
  )

  // Descontos
  const inss = calcularINSS(totalProventos)
  const irrf = calcularIRRF(totalProventos, inss.total, dependentes)
  const vtDesconto = descontoVT ? r2(salarioBruto * 0.06) : 0

  const totalDescontos = r2(inss.total + irrf.imposto + vtDesconto + pensaoAlimenticia + outrosDescontos)

  return {
    salarioBruto,
    adicionalInsalubridade,
    adicionalPericulosidade,
    adicionalNoturno: adicionalNoturnovalor,
    totalProventos,
    inss,
    irrf,
    descontoVT: vtDesconto,
    pensaoAlimenticia,
    outrosDescontos,
    totalDescontos,
    salarioLiquido: r2(totalProventos - totalDescontos),
  }
}

// ---------------------------------------------------------------------------
// 4. Horas Extras
// ---------------------------------------------------------------------------

export function calcularHorasExtras(params: ParamsHorasExtras): ResultadoHorasExtras {
  const {
    salarioBruto,
    horasMensais = 220,
    horasExtrasSemana,
    horasExtrasFimDeSemana = 0,
    percentualSemana = 0.50,
    percentualFimDeSemana = 1.00,
  } = params

  const valorHoraNormal = r2(salarioBruto / horasMensais)
  const valorHoraExtraSemana = r2(valorHoraNormal * (1 + percentualSemana))
  const valorHoraExtraFds = r2(valorHoraNormal * (1 + percentualFimDeSemana))

  const totalSemana = r2(horasExtrasSemana * valorHoraExtraSemana)
  const totalFds = r2(horasExtrasFimDeSemana * valorHoraExtraFds)
  const totalHorasExtras = r2(totalSemana + totalFds)

  // DSR (Descanso Semanal Remunerado) = total HE / 6
  const dsr = r2(totalHorasExtras / 6)

  const totalComDSR = r2(totalHorasExtras + dsr)

  // Reflexos
  const reflexoFerias = r2(totalComDSR / 12 + totalComDSR / 12 / 3) // ferias + 1/3
  const reflexo13o = r2(totalComDSR / 12)
  const reflexoFGTS = r2((totalComDSR + reflexoFerias + reflexo13o) * FGTS_PERCENTUAL * (1 + FGTS_MULTA_PERCENTUAL))

  const totalComReflexos = r2(totalComDSR + reflexoFerias + reflexo13o + reflexoFGTS)

  return {
    valorHoraNormal,
    valorHoraExtraSemana,
    valorHoraExtraFds,
    totalSemana,
    totalFds,
    totalHorasExtras,
    dsr,
    reflexoFerias,
    reflexo13o,
    reflexoFGTS,
    totalComReflexos,
  }
}

// ---------------------------------------------------------------------------
// 5. Ferias
// ---------------------------------------------------------------------------

export function calcularFerias(params: ParamsFerias): ResultadoFerias {
  const {
    salarioBruto,
    mesesTrabalhados = 12,
    faltasInjustificadas = 0,
    abonoPecuniario = false,
    dependentes = 0,
    adicionaisHabituais = 0,
  } = params

  // Dias de direito baseado em faltas
  let diasDireito = 30
  for (const regra of REDUCAO_FERIAS_POR_FALTAS) {
    if (faltasInjustificadas <= regra.faltasAte) {
      diasDireito = regra.diasFerias
      break
    }
  }
  // Se mais de 32 faltas, perde o direito
  if (faltasInjustificadas > 32) diasDireito = 0

  // Proporcional
  const diasProporcionais = Math.round((diasDireito * mesesTrabalhados) / 12)

  // Abono pecuniario = 1/3 dos dias
  const diasAbono = abonoPecuniario ? Math.floor(diasProporcionais / 3) : 0
  const diasGozo = diasProporcionais - diasAbono

  const baseComAdicionais = salarioBruto + adicionaisHabituais
  const valorDia = baseComAdicionais / 30

  const valorBase = r2(diasGozo * valorDia)
  const tercoConstitucional = r2(valorBase / 3)

  const valorAbono = r2(diasAbono * valorDia)
  const tercoAbono = r2(valorAbono / 3)

  const totalBruto = r2(valorBase + tercoConstitucional + valorAbono + tercoAbono)

  // Abono pecuniario eh isento de INSS/IRRF
  const baseTributavel = r2(valorBase + tercoConstitucional)

  const inss = calcularINSS(baseTributavel)
  const irrf = calcularIRRF(baseTributavel, inss.total, dependentes)

  const totalLiquido = r2(totalBruto - inss.total - irrf.imposto)

  return {
    diasDireito,
    diasGozo,
    diasAbono,
    valorBase,
    tercoConstitucional,
    valorAbono,
    tercoAbono,
    totalBruto,
    baseTributavel,
    inss,
    irrf,
    totalLiquido,
  }
}

// ---------------------------------------------------------------------------
// 6. Decimo Terceiro
// ---------------------------------------------------------------------------

export function calcularDecimoTerceiro(params: ParamsDecimoTerceiro): ResultadoDecimoTerceiro {
  const { salarioBruto, mesesTrabalhados, dependentes = 0, adicionaisHabituais = 0 } = params

  const baseComAdicionais = salarioBruto + adicionaisHabituais
  const valor13oBruto = r2((baseComAdicionais * Math.min(mesesTrabalhados, 12)) / 12)

  // 1a parcela: metade, sem descontos (paga ate 30/nov)
  const primeiraParcelaValor = r2(valor13oBruto / 2)

  // 2a parcela: restante com INSS e IRRF sobre o total
  const inss = calcularINSS(valor13oBruto)
  const irrf = calcularIRRF(valor13oBruto, inss.total, dependentes)

  const segundaParcelaBruto = r2(valor13oBruto - primeiraParcelaValor)
  const segundaParcelaLiquido = r2(segundaParcelaBruto - inss.total - irrf.imposto)

  const totalLiquido = r2(primeiraParcelaValor + segundaParcelaLiquido)

  return {
    valor13oBruto,
    primeiraParcelaValor,
    segundaParcelaBruto,
    inss,
    irrf,
    segundaParcelaLiquido,
    totalLiquido,
  }
}

// ---------------------------------------------------------------------------
// 7. Seguro Desemprego
// ---------------------------------------------------------------------------

export function calcularSeguroDesemprego(params: ParamsSeguroDesemprego): ResultadoSeguroDesemprego {
  const { salarioMedio, mesesTrabalhados, solicitacao } = params

  // Check eligibility
  const regra = REGRAS_PARCELAS_SEGURO.find((r) => r.solicitacao === solicitacao)
  if (!regra) {
    return {
      elegivel: false,
      motivoInelegibilidade: 'Tipo de solicitacao invalido',
      valorParcela: 0,
      quantidadeParcelas: 0,
      totalEstimado: 0,
    }
  }

  if (mesesTrabalhados < regra.mesesMinimos) {
    return {
      elegivel: false,
      motivoInelegibilidade: `Necessario minimo de ${regra.mesesMinimos} meses trabalhados para ${solicitacao} solicitacao. Voce tem ${mesesTrabalhados}.`,
      valorParcela: 0,
      quantidadeParcelas: 0,
      totalEstimado: 0,
    }
  }

  // Determine number of parcels
  let quantidadeParcelas = regra.parcelas[0]
  for (let i = 0; i < regra.faixasMeses.length; i++) {
    if (mesesTrabalhados >= regra.faixasMeses[i]) {
      quantidadeParcelas = regra.parcelas[i]
    }
  }

  // Calculate value per formula
  let valorParcela = 0
  for (const faixa of FAIXAS_SEGURO_DESEMPREGO_2026) {
    if (salarioMedio <= faixa.ate) {
      switch (faixa.formula) {
        case 'multiplicar':
          valorParcela = r2(salarioMedio * (faixa.fator ?? 0.8))
          break
        case 'fixo_mais_excedente': {
          const excedente = salarioMedio - (FAIXAS_SEGURO_DESEMPREGO_2026[0]?.ate ?? 0)
          valorParcela = r2((faixa.base ?? 0) + excedente * (faixa.excedenteFator ?? 0.5))
          break
        }
        case 'teto':
          valorParcela = TETO_SEGURO_DESEMPREGO_VALOR_2026
          break
      }
      break
    }
  }

  // Floor at minimum wage
  valorParcela = Math.max(valorParcela, PISO_SEGURO_DESEMPREGO_2026)

  return {
    elegivel: true,
    valorParcela,
    quantidadeParcelas,
    totalEstimado: r2(valorParcela * quantidadeParcelas),
  }
}

// ---------------------------------------------------------------------------
// 8. Rescisao
// ---------------------------------------------------------------------------

function calcularMesesTrabalhados(dataAdmissao: Date, dataDemissao: Date): number {
  const anos = dataDemissao.getFullYear() - dataAdmissao.getFullYear()
  const meses = dataDemissao.getMonth() - dataAdmissao.getMonth()
  const dias = dataDemissao.getDate() - dataAdmissao.getDate()
  let total = anos * 12 + meses
  if (dias >= 15) total += 1 // mes com >= 15 dias conta como 1
  return Math.max(total, 0)
}

function calcularAnosCompletos(dataAdmissao: Date, dataDemissao: Date): number {
  let anos = dataDemissao.getFullYear() - dataAdmissao.getFullYear()
  const mesAdm = dataAdmissao.getMonth()
  const mesDem = dataDemissao.getMonth()
  if (mesDem < mesAdm || (mesDem === mesAdm && dataDemissao.getDate() < dataAdmissao.getDate())) {
    anos -= 1
  }
  return Math.max(anos, 0)
}

// Which rights apply per termination type
const DIREITOS_POR_TIPO: Record<
  TipoRescisao,
  {
    saldoSalario: boolean
    avisoPrevio: boolean
    decimoTerceiro: boolean
    feriasProporcional: boolean
    feriasVencidas: boolean
    multaFGTS: number // 0, 0.20, or 0.40
  }
> = {
  sem_justa_causa: {
    saldoSalario: true,
    avisoPrevio: true,
    decimoTerceiro: true,
    feriasProporcional: true,
    feriasVencidas: true,
    multaFGTS: 0.40,
  },
  pedido_demissao: {
    saldoSalario: true,
    avisoPrevio: true,
    decimoTerceiro: true,
    feriasProporcional: true,
    feriasVencidas: true,
    multaFGTS: 0,
  },
  justa_causa: {
    saldoSalario: true,
    avisoPrevio: false,
    decimoTerceiro: false,
    feriasProporcional: false,
    feriasVencidas: true,
    multaFGTS: 0,
  },
  consensual: {
    saldoSalario: true,
    avisoPrevio: true, // 50% do aviso
    decimoTerceiro: true,
    feriasProporcional: true,
    feriasVencidas: true,
    multaFGTS: 0.20,
  },
  indireta: {
    saldoSalario: true,
    avisoPrevio: true,
    decimoTerceiro: true,
    feriasProporcional: true,
    feriasVencidas: true,
    multaFGTS: 0.40,
  },
  termino_contrato: {
    saldoSalario: true,
    avisoPrevio: false,
    decimoTerceiro: true,
    feriasProporcional: true,
    feriasVencidas: true,
    multaFGTS: 0,
  },
}

export function calcularRescisao(params: ParamsRescisao): ResultadoRescisao {
  const {
    salarioBruto,
    tipo,
    avisoPrevio,
    dataAdmissao,
    dataDemissao,
    diasTrabalhados,
    saldoFGTS = 0,
    feriasVencidas = false,
    dependentes = 0,
  } = params

  const direitos = DIREITOS_POR_TIPO[tipo]
  const anosCompletos = calcularAnosCompletos(dataAdmissao, dataDemissao)
  const mesesProporcional = calcularMesesTrabalhados(dataAdmissao, dataDemissao) % 12 || 12
  const valorDia = salarioBruto / 30
  const verbas: VerbaRescisoria[] = []

  // Saldo de salario
  const saldoSalario = direitos.saldoSalario ? r2(diasTrabalhados * valorDia) : 0
  if (saldoSalario > 0) verbas.push({ label: 'Saldo de Salario', valor: saldoSalario, tipo: 'provento' })

  // Aviso previo
  let diasAviso = 0
  let valorAviso = 0
  if (direitos.avisoPrevio && avisoPrevio === 'indenizado') {
    diasAviso = calcularDiasAvisoPrevio(anosCompletos)
    if (tipo === 'consensual') diasAviso = Math.round(diasAviso / 2) // 50% para consensual
    valorAviso = r2(diasAviso * valorDia)
    verbas.push({ label: 'Aviso Previo Indenizado', valor: valorAviso, tipo: 'provento' })
  } else if (direitos.avisoPrevio && avisoPrevio === 'trabalhado') {
    diasAviso = 30 // trabalhado = 30 dias fixos
    valorAviso = 0 // ja esta no salario
  }

  // 13o proporcional
  const mesesPara13o = Math.min(mesesProporcional, 12)
  const decimoTerceiroProporcional = direitos.decimoTerceiro ? r2((salarioBruto * mesesPara13o) / 12) : 0
  if (decimoTerceiroProporcional > 0)
    verbas.push({ label: '13o Salario Proporcional', valor: decimoTerceiroProporcional, tipo: 'provento' })

  // Ferias proporcionais + 1/3
  const feriasProporcional = direitos.feriasProporcional ? r2((salarioBruto * mesesProporcional) / 12) : 0
  const tercoFeriasProporcional = r2(feriasProporcional / 3)
  if (feriasProporcional > 0) {
    verbas.push({ label: 'Ferias Proporcionais', valor: feriasProporcional, tipo: 'provento' })
    verbas.push({ label: '1/3 Ferias Proporcionais', valor: tercoFeriasProporcional, tipo: 'provento' })
  }

  // Ferias vencidas + 1/3
  const feriasVencidasValor = direitos.feriasVencidas && feriasVencidas ? salarioBruto : 0
  const tercoFeriasVencidas = r2(feriasVencidasValor / 3)
  if (feriasVencidasValor > 0) {
    verbas.push({ label: 'Ferias Vencidas', valor: feriasVencidasValor, tipo: 'provento' })
    verbas.push({ label: '1/3 Ferias Vencidas', valor: tercoFeriasVencidas, tipo: 'provento' })
  }

  // Multa FGTS
  const multaFGTS = r2(saldoFGTS * direitos.multaFGTS)
  const percentualMultaFGTS = direitos.multaFGTS
  if (multaFGTS > 0) verbas.push({ label: 'Multa FGTS', valor: multaFGTS, tipo: 'provento' })

  // Total bruto (proventos)
  const totalBruto = r2(
    saldoSalario +
      valorAviso +
      decimoTerceiroProporcional +
      feriasProporcional +
      tercoFeriasProporcional +
      feriasVencidasValor +
      tercoFeriasVencidas +
      multaFGTS
  )

  // Descontos: INSS e IRRF sobre verbas salariais (saldo + 13o)
  const baseSalarial = r2(saldoSalario + decimoTerceiroProporcional)
  const inss = calcularINSS(baseSalarial)
  const irrf = calcularIRRF(baseSalarial, inss.total, dependentes)

  if (inss.total > 0) verbas.push({ label: 'INSS', valor: inss.total, tipo: 'desconto' })
  if (irrf.imposto > 0) verbas.push({ label: 'IRRF', valor: irrf.imposto, tipo: 'desconto' })

  const totalDescontos = r2(inss.total + irrf.imposto)

  return {
    tipo,
    avisoPrevio: { dias: diasAviso, valor: valorAviso },
    saldoSalario,
    decimoTerceiroProporcional,
    feriasProporcional,
    tercoFeriasProporcional,
    feriasVencidas: feriasVencidasValor,
    tercoFeriasVencidas,
    multaFGTS,
    percentualMultaFGTS,
    inss,
    irrf,
    totalBruto,
    totalDescontos,
    totalLiquido: r2(totalBruto - totalDescontos),
    verbas,
  }
}

// ---------------------------------------------------------------------------
// 9. Adicional Noturno
// ---------------------------------------------------------------------------

const PERIODOS_NOTURNOS: Record<TipoTrabalhoNoturno, string> = {
  urbano: '22h as 5h',
  rural_pecuaria: '20h as 4h',
  rural_lavoura: '21h as 5h',
}

export function calcularAdicionalNoturno(params: ParamsAdicionalNoturno): ResultadoAdicionalNoturno {
  const { salarioBruto, horasMensais = 220, horasNoturnas, tipo = 'urbano' } = params

  const valorHoraNormal = r2(salarioBruto / horasMensais)

  // Hora ficta: urbano = 52min30s (60/52.5), rural = 60min
  const fatorHoraFicta = tipo === 'urbano' ? 60 / HORA_NOTURNA_REDUZIDA_MINUTOS : 1
  const horasFictas = r2(horasNoturnas * fatorHoraFicta)

  const adicionalPorHora = r2(valorHoraNormal * ADICIONAL_NOTURNO_PERCENTUAL)
  const totalAdicional = r2(horasFictas * adicionalPorHora)

  return {
    tipo,
    horasInput: horasNoturnas,
    horasFictas,
    valorHoraNormal,
    adicionalPorHora,
    totalAdicional,
    periodoNoturno: PERIODOS_NOTURNOS[tipo],
  }
}

// ---------------------------------------------------------------------------
// 10. Insalubridade / Periculosidade
// ---------------------------------------------------------------------------

export function calcularInsalubridadePericulosidade(
  params: ParamsInsalubridadePericulosidade
): ResultadoInsalubridadePericulosidade {
  const { salarioBruto, insalubridade, periculosidade = false } = params

  const grauInsalubridade = insalubridade ?? null
  const percentualInsalubridade = grauInsalubridade ? INSALUBRIDADE_PERCENTUAIS[grauInsalubridade] : 0
  const valorInsalubridade = r2(SALARIO_MINIMO_2026 * percentualInsalubridade)

  const percentualPericulosidade = periculosidade ? PERICULOSIDADE_PERCENTUAL : 0
  const valorPericulosidade = r2(salarioBruto * percentualPericulosidade)

  // Non-cumulation rule: worker chooses the higher value
  const cumulacao = false // Vedada acumulacao (Sumula 364 TST / Art. 193 §2 CLT)
  let maiorValor = 0
  let tipoMaiorValor: 'insalubridade' | 'periculosidade' | 'nenhum' = 'nenhum'

  if (valorInsalubridade > 0 || valorPericulosidade > 0) {
    if (valorInsalubridade >= valorPericulosidade) {
      maiorValor = valorInsalubridade
      tipoMaiorValor = 'insalubridade'
    } else {
      maiorValor = valorPericulosidade
      tipoMaiorValor = 'periculosidade'
    }
  }

  return {
    insalubridade: {
      grau: grauInsalubridade,
      baseCalculo: SALARIO_MINIMO_2026,
      percentual: percentualInsalubridade,
      valor: valorInsalubridade,
    },
    periculosidade: {
      baseCalculo: salarioBruto,
      percentual: percentualPericulosidade,
      valor: valorPericulosidade,
    },
    cumulacao,
    maiorValor,
    tipoMaiorValor,
  }
}

// ---------------------------------------------------------------------------
// 11. FGTS Acumulado
// ---------------------------------------------------------------------------

export function calcularFGTSAcumulado(params: ParamsFGTSAcumulado): ResultadoFGTSAcumulado {
  const { salarioBruto, mesesTrabalhados, incluir13o = true, incluirFerias = true } = params

  const depositoMensal = r2(salarioBruto * FGTS_PERCENTUAL)
  const deposito13o = incluir13o ? depositoMensal : 0 // 1 deposito extra/ano
  const depositoFerias = incluirFerias ? r2(depositoMensal / 3) : 0 // 1/3 adicional

  const detalhamento: DepositoFGTSMensal[] = []
  let saldoAcumulado = 0
  let totalDepositos = 0
  let totalRendimentos = 0

  for (let mes = 1; mes <= mesesTrabalhados; mes++) {
    let deposito = depositoMensal

    // 13o deposit in December-equivalent months (every 12th month)
    if (incluir13o && mes % 12 === 0) {
      deposito += deposito13o
    }

    // Ferias deposit once per year (every 12th month)
    if (incluirFerias && mes % 12 === 0) {
      deposito += depositoFerias
    }

    deposito = r2(deposito)
    totalDepositos = r2(totalDepositos + deposito)

    // Apply interest on previous balance + new deposit
    saldoAcumulado += deposito
    const rendimento = r2(saldoAcumulado * FGTS_RENDIMENTO_MENSAL)
    totalRendimentos = r2(totalRendimentos + rendimento)
    saldoAcumulado = r2(saldoAcumulado + rendimento)

    detalhamento.push({
      mes,
      deposito,
      rendimento,
      saldoAcumulado,
    })
  }

  return {
    depositoMensal,
    deposito13o,
    depositoFerias,
    totalDepositos,
    totalRendimentos,
    saldoEstimado: saldoAcumulado,
    detalhamento,
  }
}

// ---------------------------------------------------------------------------
// 12. Simulador de Acao Trabalhista
// ---------------------------------------------------------------------------

// Verbas that do NOT generate reflexos
const VERBAS_SEM_REFLEXO: VerbaAcao[] = ['dano_moral', 'ferias_nao_gozadas']

function calcularVerbaSimulada(
  verba: VerbaSimulacao,
  salarioBruto: number
): ResultadoVerbaSimulada {
  let valorBase = 0

  switch (verba.tipo) {
    case 'horas_extras':
    case 'intervalo_suprimido':
    case 'desvio_funcao':
      // valorMensal * meses
      valorBase = r2(verba.valorMensal * verba.meses)
      break

    case 'adicional_noturno':
      valorBase = r2(verba.valorMensal * verba.meses)
      break

    case 'insalubridade':
      valorBase = r2(verba.valorMensal * verba.meses)
      break

    case 'periculosidade':
      valorBase = r2(verba.valorMensal * verba.meses)
      break

    case 'fgts_nao_depositado':
      // 8% * salario * meses
      valorBase = r2(salarioBruto * FGTS_PERCENTUAL * verba.meses)
      break

    case 'ferias_nao_gozadas':
      // salario + 1/3 per period
      valorBase = r2((salarioBruto + salarioBruto / 3) * verba.meses)
      break

    case 'decimo_terceiro':
      valorBase = r2(verba.valorMensal * verba.meses)
      break

    case 'dano_moral': {
      const multiplicador = verba.gravidade
        ? MULTIPLICADORES_DANO_MORAL[verba.gravidade]
        : MULTIPLICADORES_DANO_MORAL.medio
      valorBase = r2(salarioBruto * multiplicador)
      break
    }
  }

  const temReflexo = !VERBAS_SEM_REFLEXO.includes(verba.tipo)

  const reflexoDSR = temReflexo ? r2(valorBase / 6) : 0
  const baseComDSR = valorBase + reflexoDSR
  const reflexoFerias = temReflexo ? r2(baseComDSR / 12 + baseComDSR / 12 / 3) : 0
  const reflexo13o = temReflexo ? r2(baseComDSR / 12) : 0
  const reflexoFGTS = temReflexo
    ? r2((baseComDSR + reflexoFerias + reflexo13o) * FGTS_PERCENTUAL * (1 + FGTS_MULTA_PERCENTUAL))
    : 0

  const totalComReflexos = r2(valorBase + reflexoDSR + reflexoFerias + reflexo13o + reflexoFGTS)

  return {
    tipo: verba.tipo,
    label: LABELS_VERBAS[verba.tipo],
    valorBase,
    reflexoDSR,
    reflexoFerias,
    reflexo13o,
    reflexoFGTS,
    totalComReflexos,
  }
}

export function calcularSimuladorAcao(params: ParamsSimuladorAcao): ResultadoSimuladorAcao {
  const { salarioBruto, verbas: verbasInput } = params

  const verbas = verbasInput.map((v) => calcularVerbaSimulada(v, salarioBruto))

  const totalBase = r2(verbas.reduce((acc, v) => acc + v.valorBase, 0))
  const totalComReflexos = r2(verbas.reduce((acc, v) => acc + v.totalComReflexos, 0))
  const totalReflexos = r2(totalComReflexos - totalBase)

  const cenarios: CenarioSimulacao[] = [
    { nome: 'Cenario Baixo', fator: 0.80, total: r2(totalComReflexos * 0.80) },
    { nome: 'Cenario Medio', fator: 1.00, total: totalComReflexos },
    { nome: 'Cenario Alto', fator: 1.20, total: r2(totalComReflexos * 1.20) },
  ]

  return {
    verbas,
    totalBase,
    totalReflexos,
    cenarios,
  }
}
