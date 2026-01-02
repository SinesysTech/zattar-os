import type {
  AcordoCondenacao,
  Parcela,
  Repasse,
  TipoObrigacao,
  DirecaoObrigacao,
  StatusParcela,
} from '../domain';

export function criarAcordoMock(overrides: Partial<AcordoCondenacao> = {}): AcordoCondenacao {
  return {
    id: 1,
    processoId: 100,
    tipo: 'acordo',
    direcao: 'recebimento',
    valorTotal: 10000,
    numeroParcelas: 2,
    percentualEscritorio: 30,
    dataVencimentoPrimeiraParcela: new Date('2024-01-15'),
    intervaloVencimentoDias: 30,
    incluirHonorariosSucumbenciais: false,
    valorHonorariosSucumbenciais: null,
    observacoes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function criarParcelaMock(overrides: Partial<Parcela> = {}): Parcela {
  return {
    id: 1,
    acordoCondenacaoId: 1,
    numeroParcela: 1,
    dataVencimento: new Date('2024-01-15'),
    valorBrutoCreditoPrincipal: 5000,
    valorHonorariosSucumbenciaisEscritorio: null,
    valorLiquidoRepasse: 3500,
    valorLiquidoEscritorio: 1500,
    status: 'pendente',
    dataEfetivacao: null,
    valorEfetivado: null,
    formaPagamento: null,
    comprovantePagamentoUrl: null,
    observacoes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function criarRepasseMock(overrides: Partial<Repasse> = {}): Repasse {
  return {
    id: 1,
    parcelaId: 1,
    processoId: 100,
    clienteId: 50,
    valorRepasse: 3500,
    dataRepassePrevista: new Date('2024-01-20'),
    dataRepasseEfetivado: null,
    statusRepasse: 'pendente',
    declaracaoPrestacaoContasUrl: null,
    comprovanteRepasseUrl: null,
    observacoes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function criarAcordoComParcelasMock(
  numeroParcelas: number = 2,
  acordoOverrides: Partial<AcordoCondenacao> = {}
): { acordo: AcordoCondenacao; parcelas: Parcela[] } {
  const acordo = criarAcordoMock({
    numeroParcelas,
    ...acordoOverrides,
  });

  const valorParcela = acordo.valorTotal / numeroParcelas;

  const parcelas = Array.from({ length: numeroParcelas }, (_, index) =>
    criarParcelaMock({
      acordoCondenacaoId: acordo.id,
      numeroParcela: index + 1,
      dataVencimento: new Date(
        new Date(acordo.dataVencimentoPrimeiraParcela).getTime() +
          index * acordo.intervaloVencimentoDias * 24 * 60 * 60 * 1000
      ),
      valorBrutoCreditoPrincipal: valorParcela,
      valorLiquidoRepasse: valorParcela * (1 - acordo.percentualEscritorio / 100),
      valorLiquidoEscritorio: valorParcela * (acordo.percentualEscritorio / 100),
    })
  );

  return { acordo, parcelas };
}

export function criarParcelaRecebidaMock(overrides: Partial<Parcela> = {}): Parcela {
  return criarParcelaMock({
    status: 'recebido',
    dataEfetivacao: new Date('2024-01-16'),
    valorEfetivado: 5000,
    formaPagamento: 'pix',
    comprovantePagamentoUrl: 'https://storage.example.com/comprovante.pdf',
    ...overrides,
  });
}

export function criarParcelaCanceladaMock(overrides: Partial<Parcela> = {}): Parcela {
  return criarParcelaMock({
    status: 'cancelado',
    observacoes: 'Acordo cancelado por descumprimento',
    ...overrides,
  });
}

export function criarRepassePendenteMock(overrides: Partial<Repasse> = {}): Repasse {
  return criarRepasseMock({
    statusRepasse: 'pendente',
    declaracaoPrestacaoContasUrl: 'https://storage.example.com/declaracao.pdf',
    ...overrides,
  });
}

export function criarRepasseEfetivadoMock(overrides: Partial<Repasse> = {}): Repasse {
  return criarRepasseMock({
    statusRepasse: 'efetivado',
    dataRepasseEfetivado: new Date('2024-01-22'),
    declaracaoPrestacaoContasUrl: 'https://storage.example.com/declaracao.pdf',
    comprovanteRepasseUrl: 'https://storage.example.com/comprovante-repasse.pdf',
    ...overrides,
  });
}

export const mockFormaPagamento = {
  pix: 'pix',
  transferencia: 'transferencia',
  dinheiro: 'dinheiro',
  cheque: 'cheque',
} as const;

export const mockStatusParcela: Record<string, StatusParcela> = {
  pendente: 'pendente',
  recebido: 'recebido',
  atrasado: 'atrasado',
  cancelado: 'cancelado',
};

export const mockTipoObrigacao: Record<string, TipoObrigacao> = {
  acordo: 'acordo',
  condenacao: 'condenacao',
};

export const mockDirecaoObrigacao: Record<string, DirecaoObrigacao> = {
  recebimento: 'recebimento',
  pagamento: 'pagamento',
};
