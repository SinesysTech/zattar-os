'use client';

// Componente de filtros avançados para processos

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
import type { ProcessosFilters } from '@/lib/types/acervo';

// Lista de TRTs disponíveis
const TRTS = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
  'TRT21', 'TRT22', 'TRT23', 'TRT24',
] as const;

interface ProcessosFiltrosAvancadosProps {
  filters: ProcessosFilters;
  onFiltersChange: (filters: ProcessosFilters) => void;
  onReset: () => void;
}

export function ProcessosFiltrosAvancados({
  filters,
  onFiltersChange,
  onReset,
}: ProcessosFiltrosAvancadosProps) {
  const [open, setOpen] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<ProcessosFilters>(filters);

  // Sincronizar filtros locais com props quando abrir o sheet
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  const handleFilterChange = <K extends keyof ProcessosFilters>(
    key: K,
    value: ProcessosFilters[K]
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
    const emptyFilters: ProcessosFilters = {};
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
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Filtros Avançados</SheetTitle>
          <SheetDescription>
            Filtre os processos por critérios específicos. Os filtros são aplicados em conjunto.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Origem */}
          <div className="space-y-2">
            <Label htmlFor="origem">Origem</Label>
            <Select
              value={localFilters.origem || ''}
              onValueChange={(value) =>
                handleFilterChange('origem', value as 'acervo_geral' | 'arquivado' | undefined)
              }
            >
              <SelectTrigger id="origem">
                <SelectValue placeholder="Todas as origens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as origens</SelectItem>
                <SelectItem value="acervo_geral">Acervo Geral</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* TRT */}
          <div className="space-y-2">
            <Label htmlFor="trt">TRT</Label>
            <Select
              value={localFilters.trt || ''}
              onValueChange={(value) => handleFilterChange('trt', value || undefined)}
            >
              <SelectTrigger id="trt">
                <SelectValue placeholder="Todos os TRTs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os TRTs</SelectItem>
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
              value={localFilters.grau || ''}
              onValueChange={(value) =>
                handleFilterChange('grau', value as 'primeiro_grau' | 'segundo_grau' | undefined)
              }
            >
              <SelectTrigger id="grau">
                <SelectValue placeholder="Todos os graus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os graus</SelectItem>
                <SelectItem value="primeiro_grau">Primeiro Grau</SelectItem>
                <SelectItem value="segundo_grau">Segundo Grau</SelectItem>
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
            <Label htmlFor="nome_parte_autora">Parte Autora</Label>
            <Input
              id="nome_parte_autora"
              placeholder="Nome da parte autora"
              value={localFilters.nome_parte_autora || ''}
              onChange={(e) => handleFilterChange('nome_parte_autora', e.target.value || undefined)}
            />
          </div>

          {/* Parte Ré */}
          <div className="space-y-2">
            <Label htmlFor="nome_parte_re">Parte Ré</Label>
            <Input
              id="nome_parte_re"
              placeholder="Nome da parte ré"
              value={localFilters.nome_parte_re || ''}
              onChange={(e) => handleFilterChange('nome_parte_re', e.target.value || undefined)}
            />
          </div>

          {/* Órgão Julgador */}
          <div className="space-y-2">
            <Label htmlFor="descricao_orgao_julgador">Órgão Julgador</Label>
            <Input
              id="descricao_orgao_julgador"
              placeholder="Descrição do órgão julgador"
              value={localFilters.descricao_orgao_julgador || ''}
              onChange={(e) =>
                handleFilterChange('descricao_orgao_julgador', e.target.value || undefined)
              }
            />
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

          {/* Filtros Booleanos */}
          <div className="space-y-4">
            <Label>Opções</Label>
            <div className="space-y-3">
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
                  id="tem_associacao"
                  checked={localFilters.tem_associacao === true}
                  onCheckedChange={(checked) =>
                    handleFilterChange('tem_associacao', checked === true ? true : undefined)
                  }
                />
                <Label htmlFor="tem_associacao" className="cursor-pointer font-normal">
                  Com Associação
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tem_proxima_audiencia"
                  checked={localFilters.tem_proxima_audiencia === true}
                  onCheckedChange={(checked) =>
                    handleFilterChange('tem_proxima_audiencia', checked === true ? true : undefined)
                  }
                />
                <Label htmlFor="tem_proxima_audiencia" className="cursor-pointer font-normal">
                  Com Próxima Audiência
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
            <Label>Datas</Label>
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
              <div className="space-y-2">
                <Label htmlFor="data_proxima_audiencia_inicio" className="text-xs">
                  Próxima Audiência (Início)
                </Label>
                <Input
                  id="data_proxima_audiencia_inicio"
                  type="date"
                  value={localFilters.data_proxima_audiencia_inicio || ''}
                  onChange={(e) =>
                    handleFilterChange('data_proxima_audiencia_inicio', e.target.value || undefined)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_proxima_audiencia_fim" className="text-xs">
                  Próxima Audiência (Fim)
                </Label>
                <Input
                  id="data_proxima_audiencia_fim"
                  type="date"
                  value={localFilters.data_proxima_audiencia_fim || ''}
                  onChange={(e) =>
                    handleFilterChange('data_proxima_audiencia_fim', e.target.value || undefined)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6">
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

