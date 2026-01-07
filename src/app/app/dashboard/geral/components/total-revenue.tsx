import { ClipboardList } from "lucide-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

interface TotalRevenueCardProps {
  usuarioId: number;
}

export async function TotalRevenueCard({ usuarioId }: TotalRevenueCardProps) {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Buscar perícias em aberto do usuário (sem laudo juntado)
  const { count: totalPericias } = await supabase
    .from("pericias")
    .select("id", { count: "exact", head: true })
    .eq("responsavel_id", usuarioId)
    .eq("laudo_juntado", false);

  // Buscar perícias com prazo vencido
  const { count: periciasVencidas } = await supabase
    .from("pericias")
    .select("id", { count: "exact", head: true })
    .eq("responsavel_id", usuarioId)
    .eq("laudo_juntado", false)
    .lt("prazo_entrega", hoje.toISOString());

  return (
    <Card>
      <CardHeader>
        <CardDescription>Minhas Perícias</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="font-display text-2xl lg:text-3xl">
            {totalPericias || 0}
          </h4>
          <div className="text-sm text-muted-foreground">
            {(periciasVencidas || 0) > 0 ? (
              <span className="text-red-600">
                {periciasVencidas} com prazo vencido
              </span>
            ) : (
              <span className="text-green-600">Nenhuma vencida</span>
            )}
          </div>
        </div>
        <CardAction>
          <div className="flex gap-4">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <ClipboardList className="size-5" />
            </div>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
