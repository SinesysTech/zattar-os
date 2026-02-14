import { actionCarregarDashboard, PagamentoCard, PortalNavbar } from '../feature';
import { DollarSign } from "lucide-react";

export default async function PagamentosPage() {
  const { pagamentos, cliente, errors } = await actionCarregarDashboard();

  return (
    <>
      <PortalNavbar nomeCliente={cliente.nome} />
      <div className="container mx-auto p-4 pt-24 pb-20 max-w-350">
        <h1 className="text-2xl font-bold mb-6">Pagamentos e Acordos</h1>

        {errors?.pagamentos && (
          <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              ⚠️ Erro ao carregar pagamentos: {errors.pagamentos}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagamentos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center h-96 rounded-lg border border-dashed p-8 text-center bg-card">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold">Nenhum registro financeiro</h2>
              <p className="text-muted-foreground mt-2 max-w-md">
                Não encontramos acordos ou pagamentos vinculados ao seu CPF.
              </p>
            </div>
          ) : (
            pagamentos.map((pagamento, idx) => (
              <PagamentoCard
                key={pagamento.id || idx}
                item={pagamento}
                numeroProcesso={pagamento.processoId ? `ID ${pagamento.processoId}` : undefined} // TODO: Would actullay need process number from Processo Entity if joined
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
