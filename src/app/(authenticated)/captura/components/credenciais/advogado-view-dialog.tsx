'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import type { Credencial } from '@/app/(authenticated)/captura/types';
import { formatOabs } from '@/app/(authenticated)/advogados';
import { Text } from '@/components/ui/typography';

type Props = {
  credencial: Credencial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdvogadoViewDialog({ credencial, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes do advogado</DialogTitle>
          <DialogDescription>Informações derivadas da credencial.</DialogDescription>
        </DialogHeader>

        {!credencial ? (
          <div className={cn("text-body-sm text-muted-foreground")}>Nenhum advogado selecionado.</div>
        ) : (
          <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
            <div>
              <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium")}>{credencial.advogado_nome}</p>
              <Text variant="caption">
                CPF {credencial.advogado_cpf} • OAB {formatOabs(credencial.advogado_oabs)}
              </Text>
            </div>

            <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-wrap gap-2")}>
              <Badge variant="outline">{credencial.tribunal}</Badge>
              <Badge variant="outline">{credencial.grau}</Badge>
              {credencial.active ? <Badge variant="success">Ativa</Badge> : <Badge variant="neutral">Inativa</Badge>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


