import { PageShell } from '@/components/shared';

export default function PartesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <PageShell>{children}</PageShell>;
}
