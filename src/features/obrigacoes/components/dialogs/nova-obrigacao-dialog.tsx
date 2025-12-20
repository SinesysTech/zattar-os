
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Combobox } from '@/components/ui/combobox';
import { Scale } from 'lucide-react';
import { useAcervo, type GrauAcervo } from '@/features/acervo';
import { AcordoForm } from './acordo-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface NovaObrigacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  dadosIniciais?: {
    processo_id: number;
    trt: string;
    grau: string;
    numero_processo: string;
  };
}

export function NovaObrigacaoDialog({ open, onOpenChange, onSuccess, dadosIniciais }: NovaObrigacaoDialogProps) {
  const [trt, setTrt] = React.useState('');
  const [grau, setGrau] = React.useState('');
  const [processoId, setProcessoId] = React.useState<string[]>([]);
  const [buscaProcesso, setBuscaProcesso] = React.useState('');
  const [debouncedBusca, setDebouncedBusca] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedBusca(buscaProcesso), 400);
    return () => clearTimeout(timer);
  }, [buscaProcesso]);

  const shouldFetch = open && !dadosIniciais && !!trt && !!grau && debouncedBusca.length >= 3;
  
  const { data, loading } = useAcervo({
    trt: trt || undefined,
    grau: (grau as GrauAcervo) || undefined,
    busca: debouncedBusca,
    limite: 50
  });

  const processos = data?.processos || [];
  const isLoading = loading;

  const handleClose = () => {
    onOpenChange(false);
    setTrt('');
    setGrau('');
    setProcessoId([]);
  };

  const selectedProcessoId = dadosIniciais?.processo_id || (processoId.length > 0 ? Number(processoId[0]) : undefined);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <Scale className="h-5 w-5" /> Nova Obrigação
          </DialogTitle>
          <DialogDescription>
             Adicionar acordo, condenação ou custas ao processo
          </DialogDescription>
        </DialogHeader>

        {!selectedProcessoId && (
            <div className="space-y-4 mb-4 border-b pb-4">
               <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                       <Label>Tribunal</Label>
                       <Select value={trt} onValueChange={setTrt}>
                           <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                           <SelectContent>
                               {Array.from({length: 24}).map((_, i) => (
                                   <SelectItem key={`TRT${i+1}`} value={`TRT${i+1}`}>TRT{i+1}</SelectItem>
                               ))}
                           </SelectContent>
                       </Select>
                   </div>
                   <div className="space-y-2">
                       <Label>Grau</Label>
                       <Select value={grau} onValueChange={setGrau}>
                           <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                           <SelectContent>
                               <SelectItem value="primeiro_grau">1º Grau</SelectItem>
                               <SelectItem value="segundo_grau">2º Grau</SelectItem>
                           </SelectContent>
                       </Select>
                   </div>
               </div>
               <div className="space-y-2">
                  <Label>Buscar Processo</Label>
                  <Input 
                    placeholder="Mínimo 3 caracteres..." 
                    value={buscaProcesso} 
                    onChange={e => setBuscaProcesso(e.target.value)} 
                    disabled={!trt || !grau}
                  />
                  {isLoading && <span className="text-xs text-muted-foreground">Buscando...</span>}
                  {shouldFetch && !isLoading && (
                      <Combobox 
                        options={processos.map(p => ({
                            value: p.id.toString(),
                            label: `${p.numero_processo} - ${p.nome_parte_autora} vs ${p.nome_parte_re}`
                        }))}
                        value={processoId}
                        onValueChange={setProcessoId}
                        placeholder="Selecione o processo..."
                      />
                  )}
               </div>
            </div>
        )}

        {selectedProcessoId ? (
            <AcordoForm 
               processoId={selectedProcessoId}
               onSuccess={() => { onSuccess(); handleClose(); }}
               onCancel={handleClose}
            />
        ) : (
            <div className="text-center py-8 text-muted-foreground">
                Selecione um processo para continuar
            </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
