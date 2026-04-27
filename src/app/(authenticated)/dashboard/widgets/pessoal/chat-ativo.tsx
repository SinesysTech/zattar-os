'use client';

import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';
import { WidgetContainer } from '../primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export function WidgetChatAtivo() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  const chat = data?.chatResumo;
  const naoLidas = chat?.naoLidas ?? 0;
  const salasAtivas = chat?.salasAtivas ?? 0;
  const ultimaMsg = chat?.ultimaMensagem;

  const tempoRelativo = ultimaMsg
    ? formatDistanceToNow(new Date(ultimaMsg.tempo), {
        addSuffix: true,
        locale: ptBR,
      })
    : null;

  return (
    <WidgetContainer
      title="Chat"
      icon={MessageCircle}
      subtitle="Mensagens e salas ativas"
      depth={1}
    >
      {/* Contador de não lidas */}
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3 mb-4")}>
        <div className="relative">
          <div className="size-10 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
            <MessageCircle className="size-4 text-primary/50" />
          </div>
          {naoLidas > 0 && (
            <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "absolute -top-1 -right-1 size-4 rounded-full bg-primary text-[8px] font-bold text-background flex items-center justify-center tabular-nums")}>
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground/50">Não lidas</p>
          <p className={cn(/* design-system-escape: text-lg → migrar para <Text variant="body-lg">; font-bold → className de <Text>/<Heading> */ "text-lg font-bold tabular-nums")}>{naoLidas}</p>
        </div>
        <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex flex-col items-end gap-0.5")}>
          <span className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/60 uppercase tracking-wider")}>salas</span>
          <span className={cn(/* design-system-escape: text-base → migrar para <Text variant="body">; font-bold → className de <Text>/<Heading> */ "text-base font-bold tabular-nums")}>{salasAtivas}</span>
          <span className="text-[9px] text-muted-foreground/55">ativas</span>
        </div>
      </div>

      {/* Preview da última mensagem */}
      {ultimaMsg ? (
        <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "px-3 py-2.5 rounded-xl bg-foreground/3 border border-border/10")}>
          <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 mb-1")}>
            <div className="size-1.5 rounded-full bg-success/60" />
            <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[10px] font-semibold text-foreground/70")}>{ultimaMsg.autor}</span>
            <span className="text-[9px] text-muted-foreground/55 ml-auto tabular-nums">{tempoRelativo}</span>
          </div>
          <p className={cn(/* design-system-escape: leading-relaxed sem token DS */ "text-[10px] text-muted-foreground/55 leading-relaxed line-clamp-2")}>{ultimaMsg.preview}</p>
        </div>
      ) : (
        <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "px-3 py-2.5 rounded-xl bg-foreground/3 border border-border/10")}>
          <p className="text-[10px] text-muted-foreground/40 text-center">Nenhuma mensagem recente</p>
        </div>
      )}

      <div className={cn(/* design-system-escape: pt-2 padding direcional sem Inset equiv. */ "mt-3 pt-2 border-t border-border/10 flex items-center justify-between")}>
        <span className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/55 uppercase tracking-wider")}>
          {salasAtivas} salas — {naoLidas} pendentes
        </span>
        <Link
          href="/chat"
          className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[9px] text-primary/50 font-medium hover:text-primary/70 transition-colors cursor-pointer")}
        >
          ver todas
        </Link>
      </div>
    </WidgetContainer>
  );
}
