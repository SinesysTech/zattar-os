"use client";

import { cn } from '@/lib/utils';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heading, Text } from '@/components/ui/typography';
import { Download, AlertCircle } from "lucide-react";

interface RecordingPlayerProps {
  recordingUrl: string;
  chamadaId: number;
  titulo?: string;
}

export function RecordingPlayer({ recordingUrl, chamadaId, titulo }: RecordingPlayerProps) {
  const [error, setError] = useState<string | null>(null);

  const handleDownload = () => {
    window.open(recordingUrl, '_blank');
  };

  return (
    <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
      <div className="flex items-center justify-between">
        <Heading level="card">
          {titulo || `Gravação da Chamada #${chamadaId}`}
        </Heading>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "gap-2")}
        >
          <Download className="h-4 w-4" />
          Baixar
        </Button>
      </div>

      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          controls
          className="w-full h-full"
          onError={() => setError("Erro ao carregar gravação")}
        >
          <source src={recordingUrl} type="video/mp4" />
          Seu navegador não suporta reprodução de vídeo.
        </video>
      </div>

      {error && (
        <div className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; gap-2 → migrar para <Inline gap="tight"> */ "text-sm text-destructive flex items-center gap-2")}>
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Text variant="caption">
        Esta gravação ficará disponível por 7 dias a partir da data da chamada.
      </Text>
    </div>
  );
}
