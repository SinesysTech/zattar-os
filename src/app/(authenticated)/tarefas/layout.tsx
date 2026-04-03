import { PageShell } from "@/components/shared/page-shell";

export default function TarefasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageShell>{children}</PageShell>;
}
