'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { LogIn, LogOut, RefreshCw, Clock, Monitor, MapPin } from 'lucide-react';
import { actionBuscarAuthLogs } from '../../actions/auth-logs-actions';
import type { AuthLogEntry } from '../../repository-auth-logs';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuthLogsTimelineProps {
  usuarioId: number;
}

const EVENT_ICONS = {
  user_signedin: LogIn,
  user_signedout: LogOut,
  token_refreshed: RefreshCw,
  other: Clock,
} as const;

const EVENT_LABELS = {
  user_signedin: 'Login realizado',
  user_signedout: 'Logout realizado',
  token_refreshed: 'Sessão renovada',
  other: 'Evento de autenticação',
} as const;

const EVENT_COLORS = {
  user_signedin: 'text-green-600 dark:text-green-400',
  user_signedout: 'text-orange-600 dark:text-orange-400',
  token_refreshed: 'text-blue-600 dark:text-blue-400',
  other: 'text-muted-foreground',
} as const;

/**
 * Simplifica o user agent para exibir apenas navegador e SO
 */
function simplifyUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Desconhecido';

  // Detectar navegador
  let browser = 'Navegador';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  // Detectar SO
  let os = '';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  return os ? `${browser} • ${os}` : browser;
}

export function AuthLogsTimeline({ usuarioId }: AuthLogsTimelineProps) {
  const [logs, setLogs] = useState<AuthLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      setIsLoading(true);
      setError(null);

      const result = await actionBuscarAuthLogs(usuarioId);

      if (!result.success) {
        setError(result.error || 'Erro ao carregar logs');
      } else {
        setLogs(result.data || []);
      }

      setIsLoading(false);
    }

    loadLogs();
  }, [usuarioId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Acesso
        </CardTitle>
        <CardDescription>
          Sessões de login registradas pelo sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        {!error && logs.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clock className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Nenhum log de acesso</EmptyTitle>
              <EmptyDescription>
                Este usuário ainda não possui registros de autenticação ou não possui conta vinculada.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {!error && logs.length > 0 && (
          <div className="relative">
            {/* Linha vertical da timeline */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6">
              {logs.map((log, index) => {
                const Icon = EVENT_ICONS[log.eventType];
                const label = EVENT_LABELS[log.eventType];
                const colorClass = EVENT_COLORS[log.eventType];

                return (
                  <div key={index} className="relative flex gap-4">
                    {/* Ícone do evento */}
                    <div
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background border-2 ${colorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 pb-6">
                      <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className={`font-medium ${colorClass}`}>{label}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(log.timestamp), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {log.ipAddress && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>IP: {log.ipAddress}</span>
                            </div>
                          )}
                          {log.userAgent && (
                            <div className="flex items-center gap-2">
                              <Monitor className="h-3.5 w-3.5" />
                              <span>{simplifyUserAgent(log.userAgent)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
