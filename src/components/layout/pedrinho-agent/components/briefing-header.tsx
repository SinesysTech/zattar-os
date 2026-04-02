'use client'

import { Clock, SquarePen, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { ThreadEntry } from '../hooks/use-thread-history'

interface BriefingHeaderProps {
  moduleLabel: string
  threads: ThreadEntry[]
  activeThreadId: string
  onNewThread: () => void
  onSwitchThread: (threadId: string) => void
  onDeleteThread: (threadId: string) => void
  onClose: () => void
}

export function BriefingHeader({
  moduleLabel,
  threads,
  activeThreadId,
  onNewThread,
  onSwitchThread,
  onDeleteThread,
  onClose,
}: BriefingHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3',
        'border-b border-border/20 dark:border-border/10'
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'size-8 rounded-xl flex items-center justify-center',
            'bg-linear-to-br from-primary/25 to-primary/10',
            'border border-primary/20'
          )}
        >
          <span className="flex gap-1">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="size-1.5 rounded-full bg-primary" />
          </span>
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-foreground leading-tight">Pedrinho</h2>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{moduleLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        {/* Thread history */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="Histórico de conversas"
              className={cn(
                'size-7 rounded-lg flex items-center justify-center',
                'text-muted-foreground/60 hover:text-foreground/80',
                'hover:bg-muted/60 dark:hover:bg-white/8',
                'transition-colors duration-150 cursor-pointer'
              )}
              title="Histórico de conversas"
            >
              <Clock className="size-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            className="w-64 p-0"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/10">
              <span className="text-[11px] font-medium text-muted-foreground">Conversas</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewThread}
                className="h-6 px-2 text-[11px] gap-1"
              >
                <SquarePen className="size-3" />
                Nova
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto scrollbar-macos">
              {threads.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/50 px-3 py-4 text-center">
                  Nenhuma conversa ainda
                </p>
              ) : (
                threads.map((thread) => (
                  <div
                    key={thread.id}
                    className={cn(
                      'group/thread flex items-center gap-2 px-3 py-2 cursor-pointer',
                      'hover:bg-muted/50 dark:hover:bg-white/4',
                      'transition-colors duration-100',
                      thread.id === activeThreadId && 'bg-muted/40 dark:bg-white/3'
                    )}
                    onClick={() => onSwitchThread(thread.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-[12px] truncate',
                          thread.id === activeThreadId
                            ? 'text-foreground font-medium'
                            : 'text-foreground/70'
                        )}
                      >
                        {thread.title}
                      </p>
                      <p className="text-[9px] text-muted-foreground/40">
                        {formatRelativeDate(thread.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteThread(thread.id)
                      }}
                      aria-label={`Excluir conversa ${thread.title}`}
                      className={cn(
                        'size-5 rounded flex items-center justify-center shrink-0',
                        'text-muted-foreground/30 hover:text-destructive',
                        'hover:bg-destructive/8',
                        'opacity-0 group-hover/thread:opacity-100 focus-visible:opacity-100',
                        'transition-all duration-150 cursor-pointer'
                      )}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* New thread */}
        <button
          onClick={onNewThread}
          aria-label="Nova conversa"
          className={cn(
            'size-7 rounded-lg flex items-center justify-center',
            'text-muted-foreground/60 hover:text-foreground/80',
            'hover:bg-muted/60 dark:hover:bg-white/8',
            'transition-colors duration-150 cursor-pointer'
          )}
          title="Nova conversa"
        >
          <SquarePen className="size-3.5" />
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Fechar painel"
          className={cn(
            'size-7 rounded-lg flex items-center justify-center',
            'text-muted-foreground/60 hover:text-foreground/80',
            'hover:bg-muted/60 dark:hover:bg-white/8',
            'transition-colors duration-150 cursor-pointer'
          )}
          title="Fechar (Esc)"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `${diffMin}min atrás`
  if (diffH < 24) return `${diffH}h atrás`
  if (diffD < 7) return `${diffD}d atrás`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
