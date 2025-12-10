import { AudienciasContent } from '@/features/audiencias/components/audiencias-content';

export const dynamic = 'force-dynamic';

export default function AudienciasPage() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audiências</h2>
          <p className="text-muted-foreground">
            Gerencie suas audiências e compromissos.
          </p>
        </div>
      </div>
      <AudienciasContent visualizacao="semana" />
    </div>
  );
}
