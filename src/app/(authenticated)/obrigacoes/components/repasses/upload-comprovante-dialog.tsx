
'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useUser } from '@/providers/user-provider';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { actionRegistrarRepasse } from '../../actions/repasses';
import { formatCurrency } from '../../utils';

interface UploadComprovanteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcelaId: number;
  valorRepasse: number;
  onSuccess?: () => void;
}

export function UploadComprovanteDialog({ open, onOpenChange, parcelaId, valorRepasse, onSuccess }: UploadComprovanteDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { id: userId } = useUser();

  const handleUpload = async () => {
    if (!file) return;
    if (!userId) {
      toast.error('Não foi possível identificar o usuário atual. Tente recarregar a página.');
      return;
    }
    try {
      setIsUploading(true);
      // Simulating upload
      const fakeUrl = `https://storage.example.com/comprovantes/${parcelaId}/${file.name}`;

      const response = await actionRegistrarRepasse(parcelaId, {
          dataRepasse: new Date().toISOString(),
          arquivoComprovantePath: fakeUrl,
          usuarioRepasseId: userId
      });
      
      if (response.success) {
          toast.success('Repasse registrado com sucesso.');
          onOpenChange(false);
          if (onSuccess) onSuccess();
      } else {
          toast.error(response.error);
      }
    } catch {
      toast.error('Erro no upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
           <DialogHeader><DialogTitle>Registrar Repasse</DialogTitle></DialogHeader>
           <div className={cn(/* design-system-escape: py-4 padding direcional sem Inset equiv. */ "stack-default py-4")}>
               <div>Valor: <b>{formatCurrency(valorRepasse)}</b></div>
               <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} disabled={isUploading} />
           </div>
           <DialogFooter>
               <Button onClick={handleUpload} disabled={!file || isUploading || !userId}>
                 {isUploading ? 'Enviando...' : 'Confirmar'}
               </Button>
           </DialogFooter>
       </DialogContent>
    </Dialog>
  );
}
