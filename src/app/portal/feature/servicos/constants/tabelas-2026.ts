// Valores de Referencia 2026
export const SALARIO_MINIMO_2026 = 1_621.00
export const TETO_INSS_2026 = 8_475.55
export const TETO_SEGURO_DESEMPREGO_2026 = 2_518.65
export const DEDUCAO_DEPENDENTE_IRRF_2026 = 189.59
export const FGTS_PERCENTUAL = 0.08
export const FGTS_MULTA_PERCENTUAL = 0.40

// Tabela INSS Progressiva 2026
export interface FaixaINSS {
  ate: number
  aliquota: number
}

export const FAIXAS_INSS_2026: FaixaINSS[] = [
  { ate: 1_621.00, aliquota: 0.075 },
  { ate: 2_625.22, aliquota: 0.09 },
  { ate: 5_250.49, aliquota: 0.12 },
  { ate: 8_475.55, aliquota: 0.14 },
]

// Tabela IRRF Progressiva 2026
export interface FaixaIRRF {
  ate: number       // Infinity para ultima faixa
  aliquota: number
  deducao: number
}

export const FAIXAS_IRRF_2026: FaixaIRRF[] = [
  { ate: 2_259.20, aliquota: 0, deducao: 0 },
  { ate: 2_826.65, aliquota: 0.075, deducao: 169.44 },
  { ate: 3_751.05, aliquota: 0.15, deducao: 381.44 },
  { ate: 4_664.68, aliquota: 0.225, deducao: 662.77 },
  { ate: Infinity, aliquota: 0.275, deducao: 896.00 },
]

// Redutor mensal Lei 15.270/2025
export const REDUTOR_LEI_15270_2025 = 564.80

// Tabela Seguro-Desemprego 2026
export interface FaixaSeguroDesemprego {
  ate: number
  formula: 'multiplicar' | 'fixo_mais_excedente' | 'teto'
  fator?: number
  base?: number
  excedenteFator?: number
}

export const FAIXAS_SEGURO_DESEMPREGO_2026: FaixaSeguroDesemprego[] = [
  { ate: 2_138.76, formula: 'multiplicar', fator: 0.8 },
  { ate: 3_564.96, formula: 'fixo_mais_excedente', base: 1_711.01, excedenteFator: 0.5 },
  { ate: Infinity, formula: 'teto' },
]

export const PISO_SEGURO_DESEMPREGO_2026 = 1_621.00 // = SALARIO_MINIMO_2026
export const TETO_SEGURO_DESEMPREGO_VALOR_2026 = 2_518.65

// Tabela Parcelas Seguro-Desemprego
export interface RegraParcelasSeguro {
  solicitacao: '1a' | '2a' | '3a_ou_mais'
  mesesMinimos: number
  parcelas: [number, number, number]
  faixasMeses: [number, number, number]
}

export const REGRAS_PARCELAS_SEGURO: RegraParcelasSeguro[] = [
  { solicitacao: '1a', mesesMinimos: 12, parcelas: [4, 5, 5], faixasMeses: [12, 23, 24] },
  { solicitacao: '2a', mesesMinimos: 9, parcelas: [3, 4, 5], faixasMeses: [9, 11, 12] },
  { solicitacao: '3a_ou_mais', mesesMinimos: 6, parcelas: [3, 4, 5], faixasMeses: [6, 11, 12] },
]

// Aviso Previo Proporcional
export function calcularDiasAvisoPrevio(anosCompletos: number): number {
  return Math.min(30 + anosCompletos * 3, 90)
}

// Reducao Ferias por Faltas (Art. 130 CLT)
export const REDUCAO_FERIAS_POR_FALTAS: { faltasAte: number; diasFerias: number }[] = [
  { faltasAte: 5, diasFerias: 30 },
  { faltasAte: 14, diasFerias: 24 },
  { faltasAte: 23, diasFerias: 18 },
  { faltasAte: 32, diasFerias: 12 },
]

// Adicional Noturno
export const ADICIONAL_NOTURNO_PERCENTUAL = 0.20
export const HORA_NOTURNA_REDUZIDA_MINUTOS = 52.5

// Insalubridade / Periculosidade
export type GrauInsalubridade = 'minimo' | 'medio' | 'maximo'

export const INSALUBRIDADE_PERCENTUAIS: Record<GrauInsalubridade, number> = {
  minimo: 0.10,
  medio: 0.20,
  maximo: 0.40,
}

export const PERICULOSIDADE_PERCENTUAL = 0.30

// FGTS Rendimento
export const FGTS_RENDIMENTO_ANUAL = 0.03
export const FGTS_RENDIMENTO_MENSAL = 0.0025

// Danos Morais (Art. 223-G CLT)
export type GravidadeDanoMoral = 'leve' | 'medio' | 'grave' | 'gravissimo'

export const MULTIPLICADORES_DANO_MORAL: Record<GravidadeDanoMoral, number> = {
  leve: 3,
  medio: 5,
  grave: 20,
  gravissimo: 50,
}
