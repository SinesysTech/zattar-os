'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

type EnderecoPresencial = {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
};

type ViaCepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

type Audiencia = {
  id: number;
  url_audiencia_virtual: string | null;
  endereco_presencial: EnderecoPresencial | null;
  modalidade: 'virtual' | 'presencial' | 'hibrida' | null;
};

interface EditarEnderecoDialogProps {
  audiencia: Audiencia;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditarEnderecoDialog({
  audiencia,
  open,
  onOpenChange,
  onSuccess,
}: EditarEnderecoDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetchingCep, setIsFetchingCep] = React.useState(false);
  const [tipoEndereco, setTipoEndereco] = React.useState<'virtual' | 'presencial' | 'hibrida'>(
    audiencia.modalidade === 'hibrida' ? 'hibrida' :
      audiencia.url_audiencia_virtual ? 'virtual' :
        audiencia.endereco_presencial ? 'presencial' : 'virtual'
  );
  const [url, setUrl] = React.useState(audiencia.url_audiencia_virtual || '');
  const [endereco, setEndereco] = React.useState<EnderecoPresencial>({
    logradouro: audiencia.endereco_presencial?.logradouro || '',
    numero: audiencia.endereco_presencial?.numero || '',
    complemento: audiencia.endereco_presencial?.complemento || '',
    bairro: audiencia.endereco_presencial?.bairro || '',
    cidade: audiencia.endereco_presencial?.cidade || '',
    estado: audiencia.endereco_presencial?.estado || '',
    cep: audiencia.endereco_presencial?.cep || '',
  });
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cepInputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when audiencia changes
  React.useEffect(() => {
    setUrl(audiencia.url_audiencia_virtual || '');
    setEndereco({
      logradouro: audiencia.endereco_presencial?.logradouro || '',
      numero: audiencia.endereco_presencial?.numero || '',
      complemento: audiencia.endereco_presencial?.complemento || '',
      bairro: audiencia.endereco_presencial?.bairro || '',
      cidade: audiencia.endereco_presencial?.cidade || '',
      estado: audiencia.endereco_presencial?.estado || '',
      cep: audiencia.endereco_presencial?.cep || '',
    });
    setTipoEndereco(
      audiencia.modalidade === 'hibrida' ? 'hibrida' :
        audiencia.url_audiencia_virtual ? 'virtual' :
          audiencia.endereco_presencial ? 'presencial' : 'virtual'
    );
    setError(null);
  }, [audiencia]);

  // Auto-focus input when dialog opens
  React.useEffect(() => {
    if (open && tipoEndereco === 'virtual' && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    } else if (open && (tipoEndereco === 'presencial' || tipoEndereco === 'hibrida') && cepInputRef.current) {
      setTimeout(() => {
        cepInputRef.current?.focus();
        cepInputRef.current?.select();
      }, 100);
    }
  }, [open, tipoEndereco]);

  // Formatar CEP (adiciona hífen automaticamente)
  const formatarCep = (value: string): string => {
    const numeros = value.replace(/\D/g, '');
    if (numeros.length <= 5) {
      return numeros;
    }
    return `${numeros.slice(0, 5)}-${numeros.slice(5, 8)}`;
  };

  // Buscar endereço via ViaCEP
  const buscarEnderecoPorCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');

    // Validar formato do CEP (8 dígitos)
    if (cepLimpo.length !== 8) {
      return;
    }

    setIsFetchingCep(true);
    setError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

      if (!response.ok) {
        throw new Error('Erro ao buscar CEP');
      }

      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        setError('CEP não encontrado');
        return;
      }

      // Preencher campos automaticamente
      setEndereco(prev => ({
        ...prev,
        logradouro: data.logradouro || prev.logradouro,
        complemento: data.complemento || prev.complemento,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
        cep: formatarCep(data.cep),
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setError('Erro ao buscar endereço. Verifique o CEP e tente novamente.');
    } finally {
      setIsFetchingCep(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let bodyData;

      if (tipoEndereco === 'virtual') {
        const urlToSave = url.trim() || null;

        // Validar URL se fornecida
        if (urlToSave) {
          try {
            new URL(urlToSave);
          } catch {
            setError('URL inválida. Use o formato: https://exemplo.com');
            setIsLoading(false);
            return;
          }
        }

        bodyData = {
          tipo: 'virtual',
          urlAudienciaVirtual: urlToSave
        };
      } else if (tipoEndereco === 'presencial') {
        // Validar se pelo menos logradouro ou cidade estão preenchidos
        const logradouroPreenchido = endereco.logradouro && endereco.logradouro.trim();
        const cidadePreenchida = endereco.cidade && endereco.cidade.trim();

        if (!logradouroPreenchido && !cidadePreenchida) {
          setError('Informe pelo menos o logradouro ou a cidade');
          setIsLoading(false);
          return;
        }

        bodyData = {
          tipo: 'presencial',
          enderecoPresencial: endereco
        };
      } else {
        // tipoEndereco === 'hibrida'
        const urlToSave = url.trim() || null;

        // Validar URL se fornecida
        if (urlToSave) {
          try {
            new URL(urlToSave);
          } catch {
            setError('URL inválida. Use o formato: https://exemplo.com');
            setIsLoading(false);
            return;
          }
        }

        // Validar se pelo menos logradouro ou cidade estão preenchidos
        const logradouroPreenchido = endereco.logradouro && endereco.logradouro.trim();
        const cidadePreenchida = endereco.cidade && endereco.cidade.trim();

        if (!logradouroPreenchido && !cidadePreenchida) {
          setError('Informe pelo menos o logradouro ou a cidade');
          setIsLoading(false);
          return;
        }

        // Para híbrida, ambos devem estar preenchidos
        if (!urlToSave) {
          setError('Para modalidade híbrida, é necessário informar a URL virtual');
          setIsLoading(false);
          return;
        }

        bodyData = {
          tipo: 'hibrida',
          urlAudienciaVirtual: urlToSave,
          enderecoPresencial: endereco
        };
      }

      const response = await fetch(`/api/audiencias/${audiencia.id}/endereco`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao atualizar endereço');
      }

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar endereço');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setUrl(audiencia.url_audiencia_virtual || '');
    setEndereco({
      logradouro: audiencia.endereco_presencial?.logradouro || '',
      numero: audiencia.endereco_presencial?.numero || '',
      complemento: audiencia.endereco_presencial?.complemento || '',
      bairro: audiencia.endereco_presencial?.bairro || '',
      cidade: audiencia.endereco_presencial?.cidade || '',
      estado: audiencia.endereco_presencial?.estado || '',
      cep: audiencia.endereco_presencial?.cep || '',
    });
    setError(null);
    onOpenChange(false);
  };

  // Componente de formulário de endereço reutilizável
  const EnderecoForm = ({ idPrefix = '' }: { idPrefix?: string }) => (
    <div className="space-y-4">
      {/* CEP */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}cep`}>CEP</Label>
        <div className="relative">
          <Input
            ref={cepInputRef}
            id={`${idPrefix}cep`}
            value={endereco.cep}
            onChange={(e) => {
              const formatted = formatarCep(e.target.value);
              setEndereco(prev => ({ ...prev, cep: formatted }));
              setError(null);
            }}
            onBlur={(e) => {
              const cep = e.target.value;
              if (cep.replace(/\D/g, '').length === 8) {
                buscarEnderecoPorCep(cep);
              }
            }}
            placeholder="00000-000"
            disabled={isLoading || isFetchingCep}
            maxLength={9}
          />
          {isFetchingCep && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Digite o CEP para buscar o endereço automaticamente
        </p>
      </div>

      {/* Logradouro e Número */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-2">
          <Label htmlFor={`${idPrefix}logradouro`}>Logradouro</Label>
          <Input
            id={`${idPrefix}logradouro`}
            value={endereco.logradouro}
            onChange={(e) => {
              setEndereco(prev => ({ ...prev, logradouro: e.target.value }));
              setError(null);
            }}
            placeholder="Rua, Avenida, etc."
            disabled={isLoading || isFetchingCep}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}numero`}>Número</Label>
          <Input
            id={`${idPrefix}numero`}
            value={endereco.numero}
            onChange={(e) => {
              setEndereco(prev => ({ ...prev, numero: e.target.value }));
              setError(null);
            }}
            placeholder="Nº"
            disabled={isLoading || isFetchingCep}
          />
        </div>
      </div>

      {/* Complemento */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}complemento`}>Complemento</Label>
        <Input
          id={`${idPrefix}complemento`}
          value={endereco.complemento}
          onChange={(e) => {
            setEndereco(prev => ({ ...prev, complemento: e.target.value }));
            setError(null);
          }}
          placeholder="Apartamento, sala, etc."
          disabled={isLoading || isFetchingCep}
        />
      </div>

      {/* Bairro e Cidade */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}bairro`}>Bairro</Label>
          <Input
            id={`${idPrefix}bairro`}
            value={endereco.bairro}
            onChange={(e) => {
              setEndereco(prev => ({ ...prev, bairro: e.target.value }));
              setError(null);
            }}
            placeholder="Bairro"
            disabled={isLoading || isFetchingCep}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}cidade`}>Cidade</Label>
          <Input
            id={`${idPrefix}cidade`}
            value={endereco.cidade}
            onChange={(e) => {
              setEndereco(prev => ({ ...prev, cidade: e.target.value }));
              setError(null);
            }}
            placeholder="Cidade"
            disabled={isLoading || isFetchingCep}
          />
        </div>
      </div>

      {/* Estado */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}estado`}>Estado</Label>
          <Input
            id={`${idPrefix}estado`}
            value={endereco.estado}
            onChange={(e) => {
              setEndereco(prev => ({ ...prev, estado: e.target.value.toUpperCase() }));
              setError(null);
            }}
            placeholder="UF"
            disabled={isLoading || isFetchingCep}
            maxLength={2}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(92vw,25rem)] sm:max-w-[min(92vw,34.375rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Endereço da Audiência</DialogTitle>
          <DialogDescription>
            Escolha a modalidade da audiência
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Toggle entre Virtual, Presencial e Híbrida */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={tipoEndereco === 'virtual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoEndereco('virtual')}
              className="flex-1"
              disabled={isLoading}
            >
              Virtual
            </Button>
            <Button
              type="button"
              variant={tipoEndereco === 'presencial' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoEndereco('presencial')}
              className="flex-1"
              disabled={isLoading}
            >
              Presencial
            </Button>
            <Button
              type="button"
              variant={tipoEndereco === 'hibrida' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoEndereco('hibrida')}
              className="flex-1"
              disabled={isLoading}
            >
              Híbrida
            </Button>
          </div>

          {/* Formulário condicional */}
          {tipoEndereco === 'virtual' && (
            <div className="space-y-2">
              <Label htmlFor="url-input">URL da Audiência Virtual</Label>
              <Input
                ref={inputRef}
                id="url-input"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                placeholder="https://meet.google.com/..."
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
            </div>
          )}

          {tipoEndereco === 'presencial' && (
            <EnderecoForm />
          )}

          {tipoEndereco === 'hibrida' && (
            <div className="space-y-4">
              {/* URL Virtual */}
              <div className="space-y-2">
                <Label htmlFor="url-hibrida">URL da Audiência Virtual</Label>
                <Input
                  ref={inputRef}
                  id="url-hibrida"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError(null);
                  }}
                  placeholder="https://meet.google.com/..."
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  URL para participação virtual (advogado ou cliente)
                </p>
              </div>

              {/* Endereço Presencial */}
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-1">
                  <Label>Endereço Presencial</Label>
                  <p className="text-xs text-muted-foreground">
                    Endereço para participação presencial (advogado ou cliente)
                  </p>
                </div>
                <EnderecoForm idPrefix="hibrida-" />
              </div>
            </div>
          )}

          {/* Mensagem de erro */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
