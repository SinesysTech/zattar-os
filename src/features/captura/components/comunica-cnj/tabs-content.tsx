'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Archive } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ComunicaCNJConsulta } from './consulta';
import { ComunicaCNJCapturadas } from './capturadas';

type DiarioOficialView = 'consulta' | 'capturadas';

const VALID_TABS = new Set<string>(['consulta', 'capturadas']);

interface ComunicaCNJTabsContentProps {
    initialTab?: DiarioOficialView;
}

export function ComunicaCNJTabsContent({ initialTab = 'consulta' }: ComunicaCNJTabsContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const rawTab = searchParams.get('tab');
    const activeTab = (rawTab && VALID_TABS.has(rawTab))
        ? (rawTab as DiarioOficialView)
        : initialTab;

    const handleTabChange = React.useCallback(
        (value: string) => {
            if (!value) return;
            router.push(`/app/comunica-cnj?tab=${value}`, { scroll: false });
        },
        [router]
    );

    return (
        <div className="flex flex-col min-h-0">
            <div className="rounded-2xl border border-border/60 bg-[linear-gradient(135deg,rgba(30,58,138,0.06),rgba(180,83,9,0.05))] px-4 py-4 pb-5 sm:px-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-3xl space-y-2">
                        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Monitoramento processual
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight font-heading">
                                Diário Oficial
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Consulte publicações na API do CNJ e acompanhe as comunicações já capturadas e vinculadas ao operacional.
                            </p>
                        </div>
                    </div>
                <ToggleGroup
                    type="single"
                    value={activeTab}
                    onValueChange={handleTabChange}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start self-start rounded-xl bg-background/85 p-1 backdrop-blur sm:w-auto"
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem
                                value="consulta"
                                aria-label="Consulta"
                                className="flex-1 gap-2 rounded-lg px-3 sm:flex-none"
                            >
                                <Search className="h-4 w-4" />
                                <span>Consulta</span>
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Consulta</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem
                                value="capturadas"
                                aria-label="Capturadas"
                                className="flex-1 gap-2 rounded-lg px-3 sm:flex-none"
                            >
                                <Archive className="h-4 w-4" />
                                <span>Capturadas</span>
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Capturadas</TooltipContent>
                    </Tooltip>
                </ToggleGroup>
                </div>
            </div>
            <div className="flex-1 min-h-0 pt-4">
                {activeTab === 'consulta' ? <ComunicaCNJConsulta /> : <ComunicaCNJCapturadas />}
            </div>
        </div>
    );
}
