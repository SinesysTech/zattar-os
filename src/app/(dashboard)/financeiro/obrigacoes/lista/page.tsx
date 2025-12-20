import { PageShell } from '@/components/shared/page-shell';
import { ObrigacoesContent } from '@/features/obrigacoes';

export default function Page() {
  return (
    <PageShell>
      <ObrigacoesContent visualizacao="lista" />
    </PageShell>
  );
}
