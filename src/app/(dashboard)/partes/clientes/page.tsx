/**
 * Página de Clientes (Server Component)
 *
 * Lista e gerencia clientes do escritório.
 * Dados são carregados no servidor para melhor performance e SEO.
 */

import { listarClientes } from '@/features/partes/service';
import { PageShell } from '@/components/shared/page-shell';
import { ClientesTableWrapper } from '@/features/partes';

export default async function ClientesPage() {
  // Fetch inicial no servidor
  const result = await listarClientes({
    pagina: 1,
    limite: 50,
    incluir_processos: true,
    ativo: true,
  });

  const clientes = result.success ? result.data.data : [];
  const pagination = result.success ? result.data.pagination : null;

  return (
    <PageShell>
      <ClientesTableWrapper
        initialData={clientes}
        initialPagination={pagination}
      />
    </PageShell>
  );
}
