'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Tabs02, TabsList02, TabsTrigger02 } from '@/components/shadcn-studio/tabs/tabs-02';

const TABS = [
    { value: 'geral', label: 'Geral', href: '/dashboard/geral' },
    { value: 'processos', label: 'Processos', href: '/dashboard/processos' },
    { value: 'expedientes', label: 'Expedientes', href: '/dashboard/expedientes' },
    { value: 'audiencias', label: 'Audiências', href: '/dashboard/audiencias' },
    { value: 'financeiro', label: 'Financeiro', href: '/dashboard/financeiro' },
];

export function DashboardTabs() {
    const pathname = usePathname();

    // Determine active tab based on current path
    const activeTab = TABS.find((tab) => pathname.includes(tab.href))?.value || 'geral';

    return (
        <Tabs02 value={activeTab} className="w-full">
            <TabsList02 className="bg-white">
                {TABS.map((tab) => (
                    <Link key={tab.value} href={tab.href} passHref>
                        <TabsTrigger02 value={tab.value}>
                            {tab.label}
                        </TabsTrigger02>
                    </Link>
                ))}
            </TabsList02>
        </Tabs02>
    );
}
