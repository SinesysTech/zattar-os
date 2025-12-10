'use client';

// Componente de filtros avançados para expedientes (pendentes de manifestação)

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Filter, X } from 'lucide-react';
import { useUsuarios } from '@/app/_lib/hooks/use-usuarios';
import { useTiposExpedientes } from '@/app/_lib/hooks/use-tipos-expedientes';
import { ExpedientesFilters } from './expedientes-toolbar-filters';
import { CodigoTribunal, GrauTribunal } from '@/core/expedientes/domain';

const TRIBUNAIS: CodigoTribunal[] = CodigoTribunal;

interface ExpedientesFiltrosAvancadosProps {
  filters: ExpedientesFilters;
  onFiltersChange: (filters: ExpedientesFilters) => void;
  onReset: () => void;
}

export function ExpedientesFiltrosAvancados({
  filters,
  onFiltersChange,
  onReset,
}: ExpedientesFiltrosAvancadosProps) {
  const [open, setOpen] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<ExpedientesFilters>(filters);
  const { usuarios, isLoading: isLoadingUsuarios } = useUsuarios({ ativo: true, limite: 100 });
  const { tiposExpediente, isLoading: isLoadingTiposExpediente } = useTiposExpedientes({ limite: 100 });

  // Sincronizar filtros locais com props quando abrir o sheet
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  const handleFilterChange = <K extends keyof ExpedientesFilters>(
    key: K,
    value: ExpedientesFilters[K]
  ) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleReset = () => {
    const emptyFilters: ExpedientesFilters = {};
    setLocalFilters(emptyFilters);
    onReset();
    setOpen(false);
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== null && value !== ''
  );

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Filter className="mr-2 h-4 w-4" />
        Filtros Avançados
        {hasActiveFilters && (
          <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            {Object.values(filters).filter((v) => v !== undefined && v !== null && v !== '').length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[400px] sm:w-[540px] overflow-y-auto p-6">
          <DialogHeader className="pb-5">
            <DialogTitle className="text-xl font-semibold">Filtros Avançados</DialogTitle>
            <DialogDescription>
              Configure filtros para refinar a listagem de expedientes.
            </DialogDescription>
          </DialogHeader>

        <div className="space-y-6">
          {/* Tribunal */}
          <div className="space-y-2">
            <Label htmlFor="trt">Tribunal</Label>
            <Select
              value={localFilters.trt || 'all'}
              onValueChange={(value) => handleFilterChange('trt', value === 'all' ? undefined : value as CodigoTribunal)}
            >
              <SelectTrigger id="trt">
                <SelectValue placeholder="Todos os tribunais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tribunais</SelectItem>
                {TRIBUNAIS.map((trib) => (
                  <SelectItem key={trib} value={trib}>
                    {trib}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grau */}
          <div className="space-y-2">
            <Label htmlFor="grau">Grau</Label>
            <Select
              value={localFilters.grau || 'all'}
              onValueChange={(value) =>
                handleFilterChange('grau', value === 'all' ? undefined : value as GrauTribunal)
              }
            >
              <SelectTrigger id="grau">
                <SelectValue placeholder="Todos os graus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os graus</SelectItem>
                <SelectItem value={GrauTribunal.PRIMEIRO_GRAU}>Primeiro Grau</SelectItem>
                <SelectItem value={GrauTribunal.SEGUNDO_GRAU}>Segundo Grau</SelectItem>
                <SelectItem value={GrauTribunal.TRIBUNAL_SUPERIOR}>Tribunal Superior</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsavelId">Responsável</Label>
            <Select
              value={
                localFilters.responsavelId === 'null'
                  ? 'null'
                  : localFilters.responsavelId?.toString() || 'all'
              }
              onValueChange={(value) => {
                if (value === 'null') {
                  handleFilterChange('responsavelId', 'null');
                } else if (value === 'all') {
                  handleFilterChange('responsavelId', undefined);
                } else {
                  const num = parseInt(value, 10);
                  if (!isNaN(num)) {
                    handleFilterChange('responsavelId', num);
                  }
                }
              }}
              disabled={isLoadingUsuarios}
            >
              <SelectTrigger id="responsavelId">
                <SelectValue placeholder={isLoadingUsuarios ? 'Carregando...' : 'Todos os responsáveis'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                <SelectItem value="null">Sem responsável</SelectItem>
                {usuarios.map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.id.toString()}>
                    {usuario.nomeExibicao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Expediente */}
          <div className="space-y-2">
            <Label htmlFor="tipoExpedienteId">Tipo de Expediente</Label>
            <Select
              value={localFilters.tipoExpedienteId?.toString() || 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  handleFilterChange('tipoExpedienteId', undefined);
                } else {
                  const num = parseInt(value, 10);
                  if (!isNaN(num)) {
                    handleFilterChange('tipoExpedienteId', num);
                  }
                }
              }}
              disabled={isLoadingTiposExpediente}
            >
              <SelectTrigger id="tipoExpedienteId">
                <SelectValue placeholder={isLoadingTiposExpediente ? 'Carregando...' : 'Todos os tipos'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {tiposExpediente.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                    {tipo.tipoExpediente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Classe Judicial */}
          <div className="space-y-2">
            <Label htmlFor="classeJudicial">Classe Judicial</Label>
            <Input
              id="classeJudicial"
              placeholder="Ex: ATOrd, ATSum"
              value={localFilters.classeJudicial || ''}
              onChange={(e) => handleFilterChange('classeJudicial', e.target.value || undefined)}
            />
          </div>

          {/* Status do Processo */}
          <div className="space-y-2">
            <Label htmlFor="codigoStatusProcesso">Status do Processo</Label>
            <Input
              id="codigoStatusProcesso"
              placeholder="Ex: DISTRIBUIDO"
              value={localFilters.codigoStatusProcesso || ''}
              onChange={(e) =>
                handleFilterChange('codigoStatusProcesso', e.target.value || undefined)
              }
            />
          </div>

          {/* Status de Baixa */}
          <div className="space-y-2">
            <Label htmlFor="baixado">Status de Baixa</Label>
            <Select
              value={
                localFilters.baixado === true
                  ? 'baixado'
                  : localFilters.baixado === false
                    ? 'pendente'
                    : 'all'
              }
              onValueChange={(value) => {
                if (value === 'baixado') {
                  handleFilterChange('baixado', true);
                } else if (value === 'pendente') {
                  handleFilterChange('baixado', false);
                } else {
                  handleFilterChange('baixado', undefined);
                }
              }}
            >
              <SelectTrigger id="baixado">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Apenas Pendentes</SelectItem>
                <SelectItem value="baixado">Apenas Baixados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros Booleanos */}
          <div className="space-y-4">
            <Label>Opções</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="prazoVencido"
                  checked={localFilters.prazoVencido === true}
                  onCheckedChange={(checked) =>
                    handleFilterChange('prazoVencido', checked === true ? true : undefined)
                  }
                />
                <Label htmlFor="prazoVencido" className="cursor-pointer font-normal">
                  Prazo Vencido
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="segredoJustica"
                  checked={localFilters.segredoJustica === true}
                  onCheckedChange={(checked) =>
                    handleFilterChange('segredoJustica', checked === true ? true : undefined)
                  }
                />
                <Label htmlFor="segredoJustica" className="cursor-pointer font-normal">
                  Segredo de Justiça
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="juizoDigital"
                  checked={localFilters.juizoDigital === true}
                  onCheckedChange={(checked) =>
                    handleFilterChange('juizoDigital', checked === true ? true : undefined)
                  }
                />
                <Label htmlFor="juizoDigital" className="cursor-pointer font-normal">
                  Juízo Digital
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="semResponsavel"
                  checked={localFilters.semResponsavel === true}
                  onCheckedChange={(checked) =>
                    handleFilterChange('semResponsavel', checked === true ? true : undefined)
                  }
                />
                <Label htmlFor="semResponsavel" className="cursor-pointer font-normal">
                  Sem Responsável
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="semTipo"
                  checked={localFilters.semTipo === true}
                  onCheckedChange={(checked) =>
                    handleFilterChange('semTipo', checked === true ? true : undefined)
                  }
                />
                <Label htmlFor="semTipo" className="cursor-pointer font-normal">
                  Sem Tipo
                </Label>
              </div>
            </div>
          </div>

          {/* Datas específicas de expedientes */}
          <div className="space-y-4">
            <Label>Datas de Expedientes</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataPrazoLegalInicio" className="text-xs">
                  Prazo Legal (Início)
                </Label>
                <FormDatePicker
                  id="dataPrazoLegalInicio"
                  value={localFilters.dataPrazoLegalInicio || undefined}
                  onChange={(v) => handleFilterChange('dataPrazoLegalInicio', v || undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataPrazoLegalFim" className="text-xs">
                  Prazo Legal (Fim)
                </Label>
                <FormDatePicker
                  id="dataPrazoLegalFim"
                  value={localFilters.dataPrazoLegalFim || undefined}
                  onChange={(v) => handleFilterChange('dataPrazoLegalFim', v || undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataCienciaInicio" className="text-xs">
                  Data Ciência (Início)
                </Label>
                <FormDatePicker
                  id="dataCienciaInicio"
                  value={localFilters.dataCienciaInicio || undefined}
                  onChange={(v) => handleFilterChange('dataCienciaInicio', v || undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataCienciaFim" className="text-xs">
                  Data Ciência (Fim)
                </Label>
                <FormDatePicker
                  id="dataCienciaFim"
                  value={localFilters.dataCienciaFim || undefined}
                  onChange={(v) => handleFilterChange('dataCienciaFim', v || undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataCriacaoExpedienteInicio" className="text-xs">
                  Criação Expediente (Início)
                </Label>
                <FormDatePicker
                  id="dataCriacaoExpedienteInicio"
                  value={localFilters.dataCriacaoExpedienteInicio || undefined}
                  onChange={(v) => handleFilterChange('dataCriacaoExpedienteInicio', v || undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataCriacaoExpedienteFim" className="text-xs">
                  Criação Expediente (Fim)
                </Label>
                <FormDatePicker
                  id="dataCriacaoExpedienteFim"
                  value={localFilters.dataCriacaoExpedienteFim || undefined}
                  onChange={(v) => handleFilterChange('dataCriacaoExpedienteFim', v || undefined)}
                />
              </div>
            </div>
          </div>

          {/* Datas comuns */}
          <div className="space-y-4">
            <Label>Datas do Processo</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataAutuacaoInicio" className="text-xs">
                  Data Autuação (Início)
                </Label>
                <FormDatePicker
                  id="dataAutuacaoInicio"
                  value={localFilters.dataAutuacaoInicio || undefined}
                  onChange={(v) => handleFilterChange('dataAutuacaoInicio', v || undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataAutuacaoFim" className="text-xs">
                  Data Autuação (Fim)
                </Label>
                <FormDatePicker
                  id="dataAutuacaoFim"
                  value={localFilters.dataAutuacaoFim || undefined}
                  onChange={(v) => handleFilterChange('dataAutuacaoFim', v || undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataArquivamentoInicio" className="text-xs">
                  Data Arquivamento (Início)
                </Label>
                <FormDatePicker
                  id="dataArquivamentoInicio"
                  value={localFilters.dataArquivamentoInicio || undefined}
                  onChange={(v) => handleFilterChange('dataArquivamentoInicio', v || undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataArquivamentoFim" className="text-xs">
                  Data Arquivamento (Fim)
                </Label>
                <FormDatePicker
                  id="dataArquivamentoFim"
                  value={localFilters.dataArquivamentoFim || undefined}
                  onChange={(v) => handleFilterChange('dataArquivamentoFim', v || undefined)}
                />
              </div>
            </div>
          </div>
        </div>

          <DialogFooter className="pt-6">
            <Button variant="outline" onClick={handleReset}>
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
            <Button onClick={handleApply}>Aplicar Filtros</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

