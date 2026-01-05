import { actionCarregarDashboard, ProcessoCard, PortalNavbar } from '@/features/portal-cliente';
import { ShieldCheck } from "lucide-react";

export default async function ProcessosPage() {
  const { processos, cliente } = await actionCarregarDashboard();

  return (
    <>
      <PortalNavbar nomeCliente={cliente.nome} />
      <div className="container mx-auto p-4 pt-24 pb-20 max-w-[1400px]">
         <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Processos</h1>
         </div>
         
         <div className="space-y-4">
           {processos.length === 0 ? (
               <div className="space-y-4">
                <div className="flex flex-col items-center justify-center h-96 rounded-lg border border-dashed p-8 text-center bg-card">
                  <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold">Tudo tranquilo na Justiça!</h2>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    Nosso robô-detetive fez uma busca completa nos tribunais e não encontrou nenhum processo em andamento para este CPF.
                  </p>
                </div>
              </div>
           ) : (
                processos.map((proc, idx) => (
                    <ProcessoCard key={proc.numero || idx} processo={proc} clienteNome={cliente.nome} />
                ))
           )}
         </div>
      </div>
    </>
  );
}
