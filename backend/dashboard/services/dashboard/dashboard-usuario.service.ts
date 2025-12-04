/**
 * Serviço de Dashboard para Usuário Comum
 *
 * Agrega dados filtrados pelo responsável para exibição na dashboard
 */

import { getProcessosResumo } from '../persistence/dashboard-processos.persistence';
import { getAudienciasResumo, getProximasAudiencias } from '../persistence/dashboard-audiencias.persistence';
import { getExpedientesResumo, getExpedientesUrgentes } from '../persistence/dashboard-expedientes.persistence';
import type { DashboardUsuarioData, ProdutividadeResumo } from '@/backend/types/dashboard/types';
import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Obtém dados completos da dashboard para um usuário
 */
export async function getDashboardUsuario(
  usuarioId: number
): Promise<DashboardUsuarioData> {
  const supabase = createServiceClient();

  // Buscar dados do usuário
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, nome_exibicao')
    .eq('id', usuarioId)
    .single();

  if (!usuario) {
    throw new Error('Usuário não encontrado');
  }

  // Buscar todos os dados em paralelo
  const [
    processos,
    audiencias,
    expedientes,
    proximasAudiencias,
    expedientesUrgentes,
    produtividade,
  ] = await Promise.all([
    getProcessosResumo(usuarioId),
    getAudienciasResumo(usuarioId),
    getExpedientesResumo(usuarioId),
    getProximasAudiencias(usuarioId, 5),
    getExpedientesUrgentes(usuarioId, 5),
    getProdutividadeUsuario(usuarioId),
  ]);

  return {
    role: 'user',
    usuario: {
      id: usuario.id,
      nome: usuario.nome_exibicao,
    },
    processos,
    audiencias,
    expedientes,
    produtividade,
    proximasAudiencias,
    expedientesUrgentes,
    ultimaAtualizacao: new Date().toISOString(),
  };
}

/**
 * Obtém métricas de produtividade do usuário
 */
async function getProdutividadeUsuario(
  usuarioId: number
): Promise<ProdutividadeResumo> {
  const supabase = createServiceClient();

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
