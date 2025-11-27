// Dados mockados para a Dashboard Sandbox
// Baseados na estrutura real do Sinesys

import {
  ProcessoMock,
  AudienciaMock,
  PendenteMock,
  TarefaMock,
  NotaMock,
  LinkMock,
  UsuarioMock,
  CapturaMock,
  ProcessoResumo,
  AudienciasResumo,
  PendentesResumo,
  ProdutividadeResumo,
  CargaUsuario,
  MetricasEscritorio,
  StatusCapturas,
  PerformanceAdvogado,
} from '../types/dashboard.types';

// ============================================================================
// Usuários Mock
// ============================================================================

export const mockUsuarioAtual: UsuarioMock = {
  id: 1,
  nome_completo: 'Dr. João Silva Advogado',
  nome_exibicao: 'João Silva',
  email_corporativo: 'joao.silva@zattar.adv.br',
  cargo: 'Advogado Sênior',
  is_super_admin: false,
  ativo: true,
};

export const mockSuperadmin: UsuarioMock = {
  id: 10,
  nome_completo: 'Super Administrador',
  nome_exibicao: 'Admin',
  email_corporativo: 'admin@zattar.adv.br',
  cargo: 'Administrador',
  is_super_admin: true,
  ativo: true,
};

export const mockUsuarios: UsuarioMock[] = [
  mockUsuarioAtual,
  {
    id: 2,
    nome_completo: 'Dra. Maria Santos',
    nome_exibicao: 'Maria Santos',
    email_corporativo: 'maria.santos@zattar.adv.br',
    cargo: 'Advogada Plena',
    is_super_admin: false,
    ativo: true,
  },
  {
    id: 3,
    nome_completo: 'Dr. Pedro Oliveira',
    nome_exibicao: 'Pedro Oliveira',
    email_corporativo: 'pedro.oliveira@zattar.adv.br',
    cargo: 'Advogado Júnior',
    is_super_admin: false,
    ativo: true,
  },
  {
    id: 4,
    nome_completo: 'Dra. Ana Costa',
    nome_exibicao: 'Ana Costa',
    email_corporativo: 'ana.costa@zattar.adv.br',
    cargo: 'Advogada Sênior',
    is_super_admin: false,
    ativo: true,
  },
  {
    id: 5,
    nome_completo: 'Dr. Carlos Ferreira',
    nome_exibicao: 'Carlos Ferreira',
    email_corporativo: 'carlos.ferreira@zattar.adv.br',
    cargo: 'Advogado Pleno',
    is_super_admin: false,
    ativo: true,
  },
];

// ============================================================================
// Processos Mock
// ============================================================================

export const mockProcessos: ProcessoMock[] = [
  {
    id: 1,
    numero_processo: '0001234-56.2024.5.09.0001',
    trt: 9,
    grau: 'primeiro_grau',
    polo_ativo: 'João da Silva Santos',
    polo_passivo: 'Empresa ABC Indústria Ltda',
    status: 'ativo',
    responsavel_id: 1,
    classe_judicial: 'Ação Trabalhista - Rito Ordinário',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    numero_processo: '0002345-67.2024.5.09.0002',
    trt: 9,
    grau: 'primeiro_grau',
    polo_ativo: 'Maria Aparecida Souza',
    polo_passivo: 'Comércio XYZ Eireli',
    status: 'ativo',
    responsavel_id: 1,
    classe_judicial: 'Ação Trabalhista - Rito Sumaríssimo',
    created_at: '2024-02-20T14:30:00Z',
  },
  {
    id: 3,
    numero_processo: '0003456-78.2024.5.15.0001',
    trt: 15,
    grau: 'primeiro_grau',
    polo_ativo: 'Pedro Henrique Lima',
    polo_passivo: 'Transportadora Rápida SA',
    status: 'ativo',
    responsavel_id: 1,
    classe_judicial: 'Ação Trabalhista - Rito Ordinário',
    created_at: '2024-03-10T09:15:00Z',
  },
  {
    id: 4,
    numero_processo: '0004567-89.2023.5.09.0003',
    trt: 9,
    grau: 'segundo_grau',
    polo_ativo: 'Ana Paula Rodrigues',
    polo_passivo: 'Banco Nacional SA',
    status: 'ativo',
    responsavel_id: 1,
    classe_judicial: 'Recurso Ordinário',
    created_at: '2023-11-05T16:45:00Z',
  },
  {
    id: 5,
    numero_processo: '0005678-90.2024.5.04.0001',
    trt: 4,
    grau: 'primeiro_grau',
    polo_ativo: 'Carlos Eduardo Melo',
    polo_passivo: 'Construtora Forte Ltda',
    status: 'arquivado',
    responsavel_id: 1,
    classe_judicial: 'Ação Trabalhista - Rito Ordinário',
    created_at: '2024-01-08T11:20:00Z',
  },
  // Processos de outros usuários (para visão admin)
  {
    id: 6,
    numero_processo: '0006789-01.2024.5.09.0004',
    trt: 9,
    grau: 'primeiro_grau',
    polo_ativo: 'Fernanda Almeida',
    polo_passivo: 'Tech Solutions Ltda',
    status: 'ativo',
    responsavel_id: 2,
    classe_judicial: 'Ação Trabalhista - Rito Ordinário',
    created_at: '2024-04-01T08:00:00Z',
  },
  {
    id: 7,
    numero_processo: '0007890-12.2024.5.15.0002',
    trt: 15,
    grau: 'primeiro_grau',
    polo_ativo: 'Roberto Nascimento',
    polo_passivo: 'Varejo Total SA',
    status: 'ativo',
    responsavel_id: 3,
    classe_judicial: 'Ação Trabalhista - Rito Sumaríssimo',
    created_at: '2024-04-15T10:30:00Z',
  },
];

// ============================================================================
// Audiências Mock
// ============================================================================

const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const mockAudiencias: AudienciaMock[] = [
  {
    id: 1,
    processo_id: 1,
    numero_processo: '0001234-56.2024.5.09.0001',
    trt: 9,
    data_audiencia: formatDate(today),
    hora_audiencia: '14:00',
    tipo_audiencia: 'INSTRUÇÃO',
    modalidade: 'VIDEOCONFERENCIA',
    sala: 'Sala Virtual 01',
    url_virtual: 'https://meet.google.com/abc-defg-hij',
    responsavel_id: 1,
    polo_ativo: 'João da Silva Santos',
    polo_passivo: 'Empresa ABC Indústria Ltda',
  },
  {
    id: 2,
    processo_id: 2,
    numero_processo: '0002345-67.2024.5.09.0002',
    trt: 9,
    data_audiencia: formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)),
    hora_audiencia: '09:30',
    tipo_audiencia: 'UNA',
    modalidade: 'PRESENCIAL',
    sala: 'Sala 203',
    responsavel_id: 1,
    polo_ativo: 'Maria Aparecida Souza',
    polo_passivo: 'Comércio XYZ Eireli',
  },
  {
    id: 3,
    processo_id: 3,
    numero_processo: '0003456-78.2024.5.15.0001',
    trt: 15,
    data_audiencia: formatDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)),
    hora_audiencia: '15:00',
    tipo_audiencia: 'INICIAL',
    modalidade: 'HIBRIDA',
    sala: 'Sala 105',
    url_virtual: 'https://zoom.us/j/123456789',
    responsavel_id: 1,
    polo_ativo: 'Pedro Henrique Lima',
    polo_passivo: 'Transportadora Rápida SA',
  },
  {
    id: 4,
    processo_id: 4,
    numero_processo: '0004567-89.2023.5.09.0003',
    trt: 9,
    data_audiencia: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)),
    hora_audiencia: '10:00',
    tipo_audiencia: 'JULGAMENTO',
    modalidade: 'TELEPRESENCIAL',
    sala: 'Sala de Sessões',
    responsavel_id: 1,
    polo_ativo: 'Ana Paula Rodrigues',
    polo_passivo: 'Banco Nacional SA',
  },
  {
    id: 5,
    processo_id: 6,
    numero_processo: '0006789-01.2024.5.09.0004',
    trt: 9,
    data_audiencia: formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)),
    hora_audiencia: '11:00',
    tipo_audiencia: 'INSTRUÇÃO',
    modalidade: 'VIDEOCONFERENCIA',
    sala: 'Sala Virtual 02',
    url_virtual: 'https://meet.google.com/xyz-uvwx-yz',
    responsavel_id: 2,
    polo_ativo: 'Fernanda Almeida',
    polo_passivo: 'Tech Solutions Ltda',
  },
];

// ============================================================================
// Pendentes Mock
// ============================================================================

export const mockPendentes: PendenteMock[] = [
  {
    id: 1,
    processo_id: 1,
    numero_processo: '0001234-56.2024.5.09.0001',
    trt: 9,
    tipo_expediente: 'Intimação para Manifestação',
    data_prazo_legal: formatDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)),
    prazo_vencido: true,
    dias_restantes: -2,
    responsavel_id: 1,
    polo_ativo: 'João da Silva Santos',
    polo_passivo: 'Empresa ABC Indústria Ltda',
  },
  {
    id: 2,
    processo_id: 2,
    numero_processo: '0002345-67.2024.5.09.0002',
    trt: 9,
    tipo_expediente: 'Contestação',
    data_prazo_legal: formatDate(today),
    prazo_vencido: false,
    dias_restantes: 0,
    responsavel_id: 1,
    polo_ativo: 'Maria Aparecida Souza',
    polo_passivo: 'Comércio XYZ Eireli',
  },
  {
    id: 3,
    processo_id: 3,
    numero_processo: '0003456-78.2024.5.15.0001',
    trt: 15,
    tipo_expediente: 'Réplica',
    data_prazo_legal: formatDate(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000)),
    prazo_vencido: false,
    dias_restantes: 1,
    responsavel_id: 1,
    polo_ativo: 'Pedro Henrique Lima',
    polo_passivo: 'Transportadora Rápida SA',
  },
  {
    id: 4,
    processo_id: 4,
    numero_processo: '0004567-89.2023.5.09.0003',
    trt: 9,
    tipo_expediente: 'Razões de Recurso',
    data_prazo_legal: formatDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)),
    prazo_vencido: false,
    dias_restantes: 5,
    responsavel_id: 1,
    polo_ativo: 'Ana Paula Rodrigues',
    polo_passivo: 'Banco Nacional SA',
  },
  {
    id: 5,
    processo_id: 6,
    numero_processo: '0006789-01.2024.5.09.0004',
    trt: 9,
    tipo_expediente: 'Contrarrazões',
    data_prazo_legal: formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)),
    prazo_vencido: false,
    dias_restantes: 3,
    responsavel_id: 2,
    polo_ativo: 'Fernanda Almeida',
    polo_passivo: 'Tech Solutions Ltda',
  },
];

// ============================================================================
// Tarefas Mock
// ============================================================================

export const mockTarefas: TarefaMock[] = [
  {
    id: 1,
    titulo: 'Preparar petição inicial processo João Silva',
    descricao: 'Elaborar petição inicial com base nos documentos recebidos',
    status: 'em_andamento',
    prioridade: 5,
    data_vencimento: formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)),
    created_at: '2024-11-20T09:00:00Z',
  },
  {
    id: 2,
    titulo: 'Revisar contestação Maria Souza',
    descricao: 'Verificar fundamentos e jurisprudência aplicável',
    status: 'pendente',
    prioridade: 4,
    data_vencimento: formatDate(today),
    created_at: '2024-11-22T14:00:00Z',
  },
  {
    id: 3,
    titulo: 'Agendar reunião com cliente Pedro Lima',
    status: 'pendente',
    prioridade: 3,
    created_at: '2024-11-23T10:00:00Z',
  },
  {
    id: 4,
    titulo: 'Estudar jurisprudência sobre horas extras',
    descricao: 'Buscar decisões recentes do TST sobre controle de jornada',
    status: 'concluida',
    prioridade: 2,
    created_at: '2024-11-18T16:00:00Z',
  },
  {
    id: 5,
    titulo: 'Organizar documentos do processo Ana Rodrigues',
    status: 'pendente',
    prioridade: 3,
    data_vencimento: formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)),
    created_at: '2024-11-24T08:00:00Z',
  },
];

// ============================================================================
// Notas Mock
// ============================================================================

export const mockNotas: NotaMock[] = [
  {
    id: 1,
    titulo: 'Lembrete Urgente',
    conteudo: 'Verificar prazo do processo 0001234-56.2024.5.09.0001 - vence amanhã!',
    cor: '#fef3c7', // amber-100
    fixada: true,
    created_at: '2024-11-25T08:00:00Z',
  },
  {
    id: 2,
    titulo: 'Contato Cliente',
    conteudo: 'João Silva - (41) 99999-8888\nPreferência: tarde',
    cor: '#dbeafe', // blue-100
    fixada: false,
    created_at: '2024-11-24T15:00:00Z',
  },
  {
    id: 3,
    conteudo: 'TST - Súmula 437: Intervalo intrajornada. Art. 71 da CLT. Não concessão ou redução.',
    cor: '#dcfce7', // green-100
    fixada: false,
    created_at: '2024-11-23T11:00:00Z',
  },
  {
    id: 4,
    titulo: 'Ideias para Defesa',
    conteudo: '- Verificar inconsistências no cartão de ponto\n- Buscar testemunhas\n- Analisar acordos coletivos',
    cor: '#f3e8ff', // purple-100
    fixada: false,
    created_at: '2024-11-22T09:30:00Z',
  },
];

// ============================================================================
// Links Mock
// ============================================================================

export const mockLinks: LinkMock[] = [
  {
    id: 1,
    titulo: 'PJE TRT9',
    url: 'https://pje.trt9.jus.br',
    icone: 'scale',
    ordem: 1,
  },
  {
    id: 2,
    titulo: 'PJE TRT15',
    url: 'https://pje.trt15.jus.br',
    icone: 'scale',
    ordem: 2,
  },
  {
    id: 3,
    titulo: 'TST',
    url: 'https://www.tst.jus.br',
    icone: 'landmark',
    ordem: 3,
  },
  {
    id: 4,
    titulo: 'Consulta CNPJ',
    url: 'https://servicos.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp',
    icone: 'search',
    ordem: 4,
  },
  {
    id: 5,
    titulo: 'Calculadora Trabalhista',
    url: 'https://www.tst.jus.br/web/calculadora',
    icone: 'calculator',
    ordem: 5,
  },
];

// ============================================================================
// Capturas Mock
// ============================================================================

export const mockCapturas: CapturaMock[] = [
  {
    id: 1,
    tipo: 'acervo_geral',
    status: 'sucesso',
    advogado: 'Dr. João Silva',
    trt: 9,
    grau: '1º Grau',
    inicio: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    fim: new Date(today.getTime() - 1.5 * 60 * 60 * 1000).toISOString(),
    processosCapturados: 45,
  },
  {
    id: 2,
    tipo: 'audiencias',
    status: 'sucesso',
    advogado: 'Dr. João Silva',
    trt: 9,
    grau: '1º Grau',
    inicio: new Date(today.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    fim: new Date(today.getTime() - 3.8 * 60 * 60 * 1000).toISOString(),
    processosCapturados: 12,
  },
  {
    id: 3,
    tipo: 'pendentes',
    status: 'erro',
    advogado: 'Dra. Maria Santos',
    trt: 15,
    grau: '1º Grau',
    inicio: new Date(today.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    erro: 'Timeout na autenticação SSO',
  },
  {
    id: 4,
    tipo: 'timeline',
    status: 'em_andamento',
    advogado: 'Dr. Pedro Oliveira',
    trt: 4,
    grau: '1º Grau',
    inicio: new Date(today.getTime() - 0.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    tipo: 'arquivados',
    status: 'sucesso',
    advogado: 'Dra. Ana Costa',
    trt: 9,
    grau: '2º Grau',
    inicio: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    fim: new Date(today.getTime() - 23.5 * 60 * 60 * 1000).toISOString(),
    processosCapturados: 8,
  },
];

// ============================================================================
// Funções de Agregação (simulando queries do backend)
// ============================================================================

export function getProcessosResumo(userId?: number): ProcessoResumo {
  const processos = userId
    ? mockProcessos.filter((p) => p.responsavel_id === userId)
    : mockProcessos;

  const ativos = processos.filter((p) => p.status === 'ativo');
  const arquivados = processos.filter((p) => p.status === 'arquivado');

  // Agrupar por TRT
  const porTRTMap = new Map<number, number>();
  processos.forEach((p) => {
    porTRTMap.set(p.trt, (porTRTMap.get(p.trt) || 0) + 1);
  });
  const porTRT = Array.from(porTRTMap.entries()).map(([trt, count]) => ({ trt, count }));

  // Agrupar por Grau
  const porGrauMap = new Map<string, number>();
  processos.forEach((p) => {
    const grauLabel = p.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau';
    porGrauMap.set(grauLabel, (porGrauMap.get(grauLabel) || 0) + 1);
  });
  const porGrau = Array.from(porGrauMap.entries()).map(([grau, count]) => ({ grau, count }));

  // Agrupar por Status
  const porStatusMap = new Map<string, number>();
  processos.forEach((p) => {
    porStatusMap.set(p.status, (porStatusMap.get(p.status) || 0) + 1);
  });
  const porStatus = Array.from(porStatusMap.entries()).map(([status, count]) => ({ status, count }));

  return {
    total: processos.length,
    ativos: ativos.length,
    arquivados: arquivados.length,
    porTRT,
    porGrau,
    porStatus,
  };
}

export function getAudienciasResumo(userId?: number): AudienciasResumo {
  const audiencias = userId
    ? mockAudiencias.filter((a) => a.responsavel_id === userId)
    : mockAudiencias;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const hojeCount = audiencias.filter((a) => {
    const data = new Date(a.data_audiencia);
    data.setHours(0, 0, 0, 0);
    return data.getTime() === hoje.getTime();
  }).length;

  const proximos7dias = audiencias.filter((a) => {
    const data = new Date(a.data_audiencia);
    const diff = (data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;

  const proximos30dias = audiencias.filter((a) => {
    const data = new Date(a.data_audiencia);
    const diff = (data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }).length;

  // Agrupar por Modalidade
  const porModalidadeMap = new Map<string, number>();
  audiencias.forEach((a) => {
    porModalidadeMap.set(a.modalidade, (porModalidadeMap.get(a.modalidade) || 0) + 1);
  });
  const porModalidade = Array.from(porModalidadeMap.entries()).map(([modalidade, count]) => ({
    modalidade,
    count,
  }));

  // Agrupar por Tipo
  const porTipoMap = new Map<string, number>();
  audiencias.forEach((a) => {
    porTipoMap.set(a.tipo_audiencia, (porTipoMap.get(a.tipo_audiencia) || 0) + 1);
  });
  const porTipo = Array.from(porTipoMap.entries()).map(([tipo, count]) => ({ tipo, count }));

  return {
    total: audiencias.length,
    proximos7dias,
    proximos30dias,
    hoje: hojeCount,
    porModalidade,
    porTipo,
  };
}

export function getPendentesResumo(userId?: number): PendentesResumo {
  const pendentes = userId
    ? mockPendentes.filter((p) => p.responsavel_id === userId)
    : mockPendentes;

  const vencidos = pendentes.filter((p) => p.prazo_vencido).length;
  const venceHoje = pendentes.filter((p) => p.dias_restantes === 0).length;
  const venceAmanha = pendentes.filter((p) => p.dias_restantes === 1).length;
  const venceSemana = pendentes.filter((p) => p.dias_restantes > 1 && p.dias_restantes <= 7).length;

  const porUrgencia = [
    { urgencia: 'Vencido', count: vencidos, color: '#ef4444' }, // red-500
    { urgencia: 'Hoje', count: venceHoje, color: '#f97316' }, // orange-500
    { urgencia: 'Amanhã', count: venceAmanha, color: '#eab308' }, // yellow-500
    { urgencia: 'Esta semana', count: venceSemana, color: '#22c55e' }, // green-500
  ].filter((u) => u.count > 0);

  return {
    total: pendentes.length,
    vencidos,
    venceHoje,
    venceAmanha,
    venceSemana,
    porUrgencia,
  };
}

export function getProdutividadeResumo(userId: number): ProdutividadeResumo {
  // Gerar dados de produtividade dos últimos 30 dias
  const ultimoMes = [];
  for (let i = 29; i >= 0; i--) {
    const data = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    ultimoMes.push({
      periodo: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      processosAtribuidos: Math.floor(Math.random() * 3),
      audienciasRealizadas: Math.floor(Math.random() * 2),
      pendentesResolvidos: Math.floor(Math.random() * 4),
      tarefasConcluidas: Math.floor(Math.random() * 5),
    });
  }

  const processos = mockProcessos.filter((p) => p.responsavel_id === userId);
  const audiencias = mockAudiencias.filter((a) => a.responsavel_id === userId);
  const pendentes = mockPendentes.filter((p) => p.responsavel_id === userId);

  return {
    ultimoMes,
    totalProcessos: processos.length,
    totalAudiencias: audiencias.length,
    totalPendentes: pendentes.length,
    mediaProcessosDia: processos.length / 30,
  };
}

export function getCargaUsuarios(): CargaUsuario[] {
  return mockUsuarios.map((usuario) => {
    const processos = mockProcessos.filter((p) => p.responsavel_id === usuario.id).length;
    const audiencias = mockAudiencias.filter((a) => a.responsavel_id === usuario.id).length;
    const pendentes = mockPendentes.filter((p) => p.responsavel_id === usuario.id).length;
    const expedientes = Math.floor(Math.random() * 10); // Mock expedientes manuais

    return {
      usuario,
      processos,
      audiencias,
      pendentes,
      expedientes,
      total: processos + audiencias + pendentes + expedientes,
    };
  }).sort((a, b) => b.total - a.total);
}

export function getMetricasEscritorio(): MetricasEscritorio {
  const processosAtivos = mockProcessos.filter((p) => p.status === 'ativo').length;
  const processosArquivados = mockProcessos.filter((p) => p.status === 'arquivado').length;

  // Tendência dos últimos 6 meses
  const tendencia = [];
  for (let i = 5; i >= 0; i--) {
    const data = new Date();
    data.setMonth(data.getMonth() - i);
    tendencia.push({
      name: data.toLocaleDateString('pt-BR', { month: 'short' }),
      value: Math.floor(Math.random() * 50) + 30,
      processos: Math.floor(Math.random() * 30) + 20,
      audiencias: Math.floor(Math.random() * 20) + 10,
    });
  }

  return {
    totalProcessos: mockProcessos.length,
    totalAudiencias: mockAudiencias.length,
    totalPendentes: mockPendentes.length,
    totalUsuarios: mockUsuarios.length,
    processosAtivos,
    processosArquivados,
    valorAcordos: 1250000, // R$ 1.250.000,00
    valorCondenacoes: 850000, // R$ 850.000,00
    comparativoMesAnterior: {
      processos: 12, // +12%
      audiencias: -5, // -5%
      pendentes: 8, // +8%
    },
    tendencia,
  };
}

export function getStatusCapturas(): StatusCapturas {
  const sucessos = mockCapturas.filter((c) => c.status === 'sucesso').length;
  const erros = mockCapturas.filter((c) => c.status === 'erro').length;
  const emAndamento = mockCapturas.filter((c) => c.status === 'em_andamento').length;
  const total = mockCapturas.length;

  const porStatus = [
    { status: 'Sucesso', count: sucessos, color: '#22c55e' },
    { status: 'Erro', count: erros, color: '#ef4444' },
    { status: 'Em Andamento', count: emAndamento, color: '#3b82f6' },
  ].filter((s) => s.count > 0);

  // Agrupar por Tipo
  const porTipoMap = new Map<string, number>();
  mockCapturas.forEach((c) => {
    const tipoLabel = c.tipo.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    porTipoMap.set(tipoLabel, (porTipoMap.get(tipoLabel) || 0) + 1);
  });
  const porTipo = Array.from(porTipoMap.entries()).map(([tipo, count]) => ({ tipo, count }));

  return {
    ultimasCapturas: mockCapturas,
    porStatus,
    porTipo,
    taxaSucesso: total > 0 ? (sucessos / total) * 100 : 0,
  };
}

export function getPerformanceAdvogados(): PerformanceAdvogado[] {
  return mockUsuarios.map((usuario) => {
    const processosAtivos = mockProcessos.filter(
      (p) => p.responsavel_id === usuario.id && p.status === 'ativo'
    ).length;
    const audienciasRealizadas = Math.floor(Math.random() * 20) + 5;
    const pendentesResolvidos = Math.floor(Math.random() * 30) + 10;
    const tempoMedioResolucao = Math.floor(Math.random() * 10) + 3;

    // Score baseado nas métricas (simplificado)
    const score = Math.min(
      100,
      processosAtivos * 5 + audienciasRealizadas * 3 + pendentesResolvidos * 2 - tempoMedioResolucao
    );

    return {
      usuario,
      processosAtivos,
      audienciasRealizadas,
      pendentesResolvidos,
      tempoMedioResolucao,
      score: Math.max(0, score),
    };
  }).sort((a, b) => b.score - a.score);
}
