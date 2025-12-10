import { redirect } from 'next/navigation';
import { addDays, formatISO, startOfWeek, endOfWeek, parseISO, isSameWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { actionListarExpedientes } from '@/core/app/actions/expedientes';
import { ListarExpedientesParams, Expediente } from '@/core/expedientes/domain';
import { ExpedientesVisualizacaoSemana } from '../components/expedientes-visualizacao-semana';
import { ExpedientesFilters, parseExpedientesFilters } from '../components/expedientes-toolbar-filters';
import { obterUsuarios } from '@/backend/usuarios/services/usuarios/listar-usuarios.service';
import { listarTiposExpedientes } from '@/backend/tipos-expedientes/services/tipos-expedientes/listar-tipos-expedientes.service';
import { ListarTiposExpedientesParams } from '@/backend/types/tipos-expedientes/types';
import { ListarUsuariosParams } from '@/backend/types/usuarios';

interface ExpedientesSemanaPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export const dynamic = 'force-dynamic';

export default async function ExpedientesSemanaPage({ searchParams }: ExpedientesSemanaPageProps) {
  const today = new Date();
  let currentWeekStart: Date;
  
  if (searchParams.date) {
    const parsedDate = parseISO(searchParams.date as string);
    currentWeekStart = startOfWeek(parsedDate, { locale: ptBR, weekStartsOn: 1 });
  } else {
    currentWeekStart = startOfWeek(today, { locale: ptBR, weekStartsOn: 1 });
  }

  const currentWeekEnd = endOfWeek(currentWeekStart, { locale: ptBR, weekStartsOn: 1 });

  const selectedFilterIds = Array.isArray(searchParams.filters)
    ? searchParams.filters
    : searchParams.filters
      ? [searchParams.filters]
      : [];
  
  const parsedFilters: ExpedientesFilters = parseExpedientesFilters(selectedFilterIds);

  const params: ListarExpedientesParams = {
    ...parsedFilters,
    dataPrazoLegalInicio: formatISO(currentWeekStart, { representation: 'date' }),
    dataPrazoLegalFim: formatISO(currentWeekEnd, { representation: 'date' }),
    baixado: false, // Por padrão, a visualização semanal mostra apenas pendentes
    limite: 1000, // Limite alto para carregar todos os da semana
    pagina: 1,
  };

  const expedientesResult = await actionListarExpedientes(params);

  if (!expedientesResult.success) {
    console.error('Erro ao buscar expedientes:', expedientesResult.message);
    return <div>Erro ao carregar expedientes.</div>;
  }

  const usuariosParams: ListarUsuariosParams = { limite: 100, ativo: true };
  const usuariosResult = await obterUsuarios(usuariosParams);

  const tiposExpedienteParams: ListarTiposExpedientesParams = { limite: 100 };
  const tiposExpedienteResult = await listarTiposExpedientes(tiposExpedienteParams);

  if (!usuariosResult.success) {
    console.error('Erro ao buscar usuários:', usuariosResult.error);
  }
  if (!tiposExpedienteResult.success) {
    console.error('Erro ao buscar tipos de expediente:', tiposExpedienteResult.error);
  }

  const tiposExpediente = tiposExpedienteResult.success ? tiposExpedienteResult.tipos_expedientes.map(t => ({ id: t.id, tipoExpediente: t.tipo_expediente })) : [];

  return (
    <ExpedientesVisualizacaoSemana
      expedientes={expedientesResult.data.data}
      isLoading={false}
      usuarios={usuarios}
      tiposExpedientes={tiposExpediente}
      semanaAtual={currentWeekStart}
    />
  );
}