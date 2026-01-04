/**
 * DASHBOARD FEATURE - Expedientes Metrics Repository
 *
 * Métricas e estatísticas de expedientes.
 * Responsabilidades:
 * - Resumo de expedientes pendentes
 * - Listagem de expedientes urgentes
 * - Total de expedientes pendentes do escritório
 */

import { createClient } from '@/lib/supabase/server';
import type { ExpedientesResumo, ExpedienteUrgente } from '../domain';

/**
 * Obtém resumo de expedientes do usuário
 *
 * NOTA: Usa LEFT JOIN implícito para não excluir expedientes sem tipo definido.
 * Inclui expedientes com prazo próximo mesmo sem responsável (para admins).
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
  // Nota: o join com tipos_expedientes é opcional (left join implícito no Supabase)
  let pendentesQuery = supabase
    .from('expedientes')
    .select(`
      id,
      data_prazo_legal_parte,
      tipo_expediente_id,
      responsavel_id,
      tipos_expedientes:tipo_expediente_id (tipo_expediente)
    `)
    .is('baixado_em', null);

  if (responsavelId) {
    pendentesQuery = pendentesQuery.eq('responsavel_id', responsavelId);
  }

  const { data: pendentes, error: pendentesError } = await pendentesQuery;

  if (pendentesError) {
    console.error('[Dashboard] Erro ao buscar expedientes pendentes:', pendentesError);
    console.error('[Dashboard] Query params:', { responsavelId });
    throw new Error(`Erro ao buscar pendentes: ${pendentesError.message}`);
  }

  // Buscar expedientes manuais (não concluídos)
  let manuaisQuery = supabase
    .from('expedientes_manuais')
    .select(`
      id,
      prazo_fatal,
      tipo_expediente_id,
      responsavel_id,
      tipos_expedientes:tipo_expediente_id (tipo_expediente)
    `)
    .neq('status', 'concluido');

  if (responsavelId) {
    manuaisQuery = manuaisQuery.eq('responsavel_id', responsavelId);
  }

  const { data: manuais, error: manuaisError } = await manuaisQuery;

  if (manuaisError) {
    console.error('[Dashboard] Erro ao buscar expedientes manuais:', manuaisError);
    console.error('[Dashboard] Query params:', { responsavelId });
    throw new Error(`Erro ao buscar expedientes manuais: ${manuaisError.message}`);
  }

  // Log de debug para diagnóstico
  if (process.env.NODE_ENV === 'development') {
    console.log('[Dashboard] Expedientes encontrados:', {
      pendentes: pendentes?.length || 0,
      manuais: manuais?.length || 0,
      responsavelId,
    });
  }

  // Consolidar todos os expedientes
  // Inclui expedientes mesmo sem tipo (fallback para 'Sem tipo' ou 'Manual')
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
 *
 * NOTA: Ordena por urgência (vencidos primeiro, depois por prazo).
 * O cálculo de dias_restantes usa timezone-aware (setHours para normalizar).
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

  const { data: pendentes, error: pendentesError } = await pendentesQuery;

  if (pendentesError) {
    console.error('[Dashboard] Erro ao buscar expedientes urgentes:', pendentesError);
  }

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

  const { data: manuais, error: manuaisError } = await manuaisQuery;

  if (manuaisError) {
    console.error('[Dashboard] Erro ao buscar expedientes manuais urgentes:', manuaisError);
  }

  // Log de debug para diagnóstico
  if (process.env.NODE_ENV === 'development') {
    console.log('[Dashboard] Expedientes urgentes encontrados:', {
      pendentes: pendentes?.length || 0,
      manuais: manuais?.length || 0,
      responsavelId,
    });
  }

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
