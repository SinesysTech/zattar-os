import { PageShell } from '@/components/shared';

export default function AudienciasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageShell
      title="Audiências"
      description="Gerencie suas audiências e compromissos."
    >
      {children}
    </PageShell>
  );
}
