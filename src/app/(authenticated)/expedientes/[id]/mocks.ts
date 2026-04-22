import type { Expediente } from '@/app/(authenticated)/expedientes/domain';
import {
  GrauTribunal,
  OrigemExpediente,
  ResultadoDecisao,
} from '@/app/(authenticated)/expedientes/domain';

export interface MockUsuario {
  id: number;
  nomeExibicao: string;
  nomeCompleto: string;
  avatarUrl: string | null;
  cargo?: string;
}

export interface MockTipoExpediente {
  id: number;
  tipo_expediente: string;
}

export interface MockArquivo {
  id: string;
  nome: string;
  tipo: 'pdf' | 'docx' | 'imagem' | 'outro';
  tamanhoBytes: number;
  url: string;
  criadoEm: string;
  categoria: 'intimacao' | 'decisao' | 'peca' | 'anexo';
}

export interface MockHistoricoEvento {
  id: string;
  tipo:
    | 'criacao'
    | 'atribuicao_responsavel'
    | 'alteracao_tipo'
    | 'alteracao_descricao'
    | 'alteracao_observacoes'
    | 'baixa'
    | 'reversao_baixa'
    | 'visualizacao';
  data: string;
  autorId: number | null;
  descricao: string;
  dadosAnteriores?: Record<string, unknown>;
  dadosNovos?: Record<string, unknown>;
}

export const MOCK_USUARIOS: MockUsuario[] = [
  {
    id: 1,
    nomeExibicao: 'Jordan Medeiros',
    nomeCompleto: 'Jordan Medeiros',
    avatarUrl: null,
    cargo: 'Advogado sênior',
  },
  {
    id: 2,
    nomeExibicao: 'Ana Prado',
    nomeCompleto: 'Ana Caroline Prado',
    avatarUrl: null,
    cargo: 'Advogada associada',
  },
  {
    id: 3,
    nomeExibicao: 'Rafael Souza',
    nomeCompleto: 'Rafael Souza Lima',
    avatarUrl: null,
    cargo: 'Estagiário',
  },
  {
    id: 4,
    nomeExibicao: 'Carla Vieira',
    nomeCompleto: 'Carla Vieira Rocha',
    avatarUrl: null,
    cargo: 'Advogada trabalhista',
  },
];

export const MOCK_TIPOS_EXPEDIENTES: MockTipoExpediente[] = [
  { id: 1, tipo_expediente: 'Intimação' },
  { id: 2, tipo_expediente: 'Despacho' },
  { id: 3, tipo_expediente: 'Sentença' },
  { id: 4, tipo_expediente: 'Decisão interlocutória' },
  { id: 5, tipo_expediente: 'Acórdão' },
  { id: 6, tipo_expediente: 'Audiência designada' },
  { id: 7, tipo_expediente: 'Manifestação requerida' },
  { id: 8, tipo_expediente: 'Publicação DJE' },
];

export const MOCK_EXPEDIENTE: Expediente = {
  id: 12847,
  idPje: 883729301,
  advogadoId: 1,
  processoId: 9184,
  trt: 'TRT3',
  grau: GrauTribunal.PRIMEIRO_GRAU,
  numeroProcesso: '0010234-87.2024.5.03.0015',
  descricaoOrgaoJulgador: '15ª Vara do Trabalho de Belo Horizonte',
  siglaOrgaoJulgador: 'VT15 BH',
  classeJudicial: 'Ação Trabalhista - Rito Ordinário',
  numero: 15,
  segredoJustica: false,
  codigoStatusProcesso: 'ATIVO',
  prioridadeProcessual: true,
  nomeParteAutora: 'Maurício Tavares Pereira',
  qtdeParteAutora: 1,
  nomeParteRe: 'Construtora Horizonte Azul S.A.',
  qtdeParteRe: 1,
  dataAutuacao: '2024-03-14',
  juizoDigital: true,
  dataArquivamento: null,
  idDocumento: 55871,
  dataCienciaParte: '2026-04-15',
  dataPrazoLegalParte: '2026-04-25',
  dataCriacaoExpediente: '2026-04-15T09:14:00Z',
  prazoVencido: false,
  dadosAnteriores: null,
  responsavelId: 2,
  baixadoEm: null,
  protocoloId: null,
  justificativaBaixa: null,
  tipoExpedienteId: 7,
  descricaoArquivos:
    'Fica a parte reclamante intimada para, no prazo legal de 10 (dez) dias, manifestar-se sobre o laudo pericial médico apresentado às fls. 432-458, especificamente quanto às conclusões sobre nexo causal entre as atividades laborais e a lesão diagnosticada em L4-L5, sob pena de preclusão. Documentos médicos complementares podem ser anexados desde que acompanhados de relatório técnico subscrito por profissional habilitado.',
  arquivoNome: 'intimacao-expediente-12847.pdf',
  arquivoUrl: 'https://mock-storage/zattar/intimacao-12847.pdf',
  arquivoBucket: 'expedientes',
  arquivoKey: 'intimacao-12847.pdf',
  observacoes:
    'Cliente pediu análise acelerada — audiência já marcada para 08/05. Laudo pericial é favorável em 3 dos 5 pontos. Priorizar resposta técnica sobre divergências nas conclusões 2 e 4. Articular com Dr. Mendes (perito assistente) antes de protocolar manifestação.',
  origem: OrigemExpediente.CAPTURA,
  resultadoDecisao: null,
  createdAt: '2026-04-15T09:14:00Z',
  updatedAt: '2026-04-22T11:32:00Z',
  trtOrigem: 'TRT3',
  nomeParteAutoraOrigem: 'Maurício Tavares Pereira',
  nomeParteReOrigem: 'Construtora Horizonte Azul S.A.',
  orgaoJulgadorOrigem: '15ª Vara do Trabalho de Belo Horizonte',
};

export const MOCK_ARQUIVOS: MockArquivo[] = [
  {
    id: 'arq-001',
    nome: 'intimacao-oficial-12847.pdf',
    tipo: 'pdf',
    tamanhoBytes: 284_512,
    url: 'https://mock-storage/zattar/intimacao-12847.pdf',
    criadoEm: '2026-04-15T09:14:00Z',
    categoria: 'intimacao',
  },
  {
    id: 'arq-002',
    nome: 'laudo-pericial-medico-fls-432-458.pdf',
    tipo: 'pdf',
    tamanhoBytes: 1_893_204,
    url: 'https://mock-storage/zattar/laudo-pericial.pdf',
    criadoEm: '2026-04-12T14:02:00Z',
    categoria: 'peca',
  },
  {
    id: 'arq-003',
    nome: 'despacho-saneador.pdf',
    tipo: 'pdf',
    tamanhoBytes: 142_890,
    url: 'https://mock-storage/zattar/despacho-saneador.pdf',
    criadoEm: '2026-03-28T10:45:00Z',
    categoria: 'decisao',
  },
  {
    id: 'arq-004',
    nome: 'quesitos-complementares.docx',
    tipo: 'docx',
    tamanhoBytes: 32_108,
    url: 'https://mock-storage/zattar/quesitos.docx',
    criadoEm: '2026-04-18T16:20:00Z',
    categoria: 'anexo',
  },
];

export const MOCK_HISTORICO: MockHistoricoEvento[] = [
  {
    id: 'evt-001',
    tipo: 'criacao',
    data: '2026-04-15T09:14:00Z',
    autorId: null,
    descricao: 'Expediente capturado automaticamente via PJE.',
  },
  {
    id: 'evt-002',
    tipo: 'atribuicao_responsavel',
    data: '2026-04-15T09:22:00Z',
    autorId: 1,
    descricao: 'Ana Prado atribuída como responsável.',
    dadosNovos: { responsavelId: 2 },
  },
  {
    id: 'evt-003',
    tipo: 'alteracao_tipo',
    data: '2026-04-16T11:08:00Z',
    autorId: 2,
    descricao: 'Tipo alterado de "Intimação" para "Manifestação requerida".',
    dadosAnteriores: { tipoExpedienteId: 1 },
    dadosNovos: { tipoExpedienteId: 7 },
  },
  {
    id: 'evt-004',
    tipo: 'alteracao_observacoes',
    data: '2026-04-18T15:44:00Z',
    autorId: 2,
    descricao: 'Observações atualizadas com plano de manifestação.',
  },
  {
    id: 'evt-005',
    tipo: 'visualizacao',
    data: '2026-04-22T11:32:00Z',
    autorId: 1,
    descricao: 'Visualização pelo responsável técnico.',
  },
];

export const MOCK_DATA_BUNDLE = {
  expediente: MOCK_EXPEDIENTE,
  usuarios: MOCK_USUARIOS,
  tiposExpedientes: MOCK_TIPOS_EXPEDIENTES,
  arquivos: MOCK_ARQUIVOS,
  historico: MOCK_HISTORICO,
  decisaoOptions: Object.values(ResultadoDecisao),
};

export type ExpedienteDetailBundle = typeof MOCK_DATA_BUNDLE;
