'use client';

import * as React from 'react';
import { FileText, Plus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContratoDocumentosList } from '@/features/pecas-juridicas';

interface ContratoDocumentosCardProps {
  contratoId: number;
  onGerarPeca?: () => void;
}

export function ContratoDocumentosCard({
  contratoId,
  onGerarPeca,
}: ContratoDocumentosCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <FileText className="size-4" />
          Documentos e Peças Jurídicas
        </CardTitle>
        {onGerarPeca && (
          <CardAction>
            <Button variant="outline" size="sm" onClick={onGerarPeca}>
              <Plus className="size-4 mr-1" />
              Gerar Peça
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <ContratoDocumentosList contratoId={contratoId} />
      </CardContent>
    </Card>
  );
}
