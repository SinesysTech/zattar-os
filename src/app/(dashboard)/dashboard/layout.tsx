import { PageShell } from '@/components/shared/page-shell';
import { DashboardTabs } from '@/features/dashboard';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <PageShell>
            <div className="flex flex-col gap-4">
                <DashboardTabs />
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </PageShell>
    );
}
