'use client';

import { cn } from '@/lib/utils';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  Lock,
  Monitor,
  CheckCircle2,
  FileCheck,
  Users,
  Layers,
} from 'lucide-react';
import type { Audiencia } from '../domain';
import { PresencaHibrida } from '../domain';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IndicadorKey =
  | 'segredo_justica'
  | 'juizo_digital'
  | 'designada'
  | 'documento_ativo'
  | 'litisconsorcio_ativo'
  | 'litisconsorcio_passivo'
  | 'presenca_hibrida';

interface AudienciaIndicadorBadgesProps {
  audiencia: Audiencia;
  /** Subconjunto de indicadores a exibir. Omitir = todos os aplicaveis */
  show?: IndicadorKey[];
  /** true = exibir texto explicito para presenca hibrida (modo dialog). false = apenas tooltip */
  showPresencaDetail?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Show configs por contexto de uso
// ---------------------------------------------------------------------------

export const AUDIENCIA_INDICADOR_SHOW_CONFIGS = {
  dialog: undefined, // todos
  card: ['segredo_justica', 'juizo_digital', 'designada', 'presenca_hibrida'] as IndicadorKey[],
  row: ['segredo_justica', 'juizo_digital', 'designada', 'presenca_hibrida'] as IndicadorKey[],
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPresencaDetailText(presenca: PresencaHibrida): string {
  return presenca === PresencaHibrida.Advogado
    ? 'Advogado presencial · Cliente virtual'
    : 'Cliente presencial · Advogado virtual';
}

const ICON_SIZE = 14;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AudienciaIndicadorBadges({
  audiencia,
  show,
  showPresencaDetail = false,
  className,
}: AudienciaIndicadorBadgesProps) {
  const allowed = (key: IndicadorKey) => !show || show.includes(key);

  // Build list of active badges
  const badges: React.ReactNode[] = [];

  if (audiencia.segredoJustica && allowed('segredo_justica')) {
    badges.push(
      <SemanticBadge key="segredo" category="audiencia_indicador" value="segredo_justica">
        <Lock size={ICON_SIZE} className="mr-1 inline-block" />
        Segredo de Justiça
      </SemanticBadge>,
    );
  }

  if (audiencia.juizoDigital && allowed('juizo_digital')) {
    badges.push(
      <SemanticBadge key="juizo" category="audiencia_indicador" value="juizo_digital">
        <Monitor size={ICON_SIZE} className="mr-1 inline-block" />
        Juízo Digital
      </SemanticBadge>,
    );
  }

  if (audiencia.designada && allowed('designada')) {
    badges.push(
      <SemanticBadge key="designada" category="audiencia_indicador" value="designada">
        <CheckCircle2 size={ICON_SIZE} className="mr-1 inline-block" />
        Designada
      </SemanticBadge>,
    );
  }

  if (audiencia.documentoAtivo && allowed('documento_ativo')) {
    badges.push(
      <SemanticBadge key="docativo" category="audiencia_indicador" value="documento_ativo">
        <FileCheck size={ICON_SIZE} className="mr-1 inline-block" />
        Documento Ativo
      </SemanticBadge>,
    );
  }

  if (audiencia.poloAtivoRepresentaVarios && allowed('litisconsorcio_ativo')) {
    badges.push(
      <SemanticBadge key="litis-ativo" category="audiencia_indicador" value="litisconsorcio">
        <Users size={ICON_SIZE} className="mr-1 inline-block" />
        Litisconsórcio Ativo
      </SemanticBadge>,
    );
  }

  if (audiencia.poloPassivoRepresentaVarios && allowed('litisconsorcio_passivo')) {
    badges.push(
      <SemanticBadge key="litis-passivo" category="audiencia_indicador" value="litisconsorcio">
        <Users size={ICON_SIZE} className="mr-1 inline-block" />
        Litisconsórcio Passivo
      </SemanticBadge>,
    );
  }

  if (audiencia.presencaHibrida !== null && allowed('presenca_hibrida')) {
    const detailText = getPresencaDetailText(audiencia.presencaHibrida);

    if (showPresencaDetail) {
      badges.push(
        <SemanticBadge key="hibrida" category="audiencia_indicador" value="presenca_hibrida">
          <span className="flex flex-col items-start gap-0.5">
            <span className="flex items-center">
              <Layers size={ICON_SIZE} className="mr-1 inline-block" />
              Presença Híbrida
            </span>
            <span className="text-[10px] opacity-80">{detailText}</span>
          </span>
        </SemanticBadge>,
      );
    } else {
      badges.push(
        <Tooltip key="hibrida">
          <TooltipTrigger asChild>
            <span>
              <SemanticBadge category="audiencia_indicador" value="presenca_hibrida">
                <Layers size={ICON_SIZE} className="mr-1 inline-block" />
                Híbrida
              </SemanticBadge>
            </span>
          </TooltipTrigger>
          <TooltipContent>{detailText}</TooltipContent>
        </Tooltip>,
      );
    }
  }

  if (badges.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {badges}
    </div>
  );
}
