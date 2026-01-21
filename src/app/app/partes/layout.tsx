import { PartesTabs } from '@/features/partes/components/partes-tabs';

export default function PartesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="px-1">
                <h1 className="text-2xl font-bold tracking-tight mb-4">Partes</h1>
                <PartesTabs />
            </div>
            <div className="flex-1 overflow-auto px-1">
                {children}
            </div>
        </div>
    );
}
