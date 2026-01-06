import { actionCarregarDashboard, ContratoCard, PortalNavbar } from '@/features/portal-cliente';
import { FileText } from "lucide-react";

export default async function ContratosPage() {
  const { contratos, cliente } = await actionCarregarDashboard();

  return (
    <>
      <PortalNavbar nomeCliente={cliente.nome} />
      <div className="container mx-auto p-4 pt-24 pb-20 max-w-[1400px]">
         <h1 className="text-2xl font-bold mb-6">Contratos</h1>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {contratos.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-96 rounded-lg border border-dashed p-8 text-center bg-card">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">Nenhum contrato encontrado</h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Não localizamos contratos vinculados ao seu CPF.
                </p>
              </div>
           ) : (
                contratos.map((contrato, idx) => (
                    <ContratoCard key={contrato.id || idx} contrato={contrato} index={idx} />
                ))
           )}
         </div>
      </div>
    </>
  );
}
