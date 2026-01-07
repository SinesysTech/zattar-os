import { PageShell } from '@/components/shared';

export default function AudienciasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageShell>{children}</PageShell>;
}
