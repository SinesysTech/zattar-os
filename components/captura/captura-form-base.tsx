'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TRT_CODIGOS, GRAUS } from '@/lib/api/captura';
import type { BaseCapturaTRTParams, CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';

interface CapturaFormBaseProps {
  advogadoId: number | '';
  trtCodigo: CodigoTRT | '';
  grau: GrauTRT | '';
  onAdvogadoIdChange: (value: number | '') => void;
  onTrtCodigoChange: (value: CodigoTRT | '') => void;
  onGrauChange: (value: GrauTRT | '') => void;
  children?: React.ReactNode;
}

/**
 * Componente base de formulário para captura
 * Contém campos comuns: advogado_id, trt_codigo, grau
 */
export function CapturaFormBase({
  advogadoId,
  trtCodigo,
  grau,
  onAdvogadoIdChange,
  onTrtCodigoChange,
  onGrauChange,
  children,
}: CapturaFormBaseProps) {
  return (
    <div className="space-y-6">
      {/* Advogado ID */}
      <div className="space-y-2">
        <Label htmlFor="advogado_id">ID do Advogado *</Label>
        <Input
          id="advogado_id"
          type="number"
          placeholder="Ex: 1"
          value={advogadoId === '' ? '' : advogadoId}
          onChange={(e) => {
            const value = e.target.value;
            onAdvogadoIdChange(value === '' ? '' : parseInt(value, 10));
          }}
          required
        />
        <p className="text-sm text-muted-foreground">
          ID do advogado na tabela advogados
        </p>
      </div>

      {/* TRT */}
      <div className="space-y-2">
        <Label htmlFor="trt_codigo">TRT *</Label>
        <Select
          value={trtCodigo}
          onValueChange={(value) => onTrtCodigoChange(value as CodigoTRT)}
          required
        >
          <SelectTrigger id="trt_codigo">
            <SelectValue placeholder="Selecione o TRT" />
          </SelectTrigger>
          <SelectContent>
            {TRT_CODIGOS.map((codigo) => (
              <SelectItem key={codigo} value={codigo}>
                {codigo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grau */}
      <div className="space-y-2">
        <Label htmlFor="grau">Grau *</Label>
        <Select
          value={grau}
          onValueChange={(value) => onGrauChange(value as GrauTRT)}
          required
        >
          <SelectTrigger id="grau">
            <SelectValue placeholder="Selecione o grau" />
          </SelectTrigger>
          <SelectContent>
            {GRAUS.map((opcao) => (
              <SelectItem key={opcao.value} value={opcao.value}>
                {opcao.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campos específicos do formulário filho */}
      {children}
    </div>
  );
}

/**
 * Valida se os campos base estão preenchidos
 */
export function validarCamposBase(
  advogadoId: number | '',
  trtCodigo: CodigoTRT | '',
  grau: GrauTRT | ''
): boolean {
  return advogadoId !== '' && trtCodigo !== '' && grau !== '';
}

