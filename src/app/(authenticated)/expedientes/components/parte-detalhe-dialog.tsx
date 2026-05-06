'use client';

/**
 * Dialog para exibir detalhes de uma parte (cliente ou parte contrária)
 * Usado na página de expedientes quando o usuário clica em um badge de parte
 */

import {
  cn } from '@/lib/utils';
import * as React from 'react';
import Link from 'next/link';
import { AppBadge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink,
  User,
  Building2,
  Mail,
  Phone,
  AlertCircle } from 'lucide-react';
import {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarTipoPessoa,
  } from '@/app/(authenticated)/partes';
import { actionBuscarPartesPorProcessoEPolo } from '@/app/(authenticated)/partes/server-actions';
import type { ParteComDadosCompletos } from '@/app/(authenticated)/partes';
import { Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/typography';

interface ParteDetalheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processoId: number | null;
  polo: 'ATIVO' | 'PASSIVO';
  nomeExibido: string; // nome mostrado no badge (fallback)
}

export function ParteDetalheDialog({
  open,
  onOpenChange,
  processoId,
  polo,
  nomeExibido,
}: ParteDetalheDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [parte, setParte] = React.useState<ParteComDadosCompletos | null>(null);
  const [outrasPartes, setOutrasPartes] = React.useState<ParteComDadosCompletos[]>([]);

  // Fetch parte quando dialog abre
  React.useEffect(() => {
    if (!open || !processoId) {
      setParte(null);
      setOutrasPartes([]);
      setError(null);
      return;
    }

    const fetchParte = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await actionBuscarPartesPorProcessoEPolo(processoId, polo);
        if (!result.success) {
          throw new Error(result.error || 'Erro ao buscar dados da parte');
        }

        setParte(result.data.principal);
        // Outras partes além da principal
        setOutrasPartes(
          result.data.partes.filter(p => p.id !== result.data.principal?.id)
        );
      } catch (err) {
        console.error('Erro ao buscar parte:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchParte();
  }, [open, processoId, polo]);

  // Determina o título e cor do badge baseado no polo
  const poloLabel = polo === 'ATIVO' ? 'Parte Autora' : 'Parte Ré';
  const poloColorClass =
    polo === 'ATIVO'
      ? 'bg-info/10 text-info border-info/15'
      : 'bg-destructive/10 text-destructive border-destructive/15';

  // Gera URL para página de detalhes completos
  const getDetalheUrl = (p: ParteComDadosCompletos) => {
    if (p.tipo_entidade === 'cliente') {
      return `/partes/clientes/${p.entidade_id}`;
    } else if (p.tipo_entidade === 'parte_contraria') {
      return `/partes/partes-contrarias/${p.entidade_id}`;
    } else {
      return `/partes/terceiros/${p.entidade_id}`;
    }
  };

  // Componente para exibir um campo
  const Campo = ({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) => {
    if (!value || value === '-') return null;
    return (
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-start gap-2")}>
        {icon && <span className="text-muted-foreground mt-0.5">{icon}</span>}
        <div>
          <Text variant="caption">{label}</Text>
          <div className={cn("text-body-sm")}>{value}</div>
        </div>
      </div>
    );
  };

  // Componente para renderizar informações de uma parte
  const ParteInfo = ({ p, isPrincipal = false }: { p: ParteComDadosCompletos; isPrincipal?: boolean }) => {
    const tipoPessoaIcon = p.tipo_pessoa === 'pf' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />;
    const documento = p.tipo_pessoa === 'pf' ? formatarCpf(p.cpf) : formatarCnpj(p.cnpj);
    const telefone = formatarTelefone(p.ddd_celular, p.numero_celular) !== '-'
      ? formatarTelefone(p.ddd_celular, p.numero_celular)
      : formatarTelefone(p.ddd_telefone, p.numero_telefone);

    return (
      <div className={`space-y-3 ${!isPrincipal ? /* design-system-escape: pt-3 padding direcional sem Inset equiv. */ 'pt-3 border-t' : ''}`}>
        {/* Header com nome e tipo */}
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
          {tipoPessoaIcon}
          <div className="flex-1 min-w-0">
            <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium truncate")}>{p.nome}</div>
            <Text variant="caption">
              {formatarTipoPessoa(p.tipo_pessoa)}
              {p.tipo_entidade === 'cliente' && (
                <AppBadge variant="success" className={cn(/* design-system-escape: px-1 padding direcional sem Inset equiv.; py-0 padding direcional sem Inset equiv. */ "ml-2 text-[10px] px-1 py-0")}>
                  Cliente
                </AppBadge>
              )}
            </Text>
          </div>
        </div>

        {/* Documento */}
        {documento !== '-' && (
          <Campo
            label={p.tipo_pessoa === 'pf' ? 'CPF' : 'CNPJ'}
            value={documento}
          />
        )}

        {/* Contato */}
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "grid grid-cols-1 gap-2")}>
          {p.emails && p.emails.length > 0 && (
            <Campo
              label={p.emails.length > 1 ? 'E-mails' : 'E-mail'}
              value={p.emails.join(', ')}
              icon={<Mail className="h-3.5 w-3.5" />}
            />
          )}
          {telefone !== '-' && (
            <Campo
              label="Telefone"
              value={telefone}
              icon={<Phone className="h-3.5 w-3.5" />}
            />
          )}
        </div>

        {/* Link para detalhes completos */}
        <Link href={getDetalheUrl(p)} className="block">
          <Button variant="outline" size="sm" className="w-full mt-2">
            Ver detalhes completos
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    );
  };

  const footerButton = (
    <Button variant="outline" onClick={() => onOpenChange(false)}>
      Fechar
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-density="comfortable"
        className="sm:max-w-sm  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle asChild>
            <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
              <AppBadge variant="outline" className={poloColorClass}>
                {poloLabel}
              </AppBadge>
              <span className="truncate">{parte?.nome || nomeExibido}</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
          <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default">; py-2 padding direcional sem Inset equiv. */ "space-y-4 py-2")}>
            {/* Loading state */}
            {isLoading && (
              <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1 flex-1")}>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full" />
              </div>
            )}

            {/* Error state */}
            {!isLoading && error && (
              <div className={cn(/* design-system-escape: py-6 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-6 text-center")}>
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className={cn("text-body-sm text-muted-foreground")}>{error}</p>
              </div>
            )}

            {/* Parte não encontrada */}
            {!isLoading && !error && !parte && (
              <div className={cn(/* design-system-escape: py-6 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-6 text-center")}>
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className={cn("text-body-sm text-muted-foreground")}>
                  Parte não encontrada no cadastro
                </p>
                <Text variant="caption" className="mt-1">
                  Nome exibido: {nomeExibido}
                </Text>
              </div>
            )}

            {/* Parte encontrada */}
            {!isLoading && !error && parte && (
              <>
                <ParteInfo p={parte} isPrincipal />

                {/* Outras partes do mesmo polo */}
                {outrasPartes.length > 0 && (
                  <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "pt-3 border-t")}>
                    <Text variant="caption" className="mb-2">
                      Outras partes ({outrasPartes.length})
                    </Text>
                    {outrasPartes.map((p) => (
                      <ParteInfo key={p.id} p={p} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-end gap-2">
          {footerButton}
        </div>
      </DialogContent>
    </Dialog>
  );
}
