/**
 * Persistência de métricas globais para Dashboard Admin
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  MetricasEscritorio,
  CargaUsuario,
  StatusCaptura,
  PerformanceAdvogado,
} from '@/backend/types/dashboard/types';

/**
 * Obtém métricas consolidadas do escritório
 */
export async function getMetricasEscritorio(): Promise<MetricasEscritorio> {
  const supabase = createServiceClient();

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

  // Processos ativos únicos (contagem por número de processo)
  const { data: processosUnicosData } = await supabase
    .from('acervo')
    .select('numero_processo')
    .eq('origem', 'acervo_geral');

  const processosAtivosUnicos = processosUnicosData
    ? new Set(processosUnicosData.map((p) => p.numero_processo)).size
    : 0;

  // Total de audiências (todas)
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
    .from('pendentes_manifestacao')
    .select('id', { count: 'exact', head: true })
    .is('baixado_em', null);

  const { count: manuaisCount } = await supabase
    .from('expedientes_manuais')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'concluido');

  const totalExpedientes = (pendentesCount || 0) + (manuaisCount || 0);

  // Expedientes vencidos
  const { count: pendentesVencidos } = await supabase
    .from('pendentes_manifestacao')
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

  // Expedientes resolvidos no prazo (taxa de resolução)
  const { count: totalBaixados } = await supabase
    .from('pendentes_manifestacao')
    .select('id', { count: 'exact', head: true })
    .not('baixado_em', 'is', null);

  const { count: baixadosNoPrazo } = await supabase
    .from('pendentes_manifestacao')
    .select('id', { count: 'exact', head: true })
    .not('baixado_em', 'is', null)
    .eq('prazo_vencido', false);

  const taxaResolucao = totalBaixados
    ? Math.round(((baixadosNoPrazo || 0) / totalBaixados) * 100)
    : 100;

  // Comparativo mês anterior (processos criados)
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

  // Comparativo audiências
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
      expedientes: 0, // Simplificado
    },
    evolucaoMensal: [], // Seria uma query mais complexa
  };
}

/**
 * Obtém carga de trabalho por usuário
 */
export async function getCargaUsuarios(): Promise<CargaUsuario[]> {
  const supabase = createServiceClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const em7dias = new Date(hoje);
  em7dias.setDate(em7dias.getDate() + 7);

  // Buscar usuários ativos
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nome_exibicao')
    .eq('ativo', true);

  if (!usuarios?.length) return [];

  const cargas: CargaUsuario[] = [];

  for (const usuario of usuarios) {
    // Processos ativos
    const { count: processosAtivos } = await supabase
      .from('acervo')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .eq('origem', 'acervo_geral');

    // Expedientes pendentes
    const { count: pendentes } = await supabase
      .from('pendentes_manifestacao')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .is('baixado_em', null);

    const { count: manuais } = await supabase
      .from('expedientes_manuais')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .neq('status', 'concluido');

    // Audiências próximas (7 dias)
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
export async function getStatusCapturas(): Promise<StatusCaptura[]> {
  const supabase = createServiceClient();

  // Buscar últimas capturas por TRT (simplificado)
  const { data: capturas } = await supabase
    .from('capturas_log')
    .select('*')
    .order('iniciado_em', { ascending: false })
    .limit(50);

  if (!capturas?.length) return [];

  // Agrupar por TRT (extrair do resultado se disponível)
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
export async function getPerformanceAdvogados(): Promise<PerformanceAdvogado[]> {
  const supabase = createServiceClient();

  const hoje = new Date();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  // Buscar usuários ativos
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nome_exibicao')
    .eq('ativo', true);

  if (!usuarios?.length) return [];

  const performances: PerformanceAdvogado[] = [];

  for (const usuario of usuarios) {
    // Baixas na semana
    const { count: baixasSemana } = await supabase
      .from('pendentes_manifestacao')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .gte('baixado_em', inicioSemana.toISOString());

    // Baixas no mês
    const { count: baixasMes } = await supabase
      .from('pendentes_manifestacao')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .gte('baixado_em', inicioMes.toISOString());

    // Taxa de cumprimento de prazo
    const { count: totalBaixados } = await supabase
      .from('pendentes_manifestacao')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .not('baixado_em', 'is', null);

    const { count: baixadosNoPrazo } = await supabase
      .from('pendentes_manifestacao')
      .select('id', { count: 'exact', head: true })
      .eq('responsavel_id', usuario.id)
      .not('baixado_em', 'is', null)
      .eq('prazo_vencido', false);

    // Expedientes vencidos atualmente
    const { count: expedientesVencidos } = await supabase
      .from('pendentes_manifestacao')
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
