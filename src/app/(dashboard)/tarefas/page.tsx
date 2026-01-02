import { PageShell } from '@/components/shared/page-shell';
import { TarefasContent } from '@/features/tasks';

export const dynamic = 'force-dynamic';

/**
 * Página de Tarefas
 * 
 * Gerencia tarefas do usuário autenticado
 */
export default function TarefasPage() {
  return (
    <PageShell
      title="Tarefas"
      description="Gerencie suas tarefas e acompanhe seus compromissos"
    >
      <TarefasContent />
    </PageShell>
  );
}

