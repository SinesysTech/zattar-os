'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs02, TabsList02, TabsTrigger02, TabsContent02 } from '@/components/shadcn-studio/tabs/tabs-02';
import { ComunicaCNJConsulta } from './consulta';
import { ComunicaCNJCapturadas } from './capturadas';

type ComunicaCNJView = 'consulta' | 'capturadas';

const TABS = [
    { value: 'consulta', label: 'Consulta' },
    { value: 'capturadas', label: 'Capturadas' },
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
            router.push(`/comunica-cnj?tab=${value}`, { scroll: false });
        },
        [router]
    );

    return (
        <Tabs02 value={activeTab} onValueChange={handleTabChange}>
            <TabsList02 className="bg-white">
                {TABS.map((tab) => (
                    <TabsTrigger02
                        key={tab.value}
                        value={tab.value}
                    >
                        {tab.label}
                    </TabsTrigger02>
                ))}
            </TabsList02>
            <div className="mt-4 flex-1 min-h-0">
                <TabsContent02 value="consulta" className="m-0 border-none p-0 outline-none data-[state=inactive]:hidden">
                    <ComunicaCNJConsulta />
                </TabsContent02>
                <TabsContent02 value="capturadas" className="m-0 border-none p-0 outline-none data-[state=inactive]:hidden">
                    <ComunicaCNJCapturadas />
                </TabsContent02>
            </div>
        </Tabs02>
    );
}
