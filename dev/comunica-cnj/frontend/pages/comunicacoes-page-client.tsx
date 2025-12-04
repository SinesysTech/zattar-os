'use client';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComunicaCNJSearchForm } from '@/components/comunica-cnj/search-form';
import { ComunicaCNJResultsTable } from '@/components/comunica-cnj/results-table';
import { ComunicacaoExecutionsList } from '@/components/comunica-cnj/executions-list';
import { getTribunaisComSigla } from '@/lib/constants/comunica-cnj-tribunais';
import { Search, History } from 'lucide-react';
import { useIsMounted } from '@/hooks/use-is-mounted';
export default function ComunicacoesPageClient() {
  const [activeTab, setActiveTab] = useState<'busca' | 'historico'>('busca');
  const isMounted = useIsMounted();
  const tribunaisCNJ = getTribunaisComSigla();
  if (!isMounted) { return (<div className="space-y-6"><div className="flex items-center gap-2 p-4 border rounded-lg"><div className="h-10 w-32 bg-muted animate-pulse rounded" /><div className="h-10 w-32 bg-muted animate-pulse rounded" /></div></div>); }
  return (<div className="space-y-6"><Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}><TabsList><TabsTrigger value="busca"><Search className="mr-2 h-4 w-4" />Busca Manual</TabsTrigger><TabsTrigger value="historico"><History className="mr-2 h-4 w-4" />Histórico</TabsTrigger></TabsList><TabsContent value="busca" className="space-y-4"><ComunicaCNJSearchForm tribunaisCNJ={tribunaisCNJ} /><ComunicaCNJResultsTable /></TabsContent><TabsContent value="historico"><ComunicacaoExecutionsList /></TabsContent></Tabs></div>);
}

