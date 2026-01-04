import { PageShell } from '@/components/shared/page-shell';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <PageShell>
            {children}
        </PageShell>
    );
}
