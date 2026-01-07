import type { Metadata } from "next";
import { DashboardTabs } from "@/app/app/dashboard/components/dashboard-tabs";
import {
  TargetCard,
  TotalCustomersCard,
  TotalDeals,
  TotalRevenueCard,
  RecentTasks,
  ChatWidget,
  Reminders,
} from "./components";
import { actionListarLembretes } from "../actions";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Dashboard Geral",
    description:
      "Visão geral do sistema com indicadores e painéis principais.",
  };
}

export default async function Page() {
  // Obter usuário autenticado
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUserId = 0;
  let currentUserName = "Usuário";

  if (user) {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("id, nome_exibicao, nome_completo")
      .eq("auth_user_id", user.id)
      .single();

    if (usuario) {
      currentUserId = usuario.id;
      currentUserName = usuario.nome_exibicao || usuario.nome_completo || "Usuário";
    }
  }

  // Carregar lembretes do usuário
  const resultLembretes = await actionListarLembretes({
    concluido: false,
    limite: 10,
  });

  const lembretes = resultLembretes.success ? resultLembretes.data : [];
  return (
    <div className="space-y-4">
      <DashboardTabs />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TargetCard usuarioId={currentUserId} />
        <TotalCustomersCard usuarioId={currentUserId} />
        <TotalDeals usuarioId={currentUserId} />
        <TotalRevenueCard usuarioId={currentUserId} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <RecentTasks />
        <Reminders lembretes={lembretes} />
        {currentUserId > 0 && (
          <ChatWidget
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        )}
      </div>
    </div>
  );
}
