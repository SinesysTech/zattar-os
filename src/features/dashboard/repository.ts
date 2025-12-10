/**
 * Repository de Dashboard
 * Queries Supabase para busca de dados agregados
 *
 * Migrado de:
 * - backend/dashboard/services/persistence/dashboard-processos.persistence.ts
 * - backend/dashboard/services/persistence/dashboard-audiencias.persistence.ts
 * - backend/dashboard/services/persistence/dashboard-expedientes.persistence.ts
 * - backend/dashboard/services/persistence/dashboard-metricas.persistence.ts
 */

import { createClient } from '@/backend/utils/supabase/server';
import type {
  ProcessoResumo,
  AudienciasResumo,
  AudienciaProxima,
  ExpedientesResumo,
  ExpedienteUrgente,
  ProdutividadeResumo,
  MetricasEscritorio,
  CargaUsuario,
  StatusCaptura,
  PerformanceAdvogado,
} from './types';

// ============================================================================
// PROCESSOS
// ============================================================================

/**
 * Obtém resumo de processos do usuário
 */
export async function buscarProcessosResumo(
  responsavelId?: number
): Promise<ProcessoResumo> {
  const supabase = await createClient();

  let query = supabase.from('acervo').select('id, origem, grau, trt', { count: 'exact' });

  if (responsavelId) {
    query = query.eq('responsavel_id', responsavelId);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Erro ao buscar processos:', error);
    throw new Error(`Erro ao buscar processos: ${error.message}`);
  }

  const processos = data || [];
  const total = count || 0;

  const ativos = processos.filter((p) => p.origem === 'acervo_geral').length;
  const arquivados = processos.filter((p) => p.origem === 'arquivado').length;

  const porGrauMap = new Map<string, number>();
  processos.forEach((p) => {
    const grauLabel = p.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau';
    porGrauMap.set(grauLabel, (porGrauMap.get(grauLabel) || 0) + 1);
  });
  const porGrau = Array.from(porGrauMap.entries()).map(([grau, count]) => ({
    grau,
    count,
  }));

  const porTRTMap = new Map<string, number>();
  processos.forEach((p) => {
    const trt = p.trt?.replace('TRT', '') || 'N/A';
    porTRTMap.set(trt, (porTRTMap.get(trt) || 0) + 1);
  });
  const porTRT = Array.from(porTRTMap.entries())
    .map(([trt, count]) => ({ trt, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total,
    ativos,
    arquivados,
    porGrau,
    porTRT,
  };
}

/**
 * Obtém total de processos do escritório
 */
export async function buscarTotalProcessos(): Promise<{
  total: number;
  ativos: number;
}> {
  const supabase = await createClient();

  const { count: total } = await supabase
    .from('acervo')
    .select('id', { count: 'exact', head: true });

  const { count: ativos } = await supabase
    .from('acervo')
    .select('id', { count: 'exact', head: true })
    .eq('origem', 'acervo_geral');

  return {
    total: total || 0,
    ativos: ativos || 0,
  };
}

// ============================================================================
// AUDIÊNCIAS
// ============================================================================

/**
 * Obtém resumo de audiências do usuário
 */
export async function buscarAudienciasResumo(
  responsavelId?: number
): Promise<AudienciasResumo> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const em7dias = new Date(hoje);
  em7dias.setDate(em7dias.getDate() + 7);

  const em30dias = new Date(hoje);
  em30dias.setDate(em30dias.getDate() + 30);

  let baseQuery = supabase
    .from('audiencias')
    .select('id, data_inicio', { count: 'exact' })
    .gte('data_inicio', hoje.toISOString())
    .eq('designada', true);

  if (responsavelId) {
    baseQuery = baseQuery.eq('responsavel_id', responsavelId);
  }

  const { data, count, error } = await baseQuery;

  if (error) {
    console.error('Erro ao buscar audiências:', error);
    throw new Error(`Erro ao buscar audiências: ${error.message}`);
  }

  const audiencias = data || [];

  const hojeStr = hoje.toISOString().split('T')[0];
  const amanhaStr = amanha.toISOString().split('T')[0];

  const hojeCount = audiencias.filter((a) => {
    const dataAud = new Date(a.data_inicio).toISOString().split('T')[0];
    return dataAud === hojeStr;
  }).length;

  const amanhaCount = audiencias.filter((a) => {
    const dataAud = new Date(a.data_inicio).toISOString().split('T')[0];
    return dataAud === amanhaStr;
  }).length;

  const proximos7dias = audiencias.filter((a) => {
    const dataAud = new Date(a.data_inicio);
    return dataAud >= hoje && dataAud < em7dias;
  }).length;

  const proximos30dias = audiencias.filter((a) => {
    const dataAud = new Date(a.data_inicio);
    return dataAud >= hoje && dataAud < em30dias;
  }).length;

  return {
    total: count || 0,
    hoje: hojeCount,
    amanha: amanhaCount,
    proximos7dias,
    proximos30dias,
  };
}

/**
 * Obtém lista de próximas audiências
 */
export async function buscarProximasAudiencias(
  responsavelId?: number,
  limite: number = 5
): Promise<AudienciaProxima[]> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeStr = hoje.toISOString().split('T')[0];

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  const amanhaStr = amanha.toISOString().split('T')[0];

  const selectFields = `
    id,
    processo_id,
    numero_processo,
    data_inicio,
    hora_inicio,
    sala_audiencia_nome,
    url_audiencia_virtual,
    responsavel_id,
    polo_ativo_nome,
    polo_passivo_nome,
    tipo_audiencia:tipo_audiencia_id (descricao),
    usuarios:responsavel_id (nome_exibicao)
  `;

  // Tentar buscar audiências de HOJE primeiro
  let query = supabase
    .from('audiencias')
    .select(selectFields)
    .gte('data_inicio', `${hojeStr}T00:00:00`)
    .lt('data_inicio', `${hojeStr}T23:59:59`)
    .order('hora_inicio', { ascending: true })
    .limit(limite);

  if (responsavelId) {
    query = query.eq('responsavel_id', responsavelId);
  }

  let { data } = await query;

  // Se não houver audiências hoje, buscar de AMANHÃ
  if (!data?.length) {
    query = supabase
      .from('audiencias')
      .select(selectFields)
      .gte('data_inicio', `${amanhaStr}T00:00:00`)
      .lt('data_inicio', `${amanhaStr}T23:59:59`)
      .order('hora_inicio', { ascending: true })
      .limit(limite);

    if (responsavelId) {
      query = query.eq('responsavel_id', responsavelId);
    }

    ({ data } = await query);
  }

  // Se ainda não houver, buscar PRÓXIMAS disponíveis
  if (!data?.length) {
    query = supabase
      .from('audiencias')
      .select(selectFields)
      .gte('data_inicio', hoje.toISOString())
      .order('data_inicio', { ascending: true })
      .limit(limite);

    if (responsavelId) {
      query = query.eq('responsavel_id', responsavelId);
    }

    ({ data } = await query);
  }

  return (data || []).map((a) => ({
    id: a.id,
    processo_id: a.processo_id,
    numero_processo: a.numero_processo,
    data_audiencia: a.data_inicio,
    hora_audiencia: a.hora_inicio,
    tipo_audiencia: (a.tipo_audiencia as { descricao?: string })?.descricao || null,
    local: null,
    sala: a.sala_audiencia_nome,
    url_audiencia_virtual: a.url_audiencia_virtual,
    responsavel_id: a.responsavel_id,
    responsavel_nome: (a.usuarios as { nome_exibicao?: string })?.nome_exibicao || null,
    polo_ativo_nome: a.polo_ativo_nome,
    polo_passivo_nome: a.polo_passivo_nome,
  }));
}

/**
 * Obtém total de audiências do mês
 */
export async function buscarAudienciasMes(): Promise<number> {
  const supabase = await createClient();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const fimMes = new Date(inicioMes);
  fimMes.setMonth(fimMes.getMonth() + 1);

  const { count } = await supabase
    .from('audiencias')
    .select('id', { count: 'exact', head: true })
    .gte('data_inicio', inicioMes.toISOString())
    .lt('data_inicio', fimMes.toISOString());

  return count || 0;
}

// ============================================================================
// EXPEDIENTES
// ============================================================================

/**
 * Obtém resumo de expedientes do usuário
 */
export async function buscarExpedientesResumo(
  responsavelId?: number
): Promise<ExpedientesResumo> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const em7dias = new Date(hoje);
  em7dias.setDate(em7dias.getDate() + 7);

  // Buscar expedientes (não baixados)
  let pendentesQuery = supabase
    .from('expedientes')
    .select(`
      id,
      data_prazo_legal_parte,
      tipo_expediente_id,
      tipos_expedientes:tipo_expediente_id (tipo_expediente)
    `)
    .is('baixado_em', null);

  if (responsavelId) {
    pendentesQuery = pendentesQuery.eq('responsavel_id', responsavelId);
  }

  const { data: pendentes, error: pendentesError } = await pendentesQuery;

  if (pendentesError) {
    console.error('Erro ao buscar pendentes:', pendentesError);
    throw new Error(`Erro ao buscar pendentes: ${pendentesError.message}`);
  }

  // Buscar expedientes manuais (não concluídos)
  let manuaisQuery = supabase
    .from('expedientes_manuais')
    .select(`
      id,
      prazo_fatal,
      tipo_expediente_id,
      tipos_expedientes:tipo_expediente_id (tipo_expediente)
    `)
    .neq('status', 'concluido');

  if (responsavelId) {
    manuaisQuery = manuaisQuery.eq('responsavel_id', responsavelId);
  }

  const { data: manuais, error: manuaisError } = await manuaisQuery;

  if (manuaisError) {
    console.error('Erro ao buscar expedientes manuais:', manuaisError);
    throw new Error(`Erro ao buscar expedientes manuais: ${manuaisError.message}`);
  }

  // Consolidar todos os expedientes
  const todosExpedientes = [
    ...(pendentes || []).map((p) => ({
      prazo: p.data_prazo_legal_parte,
      tipo: (p.tipos_expedientes as { tipo_expediente?: string })?.tipo_expediente || 'Sem tipo',
    })),
    ...(manuais || []).map((m) => ({
      prazo: m.prazo_fatal,
      tipo: (m.tipos_expedientes as { tipo_expediente?: string })?.tipo_expediente || 'Manual',
    })),
  ];

  const total = todosExpedientes.length;

  const hojeStr = hoje.toISOString().split('T')[0];
  const amanhaStr = amanha.toISOString().split('T')[0];

  let vencidos = 0;
  let venceHoje = 0;
  let venceAmanha = 0;
  let proximos7dias = 0;

  todosExpedientes.forEach((exp) => {
    if (!exp.prazo) return;

    const prazoDate = new Date(exp.prazo);
    prazoDate.setHours(0, 0, 0, 0);
    const prazoStr = prazoDate.toISOString().split('T')[0];

    if (prazoDate < hoje) {
      vencidos++;
    } else if (prazoStr === hojeStr) {
      venceHoje++;
    } else if (prazoStr === amanhaStr) {
      venceAmanha++;
    }

    if (prazoDate >= hoje && prazoDate < em7dias) {
      proximos7dias++;
    }
  });

  // Agrupar por tipo
  const porTipoMap = new Map<string, number>();
  todosExpedientes.forEach((exp) => {
    porTipoMap.set(exp.tipo, (porTipoMap.get(exp.tipo) || 0) + 1);
  });
  const porTipo = Array.from(porTipoMap.entries())
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total,
    vencidos,
    venceHoje,
    venceAmanha,
    proximos7dias,
    porTipo,
  };
}

/**
 * Obtém lista de expedientes urgentes
 */
export async function buscarExpedientesUrgentes(
  responsavelId?: number,
  limite: number = 5
): Promise<ExpedienteUrgente[]> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Buscar expedientes urgentes
  let pendentesQuery = supabase
    .from('expedientes')
    .select(`
      id,
      processo_id,
      numero_processo,
      data_prazo_legal_parte,
      prazo_vencido,
      responsavel_id,
      tipos_expedientes:tipo_expediente_id (tipo_expediente),
      usuarios:responsavel_id (nome_exibicao)
    `)
    .is('baixado_em', null)
    .not('data_prazo_legal_parte', 'is', null)
    .order('data_prazo_legal_parte', { ascending: true })
    .limit(limite * 2);

  if (responsavelId) {
    pendentesQuery = pendentesQuery.eq('responsavel_id', responsavelId);
  }

  const { data: pendentes } = await pendentesQuery;

  // Buscar expedientes manuais urgentes
  let manuaisQuery = supabase
    .from('expedientes_manuais')
    .select(`
      id,
      processo_id,
      numero_processo,
      prazo_fatal,
      status,
      responsavel_id,
      tipos_expedientes:tipo_expediente_id (tipo_expediente),
      usuarios:responsavel_id (nome_exibicao)
    `)
    .neq('status', 'concluido')
    .not('prazo_fatal', 'is', null)
    .order('prazo_fatal', { ascending: true })
    .limit(limite * 2);

  if (responsavelId) {
    manuaisQuery = manuaisQuery.eq('responsavel_id', responsavelId);
  }

  const { data: manuais } = await manuaisQuery;

  // Consolidar e ordenar
  const todos: ExpedienteUrgente[] = [
    ...(pendentes || []).map((p) => {
      const prazoDate = new Date(p.data_prazo_legal_parte);
      prazoDate.setHours(0, 0, 0, 0);
      const diasRestantes = Math.ceil(
        (prazoDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: p.id,
        processo_id: p.processo_id,
        numero_processo: p.numero_processo,
        tipo_expediente: (p.tipos_expedientes as { tipo_expediente?: string })?.tipo_expediente || 'Pendente',
        prazo_fatal: p.data_prazo_legal_parte,
        status: diasRestantes < 0 ? 'vencido' : 'pendente',
        dias_restantes: diasRestantes,
        responsavel_id: p.responsavel_id,
        responsavel_nome: (p.usuarios as { nome_exibicao?: string })?.nome_exibicao || null,
        origem: 'expedientes' as const,
      };
    }),
    ...(manuais || []).map((m) => {
      const prazoDate = new Date(m.prazo_fatal);
      prazoDate.setHours(0, 0, 0, 0);
      const diasRestantes = Math.ceil(
        (prazoDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: m.id,
        processo_id: m.processo_id,
        numero_processo: m.numero_processo,
        tipo_expediente: (m.tipos_expedientes as { tipo_expediente?: string })?.tipo_expediente || 'Manual',
        prazo_fatal: m.prazo_fatal,
        status: diasRestantes < 0 ? 'vencido' : m.status,
        dias_restantes: diasRestantes,
        responsavel_id: m.responsavel_id,
        responsavel_nome: (m.usuarios as { nome_exibicao?: string })?.nome_exibicao || null,
        origem: 'expedientes_manuais' as const,
      };
    }),
  ];

  return todos
    .sort((a, b) => {
      if (a.dias_restantes < 0 && b.dias_restantes >= 0) return -1;
      if (a.dias_restantes >= 0 && b.dias_restantes < 0) return 1;
      return a.dias_restantes - b.dias_restantes;
    })
    .slice(0, limite);
}

/**
 * Obtém total de expedientes pendentes
 */
export async function buscarTotalExpedientesPendentes(): Promise<{
  total: number;
  vencidos: number;
}> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const { count: pendentesTotal } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .is('baixado_em', null);

  const { count: pendentesVencidos } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .is('baixado_em', null)
    .lt('data_prazo_legal_parte', hoje.toISOString());

  const { count: manuaisTotal } = await supabase
    .from('expedientes_manuais')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'concluido');

  const { count: manuaisVencidos } = await supabase
    .from('expedientes_manuais')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'concluido')
    .lt('prazo_fatal', hoje.toISOString());

  return {
    total: (pendentesTotal || 0) + (manuaisTotal || 0),
    vencidos: (pendentesVencidos || 0) + (manuaisVencidos || 0),
  };
}

// ============================================================================
// PRODUTIVIDADE
// ============================================================================

/**
 * Obtém métricas de produtividade do usuário
 */
export async function buscarProdutividadeUsuario(
  usuarioId: number
): Promise<ProdutividadeResumo> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());

  const inicioSemanaAnterior = new Date(inicioSemana);
  inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  // Baixas de hoje
  const { count: baixasHoje } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .eq('responsavel_id', usuarioId)
    .gte('baixado_em', hoje.toISOString());

  // Baixas da semana
  const { count: baixasSemana } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .eq('responsavel_id', usuarioId)
    .gte('baixado_em', inicioSemana.toISOString());

  // Baixas do mês
  const { count: baixasMes } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .eq('responsavel_id', usuarioId)
    .gte('baixado_em', inicioMes.toISOString());

  // Baixas da semana anterior (para comparativo)
  const { count: baixasSemanaAnterior } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .eq('responsavel_id', usuarioId)
    .gte('baixado_em', inicioSemanaAnterior.toISOString())
    .lt('baixado_em', inicioSemana.toISOString());

  // Calcular comparativo
  const comparativoSemanaAnterior = baixasSemanaAnterior
    ? Math.round(
        (((baixasSemana || 0) - baixasSemanaAnterior) / baixasSemanaAnterior) * 100
      )
    : 0;

  // Calcular média diária
  const diasNoMes = Math.ceil(
    (hoje.getTime() - inicioMes.getTime()) / (1000 * 60 * 60 * 24)
  ) || 1;
  const mediaDiaria = Math.round(((baixasMes || 0) / diasNoMes) * 10) / 10;

  // Buscar baixas por dia (últimos 7 dias)
  const porDia: { data: string; baixas: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dia = new Date(hoje);
    dia.setDate(dia.getDate() - i);
    const diaStr = dia.toISOString().split('T')[0];

    const proximoDia = new Date(dia);
    proximoDia.setDate(proximoDia.getDate() + 1);

    const { count } = await supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuarioId)
      .gte('baixado_em', dia.toISOString())
      .lt('baixado_em', proximoDia.toISOString());

    porDia.push({
      data: diaStr,
      baixas: count || 0,
    });
  }

  return {
    baixasHoje: baixasHoje || 0,
    baixasSemana: baixasSemana || 0,
    baixasMes: baixasMes || 0,
    mediaDiaria,
    comparativoSemanaAnterior,
    porDia,
  };
}

// ============================================================================
// MÉTRICAS ADMIN
// ============================================================================

/**
 * Obtém métricas consolidadas do escritório
 */
export async function buscarMetricasEscritorio(): Promise<MetricasEscritorio> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const inicioMesAnterior = new Date(inicioMes);
  inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);

  const fimMesAnterior = new Date(inicioMes);

  // Total de processos
  const { count: totalProcessos } = await supabase
    .from('acervo')
    .select('id', { count: 'exact', head: true });

  // Processos ativos
  const { count: processosAtivos } = await supabase
    .from('acervo')
    .select('id', { count: 'exact', head: true })
    .eq('origem', 'acervo_geral');

  // Processos ativos únicos
  const { data: processosUnicosData } = await supabase
    .from('acervo')
    .select('numero_processo')
    .eq('origem', 'acervo_geral');

  const processosAtivosUnicos = processosUnicosData
    ? new Set(processosUnicosData.map((p) => p.numero_processo)).size
    : 0;

  // Total de audiências
  const { count: totalAudiencias } = await supabase
    .from('audiencias')
    .select('id', { count: 'exact', head: true });

  // Audiências do mês
  const { count: audienciasMes } = await supabase
    .from('audiencias')
    .select('id', { count: 'exact', head: true })
    .gte('data_inicio', inicioMes.toISOString());

  // Total de expedientes pendentes
  const { count: pendentesCount } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .is('baixado_em', null);

  const { count: manuaisCount } = await supabase
    .from('expedientes_manuais')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'concluido');

  const totalExpedientes = (pendentesCount || 0) + (manuaisCount || 0);

  // Expedientes vencidos
  const { count: pendentesVencidos } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .is('baixado_em', null)
    .lt('data_prazo_legal_parte', hoje.toISOString());

  const { count: manuaisVencidos } = await supabase
    .from('expedientes_manuais')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'concluido')
    .lt('prazo_fatal', hoje.toISOString());

  const expedientesVencidos = (pendentesVencidos || 0) + (manuaisVencidos || 0);

  // Total de usuários ativos
  const { count: totalUsuarios } = await supabase
    .from('usuarios')
    .select('id', { count: 'exact', head: true })
    .eq('ativo', true);

  // Taxa de resolução
  const { count: totalBaixados } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .not('baixado_em', 'is', null);

  const { count: baixadosNoPrazo } = await supabase
    .from('expedientes')
    .select('id', { count: 'exact', head: true })
    .not('baixado_em', 'is', null)
    .eq('prazo_vencido', false);

  const taxaResolucao = totalBaixados
    ? Math.round(((baixadosNoPrazo || 0) / totalBaixados) * 100)
    : 100;

  // Comparativo mês anterior
  const { count: processosNovos } = await supabase
    .from('acervo')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', inicioMes.toISOString());

  const { count: processosNovosAnterior } = await supabase
    .from('acervo')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', inicioMesAnterior.toISOString())
    .lt('created_at', fimMesAnterior.toISOString());

  const comparativoProcessos = processosNovosAnterior
    ? Math.round(
        (((processosNovos || 0) - processosNovosAnterior) / processosNovosAnterior) * 100
      )
    : 0;

  const { count: audienciasMesAnterior } = await supabase
    .from('audiencias')
    .select('id', { count: 'exact', head: true })
    .gte('data_inicio', inicioMesAnterior.toISOString())
    .lt('data_inicio', fimMesAnterior.toISOString());

  const comparativoAudiencias = audienciasMesAnterior
    ? Math.round(
        (((audienciasMes || 0) - audienciasMesAnterior) / audienciasMesAnterior) * 100
      )
    : 0;

  return {
    totalProcessos: totalProcessos || 0,
    processosAtivos: processosAtivos || 0,
    processosAtivosUnicos,
    totalAudiencias: totalAudiencias || 0,
    audienciasMes: audienciasMes || 0,
    totalExpedientes,
    expedientesPendentes: totalExpedientes,
    expedientesVencidos,
    totalUsuarios: totalUsuarios || 0,
    taxaResolucao,
    comparativoMesAnterior: {
      processos: comparativoProcessos,
      audiencias: comparativoAudiencias,
      expedientes: 0,
    },
    evolucaoMensal: [],
  };
}

/**
 * Obtém carga de trabalho por usuário
 */
export async function buscarCargaUsuarios(): Promise<CargaUsuario[]> {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const em7dias = new Date(hoje);
  em7dias.setDate(em7dias.getDate() + 7);

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nome_exibicao')
    .eq('ativo', true);

  if (!usuarios?.length) return [];

  const cargas: CargaUsuario[] = [];

  for (const usuario of usuarios) {
    const { count: processosAtivos } = await supabase
      .from('acervo')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .eq('origem', 'acervo_geral');

    const { count: pendentes } = await supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .is('baixado_em', null);

    const { count: manuais } = await supabase
      .from('expedientes_manuais')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .neq('status', 'concluido');

    const { count: audienciasProximas } = await supabase
      .from('audiencias')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .gte('data_inicio', hoje.toISOString())
      .lt('data_inicio', em7dias.toISOString())
      .eq('designada', true);

    const expedientesPendentes = (pendentes || 0) + (manuais || 0);

    cargas.push({
      usuario_id: usuario.id,
      usuario_nome: usuario.nome_exibicao,
      processosAtivos: processosAtivos || 0,
      expedientesPendentes,
      audienciasProximas: audienciasProximas || 0,
      cargaTotal: (processosAtivos || 0) + expedientesPendentes * 2 + (audienciasProximas || 0) * 3,
    });
  }

  return cargas.sort((a, b) => b.cargaTotal - a.cargaTotal);
}

/**
 * Obtém status das últimas capturas por TRT
 */
export async function buscarStatusCapturas(): Promise<StatusCaptura[]> {
  const supabase = await createClient();

  const { data: capturas } = await supabase
    .from('capturas_log')
    .select('*')
    .order('iniciado_em', { ascending: false })
    .limit(50);

  if (!capturas?.length) return [];

  const statusMap = new Map<string, StatusCaptura>();

  capturas.forEach((cap) => {
    const resultado = cap.resultado as Record<string, unknown> | null;
    const trt = (resultado?.tribunal as string) || 'N/A';
    const grau = (resultado?.grau as string) || 'primeiro_grau';
    const key = `${trt}-${grau}`;

    if (!statusMap.has(key)) {
      statusMap.set(key, {
        trt,
        grau,
        ultimaExecucao: cap.concluido_em || cap.iniciado_em,
        status: cap.status === 'completed' ? 'sucesso' : cap.status === 'failed' ? 'erro' : 'pendente',
        mensagemErro: cap.erro || null,
        processosCapturados: (resultado?.processosCapturados as number) || 0,
        audienciasCapturadas: (resultado?.audienciasCapturadas as number) || 0,
        expedientesCapturados: (resultado?.expedientesCapturados as number) || 0,
      });
    }
  });

  return Array.from(statusMap.values());
}

/**
 * Obtém performance dos advogados
 */
export async function buscarPerformanceAdvogados(): Promise<PerformanceAdvogado[]> {
  const supabase = await createClient();

  const hoje = new Date();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nome_exibicao')
    .eq('ativo', true);

  if (!usuarios?.length) return [];

  const performances: PerformanceAdvogado[] = [];

  for (const usuario of usuarios) {
    const { count: baixasSemana } = await supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .gte('baixado_em', inicioSemana.toISOString());

    const { count: baixasMes } = await supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .gte('baixado_em', inicioMes.toISOString());

    const { count: totalBaixados } = await supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .not('baixado_em', 'is', null);

    const { count: baixadosNoPrazo } = await supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .not('baixado_em', 'is', null)
      .eq('prazo_vencido', false);

    const { count: expedientesVencidos } = await supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .is('baixado_em', null)
      .lt('data_prazo_legal_parte', hoje.toISOString());

    const taxaCumprimentoPrazo = totalBaixados
      ? Math.round(((baixadosNoPrazo || 0) / totalBaixados) * 100)
      : 100;

    performances.push({
      usuario_id: usuario.id,
      usuario_nome: usuario.nome_exibicao,
      baixasSemana: baixasSemana || 0,
      baixasMes: baixasMes || 0,
      taxaCumprimentoPrazo,
      expedientesVencidos: expedientesVencidos || 0,
    });
  }

  return performances.sort((a, b) => b.baixasMes - a.baixasMes);
}

// ============================================================================
// USUÁRIO
// ============================================================================

/**
 * Busca dados do usuário
 */
export async function buscarUsuario(usuarioId: number): Promise<{
  id: number;
  nome: string;
}> {
  const supabase = await createClient();

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('id, nome_exibicao')
    .eq('id', usuarioId)
    .single();

  if (error || !usuario) {
    throw new Error('Usuário não encontrado');
  }

  return {
    id: usuario.id,
    nome: usuario.nome_exibicao,
  };
}
