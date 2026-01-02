'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, CalendarDays, FileText, Inbox, Wallet, FileSignature } from 'lucide-react';

import { AnimatedIconTabs } from '@/components/ui/animated-icon-tabs';

const TABS = [
    { value: 'geral', label: 'Geral', href: '/dashboard/geral', icon: <BarChart3 /> },
    { value: 'contratos', label: 'Contratos', href: '/dashboard/contratos', icon: <FileSignature /> },
    { value: 'processos', label: 'Processos', href: '/dashboard/processos', icon: <FileText /> },
    { value: 'expedientes', label: 'Expedientes', href: '/dashboard/expedientes', icon: <Inbox /> },
    { value: 'audiencias', label: 'Audiências', href: '/dashboard/audiencias', icon: <CalendarDays /> },
    { value: 'financeiro', label: 'Financeiro', href: '/dashboard/financeiro', icon: <Wallet /> },
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
        <AnimatedIconTabs
            tabs={TABS}
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
            listClassName="flex-wrap"
        />
    );
}
