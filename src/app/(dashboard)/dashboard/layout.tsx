import { PageShell } from '@/components/shared/page-shell';
import { DashboardHeaderShell } from '@/features/dashboard';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <PageShell>
            <DashboardHeaderShell>{children}</DashboardHeaderShell>
        </PageShell>
    );
}
