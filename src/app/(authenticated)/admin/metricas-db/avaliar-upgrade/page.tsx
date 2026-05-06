import { Suspense } from "react";
import {
  PageShell,
  PageHeader,
  PageHeaderTitle,
  PageContent,
} from "@/components/shared/page-shell";
import { requireAuth } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AvaliarUpgradeContent } from "./components/avaliar-upgrade-content";

export const metadata = {
  title: "Avaliação de Upgrade de Compute | ZattarOS",
  description: "Avaliação automatizada de necessidade de upgrade do compute Supabase",
};

export default async function AvaliarUpgradePage() {
  const { user } = await requireAuth([]);

  const supabase = await createClient();
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!usuario?.is_super_admin) {
    redirect("/app");
  }

  return (
    <PageShell>
      <PageHeader>
        <PageHeaderTitle>Avaliação de Upgrade de Compute</PageHeaderTitle>
      </PageHeader>
      <PageContent>
        <Suspense fallback={<div>Carregando...</div>}>
          <AvaliarUpgradeContent />
        </Suspense>
      </PageContent>
    </PageShell>
  );
}
