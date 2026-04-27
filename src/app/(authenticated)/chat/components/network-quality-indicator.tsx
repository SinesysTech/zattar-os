import { Wifi, WifiOff, WifiHigh, WifiLow } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface NetworkQualityIndicatorProps {
  quality: 'excellent' | 'good' | 'poor' | 'unknown';
  score: number;
  showLabel?: boolean;
  className?: string;
}

const NETWORK_QUALITY_COLOR: Record<NetworkQualityIndicatorProps['quality'], string> = {
  excellent: 'text-success',
  good: 'text-info',
  poor: 'text-destructive',
  unknown: 'text-muted-foreground',
};

export function NetworkQualityIndicator({
  quality,
  score,
  showLabel = false,
  className
}: NetworkQualityIndicatorProps) {

  const getQualityConfig = () => {
    switch (quality) {
      case 'excellent':
        return {
          icon: Wifi,
          color: NETWORK_QUALITY_COLOR.excellent,
          label: 'Conexão Excelente',
          description: 'Áudio e vídeo em alta qualidade'
        };
      case 'good':
        return {
          icon: WifiHigh,
          color: NETWORK_QUALITY_COLOR.good,
          label: 'Conexão Boa',
          description: 'Pode haver pequenas instabilidades'
        };
      case 'poor':
        return {
          icon: WifiLow,
          color: NETWORK_QUALITY_COLOR.poor,
          label: 'Conexão Instável',
          description: 'Recomendado desativar vídeo'
        };
      case 'unknown':
      default:
        return {
          icon: WifiOff,
          color: NETWORK_QUALITY_COLOR.unknown,
          label: 'Verificando conexão...',
          description: 'Aguardando dados da rede'
        };
    }
  };

  const config = getQualityConfig();
  const Icon = config.icon;

  if (quality === 'unknown' && score === -1) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 cursor-help", className)}>
            <Icon 
              className={cn(
                "w-5 h-5 transition-colors duration-300", 
                config.color,
                quality === 'poor' && "animate-pulse"
              )} 
            />
            {showLabel && (
              <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading> */ "text-xs font-medium hidden md:inline-block", config.color)}>
                {config.label}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-col gap-1")}>
            <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "font-semibold")}>{config.label}</p>
            <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-muted-foreground")}>{config.description}</p>
            {score >= 0 && <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs opacity-70")}>Score: {score}/5</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
