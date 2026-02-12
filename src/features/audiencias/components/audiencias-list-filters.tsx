'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  StatusAudiencia,
  ModalidadeAudiencia,
  GrauTribunal,
  CODIGO_TRIBUNAL,
  STATUS_AUDIENCIA_LABELS,
  MODALIDADE_AUDIENCIA_LABELS,
  GRAU_TRIBUNAL_LABELS,
  type CodigoTribunal,
  type TipoAudiencia,
} from '../domain';

// Types
interface Usuario {
  id: number;
  nomeExibicao?: string | null;
  nomeCompleto?: string | null;
}

export interface AudienciasListFiltersProps {
  // Status filter
  statusFiltro: StatusAudiencia | 'todas';
  onStatusChange: (value: StatusAudiencia | 'todas') => void;
  // Modalidade filter
  modalidadeFiltro: ModalidadeAudiencia | 'todas';
  onModalidadeChange: (value: ModalidadeAudiencia | 'todas') => void;
  // TRT filter
  trtFiltro: CodigoTribunal | 'todas';
  onTrtChange: (value: CodigoTribunal | 'todas') => void;
  // Grau filter
  grauFiltro: GrauTribunal | 'todas';
  onGrauChange: (value: GrauTribunal | 'todas') => void;
  // Responsavel filter
  responsavelFiltro: number | 'null' | 'todos';
  onResponsavelChange: (value: number | 'null' | 'todos') => void;
  // Tipo audiencia filter
  tipoAudienciaFiltro: number | 'todos';
  onTipoAudienciaChange: (value: number | 'todos') => void;
  // Data for select options
  usuarios: Usuario[];
  tiposAudiencia: TipoAudiencia[];
}

export function AudienciasListFilters({
  statusFiltro,
  onStatusChange,
  modalidadeFiltro,
  onModalidadeChange,
  trtFiltro,
  onTrtChange,
  grauFiltro,
  onGrauChange,
  responsavelFiltro,
  onResponsavelChange,
  tipoAudienciaFiltro,
  onTipoAudienciaChange,
  usuarios,
  tiposAudiencia,
}: AudienciasListFiltersProps) {
  return (
    <>
      {/* Status Filter */}
      <Select
        value={statusFiltro}
        onValueChange={(value) => onStatusChange(value as StatusAudiencia | 'todas')}
      >
        <SelectTrigger className="h-9 w-32 border-dashed bg-card font-normal">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Status</SelectItem>
          {Object.values(StatusAudiencia).map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_AUDIENCIA_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Modalidade Filter */}
      <Select
        value={modalidadeFiltro}
        onValueChange={(value) => onModalidadeChange(value as ModalidadeAudiencia | 'todas')}
      >
        <SelectTrigger className="h-9 w-32 border-dashed bg-card font-normal">
          <SelectValue placeholder="Modalidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Modalidade</SelectItem>
          {Object.values(ModalidadeAudiencia).map((modalidade) => (
            <SelectItem key={modalidade} value={modalidade}>
              {MODALIDADE_AUDIENCIA_LABELS[modalidade]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* TRT Filter */}
      <Select
        value={trtFiltro}
        onValueChange={(value) => onTrtChange(value as CodigoTribunal | 'todas')}
      >
        <SelectTrigger className="h-9 w-28 border-dashed bg-card font-normal">
          <SelectValue placeholder="Tribunal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Tribunal</SelectItem>
          {CODIGO_TRIBUNAL.map((trt) => (
            <SelectItem key={trt} value={trt}>
              {trt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Grau Filter */}
      <Select
        value={grauFiltro}
        onValueChange={(value) => onGrauChange(value as GrauTribunal | 'todas')}
      >
        <SelectTrigger className="h-9 w-28 border-dashed bg-card font-normal">
          <SelectValue placeholder="Grau" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Grau</SelectItem>
          {Object.values(GrauTribunal).map((grau) => (
            <SelectItem key={grau} value={grau}>
              {GRAU_TRIBUNAL_LABELS[grau]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Responsavel Filter */}
      <Select
        value={responsavelFiltro.toString()}
        onValueChange={(value) => {
          if (value === 'todos') onResponsavelChange('todos');
          else if (value === 'null') onResponsavelChange('null');
          else onResponsavelChange(Number(value));
        }}
      >
        <SelectTrigger className="h-9 w-40 border-dashed bg-card font-normal">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Responsável</SelectItem>
          <SelectItem value="null">Sem Responsável</SelectItem>
          {usuarios.map((user) => (
            <SelectItem key={user.id} value={user.id.toString()}>
              {user.nomeExibicao || user.nomeCompleto || `Usuário ${user.id}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tipo Audiencia Filter */}
      <Select
        value={tipoAudienciaFiltro.toString()}
        onValueChange={(value) => {
          if (value === 'todos') onTipoAudienciaChange('todos');
          else onTipoAudienciaChange(Number(value));
        }}
      >
        <SelectTrigger className="h-9 w-32 border-dashed bg-card font-normal">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Tipo</SelectItem>
          {tiposAudiencia.map((tipo) => (
            <SelectItem key={tipo.id} value={tipo.id.toString()}>
              {tipo.descricao}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
