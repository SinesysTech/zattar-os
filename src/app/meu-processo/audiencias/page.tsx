import { actionCarregarDashboard, AudienciaCard, PortalNavbar } from '@/features/portal-cliente';
import { AudioLines } from "lucide-react";

export default async function AudienciasPage() {
  const { audiencias, cliente } = await actionCarregarDashboard();

  return (
    <>
      <PortalNavbar nomeCliente={cliente.nome} />
      <div className="container mx-auto p-4 pt-24 pb-20 max-w-[1400px]">
         <h1 className="text-2xl font-bold mb-6">Audiências</h1>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {audiencias.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-96 rounded-lg border border-dashed p-8 text-center bg-card">
                <AudioLines className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">Nenhuma audiência agendada</h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                   Não há audiências futuras ou passadas registradas para seus processos.
                </p>
              </div>
           ) : (
                audiencias.map((audiencia, idx) => (
                    <AudienciaCard key={audiencia.id || idx} audiencia={audiencia} />
                ))
           )}
         </div>
      </div>
    </>
  );
}
