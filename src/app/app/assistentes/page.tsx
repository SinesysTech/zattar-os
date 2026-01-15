import { Suspense } from 'react';
import { AssistentesListWrapper, actionListarAssistentes, requireAuth } from '@/app/app/assistentes/feature';
import { checkMultiplePermissions } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Assistentes | Sinesys',
  description: 'Gerencie os assistentes de IA do sistema.',
};

export default async function AssistentesPage() {
  const { userId } = await requireAuth(['assistentes:listar']);

  const [canCreate, canEdit, canDelete] = await Promise.all([
    checkMultiplePermissions(userId, [['assistentes', 'criar']], false),
    checkMultiplePermissions(userId, [['assistentes', 'editar']], false), // assuming editar exists or mapping to criar if not
    checkMultiplePermissions(userId, [['assistentes', 'deletar']], false),
  ]);

  // Fetch initial data (only active assistants)
  const result = await actionListarAssistentes();

  if (!result.success || !result.data) {
    // Handle error state gracefully
    return (
      <div className="p-4 text-red-500">
        Erro ao carregar dados: {result.error}
      </div>
    );
  }

  const initialData = result.data;

  return (
    <div className="flex-1 space-y-4 p-4 pt-4">
      <Suspense fallback={<div>Carregando...</div>}>
        <AssistentesListWrapper
          initialData={initialData}
          permissions={{
            canCreate,
            canEdit,
            canDelete
          }}
        />
      </Suspense>
    </div>
  );
}
