'use client';

import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

interface EventSignatureInfoProps {
  signatario?: string;
  isSigiloso?: boolean;
}

/**
 * Exibe informações de assinatura digital e/ou sigilo do documento.
 * Retorna null quando nenhuma das condições se aplica.
 *
 * @example
 * <EventSignatureInfo signatario="João da Silva" isSigiloso={false} />
 */
export function EventSignatureInfo({
  signatario,
  isSigiloso,
}: EventSignatureInfoProps) {
  // Não renderiza se não houver informação relevante
  if (!signatario && !isSigiloso) {
    return null;
  }

  return (
    <div className={cn(/* design-system-escape: px-6 padding direcional sem Inset equiv.; py-5 padding direcional sem Inset equiv. */ "px-6 py-5 border-b bg-muted/30")}>
      <div className={cn("flex flex-col inline-medium")}>
        {/* Assinatura digital */}
        {signatario && (
          <div className={cn("flex items-center inline-medium")}>
            {/* Ícone com círculo verde */}
            <div
              className={cn(
                'size-8 rounded-full flex items-center justify-center shrink-0',
                'bg-success/10 text-success border border-success/15',
                ''
              )}
            >
              <CheckCircle2 className="size-4" />
            </div>

            {/* Texto da assinatura */}
            <div>
              <Text variant="label" weight="medium" as="p" className={cn(/* /* design-system-escape: leading-tight sem token DS */ "leading-tight" )}>
                Assinado digitalmente por
              </Text>
              <p className={cn(/* design-system-escape: leading-tight sem token DS */ "text-[13px] text-muted-foreground font-normal leading-tight mt-0.5")}>
                {signatario}
              </p>
            </div>
          </div>
        )}

        {/* Aviso de sigilo */}
        {isSigiloso && (
          <div className={cn("flex items-center inline-medium")}>
            {/* Ícone com círculo âmbar */}
            <div
              className={cn(
                'size-8 rounded-full flex items-center justify-center shrink-0',
                'bg-warning/10 text-warning border border-warning/15',
                ''
              )}
            >
              <ShieldAlert className="size-4" />
            </div>

            {/* Texto do sigilo */}
            <div>
              <Text variant="label" weight="medium" as="p" className={cn(/* /* design-system-escape: leading-tight sem token DS */ "leading-tight" )}>
                Documento sigiloso — acesso restrito
              </Text>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
