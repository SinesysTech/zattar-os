'use client'

import { useCallback, useEffect, useRef } from 'react'
import { CopilotChat } from '@copilotkit/react-core/v2'
import { useAgent } from '@copilotkit/react-core/v2'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { useBreakpointBelow } from '@/hooks/use-breakpoint'
import { usePanelResize } from './hooks/use-panel-resize'
import { BriefingHeader } from './components/briefing-header'
import { BriefingInput } from './components/briefing-input'
import type { MultimodalRequest } from './types'

interface BriefingPanelProps {
  onClose: () => void
  onMinimize: () => void
  onWidthChange?: (width: number) => void
  threadId?: string
}

export function BriefingPanel({ onClose, onMinimize, onWidthChange, threadId }: BriefingPanelProps) {
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)
  const moduleLabel = getModuleLabel(pathname || '')
  const isMobile = useBreakpointBelow('md')
  const { agent } = useAgent()

  const { width, isResizing, handleMouseDown } = usePanelResize(onWidthChange)
  const panelWidth = isMobile ? '100vw' : width

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Notify parent of width on mount and changes
  useEffect(() => {
    if (!isMobile) onWidthChange?.(width)
  }, [width, isMobile, onWidthChange])

  // --- Message Handlers ---

  const handleSendText = useCallback(
    async (text: string) => {
      if (!text.trim() || agent.isRunning) return
      agent.addMessage({
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: text.trim(),
      })
      try {
        await agent.runAgent()
      } catch {
        // Agent handles errors internally
      }
    },
    [agent]
  )

  const handleSendMultimodal = useCallback(
    async (request: MultimodalRequest) => {
      if (agent.isRunning) return

      // Show user message in chat
      const userContent = request.text || 'Enviou anexo(s)'
      agent.addMessage({
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: userContent,
      })

      // Call multimodal API
      try {
        const response = await fetch('/api/pedrinho/multimodal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })

        const data = await response.json()

        if (data.error) {
          agent.addMessage({
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: `Erro: ${data.error}`,
          })
          return
        }

        agent.addMessage({
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: data.content,
        })
      } catch {
        agent.addMessage({
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: 'Erro ao processar os anexos. Tente novamente.',
        })
      }
    },
    [agent]
  )

  const handleStopAgent = useCallback(() => {
    agent.abortRun()
  }, [agent])

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed top-0 right-0 z-40 h-full',
        'flex flex-col',
        'bg-card border-l border-border/12',
        'shadow-[-4px_0_24px_rgba(0,0,0,0.04)]',
        'dark:bg-card/95 dark:backdrop-blur-2xl dark:border-border/6',
        'dark:shadow-[-8px_0_32px_rgba(0,0,0,0.2)]',
        'animate-in slide-in-from-right duration-300 ease-out',
        isResizing && 'transition-none [&_.copilotKitChat]:pointer-events-none'
      )}
      style={{ width: panelWidth }}
    >
      {/* Resize handle — left edge (hidden on mobile) */}
      {!isMobile && (
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1.5 z-50',
            'cursor-col-resize group/resize',
            'hover:bg-primary/10 active:bg-primary/15',
            'transition-colors duration-150'
          )}
          title="Arrastar para redimensionar"
        >
          <div
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2',
              'w-1 h-12 rounded-full',
              'bg-border/0 group-hover/resize:bg-primary/30',
              'transition-all duration-200'
            )}
          />
        </div>
      )}

      {/* Header */}
      <BriefingHeader moduleLabel={moduleLabel} onMinimize={onMinimize} onClose={onClose} />

      {/* Chat messages — CopilotChat with hidden input */}
      <div className="flex-1 min-h-0 pedrinho-chat-wrapper">
        <CopilotChat
          threadId={threadId}
          labels={{
            modalHeaderTitle: 'Pedrinho',
            welcomeMessageText: 'Olá! Como posso ajudar? Envie textos, imagens, documentos ou grave áudios.',
            chatInputPlaceholder: 'Mensagem...',
            chatDisclaimerText: '',
          }}
          className="pedrinho-chat h-full"
        />
      </div>

      {/* Custom input with multimodal support */}
      <BriefingInput
        onSendText={handleSendText}
        onSendMultimodal={handleSendMultimodal}
        onStopAgent={handleStopAgent}
        isAgentRunning={agent.isRunning}
        threadId={threadId}
      />

      {/* Mobile close hint */}
      {isMobile && (
        <div className="flex justify-center py-1.5 border-t border-border/6">
          <span className="text-[10px] text-muted-foreground/40">Deslize para direita para fechar</span>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  processos: 'Processos',
  audiencias: 'Audiências',
  expedientes: 'Expedientes',
  financeiro: 'Financeiro',
  tarefas: 'Tarefas',
  contratos: 'Contratos',
  partes: 'Partes & Clientes',
  documentos: 'Documentos',
  chat: 'Comunicação',
  rh: 'Recursos Humanos',
  agenda: 'Agenda',
  pericias: 'Perícias',
}

function getModuleLabel(pathname: string): string {
  const match = pathname.match(/^\/app\/([^/]+)/)
  if (!match) return 'Geral'
  return MODULE_LABELS[match[1]] || match[1]
}
