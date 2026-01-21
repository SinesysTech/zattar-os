'use client';

import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Briefcase, User, UserRound, Users } from 'lucide-react';
import { AnimatedIconTabs } from '@/components/ui/animated-icon-tabs';

const TABS_UI = [
    { value: 'clientes', label: 'Clientes', icon: <User /> },
    { value: 'partes-contrarias', label: 'Partes Contrárias', icon: <Users /> },
    { value: 'terceiros', label: 'Terceiros', icon: <Briefcase /> },
    { value: 'representantes', label: 'Representantes', icon: <UserRound /> },
];

export function PartesTabs() {
    const router = useRouter();
    const pathname = usePathname();

    // Deriva a tab ativa do pathname
    const activeTab = pathname.split('/').pop() || 'clientes';

    const handleTabChange = React.useCallback(
        (value: string) => {
            router.push(`/app/partes/${value}`);
        },
        [router]
    );

    return (
        <div className="flex flex-col min-h-0 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10 pb-2">
            <AnimatedIconTabs
                tabs={TABS_UI}
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-fit"
            />
        </div>
    );
}
