// Componente para exibir badges de graus ativos de um processo unificado

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProcessoInstancia, GrauAcervo } from '@/backend/types/acervo/types';

interface GrauBadgesProps {
  instances?: ProcessoInstancia[];
  grauAtual?: GrauAcervo;
  grausAtivos?: GrauAcervo[];
}

/**
 * Mapeia grau para label legível
 */
const GRAU_LABELS: Record<GrauAcervo, string> = {
  primeiro_grau: '1º Grau',
  segundo_grau: '2º Grau',
};

/**
 * Mapeia grau para variante de badge
 */
const GRAU_VARIANTS: Record<GrauAcervo, 'default' | 'secondary' | 'outline'> = {
  primeiro_grau: 'secondary',
  segundo_grau: 'default',
};

/**
 * Componente que exibe badges dos graus ativos de um processo
 * Destaca o grau atual com estilo diferenciado
 */
export function GrauBadges({ instances, grauAtual, grausAtivos }: GrauBadgesProps) {
  // Se não há instâncias, não renderiza nada (processo legado/não-unificado)
  if (!instances || instances.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {instances.map((instance) => {
        const isGrauAtual = instance.is_grau_atual || instance.grau === grauAtual;
        const label = GRAU_LABELS[instance.grau];
        const variant = GRAU_VARIANTS[instance.grau];

        return (
          <TooltipProvider key={instance.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={isGrauAtual ? 'default' : variant}
                  className={isGrauAtual ? 'font-semibold' : ''}
                >
                  {label}
                  {isGrauAtual && ' (Atual)'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <div>
                    <strong>Grau:</strong> {label}
                  </div>
                  <div>
                    <strong>TRT:</strong> {instance.trt}
                  </div>
                  <div>
                    <strong>Origem:</strong>{' '}
                    {instance.origem === 'acervo_geral' ? 'Acervo Geral' : 'Arquivado'}
                  </div>
                  <div>
                    <strong>Data Autuação:</strong>{' '}
                    {new Date(instance.data_autuacao).toLocaleDateString('pt-BR')}
                  </div>
                  {isGrauAtual && (
                    <div className="mt-2 pt-2 border-t text-muted-foreground">
                      Este é o grau atual do processo
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

/**
 * Versão simplificada sem tooltip (para células de tabela compactas)
 */
export function GrauBadgesSimple({ grausAtivos, grauAtual }: GrauBadgesProps) {
  if (!grausAtivos || grausAtivos.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {grausAtivos.map((grau) => {
        const isGrauAtual = grau === grauAtual;
        const label = GRAU_LABELS[grau];
        const variant = GRAU_VARIANTS[grau];

        return (
          <Badge
            key={grau}
            variant={isGrauAtual ? 'default' : variant}
            className={isGrauAtual ? 'font-semibold text-xs' : 'text-xs'}
          >
            {label}
          </Badge>
        );
      })}
    </div>
  );
}
