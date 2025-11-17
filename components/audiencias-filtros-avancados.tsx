'use client';

// Componente de filtros avançados para audiências

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Filter, X } from 'lucide-react';
import { useUsuarios } from '@/lib/hooks/use-usuarios';
import type { AudienciasFilters } from '@/lib/types/audiencias';

// Lista de TRTs disponíveis
const TRTS = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
  'TRT21', 'TRT22', 'TRT23', 'TRT24',
] as const;

interface AudienciasFiltrosAvancadosProps {
  filters: AudienciasFilters;
  onFiltersChange: (filters: AudienciasFilters) => void;
  onReset: () => void;
}

export function AudienciasFiltrosAvancados({
  filters,
  onFiltersChange,
  onReset,
}: AudienciasFiltrosAvancadosProps) {
  const [open, setOpen] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<AudienciasFilters>(filters);
  const { usuarios, isLoading: isLoadingUsuarios } = useUsuarios({ ativo: true, limite: 1000 });

  // Sincronizar filtros locais com props quando abrir o sheet
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  const handleFilterChange = <K extends keyof AudienciasFilters>(
    key: K,
    value: AudienciasFilters[K]
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
    const emptyFilters: AudienciasFilters = {};
    setLocalFilters(emptyFilters);
    onReset();
    setOpen(false);
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== null && value !== ''
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filtros Avançados
          {hasActiveFilters && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {Object.values(filters).filter((v) => v !== undefined && v !== null && v !== '').length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto p-6">
        <SheetHeader className="pb-5">
          <SheetTitle className="text-xl font-semibold">Filtros Avançados</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* TRT */}
          <div className="space-y-2">
            <Label htmlFor="trt">TRT</Label>
            <Select
              value={localFilters.trt || 'all'}
              onValueChange={(value) => handleFilterChange('trt', value === 'all' ? undefined : value)}
            >
              <SelectTrigger id="trt">
                <SelectValue placeholder="Todos os TRTs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os TRTs</SelectItem>
                {TRTS.map((trt) => (
                  <SelectItem key={trt} value={trt}>
                    {trt}
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
                handleFilterChange('grau', value === 'all' ? undefined : value as 'primeiro_grau' | 'segundo_grau' | undefined)
              }
            >
              <SelectTrigger id="grau">
                <SelectValue placeholder="Todos os graus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os graus</SelectItem>
                <SelectItem value="primeiro_grau">Primeiro Grau</SelectItem>
                <SelectItem value="segundo_grau">Segundo Grau</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsavel_id">Responsável</Label>
            <Select
              value={
                localFilters.responsavel_id === 'null'
                  ? 'null'
                  : localFilters.responsavel_id?.toString() || 'all'
              }
              onValueChange={(value) => {
                if (value === 'null') {
                  handleFilterChange('responsavel_id', 'null');
                } else if (value === 'all') {
                  handleFilterChange('responsavel_id', undefined);
                } else {
                  const num = parseInt(value, 10);
                  if (!isNaN(num)) {
                    handleFilterChange('responsavel_id', num);
                  }
                }
              }}
              disabled={isLoadingUsuarios}
            >
              <SelectTrigger id="responsavel_id">
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

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={localFilters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="M">Marcada</SelectItem>
                <SelectItem value="R">Realizada</SelectItem>
                <SelectItem value="C">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Número do Processo */}
          <div className="space-y-2">
            <Label htmlFor="numero_processo">Número do Processo</Label>
            <Input
              id="numero_processo"
              placeholder="Ex: 0010014-94.2025.5.03.0022"
              value={localFilters.numero_processo || ''}
              onChange={(e) => handleFilterChange('numero_processo', e.target.value || undefined)}
            />
          </div>

          {/* Parte Autora */}
          <div className="space-y-2">
            <Label htmlFor="polo_ativo_nome">Parte Autora</Label>
            <Input
              id="polo_ativo_nome"
              placeholder="Nome da parte autora"
              value={localFilters.polo_ativo_nome || ''}
              onChange={(e) => handleFilterChange('polo_ativo_nome', e.target.value || undefined)}
            />
          </div>

          {/* Parte Ré */}
          <div className="space-y-2">
            <Label htmlFor="polo_passivo_nome">Parte Ré</Label>
            <Input
              id="polo_passivo_nome"
              placeholder="Nome da parte ré"
              value={localFilters.polo_passivo_nome || ''}
              onChange={(e) => handleFilterChange('polo_passivo_nome', e.target.value || undefined)}
            />
          </div>

          {/* Tipo de Audiência */}
          <div className="space-y-2">
            <Label htmlFor="tipo_descricao">Tipo de Audiência</Label>
            <Input
              id="tipo_descricao"
              placeholder="Ex: Una, Instrução"
              value={localFilters.tipo_descricao || ''}
              onChange={(e) => handleFilterChange('tipo_descricao', e.target.value || undefined)}
            />
          </div>

          {/* Filtros Booleanos */}
          <div className="space-y-4">
            <Label>Opções</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tipo_is_virtual"
                  checked={localFilters.tipo_is_virtual === true}
                  onCheckedChange={(checked) =>
                    handleFilterChange('tipo_is_virtual', checked === true ? true : undefined)
                  }
                />
                <Label htmlFor="tipo_is_virtual" className="cursor-pointer font-normal">
                  Apenas Audiências Virtuais
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sem_responsavel"
                  checked={localFilters.sem_responsavel === true}
                  onCheckedChange={(checked) =>
                    handleFilterChange('sem_responsavel', checked === true ? true : undefined)
                  }
                />
                <Label htmlFor="sem_responsavel" className="cursor-pointer font-normal">
                  Sem Responsável
                </Label>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="space-y-4">
            <Label>Datas de Início</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio_inicio" className="text-xs">
                  Data Início (Início)
                </Label>
                <Input
                  id="data_inicio_inicio"
                  type="date"
                  value={localFilters.data_inicio_inicio || ''}
                  onChange={(e) =>
                    handleFilterChange('data_inicio_inicio', e.target.value || undefined)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_inicio_fim" className="text-xs">
                  Data Início (Fim)
                </Label>
                <Input
                  id="data_inicio_fim"
                  type="date"
                  value={localFilters.data_inicio_fim || ''}
                  onChange={(e) =>
                    handleFilterChange('data_inicio_fim', e.target.value || undefined)
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Datas de Fim</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_fim_inicio" className="text-xs">
                  Data Fim (Início)
                </Label>
                <Input
                  id="data_fim_inicio"
                  type="date"
                  value={localFilters.data_fim_inicio || ''}
                  onChange={(e) =>
                    handleFilterChange('data_fim_inicio', e.target.value || undefined)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_fim_fim" className="text-xs">
                  Data Fim (Fim)
                </Label>
                <Input
                  id="data_fim_fim"
                  type="date"
                  value={localFilters.data_fim_fim || ''}
                  onChange={(e) =>
                    handleFilterChange('data_fim_fim', e.target.value || undefined)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="pt-6">
          <Button variant="outline" onClick={handleReset}>
            <X className="mr-2 h-4 w-4" />
            Limpar
          </Button>
          <Button onClick={handleApply}>Aplicar Filtros</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

