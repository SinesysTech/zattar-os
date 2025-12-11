import { Suspense } from 'react';
import { PageShell } from '@/components/shared/page-shell';
import { TiposExpedientesList } from '@/features/tipos-expedientes/components/tipos-expedientes-list';
import { listar } from '@/features/tipos-expedientes/service';

export const dynamic = 'force-dynamic';

export default async function TiposExpedientesPage() {
    // Fetch inicial data (optional, but good for SEO/SSR)
    const initialData = await listar({ pagina: 1, limite: 50 });

    return (
        <PageShell
            title="Tipos de Expedientes"
            description="Gerencie os tipos de expedientes utilizados no sistema."
        >
            <Suspense fallback={<div>Carregando...</div>}>
                <TiposExpedientesList initialData={initialData} />
            </Suspense>
        </PageShell>
    );
}
