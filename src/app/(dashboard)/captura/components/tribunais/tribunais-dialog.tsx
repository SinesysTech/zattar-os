'use client';

import { useEffect, useState, useCallback } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import type { TribunalConfig } from '@/app/_lib/types/tribunais';
import type { TipoAcessoTribunal } from '@/backend/types/captura/trt-types';

interface TribunaisDialogProps {
  tribunal: TribunalConfig | null; // null = criar novo
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Tribunal {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
}

const TIPOS_ACESSO: { value: TipoAcessoTribunal; label: string; description: string }[] = [
  { value: 'primeiro_grau', label: '1º Grau', description: 'Login específico para primeiro grau (TRTs)' },
  { value: 'segundo_grau', label: '2º Grau', description: 'Login específico para segundo grau (TRTs)' },
  { value: 'unificado', label: 'Unificado', description: 'Login único para 1º e 2º grau (TJs, TRFs)' },
  { value: 'unico', label: 'Único', description: 'Login único para tribunal superior (TST, STF, STJ)' },
];

/**
 * Dialog para criar ou editar configurações de tribunais
 */
export function TribunaisDialog({
  tribunal,
  open,
  onOpenChange,
  onSuccess,
}: TribunaisDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [tribunaisDisponiveis, setTribunaisDisponiveis] = useState<Tribunal[]>([]);
  const [isLoadingTribunais, setIsLoadingTribunais] = useState(false);

  // Estados do formulário
  const [tribunalId, setTribunalId] = useState('');
  const [tipoAcesso, setTipoAcesso] = useState<TipoAcessoTribunal | ''>('');
  const [urlBase, setUrlBase] = useState('');
  const [urlLoginSeam, setUrlLoginSeam] = useState('');
  const [urlApi, setUrlApi] = useState('');

  // Timeouts customizados (opcional)
  const [mostrarTimeouts, setMostrarTimeouts] = useState(false);
  const [timeoutLogin, setTimeoutLogin] = useState('');
  const [timeoutRedirect, setTimeoutRedirect] = useState('');
  const [timeoutNetworkIdle, setTimeoutNetworkIdle] = useState('');
  const [timeoutApi, setTimeoutApi] = useState('');

  const isEditMode = tribunal !== null;

  const limparTimeouts = useCallback(() => {
    setTimeoutLogin('');
    setTimeoutRedirect('');
    setTimeoutNetworkIdle('');
    setTimeoutApi('');
  }, []);

  const limparFormulario = useCallback(() => {
    setTribunalId('');
    setTipoAcesso('');
    setUrlBase('');
    setUrlLoginSeam('');
    setUrlApi('');
    limparTimeouts();
    setMostrarTimeouts(false);
  }, [limparTimeouts]);

  // Carregar lista de tribunais disponíveis
  useEffect(() => {
    if (open && !isEditMode) {
      buscarTribunaisDisponiveis();
    }
  }, [open, isEditMode]);

  const buscarTribunaisDisponiveis = async () => {
    setIsLoadingTribunais(true);
    try {
      const response = await fetch('/api/tribunais');
      if (!response.ok) throw new Error('Erro ao buscar tribunais');

      const data = await response.json();
      setTribunaisDisponiveis(data.data.tribunais);
    } catch (error) {
      console.error('Erro ao buscar tribunais:', error);
      toast.error('Erro ao carregar lista de tribunais');
    } finally {
      setIsLoadingTribunais(false);
    }
  };

  // Preencher formulário em modo edição
  useEffect(() => {
    if (tribunal) {
      setTribunalId(tribunal.tribunal_id);
      setTipoAcesso(tribunal.tipo_acesso);
      setUrlBase(tribunal.url_base);
      setUrlLoginSeam(tribunal.url_login_seam);
      setUrlApi(tribunal.url_api);

      // Carregar timeouts customizados se existirem
      if (tribunal.custom_timeouts) {
        setMostrarTimeouts(true);
        setTimeoutLogin(tribunal.custom_timeouts.login?.toString() || '');
        setTimeoutRedirect(tribunal.custom_timeouts.redirect?.toString() || '');
        setTimeoutNetworkIdle(tribunal.custom_timeouts.networkIdle?.toString() || '');
        setTimeoutApi(tribunal.custom_timeouts.api?.toString() || '');
      } else {
        setMostrarTimeouts(false);
        limparTimeouts();
      }
    } else {
      // Limpar formulário em modo criação
      limparFormulario();
    }
  }, [tribunal, open, limparFormulario, limparTimeouts]);

  const handleSave = async () => {
    // Validações
    if (!isEditMode && !tribunalId) {
      toast.error('Selecione um tribunal');
      return;
    }

    if (!tipoAcesso) {
      toast.error('Selecione o tipo de acesso');
      return;
    }

    if (!urlBase) {
      toast.error('Informe a URL base');
      return;
    }

    if (!urlLoginSeam) {
      toast.error('Informe a URL de login');
      return;
    }

    if (!urlApi) {
      toast.error('Informe a URL da API');
      return;
    }

    setIsSaving(true);

    try {
      // Montar custom_timeouts se houver valores
      const customTimeouts = mostrarTimeouts && (timeoutLogin || timeoutRedirect || timeoutNetworkIdle || timeoutApi)
        ? {
            ...(timeoutLogin && { login: parseInt(timeoutLogin) }),
            ...(timeoutRedirect && { redirect: parseInt(timeoutRedirect) }),
            ...(timeoutNetworkIdle && { networkIdle: parseInt(timeoutNetworkIdle) }),
            ...(timeoutApi && { api: parseInt(timeoutApi) }),
          }
        : null;

      const body = {
        ...((!isEditMode) && { tribunal_id: tribunalId }),
        tipo_acesso: tipoAcesso,
        url_base: urlBase,
        url_login_seam: urlLoginSeam,
        url_api: urlApi,
        custom_timeouts: customTimeouts,
      };

      const url = isEditMode
        ? `/api/captura/tribunais/${tribunal.id}`
        : '/api/captura/tribunais';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      toast.success(
        isEditMode
          ? 'Configuração atualizada com sucesso!'
          : 'Configuração criada com sucesso!'
      );

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar configuração';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Configuração de Tribunal' : 'Nova Configuração de Tribunal'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Atualize as URLs e configurações de acesso ao tribunal'
              : 'Adicione uma nova configuração de acesso a um tribunal'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tribunal (somente em modo criação) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="tribunal">
                Tribunal <span className="text-destructive">*</span>
              </Label>
              <Select value={tribunalId} onValueChange={setTribunalId} disabled={isLoadingTribunais}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingTribunais ? "Carregando..." : "Selecione um tribunal"} />
                </SelectTrigger>
                <SelectContent>
                  {tribunaisDisponiveis.map((trib) => (
                    <SelectItem key={trib.id} value={trib.id}>
                      {trib.codigo} - {trib.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tipo de Acesso */}
          <div className="space-y-2">
            <Label htmlFor="tipoAcesso">
              Tipo de Acesso <span className="text-destructive">*</span>
            </Label>
            <Select value={tipoAcesso} onValueChange={(v) => setTipoAcesso(v as TipoAcessoTribunal)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de acesso" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ACESSO.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{tipo.label}</span>
                      <span className="text-xs text-muted-foreground">{tipo.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* URLs */}
          <div className="space-y-2">
            <Label htmlFor="urlBase">
              URL Base <span className="text-destructive">*</span>
            </Label>
            <Input
              id="urlBase"
              placeholder="https://pje.trt3.jus.br"
              value={urlBase}
              onChange={(e) => setUrlBase(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="urlLoginSeam">
              URL de Login (SEAM) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="urlLoginSeam"
              placeholder="https://pje.trt3.jus.br/primeirograu/login.seam"
              value={urlLoginSeam}
              onChange={(e) => setUrlLoginSeam(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="urlApi">
              URL da API <span className="text-destructive">*</span>
            </Label>
            <Input
              id="urlApi"
              placeholder="https://pje.trt3.jus.br/pje-comum-api/api"
              value={urlApi}
              onChange={(e) => setUrlApi(e.target.value)}
            />
          </div>

          {/* Timeouts Customizados (Opcional - Collapsible) */}
          <Collapsible open={mostrarTimeouts} onOpenChange={setMostrarTimeouts}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="text-sm font-medium">Timeouts Customizados (Opcional)</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${mostrarTimeouts ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Configure timeouts específicos para este tribunal (em milissegundos). Deixe vazio para usar os padrões.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeoutLogin">Timeout Login (ms)</Label>
                  <Input
                    id="timeoutLogin"
                    type="number"
                    placeholder="30000"
                    value={timeoutLogin}
                    onChange={(e) => setTimeoutLogin(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeoutRedirect">Timeout Redirect (ms)</Label>
                  <Input
                    id="timeoutRedirect"
                    type="number"
                    placeholder="10000"
                    value={timeoutRedirect}
                    onChange={(e) => setTimeoutRedirect(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeoutNetworkIdle">Timeout Network Idle (ms)</Label>
                  <Input
                    id="timeoutNetworkIdle"
                    type="number"
                    placeholder="30000"
                    value={timeoutNetworkIdle}
                    onChange={(e) => setTimeoutNetworkIdle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeoutApi">Timeout API (ms)</Label>
                  <Input
                    id="timeoutApi"
                    type="number"
                    placeholder="15000"
                    value={timeoutApi}
                    onChange={(e) => setTimeoutApi(e.target.value)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner className="mr-2" />
                Salvando...
              </>
            ) : (
              isEditMode ? 'Atualizar' : 'Criar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
