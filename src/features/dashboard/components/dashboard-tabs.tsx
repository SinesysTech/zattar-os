'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Tabs02, TabsList02, TabsTrigger02 } from '@/components/ui/tabs-02';

const TABS = [
    { value: 'geral', label: 'Geral', href: '/dashboard/geral' },
    { value: 'processos', label: 'Processos', href: '/dashboard/processos' },
    { value: 'expedientes', label: 'Expedientes', href: '/dashboard/expedientes' },
    { value: 'audiencias', label: 'Audiências', href: '/dashboard/audiencias' },
    { value: 'financeiro', label: 'Financeiro', href: '/dashboard/financeiro' },
];

export function DashboardTabs() {
    const pathname = usePathname();
    const router = useRouter();

    // Determine active tab based on current path
    const activeTab = TABS.find((tab) => pathname.includes(tab.href))?.value || 'geral';

    const handleTabChange = (value: string) => {
        const tab = TABS.find((t) => t.value === value);
        if (tab) {
            router.push(tab.href);
        }
    };

    return (
        <Tabs02 value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList02>
                {TABS.map((tab) => (
                    <TabsTrigger02 key={tab.value} value={tab.value}>
                        {tab.label}
                    </TabsTrigger02>
                ))}
            </TabsList02>
        </Tabs02>
    );
}
