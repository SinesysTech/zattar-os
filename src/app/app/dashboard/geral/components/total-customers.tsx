import { FileText } from "lucide-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { buscarExpedientesResumo } from "../../repositories/expedientes-metrics";

interface TotalCustomersCardProps {
  usuarioId: number;
}

export async function TotalCustomersCard({
  usuarioId,
}: TotalCustomersCardProps) {
  const resumo = await buscarExpedientesResumo(usuarioId);

  return (
    <Card>
      <CardHeader>
        <CardDescription>Meus Expedientes</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="font-display text-2xl lg:text-3xl">{resumo.total}</h4>
          <div className="text-sm text-muted-foreground">
            {resumo.vencidos > 0 ? (
              <span className="text-red-600">{resumo.vencidos} vencidos</span>
            ) : (
              <span className="text-green-600">Nenhum vencido</span>
            )}
          </div>
        </div>
        <CardAction>
          <div className="flex gap-4">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <FileText className="size-5" />
            </div>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
