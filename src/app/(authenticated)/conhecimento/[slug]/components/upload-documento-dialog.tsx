'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { criarDocumento } from '../../actions/criar-documento.action';

const TAMANHO_MAX_MB = 50;
const ACCEPT = '.txt,.md,.html,.pdf,.docx';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseSlug: string;
}

export function UploadDocumentoDialog({ open, onOpenChange, baseSlug }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [nome, setNome] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > TAMANHO_MAX_MB * 1024 * 1024) {
      toast.error(`Arquivo excede ${TAMANHO_MAX_MB} MB`);
      return;
    }
    setFile(f);
    if (f && !nome) setNome(f.name.replace(/\.[^.]+$/, ''));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append('base_slug', baseSlug);
        fd.append('nome', nome || file.name);
        fd.append('arquivo', file, file.name);
        await criarDocumento(fd);
        toast.success('Documento enviado, indexação em andamento');
        onOpenChange(false);
        setFile(null);
        setNome('');
        if (inputRef.current) inputRef.current.value = '';
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro no upload');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="arquivo">Arquivo</Label>
              <div className="mt-1">
                <Input
                  id="arquivo"
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  onChange={handleFileChange}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos: TXT, MD, HTML, PDF, DOCX. Máx {TAMANHO_MAX_MB} MB.
                </p>
              </div>
            </div>
            {file && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                <FileText className="size-4" />
                <span className="font-medium">{file.name}</span>
                <span className="text-muted-foreground ml-auto">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            )}
            <div>
              <Label htmlFor="nome">Nome de exibição</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como aparece na lista"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending || !file}>
              {pending ? 'Enviando...' : (<><Upload className="size-3.5" /> Enviar</>)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
