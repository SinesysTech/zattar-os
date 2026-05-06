'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { Upload, Paperclip } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEntrevista } from '../hooks/use-entrevista';
import { Text } from '@/components/ui/typography';

interface AnexoUploadZoneProps {
  entrevistaId: number;
  contratoId: number;
  modulo: string;
}

const TIPOS_ANEXO = [
  { value: 'audio_relato', label: 'Audio' },
  { value: 'documento', label: 'Documento' },
  { value: 'imagem', label: 'Imagem' },
  { value: 'video', label: 'Video' },
] as const;

export function AnexoUploadZone({ entrevistaId, contratoId, modulo }: AnexoUploadZoneProps) {
  const { uploadArquivoAnexo, isLoading } = useEntrevista();
  const [tipoAnexo, setTipoAnexo] = React.useState<string>('documento');
  const [descricao, setDescricao] = React.useState('');
  const [arquivo, setArquivo] = React.useState<File | null>(null);
  const [mensagem, setMensagem] = React.useState<string | null>(null);

  const handleUpload = async () => {
    if (!arquivo) {
      setMensagem('Selecione um arquivo antes de enviar.');
      return;
    }

    const ok = await uploadArquivoAnexo(
      entrevistaId,
      contratoId,
      modulo,
      arquivo,
      tipoAnexo,
      descricao,
    );

    if (ok) {
      setMensagem('Anexo enviado com sucesso.');
      setDescricao('');
      setArquivo(null);
      return;
    }

    setMensagem('Nao foi possivel enviar o anexo. Verifique tipo/tamanho e tente novamente.');
  };

  return (
    <GlassPanel className={cn("stack-default inset-card-compact")}>
      <div className={cn("flex items-start inline-tight")}>
        <Paperclip className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <h4 className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-body-sm font-semibold")}>Anexos de apoio da etapa</h4>
          <Text variant="caption">
            Envie audios, documentos, imagens ou videos relacionados a esta pergunta.
          </Text>
        </div>
      </div>

      <div className={cn("grid inline-medium sm:grid-cols-2")}>
        <div className={cn("stack-tight")}>
          <Label htmlFor={`tipo-anexo-${modulo}`}>Tipo de anexo</Label>
          <Select value={tipoAnexo} onValueChange={setTipoAnexo}>
            <SelectTrigger id={`tipo-anexo-${modulo}`}>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_ANEXO.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={cn("stack-tight")}>
          <Label htmlFor={`arquivo-anexo-${modulo}`}>Arquivo</Label>
          <Input
            id={`arquivo-anexo-${modulo}`}
            type="file"
            accept="audio/*,image/*,video/*,.pdf,.doc,.docx"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <div className={cn("stack-tight")}>
        <Label htmlFor={`descricao-anexo-${modulo}`}>Descricao (opcional)</Label>
        <Textarea
          id={`descricao-anexo-${modulo}`}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: print do bloqueio da plataforma, audio com relato de assedio, TRCT..."
          rows={3}
        />
      </div>

      <div className={cn("flex items-center justify-between inline-medium")}>
        <Text variant="caption">
          Limite de 25MB por arquivo.
        </Text>
        <Button type="button" onClick={handleUpload} disabled={isLoading}>
          <Upload className="mr-2 h-4 w-4" />
          {isLoading ? 'Enviando...' : 'Enviar anexo'}
        </Button>
      </div>

      {mensagem && <Text variant="caption">{mensagem}</Text>}
    </GlassPanel>
  );
}
