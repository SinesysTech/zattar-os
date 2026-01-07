'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Archive } from 'lucide-react';
import { AnimatedIconTabs } from '@/components/ui/animated-icon-tabs';
import { ComunicaCNJConsulta } from './consulta';
import { ComunicaCNJCapturadas } from './capturadas';

type ComunicaCNJView = 'consulta' | 'capturadas';

const TABS = [
    { value: 'consulta', label: 'Consulta', icon: <Search /> },
    { value: 'capturadas', label: 'Capturadas', icon: <Archive /> },
];

const VALID_TABS = new Set(TABS.map(t => t.value));

interface ComunicaCNJTabsContentProps {
    initialTab?: ComunicaCNJView;
}

export function ComunicaCNJTabsContent({ initialTab = 'consulta' }: ComunicaCNJTabsContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const rawTab = searchParams.get('tab');
    const activeTab = (rawTab && VALID_TABS.has(rawTab))
        ? (rawTab as ComunicaCNJView)
        : initialTab;

    const handleTabChange = React.useCallback(
        (value: string) => {
            router.push(`/app/comunica-cnj?tab=${value}`, { scroll: false });
        },
        [router]
    );

    return (
        <div className="flex flex-col min-h-0">
            <AnimatedIconTabs
                tabs={TABS}
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-fit"
            />
            <div className="mt-4 flex-1 min-h-0">
                {activeTab === 'consulta' ? <ComunicaCNJConsulta /> : <ComunicaCNJCapturadas />}
            </div>
        </div>
    );
}
