import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { obterDashboardUsuario, obterDashboardAdmin } from '../service';
import { DashboardProvider } from '../hooks';
import { Heading } from '@/components/ui/typography';

// Widgets de expedientes
import { UrgencyList } from '../widgets/expedientes/urgency-list';
import { AgingFunnel } from '../widgets/expedientes/aging-funnel';
import { SaudePrazos } from '../widgets/expedientes/saude-prazos';
import { OrigemDistribution } from '../widgets/expedientes/origem';
import { ResultadoDecisao } from '../widgets/expedientes/resultado-decisao';
import { VolumeSemanal } from '../widgets/expedientes/volume-semanal';
import { PrazoMedio } from '../widgets/expedientes/prazo-medio';
import { CalendarioPrazos } from '../widgets/expedientes/calendario-prazos';
import { TendenciaResponsividade } from '../widgets/expedientes/tendencia-responsividade';

export const metadata: Metadata = {
  title: 'Dashboard — Expedientes',
  description: 'Painel detalhado de expedientes: urgências, prazos, volume e responsividade.',
};

export const dynamic = 'force-dynamic';

async function prefetchData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, is_super_admin')
    .eq('auth_uid', user.id)
    .single();

  if (!usuario) return null;

  return usuario.is_super_admin
    ? obterDashboardAdmin(usuario.id)
    : obterDashboardUsuario(usuario.id);
}

export default async function ExpedientesPage() {
  const initialData = await prefetchData().catch(() => null);

  return (
    <DashboardProvider initialData={initialData}>
      <div className="space-y-4">
        <Heading level="page">Expedientes</Heading>
        {/* Row 1: Urgências + Funil */}
        <div className="grid gap-4 md:grid-cols-2">
          <UrgencyList />
          <AgingFunnel />
        </div>
        {/* Row 2: Saúde + Volume + Prazo */}
        <div className="grid gap-4 md:grid-cols-3">
          <SaudePrazos />
          <VolumeSemanal />
          <PrazoMedio />
        </div>
        {/* Row 3: Origem + Resultado + Responsividade */}
        <div className="grid gap-4 md:grid-cols-3">
          <OrigemDistribution />
          <ResultadoDecisao />
          <TendenciaResponsividade />
        </div>
        {/* Row 4: Calendário (full width) */}
        <CalendarioPrazos />
      </div>
    </DashboardProvider>
  );
}
