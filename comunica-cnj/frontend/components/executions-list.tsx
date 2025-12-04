'use client';
import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ComunicacaoExecutionStatus, EXECUTION_STATUS_LABELS } from '@/lib/types/comunica-cnj';
import { listComunicacaoExecutionsAction } from '@/app/actions/comunica-cnj';
import type { ComunicacaoExecutionWithRelations } from '@/lib/types/comunica-cnj';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Loader2 } from 'lucide-react';
interface ComunicacaoExecutionsListProps { scheduleId?: string; }
export function ComunicacaoExecutionsList({ scheduleId }: ComunicacaoExecutionsListProps) {
  const [executions, setExecutions] = useState<ComunicacaoExecutionWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<ComunicacaoExecutionStatus[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<ComunicacaoExecutionWithRelations | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const loadExecutions = async () => { setIsLoading(true); try { const result = await listComunicacaoExecutionsAction({ scheduleId, status: selectedStatus.length > 0 ? selectedStatus : undefined, page, pageSize, }); if (result.success && result.data) { setExecutions(result.data.executions); setTotal(result.data.total); setTotalPages(result.data.totalPages); } } catch (error) { console.error('Erro ao carregar execuções:', error); } finally { setIsLoading(false); } };
  useEffect(() => { loadExecutions(); }, [page, pageSize, selectedStatus, scheduleId]);
  const handleViewDetails = (execution: ComunicacaoExecutionWithRelations) => { setSelectedExecution(execution); setIsDetailModalOpen(true); };
  const formatDuration = (startedAt: Date | null, completedAt: Date | null) => { if (!startedAt || !completedAt) return '-'; const seconds = Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000); if (seconds < 60) return `${seconds}s`; const minutes = Math.floor(seconds / 60); const remainingSeconds = seconds % 60; return `${minutes}m ${remainingSeconds}s`; };
  if (isLoading && executions.length === 0) { return (<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><span className="ml-3 text-muted-foreground">Carregando execuções...</span></div>); }
  if (executions.length === 0 && !isLoading) { return (<div className="p-8 text-center border rounded-lg"><p className="text-muted-foreground">Nenhuma execução encontrada</p></div>); }
  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1"><Label htmlFor="status-filter">Status</Label><Select value={selectedStatus.length > 0 ? selectedStatus.join(',') : 'all'} onValueChange={(value) => { if (value === 'all') { setSelectedStatus([]); } else { setSelectedStatus([value as ComunicacaoExecutionStatus]); } }}><SelectTrigger id="status-filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value={ComunicacaoExecutionStatus.PENDING}>Pendente</SelectItem><SelectItem value={ComunicacaoExecutionStatus.RUNNING}>Em Execução</SelectItem><SelectItem value={ComunicacaoExecutionStatus.COMPLETED}>Concluído</SelectItem><SelectItem value={ComunicacaoExecutionStatus.FAILED}>Falhou</SelectItem></SelectContent></Select></div>
          <div><Label htmlFor="page-size">Itens por página</Label><Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}><SelectTrigger id="page-size" className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem></SelectContent></Select></div>
        </div>
        <div className="border rounded-lg"><Table><TableHeader><TableRow><TableHead>Data/Hora</TableHead><TableHead>Agendamento</TableHead><TableHead>Status</TableHead><TableHead>Comunicações</TableHead><TableHead>Duração</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>{executions.map((execution) => (<TableRow key={execution.id}><TableCell>{format(new Date(execution.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell><TableCell>{execution.schedule.name}</TableCell><TableCell><Badge variant={execution.status === ComunicacaoExecutionStatus.COMPLETED ? 'default' : execution.status === ComunicacaoExecutionStatus.FAILED ? 'destructive' : 'secondary'}>{EXECUTION_STATUS_LABELS[execution.status as ComunicacaoExecutionStatus]}</Badge></TableCell><TableCell>{execution.comunicacoesCount}</TableCell><TableCell>{formatDuration(execution.startedAt, execution.completedAt)}</TableCell><TableCell><Button variant="link" size="sm" onClick={() => handleViewDetails(execution)}><Eye className="mr-2 h-4 w-4" />Ver detalhes</Button></TableCell></TableRow>))}</TableBody></Table></div>
        {totalPages > 1 && (<div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">Página {page} de {totalPages} - Total: {total} execuções</div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isLoading}>Anterior</Button><Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || isLoading}>Próxima</Button></div></div>)}
      </div>
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}><DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>Detalhes da Execução</DialogTitle><DialogDescription>Informações detalhadas sobre a execução do agendamento</DialogDescription></DialogHeader>{selectedExecution && (<div className="space-y-4"><div><Label className="text-sm font-medium text-muted-foreground">Agendamento</Label><p className="font-medium">{selectedExecution.schedule.name}</p></div><div className="grid grid-cols-2 gap-4"><div><Label className="text-sm font-medium text-muted-foreground">Status</Label><Badge variant={selectedExecution.status === ComunicacaoExecutionStatus.COMPLETED ? 'default' : selectedExecution.status === ComunicacaoExecutionStatus.FAILED ? 'destructive' : 'secondary'}>{EXECUTION_STATUS_LABELS[selectedExecution.status as ComunicacaoExecutionStatus]}</Badge></div><div><Label className="text-sm font-medium text-muted-foreground">Comunicações Encontradas</Label><p className="font-medium">{selectedExecution.comunicacoesCount}</p></div></div><div className="grid grid-cols-2 gap-4"><div><Label className="text-sm font-medium text-muted-foreground">Iniciado em</Label><p>{selectedExecution.startedAt ? format(new Date(selectedExecution.startedAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) : '-'}</p></div><div><Label className="text-sm font-medium text-muted-foreground">Concluído em</Label><p>{selectedExecution.completedAt ? format(new Date(selectedExecution.completedAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) : '-'}</p></div></div>{selectedExecution.errorMessage && (<div><Label className="text-sm font-medium text-muted-foreground">Erro</Label><p className="text-destructive text-sm">{selectedExecution.errorMessage}</p></div>)}<div><Label className="text-sm font-medium text-muted-foreground">Duração</Label><p>{formatDuration(selectedExecution.startedAt, selectedExecution.completedAt)}</p></div></div>)}</DialogContent></Dialog>
    </>
  );
}

