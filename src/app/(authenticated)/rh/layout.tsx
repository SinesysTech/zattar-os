import { PageShell } from '@/components/shared/page-shell';

export default function RHModuleLayout({ children }: { children: React.ReactNode }) {
    return <PageShell>{children}</PageShell>;
}
