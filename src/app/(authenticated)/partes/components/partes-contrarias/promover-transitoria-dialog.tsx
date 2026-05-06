'use client';

/**
 * Dialog de promoção de parte contrária transitória.
 *
 * Abre com o id da transitória e permite:
 * - Vincular a uma parte_contraria existente (merge) via sugestões fuzzy
 * - Criar uma nova parte_contraria com dados completos
 *
 * Em ambos os casos, a RPC transacional no backend atualiza contrato_partes
 * (re-apontando as linhas que referenciavam a transitória) e marca a
 * transitória como promovida.
 */

import * as React from 'react';
import {
  Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Heading, Text } from '@/components/ui/typography';
import { Building2, User, CheckCircle2, Link2, UserPlus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { cn } from '@/lib/utils';
import {
  actionBuscarTransitoriaPorId,
  actionBuscarSugestoesMerge,
  actionPromoverTransitoria,
  actionAtualizarTransitoria,
  type ParteContrariaTransitoria,
  type SugestaoMerge,
  type PromoverResult,
} from '@/shared/partes-contrarias-transitorias';

type Mode = 'criar' | 'merge';

interface PromoverTransitoriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transitoriaId: number | null;
  onSuccess: (result?: PromoverResult) => void;
}

export function PromoverTransitoriaDialog({
  open,
  onOpenChange,
  transitoriaId,
  onSuccess,
}: PromoverTransitoriaDialogProps) {
  const [transitoria, setTransitoria] = React.useState<ParteContrariaTransitoria | null>(null);
  const [sugestoes, setSugestoes] = React.useState<SugestaoMerge[]>([]);
  const [mode, setMode] = React.useState<Mode>('criar');
  const [sugestaoSelecionada, setSugestaoSelecionada] = React.useState<SugestaoMerge | null>(null);

  // Form state
  const [nome, setNome] = React.useState('');
  const [tipoPessoa, setTipoPessoa] = React.useState<'pf' | 'pj'>('pf');
  const [cpfCnpj, setCpfCnpj] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [telefone, setTelefone] = React.useState('');

  const [isLoading, setIsLoading] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const resetState = React.useCallback(() => {
    setTransitoria(null);
    setSugestoes([]);
    setMode('criar');
    setSugestaoSelecionada(null);
    setNome('');
    setTipoPessoa('pf');
    setCpfCnpj('');
    setEmail('');
    setTelefone('');
  }, []);

  React.useEffect(() => {
    if (!open || !transitoriaId) {
      resetState();
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      actionBuscarTransitoriaPorId({ id: transitoriaId }),
      actionBuscarTransitoriaPorId({ id: transitoriaId }).then(async (resp) => {
        if (!resp.success || !resp.data) return { success: true as const, data: [] };
        return actionBuscarSugestoesMerge({
          nome: resp.data.nome,
          excludeTransitoriaId: transitoriaId,
          limit: 5,
        });
      }),
    ]).then(([transResp, sugResp]) => {
      if (cancelled) return;

      if (transResp.success && transResp.data) {
        setTransitoria(transResp.data);
        setNome(transResp.data.nome);
        if (transResp.data.tipo_pessoa) setTipoPessoa(transResp.data.tipo_pessoa);
        if (transResp.data.cpf_ou_cnpj) setCpfCnpj(transResp.data.cpf_ou_cnpj);
        if (transResp.data.email) setEmail(transResp.data.email);
        if (transResp.data.telefone) setTelefone(transResp.data.telefone);
      }

      if (sugResp.success && sugResp.data) {
        setSugestoes(sugResp.data);
      }

      setIsLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setIsLoading(false);
        toast.error('Erro ao carregar dados da transitória');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, transitoriaId, resetState]);

  const handleSelectSugestao = (sug: SugestaoMerge) => {
    if (sug.kind !== 'parte_contraria') return; // merge só em parte_contraria definitiva
    setMode('merge');
    setSugestaoSelecionada(sug);
  };

  const handleSwitchToCriar = () => {
    setMode('criar');
    setSugestaoSelecionada(null);
  };

  const handleSaveOnly = async () => {
    if (!transitoriaId) return;
    if (nome.trim().length < 2) {
      toast.error('Nome deve ter ao menos 2 caracteres');
      return;
    }

    setIsSaving(true);
    try {
      const cpfCnpjLimpo = cpfCnpj.replace(/\D/g, '');
      const telefoneLimpo = telefone.replace(/\D/g, '');

      const result = await actionAtualizarTransitoria({
        id: transitoriaId,
        input: {
          nome: nome.trim(),
          tipo_pessoa: tipoPessoa,
          cpf_ou_cnpj: cpfCnpjLimpo || null,
          email: email.trim() || null,
          telefone: telefoneLimpo || null,
        },
      });

      if (result.success && result.data) {
        toast.success('Cadastro atualizado. Permanece pendente para completar depois.');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.message || 'Erro ao salvar alterações');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!transitoriaId) return;

    setIsPending(true);
    try {
      const input =
        mode === 'merge' && sugestaoSelecionada
          ? { parte_contraria_id_alvo: sugestaoSelecionada.id, dados_novos: null }
          : {
              parte_contraria_id_alvo: null,
              dados_novos: {
                nome: nome.trim(),
                tipo_pessoa: tipoPessoa,
                cpf: tipoPessoa === 'pf' ? cpfCnpj.replace(/\D/g, '') || null : null,
                cnpj: tipoPessoa === 'pj' ? cpfCnpj.replace(/\D/g, '') || null : null,
                email: email.trim() || null,
                telefone: telefone.replace(/\D/g, '') || null,
              },
            };

      const result = await actionPromoverTransitoria({ transitoriaId, input });

      if (result.success && result.data) {
        toast.success(
          mode === 'merge'
            ? `Vinculada com sucesso. ${result.data.contratos_atualizados} contrato(s) atualizado(s).`
            : `Parte contrária criada e promovida. ${result.data.contratos_atualizados} contrato(s) atualizado(s).`
        );
        onSuccess(result.data);
        onOpenChange(false);
      } else {
        toast.error(result.message || 'Erro ao promover parte contrária');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao promover');
    } finally {
      setIsPending(false);
    }
  };

  const isBusy = isPending || isSaving;
  const canSubmit =
    !isBusy &&
    (mode === 'merge'
      ? sugestaoSelecionada !== null
      : nome.trim().length >= 2);
  const canSaveOnly = !isBusy && mode === 'criar' && nome.trim().length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-density="comfortable"
        className="sm:max-w-lg  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>Completar cadastro da parte contrária</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
      {isLoading ? (
        <div className={cn(/* design-system-escape: py-10 padding direcional sem Inset equiv. */ "flex items-center justify-center py-10")}>
          <LoadingSpinner />
        </div>
      ) : (
        <div className={cn(/* design-system-escape: space-y-5 sem token DS */ "space-y-5")}>
          {transitoria && (
            <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "rounded-xl bg-surface-container-low/50 p-3 ring-1 ring-outline-variant/30")}>
              <Text variant="caption" className="text-muted-foreground">
                Cadastro pendente
              </Text>
              <Text variant="label" className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "mt-0.5 font-semibold text-foreground")}>
                {transitoria.nome}
              </Text>
              {transitoria.criado_em_contrato_id && (
                <Text variant="micro-caption" className="mt-1 text-muted-foreground">
                  Criado no contrato #{transitoria.criado_em_contrato_id}
                </Text>
              )}
            </div>
          )}

          {sugestoes.length > 0 && (
            <div className={cn("stack-tight")}>
              <Heading level="card">Partes similares encontradas</Heading>
              <Text variant="caption" className="text-muted-foreground">
                Selecione uma abaixo para vincular em vez de criar duplicata.
              </Text>
              <ul className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")} role="listbox">
                {sugestoes.map((sug) => {
                  const isSelected =
                    mode === 'merge' &&
                    sugestaoSelecionada?.kind === sug.kind &&
                    sugestaoSelecionada.id === sug.id;
                  const isOficial = sug.kind === 'parte_contraria';
                  return (
                    <li key={`${sug.kind}:${sug.id}`}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectSugestao(sug)}
                        disabled={!isOficial || isBusy}
                        className={cn(
                          /* design-system-escape: gap-3 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ 'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition-colors',
                          isSelected
                            ? 'bg-primary/10 ring-primary/30'
                            : isOficial
                              ? 'ring-outline-variant/30 hover:bg-primary/5'
                              : 'ring-outline-variant/20 opacity-60 cursor-not-allowed'
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1',
                            isSelected
                              ? 'bg-primary/15 text-primary ring-primary/20'
                              : 'bg-surface-container-low text-muted-foreground ring-outline-variant/30'
                          )}
                        >
                          {sug.cnpj ? (
                            <Building2 className="size-3.5" strokeWidth={2.25} />
                          ) : (
                            <User className="size-3.5" strokeWidth={2.25} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <Text variant="label" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "truncate font-medium text-foreground")}>
                            {sug.nome}
                          </Text>
                          <Text
                            variant="micro-caption"
                            className="mt-0.5 text-muted-foreground"
                          >
                            {isOficial ? 'Parte contrária oficial' : 'Outra transitória pendente'}
                            {sug.cpf && ` · CPF ${sug.cpf}`}
                            {sug.cnpj && ` · CNPJ ${sug.cnpj}`}
                          </Text>
                        </div>
                        {isSelected && (
                          <CheckCircle2
                            aria-hidden="true"
                            className="size-4 shrink-0 text-primary"
                            strokeWidth={2.5}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {mode === 'criar' && (
            <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
              <Heading level="card">
                {sugestoes.length > 0 ? 'Ou criar uma nova parte contrária' : 'Dados da parte contrária'}
              </Heading>

              <div className={cn("stack-tight")}>
                <Label htmlFor="promover-nome">Nome / Razão social</Label>
                <Input
                  id="promover-nome"
                  variant="glass"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={isBusy}
                  required
                />
              </div>

              <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 gap-3")}>
                <div className={cn("stack-tight")}>
                  <Label htmlFor="promover-tipo-pessoa">Tipo</Label>
                  <Select
                    value={tipoPessoa}
                    onValueChange={(v) => setTipoPessoa(v as 'pf' | 'pj')}
                    disabled={isBusy}
                  >
                    <SelectTrigger id="promover-tipo-pessoa">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pf">Pessoa física</SelectItem>
                      <SelectItem value="pj">Pessoa jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className={cn("stack-tight")}>
                  <Label htmlFor="promover-doc">{tipoPessoa === 'pf' ? 'CPF' : 'CNPJ'}</Label>
                  <Input
                    id="promover-doc"
                    variant="glass"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    disabled={isBusy}
                    placeholder={tipoPessoa === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                </div>
              </div>

              <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 gap-3")}>
                <div className={cn("stack-tight")}>
                  <Label htmlFor="promover-email">Email</Label>
                  <Input
                    id="promover-email"
                    type="email"
                    variant="glass"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isBusy}
                  />
                </div>
                <div className={cn("stack-tight")}>
                  <Label htmlFor="promover-telefone">Telefone</Label>
                  <Input
                    id="promover-telefone"
                    variant="glass"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    disabled={isBusy}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className={cn("flex items-center inline-tight")}>
            {mode === 'merge' && (
              <Button variant="ghost" onClick={handleSwitchToCriar} disabled={isBusy}>
                Criar nova em vez disso
              </Button>
            )}
            {mode === 'criar' && (
              <Button
                onClick={handleSaveOnly}
                disabled={!canSaveOnly}
                size="sm"
                variant="outline"
                className="rounded-xl"
              >
                {isSaving ? (
                  <LoadingSpinner className="mr-2 size-3.5" />
                ) : (
                  <Save className="mr-2 size-3.5" strokeWidth={2.25} />
                )}
                Salvar sem promover
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              size="sm"
              className="rounded-xl"
            >
              {isPending ? (
                <LoadingSpinner className="mr-2 size-3.5" />
              ) : mode === 'merge' ? (
                <Link2 className="mr-2 size-3.5" strokeWidth={2.25} />
              ) : (
                <UserPlus className="mr-2 size-3.5" strokeWidth={2.25} />
              )}
              {mode === 'merge' ? 'Vincular e promover' : 'Criar e promover'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
