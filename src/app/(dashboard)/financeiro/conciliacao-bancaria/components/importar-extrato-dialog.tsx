'use client';

import { useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useContasBancarias } from '@/core/app/_lib/hooks/use-contas-bancarias';
import { importarExtrato } from '@/core/app/_lib/hooks/use-conciliacao-bancaria';
import type { ImportarExtratoDTO } from '@/backend/types/financeiro/conciliacao-bancaria.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MAX_SIZE = 10 * 1024 * 1024;

export function ImportarExtratoDialog({ open, onOpenChange, onSuccess }: Props) {
  const { contasBancarias } = useContasBancarias();
  const [contaId, setContaId] = useState<number | null>(null);
  const [tipoArquivo, setTipoArquivo] = useState<'ofx' | 'csv' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    const chosen = acceptedFiles[0];
    if (chosen.size > MAX_SIZE) {
      toast.error('Arquivo maior que 10MB');
      return;
    }
    setFile(chosen);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.csv'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/xml': ['.ofx'],
      'text/xml': ['.ofx'],
    },
    multiple: false,
    maxSize: MAX_SIZE,
  });

  const contaOptions = useMemo(() => contasBancarias || [], [contasBancarias]);

  const handleSubmit = async () => {
    if (!contaId || !tipoArquivo || !file) {
      toast.error('Preencha todos os campos e selecione um arquivo');
      return;
    }
    try {
      setIsUploading(true);
      setProgress(10);
      const dto: ImportarExtratoDTO = {
        contaBancariaId: contaId,
        tipoArquivo,
        arquivo: file,
        nomeArquivo: file.name,
      };
      setProgress(30);
      await importarExtrato(dto);
      setProgress(100);
      toast.success('Extrato importado com sucesso');
      onOpenChange(false);
      setFile(null);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao importar extrato');
    } finally {
      setTimeout(() => setIsUploading(false), 300);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Extrato</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="conta">Conta banc\u00e1ria</Label>
            <Select onValueChange={(val) => setContaId(Number(val))} value={contaId?.toString()}>
              <SelectTrigger id="conta">
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {contaOptions.map((conta) => (
                  <SelectItem key={conta.id} value={conta.id.toString()}>
                    {conta.nome} {conta.banco ? `- ${conta.banco}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de arquivo</Label>
            <Select onValueChange={(val) => setTipoArquivo(val as 'ofx' | 'csv')} value={tipoArquivo || undefined}>
              <SelectTrigger>
                <SelectValue placeholder="OFX ou CSV" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ofx">OFX</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            {...getRootProps()}
            className={`border border-dashed rounded-md p-4 text-center cursor-pointer ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
              }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-between gap-3">
                <div className="text-left">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}>
                  Remover
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Arraste e solte o arquivo aqui ou clique para selecionar (OFX, CSV, TXT)
              </p>
            )}
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Label>Carregando...</Label>
              <Progress value={progress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading}>
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
