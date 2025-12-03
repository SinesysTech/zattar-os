/**
 * Persistência de dados de expedientes para Dashboard
 *
 * Consolida dados de pendentes_manifestacao e expedientes_manuais
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { ExpedientesResumo, ExpedienteUrgente } from '@/backend/types/dashboard/types';

/**
 * Obtém resumo de expedientes do usuário
 */
export async function getExpedientesResumo(
  responsavelId?: number
): Promise<ExpedientesResumo> {
  const supabase = createServiceClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const em7dias = new Date(hoje);
  em7dias.setDate(em7dias.getDate() + 7);

  // Buscar pendentes de manifestação (não baixados)
  let pendentesQuery = supabase
    .from('pendentes_manifestacao')
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

  // Calcular métricas por prazo
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
export async function getExpedientesUrgentes(
  responsavelId?: number,
  limite: number = 5
): Promise<ExpedienteUrgente[]> {
  const supabase = createServiceClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Buscar pendentes de manifestação urgentes
  let pendentesQuery = supabase
    .from('pendentes_manifestacao')
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
    .limit(limite * 2); // Pegar mais para compensar manuais

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
        origem: 'pendentes_manifestacao' as const,
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

  // Ordenar: vencidos primeiro, depois por dias restantes
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
export async function getTotalExpedientesPendentes(): Promise<{
  total: number;
  vencidos: number;
}> {
  const supabase = createServiceClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Contar pendentes não baixados
  const { count: pendentesTotal } = await supabase
    .from('pendentes_manifestacao')
    .select('id', { count: 'exact', head: true })
    .is('baixado_em', null);

  // Contar pendentes vencidos
  const { count: pendentesVencidos } = await supabase
    .from('pendentes_manifestacao')
    .select('id', { count: 'exact', head: true })
    .is('baixado_em', null)
    .lt('data_prazo_legal_parte', hoje.toISOString());

  // Contar manuais não concluídos
  const { count: manuaisTotal } = await supabase
    .from('expedientes_manuais')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'concluido');

  // Contar manuais vencidos
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
