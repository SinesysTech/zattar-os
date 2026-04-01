'use client'

import { useCallback, useEffect } from 'react'
import { CommandBar } from './command-bar'
import { BriefingPanel } from './briefing-panel'

export type PedrinhoMode = 'orb' | 'command' | 'briefing'

interface PedrinhoAgentProps {
  userId: string
  mode: PedrinhoMode
  onModeChange: (mode: PedrinhoMode) => void
}

export function PedrinhoAgent({ userId, mode, onModeChange }: PedrinhoAgentProps) {
  // Keyboard shortcuts: Cmd+J = Command Bar, Cmd+Shift+J = Briefing Panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        if (e.shiftKey) {
          onModeChange(mode === 'briefing' ? 'orb' : 'briefing')
        } else {
          onModeChange(mode === 'command' ? 'orb' : 'command')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, onModeChange])

  const handleCloseToOrb = useCallback(() => onModeChange('orb'), [onModeChange])
  const handleOpenBriefing = useCallback(() => onModeChange('briefing'), [onModeChange])

  // O toggle do Pedrinho agora vive na DashboardHeader (PedrinhoHeaderToggle).
  // Aqui renderizamos apenas CommandBar e BriefingPanel.
  return (
    <>
      {/* Command Bar */}
      {mode === 'command' && (
        <CommandBar
          onClose={handleCloseToOrb}
          onExpandToBriefing={handleOpenBriefing}
        />
      )}

      {/* Briefing Panel — slides from right, pushes main content */}
      {mode === 'briefing' && (
        <BriefingPanel
          onClose={handleCloseToOrb}
          onMinimize={handleCloseToOrb}
          threadId={`user-${userId}`}
        />
      )}
    </>
  )
}
