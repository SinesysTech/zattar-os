import { NotificacoesList } from "@/features/notificacoes/components/notificacoes-list";
import { PageShell } from "@/components/shared/page-shell";

export const dynamic = "force-dynamic";

/**
 * Página de listagem de todas as notificações do usuário
 */
export default function NotificacoesPage() {
  return (
    <PageShell
      title="Notificações"
      description="Gerencie todas as suas notificações"
    >
      <NotificacoesList />
    </PageShell>
  );
}

