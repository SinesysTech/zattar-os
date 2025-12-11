/**
 * Componente para exibir badges de graus ativos de um processo unificado
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProcessoInstancia, GrauAcervo } from '@/features/acervo/types';

interface GrauBadgesProps {
  instances?: ProcessoInstancia[];
}

/**
 * Mapeia grau para label legível
 */
const GRAU_LABELS: Record<GrauAcervo, string> = {
  primeiro_grau: '1º Grau',
  segundo_grau: '2º Grau',
  tribunal_superior: 'Tribunal Superior',
};

/**
 * Mapeia grau para variante de badge
 */
const GRAU_VARIANTS: Record<GrauAcervo, 'default' | 'secondary' | 'outline'> = {
  primeiro_grau: 'secondary',
  segundo_grau: 'default',
  tribunal_superior: 'outline',
};

/**
 * Componente que exibe badges dos graus ativos de um processo
 * Destaca o grau atual com estilo diferenciado
 */
export function GrauBadges({ instances }: GrauBadgesProps) {
  // Se não há instâncias, não renderiza nada (processo legado/não-unificado)
  if (!instances || instances.length === 0) {
    return null;
  }

  // Ordenar instâncias: primeiro grau, segundo grau, tribunal superior
  const instancesOrdenadas = [...instances].sort((a, b) => {
    const ordem: Record<GrauAcervo, number> = { primeiro_grau: 1, segundo_grau: 2, tribunal_superior: 3 };
    return ordem[a.grau] - ordem[b.grau];
  });

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {instancesOrdenadas.map((instance) => {
        const label = GRAU_LABELS[instance.grau];
        const variant = GRAU_VARIANTS[instance.grau];

        return (
          <TooltipProvider key={instance.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={variant}>
                  {label}
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
export function GrauBadgesSimple({ grausAtivos }: { grausAtivos?: GrauAcervo[] }) {
  if (!grausAtivos || grausAtivos.length === 0) {
    return null;
  }

  // Ordenar graus: primeiro grau, segundo grau, tribunal superior
  const grausOrdenados = [...grausAtivos].sort((a, b) => {
    const ordem: Record<GrauAcervo, number> = { primeiro_grau: 1, segundo_grau: 2, tribunal_superior: 3 };
    return ordem[a] - ordem[b];
  });

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {grausOrdenados.map((grau) => {
        const label = GRAU_LABELS[grau];
        const variant = GRAU_VARIANTS[grau];

        return (
          <Badge
            key={grau}
            variant={variant}
            className="text-xs"
          >
            {label}
          </Badge>
        );
      })}
    </div>
  );
}
