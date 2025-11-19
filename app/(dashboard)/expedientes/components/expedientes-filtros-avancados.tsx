'use client';

// Componente de filtros avançados para expedientes (pendentes de manifestação)

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
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Filter, X } from 'lucide-react';
import { useUsuarios } from '@/lib/hooks/use-usuarios';
import type { ExpedientesFilters } from '@/lib/types/expedientes';

// Lista de TRTs disponíveis
const TRTS = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
  'TRT21', 'TRT22', 'TRT23', 'TRT24',
] as const;

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
  const { usuarios, isLoading: isLoadingUsuarios } = useUsuarios({ ativo: true, limite: 100 }); // Apenas usuários ativos

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

          {/* Classe Judicial */}
          <div className="space-y-2">
            <Label htmlFor="classe_judicial">Classe Judicial</Label>
            <Input
              id="classe_judicial"
              placeholder="Ex: ATOrd, ATSum"
              value={localFilters.classe_judicial || ''}
              onChange={(e) => handleFilterChange('classe_judicial', e.target.value || undefined)}
            />
          </div>

          {/* Status do Processo */}
          <div className="space-y-2">
            <Label htmlFor="codigo_status_processo">Status do Processo</Label>
            <Input
              id="codigo_status_processo"
              placeholder="Ex: DISTRIBUIDO"
              value={localFilters.codigo_status_processo || ''}
              onChange={(e) =>
                handleFilterChange('codigo_status_processo', e.target.value || undefined)
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
                  id="prazo_vencido"
                  checked={localFilters.prazo_vencido === true}
                  onCheckedChange={(checked) =>
                    handleFilterChange('prazo_vencido', checked === true ? true : undefined)
                  }
                />
                <Label htmlFor="prazo_vencido" className="cursor-pointer font-normal">
                  Prazo Vencido
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="segredo_justica"
                  checked={localFilters.segredo_justica === true}
                  onCheckedChange={(checked) =>
                    handleFilterChange('segredo_justica', checked === true ? true : undefined)
                  }
                />
                <Label htmlFor="segredo_justica" className="cursor-pointer font-normal">
                  Segredo de Justiça
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="juizo_digital"
                  checked={localFilters.juizo_digital === true}
                  onCheckedChange={(checked) =>
                    handleFilterChange('juizo_digital', checked === true ? true : undefined)
                  }
                />
                <Label htmlFor="juizo_digital" className="cursor-pointer font-normal">
                  Juízo Digital
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

          {/* Datas específicas de expedientes */}
          <div className="space-y-4">
            <Label>Datas de Expedientes</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_prazo_legal_inicio" className="text-xs">
                  Prazo Legal (Início)
                </Label>
                <Input
                  id="data_prazo_legal_inicio"
                  type="date"
                  value={localFilters.data_prazo_legal_inicio || ''}
                  onChange={(e) =>
                    handleFilterChange('data_prazo_legal_inicio', e.target.value || undefined)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_prazo_legal_fim" className="text-xs">
                  Prazo Legal (Fim)
                </Label>
                <Input
                  id="data_prazo_legal_fim"
                  type="date"
                  value={localFilters.data_prazo_legal_fim || ''}
                  onChange={(e) =>
                    handleFilterChange('data_prazo_legal_fim', e.target.value || undefined)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_ciencia_inicio" className="text-xs">
                  Data Ciência (Início)
                </Label>
                <Input
                  id="data_ciencia_inicio"
                  type="date"
                  value={localFilters.data_ciencia_inicio || ''}
                  onChange={(e) =>
                    handleFilterChange('data_ciencia_inicio', e.target.value || undefined)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_ciencia_fim" className="text-xs">
                  Data Ciência (Fim)
                </Label>
                <Input
                  id="data_ciencia_fim"
                  type="date"
                  value={localFilters.data_ciencia_fim || ''}
                  onChange={(e) =>
                    handleFilterChange('data_ciencia_fim', e.target.value || undefined)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_criacao_expediente_inicio" className="text-xs">
                  Criação Expediente (Início)
                </Label>
                <Input
                  id="data_criacao_expediente_inicio"
                  type="date"
                  value={localFilters.data_criacao_expediente_inicio || ''}
                  onChange={(e) =>
                    handleFilterChange('data_criacao_expediente_inicio', e.target.value || undefined)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_criacao_expediente_fim" className="text-xs">
                  Criação Expediente (Fim)
                </Label>
                <Input
                  id="data_criacao_expediente_fim"
                  type="date"
                  value={localFilters.data_criacao_expediente_fim || ''}
                  onChange={(e) =>
                    handleFilterChange('data_criacao_expediente_fim', e.target.value || undefined)
                  }
                />
              </div>
            </div>
          </div>

          {/* Datas comuns */}
          <div className="space-y-4">
            <Label>Datas do Processo</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_autuacao_inicio" className="text-xs">
                  Data Autuação (Início)
                </Label>
                <Input
                  id="data_autuacao_inicio"
                  type="date"
                  value={localFilters.data_autuacao_inicio || ''}
                  onChange={(e) =>
                    handleFilterChange('data_autuacao_inicio', e.target.value || undefined)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_autuacao_fim" className="text-xs">
                  Data Autuação (Fim)
                </Label>
                <Input
                  id="data_autuacao_fim"
                  type="date"
                  value={localFilters.data_autuacao_fim || ''}
                  onChange={(e) =>
                    handleFilterChange('data_autuacao_fim', e.target.value || undefined)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_arquivamento_inicio" className="text-xs">
                  Data Arquivamento (Início)
                </Label>
                <Input
                  id="data_arquivamento_inicio"
                  type="date"
                  value={localFilters.data_arquivamento_inicio || ''}
                  onChange={(e) =>
                    handleFilterChange('data_arquivamento_inicio', e.target.value || undefined)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_arquivamento_fim" className="text-xs">
                  Data Arquivamento (Fim)
                </Label>
                <Input
                  id="data_arquivamento_fim"
                  type="date"
                  value={localFilters.data_arquivamento_fim || ''}
                  onChange={(e) =>
                    handleFilterChange('data_arquivamento_fim', e.target.value || undefined)
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

