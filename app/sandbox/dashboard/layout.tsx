import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard Sandbox - Sinesys',
  description: 'Preview da dashboard com dados mockados',
};

export default function SandboxDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
