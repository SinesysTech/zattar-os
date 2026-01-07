import { Calendar } from "lucide-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

interface TotalDealsProps {
  usuarioId: number;
}

export async function TotalDeals({ usuarioId }: TotalDealsProps) {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Buscar audiências designadas do usuário (futuras ou de hoje)
  const { count: totalAudiencias } = await supabase
    .from("audiencias")
    .select("id", { count: "exact", head: true })
    .eq("responsavel_id", usuarioId)
    .eq("designada", true)
    .gte("data_inicio", hoje.toISOString());

  // Buscar audiências da próxima semana
  const proximaSemana = new Date(hoje);
  proximaSemana.setDate(proximaSemana.getDate() + 7);

  const { count: audienciasProximaSemana } = await supabase
    .from("audiencias")
    .select("id", { count: "exact", head: true })
    .eq("responsavel_id", usuarioId)
    .eq("designada", true)
    .gte("data_inicio", hoje.toISOString())
    .lt("data_inicio", proximaSemana.toISOString());

  return (
    <Card>
      <CardHeader>
        <CardDescription>Minhas Audiências</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="font-display text-2xl lg:text-3xl">
            {totalAudiencias || 0}
          </h4>
          <div className="text-sm text-muted-foreground">
            {(audienciasProximaSemana || 0) > 0 ? (
              <span className="text-amber-600">
                {audienciasProximaSemana} esta semana
              </span>
            ) : (
              <span className="text-green-600">Nenhuma esta semana</span>
            )}
          </div>
        </div>
        <CardAction>
          <div className="flex gap-4">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <Calendar className="size-5" />
            </div>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
