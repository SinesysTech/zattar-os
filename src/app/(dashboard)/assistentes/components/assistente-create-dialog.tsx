'use client';

// Componente Dialog para criação de novo assistente

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AssistenteCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AssistenteCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: AssistenteCreateDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Estados do formulário
  const [nome, setNome] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [iframeCode, setIframeCode] = React.useState('');
  
  // Erros de validação
  const [errors, setErrors] = React.useState<{
    nome?: string;
    descricao?: string;
    iframe_code?: string;
  }>({});

  // Resetar formulário quando o dialog fechar
  React.useEffect(() => {
    if (!open) {
      setNome('');
      setDescricao('');
      setIframeCode('');
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (nome.length > 200) {
      newErrors.nome = 'Nome deve ter no máximo 200 caracteres';
    }

    if (descricao.length > 1000) {
      newErrors.descricao = 'Descrição deve ter no máximo 1000 caracteres';
    }

    if (!iframeCode.trim()) {
      newErrors.iframe_code = 'Código do iframe é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/assistentes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          iframe_code: iframeCode.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erro desconhecido',
        }));
        throw new Error(
          errorData.error || `Erro ${response.status}: ${response.statusText}`
        );
      }

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error('Resposta da API indicou falha');
      }

      toast.success('Assistente criado com sucesso.');

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao criar assistente';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo Assistente</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo assistente de IA no sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                placeholder="Digite o nome do assistente"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={isLoading}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Digite uma descrição opcional para o assistente"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={isLoading}
              />
              {errors.descricao && (
                <p className="text-sm text-destructive">{errors.descricao}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="iframe_code">
                Código do Iframe <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="iframe_code"
                placeholder={`Exemplo: <iframe src="https://example.com/assistant" width="100%" height="400" frameborder="0"></iframe>`}
                value={iframeCode}
                onChange={(e) => setIframeCode(e.target.value)}
                disabled={isLoading}
                rows={4}
              />
              {errors.iframe_code && (
                <p className="text-sm text-destructive">{errors.iframe_code}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Assistente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
