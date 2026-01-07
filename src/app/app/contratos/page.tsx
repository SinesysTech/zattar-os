/**
 * Página de Contratos (Server Component)
 *
 * Lista e gerencia contratos jurídicos do escritório.
 * Dados são carregados no servidor para melhor performance e SEO.
 */

import { Suspense } from 'react';
import { listarContratos, ContratosTableWrapper } from '@/features/contratos';
import { listarClientes, listarPartesContrarias } from '@/features/partes/service';
import { actionListarUsuarios } from '@/features/usuarios';
import { PageShell } from '@/components/shared/page-shell';
import { Skeleton } from '@/components/ui/skeleton';

function ContratosLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-3xl" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default async function ContratosPage() {
  // Fetch paralelo de dados no servidor
  const [contratosResult, clientesResult, partesContrariasResult, usuariosResult] = await Promise.all([
    listarContratos({ pagina: 1, limite: 50 }),
    listarClientes({ limite: 1000 }),
    listarPartesContrarias({ limite: 1000 }),
    actionListarUsuarios({ limite: 1000, ativo: true }),
  ]);

  const contratos = contratosResult.success ? contratosResult.data.data : [];
  const pagination = contratosResult.success ? contratosResult.data.pagination : null;

  // Preparar options para os selects (apenas id e nome)
  const clientesOptions = clientesResult.success
    ? clientesResult.data.data.map((c) => ({ id: c.id, nome: c.nome }))
    : [];

  const partesContrariasOptions = partesContrariasResult.success
    ? partesContrariasResult.data.data.map((p) => ({ id: p.id, nome: p.nome }))
    : [];

  const usuariosOptions = usuariosResult.success && usuariosResult.data
    ? usuariosResult.data.usuarios.map((u) => ({ id: u.id, nome: u.nomeExibicao || u.nomeCompleto }))
    : [];

  return (
    <PageShell>
      <Suspense fallback={<ContratosLoading />}>
        <ContratosTableWrapper
          initialData={contratos}
          initialPagination={pagination}
          clientesOptions={clientesOptions}
          partesContrariasOptions={partesContrariasOptions}
          usuariosOptions={usuariosOptions}
        />
      </Suspense>
    </PageShell>
  );
}
