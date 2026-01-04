/**
 * DASHBOARD FEATURE - Admin Metrics Repository
 *
 * Métricas administrativas do escritório.
 * Responsabilidades:
 * - Métricas gerais do escritório
 * - Carga de trabalho por usuário
 * - Status de capturas
 * - Performance de advogados
 * - Dados de usuário
 */

import { createClient } from '@/lib/supabase/server';
import type {
  MetricasEscritorio,
  CargaUsuario,
  StatusCaptura,
  PerformanceAdvogado,
} from '../domain';

/**
 * Obtém métricas consolidadas do escritório
 *
 * IMPORTANTE: Contagem de processos baseada em número CNJ único (numero_processo),
 * pois um mesmo processo pode ter múltiplos registros em instâncias diferentes.
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

  // Total de processos (únicos por número CNJ)
  // Usar função SQL para contar diretamente no banco (sem limite de 1000 registros)
  const { data: totalProcessosData, error: totalError } = await supabase.rpc(
    'count_processos_unicos',
    {
      p_origem: null,
      p_responsavel_id: null,
      p_data_inicio: null,
      p_data_fim: null,
    }
  );

  const totalProcessos = totalError ? 0 : (totalProcessosData as number) || 0;

  // Processos ativos (únicos por número CNJ)
  const { data: processosAtivosData, error: ativosError } = await supabase.rpc(
    'count_processos_unicos',
    {
      p_origem: 'acervo_geral',
      p_responsavel_id: null,
      p_data_inicio: null,
      p_data_fim: null,
    }
  );

  const processosAtivos = ativosError ? 0 : (processosAtivosData as number) || 0;

  // Processos arquivados (únicos por número CNJ)
  const { data: processosArquivadosData, error: arquivadosError } = await supabase.rpc(
    'count_processos_unicos',
    {
      p_origem: 'arquivado',
      p_responsavel_id: null,
      p_data_inicio: null,
      p_data_fim: null,
    }
  );

  const processosArquivados = arquivadosError ? 0 : (processosArquivadosData as number) || 0;

  // processosAtivosUnicos é o mesmo que processosAtivos (para compatibilidade)
  const processosAtivosUnicos = processosAtivos;

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

  // Comparativo mês anterior (processos únicos por número CNJ)
  const { data: processosNovosData, error: novosError } = await supabase.rpc(
    'count_processos_unicos',
    {
      p_origem: null,
      p_responsavel_id: null,
      p_data_inicio: inicioMes.toISOString(),
      p_data_fim: null,
    }
  );

  const processosNovos = novosError ? 0 : (processosNovosData as number) || 0;

  const { data: processosNovosAnteriorData, error: anterioresError } = await supabase.rpc(
    'count_processos_unicos',
    {
      p_origem: null,
      p_responsavel_id: null,
      p_data_inicio: inicioMesAnterior.toISOString(),
      p_data_fim: fimMesAnterior.toISOString(),
    }
  );

  const processosNovosAnterior = anterioresError
    ? 0
    : (processosNovosAnteriorData as number) || 0;

  const comparativoProcessos = processosNovosAnterior
    ? Math.round(
        ((processosNovos - processosNovosAnterior) / processosNovosAnterior) * 100
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
    totalProcessos,
    processosAtivos,
    processosArquivados,
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
 *
 * IMPORTANTE: Contagem de processos baseada em número CNJ único (numero_processo).
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
    // Processos ativos únicos por número CNJ
    // Usar função SQL para contar diretamente no banco
    const { data: processosData, error: processosError } = await supabase.rpc(
      'count_processos_unicos',
      {
        p_origem: 'acervo_geral',
        p_responsavel_id: usuario.id,
        p_data_inicio: null,
        p_data_fim: null,
      }
    );

    const processosAtivos = processosError ? 0 : (processosData as number) || 0;

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

    // Conta audiências do usuário OU sem responsável (para distribuição de carga)
    const { count: audienciasProximas } = await supabase
      .from('audiencias')
      .select('id', { count: 'exact', head: true })
      .or(`responsavel_id.eq.${usuario.id},responsavel_id.is.null`)
      .gte('data_inicio', hoje.toISOString())
      .lt('data_inicio', em7dias.toISOString());

    const expedientesPendentes = (pendentes || 0) + (manuais || 0);

    cargas.push({
      usuario_id: usuario.id,
      usuario_nome: usuario.nome_exibicao,
      processosAtivos,
      expedientesPendentes,
      audienciasProximas: audienciasProximas || 0,
      cargaTotal: processosAtivos + expedientesPendentes * 2 + (audienciasProximas || 0) * 3,
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
